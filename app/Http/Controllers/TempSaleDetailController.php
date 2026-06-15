<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TempSaleDetail;
use App\Models\TempSale;
use App\Models\Product;
use App\Models\Customer;
use Yajra\DataTables\Facades\DataTables;
use App\Services\TotalsCalculatorService;
use App\Services\InventoryService;
use App\Services\Sales\SalesDiscountService;
use Illuminate\Support\Facades\Log;

class TempSaleDetailController extends Controller
{

    public function __construct(
        private TotalsCalculatorService $totalsService,
        private InventoryService $inventoryService,
        private SalesDiscountService $salesDiscountService
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
                return response()->json(['success' => false, 'message' => 'Producto no encontrado']);
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
                'status' => 'create',
                'temp_sale_id' => $tempSaleId
            ], $totals));

            return response()->json(['success' => true,]);
        } catch (\Exception $e) {
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
}
