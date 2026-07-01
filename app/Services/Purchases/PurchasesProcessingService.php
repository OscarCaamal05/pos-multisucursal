<?php

namespace App\Services;

use App\Models\purchases;
use App\Models\purchases_detail;
use App\Models\TempPurchase;
use App\Models\TempPurchaseDetail;
use App\Models\Supplier;
use App\Models\Product;
use App\Http\Controllers\TempPurchaseController;
use Illuminate\Support\Facades\DB;

class PurchaseProcessingService
{
    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
    ) {}

    public function process(array $data, string $method, int $tempId, int $userId, string $date): array
    {
        DB::beginTransaction();

        $tempPurchase = TempPurchase::where('id_temp_purchase', $tempId)
            ->where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$tempPurchase) {
            throw new \Exception('No se encontró una compra temporal válida para procesar.');
        }

        $tempDetails = TempPurchaseDetail::where('temp_purchase_id', $tempId)->get();

        if ($tempDetails->isEmpty()) {
            throw new \Exception('No hay productos registrados en esta compra.');
        }

        $totals = $this->totalsService->calculate($tempDetails, $tempPurchase->discount ?? 0);

        $amountPaid = $this->resolveAmountPaid($method, $data);

        $purchase = purchases::create([
            'user_id'        => $userId,
            'supplier_id'    => $data['id_supplier'],
            'voucher_id'     => $data['id_voucher'],
            'document_id'    => $data['id_document'],
            'purchase_date'  => $date,
            'invoice_number' => $data['invoice_number'],
            'amount_paid'    => $amountPaid,
            'subtotal'       => $totals['total_siva'],
            'discount'       => $totals['discount'],
            'tax'            => $totals['tax'],
            'total_amount'   => $totals['total'],
            'status'         => 'procesado',
            'is_fully_paid'  => $method !== 'payment-credit',
            'notes'          => $data['notes'] ?? null,
        ]);

        $this->registerPayments($purchase->id, $method, $data, $totals);

        foreach ($tempDetails as $tempDetail) {
            $quantity = (float) $tempDetail->quantity * (float) $tempDetail->factor;

            purchases_detail::create([
                'purchase_id'  => $purchase->id,
                'product_id'   => (int) $tempDetail->product_id,
                'product_name' => $tempDetail->product_name,
                'product_code' => $tempDetail->barcode,
                'quantity'     => (float) $tempDetail->quantity,
                'unit_cost'    => (float) $tempDetail->purchase_price,
                'discount'     => (float) $tempDetail->discount,
                'subtotal'     => (float) $tempDetail->quantity * (float) $tempDetail->purchase_price,
                'total'        => (float) $tempDetail->total,
            ]);

            Product::where('id', $tempDetail->product_id)->update([
                'sale_price_1'      => $tempDetail->new_sale_price_1 > 0 ? $tempDetail->new_sale_price_1 : DB::raw('sale_price_1'),
                'sale_price_2'      => $tempDetail->new_sale_price_2 > 0 ? $tempDetail->new_sale_price_2 : DB::raw('sale_price_2'),
                'sale_price_3'      => $tempDetail->new_sale_price_3 > 0 ? $tempDetail->new_sale_price_3 : DB::raw('sale_price_3'),
                'purchase_price'    => $tempDetail->purchase_price > 0 ? $tempDetail->purchase_price : DB::raw('purchase_price'),
                'unit_price'        => $tempDetail->unit_price > 0 ? $tempDetail->unit_price : DB::raw('unit_price'),
                'conversion_factor' => $tempDetail->factor > 0 ? $tempDetail->factor : DB::raw('conversion_factor'),
            ]);

            $this->inventoryService->updateProductStock($tempDetail->product_id, $quantity);

            $this->inventoryService->registerInventoryMovement(
                $tempDetail->product_id,
                $tempDetail->quantity,
                $tempDetail->purchase_price,
                $tempDetail->unit_price,
                $tempDetail->total,
                'entrada',
                'compra',
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

    private function resolveAmountPaid(string $method, array $data): float
    {
        return match ($method) {
            'payment-box'    => (float) ($data['amount_paid'] ?? 0),
            'payment-credit' => (float) ($data['credit_details']['current_credit'] ?? 0),
            default          => 0.0,
        };
    }

    private function registerPayments(int $purchaseId, string $method, array $data, array $totals): void
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
                $supplier->credit_balance    += $totals['total'];
                $supplier->credit_due_date    = $dueDate;
                $supplier->payment_days_granted = $creditDays;
                $supplier->credit_available   = max(0, $supplier->credit_limit_granted - $totals['total']);
                $supplier->save();
            }
        }
    }
}