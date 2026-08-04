<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte de Ventas</title>
    <style>
        /* ===== RESET Y BASE ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            background: #f8fafc;
        }

        /* ===== WRAPPER ===== */
        .report {
            width: 960px;
            margin: 0 auto;
            background: #fff;
        }

        /* ===== CABECERA DEL REPORTE ===== */
        .report-header {
            background: #0f172a;
            color: #fff;
            padding: 24px 30px 20px;
        }

        .report-header-grid {
            display: table;
            width: 100%;
        }

        .report-header-grid .col {
            display: table-cell;
            vertical-align: middle;
        }

        .report-header-grid .col-right {
            text-align: right;
            width: 35%;
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .report-business {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 3px;
        }

        .report-period {
            font-size: 13px;
            font-weight: bold;
            color: #38bdf8;
        }

        .report-generated {
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
        }

        /* ===== BARRA DE DISTRIBUCIÓN (elemento signature) ===== */
        .distribution-bar-section {
            background: #1e293b;
            padding: 14px 30px;
        }

        .distribution-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .distribution-bar {
            width: 100%;
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
            display: table;
        }

        .bar-cash {
            background: #10b981;
            display: table-cell;
            height: 10px;
        }

        .bar-credit {
            background: #38bdf8;
            display: table-cell;
            height: 10px;
        }

        .bar-canceled {
            background: #ef4444;
            display: table-cell;
            height: 10px;
        }

        .bar-returned {
            background: #f59e0b;
            display: table-cell;
            height: 10px;
        }

        .distribution-legend {
            display: table;
            width: 100%;
            margin-top: 6px;
        }

        .legend-item {
            display: table-cell;
            font-size: 9px;
            color: #94a3b8;
        }

        .legend-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
        }

        /* ===== SECCIÓN PRINCIPAL ===== */
        .report-body {
            padding: 24px 30px;
        }

        /* ===== TÍTULOS DE SECCIÓN ===== */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #64748b;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 5px;
            margin-bottom: 14px;
        }

        /* ===== GRID DE KPIs ===== */
        .kpi-grid {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-bottom: 24px;
        }

        .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 3px solid #0f172a;
            padding: 12px 10px;
            vertical-align: top;
            text-align: center;
        }

        .kpi-card.green {
            border-top-color: #10b981;
        }

        .kpi-card.blue {
            border-top-color: #38bdf8;
        }

        .kpi-card.red {
            border-top-color: #ef4444;
        }

        .kpi-card.amber {
            border-top-color: #f59e0b;
        }

        .kpi-card.purple {
            border-top-color: #8b5cf6;
        }

        .kpi-card.dark {
            border-top-color: #0f172a;
        }

        .kpi-value {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.2;
        }

        .kpi-value.green {
            color: #10b981;
        }

        .kpi-value.blue {
            color: #38bdf8;
        }

        .kpi-value.red {
            color: #ef4444;
        }

        .kpi-value.amber {
            color: #f59e0b;
        }

        .kpi-value.purple {
            color: #8b5cf6;
        }

        .kpi-label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 4px;
            line-height: 1.4;
        }

        .kpi-sub {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 4px;
        }

        /* ===== GRID DE DOS COLUMNAS ===== */
        .two-col {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }

        .two-col .col-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
            padding-right: 16px;
        }

        .two-col .col-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
        }

        /* ===== TABLAS ===== */
        table.report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        table.report-table thead tr {
            background: #0f172a;
            color: #fff;
        }

        table.report-table thead th {
            padding: 7px 10px;
            text-align: left;
            font-size: 9px;
            letter-spacing: 0.5px;
            font-weight: bold;
        }

        table.report-table thead th.text-right {
            text-align: right;
        }

        table.report-table thead th.text-center {
            text-align: center;
        }

        table.report-table tbody tr {
            border-bottom: 1px solid #f1f5f9;
        }

        table.report-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        table.report-table tbody td {
            padding: 6px 10px;
            color: #334155;
            vertical-align: middle;
        }

        table.report-table tbody td.text-right {
            text-align: right;
        }

        table.report-table tbody td.text-center {
            text-align: center;
        }

        table.report-table tfoot tr {
            background: #1e293b;
            color: #fff;
        }

        table.report-table tfoot td {
            padding: 7px 10px;
            font-weight: bold;
            font-size: 10px;
        }

        table.report-table tfoot td.text-right {
            text-align: right;
        }

        /* ===== BADGES ===== */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-contado {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-credito {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-anulada {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-devolucion {
            background: #fef3c7;
            color: #92400e;
        }

        /* ===== TABLA COMPARATIVA DE MESES ===== */
        table.compare-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        table.compare-table thead tr {
            background: #0f172a;
            color: #fff;
        }

        table.compare-table thead th {
            padding: 7px 10px;
            font-size: 9px;
            letter-spacing: 0.5px;
        }

        table.compare-table thead th.text-right {
            text-align: right;
        }

        table.compare-table tbody tr {
            border-bottom: 1px solid #f1f5f9;
        }

        table.compare-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        table.compare-table tbody td {
            padding: 7px 10px;
            color: #334155;
        }

        table.compare-table tbody td.text-right {
            text-align: right;
        }

        .trend-up {
            color: #10b981;
            font-weight: bold;
        }

        .trend-down {
            color: #ef4444;
            font-weight: bold;
        }

        .trend-flat {
            color: #94a3b8;
        }

        /* ===== MINI BARRA DE PROGRESO ===== */
        .mini-bar-bg {
            background: #e2e8f0;
            border-radius: 3px;
            height: 6px;
            width: 80px;
            display: inline-block;
            vertical-align: middle;
        }

        .mini-bar-fill {
            height: 6px;
            border-radius: 3px;
            background: #10b981;
            display: block;
        }

        .mini-bar-fill.red {
            background: #ef4444;
        }

        /* ===== RESUMEN DE MÁRGENES ===== */
        .margin-summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #8b5cf6;
            padding: 14px 16px;
            margin-bottom: 20px;
        }

        .margin-summary-title {
            font-size: 10px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .margin-row {
            display: table;
            width: 100%;
            margin-bottom: 4px;
        }

        .margin-row-label {
            display: table-cell;
            font-size: 10px;
            color: #64748b;
            width: 50%;
        }

        .margin-row-value {
            display: table-cell;
            font-size: 10px;
            font-weight: bold;
            text-align: right;
            color: #1e293b;
        }

        /* ===== FOOTER ===== */
        .report-footer {
            background: #f8fafc;
            border-top: 2px solid #e2e8f0;
            padding: 12px 30px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }

        /* ===== IMPRESIÓN ===== */
        @media print {
            @page {
                size: Letter landscape;
                margin: 10mm;
            }

            body {
                background: #fff;
            }

            .report {
                width: 100%;
            }

            .no-print {
                display: none !important;
            }

            table.report-table tbody tr:nth-child(even),
            table.compare-table tbody tr:nth-child(even) {
                background: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .report-header,
            table.report-table thead tr,
            table.compare-table thead tr,
            table.report-table tfoot tr,
            .distribution-bar-section,
            .kpi-card.green,
            .kpi-card.blue,
            .kpi-card.red,
            .kpi-card.amber,
            .kpi-card.purple {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>

    <div class="report">

        {{-- ===== CABECERA ===== --}}
        <div class="report-header">
            <table style="width:100%;">
                <tr>
                    <td>
                        <div class="report-title">Reporte General de Ventas</div>
                        <div class="report-business">{{ config('app.name') }}</div>
                    </td>
                    <td style="text-align:right; width:35%; vertical-align:middle;">
                        <div class="report-period">{{ $dateFrom }} — {{ $dateTo }}</div>
                        <div class="report-generated">Generado: {{ $generatedAt }}</div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ===== BARRA DE DISTRIBUCIÓN: da un vistazo inmediato de la composición de ventas ===== --}}
        <div class="distribution-bar-section">
            <div class="distribution-label">Distribución de ventas por tipo</div>

            <table style="width:100%; margin-top:6px;">
                <tr>
                    <td style="font-size:9px; color:#94a3b8;"><span class="legend-dot" style="background:#10b981;"></span>Contado {{ $pctCash }}%</td>
                    <td style="font-size:9px; color:#94a3b8;"><span class="legend-dot" style="background:#38bdf8;"></span>Crédito {{ $pctCredit }}%</td>
                    <td style="font-size:9px; color:#94a3b8;"><span class="legend-dot" style="background:#ef4444;"></span>Anuladas {{ $pctCanceled }}%</td>
                </tr>
            </table>
        </div>

        <div class="report-body">

            {{-- ===== KPIs PRINCIPALES ===== --}}
            <div class="section-title">Indicadores clave</div>
            <table style="width:100%; border-collapse:separate; border-spacing:8px 0; margin-bottom:24px;">
                <tr>
                    <td class="kpi-card dark">
                        <div class="kpi-value">{{ $totalSales }}</div>
                        <div class="kpi-label">Ventas totales</div>
                    </td>
                    <td class="kpi-card green">
                        <div class="kpi-value green">${{ number_format($cashAmount, 2) }}</div>
                        <div class="kpi-label">Contado</div>
                        <div class="kpi-sub">{{ $cashSales }} ventas</div>
                    </td>
                    <td class="kpi-card blue">
                        <div class="kpi-value blue">${{ number_format($creditAmount, 2) }}</div>
                        <div class="kpi-label">Crédito</div>
                        <div class="kpi-sub">{{ $creditSales }} ventas</div>
                    </td>
                    <td class="kpi-card red">
                        <div class="kpi-value red">${{ number_format($canceledAmount, 2) }}</div>
                        <div class="kpi-label">Anuladas</div>
                        <div class="kpi-sub">{{ $canceledSales }} ventas</div>
                    </td>
                    <td class="kpi-card amber">
                        <div class="kpi-value amber">${{ number_format($avgTicket, 2) }}</div>
                        <div class="kpi-label">Ticket promedio</div>
                    </td>
                    <td class="kpi-card purple">
                        <div class="kpi-value purple">{{ $marginPct }}%</div>
                        <div class="kpi-label">Margen</div>
                    </td>
                </tr>
            </table>

            {{-- ===== RESUMEN FINANCIERO: la pregunta de negocio "¿ganamos o perdimos?" ===== --}}
            <div class="margin-summary">
                <div class="margin-summary-title">Resumen financiero del periodo</div>
                <table style="width:100%;">
                    <tr>
                        <td style="font-size:10px; color:#64748b;">Ingresos totales</td>
                        <td style="font-size:10px; font-weight:bold; text-align:right; color:#1e293b;">${{ number_format($totalRevenue, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:10px; color:#64748b;">Costo de lo vendido</td>
                        <td style="font-size:10px; font-weight:bold; text-align:right; color:#ef4444;">-${{ number_format($totalCost, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:10px; color:#64748b;">Margen bruto</td>
                        <td style="font-size:10px; font-weight:bold; text-align:right; color:#10b981;">${{ number_format($marginAmount, 2) }} ({{ $marginPct }}%)</td>
                    </tr>
                </table>
            </div>

            {{-- ===== TOP PRODUCTOS: qué mover / qué reabastecer ===== --}}
            <div class="section-title">Top 10 productos más vendidos</div>
            <table class="report-table" style="margin-bottom: 24px;">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-right">Cantidad vendida</th>
                        <th class="text-right">Ingresos generados</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($topProducts as $product)
                    <tr>
                        <td>{{ $product->product_name }}</td>
                        <td class="text-right">{{ $product->total_qty }}</td>
                        <td class="text-right">${{ number_format($product->total_revenue, 2) }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="3" class="text-center">Sin datos en el periodo seleccionado</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>

            {{-- ===== TENDENCIA MENSUAL: crecimiento o caída a lo largo del tiempo ===== --}}
            <div class="section-title">Comparativa mensual (últimos 6 meses)</div>
            <table class="compare-table" style="margin-bottom: 24px;">
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th class="text-right">Ventas</th>
                        <th class="text-right">Ingresos</th>
                        <th class="text-right">Costo</th>
                        <th class="text-right">Margen</th>
                        <th class="text-right">Margen %</th>
                        <th class="text-right">Anuladas</th>
                        <th class="text-right">Devoluciones</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($monthlyComparison as $month)
                    <tr>
                        <td><strong>{{ $month->label }}</strong></td>
                        <td class="text-right">{{ $month->total_sales }}</td>
                        <td class="text-right">${{ number_format($month->revenue, 2) }}</td>
                        <td class="text-right">${{ number_format($month->cost, 2) }}</td>
                        <td class="text-right">${{ number_format($month->margin, 2) }}</td>
                        <td class="text-right">{{ $month->margin_pct }}%</td>
                        <td class="text-right">{{ $month->canceled }}</td>
                        <td class="text-right">{{ $month->returns }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="8" class="text-center">Sin datos disponibles</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>

            {{-- ===== DETALLE DE VENTAS: soporte/auditoría fila por fila ===== --}}
            <div class="section-title">Detalle de ventas del periodo</div>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                        <th>N° Factura</th>
                        <th>Cliente</th>
                        <th class="text-right">Total</th>
                        <th class="text-center">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($sales as $sale)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
                        <td>{{ $sale->voucher->name ?? '—' }}</td>
                        <td>{{ $sale->invoice_number }}</td>
                        <td>{{ $sale->customer->name ?? '—' }}</td>
                        <td class="text-right">${{ number_format($sale->total_amount, 2) }}</td>
                        <td class="text-center">
                            @if ($sale->status === 'anulado')
                            <span class="badge badge-anulada">Anulado</span>
                            @else
                            <span class="badge badge-contado">Procesado</span>
                            @endif
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="text-center">No hay ventas registradas en este periodo</td>
                    </tr>
                    @endforelse
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">Total del periodo</td>
                        <td class="text-right">${{ number_format($sales->sum('total_amount'), 2) }}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

        </div>

        {{-- ===== FOOTER ===== --}}
        <div class="report-footer">
            Reporte generado automáticamente el {{ $generatedAt }} — {{ config('app.name') }}
        </div>

    </div>

</body>

</html>