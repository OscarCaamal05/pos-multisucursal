<?php

namespace App\Services\Sales;

use App\Models\TempSale;
use App\Models\TempSaleDetail;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Http\Controllers\TempSaleController;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;
use App\Services\TotalsCalculatorService;

class SalesProcessingService
{
    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
    ) {}

    public function process(array $data, string $method, int $tempId, string $date): array
    {
        DB::beginTransaction();

        $tempSale = TempSale::where('id_temp_sale', $tempId)
            ->where('user_id', auth()->id())
            ->where('status', 'abierta')
            ->first();

        if (!$tempSale) {
            DB::rollBack();
            return ['error' => 'No se encontró una venta temporal válida para procesar.'];
        }

        $tempDetails = TempSaleDetail::where('temp_sale_id', $tempId)->get();

        if ($tempDetails->isEmpty()) {
            DB::rollBack();
            throw new \Exception('No hay productos registrados en esta venta.');
        }

        $receipt = DB::table('types_receipts')
            ->where('id', $data['id_voucher'])
            ->lockForUpdate() // Bloquea el registro durante la transacción
            ->first();

        if (!$receipt) {
            DB::rollBack();
            throw new \Exception('Tipo de comprobante no encontrado.');
        }

        // Incrementa en la DB atómicamente
        DB::table('types_receipts')
            ->where('id', $data['id_voucher'])
            ->increment('current_number');

        // Usa el número actual para esta venta (antes del incremento)
        $invoiceNumber = $receipt->series_prefix . str_pad($receipt->current_number, 8, '0', STR_PAD_LEFT);

        $totals = $this->totalsService->calculateTotals($tempDetails, $tempSale->discount ?? 0);

        $sale = Sale::create([
            'user_id'        => auth()->id(),
            'customer_id'    => $data['id_customer'],
            'voucher_id'     => $data['id_voucher'],
            'document_id'    => $data['id_document'],
            'sale_date'      => $date,
            'invoice_number' => $invoiceNumber,
            'amount_paid'    => $data['amount_paid'] ?? 0,
            'subtotal'       => $totals['total_siva'],
            'discount'       => $totals['discount'],
            'tax'            => $totals['tax'],
            'total_amount'   => $totals['total'],
            'status'         => 'procesado',
            'is_fully_paid'  => $method !== 'payment-credit',
            'notes'          => $data['notes'] ?? null,
        ]);

        $this->registerPayment($sale->id, $method, $data, $data['total'] ?? 0);

        foreach ($tempDetails as $tempDetail) {
            $product = Product::find($tempDetail->product_id);

            if (!$product) {
                DB::rollBack();
                throw new \Exception('Producto no encontrado: ' . $tempDetail->product_id);
            }

            SaleDetail::create([
                'sale_id'       => $sale->id,
                'product_id'    => (int) $tempDetail->product_id,
                'product_name'  => $tempDetail->product_name,
                'product_code'  => $tempDetail->barcode,
                'unit_price'    => (float) ($tempDetail->price ?? 0),
                'quantity'      => (float) ($tempDetail->quantity ?? 0),
                'subtotal'      => (float) ($tempDetail->total ?? 0) - (float) ($tempDetail->discount ?? 0),
                'tax'           => (float) ($tempDetail->tax ?? 0),
                'discount'      => (float) ($tempDetail->discount ?? 0),
                'total'   => (float) ($tempDetail->total ?? 0),
            ]);

            $this->inventoryService->updateProductStock(
                $tempDetail->product_id,
                $tempDetail->quantity ?? 0,
                'subtract'
            );

            $this->inventoryService->registerInventoryMovement(
                $tempDetail->product_id,
                $tempDetail->quantity ?? 0,
                $product->purchase_price ?? 0,
                $tempDetail->price ?? 0,
                $tempDetail->total ?? 0,
                'salida',
                'venta',
                1, // Cambiar por branch_id dinámico si es necesario
                $sale->id
            );
        }
        // Delete the temporary sale details after processing
        TempSaleDetail::where('temp_sale_id', $tempSale->id_temp_sale)->delete();

        // Delete the temporary sale after processing
        $tempSale->delete();

        $newTemp = (new TempSaleController())->getOrCreateTempSale()->getData();
        DB::commit();

        return [
            'sale_id'        => $sale->id,
            'new_temp_sale_id' => $newTemp->temp->id_temp_sale ?? null,
        ];
    }
    /*
    private function resolveAmountPaid(string $method, array $data): float
    {
        return match ($method) {
            'payment-box'    => (float) ($data['amount_paid'] ?? 0),
            'payment-credit' => (float) ($data['credit_details']['current_credit'] ?? 0),
            default          => 0.0,
        };
    }*/

    private function registerPayment(int $saleId, string $method, array $data, float $totals): void
    {
        if ($method === 'payment-box') {
            foreach ($data['payment_details'] as $type => $amount) {
                if ((float) $amount > 0) {
                    DB::table('payment_methods')->insert([
                        'transaction_id' => $saleId,
                        'transaction_type' => 'sale',
                        'payment_method' => $type,
                        'amount' => (float) $amount,
                        'reference' => $data['reference'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            return;
        } elseif ($method === 'payment-credit') {
            $creditAmount = $data['credit_details']['current_credit'] ?? 0;
            $creditDays   = $data['credit_details']['credit_days'] ?? 0;
            $dueDate      = $data['credit_details']['due_date'] ?? null;

            DB::table('payment_methods')->insert([
                'transaction_id'   => $saleId,
                'transaction_type' => 'sale',
                'payment_method'   => 'credito',
                'amount'           => $creditAmount,
                'reference'        => "Crédito {$creditDays} días - Vence: {$dueDate}",
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $customer = Customer::find($data['id_customer']);
            if ($customer) {
                $customer->credit_used += $creditAmount;
                $customer->credit_available -= $creditAmount;
                $customer->credit_due_date = $dueDate;
                $customer->default_credit_days = $creditDays;
                $customer->save();
            }
        }
    }
}
