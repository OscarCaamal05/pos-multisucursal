@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" type="text/css" />
<link href="{{ URL::asset('build/libs/@tarekraafat/autocomplete.js/css/autoComplete.css') }}" rel="stylesheet">
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Ventas @endslot
@slot('title') Realizar una venta @endslot
@endcomponent
@vite('resources/js/functions_ajax/modules/sales/saleMain.js')

<!------------------------------------------------------------------------------------------------------------
    Modal para detalles de pago 
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-payment-detail" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title text-end" id="modal-product-details-Label">Finalizar Venta</h5>
            </div>
            <form id="paymentDetails">
                @csrf
                <div class="modal-body">
                    @include('temp_sale.payment-fields-form')
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-close-modal-payment">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn-process-payment">Procesar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!--=================================================================================================
// MODAL PARA MOSTRAR EL CAMBIO DE LA VENTA
===================================================================================================-->

<div class="modal zoomIn" id="modal-change" role="dialog" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered">

        <div class="modal-content">

            <div class="modal-header">

                <h5 class="modal-title" id="staticBackdropLabel">Cambio</h5>

            </div>

            <div class="modal-body">

                <div class="border-bottom">
                    <!--Card para mostrar el total de pago-->
                    <div class="card-body d-flex justify-content-center align-items-center">
                        <div class="col-auto ">
                            <div class="d-flex justify-content-center mb-3">
                                <img src="{{URL::asset('build/images/svg-pos/025-intercambiar.svg')}}" alt="" class="avatar-lg" />
                            </div>
                            <div class="row">
                                <span class="info-change-sale align-items-center fs-1 fw-bold"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--Boton para hacer el proceso de la venta-->
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-success btn-label waves-effect waves-light procesar" id="btn-confirm-change">
                    <i class="ri-checkbox-circle-line label-icon align-middle fs-16 me-2"></i> Aceptar
                </button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para mostrar las ventas en espera
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-sales-waiting" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-product-details-Label">Ventas en espera</h5>
            </div>
            <div class="modal-body">
                <div class="table-responsive table-card">
                    <table class="table table-nowrap align-middle mb-0" id="waiting-sales-table">
                        <thead class="table-light text-muted">
                            <tr>
                                <th scope="col" style="display: none">ID</th>
                                <th scope="col" style="display: none">customer_id</th>
                                <th scope="col" class="text-center">Fecha</th>
                                <th scope="col" class="text-center">Cliente</th>
                                <th scope="col" class="text-center">Total</th>
                            </tr>
                        </thead>

                        <tbody>

                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="btn-close-pending">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para listar los productos en el almacén
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-products" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h4 class="card-title mb-0">Productos En Almacén</h4>
                <button class="btn btn-primary" id="btn-add-article">
                    <span class="me-1">
                        <i class="ri-user-add-line"></i>
                    </span>Agregar Articulo
                </button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="card-body border-bottom-dashed border-bottom">
                        <div class="row g-3 mx-1 mb-2">
                            <div class="col-xl-4">
                                <div class="search-box">
                                    <input type="text" class="form-control" id="searchArticleInput" placeholder="Buscar Articulo">
                                    <i class="ri-search-line search-icon"></i>
                                </div>
                            </div>
                        </div>
                        <!--end row-->
                    </div>
                </div>
                <div class="table-responsive table-card">
                    <table class="table table-nowrap align-middle mb-0" id="tableProducts">
                        <thead class="table-light text-muted">
                            <tr>
                                <th scope="col" class="text-center">ID</th>
                                <th scope="col" class="text-center">Nombre</th>
                                <th scope="col" class="text-center">Codigo</th>
                                <th scope="col" class="text-center">Categoria</th>
                                <th scope="col" class="text-center">Departamento</th>
                                <th scope="col" class="text-center">Precio venta</th>
                                <th scope="col" class="text-center">Exist.</th>
                                <th scope="col" class="text-center">Unit venta</th>
                            </tr>
                        </thead>

                        <tbody>

                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="btn-close-product">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para agregar articulos al almacén
-------------------------------------------------------------------------------------------------------------->
<div class="modal fade zoomIn" id="productsModal" tabindex="-1" data-bs-backdrop="false" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="productsModalLabel">Agregar Producto</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-product"></button>
            </div>
            <div class="modal-content border-0 mt-3">

                <ul class="nav nav-tabs nav-tabs-custom nav-success p-2 pb-0 bg-light" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#generalDetails" role="tab"
                            aria-selected="true">
                            General
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#additionalDetails" role="tab"
                            aria-selected="false">
                            Adicionales
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#imageDetails" role="tab"
                            aria-selected="false">
                            Imagen
                        </a>
                    </li>
                </ul>
            </div>
            <form id="productForm"
                data-store-url="{{ route('products.store') }}"
                data-update-url-base="/products/">
                @csrf
                <input type="hidden" name="productId" id="productId" value="0">
                <div class="modal-body">
                    <div class="tab-content">
                        <div class="tab-pane active" id="generalDetails" role="tabpanel">
                            @include('products.form-fields-general')
                        </div>
                        <div class="tab-pane" id="additionalDetails" role="tabpanel">
                            @include('products.form-fields-additional')
                        </div>
                        <div class="tab-pane" id="imageDetails" role="tabpanel">
                            @include('products.form-fields-image')
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancelar-product">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal para crear/editar -->
<div class="modal zoomIn" id="categoryModal" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="categoryModalLabel">Agregar Categoria</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-category"></button>
            </div>
            <form id="categoryForm"
                data-store-url="{{ route('categories.store') }}"
                data-update-url-base="/categories/">
                @csrf
                <input type="hidden" name="categoryId" id="categoryId" value="0">
                <div class="modal-body">
                    @include('categories.form-fields')
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancelar-category">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal zoomIn" id="departmentModal" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="departmentModalLabel">Agregar Departamento</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-department"></button>
            </div>
            <form id="departmentForm"
                data-store-url="{{ route('departments.store') }}"
                data-update-url-base="/departments/">
                @csrf
                <input type="hidden" name="departmentId" id="departmentId" value="0">
                <div class="modal-body">
                    @include('departments.form-fields')
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancelar-department">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>
<!------------------------------------------------------------------------------------------------------------
    Modal para listar a los clientes registrados en el sistema
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-customers" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header d-flex justify-content-between align-items-center">
                <h4 class="card-title mb-0">Lista de Clientes</h4>
                <button class="btn btn-primary" id="btn-add-customer">
                    <span class="me-1">
                        <i class="ri-user-add-line"></i>
                    </span>Agregar Cliente
                </button>
            </div>
            <div class="modal-body">
                <div class="row mb-3">
                    <div class="card-body border-bottom-dashed border-bottom">
                        <div class="row g-3 mx-1 mb-2">
                            <div class="col-xl-4">
                                <div class="search-box">
                                    <input type="text" class="form-control" id="search-customer-input" placeholder="Buscar cliente">
                                    <i class="ri-search-line search-icon"></i>
                                </div>
                            </div>
                        </div>
                        <!--end row-->
                    </div>
                </div>
                <div class="table-responsive table-card">
                    <table class="table table-nowrap align-middle mb-0" id="tableCustomers">
                        <thead class="table-light text-muted">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">RFC</th>
                                <th scope="col">Telefono</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Credito disponible</th>
                                <th scope="col">Credito limite</th>
                            </tr>
                        </thead>

                        <tbody>

                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="btn-close-list-customer">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para agregar un nuevo cliente
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="customerModal" data-bs-backdrop="false" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="customerModalLabel">Agregar Cliente</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-customer"></button>
            </div>
            <form id="customerForm"
                data-store-url="{{ route('customers.store') }}"
                data-update-url-base="/customers/">
                @csrf
                <input type="hidden" name="customerId" id="customerId" value="0">
                <div class="modal-body">
                    @include('customers.form-fields')
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancelar-customer">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para editar el nombre del producto en la venta
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-edit-product-name" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-edit-product-name-label">Editar Nombre</h5>
            </div>

            <div class="modal-body">
                <div class="mb-3">
                    <div class="pb-2 mb-3 text-center">
                        <h4 class="text-body m-1 product-name-label"></h4>
                    </div>
                    <input type="text" class="form-control" id="product-new-name" name="product-new_name" value="">
                </div>
            </div>
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-primary" id="btn-save-edit-product-name">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para editar la cantidad del producto en la venta
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-edit-product-quantity" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-edit-product-quantity-label">Nueva Cantidad</h5>
            </div>

            <div class="modal-body">
                <div class="mb-3">
                    <div class="pb-2 mb-3 text-center">
                        <h4 class="text-body m-1 product-name-label"></h4>
                    </div>
                    <div class="d-flex justify-content-center">
                        <div class="input-step justify-content-between" style="height: 50px; width: 150px;">
                            <button type="button" class="minus fw-semibold fs-4">–</button>
                            <input type="text" style="text-align: center;" class="fs-3 fw-semibold product-quantity" value="">
                            <button type="button" class="plus fw-semibold fs-4">+</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-primary" id="btn-save-product-quantity">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para editar el descuento del producto en la venta
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-edit-product-discount" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-edit-product-discount-label">Agregar Descuento</h5>
            </div>

            <div class="modal-body">
                <div class="mb-3">

                    <div class="pb-2 mb-3 text-center">
                        <h4 class="text-body m-1 product-name-label"></h4>
                    </div>

                    <div class="d-flex flex-column align-items-center mb-3">
                        <label for="product-discount-percentage" class="form-label fw-semibold mb-1">Descuento (%)</label>
                        <input type="text" class="form-control form-control-lg text-center product-discount w-50 fs-3 fw-semibold" id="product-discount-percentage" name="product-discount-percentage" value="">
                    </div>
                    <div class="d-flex flex-column align-items-center">
                        <label for="product-discount-number" class="form-label fw-semibold mb-1">Descuento ($)</label>
                        <input type="text" class="form-control form-control-lg text-center product-discount w-50 fs-3 fw-semibold" id="product-discount-number" name="product-discount-number" value="">
                    </div>

                </div>
            </div>
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-primary" id="btn-save-product-discount">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Modal para editar el precio del producto en la venta
-------------------------------------------------------------------------------------------------------------->
<div class="modal zoomIn" id="modal-edit-product-price" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modal-edit-product-price-label">Editar Precio</h5>
            </div>

            <div class="modal-body">
                <div class="mb-3">

                    <div class="pb-2 mb-3 text-center">
                        <h4 class="text-body m-1 product-name-label"></h4>
                    </div>
                    <div class="row align-items-center justify-content-center">
                        <div class="col-md-6">
                            <div class="d-flex ">
                                <select class="form-select" size="3" multiple aria-label="multiple select example" id="select-product-price">
                                    
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer d-flex justify-content-center">
                <button type="button" class="btn btn-primary" id="btn-save-product-price">Aceptar</button>
            </div>
        </div>
    </div>
</div>

<!------------------------------------------------------------------------------------------------------------
    Vista principal para realizar una compra
-------------------------------------------------------------------------------------------------------------->
<div class="row">
    <div class="col-xl-9">
        <!-- Card de los input de la parte superior de los datos generales de compra-->
        <div class="card">
            <!-- INPUT OCULTOS PARA REALIZAR FUNCIONES ESPECIFICAS DE VENTAS-->
            <input type="hidden" name="temp_detail_id" id="temp_detail_id" value="0">
            <input type="hidden" name="product_id" id="product_id" value="0">
            <input type="hidden" name="temp_sale_id" id="temp_sale_id" value="{{ $temp->id_temp_sale ?? 0 }}">
            <div class="card-body">
                <form action="javascript:void(0);">
                    <div class="row mb-1 justify-content-between align-items-center">

                        <div class="col-sm-4">
                            <div class="input-group align-items-center w-100">
                                <div class="form-icon">
                                    <input type="text"
                                        class="form-control form-control-icon auto-select"
                                        name="auto_complete_product"
                                        id="auto_complete_product"
                                        value="">
                                    <i class="ri-barcode-box-line"></i>
                                </div>
                                <button type="button" class="btn btn-ghost-dark waves-effect waves-light" id="btn-search-product">
                                    <i class="ri-search-2-line"></i>
                                </button>
                            </div>
                        </div><!--end col-->


                        <div class="col-auto">
                            <input type="text" class="form-control" data-provider="flatpickr" data-date-format="d M, Y" id="date-operation" value="{{ date('d M, Y') }}">
                        </div>
                        <div class="pb-2 text text-end-muted border-bottom border-light text-center"></div>
                    </div><!--end row-->

                    <div class="row justify-content-between align-items-center">
                        <div class="col-sm-3">
                            <div class="input-group align-items-center">
                                <label class="form-label me-3" for="document-type">Documento</label>
                                <select class="form-select" id="document-type">
                                    @foreach ($typesDocuments as $documents)
                                    <option value="{{ $documents->id }}">
                                        {{ $documents->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>
                        </div><!--end col-->

                        <div class="col-sm-3">
                            <div class="input-group align-items-center">
                                <label class="form-label me-3" for="voucher-type">Comprobante</label>
                                <select class="form-select" id="voucher-type">
                                    @foreach ($typesReceipts as $voucher)
                                    <option value="{{ $voucher->id }}"
                                        data-prefix="{{ $voucher->series_prefix }}"
                                        data-number="{{ $voucher->current_number }}">
                                        {{ $voucher->name }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>
                        </div><!--end col-->

                        <div class="col-sm-2">
                            <div class="input-group align-items-center">
                                <label class="form-label me-3" for="series-prefix">Serie</label>
                                <input type="text" class="form-control" id="series-prefix" readonly>
                            </div>
                        </div><!--end col-->

                        <div class="col-sm-2">
                            <div class="input-group align-items-center auto-select">
                                <label class="form-label me-3" for="current-number">Folio</label>
                                <input type="text" class="form-control" id="current-number" readonly>
                            </div>
                        </div><!--end col-->
                    </div><!--end row -->
                </form>

            </div>
        </div>
        <!-- Card de los botones de accion-->
        <div class="d-flex">
            <div class=" flex-shrink-1  pe-2">
                <div class="card mb-2">
                    <div class="card-header m-0">
                        <p class="m-0 text-center">Opciones</p>
                    </div>
                    <button class="btn btn-link waves-effect p-1 mb-1" id="btn-edit-product">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/033-editar.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Editar (F1)</span>
                    </button>
                    <button class="btn btn-link waves-effect p-1" id="btn-edit-product-quantity">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/020-caja-de-carton-1.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Cantidad (F2)</span>
                    </button>
                    <button class="btn btn-link waves-effect p-1" id="btn-edit-product-discount">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/035-descuento.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Descuento (F3)</span>
                    </button>
                    <button class="btn btn-link waves-effect p-1" id="btn-edit-product-price">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/017-etiqueta-de-venta.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Precios (F4)</span>
                    </button>
                </div>
                <div class="card mb-2">
                    <button class="btn btn-link waves-effect p-1" id="btn-send-waiting">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/034-reloj-de-arena.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Espera</span>
                    </button>
                    <button class="btn btn-link waves-effect p-1" id="btn-sale-pending">
                        <div class=" d-flex justify-content-center">
                            <img src="{{URL::asset('build/images/svg-pos/reloj-de-arena.svg')}}" alt="" class="avatar-xs" />
                        </div>
                        <span class="text-muted" style="font-size: 12px;">Restaurar</span>
                    </button>
                </div>
            </div>

            <!-- Tabla de los productos agregados a la compra -->
            <div class="card w-100">
                <div class="card-body">
                    <div class="table-responsive table-card">
                        <table class="table table-nowrap align-middle mb-0" id="tableTempSale">
                            <thead class="table-light text-muted">
                                <tr>
                                    <th scope="col" style="display: none">id</th>
                                    <th scope="col" style="display: none">temp_sale_id</th>
                                    <th scope="col" style="display: none">product_id</th>
                                    <th scope="col" class="text-center">Descripcion</th>
                                    <th scope="col" class="text-center">Cantidad</th>
                                    <th scope="col" class="text-center">precio unit.</th>
                                    <th scope="col" class="text-center">Descuento</th>
                                    <th scope="col" class="text-center">Total</th>
                                    <th scope="col" style="display: none">unit</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>

                            <tbody>

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!--end col-->

    <!-- Seccion derecha de detalles del proveedor y totales de la compra -->
    <div class="col-xl-3">
        <div class="card">
            <div class="card-header">
                <div class="d-flex align-items-center">
                    <h5 class="card-title flex-grow-1 mb-0">Detalles del cliente</h5>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-12 mb-3">
                        <div class="input-group align-items-center w-100">
                            <div class="form-icon">
                                <input type="text"
                                    class="form-control form-control-icon auto-select"
                                    name="auto_complete_customer"
                                    id="auto_complete_customer"
                                    dir="ltr"
                                    spellcheck="false"
                                    autocomplete="off"
                                    autocapitalize="off"
                                    value="">
                                <i class="ri-user-2-line"></i>
                            </div>
                            <button type="button" class="btn btn-ghost-dark waves-effect waves-light" id="btn-search-customers">
                                <i class="ri-search-2-line"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-sm-12 mb-3">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0">
                                <img src="{{ URL::asset('build/images/users/user-dummy-img.jpg') }}" alt="" class="avatar-sm rounded">
                                <input type="hidden" name="customer_id" id="customer_id" value="1">
                                <input class="credit-terms" type="hidden" name="credit-terms" id="credit-terms" value="0">
                                <input class="credit-due-date" type="hidden" name="credit-due-date" id="credit-due-date" value="{{ date('Y-m-d') }}">
                                <input class="credit-limit-customer" type="hidden" value="0">
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <h6 class="fs-14 mb-1 customer-name">Publico General</h6>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-7 mb-3">
                        <span>
                            <i class="ri-mail-line me-2 align-middle text-muted fs-16"></i>
                            <span class="customer-email">
                                No registrado
                            </span>
                        </span>
                    </div>
                    <div class="col-sm-5 mb-3">
                        <span>
                            <i class="ri-phone-line me-2 align-middle text-muted fs-16"></i>
                            <span class="customer-phone">
                                No registrado
                            </span>
                        </span>
                    </div>
                    <div class="col-sm-6 mb-2">
                        <span>
                            <i class="ri-bank-line me-2 align-middle text-muted fs-16"></i>
                            <span class="customer-tax-id">
                                No registrado
                            </span>
                        </span>
                    </div>
                    <div class="col-sm-6 mb-2">
                        <span>
                            <i class="ri-wallet-3-line me-2 align-middle text-muted fs-16"></i>
                            <span class="customer-credit-available">
                                Crédito: $0.00
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
                        <input type="number" class="form-control discount-general text-end auto-select"
                            id="general-discount-number"
                            name="general-discount-number"
                            step="0.01"
                            min="0"
                            value="0.00"
                            placeholder="0.00">
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">SubTotal:</p>
                    </div>
                    <div class="">
                        <h4 class="sub-total mb-0"></h4>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">impuesto (I.V.A.):</p>
                    </div>
                    <div class="">
                        <h4 class="tax mb-0"></h4>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">SubTotal sin Iva:</p>
                    </div>
                    <div class="">
                        <h4 class="total-tax mb-0"></h4>
                    </div>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="flex-shrink-0">
                        <p class="text-muted mb-0">Total:</p>
                    </div>
                    <div class="">
                        <h4 class="total mb-0"></h4>
                    </div>
                </div>
            </div>
        </div>

        <!--Botones para procesar la compra-->
        <div class="d-flex">
            <button class="btn btn-soft-success btn-lg w-100 fs-4 fw-semibold" id="btn-modal-payment">
                <i class=" ri-shopping-cart-2-line align-middle me-1"></i> Cobrar (ESC)
            </button>
        </div>
        <div class="d-flex">
            <button class="btn btn-soft-danger mt-2 w-100 fs-4 fw-semibold" id="btn-cancel-sale">
                <i class="mdi mdi-archive-remove-outline align-middle me-1"></i> Cancelar
            </button>
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
<script src="{{ URL::asset('build/libs/cleave.js/cleave.min.js') }}"></script>
<script src="{{ URL::asset('build/js/pages/form-input-spin.init.js') }}"></script>
<!-- AlpineJS para manejar el modal -->
<script src="{{ URL::asset('build/js/alpine.min.js') }}"></script>

<script src="{{ URL::asset('build/js/app.js') }}"></script>
@endsection