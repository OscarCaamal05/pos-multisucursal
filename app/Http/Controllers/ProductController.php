<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveProductsRequest;
use App\Models\Category;
use App\Models\BranchInventories;
use App\Models\Department;
use App\Models\kardex;
use App\Models\Product;
use App\Models\ProductTaxes;
use App\Models\Taxes;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Yajra\DataTables\Facades\DataTables;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $departments = Department::all();
        $categories = Category::where('status', '!=', 0)->get();
        $units = Unit::where('status', '!=', 0)->get();
        $taxes = Taxes::where('is_active', '!=', 0)->get();

        return view('products.index', compact('departments', 'categories', 'units', 'taxes'));
    }

    public function getProducts(Request $request)
    {
        $query = Product::getProductsData();

        // Filtrar por departamento si se proporciona
        if ($request->has('department_id') && $request->department_id !== 'all-department' && $request->department_id !== '') {
            $query->where('p.department_id', $request->department_id);
        }

        if ($request->has('category_id') && $request->category_id !== 'all-category' && $request->category_id !== '') {
            $query->where('p.category_id', $request->category_id);
        }

        if ($request->has('status') && $request->status !== 'all-status' && $request->status !== '') {
            $query->where('p.is_active', $request->status); // ← Cambiar de 'p.status' a 'p.is_active'
        }

        return DataTables::of($query)
            // Definir las columnas searchables correctamente
            ->filterColumn('category_name', function ($query, $keyword) {
                $query->whereRaw("LOWER(c.name) LIKE LOWER(?)", ["%{$keyword}%"]);
            })
            ->filterColumn('department_name', function ($query, $keyword) {
                $query->whereRaw("LOWER(d.name) LIKE LOWER(?)", ["%{$keyword}%"]);
            })
            ->make(true);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SaveProductsRequest $request)
    {

        try {
            DB::beginTransaction();

            // Obtener datos validados
            $productData = $request->validated();

            // Extraer impuestos del array
            $taxIds = $productData['taxes'] ?? [];

            // Remover campos que no van en la tabla products
            unset($productData['taxes']);

            // Manejo de la imagen (si se proporciona)
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $imagePath = $image->storeAs('products', $imageName, 'public');
                $productData['image'] = $imagePath;
            }

            // Crear el producto
            $product = Product::create($productData);

            // Asignar impuestos si existen
            if (!empty($taxIds)) {
                foreach ($taxIds as $taxId) {
                    ProductTaxes::create([
                        'product_id' => $product->id,
                        'tax_id' => $taxId,
                        'is_active' => true,
                    ]);
                }
            }

            // Crear inventario inicial
            BranchInventories::create([
                'product_id' => $product->id,
                'branch_id' => 1, // auth()->user()->branch_id ?? 1
                'quantity' => 0,
                'stock_min' => $request->input('stock_min', 0),
                'stock_max' => $request->input('stock_max', 0),
            ]);

            DB::commit();

            return response()->json(
                [
                    'status' => 'create',
                    'product' => [
                        'id' => $product->id,
                    ]
                ]
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();

            Log::error('Error de base de datos al crear producto', [
                'message' => $e->getMessage(),
                'code' => $e->errorInfo[1] ?? $e->getCode(),
                'sql' => $e->getSql() ?? 'N/A'
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error de base de datos: ' . $e->getMessage(),
                'code' => $e->errorInfo[1] ?? null
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error inesperado al crear producto', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error inesperado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajustar el stock del producto
     */
    public function adjustStock(Request $request, Product $product)
    {
        // Validar datos de entrada
        $validated = $request->validate([
            'adjustment_type' => 'required|in:entrada,salida,ajuste',
            'adjustment_quantity' => 'required|numeric|min:0',
            'adjustment_comment' => 'nullable|string|max:100'
        ]);

        try {
            DB::beginTransaction();

            $adjustmentType = $validated['adjustment_type'];
            $adjustmentQuantity = (float) $validated['adjustment_quantity'];
            $inventory = BranchInventories::where('product_id', $product->id)->first();
            $previousStock = $inventory->quantity;

            // Calcular la nueva cantidad
            if ($adjustmentType === 'entrada') {
                $inventory->quantity += $adjustmentQuantity;
            } elseif ($adjustmentType === 'salida') {
                if ($inventory->quantity < $adjustmentQuantity) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No hay suficiente stock para realizar la salida. Stock actual: ' . $inventory->quantity
                    ], 400);
                }
                $inventory->quantity -= $adjustmentQuantity;
            } elseif ($adjustmentType === 'ajuste') {
                $inventory->quantity = $adjustmentQuantity;
            }

            $inventory->save();

            // Registrar el kardex
            kardex::create([
                'branch_id' => $inventory->branch_id,
                'product_id' => $inventory->product_id,
                'movement_type' => $adjustmentType,
                'quantity' => $adjustmentQuantity,
                'movement_date' => now(),
                'movement_reason' => $validated['adjustment_comment'] ?? 'Ajuste de inventario manual',
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Stock ajustado correctamente.',
                'data' => [
                    'previous_stock' => $previousStock,
                    'new_stock' => $inventory->quantity
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error inesperado al ajustar stock', [
                'inventory_id' => $inventory->id,
                'product_id' => $inventory->product_id,
                'adjustment_type' => $request->input('adjustment_type'),
                'adjustment_quantity' => $request->input('adjustment_quantity'),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error inesperado: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $product_data = Product::getWithDetails()->where('p.id', $product->id)->first();

        if (!$product_data) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        // Agregar URL completa de la imagen y nombre del archivo
        $product_data->image_url = $product_data->image
            ? asset('storage/' . $product_data->image)
            : null;

        $product_data->image_name = $product_data->image
            ? basename($product_data->image)
            : null;

        return response()->json([
            'status' => 'success',
            'data' => $product_data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveProductsRequest $request, Product $product)
    {
        try {

            DB::beginTransaction();

            // Obtener datos validados
            $productData = $request->validated();

            // Extraer impuestos del array
            $taxIds = $productData['taxes'] ?? [];

            // Remover campos que no van en la tabla products
            unset($productData['taxes']);

            // Manejo de la imagen al actualizar
            if ($request->hasFile('image')) {
                // Se envió una nueva imagen
                // Eliminar imagen anterior si existe
                if ($product->image && \Storage::disk('public')->exists($product->image)) {
                    \Storage::disk('public')->delete($product->image);
                }

                $image = $request->file('image');

                // Generar nombre único para la nueva imagen
                $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();

                // Guardar en storage/app/public/products
                $imagePath = $image->storeAs('products', $imageName, 'public');

                // Agregar ruta al array de datos
                $productData['image'] = $imagePath;
            } elseif ($request->has('remove_image') && $request->input('remove_image') == '1') {
                // Se solicitó eliminar la imagen
                // Eliminar imagen física si existe
                if ($product->image && \Storage::disk('public')->exists($product->image)) {
                    \Storage::disk('public')->delete($product->image);
                }
                // Establecer imagen como null en la base de datos
                $productData['image'] = null;
            }
            // Si no se envía ninguna de las dos opciones, mantener la imagen actual

            // Actualizar el producto
            $product->update($productData);

            // Sincronizar impuestos
            // Eliminar impuestos existentes
            ProductTaxes::where('product_id', $product->id)->delete();

            // Asignar nuevos impuestos si existen
            if (!empty($taxIds)) {
                foreach ($taxIds as $taxId) {
                    ProductTaxes::create([
                        'product_id' => $product->id,
                        'tax_id' => $taxId,
                        'is_active' => true,
                    ]);
                }
            }

            // Actualizar inventario si se enviaron stock_min o stock_max
            if ($request->has('stock_min') || $request->has('stock_max')) {
                BranchInventories::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => 1, // auth()->user()->branch_id ?? 1
                    ],
                    [
                        'stock_min' => $request->input('stock_min', 0),
                        'stock_max' => $request->input('stock_max', 0),
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'status' => 'update',
                'product' => [
                    'id' => $product->id,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['delete' => true]);
    }

    public function toggleStatus(Request $request, Product $product)
    {
        $product->is_active = $request->input('status');
        $product->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }

    /**
     * Descargar plantilla de Excel para importación de productos
     */
    public function downloadTemplate()
    {
        try {

            // Crear nueva hoja de cálculo
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Titulo de la hoja
            $sheet->setTitle('Productos');

            // ===== ENCABEZADOS DE COLUMNAS =====
            $headers = [
                'A1' => 'Nombre del Producto *',
                'B1' => 'Código de Barras *',
                'C1' => 'Descripción',
                'D1' => 'Categoría (ID) *',
                'E1' => 'Departamento (ID) *',
                'F1' => 'Unidad de Compra (ID) *',
                'G1' => 'Unidad de Venta (ID) *',
                'H1' => 'Factor de Conversión *',
                'I1' => 'Precio de Compra *',
                'J1' => 'Precio de Venta 1 *',
                'K1' => 'Cantidad Mínima P1 *',
                'L1' => 'Precio de Venta 2',
                'M1' => 'Cantidad Mínima P2',
                'N1' => 'Precio de Venta 3',
                'O1' => 'Cantidad Mínima P3',
                'P1' => 'Stock Inicial',
                'Q1' => 'Stock Mínimo',
                'R1' => 'Stock Máximo',
                'S1' => 'Aplica IVA (1=Si, 0=No)',
                'T1' => 'Es Neto (1=Si, 0=No)',
                'U1' => 'Es Fraccionable (1=Si, 0=No)',
                'V1' => 'Es Servicio (1=Si, 0=No)',
            ];

            // Aplicar encabezados a la hoja
            foreach ($headers as $cell => $header) {
                $sheet->setCellValue($cell, $header);
            }

            // ===== ESTILOS DE ENCABEZADOS =====
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ];

            $sheet->getStyle('A1:V1')->applyFromArray($headerStyle);

            // ===== AJUSTAR ANCHO DE COLUMNAS =====
            $sheet->getColumnDimension('A')->setWidth(30);
            $sheet->getColumnDimension('B')->setWidth(20);
            $sheet->getColumnDimension('C')->setWidth(40);
            $sheet->getColumnDimension('D')->setWidth(15);
            $sheet->getColumnDimension('E')->setWidth(18);
            $sheet->getColumnDimension('F')->setWidth(20);
            $sheet->getColumnDimension('G')->setWidth(20);
            $sheet->getColumnDimension('H')->setWidth(18);
            $sheet->getColumnDimension('I')->setWidth(18);
            $sheet->getColumnDimension('J')->setWidth(18);
            $sheet->getColumnDimension('K')->setWidth(18);
            $sheet->getColumnDimension('L')->setWidth(18);
            $sheet->getColumnDimension('M')->setWidth(18);
            $sheet->getColumnDimension('N')->setWidth(18);
            $sheet->getColumnDimension('O')->setWidth(18);
            $sheet->getColumnDimension('P')->setWidth(15);
            $sheet->getColumnDimension('Q')->setWidth(15);
            $sheet->getColumnDimension('R')->setWidth(15);
            $sheet->getColumnDimension('S')->setWidth(20);
            $sheet->getColumnDimension('T')->setWidth(18);
            $sheet->getColumnDimension('U')->setWidth(22);
            $sheet->getColumnDimension('V')->setWidth(18);

            // ===== FILA DE EJEMPLO =====
            $exampleData = [
                'Coca Cola 600ml',                    // A2
                '7501234567890',                      // B2
                'Refresco de cola sabor original',   // C2
                '1',                                  // D2 - ID Categoría
                '1',                                  // E2 - ID Departamento
                '1',                                  // F2 - ID Unidad Compra
                '1',                                  // G2 - ID Unidad Venta
                '1',                                  // H2 - Factor conversión
                '12.50',                              // I2 - Precio compra
                '18.00',                              // J2 - Precio venta 1
                '1',                                  // K2 - Cantidad mín P1
                '17.00',                              // L2 - Precio venta 2
                '6',                                  // M2 - Cantidad mín P2
                '16.00',                              // N2 - Precio venta 3
                '12',                                 // O2 - Cantidad mín P3
                '100',                                // P2 - Stock inicial
                '10',                                 // Q2 - Stock mínimo
                '200',                                // R2 - Stock máximo
                '1',                                  // S2 - Aplica IVA
                '1',                                  // T2 - Es neto
                '0',                                  // U2 - Es fraccionable
                '0',                                  // V2 - Es servicio
            ];

            $sheet->fromArray($exampleData, null, 'A2');

            // Estilo para la fila de ejemplo (gris claro)
            $sheet->getStyle('A2:V2')->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E7E6E6'],
                ],
                'font' => [
                    'italic' => true,
                    'color' => ['rgb' => '666666'],
                ],
            ]);

            // ===== CREAR HOJA DE AYUDA CON IDS =====
            $helpSheet = $spreadsheet->createSheet();
            $helpSheet->setTitle('Catálogos de IDs');

            // Obtener datos de catálogos
            $categories = Category::where('status', 1)->get(['id', 'name as category_name']);
            $departments = Department::where('status', 1)->get(['id', 'name as department_name']);
            $units = Unit::where('status', 1)->get(['id', 'name']);

            // Encabezados de la hoja de ayuda
            $helpSheet->setCellValue('A1', 'CATEGORÍAS');
            $helpSheet->setCellValue('C1', 'DEPARTAMENTOS');
            $helpSheet->setCellValue('E1', 'UNIDADES');

            $helpSheet->setCellValue('A2', 'ID');
            $helpSheet->setCellValue('B2', 'Nombre');
            $helpSheet->setCellValue('C2', 'ID');
            $helpSheet->setCellValue('D2', 'Nombre');
            $helpSheet->setCellValue('E2', 'ID');
            $helpSheet->setCellValue('F2', 'Nombre');

            // Aplicar estilos a encabezados de ayuda
            $helpSheet->getStyle('A1:F2')->applyFromArray($headerStyle);

            // Llenar datos de categorías
            $row = 3;
            foreach ($categories as $category) {
                $helpSheet->setCellValue('A' . $row, $category->id);
                $helpSheet->setCellValue('B' . $row, $category->category_name);
                $row++;
            }

            // Llenar datos de departamentos
            $row = 3;
            foreach ($departments as $department) {
                $helpSheet->setCellValue('C' . $row, $department->id);
                $helpSheet->setCellValue('D' . $row, $department->department_name);
                $row++;
            }

            // Llenar datos de unidades
            $row = 3;
            foreach ($units as $unit) {
                $helpSheet->setCellValue('E' . $row, $unit->id);
                $helpSheet->setCellValue('F' . $row, $unit->name);
                $row++;
            }

            // Ajustar anchos en hoja de ayuda
            $helpSheet->getColumnDimension('A')->setWidth(10);
            $helpSheet->getColumnDimension('B')->setWidth(30);
            $helpSheet->getColumnDimension('C')->setWidth(10);
            $helpSheet->getColumnDimension('D')->setWidth(30);
            $helpSheet->getColumnDimension('E')->setWidth(10);
            $helpSheet->getColumnDimension('F')->setWidth(30);

            // Volver a la primera hoja
            $spreadsheet->setActiveSheetIndex(0);

            // ===== GENERAR Y DESCARGAR ARCHIVO =====
            $fileName = 'plantilla_productos_' . date('Y-m-d_His') . '.xlsx';

            $writer = new Xlsx($spreadsheet);

            // Configurar headers para descarga
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment;filename="' . $fileName . '"');
            header('Cache-Control: max-age=0');

            $writer->save('php://output');
            exit;
        } catch (\Exception $e) {
            Log::error('Error al descargar plantilla de Excel', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json(['status' => 'error', 'message' => 'Error al descargar plantilla: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Importar la plantilla de Excel para productos
     */
    public function importFromExcel(Request $request)
    {
        // Validar que se haya enviado un archivo
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls|max:10240', // Máximo 10MB
        ]);

        try {
            $file = $request->file('excel_file');

            // Cargar el archivo Excel
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            // Validar que el archivo tenga datos
            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo está vacío o no tiene datos para importar.'
                ], 422);
            }

            // Eliminar la fila de encabezados
            array_shift($rows);

            // Eliminar la fila de ejemplo (si existe y está vacía o es la de ejemplo)
            if (count($rows) > 0 && ($rows[0][0] === 'Coca Cola 600ml' || empty($rows[0][0]))) {
                array_shift($rows);
            }

            $imported = 0;
            $errors = [];
            $skipped = 0;

            DB::beginTransaction();

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 3; // +3 porque eliminamos encabezado y ejemplo, y Excel empieza en 1

                // Saltar filas completamente vacías
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    // Validar campos obligatorios
                    $validationErrors = $this->validateProductRow($row, $rowNumber);

                    if (!empty($validationErrors)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'errors' => $validationErrors
                        ];
                        $skipped++;
                        continue;
                    }

                    // Verificar si el código de barras ya existe
                    $existingProduct = Product::where('barcode', $row[1])->first();

                    if ($existingProduct) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'errors' => ["El código de barras '{$row[1]}' ya existe en el sistema."]
                        ];
                        $skipped++;
                        continue;
                    }

                    // Preparar datos del producto con valores por defecto
                    $conversionFactor = !empty($row[7]) && is_numeric($row[7]) && $row[7] > 0 ? (float)$row[7] : 1;
                    $purchasePrice = !empty($row[8]) && is_numeric($row[8]) ? (float)$row[8] : 0;
                    $salePrice1 = !empty($row[9]) && is_numeric($row[9]) ? (float)$row[9] : 0;
                    $iva = isset($row[18]) && in_array($row[18], [1, '1', true]) ? 1 : 0;
                    $neto = isset($row[19]) && in_array($row[19], [0, '0', false]) ? 0 : 1;

                    // Calcular precio unitario
                    $unitPrice = $this->calculateUnitPrice($purchasePrice, $conversionFactor, $iva, $neto);

                    // Preparar valores
                    $conversionFactor = !empty($row[7]) && is_numeric($row[7]) && $row[7] > 0 ? (float)$row[7] : 1;
                    $purchasePrice = !empty($row[8]) && is_numeric($row[8]) ? (float)$row[8] : 0.00;
                    $salePrice1 = !empty($row[9]) && is_numeric($row[9]) ? (float)$row[9] : 0.00;

                    // Calcular precio unitario
                    $unitPrice = $conversionFactor > 0 ? round($purchasePrice / $conversionFactor, 2) : 0.00;

                    // Precio de venta 2
                    $salePrice2 = !empty($row[11]) && is_numeric($row[11]) && $row[11] > 0 ? (float)$row[11] : 0.00;
                    $price2MinQty = !empty($row[12]) && is_numeric($row[12]) && $row[12] > 0 ? (int)$row[12] : 0;

                    // Precio de venta 3
                    $salePrice3 = !empty($row[13]) && is_numeric($row[13]) && $row[13] > 0 ? (float)$row[13] : 0.00;
                    $price3MinQty = !empty($row[14]) && is_numeric($row[14]) && $row[14] > 0 ? (int)$row[14] : 0;

                    // Stock del Excel
                    $stockInitial = !empty($row[15]) && is_numeric($row[15]) ? (float)$row[15] : 0;
                    $stockMin = !empty($row[16]) && is_numeric($row[16]) ? (float)$row[16] : 0;
                    $stockMax = !empty($row[17]) && is_numeric($row[17]) ? (float)$row[17] : 0;

                    // Booleanos - según tu estructura
                    $ivaValue = !empty($row[18]) && in_array($row[18], [1, '1', true]) ? 1 : 0;
                    $netoValue = isset($row[19]) && in_array($row[19], [0, '0', false]) ? 0 : 1;
                    $isFractional = !empty($row[20]) && in_array($row[20], [1, '1', true]) ? 1 : 0;
                    $isService = !empty($row[21]) && in_array($row[21], [1, '1', true]) ? 1 : 0;

                    // Insertar el producto
                    $productId = DB::table('products')->insertGetId([
                        'name' => trim($row[0]),
                        'barcode' => trim($row[1]),
                        'description' => !empty($row[2]) ? trim($row[2]) : null,
                        'allow_fractional_sale' => $isFractional,
                        'allow_decimal_quantity' => 0,
                        'is_service' => $isService,
                        'is_net_price' => $netoValue,
                        'conversion_factor' => $conversionFactor,
                        'requires_batch_control' => 0,
                        'requires_serial_number' => 0,
                        'shelf_life_days' => null,
                        'alert_days_before_expiration' => 30,
                        'expiry_date' => null,
                        'purchase_price' => $purchasePrice,
                        'sale_price_1' => $salePrice1,
                        'price_1_min_qty' => !empty($row[10]) && is_numeric($row[10]) ? (int)$row[10] : 1,
                        'sale_price_2' => $salePrice2,
                        'price_2_min_qty' => $price2MinQty,
                        'sale_price_3' => $salePrice3,
                        'price_3_min_qty' => $price3MinQty,
                        'unit_price' => $unitPrice,
                        'image' => null,
                        'is_active' => 1,
                        'category_id' => (int)$row[3],
                        'department_id' => (int)$row[4],
                        'sale_unit_id' => (int)$row[6],
                        'purchase_unit_id' => (int)$row[5],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Crear registro en branch_inventories
                    DB::table('branch_inventories')->insert([
                        'product_id' => $productId,
                        'branch_id' => 1, // AJUSTAR DESPUES CUANDO YA SE IMPLEMENTE AUTENTICACIÓN
                        'quantity' => $stockInitial,
                        'stock_min' => $stockMin,
                        'stock_max' => $stockMax,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Crear la relacion de impuestos (si aplica)
                    if ($ivaValue) {
                        $ivaTax = Taxes::where('name', 'iva')->first();
                        if ($ivaTax) {
                            DB::table('product_taxes')->insert([
                                'product_id' => $productId,
                                'tax_id' => $ivaTax->id,
                                'is_active' => 1,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'errors' => ['Error al procesar: ' . $e->getMessage()]
                    ];
                    $skipped++;
                }
            }

            DB::commit();

            // Preparar respuesta
            $response = [
                'success' => true,
                'message' => "Importación completada.",
                'imported' => $imported,
                'skipped' => $skipped,
                'total' => $imported + $skipped,
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
            }

            return response()->json($response);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validar una fila de producto
     */
    private function validateProductRow($row, $rowNumber)
    {
        $errors = [];

        // Nombre del producto (columna A)
        if (empty($row[0])) {
            $errors[] = "El nombre del producto es obligatorio.";
        }

        // Código de barras (columna B)
        if (empty($row[1])) {
            $errors[] = "El código de barras es obligatorio.";
        }

        // Categoría (columna D)
        if (empty($row[3]) || !Category::find($row[3])) {
            $errors[] = "La categoría (ID: {$row[3]}) no existe o es inválida.";
        }

        // Departamento (columna E)
        if (empty($row[4]) || !Department::find($row[4])) {
            $errors[] = "El departamento (ID: {$row[4]}) no existe o es inválido.";
        }

        // Unidad de compra (columna F)
        if (empty($row[5]) || !Unit::find($row[5])) {
            $errors[] = "La unidad de compra (ID: {$row[5]}) no existe o es inválida.";
        }

        // Unidad de venta (columna G)
        if (empty($row[6]) || !Unit::find($row[6])) {
            $errors[] = "La unidad de venta (ID: {$row[6]}) no existe o es inválida.";
        }

        // Factor de conversión (columna H)
        if (empty($row[7]) || !is_numeric($row[7]) || $row[7] <= 0) {
            $errors[] = "El factor de conversión debe ser un número mayor a 0.";
        }

        // Precio de compra (columna I)
        if (!isset($row[8]) || !is_numeric($row[8]) || $row[8] < 0) {
            $errors[] = "El precio de compra debe ser un número válido.";
        }

        // Precio de venta 1 (columna J)
        if (!isset($row[9]) || !is_numeric($row[9]) || $row[9] < 0) {
            $errors[] = "El precio de venta 1 debe ser un número válido.";
        }

        // Cantidad mínima precio 1 (columna K)
        if (empty($row[10]) || !is_numeric($row[10]) || $row[10] < 1) {
            $errors[] = "La cantidad mínima para precio 1 debe ser al menos 1.";
        }

        return $errors;
    }

    /**
     * Calcular precio unitario
     */
    private function calculateUnitPrice($purchasePrice, $conversionFactor, $iva, $neto)
    {
        // Evitar división por cero
        if ($conversionFactor == 0 || $conversionFactor == null) {
            $conversionFactor = 1;
        }

        $unitPrice = $purchasePrice / $conversionFactor;

        // Si aplica IVA y NO es neto, agregar el IVA
        if ($iva && !$neto) {
            $unitPrice = $unitPrice * 1.16; // Aplicar 16% de IVA
        }

        return round($unitPrice, 2);
    }
}
