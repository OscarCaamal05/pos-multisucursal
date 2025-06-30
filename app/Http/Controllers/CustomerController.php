<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveCustomersRequest;
use App\Models\Customer;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('customers.index');
    }

    public function getCustomers()
    {
        $query = Customer::all();

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
    public function store(SaveCustomersRequest $request)
    {
        Customer::create($request->validated());

        return response()->json(['create' => true]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveCustomersRequest $request, Customer $customer)
    {
        $customer->update($request->validated());

        return response()->json(['update' => true]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json(['delete' => true]);
    }

    /**
     * Activar o desactivar a un cliente
     */
    public function toggleStatus(Request $request, Customer $customer)
    {
        $customer->status = $request->input('status');
        $customer->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }
}
