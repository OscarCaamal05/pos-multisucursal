<?php

namespace App\Http\Controllers;

use App\Models\purchases;
use Illuminate\Http\Request;
use App\Models\Supplier;

class PurchasesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('purchases.index');
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
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show($supplierId)
    {
        $supplier = Supplier::find($supplierId);

        if(!$supplier) {
            return response()->json(['error' => 'Proveedor no encontrado'], 404);
        }

        return response()->json([ 
            'company_name' => $supplier->company_name,
            'representative' => $supplier->representative,
            'phone' => $supplier->phone,
            'email' => $supplier->email,
            'rfc' => $supplier->rfc,
            'credit_available' => $supplier->credit_available,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(purchases $purchases)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, purchases $purchases)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(purchases $purchases)
    {
        //
    }

    public function autocompleteSuppliers($query)
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
}
