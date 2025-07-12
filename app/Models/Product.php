<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

use function PHPSTORM_META\map;

class Product extends Model
{
    protected $fillable = [
        'product_name',
        'barcode',
        'product_description',
        'iva',
        'neto',
        'is_fractional',
        'is_service',
        'conversion_factor',
        'purchase_price',
        'sale_price_1',
        'price_1_min_qty',
        'sale_price_2',
        'price_2_min_qty',
        'sale_price_3',
        'price_3_min_qty',
        'unit_price',
        'stock',
        'stock_min',
        'stock_max',
        'image',
        'status',
        'product_category_id',
        'product_department_id',
        'sale_unit_id',
        'purchase_unit_id',
    ];

    public static function getProductsData()
    {
        return DB::table('products as p')
            ->join('categories as c', 'p.product_category_id', '=', 'c.id')
            ->join('departments as d', 'p.product_department_id', '=', 'd.id')
            ->join('units as u', 'p.sale_unit_id', '=', 'u.id')
            ->select(
                'p.id',
                'p.product_name',
                'p.barcode',
                'c.category_name',
                'd.department_name',
                'p.stock',
                'p.sale_price_1',
                'u.name as sale_unit_name',
                'p.status',
            );
    }

    public static function getWithDetails()
    {
        return DB::table('products as p')
            ->join('categories as c', 'p.product_category_id', '=', 'c.id')
            ->join('departments as d', 'p.product_department_id', '=', 'd.id')
            ->join('units as up', 'p.purchase_unit_id', '=', 'up.id')
            ->join('units as us', 'p.sale_unit_id', '=', 'us.id')
            ->select(
                'p.id',
                'p.product_name',
                'p.barcode',
                'p.iva',
                'p.neto',
                'p.is_fractional',
                'p.is_service',
                'p.conversion_factor',
                'p.product_description',
                'p.stock',
                'p.stock_min',
                'p.stock_max',
                'p.image',
                'p.unit_price',
                'p.price_1_min_qty',
                'p.sale_price_2',
                'p.price_2_min_qty',
                'p.sale_price_3',
                'p.price_3_min_qty',
                'c.id as category_id',
                'c.category_name',
                'd.id as department_id',
                'd.department_name',
                'up.id as purchase_unit_id',
                'up.name as purchase_unit_name',
                'us.id as sale_unit_id',
                'us.name as sale_unit_name',
                'p.purchase_price',
                'p.sale_price_1',
                'p.status'
            );
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'product_category_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'product_department_id');
    }

    public function purchaseUnit()
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function saleUnit()
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }
}
