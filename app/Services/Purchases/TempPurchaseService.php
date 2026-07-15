<?php 
namespace App\Services\Purchases;

use App\Models\TempPurchase;
use Illuminate\Support\Str;

class TempPurchaseService
{
    public function getOrCreate(int $userId): TempPurchase
    {
        $tempPurchase = TempPurchase::where('user_id', $userId)
            ->where('status', 'abierta')
            ->first();

        if (!$tempPurchase) {
            $tempPurchase = $this->create($userId);
        }

        return $tempPurchase;
    }

    public function create(int $userId): TempPurchase
    {
        return TempPurchase::create([
            'user_id'  => $userId,
            'status'   => 'abierta',
            'discount' => 0,
            // Cualquier otro campo que requiera tu tabla
        ]);
        // Laravel genera automáticamente un nuevo id único ✅
    }
}