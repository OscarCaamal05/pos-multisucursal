<?php

namespace App\Http\Controllers;

use App\Models\TempPurchaseDetail;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\TempPurchase;
use App\Models\purchases;
use App\Models\purchases_detail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;
use Yajra\DataTables\Facades\DataTables;

class TempPurchaseDetailController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {}

    public function getDataProduct($productId)
    {
        try {
            $product = Product::with('purchaseUnit')->find($productId);

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
                'product_name' => $product->product_name,
                'barcode' => $product->barcode,
                'stock' => $product->stock,
                'unit_name' => $product->purchaseUnit->name ?? '',
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

    public function addProduct(Request $request)
    {

        try {
            \Log::info('Inicio de actualización de detalle de compra:', [
                'request_data' => $request->all()
            ]);

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
                'product_name' => $product->product_name,
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
            $totals = $this->calculateTotals($details);

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

    public function getProductDetails()
    {
        $query = TempPurchaseDetail::whereHas('tempPurchase', function ($q) {
            $q->where('status', 'abierta')
                ->where('user_id', auth()->id());
        });

        return DataTables::of($query)->make(true);
    }

    /**
     * Display the specified resource.
     */
    public function show($supplierId)
    {
        $supplier = Supplier::find($supplierId);

        if (!$supplier) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }
        $credit_available = round($supplier->credit_available - $supplier->credit, 2);
        return response()->json([
            'company_name' => $supplier->company_name,
            'representative' => $supplier->representative,
            'phone' => $supplier->phone,
            'email' => $supplier->email,
            'rfc' => $supplier->rfc,
            'credit_available' => $credit_available,
            'credit_limit' => $supplier->credit_available,
            'credit_days' => $supplier->credit_terms,
            'credit_due_date' => $supplier->credit_due_date,
        ]);
    }

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
     * Show the form for editing the specified resource.
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
     * Update the specified resource in storage.
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
            $totals = $this->calculateTotals($details, $globalDiscount);

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
     * Remove the specified resource from storage.
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
        $totals = $this->calculateTotals($details);

        return response()->json(array_merge([
            'status' => 'delete.'
        ], $totals));
    }

    /**
     *  PROCESAR LA COMPRA 
     */
    public function processPurchases(Request $request)
    {
        // Obteniendo el ID del usuario autenticado 
        $userId = auth()->id();
        $sessionToken = session()->getId();

        // Desglozando el request en diferentes variables
        $method = $request->input('method'); // payment-cash o payment-credit
        $data = $request->input('data');

        // Formateando las fechas al formato Y-m-d
        $date = \Carbon\Carbon::createFromFormat('d M, Y', $data['date'])->format('Y-m-d');

        try {

            DB::beginTransaction();

            // Verificar que exista una compra temporal abierta para el usuario y sesión actual
            $tempPurchase = TempPurchase::where('id_temp_purchase', $request->temp_id)
                ->where('user_id', $userId)
                ->where('status', 'abierta')
                ->first();

            if (!$tempPurchase) {
                throw new Exception('No se encontró una compra temporal válida para procesar.');
            }

            // Obtener todos los detalles de la compra temporal
            $tempDetails = TempPurchaseDetail::where('temp_purchase_id', $request->temp_id)->get();

            if ($tempDetails->isEmpty()) {
                throw new Exception('No hay productos registrados en esta compra.');
            }

            // OPCIONAL: Validar el stock y precio actual

            // Calcular los totales de la compra
            $discount = $tempPurchase->discount ?? 0;
            $totals = $this->calculateTotals($tempDetails, $discount);

            // Calcular el monto pagado según el método
            $amountPaid = 0;
            if ($method === 'payment-box') {
                $amountPaid = $data['amount_paid']; // Suma de todos los métodos de pago
            } elseif ($method === 'payment-credit') {
                $amountPaid = $data['credit_details']['current_credit'] ?? 0; // Anticipo del crédito
            }

            // Registrar la compra definitiva
            $purchase = purchases::create([
                'user_id' => $userId,
                'supplier_id' => $data['id_supplier'],
                'voucher_id' => $data['id_voucher'],
                'document_id' => $data['id_document'],
                'purchase_date' => $date,
                'invoice_number' => $data['invoice_number'],
                'amount_paid' => $amountPaid,
                'subtotal' => $totals['total_siva'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'total_amount' => $totals['total'],
                'status' => 'procesado',
                'is_fully_paid' => $request->method === 'payment-credit' ? false : true,
                'notes' => $request->notes ?? null,
            ]);

            // Registrar los tipos de pagos 
            if ($method === 'payment-box') {
                // Pago al contado - múltiples métodos
                foreach ($data['payment_details'] as $type => $amount) {
                    if ((float)$amount > 0) {
                        DB::table('payment_methods')->insert([
                            'transaction_id' => $purchase->id,
                            'transaction_type' => 'purchase',
                            'payment_method' => $type,
                            'amount' => $amount,
                            'reference' => $data['reference'] ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            } elseif ($method === 'payment-credit') {
                // Obtener el monto del crédito desde credit_details
                $creditAmount = $data['credit_details']['current_credit'] ?? 0;
                $creditDays = $data['credit_details']['credit_days'] ?? 0;
                $dueDate = $data['credit_details']['due_date'] ?? null;
                
                // Pago a crédito - usar misma tabla para consistencia
                DB::table('payment_methods')->insert([
                    'transaction_id' => $purchase->id,
                    'transaction_type' => 'purchase',
                    'payment_method' => 'credito',
                    'amount' => $creditAmount,
                    'reference' => "Crédito {$creditDays} días - Vence: {$dueDate}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Actualizar el crédito del proveedor
                $supplier = Supplier::find($data['id_supplier']);
                if ($supplier) {
                    // El monto total de la compra se suma al crédito del proveedor
                    $supplier->credit += $totals['total'];
                    $supplier->credit_due_date = $dueDate;
                    $supplier->credit_terms = $creditDays;  
                    $supplier->save();
                }
            }

            // Crear los detalles de la compra definitiva
            foreach ($tempDetails as $tempDetail) {
                $quantity = (float) $tempDetail->quantity * (float) $tempDetail->factor;

                // Crear el detalle de la compra
                purchases_detail::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => (int) $tempDetail->product_id,
                    'product_name' => $tempDetail->product_name,
                    'product_code' => $tempDetail->barcode,
                    'quantity' => (float) $tempDetail->quantity,
                    'unit_cost' => (float) $tempDetail->purchase_price,
                    'discount' => (float) $tempDetail->discount,
                    'subtotal' => (float) $tempDetail->quantity * (float) $tempDetail->purchase_price,
                    'total' => (float) $tempDetail->total,
                ]);

                // Actualizar datos del producto si hay nuevos precios
                Product::where('id', $tempDetail->product_id)
                    ->update([
                        // Valida si hay una nuevo valor mayor a 0, si no, mantiene el valor actual de 
                        // la columna por ESO LA FUNCION DB::raw
                        'sale_price_1' => $tempDetail->new_sale_price_1 > 0 ? $tempDetail->new_sale_price_1 : DB::raw('sale_price_1'),
                        'sale_price_2' => $tempDetail->new_sale_price_2 > 0 ? $tempDetail->new_sale_price_2 : DB::raw('sale_price_2'),
                        'sale_price_3' => $tempDetail->new_sale_price_3 > 0 ? $tempDetail->new_sale_price_3 : DB::raw('sale_price_3'),
                        'purchase_price' => $tempDetail->purchase_price > 0 ? $tempDetail->purchase_price : DB::raw('purchase_price'),
                        'unit_price' => $tempDetail->unit_price > 0 ? $tempDetail->unit_price : DB::raw('unit_price'),
                        'conversion_factor' => $tempDetail->factor > 0 ? $tempDetail->factor : DB::raw('conversion_factor'),
                    ]);

                // Actualizar el inventario del producto
                $this->updateProductStock($tempDetail->product_id, $quantity);

                // Registrar los movimientos del inventario
                $this->registerInventoryMovement(
                    $tempDetail->product_id,
                    $tempDetail->quantity,
                    $tempDetail->purchase_price,
                    $tempDetail->unit_price,
                    $tempDetail->total,
                    $purchase->id
                );
            }

            // Limpiar tablas temporales
            TempPurchaseDetail::where('temp_purchase_id', $tempPurchase->id_temp_purchase)->delete();
            $tempPurchase->delete();

            // Crear un nuevo TempPurchase para la siguiente compra usando la función existente
            $tempPurchaseController = new \App\Http\Controllers\TempPurchaseController();
            $tempResponse = $tempPurchaseController->getOrCreateTempPurchase();
            $newTempPurchaseData = $tempResponse->getData();

            DB::commit();

            return response()->json([
                'success' => true,
                'purchase_id' => $purchase->id,
                'new_temp_purchase_id' => $newTempPurchaseData->temp->id_temp_purchase,
            ]);
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la compra: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * METODO PARA ACTUALIZAR EL STOCK DEL PRODUCTO
     */
    private function updateProductStock($productId, $quantity)
    {
        $product = Product::find($productId);
        if ($product) {
            $product->stock += $quantity;
            $product->save();
        }
    }

    /**
     * METODO PARA REGISTRAR EL MOEVIMIENTO DE INVENTARIO
     */
    private function registerInventoryMovement($productId, $quantity, $unitPurchasePrice, $unitSalePrice, $totalCost, $referenceId = null)
    {
        DB::table('kardex')->insert([
            'product_id' => $productId,
            'movement_type' => 'entrada',
            'movement_reason' => 'compra',
            'reference_type' => null,
            'reference_id' => $referenceId,
            'quantity' => $quantity,
            'unit_purchase_price' => $unitPurchasePrice,
            'unit_sale_price' => $unitSalePrice,
            'total_cost' => $totalCost,
            'balance_quantity' => $this->getProductCurrentStock($productId, $quantity),
            'balance_unit_cost' => $unitPurchasePrice,
            'balance_total_cost' => $this->calculateBalanceTotalCost($productId, $quantity, $totalCost),
            'movement_date' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * METODO PARA OBTENER EL STOCK ACTUAL DEL PRODUCTO
     */
    private function getProductCurrentStock($productId, $addedQuantity)
    {
        $product = Product::find($productId);
        return $product ? ($product->stock + $addedQuantity) : $addedQuantity;
    }

    /**
     * METODO PARA CALCULAR EL COSTO TOTAL DEL BALANCE DEL PRODUCTO
     */
    private function calculateBalanceTotalCost($productId, $newQuantity, $newTotalCost)
    {

        // Obtener el ultmo registro del kardex para el producto
        $lastKardexEntry = DB::table('kardex')
            ->where('product_id', $productId)
            ->orderByDesc('id')
            ->first();

        if (!$lastKardexEntry) {
            return $newTotalCost; // Si no hay entradas previas, el costo total del balance es el costo total agregado
        }

        // Calcular el promedio ponderado
        $previousBalance = $lastKardexEntry->balance_total_cost ?? 0;
        $previousCost = $lastKardexEntry->balance_quantity ?? 0;

        $totalQuantity = $previousCost + $newQuantity;
        $totalCost = $previousBalance + $newTotalCost;

        return $totalQuantity > 0 ? $totalCost : 0;
    }

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

    public function autoCompleteProducts($query)
    {
        $results = Product::where('product_name', 'LIKE', '%' . $query . '%')
            ->orWhere('barcode', 'LIKE', '%' . $query . '%')
            ->limit(10) // Limita la cantidad de resultados
            ->get([
                'id',
                'product_name',
                'barcode',
            ]);

        return response()->json([
            'data' => $results->map(function ($product) {
                return [
                    'id' => $product->id,
                    'value' => $product->product_name . ' - ' . $product->barcode, // <== Este campo se debe llamar "value"
                ];
            })
        ]);
    }
    public function getTotals($temp_purchase_id)
    {
        $details = TempPurchaseDetail::where('temp_purchase_id', $temp_purchase_id)->get();

        // Obtener el descuento de la tabla temp_purchases
        $tempPurchase = TempPurchase::find($temp_purchase_id);
        $discount = $tempPurchase ? $tempPurchase->discount : 0;
        // Obtener los valores de totales de la compra
        $totals = $this->calculateTotals($details, $discount);
        return response()->json($totals);
    }

    public function getTempDetail($id)
    {
        // Buscar el detalle por id_temp
        $detail = TempPurchaseDetail::find($id);
        if (!$detail) {
            \Log::error('Detalle temporal no encontrado:', ['id_temp' => $id]);
            return response()->json(['error' => 'No encontrado'], 404);
        }

        // Obtener el producto asociado
        $product = Product::with('purchaseUnit')->find($detail->product_id);
        if (!$product) {
            \Log::error('Producto no encontrado:', ['product_id' => $detail->product_id]);
            return response()->json(['error' => 'Producto no encontrado'], 404);
        }

        // Combinar datos
        $combinedData = [
            'product_id' => $product->id,
            'product_name' => $product->product_name,
            'barcode' => $product->barcode,
            'stock' => $product->stock,
            'unit_name' => $product->purchaseUnit ? $product->purchaseUnit->name : null,
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

        \Log::info('Datos del detalle recuperados:', [
            'id_temp' => $detail->id_temp,
            'temp_purchase_id' => $detail->temp_purchase_id,
            'combined_data' => $combinedData
        ]);

        return response()->json([
            'success' => true,
            'detail' => $combinedData
        ]);
    }

    private function calculateTotals($details, $discount = 0)
    {
        $sub_total = round($details->sum('total'), 2);
        $iva = 16; // Cambiar cuando ya este la tabla configuración

        // Aplicar el descuento global al subtotal si existe 
        $dicount_applied = round($discount, 2);
        $sub_total_discount = round($sub_total - $dicount_applied, 2);

        // Calcular el impuesto sobre el subtotal con descuento
        $tax = round($sub_total_discount * ($iva / 100), 2);
        $total_siva = round($sub_total_discount - $tax, 2);
        $total = number_format($total_siva + $tax, 2);

        return [
            'sub_total' => $sub_total,
            'discount' => $dicount_applied,
            'sub_total_discount' => $sub_total_discount,
            'tax' => $tax,
            'total_siva' => $total_siva,
            'total' => $total,
        ];
    }

    public function updateDiscount(Request $request)
    {
        try {
            $tempPurchase = TempPurchase::findOrFail($request->temp_id);
            $tempPurchase->discount = (float) $request->discount;
            $tempPurchase->save();

            // Recalcular los totales
            $details = TempPurchaseDetail::where('temp_purchase_id', $request->temp_id)->get();
            $totals = $this->calculateTotals($details, $request->discount);
            return response()->json($totals);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el descuento.'
            ], 500);
        }
    }

    // Función helper para obtener el temp_purchase_id actual
    private function getCurrentTempPurchaseId()
    {
        return TempPurchase::where('user_id', auth()->id())
            ->where('status', 'abierta')
            ->value('id_temp_purchase');
    }
}
