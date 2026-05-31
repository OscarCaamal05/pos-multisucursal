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
        $data = $request->validated();

        $data['credit_used'] = $data['credit_used'] ?? 0;
        $data['credit_limit'] = $data['credit_limit'] ?? 0;
        $data['credit_available'] = $data['credit_limit'] - $data['credit_used'];

        $customer = Customer::create($data);

        return response()->json([
            'status' => 'create',
            'customer' => [
                'id' => $customer->id,
            ]
        ]);
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
        $customer_data = Customer::where('id', $customer->id)->first();

        if(!$customer_data) {
            return response()->json(['status' => 'error', 'message' => 'Cliente no encontrado'], 404);
        }

        return response()->json([
            'status' => 'success',
            'customer' => $customer_data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveCustomersRequest $request, Customer $customer)
    {
        $data = $request->validated();

        $data['credit_used'] = $data['credit_used'] ?? 0;
        $data['credit_limit'] = $data['credit_limit'] ?? 0;
        $data['credit_available'] = $data['credit_limit'] - $data['credit_used'];

        $customer->update($data);

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
