<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TempSaleDetail;
use App\Models\TempSale;
use App\Models\Product;
use App\Models\Customer;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\Log;

class TempSaleDetailController extends Controller
{
    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS PRODUCTOS
     ---------------------------------------------------------------*/

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

            $tempSaleDetail = new TempSaleDetail();
            $tempSaleDetail->temp_sale_id = $tempSaleId;
            $tempSaleDetail->product_id = $productId;
            $tempSaleDetail->barcode = $productDetails->barcode;
            $tempSaleDetail->product_name = $productDetails->product_name;
            $quantity = $tempSaleDetail->quantity = 1;
            $tempSaleDetail->price = $productDetails->sale_price_1;
            $tempSaleDetail->factor = $productDetails->conversion_factor;
            $tempSaleDetail->discount = 0;
            $tempSaleDetail->total = $productDetails->sale_price_1 * $quantity;
            $tempSaleDetail->unit_id = (int) ($productDetails->sale_unit_id);
            $tempSaleDetail->unit_name = ($productDetails->sale_unit_name);

            $tempSaleDetail->save();

            return response()->json(['success' => true]);
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
}
