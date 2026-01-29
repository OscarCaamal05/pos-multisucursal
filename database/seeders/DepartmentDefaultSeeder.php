<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentDefaultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departmentExists = Department::where('name', 'Sin Definir')->exists();
        if (!$departmentExists) {
            Department::create([
                'name' => 'Sin Definir',
                'description' => 'Departamento por defecto',
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
