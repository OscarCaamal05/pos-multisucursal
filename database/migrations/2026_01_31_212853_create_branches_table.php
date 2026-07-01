<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10);
            $table->string('name', 100);
            $table->text('address')->nullable();
            $table->string('phone', 15)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('website', 100)->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();

            //Control 
            $table->boolean('is_main')->default(false)->comment('Sucursal principal/matriz');
            $table->boolean('is_active')->default(true);

            // Configuración especifica
            $table->json('settings')->nullable()->comment('Configuraciones específicas de la sucursal');
            $table->timestamps();

            $table->index('code');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
