<?php

namespace App\Services\Reports;

use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Support\Collection;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SalesReportService
{
    // ✅ Método principal — reúne todo para la vista
    public function buildReport(int $branchId, string $dateFrom, string $dateTo): array
    {
        $sales = $this->getSales($branchId, $dateFrom, $dateTo);
        return [
            // Datos generales
            'sales'              => $sales,
            'dateFrom'           => Carbon::parse($dateFrom)->format('d/m/Y'),
            'dateTo'             => Carbon::parse($dateTo)->format('d/m/Y'),
            'generatedAt'        => now()->format('d/m/Y H:i'),

            // KPIs
            'totalSales'         => $sales->count(),
            'cashSales'          => $this->countCash($branchId, $dateFrom, $dateTo),
            'cashAmount'         => $this->sumCash($branchId, $dateFrom, $dateTo),
            'creditSales'        => $this->countCredit($branchId, $dateFrom, $dateTo),
            'creditAmount'       => $this->sumCredit($branchId, $dateFrom, $dateTo),
            'canceledSales'      => $this->countCanceled($branchId, $dateFrom, $dateTo),
            'canceledAmount'     => $this->sumCanceled($branchId, $dateFrom, $dateTo),

            // Ingresos y márgenes
            'totalRevenue'       => $sales->where('status', 'procesado')->sum('total_amount'),
            'totalCost'          => $this->getTotalCost($branchId, $dateFrom, $dateTo),
            'marginAmount'       => $this->getMargin($branchId, $dateFrom, $dateTo),
            'marginPct'          => $this->getMarginPct($branchId, $dateFrom, $dateTo),
            'avgTicket'          => $this->getAvgTicket($branchId, $dateFrom, $dateTo),

            // Distribución para la barra visual
            'pctCash'            => $this->getPct($branchId, $dateFrom, $dateTo, 'cash'),
            'pctCredit'          => $this->getPct($branchId, $dateFrom, $dateTo, 'credit'),
            'pctCanceled'        => $this->getPct($branchId, $dateFrom, $dateTo, 'canceled'),

            // Tablas de detalle
            'topProducts'        => $this->getTopProducts($branchId, $dateFrom, $dateTo),
            'monthlyComparison'  => $this->getMonthlyComparison($branchId, $dateFrom, $dateTo),
        ];
    }

    // ✅ Consulta principal con relaciones (sin repetir joins a mano)
    private function getSales(int $branchId, string $from, string $to): Collection
    {
        return Sale::with(['customer', 'voucher', 'payments'])
            ->byBranch($branchId)          // ✅ Scope del modelo
            ->byDateRange($from, $to)      // ✅ Scope del modelo
            ->orderBy('id', 'desc')
            ->get();
    }

    private function countCash(int $branchId, string $from, string $to): int
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->cash()->count();
    }

    private function sumCash(int $branchId, string $from, string $to): float
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->cash()->sum('total_amount');
    }

    private function countCredit(int $branchId, string $from, string $to): int
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->credit()->count();
    }

    private function sumCredit(int $branchId, string $from, string $to): float
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->credit()->sum('total_amount');
    }

    private function countCanceled(int $branchId, string $from, string $to): int
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->canceled()->count();
    }

    private function sumCanceled(int $branchId, string $from, string $to): float
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->canceled()->sum('total_amount');
    }

    private function getTotalCost(int $branchId, string $from, string $to): float
    {
        return SaleDetail::whereHas(
            'sale',
            fn($q) =>
            $q->byBranch($branchId)->byDateRange($from, $to)->processed()
        )->sum(\DB::raw('quantity * unit_price'));
    }

    private function getMargin(int $branchId, string $from, string $to): float
    {
        $revenue = $this->sumCash($branchId, $from, $to) + $this->sumCredit($branchId, $from, $to);
        $cost    = $this->getTotalCost($branchId, $from, $to);
        return $revenue - $cost;
    }

    private function getMarginPct(int $branchId, string $from, string $to): float
    {
        $revenue = $this->sumCash($branchId, $from, $to) + $this->sumCredit($branchId, $from, $to);
        if ($revenue == 0) return 0;
        return round(($this->getMargin($branchId, $from, $to) / $revenue) * 100, 2);
    }

    private function getAvgTicket(int $branchId, string $from, string $to): float
    {
        return Sale::byBranch($branchId)->byDateRange($from, $to)->processed()->avg('total_amount') ?? 0;
    }

    private function getPct(int $branchId, string $from, string $to, string $type): float
    {
        $total = Sale::byBranch($branchId)->byDateRange($from, $to)->count();
        if ($total == 0) return 0;

        $count = match ($type) {
            'cash'     => $this->countCash($branchId, $from, $to),
            'credit'   => $this->countCredit($branchId, $from, $to),
            'canceled' => $this->countCanceled($branchId, $from, $to),
            default    => 0,
        };

        return round(($count / $total) * 100, 1);
    }

    // ✅ Productos más vendidos usando la relación details
    private function getTopProducts(int $branchId, string $from, string $to): Collection
    {
        return SaleDetail::selectRaw('
                product_name,
                SUM(quantity)    as total_qty,
                SUM(total) as total_revenue
            ')
            ->whereHas(
                'sale',
                fn($q) =>
                $q->byBranch($branchId)->byDateRange($from, $to)->processed()
            )
            ->groupBy('product_name')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();
    }

    private function getMonthlyComparison(int $branchId, string $from, string $to): Collection
    {
        return Sale::selectRaw('
            YEAR(sale_date)  as year,
            MONTH(sale_date) as month,
            COUNT(*)                              as total_sales,
            SUM(total_amount)                     as revenue,
            SUM(CASE WHEN status = "anulado" THEN 1 ELSE 0 END) as canceled
        ')
            ->byBranch($branchId)
            ->processed()
            ->whereBetween('sale_date', [
                Carbon::parse($from)->subMonths(5)->startOfMonth(),
                Carbon::parse($to)->endOfMonth(),
            ])
            ->groupByRaw('YEAR(sale_date), MONTH(sale_date)')
            ->orderByRaw('YEAR(sale_date) ASC, MONTH(sale_date) ASC')
            ->get()
            ->map(function ($row) use ($branchId) {
                $cost   = $this->getTotalCostForMonth($branchId, $row->year, $row->month);
                $margin = $row->revenue - $cost;

                return (object) [
                    'label'       => Carbon::create($row->year, $row->month)->locale('es')->monthName . " {$row->year}",
                    'total_sales' => $row->total_sales,
                    'revenue'     => $row->revenue,
                    'cost'        => $cost,
                    'margin'      => $margin,
                    'margin_pct'  => $row->revenue > 0 ? round(($margin / $row->revenue) * 100, 2) : 0,
                    'canceled'    => $row->canceled,
                    'returns'     => 0, // pendiente: define cómo contabilizas devoluciones
                    'change_pct'  => 0,
                ];
            });
    }

    private function getTotalCostForMonth(int $branchId, int $year, int $month): float
    {
        return SaleDetail::whereHas(
            'sale',
            fn($q) =>
            $q->byBranch($branchId)->byMonth($year, $month)->processed()
        )->sum(\DB::raw('quantity * unit_price'));
    }
}
