<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            // Seeder para crear el usuario por defecto "admin".
            AdminUserSeeder::class,
            TypesDocumentsSeeder::class,
            TypeReceiptSeeder::class,
            DepartmentDefaultSeeder::class,
            CategoryDefaultSeeder::class,
            CustomerDefaultSeeder::class,
            DefaultUnitsSeeder::class,
        ]);
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
