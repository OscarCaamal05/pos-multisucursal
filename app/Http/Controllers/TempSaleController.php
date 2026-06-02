<?php

namespace App\Http\Controllers;

use App\Models\TempSale;
use App\Models\TypesDocuments;
use App\Models\TypesReceipts;
use App\Models\Category;
use App\Models\Department;
use App\Models\Taxes;
use App\Models\Unit;

use Illuminate\Http\Request;

class TempSaleController extends Controller
{
    /**
     * FUNCION PARA MOSTRAR LA VISTA PRINCIPAL DE VENTAS
     */
    public function index()
    {
        $userId = auth()->id();
        $temp = TempSale::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$temp) {
            $temp = TempSale::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
                'customer_id' => null,
            ]);
        }
        // Retorna los datos de la tabla tipo de documento
        $typesDocuments = TypesDocuments::where('is_active', true)
            ->whereIn('name', ['Venta'])
            ->get();

        // Retorna los datos de la tabla tipo de comprobante
        $typesReceipts = TypesReceipts::where('is_active', true)
            ->get();

        $departments = Department::all();
        $categories = Category::where('status', '!=', 0)->get();
        $units = Unit::where('status', '!=', 0)->get();
        $taxes = Taxes::where('is_active', '!=', 0)->get();

        return view('temp_sale.index', compact('temp', 'typesDocuments', 'typesReceipts', 'departments', 'categories', 'units', 'taxes'));
    }
}
