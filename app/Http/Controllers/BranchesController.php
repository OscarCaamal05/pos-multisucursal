<?php

namespace App\Http\Controllers;

use App\Models\Branches;
use Illuminate\Http\Request;

class BranchesController extends Controller
{
    public function index()
    {
        return view('branches.index');
    }

    public function create()
    {
        return view('branches.create');
    }

    public function store(Request $request)
    {
        // Lógica para almacenar una nueva sucursal
    }

    /**
     * Metodo para mostrar la información de una sucursal específica
     */
    public function getBrachDefaultData()
    {
        $user = auth()->user();
        $branch = $user->branches()
            ->wherePivot('is_default', true)
            ->first() ?? $user->branches()->firstOrFail();

        return response()->json([
            'branch_data' => $branch,
        ]);
    }

    public function edit($id)
    {
        return view('branches.edit', compact('id'));
    }

    public function update(Request $request, $id)
    {
        $branch = Branches::findOrFail($id);
        if (!$branch->is_setup) {
            $branch->is_setup = true;
            $branch->setup_completed_at = now();
        }

        $branch->update($request->only(['code', 'name', 'logo_path', 'tax_id', 'address', 'phone', 'email', 'website']));
        return response()->json([
            'message' => 'Sucursal actualizada exitosamente.'
        ]);
    }

    /**
     * Metodo para subir un logo de sucursal
     */
    public function uploadLogo(Request $request, $id)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $branch = Branches::findOrFail($id);

        // Eliminar el logo anterior si existe
        if ($branch->logo_path) {
            \Storage::disk('public')->delete($branch->logo_path);
        }

        $path = $request->file('logo')->store('branches/logos', 'public');
        $branch->update(['logo_path' => $path]);

        return response()->json([
            'logo_url' => \Storage::url($path),
            'message' => 'Logo subido exitosamente.'
        ]);
    }

    public function destroy($id)
    {
        // Lógica para eliminar una sucursal
    }
}
