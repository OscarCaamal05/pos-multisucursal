<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategoryDefaultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoryExists = Category::where('name', 'Sin Definir')->exists();
        if (!$categoryExists) {
            Category::create([
                'name' => 'Sin Definir',
                'description' => 'Categoría por defecto',
                'department_id' => 1,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
