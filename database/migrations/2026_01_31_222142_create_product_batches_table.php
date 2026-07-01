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
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            $table->string('batch_number', 50);
            $table->decimal('initial_quantity', 10, 2);
            $table->decimal('current_quantity', 10, 2);
            $table->decimal('reserved_quantity', 10, 2)->default(0);

            $table->date('manufacturing_date')->nullable();
            $table->date('expiration_date')->nullable();

            $table->decimal('unit_cost', 10, 2);

            $table->enum('status', ['activo', 'cerca de expirar', 'expirado', 'agotado'])->default('activo');

            // ⭐ ÚNICO POR SUCURSAL
            $table->unique(['branch_id', 'product_id', 'batch_number']);
            $table->index(['branch_id', 'expiration_date', 'status']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_batches');
    }
};
