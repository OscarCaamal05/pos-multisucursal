<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveCategoriesRequest;
use App\Models\Category;
use App\Models\Department;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $departments = Department::all();
        return view('categories.index', compact('departments'));
    }

    public function getCategories()
    {
        $query = Category::withDepartmentData();

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
    public function store(SaveCategoriesRequest $request)
    {
        $category = Category::create($request->validated());
        // Cargar el departamento relacionado
        $category->load('department');

        return response()->json([
            'status' => 'create',
            'category' => [
                'id' => $category->id,
                'category_name' => $category->category_name,
                'department' => $category->department ? [
                    'id' => $category->department->id,
                    'department_name' => $category->department->department_name,
                ] : null,
            ]
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveCategoriesRequest $request, Category $category)
    {
        $category->update($request->validated());

        return response()->json(['status' => 'update']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['delete' => true]);
    }

    public function toggleStatus(Request $request, Category $category)
    {
        $category->status = $request->input('status');
        $category->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }
}
