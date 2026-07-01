<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura de Venta</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            background: #fff;
        }

        /* ===== LAYOUT GENERAL ===== */
        .invoice-wrapper {
            width: 750px;
            margin: 0 auto;
            padding: 30px 30px 20px 30px;
        }

        /* ===== HEADER ===== */
        .invoice-header {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .invoice-header .col-left,
        .invoice-header .col-right {
            display: table-cell;
            vertical-align: top;
        }

        .invoice-header .col-right {
            text-align: right;
            width: 40%;
        }

        .business-logo {
            max-height: 60px;
            max-width: 180px;
            margin-bottom: 6px;
        }

        .business-name {
            font-size: 16px;
            font-weight: bold;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .business-meta {
            font-size: 10px;
            color: #555;
            line-height: 1.6;
            margin-top: 4px;
        }

        /* ===== CINTILLO DEL TIPO DE COMPROBANTE ===== */
        .voucher-banner {
            background: #1a1a2e;
            color: #fff;
            text-align: center;
            padding: 8px 0;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        .voucher-number {
            font-size: 12px;
            color: #ccc;
            margin-top: 2px;
            letter-spacing: 1px;
        }

        /* ===== SECCIÓN DE INFO (cliente + detalles de la factura) ===== */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 18px;
        }

        .info-block {
            display: table-cell;
            vertical-align: top;
            width: 50%;
        }

        .info-block:last-child {
            text-align: right;
        }

        .info-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #888;
            font-weight: bold;
            margin-bottom: 6px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 3px;
        }

        .info-row {
            font-size: 10px;
            line-height: 1.7;
            color: #333;
        }

        .info-row strong {
            color: #1a1a1a;
        }

        /* ===== TABLA DE PRODUCTOS ===== */
        table.products {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        table.products thead tr {
            background: #1a1a2e;
            color: #fff;
        }

        table.products thead th {
            padding: 8px 10px;
            font-size: 10px;
            font-weight: bold;
            text-align: left;
            letter-spacing: 0.5px;
        }

        table.products thead th.text-right {
            text-align: right;
        }

        table.products thead th.text-center {
            text-align: center;
        }

        table.products tbody tr {
            border-bottom: 1px solid #f0f0f0;
        }

        table.products tbody tr:nth-child(even) {
            background: #f9f9f9;
        }

        table.products tbody td {
            padding: 7px 10px;
            font-size: 10px;
            color: #333;
            vertical-align: middle;
        }

        table.products tbody td.text-right {
            text-align: right;
        }

        table.products tbody td.text-center {
            text-align: center;
        }

        .product-code {
            font-size: 9px;
            color: #888;
        }

        /* ===== SECCIÓN INFERIOR (totales + notas) ===== */
        .invoice-footer-grid {
            display: table;
            width: 100%;
            margin-top: 4px;
        }

        .footer-notes {
            display: table-cell;
            vertical-align: top;
            width: 55%;
            padding-right: 20px;
        }

        .footer-totals {
            display: table-cell;
            vertical-align: top;
            width: 45%;
        }

        /* ===== NOTAS ===== */
        .notes-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #888;
            font-weight: bold;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 3px;
            margin-bottom: 6px;
        }

        .notes-text {
            font-size: 10px;
            color: #555;
            line-height: 1.5;
        }

        .payment-methods-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #888;
            font-weight: bold;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 3px;
            margin-bottom: 6px;
            margin-top: 14px;
        }

        .payment-row {
            display: table;
            width: 100%;
            font-size: 10px;
            line-height: 1.7;
            color: #333;
        }

        .payment-row span:last-child {
            float: right;
        }

        /* ===== TOTALES ===== */
        table.totals {
            width: 100%;
            border-collapse: collapse;
        }

        table.totals td {
            padding: 4px 8px;
            font-size: 10px;
        }

        table.totals tr td:last-child {
            text-align: right;
        }

        table.totals .label-col {
            color: #555;
        }

        table.totals .separator td {
            border-top: 1px solid #e0e0e0;
        }

        table.totals .total-final td {
            font-size: 13px;
            font-weight: bold;
            color: #1a1a1a;
            background: #f3f4f6;
            padding: 8px 10px;
            border-top: 2px solid #1a1a2e;
        }

        /* ===== STATUS DE PAGO ===== */
        .payment-status {
            margin-top: 6px;
            text-align: right;
        }

        .badge {
            display: inline-block;
            padding: 3px 10px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 3px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .badge-paid {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #6ee7b7;
        }

        .badge-pending {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
        }

        .badge-credit {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
        }

        /* ===== FOOTER DE LA PÁGINA ===== */
        .page-footer {
            margin-top: 30px;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
            text-align: center;
            font-size: 9px;
            color: #999;
            line-height: 1.6;
        }

        /* ===== BOTÓN DE IMPRESIÓN ===== */
        .print-action {
            text-align: center;
            margin-top: 20px;
        }

        .print-action button {
            padding: 8px 24px;
            font-size: 12px;
            background: #1a1a2e;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .print-action button:hover {
            background: #2d2d4e;
        }

        /* ===== IMPRESIÓN ===== */
        @media print {
            @page {
                size: Letter;
                margin: 10mm 10mm 15mm 10mm;
            }

            body {
                font-size: 10px;
            }

            .no-print {
                display: none !important;
            }

            .invoice-wrapper {
                width: 100%;
                padding: 0;
            }

            table.products tbody tr:nth-child(even) {
                background: #f9f9f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .voucher-banner,
            table.products thead tr,
            table.totals .total-final td {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>

<div class="invoice-wrapper">

    {{-- ===== ENCABEZADO ===== --}}
    <div class="invoice-header">
        <div class="col-left">
            {{-- Descomenta si tienes logo: --}}
            {{-- <img src="{{ public_path('images/logo.png') }}" class="business-logo"> --}}
            <div class="business-name">{{ config('app.business_name', 'NOMBRE DEL NEGOCIO') }}</div>
            <div class="business-meta">
                {{ $business->address ?? 'Tu dirección aquí' }}<br>
                Tel: {{ $business->phone ?? 'Tu teléfono aquí' }}<br>
                RFC: {{ $business->tax_id ?? 'Tu RFC aquí' }}<br>
                {{ $business->email ?? '' }}
            </div>
        </div>
        <div class="col-right">
            {{-- El badge de status de pago en la esquina superior derecha --}}
            @if ($sale->is_fully_paid)
                <span class="badge badge-paid">✔ Pagado</span>
            @elseif ($sale->status === 'credito')
                <span class="badge badge-credit">● Crédito</span>
            @else
                <span class="badge badge-pending">⏳ Pendiente</span>
            @endif
        </div>
    </div>

    {{-- ===== CINTILLO CON TIPO Y NÚMERO ===== --}}
    <div class="voucher-banner">
        {{ strtoupper($sale->voucher->name ?? 'FACTURA DE VENTA') }}
        <div class="voucher-number">{{ $sale->invoice_number }}</div>
    </div>

    {{-- ===== INFO CLIENTE + DETALLES DE LA VENTA ===== --}}
    <div class="info-grid">
        <div class="info-block">
            <div class="info-label">Datos del Cliente</div>
            <div class="info-row">
                <strong>{{ $customer->name ?? 'Público General' }}</strong><br>
                @if ($customer && $customer->tax_id)
                    RFC: {{ $customer->tax_id }}<br>
                @endif
                @if ($customer && $customer->address)
                    {{ $customer->address }}<br>
                @endif
                @if ($customer && $customer->email)
                    {{ $customer->email }}<br>
                @endif
                @if ($customer && $customer->phone)
                    Tel: {{ $customer->phone }}
                @endif
            </div>
        </div>

        <div class="info-block">
            <div class="info-label">Detalles del Comprobante</div>
            <div class="info-row">
                <strong>Fecha:</strong> {{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}<br>
                <strong>Hora:</strong> {{ $fecha }}<br>
                <strong>Vendedor:</strong> {{ $user->name ?? 'N/A' }}<br>
                @if ($sale->is_fully_paid)
                    <strong>Vence:</strong> —
                @elseif (isset($sale->credit_due_date))
                    <strong>Vence:</strong> {{ \Carbon\Carbon::parse($sale->credit_due_date)->format('d/m/Y') }}
                @endif
            </div>
        </div>
    </div>

    {{-- ===== TABLA DE PRODUCTOS ===== --}}
    <table class="products">
        <thead>
            <tr>
                <th>#</th>
                <th>Código</th>
                <th>Descripción</th>
                <th class="text-center">Cant.</th>
                <th class="text-right">P. Unitario</th>
                <th class="text-right">Desc.</th>
                <th class="text-right">IVA</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($details as $index => $detail)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    {{ $detail->product_code ?? '—' }}
                </td>
                <td>
                    <strong>{{ $detail->product_name }}</strong>
                </td>
                <td class="text-center">
                    {{ rtrim(rtrim(number_format($detail->quantity, 2), '0'), '.') }}
                </td>
                <td class="text-right">${{ number_format($detail->unit_price, 2) }}</td>
                <td class="text-right">
                    @if ($detail->discount > 0)
                        -${{ number_format($detail->discount, 2) }}
                    @else
                        —
                    @endif
                </td>
                <td class="text-right">${{ number_format($detail->tax, 2) }}</td>
                <td class="text-right">${{ number_format($detail->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ===== NOTAS + TOTALES ===== --}}
    <div class="invoice-footer-grid">

        {{-- COLUMNA IZQUIERDA: notas y métodos de pago --}}
        <div class="footer-notes">

            @if ($sale->notes)
            <div class="notes-label">Notas</div>
            <div class="notes-text">{{ $sale->notes }}</div>
            @endif

            <div class="payment-methods-label">Métodos de Pago</div>
            @foreach ($payments as $payment)
            <div class="payment-row">
                <span>{{ ucfirst($payment->payment_method) }}</span>
                <span>${{ number_format($payment->amount, 2) }}</span>
            </div>
            @endforeach

            @if ($sale->amount_paid > $sale->total_amount)
            <div class="payment-row" style="color: #888;">
                <span>Cambio entregado</span>
                <span>${{ number_format($sale->amount_paid - $sale->total_amount, 2) }}</span>
            </div>
            @endif

        </div>

        {{-- COLUMNA DERECHA: totales --}}
        <div class="footer-totals">
            <table class="totals">
                <tr>
                    <td class="label-col">Subtotal (sin IVA)</td>
                    <td>${{ number_format($sale->subtotal, 2) }}</td>
                </tr>

                @if ($sale->discount > 0)
                <tr>
                    <td class="label-col">Descuento</td>
                    <td>-${{ number_format($sale->discount, 2) }}</td>
                </tr>
                @endif

                @if ($sale->tax > 0)
                <tr>
                    <td class="label-col">IVA (16%)</td>
                    <td>${{ number_format($sale->tax, 2) }}</td>
                </tr>
                @endif

                <tr class="separator"><td colspan="2"></td></tr>

                <tr class="total-final">
                    <td>TOTAL</td>
                    <td>${{ number_format($sale->total_amount, 2) }}</td>
                </tr>
            </table>
        </div>

    </div>

    {{-- ===== FOOTER DE LA PÁGINA ===== --}}
    <div class="page-footer">
        <strong>{{ config('app.business_name', 'NOMBRE DEL NEGOCIO') }}</strong> &nbsp;|&nbsp;
        {{ $business->address ?? '' }} &nbsp;|&nbsp;
        Tel: {{ $business->phone ?? '' }}<br>
        Este documento es un comprobante de venta interno. Para efectos fiscales solicite su CFDI.
    </div>

</div>

{{-- ===== BOTÓN DE IMPRESIÓN (no se imprime) ===== --}}
<div class="print-action no-print">
    <button onclick="window.print()">🖨️ Imprimir Factura</button>
</div>

{{-- ===== AUTO-IMPRIMIR AL CARGAR ===== --}}
<script>
    window.onload = function () {
        setTimeout(function () {
            window.print();
        }, 300);
    };

    window.onafterprint = function () {
        window.close();
    };
</script>

</body>
</html>