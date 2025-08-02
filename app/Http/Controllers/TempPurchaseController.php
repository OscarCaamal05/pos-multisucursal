<?php

namespace App\Http\Controllers;

use App\Models\TempPurchase;
use Illuminate\Http\Request;

class TempPurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index()
    {
        $userId = auth()->id();
        $temp = TempPurchase::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$temp) {
            $temp = TempPurchase::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
            ]);
        }

        return view('temp_purchase.index', compact('temp'));
    }

    /**
     * Crear un id de compra temporal o recupera uno existente.
     */
    public function getOrCreateTempPurchase()
    {
        $userId = auth()->id();
        $temp = TempPurchase::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$temp) {
            $temp = TempPurchase::create([
                'user_id' => $userId,
                'status' => 'abierta',
                'session_token' => session()->getId(),
            ]);
        }

        return response()->json(['temp' => $temp]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, tempPurchaseController $tempPurchaseController)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(tempPurchaseController $tempPurchaseController)
    {
        //
    }
}
