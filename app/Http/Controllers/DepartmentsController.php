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
        return DataTables::of(Department::select('id', 'department_name', 'department_description'))->make(true);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SaveDepartmentRequest $request)
    {
        $department = Department::create($request->validated());

        return response()->json(
            [
                'status' => 'create',
                'department' => [
                    'id' => $department->id,
                    'department_name' => $department->department_name,
                ]
            ]
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SaveDepartmentRequest $request, Department $department)
    {
        $department->update($request->validated());

        return response()->json(['status' => 'update']);
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
