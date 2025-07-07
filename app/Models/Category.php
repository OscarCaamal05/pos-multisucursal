<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Category extends Model
{
    protected $fillable = [
        'category_name',
        'category_description',
        'status',
        'department_id'
    ];

    public static function withDepartmentData()
    {
        return DB::table('categories as c')
            ->join('departments as d', 'c.department_id', '=', 'd.id')
            ->select(
                'c.id',
                'c.category_name',
                'c.category_description',
                'c.status',
                'department_id',
                'd.department_name as department_name'
            );
    }

    //FUNCION PARA LA RELACION CON EL MODULO DEPARTAMENTO
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
