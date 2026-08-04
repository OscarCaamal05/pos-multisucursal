<?php

namespace App\Http\Controllers;

use App\Models\TempPurchaseDetail;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\TempPurchase;
use App\Models\purchases;
use App\Models\purchases_detail;
use App\Models\BranchInventories;
use App\Services\TotalsCalculatorService;
use App\Services\InventoryService;
use App\Services\Purchases\PurchasesDiscountService;
use App\Services\Purchases\PurchasesProcessingService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\Pdf\ReceiptPdfService;
use Exception;
use Yajra\DataTables\Facades\DataTables;

class TempPurchaseDetailController extends Controller
{
    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
        private PurchasesDiscountService $discountService,
    ) {}

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS PRODUCTOS
     ---------------------------------------------------------------*/

    /**
     * METODO PARA AUTOCOMPLETO DE BUSQUEDA DE PRODUCTOS
     */
    public function autoCompleteProducts($query)
    {
        $results = Product::where('name', 'LIKE', '%' . $query . '%')
            ->orWhere('barcode', 'LIKE', '%' . $query . '%')
            ->limit(10) // Limita la cantidad de resultados
            ->get([
                'id',
                'name',
                'barcode',
            ]);

        return response()->json([
            'data' => $results->map(function ($product) {
                return [
                    'id' => $product->id,
                    'value' => $product->name . ' - ' . $product->barcode, // <== Este campo se debe llamar "value"
                ];
            })
        ]);
    }

    /**
     * METODO PARA OBTENER LOS DATOS DE UN PRODUCTO PARA MOSTRARLO EN EL MODAL DE AGREGAR PRODUCTO
     */
    public function getDataProduct($productId)
    {
        try {
            // Obtener producto con detalles incluyendo el inventario de la sucursal
            $product = Product::getWithDetails()
                ->where('p.id', $productId)
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'error' => 'Producto no encontrado'
                ], 404);
            }

            // Obtener temp_purchase_id directamente
            $tempPurchase = TempPurchase::where('user_id', auth()->id())
                ->where('status', 'abierta')
                ->first();

            if (!$tempPurchase) {
                return response()->json([
                    'success' => false,
                    'error' => 'No hay compra temporal activa'
                ], 400);
            }

            $tempPurchaseId = $tempPurchase->id_temp_purchase;

            // Verificar si ya existe en la tabla temporal
            $existing = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)
                ->where('product_id', $productId)
                ->first();

            if ($existing) {
                return response()->json([
                    'product_exists' => true,
                    'message' => 'El producto ya está agregado a la compra'
                ]);
            }

            // Producto no existe - devolver datos para nuevo registro
            $productData = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'barcode' => $product->barcode,
                'stock' => $product->stock, // Ya viene desde branch_inventories.quantity
                'unit_name' => $product->purchase_unit_name ?? '',
                'conversion_factor' => $product->conversion_factor,
                'purchase_price' => $product->purchase_price,
                'sale_price_1' => $product->sale_price_1,
                'sale_price_2' => $product->sale_price_2,
                'sale_price_3' => $product->sale_price_3,
                'unit_price' => $product->unit_price,
                'quantity' => 0,
                'discount' => 0,
                'factor' => $product->conversion_factor,
                'has_temp_data' => false,
                // Agregar campos faltantes para consistencia
                'original_purchase_price' => $product->purchase_price,
                'original_sale_price_1' => $product->sale_price_1,
                'original_sale_price_2' => $product->sale_price_2,
                'original_sale_price_3' => $product->sale_price_3
            ];

            return response()->json([
                'success' => true,
                'product_exists' => false,
                'detail' => $productData
            ]);
        } catch (\Exception $e) {
            // Log del error para debugging
            \Log::error('Error en getDataProduct', [
                'product_id' => $productId,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * METODO PARA AGREGAR UN PRODUCTO A LA COMPRA TEMPORAL
     */
    public function addProduct(Request $request)
    {

        try {

            $request->validate([
                'temp_purchase_id' => 'required',
                'product_id' => 'required',
                'quantity' => 'required',
            ]);

            // Si temp_purchase_id es "0" o no existe un TempPurchase válido, crear uno nuevo
            $tempPurchaseId = $request->temp_purchase_id;
            if ($tempPurchaseId == "0" || $tempPurchaseId == 0 || !TempPurchase::find($tempPurchaseId)) {
                $tempPurchaseController = new \App\Http\Controllers\TempPurchaseController();
                $tempResponse = $tempPurchaseController->getOrCreateTempPurchase();
                $tempData = $tempResponse->getData();
                $tempPurchaseId = $tempData->temp->id_temp_purchase;
            }

            $product = Product::getWithDetails()->where('p.id', $request->product_id)->first();
            //$product = Product::findOrFail($request->product_id);

            $existing = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'El producto ya ha sido agregado a la compra temporal.',
                    'temp_purchase_id' => $tempPurchaseId
                ], 400);
                /*
                $existing->quantity += 1;
                $existing->total = ($existing->quantity * $request->cost) - $existing->discount_number;
                $existing->save();

                // Obtén todos los detalles de la compra temporal actual
                $detail = TempPurchaseDetail::where('temp_purchase_id', $request->temp_purchase_id)->get();
                $totals = $this->calculateTotals($detail);

                return response()->json(array_merge([
                    'status' => 'create.'
                ], $totals));*/
            }

            $detail = TempPurchaseDetail::create([
                'temp_purchase_id' => (int) $tempPurchaseId,
                'product_id' => (int) $product->id,
                'product_name' => $product->name,
                'barcode' => $product->barcode,
                'purchase_price' => (float) ($request->cost ?? 0),
                'new_sale_price_1' => (float) ($request->new_price_sale_1 ?? $request->new_price_sale_1 ?? 0),
                'new_sale_price_2' => (float) ($request->new_price_sale_2 ?? $request->new_price_sale_2 ?? 0),
                'new_sale_price_3' => (float) ($request->new_price_sale_3 ?? $request->new_price_sale_3 ?? 0),
                'unit_price' => (float) ($request->new_price_unit),
                'factor' => (float) ($request->new_factor),
                'quantity' => $request->quantity,
                'discount' => $request->discount_number ?? 0,
                'total' => (float) ($request->quantity * $request->cost - $request->discount_number),
                'unit_id' => (int) ($product->purchase_unit_id),
                'unit_name' => ($product->purchase_unit_name),
            ]);

            // Obtén todos los detalles de la compra temporal actual
            $details = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)->get();
            $totals = $this->totalsService->calculateTotals($details);

            return response()->json(array_merge([
                'status' => 'create.',
                'temp_purchase_id' => $tempPurchaseId
            ], $totals));
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * METODO PARA OBTENER LOS DETALLES DE PRODUCTO AGREGADO EN LA COMPRA TEMPORAL Y MOSTRARLO EN EL MODAL DE EDITAR PRODUCTO
     */
    public function getTempDetail($id)
    {
        // Buscar el detalle por id_temp
        $detail = TempPurchaseDetail::find($id);
        if (!$detail) {
            return response()->json(['error' => 'No encontrado'], 404);
        }

        // Obtener el producto asociado con inventario de sucursal
        $product = Product::getWithDetails()
            ->where('p.id', $detail->product_id)
            ->first();

        if (!$product) {
            \Log::error('Producto no encontrado:', ['product_id' => $detail->product_id]);
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Combinar datos
        $combinedData = [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'barcode' => $product->barcode,
            'stock' => $product->stock, // Ya viene desde branch_inventories.quantity
            'unit_name' => $product->purchase_unit_name ?? null,
            'conversion_factor' => $product->conversion_factor,

            // Precios originales
            'original_purchase_price' => $product->purchase_price,
            'original_sale_price_1' => $product->sale_price_1,
            'original_sale_price_2' => $product->sale_price_2,
            'original_sale_price_3' => $product->sale_price_3,

            // Datos temporales - Aquí está la corrección
            'id_temp' => $detail->id_temp, // Usar id_temp en lugar de temp_purchase_id
            'temp_purchase_id' => $detail->temp_purchase_id, // Mantener temp_purchase_id separado
            'purchase_price' => $detail->purchase_price,
            'factor' => $detail->factor,
            'quantity' => $detail->quantity,
            'discount' => $detail->discount,
            'new_sale_price_1' => $detail->new_sale_price_1,
            'new_sale_price_2' => $detail->new_sale_price_2,
            'new_sale_price_3' => $detail->new_sale_price_3,
            'unit_price' => $detail->unit_price,

            'has_temp_data' => true
        ];

        return response()->json([
            'success' => true,
            'detail' => $combinedData
        ]);
    }

    /**
     * ACTUALIZA LOS DETALLES DE UN PRODUCTO EN LA COMPRA TEMPORAL
     */
    public function update(Request $request, $id)
    {
        try {
            // Validar que el registro exista usando id_temp
            $detail = TempPurchaseDetail::where('id_temp', $id)->first();

            if (!$detail) {
                return response()->json([
                    'error' => 'Registro no encontrado'
                ], 404);
            }

            // Validación de datos
            $request->validate([
                'temp_purchase_id' => 'required',
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|numeric|min:0',
                'cost' => 'required|numeric|min:0',
                'new_factor' => 'required|numeric|min:1',
                'discount_number' => 'required|numeric|min:0',
                'new_price_sale_1' => 'required|numeric|min:0',
                'new_price_sale_2' => 'required|numeric|min:0',
                'new_price_sale_3' => 'nullable|numeric|min:0'
            ]);

            // Calcular valores
            $unitPrice = $request->cost / $request->new_factor;
            $subtotal = $request->quantity * $request->cost;
            $total = $subtotal - $request->discount_number;

            // Actualizar registro
            $detail->quantity = $request->quantity;
            $detail->purchase_price = $request->cost;
            $detail->factor = $request->new_factor;
            $detail->unit_price = $unitPrice;
            $detail->discount = $request->discount_number;
            $detail->total = $total;
            $detail->new_sale_price_1 = $request->new_price_sale_1;
            $detail->new_sale_price_2 = $request->new_price_sale_2;
            $detail->new_sale_price_3 = $request->new_price_sale_3;
            $detail->save();

            // Calcular totales con descuento global
            $details = TempPurchaseDetail::where('temp_purchase_id', $detail->temp_purchase_id)->get();
            $tempPurchase = TempPurchase::find($detail->temp_purchase_id);
            $globalDiscount = $tempPurchase ? $tempPurchase->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $globalDiscount);

            return response()->json([
                'success' => true,
                'message' => 'Registro actualizado correctamente',
                'detail' => $detail->toArray(),
                'totals' => $totals
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar el registro',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * METODO PARA OBTENER LOS DETALLES DE LOS PRODUCTOS DE LA COMPRA TEMPORAL Y MOSTRARLOS EN EL DATATABLE
     */
    public function getProductDetails()
    {
        $query = TempPurchaseDetail::whereHas('tempPurchase', function ($q) {
            $q->where('status', 'abierta')
                ->where('user_id', auth()->id());
        });

        return DataTables::of($query)->make(true);
    }

    /**
     * ELIMINA UN PRODUCTO DE LA COMPRA TEMPORAL Y ACTUALIZA LOS TOTALES
     */
    public function destroy($id)
    {
        // Buscar el detalle por ID
        $detail = TempPurchaseDetail::find($id);

        if (!$detail) {
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Obtener el temp_purchase_id antes de eliminar
        $tempPurchaseId = $detail->temp_purchase_id;

        // Eliminar el detalle
        $detail->delete();

        // Obtener los nuevos detalles restantes
        $details = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)->get();

        // Recalcular los totales
        $totals = $this->totalsService->calculateTotals($details);

        return response()->json(array_merge([
            'status' => 'delete.'
        ], $totals));
    }

    /**
     * METODO PARA CANCELAR LA COMPRA TEMPORAL Y ELIMINAR TODOS LOS DETALLES
     */
    public function cancelPurchase($temp_id)
    {
        try {
            // Contar registros existentes
            $existingCount = TempPurchaseDetail::Where('temp_purchase_id', $temp_id)
                ->count();

            if ($existingCount === 0) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'No hay productos registrados en esta compra.'
                ]);
            }

            // Eliminar los detalles asociados
            TempPurchaseDetail::where('temp_purchase_id', $temp_id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Compra cancelada.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cancelar la compra.'
            ], 500);
        }
    }

    /**
     * METODO PARA ACTUALIZAR EL DESCUENTO GLOBAL DE LA COMPRA TEMPORAL Y RECALCULAR LOS TOTALES
     */
    public function updateDiscount(Request $request)
    {
        try {
            $totals = $this->discountService->applyDiscount(
                (int) $request->temp_id,
                (float) $request->discount
            );
            return response()->json($totals);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al actualizar el descuento.'], 500);
        }
    }

    /**
     * METODO PARA OBTENER LOS DATOS DEL PROVEEDOR EN LA COMPRA TEMPORAL
     */
    public function getDataSupplier($supplierId)
    {
        $supplier = Supplier::find($supplierId);

        if (!$supplier) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        return response()->json([
            'company_name' => $supplier->company_name,
            'representative' => $supplier->representative,
            'phone' => $supplier->phone,
            'email' => $supplier->email,
            'tax_id' => $supplier->tax_id,
            'credit_available' => $supplier->credit_available,
            'credit_limit' => $supplier->credit_limit_granted,
            'credit_days' => $supplier->payment_days_granted,
            'credit_due_date' => $supplier->credit_due_date,
        ]);
    }

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS PROVEEDORES
     ---------------------------------------------------------------*/

    /**
     * METODO PARA MOSTRAR LOS PROVEEDORES EN EL AUTOCOMPLETADO
     */
    public function autoCompleteSuppliers($query)
    {
        $results = Supplier::where('company_name', 'LIKE', '%' . $query . '%')
            ->orWhere('representative', 'LIKE', '%' . $query . '%')
            ->limit(10) // Limita la cantidad de resultados
            ->get([
                'id',
                'company_name',
                'representative',
            ]);

        return response()->json([
            'data' => $results->map(function ($supplier) {
                return [
                    'id' => $supplier->id,
                    'value' => $supplier->company_name . ' - ' . $supplier->representative, // <== Este campo se debe llamar "value"
                ];
            })
        ]);
    }

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR LAS COMPRAS EN ESPERA
     ---------------------------------------------------------------*/

    /**
     * METODO PARA ENVIAR LA COMPRA A ESPERA
     */
    public function setToWaiting(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required'
        ]);

        $tempId = $request->temp_id;

        // Validar si hay registros en la tabla temporal
        $hasDetails = TempPurchaseDetail::where('temp_purchase_id', $tempId)->exists();

        if (!$hasDetails) {
            return response()->json([
                'status' => 'warning',
                'message' => 'No hay productos registrados en esta compra.'
            ], 400);
        }
        $temp = TempPurchase::findOrFail($request->temp_id);
        $temp->status = 'en_espera';
        $temp->supplier_id = $request->supplier_id;
        $temp->save();

        // Crear nueva compra temporal directamente (sin buscar existente)
        $userId = auth()->id();
        $newTemp = TempPurchase::create([
            'user_id' => $userId,
            'status' => 'abierta',
            'session_token' => session()->getId(),
            'supplier_id' => null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Compra enviada a espera.',
            'data' => [
                'new_temp_purchase_id' => $newTemp->id_temp_purchase,
            ]
        ]);
    }

    /**
     * METODO PARA OBTENER LA COMPRA EN ESPERA PARA MOSTRARLAS CONTINUAR CON LA COMPRA
     */
    public function getPurchaseOnWaitingList(Request $request)
    {

        $tempId = $request->temp_id;
        $tempActualId = $request->temp_actual_id;

        // Validar los parametros enviados por la funcion ajax
        if (!$tempId || !$tempActualId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Parámetros requeridos faltantes.'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Verificar que la compra a retormar existe y está en espera
            $tempRetomar = TempPurchase::where('id_temp_purchase', $tempId)
                ->where('status', 'en_espera')
                ->first();

            if (!$tempRetomar) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'La compra seleccionada no está disponible.'
                ], 404);
            }

            // Verificar que la compra actual existe
            $tempActual = TempPurchase::where('id_temp_purchase', $tempActualId)->first();

            if (!$tempActual) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Compra actual no encontrada.'
                ], 404);
            }

            // Validar si la compra actual tiene detalles
            $hasDetails = TempPurchaseDetail::where('temp_purchase_id', $tempActualId)->exists();

            if (!$hasDetails) {
                // Si no hay detalles, eliminar la compra actual
                $tempActual->delete();
            } else {
                // Si hay detalles, cambiar estado a 'en_espera'
                $tempActual->status = 'en_espera';
                $tempActual->supplier_id = $request->supplier_id;
                $tempActual->save();
            }

            // Cambiar el estado de la compra que se quiere retomar a 'abierto'
            $tempRetomar->status = 'abierta';
            $tempRetomar->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'temp_purchase_id' => $tempRetomar->id_temp_purchase,
                    'supplier_id' => $tempRetomar->supplier_id
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error en getPurchaseOnWaitingList: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error interno del servidor.'
            ], 500);
        }
    }

    /**
     * METODO PARA MOSTRAR LAS COMPRAS EN ESPERA EN EL DATATABLE
     */
    public function getPendingPurchases()
    {
        try {
            $query = TempPurchase::getPendingPurchases();
            return DataTables::of($query)->make(true);
        } catch (\Exception $e) {
            \Log::error('Error in getPendingPurchases: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /** 
     * METODO PARA PROCESAR LA COMPRA Y GUARDARLA EN LA BASE DE DATOS 
     */
    public function processPurchases(Request $request)
    {
        try {
            $payload = $request->all();

            $data = $payload['data'] ?? [];
            $method = $payload['method'] ?? null;
            $date = $payload['date'] ?? now()->toDateString();

            $tempId = isset($payload['temp_id']) ? (int)$payload['temp_id'] : null;

            Log::info('processPurchases called with payload: ', $payload);

            $result = app(PurchasesProcessingService::class)
                ->process($data, $method, $tempId, $date);

            if (isset($result['error'])) {
                return response()->json(['status' => 'error', 'message' => $result['error']], 400);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Compra procesada correctamente.',
                'new_temp_purchase_id' => $result['new_temp_purchase_id'] ?? null,
                'purchase_id' => $result['purchase_id'] ?? null,

            ]);
        } catch (\Exception $e) {
            \Log::error('Error en processPurchases: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la compra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * METODO PARA OBTENER LOS TOTALES DE LA COMPRA TEMPORAL, INCLUYENDO EL DESCUENTO GLOBAL
     */
    public function getTotals($temp_purchase_id)
    {
        $details = TempPurchaseDetail::where('temp_purchase_id', $temp_purchase_id)->get();

        $tempPurchase = TempPurchase::find($temp_purchase_id);
        $discount = $tempPurchase ? $tempPurchase->discount : 0;

        $totals = $this->totalsService->calculateTotals($details, $discount);

        return response()->json($totals);
    }

    public function show() {}
}
