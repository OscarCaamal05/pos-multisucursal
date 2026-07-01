<?php

namespace App\Services;

use Illuminate\Support\Collection;

class TotalsCalculatorService
{
    /**
     * Calcula el total sumando los subtotales de cada detalle.
     *
     * @param \Illuminate\Support\Collection $details Una colección de detalles de venta, cada uno con un campo 'total'.
     * @param float $discount Descuento a aplicar sobre el total.
     * @return array El total calculado y el total con descuento.
     */

    private int $iva = 16;
    public function calculateTotals(Collection $details, float $discount = 0.0): array
    {
        $sub_total = round($details->sum('total'), 2);

        $discount_applied = round($discount, 2);
        $sub_total_discount = round($sub_total - $discount_applied, 2);

        $tax = round($sub_total_discount * ($this->iva / 100), 2);
        $total_siva = round($sub_total_discount - $tax, 2);
        $total = round($total_siva + $tax, 2);

        return [
            'sub_total'          => $sub_total,
            'discount'           => $discount_applied,
            'sub_total_discount' => $sub_total_discount,
            'tax'                => $tax,
            'total_siva'         => $total_siva,
            'total'              => $total,
        ];
    }
}
