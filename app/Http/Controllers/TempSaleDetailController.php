<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\tempSaleDetail;
use App\Models\TempSale;
use App\Models\Product;
use App\Models\Customer;

class TempSaleDetailController extends Controller
{
    /*------------------------------------------------------------
     * METODOS PARA GESTIONAR A LOS CLIENTES
     ---------------------------------------------------------------*/

    /**
     * METODO PARA MOSTRAR LOS CLIENTES EN EL AUTOCOMPLETADO
     */

    public function autoCompleteCustomers($query)
    {
        $customers = Customer::where('full_name', 'LIKE', "%$query%")
            ->orWhere('phone', 'LIKE', "%$query%")
            ->where('status', 1)
            ->limit(10)
            ->get([
                'id',
                'full_name'
            ]);

        return response()->json([
            'data' => $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'value' => $customer->full_name
                ];
            })
        ]);
    }

    /**
     * METODO PARA OBTENER LOS DATOS DEL CLIENTE EN LA VENTA TEMPORAL
     */
    public function getDataCustomer($supplierId)
    {
        $customer = Customer::find($supplierId);

        if (!$customer) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $credit_available = round($customer->credit_available - $customer->credit, 2);
        return response()->json([
            'full_name' => $customer->full_name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'rfc' => $customer->rfc,
            'credit_available' => $credit_available,
            'credit_limit' => $customer->credit_available,
            'credit_days' => $customer->credit_terms,
            'credit_due_date' => $customer->credit_due_date,
        ]);
    }
}
