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

    public function getProducts()
    {
        $query = Product::getProductsData();

        return DataTables::of($query)
            ->addColumn('actions', function ($row) {
                // Aquí puedes agregar botones de acción si los necesitas
                return '';
            })
            ->editColumn('category_name', function ($row) {
                return $row->category_name;
            })
            ->editColumn('department_name', function ($row) {
                return $row->department_name;
            })
            ->filterColumn('category_name', function ($query, $keyword) {
                $query->whereRaw("LOWER(c.category_name) LIKE LOWER(?)", ["%{$keyword}%"]);
            })
            ->filterColumn('department_name', function ($query, $keyword) {
                $query->whereRaw("LOWER(d.department_name) LIKE LOWER(?)", ["%{$keyword}%"]);
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
        Log::info('Datos recibidos:', $request->all());
        try {
            DB::beginTransaction();

            // Obtener datos validados
            $productData = $request->validated();

            // Extraer impuestos del array
            $taxIds = $productData['taxes'] ?? [];

            // Remover campos que no van en la tabla products
            unset($productData['taxes']);

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

        if (!$product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

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
