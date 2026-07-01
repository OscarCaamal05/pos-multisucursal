<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::table('branches')->insert([
            'name' => 'Sucursal Principal',
            'code' => 'SUC-001',
            'address' => 'Matriz',
            'phone' => '0000000000',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
}
