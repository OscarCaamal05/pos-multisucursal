<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DepartmentsController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchasesController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\SuppliersController;
use App\Http\Controllers\TempPurchaseDetailController;
use App\Http\Controllers\TempPurchaseController;
use App\Http\Controllers\TempSaleController;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Http\Controllers\UserController;
use App\Models\Department;
use App\Models\tempPurchaseDetail;

Route::get('/', function () {
    return view('welcome');
})->name('home');
Route::get('/users/data', [UserController::class, 'getUsers'])->name('users.data');
Route::get('/roles/data', [RolesController::class, 'getRoles'])->name('roles.data');
Route::get('/categories/data', [CategoryController::class, 'getCategories'])->name('categories.data');
Route::get('/departments/data', [DepartmentsController::class, 'getDepartments'])->name('departments.data');
Route::get('/permission/data', [PermissionController::class, 'getPermission'])->name('permission.data');
Route::get('/temp_purchases_detail/data', [TempPurchaseDetailController::class, 'getProductDetails'])->name('temp_purchases_detail.data');
Route::get('/temp_purchases_detail/getPendingPurchases', [TempPurchaseDetailController::class, 'getPendingPurchases']);
Route::get('/products/data', [ProductController::class, 'getProducts'])->name('products.data');
Route::get('/customers/data', [CustomerController::class, 'getCustomers'])->name('customers.data');
Route::get('/suppliers/data', [SuppliersController::class, 'getSuppliers'])->name('suppliers.data');
Route::put('/users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.toggleStatus');
Route::put('/categories/{category}/status', [CategoryController::class, 'toggleStatus'])->name('categories.toggleStatus');
Route::put('/customers/{customer}/status', [CustomerController::class, 'toggleStatus'])->name('customers.toggleStatus');
Route::put('/suppliers/{supplier}/status', [SuppliersController::class, 'toggleStatus'])->name('suppliers.toggleStatus');
Route::put('/products/{product}/status', [ProductController::class, 'toggleStatus'])->name('products.toggleStatus');


Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::resource('users', UserController::class)->names('users');
    Route::resource('departments', DepartmentsController::class)->names('departments');
    Route::resource('categories', CategoryController::class)->names('categories');
    Route::resource('customers', CustomerController::class)->names('customers');
    Route::resource('suppliers', SuppliersController::class)->names('suppliers');
    Route::resource('products', ProductController::class)->names('products');
    Route::resource('temp_purchase', TempPurchaseController::class)->names('temp_purchase');

    //Route::get('temp_purchase', [TempPurchaseController::class, 'getOrCreateTempPurchase']);
    Route::resource('temp_purchases_detail', TempPurchaseDetailController::class)->names('temp_purchases_detail');
    Route::get('/temp_purchases_detail/{supplier}/show', [TempPurchaseDetailController::class, 'show']);

    Route::post('/temp_purchases_detail/add', [TempPurchaseDetailController::class, 'addProduct']);
    Route::get('/temp_purchases_detail/totals/{temp_purchase_id}', [TempPurchaseDetailController::class, 'getTotals']);
    Route::get('/temp_purchases_detail/getDataProductTemp/{id}', [TempPurchaseDetailController::class, 'getTempDetail']);
    Route::post('/temp_purchases_detail/set-to-waiting/', [TempPurchaseDetailController::class, 'setToWaiting']);
    Route::post('/temp_purchases_detail/updateDiscount/', [TempPurchaseDetailController::class, 'updateDiscount']);
    Route::get('/temp_purchases_detail/getDataProduct/{product}', [TempPurchaseDetailController::class, 'getDataProduct']);
    Route::get('/temp_purchases_detail/cancelPurchase/{temp_id}', [TempPurchaseDetailController::class, 'cancelPurchase']);
    Route::post('/temp_purchases_detail/getPurchaseOnWaitingList', [TempPurchaseDetailController::class, 'getPurchaseOnWaitingList']);
    Route::post('/temp_purchases_detail/processPurchase', [TempPurchaseDetailController::class, 'processPurchases']);

    Route::get('/temp_purchases_detail/autoCompleteSuppliers/{query}', [TempPurchaseDetailController::class, 'autoCompleteSuppliers']);
    Route::get('/temp_purchases_detail/autoCompleteProducts/{query}', [TempPurchaseDetailController::class, 'autoCompleteProducts']);

    Route::resource('temp_sale', TempSaleController::class)->names('temp_sale');
    
    Route::resource('roles', RolesController::class)->names('roles');
    Route::get('/roles/{id}', [RolesController::class, 'show']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/roles/assignPermission/{id}', [RolesController::class, 'assignPermission'])->name('roles.assignPermission');
    Route::put('/users/assignRoles/{id}', [UserController::class, 'assignRoles']);
    Route::resource('permission', PermissionController::class)->names('permission');

    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});


require __DIR__ . '/auth.php';
