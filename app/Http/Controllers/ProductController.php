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
use Yajra\DataTables\Facades\DataTables;

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

            // Manejo de la imagen al actualizar (si se proporciona una nueva imagen)
            if ($request->hasFile('image')) {
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
            } else {
                // Eliminar la ruta y la imagen de la carpeta
                
                    if (\Storage::disk('public')->exists($product->image)) {
                        \Storage::disk('public')->delete($product->image);
                    }
                    $productData['image'] = null; // Eliminar la ruta de la imagen en la base de datos
            }

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
}
