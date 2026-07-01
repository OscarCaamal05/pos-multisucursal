<?php

namespace App\Services\Sales;

use App\Models\TempSale;
use Illuminate\Support\Str;

class TempSaleService
{
    public function getOrCreate(int $userId): TempSale
    {
        $tempSale = TempSale::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$tempSale) {
            $tempSale = $this->create($userId);
        }

        return $tempSale;
    }

    public function create(int $userId): TempSale
    {
        return TempSale::create([
            'user_id'  => $userId,
            'status'   => 'abierta',
            'discount' => 0,
            // Cualquier otro campo que requiera tu tabla
        ]);
        // Laravel genera automáticamente un nuevo id único ✅
    }
}