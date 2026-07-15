<?php

namespace App\Services;

use App\Models\BranchInventories;
use Illuminate\Support\Facades\DB;

class InventoryService
{

    public function updateProductStock(int $productId, float $quantity, string $operation = 'add'): void
    {
        $inventory = BranchInventories::where('product_id', $productId)->first();
        if ($inventory) {
            if ($operation === 'add') {
                // Si el stock actual es negativo, partir desde 0 antes de sumar
                $base = max(0, $inventory->quantity);
                $inventory->quantity = $base + $quantity;
                $inventory->save();
            } elseif ($operation === 'subtract') {
                $inventory->quantity = max(0, $inventory->quantity - $quantity);
                $inventory->save();
            }
        }
    }

    public function registerInventoryMovement(int $productId, float $quantity, float $unitPurchasePrice, float $unitSalePrice, float $totalCost, string $movementType, string $movementReason, int $branchId, int $referenceId): void
    {
        DB::table('kardex')->insert([
            'product_id'          => $productId,
            'branch_id'           => $branchId,  // cambiar por branch_id dinámico si es necesario
            'movement_type'       => $movementType, // o 'salida' según corresponda
            'movement_reason'     => $movementReason, // o 'Compra' según corresponda
            'reference_type'      => null,
            'reference_id'        => $referenceId,
            'quantity'            => $quantity,
            'unit_purchase_price' => $unitPurchasePrice,
            'unit_sale_price'     => $unitSalePrice,
            'total_cost'          => $totalCost,
            'balance_quantity'    => $this->getCurrentStock($productId, $quantity),
            'balance_unit_cost'   => $unitPurchasePrice,
            'balance_total_cost'  => $this->calculateBalanceTotalCost($productId, $quantity, $totalCost),
            'movement_date'       => now(),
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);
    }

    private function getCurrentStock(int $productId, float $quantity): float
    {
        $currentStock = BranchInventories::where('product_id', $productId)->first();
        return $currentStock ? $currentStock->quantity + $quantity : $quantity; // Suma para entradas, resta para salidas
    }

    private function calculateBalanceTotalCost(int $productId, float $newQuantity, float $newTotalCost): float
    {
        $lastEntry = DB::table('kardex')
            ->where('product_id', $productId)
            ->orderByDesc('id')
            ->first();

        if (!$lastEntry) {
            return $newTotalCost;
        }

        $previousBalance = $lastEntry->balance_total_cost ?? 0;
        $previousQuantity = $lastEntry->balance_quantity ?? 0;

        $totalQuantity = $previousQuantity + $newQuantity;
        $totalCost = $previousBalance + $newTotalCost;

        return $totalQuantity > 0 ? $totalCost : 0;
    }
}
