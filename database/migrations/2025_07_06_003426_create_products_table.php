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

            // Información básica
            $table->string('name', 100);
            $table->string('barcode', 50)->nullable()->unique();
            $table->text('description')->nullable();

            // Configuración de venta
            $table->boolean('allow_fractional_sale')->default(false);
            $table->boolean('allow_decimal_quantity')->default(false);
            $table->boolean('is_service')->default(false);
            $table->boolean('is_net_price')->default(true)->comment('Si el precio es neto');
            $table->decimal('conversion_factor', 10, 2)->nullable()->comment('Factor de conversión unidad compra/venta');

            // Control de lotes y vencimientos
            $table->boolean('requires_batch_control')->default(false)
                ->comment('Requiere control de lotes y fechas de vencimiento');

            $table->boolean('requires_serial_number')->default(false)
                ->comment('Requiere número de serie individual');

            $table->integer('shelf_life_days')->nullable()
                ->comment('Vida útil en días desde fabricación');

            $table->integer('alert_days_before_expiration')->default(30)
                ->comment('Días de anticipación para alertar vencimiento');

            // Precios
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('sale_price_1', 10, 2)->default(0);
            $table->unsignedInteger('price_1_min_qty')->default(1)->comment('Cantidad mínima para precio 1');
            $table->decimal('sale_price_2', 10, 2)->nullable()->default(0);
            $table->unsignedInteger('price_2_min_qty')->nullable()->comment('Cantidad mínima para precio 2')->default(0);
            $table->decimal('sale_price_3', 10, 2)->nullable()->default(0);
            $table->unsignedInteger('price_3_min_qty')->nullable()->comment('Cantidad mínima para precio 3')->default(0);
            $table->decimal('unit_price', 10, 2)->nullable()->default(0);

            $table->string('image', 255)->nullable()->comment('Ruta o nombre del archivo de la imagen');

            $table->boolean('is_active')->default(true);

            // Llaves foráneas
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('purchase_unit_id')->nullable()->constrained('units')->nullOnDelete();

            $table->timestamps();

            // Índices
            $table->index('barcode');
            $table->index(['category_id', 'is_active']);
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
