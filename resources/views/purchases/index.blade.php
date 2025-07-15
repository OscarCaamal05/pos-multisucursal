@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" type="text/css" />
<link href="{{ URL::asset('build/libs/@tarekraafat/autocomplete.js/css/autoComplete.css') }}" rel="stylesheet">
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Compras @endslot
@slot('title') Realizar una compra @endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxPurchases.js')

<div class="row">
    <div class="col-xl-9">
        <div class="card">
            <div class="card-body">
                <form action="javascript:void(0);">
                    <div class="row gy-2 gx-3 mb-3 justify-content-between align-items-center">
                        <div class="col-sm-3">
                            <div class="input-group align-items-center">
                                <div class="form-icon">
                                    <input type="text"
                                        class="form-control form-control-icon"
                                        name="product_name"
                                        id="product_name"
                                        value="">
                                    <i class="ri-barcode-box-line"></i>
                                </div>
                                <button type="button" class="btn btn-ghost-dark waves-effect waves-light" id="btnBuscarProducto">
                                    <i class="ri-search-2-line"></i>
                                </button>
                            </div>
                        </div><!--end col-->
                        <div class="col-sm-3">
                            <div class="input-group align-items-center">
                                <label class="form-label me-3" for="autoSizingInputGroup">Documento</label>
                                <select class="form-select" id="autoSizingSelect">
                                    <option value="1">Compra</option>
                                    <option value="2">Gasto</option>
                                </select>
                            </div>
                        </div><!--end col-->
                        <div class="col-sm-2">
                            <div class="input-group align-items-center">
                                <label class="form-label me-3" for="autoSizingInputGroup">Folio</label>
                                <input type="text" class="form-control" id="autoSizingInput">
                            </div>

                        </div><!--end col-->
                    </div><!--end row-->
                </form>

            </div>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive table-card">
                    <table class="table table-nowrap align-middle table-borderless mb-0">
                        <thead class="table-light text-muted">
                            <tr>
                                <th scope="col" style="display: none">id_product</th>
                                <th scope="col" style="display: none">id_supplier</th>
                                <th scope="col" style="display: none">id_user</th>
                                <th scope="col">Descripcion</th>
                                <th scope="col">Codigo de barra</th>
                                <th scope="col">Cantidad</th>
                                <th scope="col">precio</th>
                                <th scope="col">Descuento</th>
                                <th scope="col" class="text-end">Total</th>
                                <th scope="col" style="display: none">sale_price</th>
                                <th scope="col" style="display: none">conversion_factor</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex">
                                        <div class="flex-shrink-0 avatar-md bg-light rounded p-1">
                                            <img src="{{ URL::asset('build/images/products/img-8.png') }}" alt=""
                                                class="img-fluid d-block">
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h5 class="fs-14"><a href="apps-ecommerce-product-details"
                                                    class="text-body">Sweatshirt for Men (Pink)</a></h5>
                                            <p class="text-muted mb-0">Color: <span class="fw-medium">Pink</span>
                                            </p>
                                            <p class="text-muted mb-0">Size: <span class="fw-medium">M</span></p>
                                        </div>
                                    </div>
                                </td>
                                <td>$119.99</td>
                                <td>02</td>
                                <td>
                                    <div class="text-warning fs-15">
                                        <i class="ri-star-fill"></i><i class="ri-star-fill"></i><i
                                            class="ri-star-fill"></i><i class="ri-star-fill"></i><i
                                            class="ri-star-half-fill"></i>
                                    </div>
                                </td>
                                <td class="fw-medium text-end">
                                    $239.98
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex">
                                        <div class="flex-shrink-0 avatar-md bg-light rounded p-1">
                                            <img src="{{ URL::asset('build/images/products/img-7.png') }}" alt=""
                                                class="img-fluid d-block">
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h5 class="fs-14"><a href="apps-ecommerce-product-details"
                                                    class="text-body">Noise NoiseFit Endure Smart Watch</a></h5>
                                            <p class="text-muted mb-0">Color: <span class="fw-medium">Black</span>
                                            </p>
                                            <p class="text-muted mb-0">Size: <span class="fw-medium">32.5mm</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>$94.99</td>
                                <td>01</td>
                                <td>
                                    <div class="text-warning fs-15">
                                        <i class="ri-star-fill"></i><i class="ri-star-fill"></i><i
                                            class="ri-star-fill"></i><i class="ri-star-fill"></i><i
                                            class="ri-star-half-fill"></i>
                                    </div>
                                </td>
                                <td class="fw-medium text-end">
                                    $94.99
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex">
                                        <div class="flex-shrink-0 avatar-md bg-light rounded p-1">
                                            <img src="{{ URL::asset('build/images/products/img-3.png') }}" alt=""
                                                class="img-fluid d-block">
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h5 class="fs-14"><a href="apps-ecommerce-product-details"
                                                    class="text-body">350 ml Glass Grocery Container</a></h5>
                                            <p class="text-muted mb-0">Color: <span class="fw-medium">White</span>
                                            </p>
                                            <p class="text-muted mb-0">Size: <span class="fw-medium">350 ml</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>$24.99</td>
                                <td>01</td>
                                <td>
                                    <div class="text-warning fs-15">
                                        <i class="ri-star-fill"></i><i class="ri-star-fill"></i><i
                                            class="ri-star-half-fill"></i><i class="ri-star-line"></i><i
                                            class="ri-star-line"></i>
                                    </div>
                                </td>
                                <td class="fw-medium text-end">
                                    $24.99
                                </td>
                            </tr>
                            <tr class="border-top border-top-dashed">
                                <td colspan="3"></td>
                                <td colspan="2" class="fw-medium p-0">
                                    <table class="table table-borderless mb-0">
                                        <tbody>
                                            <tr>
                                                <td>Sub Total :</td>
                                                <td class="text-end">$359.96</td>
                                            </tr>
                                            <tr>
                                                <td>Discount <span class="text-muted">(VELZON15)</span> : :</td>
                                                <td class="text-end">-$53.99</td>
                                            </tr>
                                            <tr>
                                                <td>Shipping Charge :</td>
                                                <td class="text-end">$65.00</td>
                                            </tr>
                                            <tr>
                                                <td>Estimated Tax :</td>
                                                <td class="text-end">$44.99</td>
                                            </tr>
                                            <tr class="border-top border-top-dashed">
                                                <th scope="row">Total (USD) :</th>
                                                <th class="text-end">$415.96</th>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <!--end card-->
    </div>
    <!--end col-->
    <div class="col-xl-3">
        <div class="card">
            <div class="card-header">
                <div class="d-flex align-items-center">
                    <h5 class="card-title flex-grow-1 mb-0">Detalles del proveedor</h5>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-sm-12 mb-3">
                        
                            <input type="text"
                                class="form-control"
                                name="auto_complete_supplier"
                                id="auto_complete_supplier"
                                dir="ltr"
                                spellcheck="false"
                                autocomplete="off"
                                autocapitalize="off">
                            
                    </div>
                    <div class="col-sm-12 mb-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0">
                                <img src="{{ URL::asset('build/images/users/user-dummy-img.jpg') }}" alt="" class="avatar-sm rounded">
                                <input type="hidden" name="supplier_id" id="supplier_id" value="0">
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <h6 class="fs-14 mb-1 company_name">Joseph Parkers</h6>
                                <p class="text-muted mb-0 name_supplier">Proveedor</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-7 mb-3">
                        <span>
                            <i class="ri-mail-line me-2 align-middle text-muted fs-16"></i>
                            <span class="email_supplier">

                            </span>
                        </span>
                    </div>
                    <div class="col-sm-5 mb-3">
                        <span>
                            <i class="ri-phone-line me-2 align-middle text-muted fs-16"></i>
                            <span class="phone_supplier">

                            </span>
                        </span>
                    </div>
                    <div class="col-sm-6 mb-2">
                        <span>
                            <i class="ri-bank-line me-2 align-middle text-muted fs-16" ></i>
                            <span class="rfc_supplier">

                            </span>
                        </span>
                    </div>
                    <div class="col-sm-6 mb-2">
                        <span>
                            <i class="ri-wallet-3-line me-2 align-middle text-muted fs-16" ></i>
                            <span class="credit_supplier">

                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <!--end card-->

        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0"><i class="ri-secure-payment-line align-bottom me-1 text-muted"></i>
                    Detalles del pago</h5>
            </div>
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="col-sm-8">
                        <p class="text-muted mb-0">Descuento:</p>
                    </div>
                    <div class="col-ms-4">
                        <input type="text" class="form-control text-end" id="discount" name="discount" placeholder="0.00">
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">SubTotal:</p>
                    </div>
                    <div class="">
                        <h6 class="mb-0">$0.00</h6>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">impuesto (I.V.A.):</p>
                    </div>
                    <div class="">
                        <h6 class="mb-0">$0.00</h6>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">Total:</p>
                    </div>
                    <div class="">
                        <h6 class="mb-0">$415.96</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex">
            <button class="btn btn-soft-success btn-lg mt-2 w-100 fs-4 fw-semibold">
                <i class=" ri-shopping-cart-2-line align-middle me-1"></i> Pagar
            </button>
        </div>
        <div class="row g-3">
            <div class="col-6">
                <button class="btn btn-soft-warning mt-3 w-100 fs-4 fw-semibold">
                    <i class="mdi mdi-alarm-multiple align-middle me-1"></i> Espera
                </button>
            </div>
            <div class="col-6">
                <button class="btn btn-soft-danger mt-3 w-100 fs-4 fw-semibold">
                    <i class="mdi mdi-archive-remove-outline align-middle me-1"></i> Cancelar
                </button>
            </div>
        </div>
        <!--end card-->
    </div>
    <!--end col-->
</div>
@endsection

@section('script')

<!-- jQuery (DEBE estar antes de DataTables) -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- DataTables JS -->
<script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.11.5/js/dataTables.bootstrap5.min.js"></script>

<!-- DataTables CSS -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap5.min.css">
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script src="{{ URL::asset('build/libs/@tarekraafat/autocomplete.js/autoComplete.min.js') }}"></script>

<!-- AlpineJS para manejar el modal -->
<script src="{{ URL::asset('build/js/alpine.min.js') }}"></script>

<script src="{{ URL::asset('build/js/app.js') }}"></script>
@endsection