<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Branches;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Log;
use Yajra\DataTables\Facades\DataTables;

class UserController extends Controller
{
    public function index()
    {
        $branches = Branches::all();
        return view('users.index', compact('branches'));
    }

    public function store(Request $request)
    {
        Log::info('Request data: ', $request->all());
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|confirmed|min:6',
            'branches' => 'required|array',
            'is_default' => 'nullable|boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        $user->branches()->syncWithPivotValues(
            $request->branches,
            ['is_default' => (bool) $request->input('is_default', false)]
        );

        return response()->json(['success' => true]);
    }



    public function getUsers()
    {
        $query = User::getDataUsers();
        return DataTables::of($query)
            ->make(true);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        $roles = Role::all();
        $userRoles = $user->roles->pluck('id')->toArray();

        return response()->json([
            'user' => $user,
            'roles' => $roles,
            'userRoles' => $userRoles,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['success' => true]);
    }

    public function toggleStatus(Request $request, User $user)
    {
        $user->status = $request->input('status');
        $user->save();

        return response()->json(['message' => 'Estado actualizado correctamente.']);
    }

    public function assignRoles(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $rolesIds = $request->input('roles', []);
        $roles = Role::whereIn('id', $rolesIds)->pluck('name')->toArray();
        $user->syncRoles($roles);

        return response()->json(['success' => true]);
    }
}
