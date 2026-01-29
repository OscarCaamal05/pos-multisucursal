<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DefaultUnitsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Creación de los tipos de unidades predeterminadas
        $defaultUnits = [
            ['name' => 'PZA'],
            ['name' => 'KG'],
            ['name' => 'CAJA'],
        ];
        foreach ($defaultUnits as $unit) {
            \DB::table('units')->insert([
                'name' => $unit['name'],
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
