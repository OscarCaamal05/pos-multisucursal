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
        Schema::create('temp_sale_details', function (Blueprint $table) {
            $table->id('id_temp_sale_detail');
            $table->unsignedBigInteger('temp_sale_id');
            $table->unsignedBigInteger('product_id');
            $table->string('product_name', 50);
            $table->string('barcode', 50);
            $table->decimal('price', 10, 2);
            $table->decimal('factor', 10, 2);
            $table->decimal('quantity', 10, 2);
            $table->decimal('discount', 10, 2)->default(0.00)->nullable();
            $table->decimal('total', 10, 2);

            $table->unsignedBigInteger('unit_id');
            $table->string('unit_name', 50);

            // Relaciones con llaves foráneas
            $table->foreign('temp_sale_id')->references('id_temp_sale')->on('temp_sales')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temp_sale_details');
    }
};
