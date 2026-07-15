<?php

namespace App\Services\Purchases;

use App\Models\TempPurchase;
use App\Models\TempPurchaseDetail;
use App\Services\TotalsCalculatorService;

class PurchasesDiscountService
{
    public function __construct(
        private TotalsCalculatorService $totalsCalculator
    ) {}

    public function applyDiscount(int $tempPurchaseId, float $discount): array
    {
        $tempPurchase = TempPurchase::findOrFail($tempPurchaseId);
        $tempPurchase->discount = $discount;
        $tempPurchase->save();

        $details = TempPurchaseDetail::where('temp_purchase_id', $tempPurchaseId)->get();
        return $this->totalsCalculator->calculateTotals($details, $discount);
    }
}
