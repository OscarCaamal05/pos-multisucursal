<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class DepartmentsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('departments.index');
    }

    public function getDepartments()
    {
        return DataTables::of(Department::select('id', 'name', 'description'))->make(true);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SaveDepartmentRequest $request)
    {
        Department::create($request->validated());

        return response()->json(['create' => true]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveDepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        return response()->json(['update' => true]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(['delete' => true]);
    }
}
