<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveSuppliersRequest;
use Illuminate\Http\Request;
use App\Models\Supplier;
use Yajra\DataTables\Facades\DataTables;

class SuppliersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('suppliers.index');
    }

    public function getSuppliers()
    {
        $query = Supplier::all();

        return DataTables::of($query)->make(true);
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
    public function store(SaveSuppliersRequest $request)
    {
        $data = $request->validated();
        
        // Para registro nuevo: credit_balance es 0, entonces credit_available = credit_limit_granted
        $data['credit_balance'] = $data['credit_balance'] ?? 0;
        $data['credit_limit_granted'] = $data['credit_limit_granted'] ?? 0;
        $data['credit_available'] = $data['credit_limit_granted'] - $data['credit_balance'];

        $supplier = Supplier::create($data);

        return response()->json(
            [
                'status' => 'create',
                'supplier' => [
                    'id' => $supplier->id,
                ]
            ]
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supplier $supplier)
    {
        $supplier_data = Supplier::where('id', $supplier->id)->first();

        if (!$supplier_data) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $supplier_data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveSuppliersRequest $request, Supplier $supplier)
    {
        $data = $request->validated();
        
        // Calcular credit_available basado en los valores actuales o nuevos
        $creditBalance = $data['credit_balance'] ?? $supplier->credit_balance ?? 0;
        $creditLimit = $data['credit_limit_granted'] ?? $supplier->credit_limit_granted ?? 0;
        $data['credit_available'] = $creditLimit - $creditBalance;

        $supplier->update($data);

        return response()->json(['update' => true]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return response()->json(['delete' => true]);
    }

    /**
     * Activar o desactivar a un proveedor
     */
    public function toggleStatus(Request $request, Supplier $supplier)
    {
        $supplier->status = $request->input('status');
        $supplier->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }
}
