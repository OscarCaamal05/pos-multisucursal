<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveProductsRequest;
use App\Models\Category;
use App\Models\Department;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $departments = Department::all();
        $categories = Category::where('status', '!=', 0)->get();
        $units = Unit::where('status', '!=', 0)->get();

        return view('products.index', compact('departments', 'categories', 'units'));
    }

    public function getProducts()
    {
        $query = Product::getProductsData();

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
    public function store(SaveProductsRequest $request)
    {
        $product = Product::create($request->validated());

        return response()->json([
            'status' => 'create'
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $product_data = Product::getWithDetails()->where('p.id', $product->id)->first();

        if (!$product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $product_data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveProductsRequest $request, Product $product)
    {
        $product->update($request->validated());

        return response()->json(['status' => 'update']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['delete' => true]);
    }

    public function toggleStatus(Request $request, Product $product)
    {
        $product->status = $request->input('status');
        $product->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }
}
