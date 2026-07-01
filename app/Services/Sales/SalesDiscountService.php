<?php
// app/Services/Sales/SalesDiscountService.php
namespace App\Services\Sales;

use App\Models\TempSale;
use App\Models\TempSaleDetail;
use App\Services\TotalsCalculatorService;

class SalesDiscountService
{
    public function __construct(
        private TotalsCalculatorService $totalsCalculator
    ) {}

    public function applyDiscount(int $tempSaleId, float $discount): array
    {
        $tempSale = TempSale::findOrFail($tempSaleId);
        $tempSale->discount = $discount;
        $tempSale->save();

        $details = TempSaleDetail::where('temp_sale_id', $tempSaleId)->get();
        return $this->totalsCalculator->calculateTotals($details, $discount);
    }
}
