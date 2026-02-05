<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar si el usuario admin ya existe
        $adminExists = User::where('email', 'admin@pos.com')->exists();

        if (!$adminExists) {
            User::create([
                'name' => 'admin',
                'email' => 'admin@pos.com',
                'password' => Hash::make('admin'),
                'email_verified_at' => now(),
                'status' => true,
            ]);

            $this->command->info('Usuario admin creado con éxito.');
            $this->command->info('Email: admin@pos.com');
            $this->command->info('Password: admin');
        } else {
            $this->command->info('El usuario admin ya existe. No se creó ningún usuario.');
        }
    }
}
