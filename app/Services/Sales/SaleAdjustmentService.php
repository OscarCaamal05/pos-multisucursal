<?php

namespace App\Services\Sales;

use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Support\Facades\DB;
use App\Services\InventoryService;

class SaleAdjustmentService
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function annul(Sale $sale): Sale
    {
        if ($sale->status === 'anulado') {
            throw new \Exception('La venta ya ha sido anulada.');
        }

        DB::transaction(function () use ($sale) {
            foreach ($sale->details as $detail) {
                $this->inventoryService->updateProductStock(
                    $detail->product_id,
                    $detail->quantity,
                    'add' // revierte lo que se restó al vender
                );
                $this->inventoryService->registerInventoryMovement(
                    $detail->product_id,
                    $detail->quantity,
                    $detail->product->purchase_price ?? 0,
                    $detail->unit_price,
                    $detail->total,
                    'ajuste',
                    'Anulación de venta',
                    $sale->branch_id,
                    $sale->id
                );
            }
            $this->reversePayments($sale, $sale->payments->sum('amount'));
            $sale->update(['status' => 'anulado']);
        });
        return $sale->fresh(['details', 'customer', 'payments']); // Devuelve la venta actualizada con los detalles cargados
    }

    public function returnProduct(Sale $sale, SaleDetail $detail, float $quantity): SaleDetail
    {
        // VALIDACIONES

        // Verificar que la venta no esté anulada
        if ($sale->status === 'anulado') {
            throw new \Exception('No se puede devolver un producto de una venta anulada.');
        }

        // Verificar que el detalle del producto pertenezca a la venta
        if ($detail->sale_id !== $sale->id) {
            throw new \Exception('El detalle no pertenece a esta venta.');
        }

        // Verificar que la cantidad a devolver sea válida
        $pending = $detail->quantity - $detail->returned_quantity;
        if ($quantity <= 0 || $quantity > $pending) {
            throw new \Exception('Cantidad de devolución inválida.');
        }

        return DB::transaction(function () use ($sale, $detail, $quantity) {
            $this->reverseDetailStock($sale, $detail, $quantity, 'Devolución de producto');

            $refundAmount = $quantity * $detail->unit_price;
            $this->reversePayments($sale, $refundAmount);

            return $detail->fresh();
        });
    }

    private function reverseDetailStock(Sale $sale, SaleDetail $detail, float $quantity, string $reason): void
    {
        $this->inventoryService->updateProductStock($detail->product_id, $quantity, 'add');

        $detail->returned_quantity += $quantity;

        if (round($detail->returned_quantity, 2) >= round($detail->quantity, 2)) {
            $detail->is_returned = true;
        }

        $detail->save();

        $this->inventoryService->registerInventoryMovement(
            $detail->product_id,
            $quantity,
            $detail->product->purchase_price ?? 0,
            $detail->unit_price,
            $quantity * $detail->unit_price,
            'entrada',
            $reason,
            $sale->branch_id,
            $sale->id
        );
    }

    private function reversePayments(Sale $sale, float $amount): void
    {
        $totalPaid = $sale->payments->sum('amount');

        if ($totalPaid <= 0 || $amount <= 0) {
            return;
        }

        // 1) Si hubo pago a crédito, revierte proporcionalmente el crédito del cliente (no genera fila visible)
        $creditPayment = $sale->payments->firstWhere('payment_method', 'credito');
        if ($creditPayment && $sale->customer) {
            $creditProportion = $creditPayment->amount / $totalPaid;
            $creditToReverse = round($amount * $creditProportion, 2);

            if ($creditToReverse > 0) {
                $sale->customer->decrement('credit_used', $creditToReverse);
                $sale->customer->increment('credit_available', $creditToReverse);
                $amount -= $creditToReverse; // lo que resta se refleja como una sola fila de reembolso
            }
        }

        // 2) El resto (efectivo/tarjeta/transferencia/vale) se refleja en UNA sola línea
        if ($amount > 0) {
            DB::table('payment_methods')->insert([
                'transaction_id'   => $sale->id,
                'transaction_type' => 'sale',
                'payment_method'   => 'devolucion',
                'amount'           => -round($amount, 2),
                'reference'        => "Reverso por devolución - venta #{$sale->id}",
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }
    }
}
