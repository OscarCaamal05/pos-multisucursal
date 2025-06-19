<?php

use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RolesController;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Http\Controllers\UserController;


Route::get('/', function () {
    return view('welcome');
})->name('home');
Route::get('/users/data', [UserController::class, 'getUsers'])->name('users.data');
Route::get('/roles/data', [RolesController::class, 'getRoles'])->name('roles.data');
Route::get('/permission/data', [PermissionController::class, 'getPermission'])->name('permission.data');
Route::put('/users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.toggleStatus');


Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::resource('users', UserController::class)->names('users');
    Route::resource('roles', RolesController::class)->names('roles');
    Route::resource('permission', PermissionController::class)->names('permission');

    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});


require __DIR__.'/auth.php';
