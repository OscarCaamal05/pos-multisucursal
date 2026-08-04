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
        Schema::table('sales_details', function (Blueprint $table) {
            $table->decimal('returned_quantity', 10, 2)->default(0)->after('total');
            $table->boolean('is_returned')->default(false)->after('returned_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_details', function (Blueprint $table) {
            $table->dropColumn('returned_quantity');
            $table->dropColumn('is_returned');
        });
    }
};
