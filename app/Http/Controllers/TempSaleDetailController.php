<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TempSaleDetail;
use App\Models\TempSale;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\BranchInventories;
use Yajra\DataTables\Facades\DataTables;
use App\Services\TotalsCalculatorService;
use App\Services\InventoryService;
use App\Services\Sales\SalesDiscountService;
use App\Services\Sales\SalesProcessingService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\Pdf\ReceiptPdfService;

class TempSaleDetailController extends Controller
{

    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
        private SalesDiscountService $salesDiscountService,
        private ReceiptPdfService $receiptPdfService,
    ) {}

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS PRODUCTOS
     ---------------------------------------------------------------*/

    /**
     * METODO PARA BUSCAR POR EL CODIGO DE BARRAS EN EL AUTOCOMPLETADO
     */
    public function findByBarcode($barcode)
    {
        $product = Product::where('barcode', $barcode)->first();

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Producto no encontrado']);
        }

        return response()->json([
            'success' => true,
            'id' => $product->id
        ]);
    }
    /**
     * METODO PARA MOSTRAR LOS PRODUCTOS EN EL AUTOCOMPLETADO
     */
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

    /**
     * METODO PARA AÑADIR UN PRODUCTO A LA VENTA TEMPORAL
     */
    public function addProductToSalesDetails(Request $request)
    {
        try {
            $productId = $request->input('product_id');
            $tempSaleId = $request->input('temp_sale_id');

            $productDetails = Product::getWithDetails()->where('p.id', $productId)->first();

            if (!$productDetails) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Producto no encontrado.'
                ], 404);
            }

            $productStock = BranchInventories::where('product_id', $productId)->first();

            // Verificar stock ANTES de agregar, pero sin detener el proceso
            $stockWarning = null;

            if (!$productStock || $productStock->quantity <= 0) {
                $stockWarning = [
                    'status'    => 'error',
                    'message' => "El producto no tiene stock disponible.",
                ];
            }

            $productInTempSale = TempSaleDetail::where('temp_sale_id', $tempSaleId)
                ->where('product_id', $productId)
                ->first();

            if ($productInTempSale) {
                // Si el producto ya existe en la venta temporal, incrementar la cantidad
                $productInTempSale->quantity += 1;
                $productInTempSale->total = $productInTempSale->price * $productInTempSale->quantity;
                $productInTempSale->save();

                // Obtener todos los detalles de la venta temporal actual
                $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
                $totals = $this->totalsService->calculateTotals($details);

                return response()->json(array_merge([
                    'status' => 'update',
                    'temp_sale_id' => $tempSaleId
                ], $totals));
            }

            $tempSaleDetail = new TempSaleDetail();
            $tempSaleDetail->temp_sale_id = $tempSaleId;
            $tempSaleDetail->product_id = $productId;
            $tempSaleDetail->barcode = $productDetails->barcode;
            $tempSaleDetail->product_name = $productDetails->name;
            $quantity = $tempSaleDetail->quantity = 1;
            $tempSaleDetail->price = $productDetails->sale_price_1;
            $tempSaleDetail->factor = $productDetails->conversion_factor;
            $tempSaleDetail->discount = 0;
            $tempSaleDetail->total = $productDetails->sale_price_1 * $quantity;
            $tempSaleDetail->unit_id = (int) ($productDetails->sale_unit_id);
            $tempSaleDetail->unit_name = ($productDetails->sale_unit_name);

            $tempSaleDetail->save();

            // Obtén todos los detalles de la compra temporal actual
            $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
            $tempSale = TempSale::find($tempSaleId);
            $discount = $tempSale ? $tempSale->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $discount);

            return response()->json(array_merge([
                'status' => 'success',
                'temp_sale_id' => $tempSaleId,
                'stock_warning' => $stockWarning,
            ], $totals));
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * METODO PARA OBTENER LOS DETALLES DE LOS PRODUCTOS EN LA VENTA TEMPORAL
     */
    public function getProductDetails()
    {
        $query = TempSaleDetail::whereHas('tempSale', function ($q) {
            $q->where('status', 'abierta')
                ->where('user_id', auth()->id());
        });

        return DataTables::of($query)->make(true);
    }

    /**
     * METODO PARA ELIMINAR UN PRODUCTO DE LA VENTA TEMPORAL
     */
    public function removeProductFromTempSale(Request $request)
    {
        $idTempDetail = $request->input('id_temp_sale_detail');
        $tempSaleId = $request->input('temp_sale_id');

        $productInTempSale = TempSaleDetail::where('temp_sale_id', $tempSaleId)
            ->where('id_temp_sale_detail', $idTempDetail)
            ->first();

        if ($productInTempSale) {
            $productInTempSale->delete();

            // Obtener todos los detalles de la venta temporal actual
            $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
            $tempSale = TempSale::find($tempSaleId);
            $discount = $tempSale ? $tempSale->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $discount);

            return response()->json(array_merge([
                'status' => 'delete',
                'temp_sale_id' => $tempSaleId
            ], $totals));
        }

        return response()->json(['success' => false, 'message' => 'Producto no encontrado en la venta temporal']);
    }

    /**
     * METODO PARA EDITAR EL NOMBRE DE UN PRODUCTO EN LA VENTA TEMPORAL
     */
    public function editProductName(Request $request)
    {
        $idTempDetail = $request->input('id_temp_sale_detail');
        $newName = $request->input('new_name');

        $productInTempSale = TempSaleDetail::where('id_temp_sale_detail', $idTempDetail)->first();

        if ($productInTempSale) {
            $productInTempSale->product_name = $newName;
            $productInTempSale->save();

            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Producto no encontrado en la venta temporal']);
    }

    /**
     * METODO PARA EDITAR LA CANTIDAD DE UN PRODUCTO EN LA VENTA TEMPORAL
     */
    public function editProductQuantity(Request $request)
    {
        $idTempDetail = $request->input('id_temp_sale_detail');
        $tempSaleId = $request->input('temp_sale_id');
        $newQuantity = $request->input('new_quantity');

        $productInTempSale = TempSaleDetail::where('id_temp_sale_detail', $idTempDetail)->first();

        if ($productInTempSale) {
            $productInTempSale->quantity = $newQuantity;
            $productInTempSale->total = ($productInTempSale->price * $newQuantity) - $productInTempSale->discount;
            $productInTempSale->save();

            // Obtener todos los detalles de la venta temporal actual
            $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
            $tempSale = TempSale::find($tempSaleId);
            $discount = $tempSale ? $tempSale->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $discount);

            return response()->json(array_merge(['success' => true], $totals));
        }

        return response()->json(['success' => false, 'message' => 'Producto no encontrado en la venta temporal']);
    }

    /**
     * METODO PARA CONSULTAR EL PRECIO DE UN PRODUCTO EN LA VENTA TEMPORAL
     */
    public function checkProductPrice($product_id)
    {
        $product = Product::find($product_id);

        if (!$product) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Producto no encontrado'
            ], 404);
        }

        // Estructura los precios como array filtrado — excluye los que sean 0 o null
        $prices = collect([
            ['label' => 'Precio 1', 'key' => 'price_1', 'value' => $product->sale_price_1],
            ['label' => 'Precio 2', 'key' => 'price_2', 'value' => $product->sale_price_2],
            ['label' => 'Precio 3', 'key' => 'price_3', 'value' => $product->sale_price_3],
        ])->filter(fn($price) => !empty($price['value']) && $price['value'] > 0)->values();

        return response()->json([
            'status'  => 'success',
            'prices'  => $prices,
        ]);
    }

    /**
     * METODO PARA ACTUALIZAR EL PRECIO DE UN PRODUCTO EN LA VENTA TEMPORAL
     */
    public function updatePrice(Request $request)
    {
        $idTempDetail = $request->input('id_temp_sale_detail');
        $tempSaleId = $request->input('temp_sale_id');
        $newPrice = $request->input('new_price');

        $productInTempSale = TempSaleDetail::where('id_temp_sale_detail', $idTempDetail)->first();

        if ($productInTempSale) {
            $productInTempSale->price = $newPrice;
            $productInTempSale->total = ($newPrice * $productInTempSale->quantity) - $productInTempSale->discount;
            $productInTempSale->save();

            // Obtener todos los detalles de la venta temporal actual
            $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
            $tempSale = TempSale::find($tempSaleId);
            $discount = $tempSale ? $tempSale->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $discount);

            return response()->json(array_merge(['success' => true], $totals));
        }

        return response()->json(['success' => false, 'message' => 'Producto no encontrado en la venta temporal']);
    }

    /**
     * METODO PARA EDITAR EL DESCUENTO DE UN PRODUCTO EN LA VENTA TEMPORAL
     */
    public function editProductDiscount(Request $request)
    {
        $idTempDetail = $request->input('id_temp_sale_detail');
        $tempSaleId = $request->input('temp_sale_id');
        $newDiscount = $request->input('new_discount');

        $productInTempSale = TempSaleDetail::where('id_temp_sale_detail', $idTempDetail)->first();

        if ($productInTempSale) {
            $productInTempSale->discount = $newDiscount;
            $productInTempSale->total = ($productInTempSale->price * $productInTempSale->quantity) - $newDiscount;
            $productInTempSale->save();

            // Obtener todos los detalles de la venta temporal actual
            $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
            $tempSale = TempSale::find($tempSaleId);
            $discount = $tempSale ? $tempSale->discount : 0;
            $totals = $this->totalsService->calculateTotals($details, $discount);

            return response()->json(array_merge(['success' => true], $totals));
        }

        return response()->json(['success' => false, 'message' => 'Producto no encontrado en la venta temporal']);
    }

    public function getTotals($temp_sale_id)
    {
        $details = TempSaleDetail::where('temp_sale_id', $temp_sale_id)->get();

        $tempSale = TempSale::find($temp_sale_id);
        $discount = $tempSale ? $tempSale->discount : 0;

        $totals = $this->totalsService->calculateTotals($details, $discount);

        return response()->json($totals);
    }
    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS CLIENTES
     ---------------------------------------------------------------*/

    /**
     * METODO PARA MOSTRAR LOS CLIENTES EN EL AUTOCOMPLETADO
     */
    public function autoCompleteCustomers($query)
    {
        $customers = Customer::where('name', 'LIKE', "%$query%")
            ->orWhere('phone', 'LIKE', "%$query%")
            ->where('status', 1)
            ->limit(10)
            ->get([
                'id',
                'name'
            ]);

        return response()->json([
            'data' => $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'value' => $customer->name
                ];
            })
        ]);
    }

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR LA VENTA EN GENERAL
     ---------------------------------------------------------------*/

    /**
     * METODO PARA OBTENER LOS DATOS DEL CLIENTE EN LA VENTA TEMPORAL
     */
    public function getDataCustomer($customerId)
    {
        $customer = Customer::find($customerId);

        if (!$customer) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        return response()->json([
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'tax_id' => $customer->tax_id,
            'credit_available' => $customer->credit_available,
            'default_credit_days' => $customer->default_credit_days,
            'credit_due_date' => $customer->credit_due_date,
            'credit_limit' => $customer->credit_limit,

        ]);
    }

    /**
     * METODO PARA CANCELAR LA VENTA TEMPORAL
     */
    public function cancelSale($temp_id)
    {
        try {
            // Contar registros existentes
            $existingCount = TempSaleDetail::where('temp_sale_id', $temp_id)
                ->count();

            if ($existingCount === 0) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'No hay productos registrados en esta venta.'
                ]);
            }

            // Eliminar los detalles asociados
            TempSaleDetail::where('temp_sale_id', $temp_id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Venta cancelada.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cancelar la venta.'
            ], 500);
        }
    }

    /**
     * METODO PARA ACTUALIZAR EL DESCUENTO DE LA VENTA TEMPORAL
     */
    public function updateDiscount(Request $request)
    {
        try {
            $totals = $this->salesDiscountService->applyDiscount(
                $request->temp_sale_id,
                (float) $request->discount
            );
            return response()->json($totals);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al actualizar el descuento.'], 500);
        }
    }

    /**
     * METODO PARA PROCESAR EL PAGO DE LA VENTA TEMPORAL
     */
    public function processPayment(Request $request)
    {
        try {
            $payload = $request->all();

            $data   = $payload['data'];
            $method = $payload['method'];
            $date   = $payload['sale_date'] ?? now()->toDateString();

            $tempId = $payload['temp_id'] ?? $data['temp_id'];

            Log::info('Processing payment', $payload);

            $result = app(SalesProcessingService::class)
                ->process($data, $method, $tempId, $date);

            if (isset($result['error'])) {
                return response()->json(['status' => 'error', 'message' => $result['error']], 400);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Venta procesada correctamente.',
                'new_temp_sale_id' => $result['new_temp_sale_id'] ?? null,
                'sale_id' => $result['sale_id'] ?? null,

            ]);
        } catch (\Exception $e) {
            Log::error('processPayment error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR LAS VENTAS EN ESPERA
     ---------------------------------------------------------------*/

    /**
     * METODO PARA ENVIAR LA VENTA A ESPERA
     */
    public function sendToWaiting(Request $request)
    {
        try {
            // Validar que la venta temporal tenga productos antes de enviarla a espera
            $hasDetails = TempSaleDetail::where('temp_sale_id', $request->temp_id)->exists();
            if (!$hasDetails) {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'No hay productos registrados en esta venta.'
                ], 400);
            }

            $tempSale = TempSale::where('id_temp_sale', $request->temp_id)->first();
            $tempSale->customer_id = $request->customer_id; // Asignar el cliente seleccionado a la venta temporal
            $tempSale->status = 'en_espera';
            $tempSale->save();

            // Crear nueva venta temporal directamente (sin buscar existente)
            $userId = auth()->id();
            $newTemp = TempSale::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
                'customer_id' => null,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Venta enviada a espera.',
                'data' => [
                    'new_temp_sale_id' => $newTemp->id_temp_sale,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al enviar la venta a espera.'], 500);
        }
    }

    /**
     * METODO PARA OBTENER LAS VENTAS EN ESPERA PARA MOSTRARLAS EN EL DATATABLE
     */
    public function getSaleOnHold(Request $request)
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

            // Verificar que la venta a retomar existe y está en espera
            $tempRetomar = TempSale::where('id_temp_sale', $tempId)
                ->where('status', 'en_espera')
                ->first();

            if (!$tempRetomar) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'La venta seleccionada no está disponible.'
                ], 404);
            }

            // Verificar que la venta actual existe
            $tempActual = TempSale::where('id_temp_sale', $tempActualId)->first();

            if (!$tempActual) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Venta actual no encontrada.'
                ], 404);
            }

            // Validar si la venta actual tiene detalles
            $hasDetails = TempSaleDetail::where('temp_sale_id', $tempActualId)->exists();

            if (!$hasDetails) {
                // Si no hay detalles, eliminar la venta actual
                $tempActual->delete();
            } else {
                // Si hay detalles, cambiar estado a 'en_espera'
                $tempActual->status = 'en_espera';
                $tempActual->customer_id = $request->customer_id;
                $tempActual->save();
            }

            // Cambiar el estado de la venta que se quiere retomar a 'abierta'
            $tempRetomar->status = 'abierta';
            $tempRetomar->save();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'temp_sale_id' => $tempRetomar->id_temp_sale,
                    'customer_id' => $tempRetomar->customer_id
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getSaleOnHold: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * METODO PARA MOSTRAR LAS VENTAS EN ESPERA EN EL DATATABLE
     */
    public function getPendingSales()
    {
        try {
            $query = TempSale::getPendingSales();
            return DataTables::of($query)->make(true);
        } catch (\Exception $e) {
            \Log::error('Error in getPendingSales: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function preview(int $saleId, int $voucherId)
    {
        $data = $this->receiptPdfService->getSaleDataForView($saleId);

        return view('receipts.ticket', $data); // Renderiza directo, sin mPDF
    }

    public function printVoucher(int $saleId, int $voucherId)
    {
        \Log::info("Generating voucher for sale ID: $saleId, voucher ID: $voucherId");
        try {

            return $this->receiptPdfService->generate($saleId, $voucherId);
        } catch (\Throwable $e) {

            \Log::error('Error al generar comprobante: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo generar el comprobante.'
            ], 500);
        }
    }
    public function show() {}
}
