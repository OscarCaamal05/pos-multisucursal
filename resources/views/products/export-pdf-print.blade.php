<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Productos</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #4472C4;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #4472C4;
            font-size: 20px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background-color: #f5f5f5;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 5px;
            display: table;
            width: 100%;
        }
        .summary-item {
            display: inline-block;
            width: 30%;
            padding: 5px;
        }
        .summary-item strong {
            color: #4472C4;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #4472C4;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            border: 1px solid #ddd;
        }
        td {
            padding: 6px;
            border: 1px solid #ddd;
            font-size: 9px;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .inactive {
            background-color: #ffe6e6;
        }
        .low-stock {
            color: #ff0000;
            font-weight: bold;
        }
        .totals {
            background-color: #e7e6e6;
            font-weight: bold;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 5px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- ENCABEZADO -->
    <div class="header">
        <h1>REPORTE DE PRODUCTOS</h1>
        <p>Generado el: {{ $fecha }}</p>
    </div>

    <!-- RESUMEN -->
    <div class="summary">
        <div class="summary-item">
            <strong>Total de Productos:</strong> {{ $totalProducts }}
        </div>
        <div class="summary-item">
            <strong>Productos Activos:</strong> {{ $activeProducts }}
        </div>
        <div class="summary-item">
            <strong>Productos Inactivos:</strong> {{ $inactiveProducts }}
        </div>
        <div class="summary-item">
            <strong>Stock Bajo:</strong> <span style="color: #ff0000;">{{ $lowStockProducts }}</span>
        </div>
        <div class="summary-item">
            <strong>Stock Total:</strong> {{ number_format($totalStock, 2) }}
        </div>
        <div class="summary-item">
            <strong>Valor Inventario:</strong> ${{ number_format($totalValue, 2) }}
        </div>
    </div>

    <!-- TABLA DE PRODUCTOS -->
    <table>
        <thead>
            <tr>
                <th style="width: 4%;">ID</th>
                <th style="width: 22%;">Producto</th>
                <th style="width: 12%;">Código</th>
                <th style="width: 12%;">Categoría</th>
                <th style="width: 12%;">Departamento</th>
                <th style="width: 6%;">Stock</th>
                <th style="width: 6%;">Min</th>
                <th style="width: 6%;">Max</th>
                <th style="width: 8%;">P. Compra</th>
                <th style="width: 8%;">P. Venta</th>
                <th style="width: 4%;">Estado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
            <tr class="{{ !$product->is_active ? 'inactive' : '' }}">
                <td class="text-center">{{ $product->id }}</td>
                <td>{{ $product->name }}</td>
                <td>{{ $product->barcode }}</td>
                <td>{{ $product->category_name }}</td>
                <td>{{ $product->department_name }}</td>
                <td class="text-right {{ $product->stock <= $product->stock_min ? 'low-stock' : '' }}">
                    {{ number_format($product->stock, 2) }}
                </td>
                <td class="text-right">{{ number_format($product->stock_min, 2) }}</td>
                <td class="text-right">{{ number_format($product->stock_max, 2) }}</td>
                <td class="text-right">${{ number_format($product->purchase_price, 2) }}</td>
                <td class="text-right">${{ number_format($product->sale_price_1, 2) }}</td>
                <td class="text-center">
                    @if($product->is_active)
                        <span style="color: green;">●</span>
                    @else
                        <span style="color: red;">●</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="totals">
                <td colspan="5" class="text-right">TOTALES:</td>
                <td class="text-right">{{ number_format($totalStock, 2) }}</td>
                <td colspan="5"></td>
            </tr>
        </tfoot>
    </table>

    <!-- PIE DE PÁGINA -->
    <div class="footer">
        Sistema POS Multi-Sucursal - Página <span class="pagenum"></span>
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $text = "Página {PAGE_NUM} de {PAGE_COUNT}";
            $size = 8;
            $font = $fontMetrics->getFont("Arial");
            $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
            $x = ($pdf->get_width() - $width) / 2;
            $y = $pdf->get_height() - 35;
            $pdf->page_text($x, $y, $text, $font, $size);
        }
    </script>
</body>
</html>