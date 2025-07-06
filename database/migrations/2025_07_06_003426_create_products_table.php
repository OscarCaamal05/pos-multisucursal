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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('product_name', 100);
            $table->string('barcode', 50)->nullable()->unique();
            $table->text('product_description')->nullable();
            $table->boolean('iva')->default(false)->comment('Si aplica iva')->nullable();
            $table->boolean('neto')->default(true)->comment('Si el precio es neto')->nullable();
            $table->boolean('is_fractional')->default(false)->comment('Permite venta por fracción')->nullable();
            $table->boolean('is_service')->default(false)->comment('Si es un servicio')->nullable();
            $table->decimal('conversion_factor', 10, 2)->nullable()->comment('Ej. 1 caja = 12 piezas');
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('sale_price_1', 10, 2)->default(0);
            $table->unsignedInteger('price_1_min_qty')->default(1)->comment('Cantidad mínima para precio 1');
            $table->decimal('sale_price_2', 10, 2)->nullable()->default(0);
            $table->unsignedInteger('price_2_min_qty')->nullable()->comment('Cantidad mínima para precio 2');
            $table->decimal('sale_price_3', 10, 2)->nullable()->default(0);
            $table->unsignedInteger('price_3_min_qty')->nullable()->comment('Cantidad mínima para precio 3')->default(0);
            $table->decimal('unit_price', 10, 2)->nullable()->default(0);
            $table->decimal('stock', 10, 2)->nullable()->default(0);
            $table->decimal('stock_min', 10, 2)->default(0)->nullable();
            $table->decimal('stock_max', 10, 2)->default(0)->nullable();
            $table->string('image', 255)->nullable()->comment('Ruta o nombre del archivo de la imagen');
            $table->tinyInteger('status')->default(1)->comment('1=Activo,0=Inactivo');
            $table->unsignedBigInteger('product_category_id')->nullable();
            $table->unsignedBigInteger('product_department_id')->nullable();
            $table->unsignedBigInteger('sale_unit_id')->nullable();
            $table->unsignedBigInteger('purchase_unit_id')->nullable();
            $table->timestamps();

            // Llaves foráneas
            $table->foreign('product_category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('product_department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('sale_unit_id')->references('id')->on('units')->nullOnDelete();
            $table->foreign('purchase_unit_id')->references('id')->on('units')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
