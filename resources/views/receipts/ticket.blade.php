<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Ticket de Venta</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            color: #000;
            width: 80mm;
            max-width: 302px;
            margin: 0 auto;
        }

        .ticket {
            width: 100%;
        }

        /* ===== ENCABEZADO ===== */
        .header {
            text-align: center;
            margin-bottom: 6px;
        }

        .header .logo {
            max-width: 60px;
            margin-bottom: 4px;
        }

        .header .business-name {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .header .business-info {
            font-size: 9px;
            line-height: 1.3;
        }

        .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
        }

        .divider-solid {
            border-top: 1px solid #000;
            margin: 6px 0;
        }

        /* ===== INFO DEL TICKET ===== */
        .voucher-title {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin: 4px 0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            line-height: 1.4;
        }

        .info-row .label {
            font-weight: bold;
        }

        /* ===== TABLA DE PRODUCTOS ===== */
        table.products {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 4px;
        }

        table.products thead th {
            border-bottom: 1px solid #000;
            text-align: left;
            padding: 3px 0;
            font-size: 9px;
            font-weight: bold;
        }

        table.products thead th.text-right {
            text-align: right;
        }

        table.products tbody td {
            padding: 2px 0;
            vertical-align: top;
        }

        table.products tbody tr.product-row td {
            padding-top: 4px;
        }

        .product-name {
            font-weight: bold;
            font-size: 9px;
        }

        .product-detail {
            font-size: 8px;
            color: #333;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        /* ===== TOTALES ===== */
        .totals {
            width: 100%;
            margin-top: 6px;
            font-size: 10px;
        }

        .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
        }

        .totals .row.total-final {
            font-size: 13px;
            font-weight: bold;
            border-top: 1px solid #000;
            margin-top: 4px;
            padding-top: 4px;
        }

        /* ===== PAGO ===== */
        .payment-section {
            margin-top: 6px;
            font-size: 9px;
        }

        .payment-section .row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
        }

        /* ===== FOOTER ===== */
        .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 9px;
            line-height: 1.4;
        }

        .footer .thanks {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
        }

        .barcode-section {
            text-align: center;
            margin-top: 8px;
        }

        .barcode-section img {
            max-width: 100%;
            height: 35px;
        }

        .barcode-text {
            font-size: 8px;
            letter-spacing: 2px;
            margin-top: 2px;
        }

        /* ===== BOTÓN DE IMPRESIÓN (solo visible en pantalla) ===== */
        .print-action {
            text-align: center;
            margin-top: 12px;
        }

        .print-action button {
            padding: 6px 18px;
            font-size: 11px;
            border: 1px solid #000;
            background: #fff;
            cursor: pointer;
            border-radius: 4px;
        }

        .print-action button:hover {
            background: #eee;
        }

        /* ===== ESTILOS DE IMPRESIÓN ===== */
        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }

            body {
                width: 80mm;
            }

            /* ✅ Oculta elementos que no deben imprimirse (botones, etc.) */
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div class="ticket">

        {{-- ===== ENCABEZADO DEL NEGOCIO ===== --}}
        <div class="header">
            <img src="{{ URL::asset('storage/branches/logos/logo.png') }}" class="logo" height="60" alt="Logo del negocio">

            <div class="business-name">{{ $business->name }}</div>
            <div class="business-info">
                {{ $business->address ?? 'Dirección del negocio' }}<br>
                Tel: {{ $business->phone ?? 'N/A' }}<br>
                RFC: {{ $business->tax_id ?? 'N/A' }}
            </div>
        </div>

        <div class="divider"></div>

        {{-- ===== TÍTULO DEL COMPROBANTE ===== --}}
        <div class="voucher-title">TICKET DE VENTA</div>

        {{-- ===== INFO DE LA VENTA ===== --}}
        <div class="info-row">
            <span class="label">Folio:</span>
            <span>{{ $sale->invoice_number }}</span>
        </div>
        <div class="info-row">
            <span class="label">Fecha:</span>
            <span>{{ $fecha }}</span>
        </div>
        <div class="info-row">
            <span class="label">Atendió:</span>
            <span>{{ $user->name ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="label">Cliente:</span>
            <span>{{ $customer->name ?? 'Público General' }}</span>
        </div>

        <div class="divider"></div>

        {{-- ===== TABLA DE PRODUCTOS ===== --}}
        <table class="products">
            <thead>
                <tr>
                    <th>Cant.</th>
                    <th>Producto</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($details as $detail)
                <tr class="product-row">
                    <td>{{ rtrim(rtrim(number_format($detail->quantity, 2), '0'), '.') }}</td>
                    <td>
                        <div class="product-name">{{ $detail->product_name }}</div>
                        <div class="product-detail">
                            P.U. ${{ number_format($detail->unit_price, 2) }}
                            @if ($detail->discount > 0)
                            &nbsp;|&nbsp;Desc: ${{ number_format($detail->discount, 2) }}
                            @endif
                        </div>
                    </td>
                    <td class="text-right">${{ number_format($detail->total, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="divider"></div>

        {{-- ===== TOTALES ===== --}}
        <div class="totals">
            <div class="row">
                <span>Subtotal:</span>
                <span>${{ number_format($sale->subtotal, 2) }}</span>
            </div>

            @if ($sale->discount > 0)
            <div class="row">
                <span>Descuento:</span>
                <span>-${{ number_format($sale->discount, 2) }}</span>
            </div>
            @endif

            @if ($sale->tax > 0)
            <div class="row">
                <span>IVA:</span>
                <span>${{ number_format($sale->tax, 2) }}</span>
            </div>
            @endif

            <div class="row total-final">
                <span>TOTAL:</span>
                <span>${{ number_format($sale->total_amount, 2) }}</span>
            </div>
        </div>

        <div class="divider"></div>

        {{-- ===== MÉTODOS DE PAGO ===== --}}
        <div class="payment-section">
            @foreach ($payments as $payment)
            <div class="row">
                <span>{{ ucfirst($payment->payment_method) }}:</span>
                <span>${{ number_format($payment->amount, 2) }}</span>
            </div>
            @endforeach

            @if ($sale->amount_paid > $sale->total_amount)
            <div class="row">
                <span>Cambio:</span>
                <span>${{ number_format($sale->amount_paid - $sale->total_amount, 2) }}</span>
            </div>
            @endif
        </div>

        <div class="divider"></div>

        {{-- ===== FOOTER ===== --}}
        <div class="footer">
            <div class="thanks">¡Gracias por su compra!</div>
            <div>Este comprobante no es válido como factura fiscal</div>
            <div>{{ config('app.business_website', '') }}</div>
        </div>

        {{-- ===== CÓDIGO DE BARRAS (OPCIONAL) ===== --}}
        {{-- Requiere generar el código de barras como imagen base64 antes de pasarlo a la vista --}}
        @if (isset($barcodeImage))
        <div class="barcode-section">
            <img src="{{ $barcodeImage }}" alt="Código de barras">
            <div class="barcode-text">{{ $sale->invoice_number }}</div>
        </div>
        @endif

    </div>

    {{-- ===== BOTÓN DE IMPRESIÓN (no se imprime, solo visible en pantalla) ===== --}}
    <div class="print-action no-print">
        <button onclick="window.print()">🖨️ Imprimir Ticket</button>
    </div>

    {{-- ===== AUTO-IMPRIMIR AL CARGAR LA VENTANA ===== --}}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>

</body>

</html>