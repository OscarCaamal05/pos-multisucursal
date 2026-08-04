<?php

namespace App\Services\Purchases;

use App\Models\purchases;
use App\Models\purchases_detail;
use App\Models\TempPurchase;
use App\Models\TempPurchaseDetail;
use App\Models\Supplier;
use App\Models\Product;
use App\Http\Controllers\TempPurchaseController;
use App\Services\InventoryService;
use App\Services\TotalsCalculatorService;
use Illuminate\Support\Facades\DB;

class PurchasesProcessingService
{
    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
    ) {}

    public function process(array $data, string $method, int $tempId, string $date): array
    {
        DB::beginTransaction();

        $tempPurchase = TempPurchase::where('id_temp_purchase', $tempId)
            ->where('user_id', auth()->id())
            ->where('status', 'abierta')
            ->first();

        if (!$tempPurchase) {
            throw new \Exception('No se encontró una compra temporal válida para procesar.');
        }

        $tempDetails = TempPurchaseDetail::where('temp_purchase_id', $tempId)->get();

        if ($tempDetails->isEmpty()) {
            throw new \Exception('No hay productos registrados en esta compra.');
        }

        $totals = $this->totalsService->calculateTotals($tempDetails, $tempPurchase->discount ?? 0);

        // Obtiene el branch_id de la tabla branches basado en el id vinculado con el usuario
        $branchId = auth()->user()->defaultBranchId() ?? 1; // Cambiar a 1 si no se encuentra un branch_id

        $purchase = purchases::create([
            'user_id'        => auth()->id(),
            'supplier_id'    => $data['id_supplier'],
            'voucher_id'     => $data['id_voucher'],
            'document_id'    => $data['id_document'],
            'purchase_date'  => $date,
            'invoice_number' => $data['invoice_number'],
            'amount_paid'    => $data['amount_paid'] ?? 0,
            'subtotal'       => $totals['total_siva'],
            'discount'       => $totals['discount'],
            'tax'            => $totals['tax'],
            'total_amount'   => $totals['total'],
            'status'         => 'procesado',
            'is_fully_paid'  => $method !== 'payment-credit',
            'notes'          => $data['notes'] ?? null,
        ]);

        $this->registerPayment($purchase->id, $method, $data, $data['totals'] ?? $totals);

        foreach ($tempDetails as $tempDetail) {

            // Calcula la cantidad total considerando el factor de conversión para actualizar el stock correctamente
            $inventoryQuantity = (float) $tempDetail->quantity * (float) $tempDetail->factor;

            $product = Product::find($tempDetail->product_id);

            if (!$product) {
                DB::rollBack();
                throw new \Exception('Producto no encontrado: ' . $tempDetail->product_id);
            }

            purchases_detail::create([
                'purchase_id'  => $purchase->id,
                'product_id'   => (int) $tempDetail->product_id,
                'product_name' => $tempDetail->product_name,
                'product_code' => $tempDetail->barcode,
                'quantity'     => (float) $tempDetail->quantity,
                'unit_cost'    => (float) $tempDetail->purchase_price,
                'discount'     => (float) $tempDetail->discount,
                'subtotal'     => (float) ($tempDetail->total ?? 0) - (float) ($tempDetail->discount ?? 0),
                'total'        => (float) $tempDetail->total,
            ]);

            // Actualizando los precios del producto solo si los nuevos precios son mayores a cero, de lo contrario se mantiene el precio actual
            Product::where('id', $tempDetail->product_id)->update([
                'sale_price_1'      => $tempDetail->new_sale_price_1 > 0 ? $tempDetail->new_sale_price_1 : DB::raw('sale_price_1'),
                'sale_price_2'      => $tempDetail->new_sale_price_2 > 0 ? $tempDetail->new_sale_price_2 : DB::raw('sale_price_2'),
                'sale_price_3'      => $tempDetail->new_sale_price_3 > 0 ? $tempDetail->new_sale_price_3 : DB::raw('sale_price_3'),
                'purchase_price'    => $tempDetail->purchase_price > 0 ? $tempDetail->purchase_price : DB::raw('purchase_price'),
                'unit_price'        => $tempDetail->unit_price > 0 ? $tempDetail->unit_price : DB::raw('unit_price'),
                'conversion_factor' => $tempDetail->factor > 0 ? $tempDetail->factor : DB::raw('conversion_factor'),
            ]);

            $this->inventoryService->updateProductStock(
                $tempDetail->product_id,
                $inventoryQuantity,
                'add'
            );

            $this->inventoryService->registerInventoryMovement(
                $tempDetail->product_id,
                $tempDetail->quantity,
                $tempDetail->purchase_price,
                $tempDetail->unit_price,
                $tempDetail->total,
                'entrada',
                'compra',
                $branchId,
                $purchase->id
            );
        }

        TempPurchaseDetail::where('temp_purchase_id', $tempPurchase->id_temp_purchase)->delete();
        $tempPurchase->delete();

        $newTemp = (new TempPurchaseController())->getOrCreateTempPurchase()->getData();

        DB::commit();

        return [
            'purchase_id'        => $purchase->id,
            'new_temp_purchase_id' => $newTemp->temp->id_temp_purchase,
        ];
    }

    private function registerPayment(int $purchaseId, string $method, array $data, array $totals): void
    {
        if ($method === 'payment-box') {
            foreach ($data['payment_details'] as $type => $amount) {
                if ((float) $amount > 0) {
                    DB::table('payment_methods')->insert([
                        'transaction_id'   => $purchaseId,
                        'transaction_type' => 'purchase',
                        'payment_method'   => $type,
                        'amount'           => $amount,
                        'reference'        => $data['reference'] ?? null,
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ]);
                }
            }
            return;
        }

        if ($method === 'payment-credit') {
            $creditAmount = $data['credit_details']['current_credit'] ?? 0;
            $creditDays   = $data['credit_details']['credit_days'] ?? 0;
            $dueDate      = $data['credit_details']['due_date'] ?? null;

            DB::table('payment_methods')->insert([
                'transaction_id'   => $purchaseId,
                'transaction_type' => 'purchase',
                'payment_method'   => 'credito',
                'amount'           => $creditAmount,
                'reference'        => "Crédito {$creditDays} días - Vence: {$dueDate}",
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $supplier = Supplier::find($data['id_supplier']);
            if ($supplier) {
                $supplier->credit_balance    += $creditAmount;
                $supplier->credit_due_date    = $dueDate;
                $supplier->payment_days_granted = $creditDays;
                $supplier->credit_available   -= $creditAmount;
                $supplier->save();
            }
        }
    }
}
