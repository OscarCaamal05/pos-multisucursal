<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_name',
        'department_description',
    ];

     //FUNCION PARA LA RELACION CON EL MODULO CATEGORIAS
    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
