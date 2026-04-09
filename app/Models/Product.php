<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

use function PHPSTORM_META\map;

class Product extends Model
{
    protected $fillable = [
        'name',
        'barcode',
        'description',
        'allow_fractional_sale',
        'allow_decimal_quantity',
        'is_service',
        'is_net_price',
        'conversion_factor',
        'requires_batch_control',
        'requires_serial_number',
        'shelf_life_days',
        'alert_days_before_expiration',
        'purchase_price',
        'sale_price_1',
        'price_1_min_qty',
        'sale_price_2',
        'price_2_min_qty',
        'sale_price_3',
        'price_3_min_qty',
        'unit_price',
        'image',
        'expiry_date',
        'is_active',
        'category_id',
        'department_id',
        'sale_unit_id',
        'purchase_unit_id',
    ];

    protected $casts = [
        'allow_fractional_sale' => 'boolean',
        'allow_decimal_quantity' => 'boolean',
        'requires_batch_control' => 'boolean',
        'requires_serial_number' => 'boolean',
        'is_service' => 'boolean',
        'is_active' => 'boolean',
    ];

    // =========================================
    // ACCESSOR: URL completa de la imagen
    // =========================================
    
    /**
     * Obtiene la URL completa de la imagen del producto
     *
     * @return string|null
     */
    public function getImageUrlAttribute()
    {
        if ($this->image) {
            return asset('storage/' . $this->image);
        }
        return null;
    }

    /**
     * Obtiene el nombre del archivo de la imagen
     *
     * @return string|null
     */
    public function getImageNameAttribute()
    {
        if ($this->image) {
            return basename($this->image);
        }
        return null;
    }

    // =========================================
    // MÉTODOS ESTÁTICOS
    // =========================================

    public static function getProductsData()
    {
        return DB::table('products as p')
            ->join('categories as c', 'p.category_id', '=', 'c.id')
            ->join('departments as d', 'p.department_id', '=', 'd.id')
            ->join('units as u', 'p.sale_unit_id', '=', 'u.id')
            ->join('branch_inventories as bi', 'p.id', '=', 'bi.product_id')
            ->select(
                'p.id',
                'p.name',
                'p.barcode',
                'c.name as category_name',
                'd.name as department_name',
                'bi.quantity as stock',
                'p.sale_price_1',
                'u.name as sale_unit_name',
                'p.is_active',
            );
    }

    public static function getWithDetails()
    {
        return DB::table('products as p')
            ->join('categories as c', 'p.category_id', '=', 'c.id')
            ->join('departments as d', 'p.department_id', '=', 'd.id')
            ->join('units as u_sale', 'p.sale_unit_id', '=', 'u_sale.id')
            ->join('units as u_purchase', 'p.purchase_unit_id', '=', 'u_purchase.id')
            ->join('branch_inventories as bi', 'p.id', '=', 'bi.product_id')
            ->leftJoin('product_taxes as pt', 'p.id', '=', 'pt.product_id')
            ->select(
                'p.*',
                'c.name as category_name',
                'c.id as category_id',
                'd.name as department_name',
                'd.id as department_id',
                'bi.quantity as stock',
                'bi.stock_min',
                'bi.stock_max',
                'u_sale.id as sale_unit_id',
                'u_sale.name as sale_unit_name',
                'u_purchase.id as purchase_unit_id',
                'u_purchase.name as purchase_unit_name',
                DB::raw('GROUP_CONCAT(pt.tax_id) as tax_ids')
            )
            ->groupBy(
                'p.id',
                'p.name',
                'p.barcode',
                'p.description',
                'p.allow_fractional_sale',
                'p.allow_decimal_quantity',
                'p.is_service',
                'p.is_net_price',
                'p.conversion_factor',
                'p.requires_batch_control',
                'p.requires_serial_number',
                'p.shelf_life_days',
                'p.alert_days_before_expiration',
                'p.purchase_price',
                'p.sale_price_1',
                'p.price_1_min_qty',
                'p.sale_price_2',
                'p.price_2_min_qty',
                'p.sale_price_3',
                'p.price_3_min_qty',
                'p.unit_price',
                'p.image',
                'p.expiry_date',
                'p.is_active',
                'p.category_id',
                'p.department_id',
                'p.sale_unit_id',
                'p.purchase_unit_id',
                'p.created_at',
                'p.updated_at',
                'c.name',
                'c.id',
                'd.name',
                'd.id',
                'bi.quantity',
                'bi.stock_min',
                'bi.stock_max',
                'u_sale.id',
                'u_sale.name',
                'u_purchase.id',
                'u_purchase.name'
            );
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function purchaseUnit()
    {
        return $this->belongsTo(Unit::class, 'purchase_unit_id');
    }

    public function saleUnit()
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function taxes()
    {
        return $this->belongsToMany(Taxes::class, 'product_taxes', 'product_id', 'tax_id')
            ->withPivot('rate_override', 'is_active')
            ->withTimestamps();
    }

    public function branchInventories()
    {
        return $this->hasMany(BranchInventories::class);
    }
}
