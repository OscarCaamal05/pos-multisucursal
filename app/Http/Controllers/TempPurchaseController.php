<?php

namespace App\Http\Controllers;

use App\Models\DocumentType;
use App\Models\TempPurchase;
use App\Models\VoucherTypes;
use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Http\Request;

class TempPurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index()
    {
        $userId = auth()->id();
        $temp = TempPurchase::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$temp) {
            $temp = TempPurchase::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
                'supplier_id' => null,
            ]);
        }
        // Retorna los datos de la tabla tipo de documento
        $documentTypes = DocumentType::where('is_active', true)
        ->whereIn('type_name', ['Compra', 'Gasto'])
        ->get();

        // Retorna los datos de la tabla tipo de comprobante
        $voucherTypes = VoucherTypes::where('is_active', true)
        ->get();

        $departments = Department::all();
        $categories = Category::where('status', '!=', 0)->get();
        $units = Unit::where('status', '!=', 0)->get();

        return view('temp_purchase.index', compact('temp', 'documentTypes', 'voucherTypes', 'departments', 'categories', 'units'));
    }

    /**
     * Crear un id de compra temporal o recupera uno existente.
     */
    public function getOrCreateTempPurchase()
    {
        $userId = auth()->id();
        $temp = TempPurchase::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$temp) {
            $temp = TempPurchase::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
            ]);
        }

        return response()->json(['temp' => $temp]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(tempPurchaseController $tempPurchaseController)
    {
        //
    }
}
