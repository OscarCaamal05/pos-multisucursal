@extends('layouts.master')
@section('title')
@lang('translation.orders')
@endsection
@section('css')
<link href="{{ URL::asset('build/libs/sweetalert2/sweetalert2.min.css') }}" rel="stylesheet" type="text/css" />
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1')
Ecommerce
@endslot
@slot('title')
Reportes de ventas
@endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxSalesDetails.js')

<!-- Modal generar reportes -->
<div class="modal fade" id="generate-report-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-light">
                <h5 class="modal-title mb-2">
                    <i class="ri-file-excel-2-line me-2"></i>Generar reporte de ventas
                </h5>
                <button type="button" class="btn-close mb-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="exportReportForm" enctype="multipart/form-data">
                @csrf
                <div class="modal-body">
                    <!-- Información importante -->
                    <div class="alert alert-info" role="alert">
                        <h6 class="alert-heading"><i class="ri-information-line me-2"></i>Instrucciones:</h6>
                        <ul class="mb-0 ps-3">
                            <li>Selecciona el rango de fechas para generar el reporte</li>
                        </ul>
                    </div>
                    <div class="">
                        <div class="input-group">
                            <input type="text" class="form-control" data-provider="flatpickr" data-date-format="d M, Y" data-range-date="true" id="sale-datepicker-filter-report" placeholder="Filtrar por fecha" />
                            <button class="btn btn-outline-info" type="button" id="btn-clear-date-filter-report" title="Limpiar filtro de fecha">
                                <i class="ri-close-line"></i>
                            </button>
                        </div>
                    </div>
                    <!--end col-->

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <a href="{{ route('reports.sales.export-pdf') }}" target="_blank" class="btn btn-primary" id="btn-generate-report">
                        <i class="ri-file-pdf-2-line me-1"></i>Generar
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<!--MODAL PARA DETALLES DE LA VENTA-->
<div class="modal fade zoomIn" id="modal-sale-details" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="saleDetailsModalLabel">Detalles de la venta</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-sale"></button>
            </div>
            <div class="modal-body">
                <div class="row justify-content-center">
                    <div class="col-xxl-12">
                        <div class="card">
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="card-body">
                                        <div class="row justify-content-center">
                                            <div class="col-6">
                                                <h6 class="text-muted text-uppercase fw-semibold fs-5 mb-3">Cliente</h6>
                                                <p class="fw-medium mb-2 fs-5" id="customer-name">David Nichols</p>
                                                <p class="text-muted mb-1"><span>Codigo: </span><span id="customer-code"></span></p>
                                                <p class="text-muted mb-0"><span>RFC: </span><span id="customer-tax"></span> </p>
                                                <p class="text-muted mb-1"><span>Telefono: </span><span id="customer-phone"></span></p>
                                                <p class="text-muted mb-1" id="customer-address"></p>
                                            </div>
                                            <!--end col-->
                                            <div class="col-6">
                                                <h6 class="text-muted text-uppercase fw-semibold fs-5 mb-3">Cajero</h6>
                                                <p class="fw-medium mb-2 fs-5" id="user-name">David Nichols</p>
                                                <p class="text-muted mb-1"><span>Caja: </span><span id="cash-register">1</span></p>
                                            </div>
                                            <!--end col-->
                                        </div>
                                        <!--end row-->
                                    </div>
                                    <!--end card-body-->
                                </div>
                                <div class="col-lg-12">
                                    <div class="card-body border-top border-top-dashed">
                                        <div class="row g-3">
                                            <div class="col-lg-3 col-6">
                                                <p class="text-muted mb-2 text-uppercase fw-semibold">Comprobante</p>
                                                <h5 class="fs-14 mb-0"><span id="voucher-name">Factura</span></h5>
                                            </div>
                                            <!--end col-->
                                            <div class="col-lg-3 col-6">
                                                <p class="text-muted mb-2 text-uppercase fw-semibold">No. de comprobante</p>
                                                <h5 class="fs-14 mb-0"><span id="invoice-number">25000355</span></h5>
                                            </div>
                                            <!--end col-->
                                            <div class="col-lg-3 col-6">
                                                <p class="text-muted mb-2 text-uppercase fw-semibold">Fecha</p>
                                                <h5 class="fs-14 mb-0"><span id="invoice-date">23 Nov, 2021</span> <small class="text-muted" id="invoice-time">02:36PM</small></h5>
                                            </div>
                                            <!--end col-->
                                            <div class="col-lg-3 col-6">
                                                <p class="text-muted mb-2 text-uppercase fw-semibold">Estado de pago</p>
                                                <span class="fs-6" id="payment-status">Paid</span>
                                            </div>
                                            <!--end col-->
                                        </div>
                                        <!--end row-->
                                    </div>
                                    <!--end card-body-->
                                </div>
                                <div class="col-lg-12">
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-borderless text-center table-nowrap align-middle mb-0" id="productsDetailsTable">
                                                <thead>
                                                    <tr class="table-active">
                                                        <th scope="col" style="display: none">id</th>
                                                        <th scope="col" style="display: none">sale_id</th>
                                                        <th scope="col" style="display: none">product_id</th>
                                                        <th scope="col" class="text-center">Descripcion</th>
                                                        <th scope="col" class="text-center">Cantidad</th>
                                                        <th scope="col" class="text-center">precio unit.</th>
                                                        <th scope="col" class="text-center">Descuento</th>
                                                        <th scope="col" class="text-center">Total</th>
                                                        <th scope="col"></th>
                                                    </tr>
                                                </thead>
                                                <tbody id="products-list">

                                                </tbody>
                                            </table>
                                            <!--end table-->
                                        </div>
                                        <div class="border-top border-top-dashed mt-2">
                                            <table class="table table-borderless table-nowrap align-middle mb-0 ms-auto" style="width:250px">
                                                <tbody>
                                                    <tr class="border-top border-top-dashed fs-15">
                                                        <th scope="row">Total</th>
                                                        <th class=""><span id="total-amount">0.00</span></th>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <!--end table-->
                                            </td>
                                            </tr>
                                            </tbody>
                                            </table>
                                            <!--end table-->
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-7">
                                                <h6 class="text-muted text-uppercase fw-semibold mb-3">Detalles de pago:</h6>
                                                <div id="payment-details">
                                                    {{-- Se rellena dinámicamente --}}
                                                </div>
                                            </div>
                                            <div class="col-lg-5 d-flex align-items-center justify-content-end">
                                                <div class="d-flex gap-2 flex-wrap">
                                                    <!--<button type="button" class="btn btn-light bg-gradient waves-effect waves-light" data-bs-toggle="tooltip" data-bs-placement="top" title="Descargar"><i class="ri-download-2-line"></i></button>-->

                                                    <button type="button" class="btn btn-light bg-gradient waves-effect waves-light btn-print-sale" data-bs-toggle="tooltip" data-bs-placement="top" title="Imprimir"><i class="ri-printer-line"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!--end card-body-->
                                </div>
                                <!--end col-->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!--end modal-->

<!------------------------------------------------------------------------------------------------------------
    Modal para cantidad a devolver de un producto en la venta
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-return-product-quantity" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-return-product-quantity-label">Cantidad a Devolver</h5>
            </div>

            <div class="modal-body">
                <div class="mb-3">
                    <div class="pb-2 mb-3 text-center">
                        <h4 class="text-body m-1 product-name-label"></h4>
                    </div>
                    <div class="d-flex justify-content-center">
                        <div class="input-step justify-content-between" style="height: 50px; width: 150px;">
                            <button type="button" class="minus fw-semibold fs-4">–</button>
                            <input type="hidden" class="return-product-id" id="return-product-id" value="">
                            <input type="hidden" class="sale-id" id="sale-id" value="">
                            <input type="text" style="text-align: center;" class="fs-3 fw-semibold return-quantity" value="">
                            <button type="button" class="plus fw-semibold fs-4">+</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-primary" id="btn-return-product-quantity">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-lg-12">
        <div class="card" id="orderList">
            <div class="card-header border-0">
                <div class="row align-items-center gy-3">
                    <div class="col-sm">
                        <h5 class="card-title mb-0">Historial de ventas</h5>
                    </div>
                    <div class="col-sm-auto">
                        <div class="d-flex gap-1 flex-wrap">
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-soft-secondary material-shadow-none" data-bs-toggle="modal" data-bs-target="#generate-report-modal"><i class=" ri-file-download-line align-bottom me-1"></i> Generar Reporte</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-body border border-dashed border-end-0 border-start-0">
                <form>
                    <div class="row g-3">
                        <div class="col-xxl-4 col-sm-5">
                            <div class="search-box">
                                <input type="text" class="form-control search" id="search-sale-input" placeholder="Buscar por cliente, Numero de comprobante o id de venta...">
                                <i class="ri-search-line search-icon"></i>
                            </div>
                        </div>
                        <!--end col-->
                        <div class="col-xxl-2 col-sm-6">
                            <div class="input-group">
                                <input type="text" class="form-control" data-provider="flatpickr" data-date-format="d M, Y" data-range-date="true" id="sale-datepicker-filter" placeholder="Filtrar por fecha" />
                                <button class="btn btn-outline-info" type="button" id="btn-clear-date-filter" title="Limpiar filtro de fecha">
                                    <i class="ri-close-line"></i>
                                </button>
                            </div>
                        </div>
                        <!--end col-->
                        <div class="col-xxl-2 col-sm-4">
                            <div>
                                <select class="form-control" data-choices data-choices-search-false name="choice-voucher" id="id-voucher-filter">
                                    <option value="all-voucher" selected>Todos los comprobantes</option>
                                    @foreach ($typeReceipts as $typeReceipt)
                                    <option value="{{ $typeReceipt->id }}">
                                        {{ $typeReceipt->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <!--end col-->
                        <div class="col-xxl-2 col-sm-4">
                            <div>
                                <select class="form-control" data-choices data-choices-search-false name="choice-payment-method" id="id-payment-method-filter">
                                    <option value="all-payment-method" selected>Todos los métodos de pago</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="vale">Vale</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                        </div>
                        <!--end col-->
                        <div class="col-xxl-2 col-sm-4">
                            <div>
                                <select class="form-control" data-choices data-choices-search-false name="choice-status" id="id-status-filter">
                                    <option value="all-status" selected>Todos los estados</option>
                                    @foreach ($statuses as $status)
                                    <option value="{{ $status->status }}">
                                        {{ $status->status }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                    </div>
                    <!--end row-->
                </form>
            </div>
            <div class="card-body pt-0">
                <div>
                    <!--<ul class="nav nav-tabs nav-tabs-custom nav-success mb-3" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link active All py-3" data-bs-toggle="tab" id="All" href="#home1" role="tab" aria-selected="true">
                                <i class="ri-store-2-fill me-1 align-bottom"></i> All Orders
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link py-3 Delivered" data-bs-toggle="tab" id="Delivered" href="#delivered" role="tab" aria-selected="false">
                                <i class="ri-checkbox-circle-line me-1 align-bottom"></i> Delivered
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link py-3 Pickups" data-bs-toggle="tab" id="Pickups" href="#pickups" role="tab" aria-selected="false">
                                <i class="ri-truck-line me-1 align-bottom"></i> Pickups <span class="badge bg-danger align-middle ms-1">2</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link py-3 Returns" data-bs-toggle="tab" id="Returns" href="#returns" role="tab" aria-selected="false">
                                <i class="ri-arrow-left-right-fill me-1 align-bottom"></i> Returns
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link py-3 Cancelled" data-bs-toggle="tab" id="Cancelled" href="#cancelled" role="tab" aria-selected="false">
                                <i class="ri-close-circle-line me-1 align-bottom"></i> Cancelled
                            </a>
                        </li>
                    </ul>-->

                    <div class="table-responsive table-card mb-1">
                        <table class="table table-nowrap align-middle" id="salesTable">
                            <thead class="text-muted table-light">
                                <tr class="text-uppercase">
                                    <th class="sort" data-sort="id">ID</th>
                                    <th class="sort" data-sort="status">Fecha</th>
                                    <th class="sort" data-sort="payment_method">Metodo de pago</th>
                                    <th scope="col" style="display: none">voucher_id</th>
                                    <th class="sort" data-sort="customer_name">Comprobante</th>
                                    <th class="sort" data-sort="product_name">Numero de comprobante</th>
                                    <th class="sort" data-sort="date">Cliente</th>
                                    <th class="sort" data-sort="amount">Total</th>
                                    <th class="sort" data-sort="payment">Pago</th>
                                    <th class="sort" data-sort="status">Estado</th>
                                    <th class="sort" data-sort="status"></th>
                                </tr>
                            </thead>
                            <tbody class="">
                            </tbody>
                        </table>
                        <div class="noresult" style="display: none">
                            <div class="text-center">
                                <lord-icon src="https://cdn.lordicon.com/msoeawqm.json" trigger="loop" colors="primary:#405189,secondary:#0ab39c" style="width:75px;height:75px"></lord-icon>
                                <h5 class="mt-2">Sorry! No Result Found</h5>
                                <p class="text-muted">We've searched more than 150+ Orders We did not find any orders for you search.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <!--end col-->
</div>
<!--end row-->
<!--end row-->
@endsection
@section('script')
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- DataTables JS -->
<script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.11.5/js/dataTables.bootstrap5.min.js"></script>

<!-- DataTables CSS -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap5.min.css">
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script src="{{ URL::asset('build/libs/cleave.js/cleave.min.js') }}"></script>
<script src="{{ URL::asset('build/js/pages/form-input-spin.init.js') }}"></script>

<script src="{{ URL::asset('build/libs/sweetalert2/sweetalert2.min.js') }}"></script>

<script src="{{ URL::asset('build/js/app.js') }}"></script>
@endsection