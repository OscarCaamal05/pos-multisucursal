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
        Schema::table('suppliers', function (Blueprint $table) {
            $table->date('credit_due_date')->nullable()->after('credit_available');

            // Días de plazo para pago (por defecto 30 días)
            $table->integer('credit_terms')->default(30)->after('credit_due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'credit_due_date',
                'credit_terms'
            ]);
        });
    }
};
