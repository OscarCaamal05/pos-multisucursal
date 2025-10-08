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
        $supplier = Supplier::create($request->validated());

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
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveSuppliersRequest $request, Supplier $supplier)
    {

        $supplier->update($request->validated());

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
