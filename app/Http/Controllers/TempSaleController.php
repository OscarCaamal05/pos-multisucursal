<?php

namespace App\Http\Controllers;
use App\Models\TempSale;
use App\Models\DocumentType;
use App\Models\VoucherTypes;
use App\Models\Category;
use App\Models\Department;
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
        $documentTypes = DocumentType::where('is_active', true)
            ->whereIn('type_name', ['Venta'])
            ->get();

        // Retorna los datos de la tabla tipo de comprobante
        $voucherTypes = VoucherTypes::where('is_active', true)
            ->get();

        $departments = Department::all();
        $categories = Category::where('status', '!=', 0)->get();
        $units = Unit::where('status', '!=', 0)->get();

        return view('temp_sale.index', compact('temp', 'documentTypes', 'voucherTypes', 'departments', 'categories', 'units'));
    }
}
