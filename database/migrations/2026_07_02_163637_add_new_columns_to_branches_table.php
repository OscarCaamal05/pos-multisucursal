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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('name');
            $table->string('tax_id')->nullable()->after('logo_path');
            $table->boolean('is_setup')->default(false)->after('is_active');
            $table->timestamp('setup_completed_at')->nullable()->after('is_setup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('logo_path');
            $table->dropColumn('tax_id');
            $table->dropColumn('is_setup');
            $table->dropColumn('setup_completed_at');
        });
    }
};
