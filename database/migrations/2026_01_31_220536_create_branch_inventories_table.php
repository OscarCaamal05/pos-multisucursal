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
        Schema::create('branch_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // Cantidades
            $table->decimal('quantity', 10, 2)->default(0);
            $table->decimal('reserved_quantity', 10, 2)->default(0);
            $table->decimal('available_quantity', 10, 2)->storedAs('quantity - reserved_quantity');

            // Límites
            $table->decimal('stock_min', 10, 2)->nullable();
            $table->decimal('stock_max', 10, 2)->nullable();

            // Costos
            $table->decimal('average_cost', 10, 2)->default(0);

            // Control
            $table->string('location', 50)->nullable()->comment('Ubicación física en almacén');
            $table->dateTime('last_count_date')->nullable();
            $table->dateTime('last_movement_date')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'product_id']);
            $table->index(['branch_id', 'quantity']);
            $table->index(['branch_id', 'product_id', 'quantity']);
            $table->index(['branch_id', 'quantity', 'stock_min'], 'idx_low_stock');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_inventories');
    }
};
