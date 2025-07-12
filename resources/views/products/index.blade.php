@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" type="text/css" />
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Inventario @endslot
@slot('title') Productos @endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxProducts.js')
<!-- Modal para crear/editar -->
<div class="modal zoomIn" id="productsModal" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="productsModalLabel">Agregar Producto</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-product"></button>
            </div>
            <form id="productForm"
                data-store-url="{{ route('products.store') }}"
                data-update-url-base="/products/">
                <div class="modal-body">
                    @csrf
                    <input type="hidden" name="productId" id="productId" value="0">
                    <div class="row">
                        <div class="col-md-2">
                            <div class="nav nav-pills flex-column nav-pills-tab custom-verti-nav-pills text-center" role="tablist" aria-orientation="vertical">
                                <a class="nav-link active show" id="custom-v-pills-general-tab" data-bs-toggle="pill" href="#custom-v-pills-general" role="tab" aria-controls="custom-v-pills-general"
                                    aria-selected="true">
                                    <i class="ri-home-4-line d-block fs-20 mb-1"></i>
                                    General</a>
                                <a class="nav-link" id="custom-v-pills-additional-tab" data-bs-toggle="pill" href="#custom-v-pills-additional" role="tab" aria-controls="custom-v-pills-additional"
                                    aria-selected="false">
                                    <i class="ri-file-add-line  d-block fs-20 mb-1"></i>
                                    Adicional</a>
                                <a class="nav-link" id="custom-v-pills-price-suppliers-tab" data-bs-toggle="pill" href="#custom-v-pills-price-suppliers" role="tab" aria-controls="custom-v-pills-price-suppliers"
                                    aria-selected="false">
                                    <i class="ri-user-2-line d-block fs-20 mb-1"></i>
                                    Precio Por Proveedor</a>
                                <a class="nav-link" id="custom-v-pills-image-tab" data-bs-toggle="pill" href="#custom-v-pills-image" role="tab" aria-controls="custom-v-pills-image"
                                    aria-selected="false">
                                    <i class="ri-image-add-fill d-block fs-20 mb-1"></i>
                                    Imagen</a>
                            </div>
                        </div> <!-- end col-->
                        <div class="col-lg-10">
                            <div class="tab-content text-muted mt-3 mt-lg-0">
                                <div class="tab-pane fade active show" id="custom-v-pills-general" role="tabpanel" aria-labelledby="custom-v-pills-general-tab">
                                    @include('products.form-fields-general')
                                </div><!--end tab-pane-->
                                <div class="tab-pane fade" id="custom-v-pills-additional" role="tabpanel" aria-labelledby="custom-v-pills-additional-tab">
                                    @include('products.form-fields-additional')
                                </div><!--end tab-pane-->
                                <div class="tab-pane fade" id="custom-v-pills-price-suppliers" role="tabpanel" aria-labelledby="custom-v-pills-price-suppliers-tab">
                                </div><!--end tab-pane-->
                                <div class="tab-pane fade" id="custom-v-pills-image" role="tabpanel" aria-labelledby="custom-v-pills-image-tab">
                                    @include('products.form-fields-image')
                                </div><!--end tab-pane-->
                            </div>
                        </div> <!-- end col-->
                    </div> <!-- end row-->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancelar">Cancelar</button>
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

<div class="row">
    <div class="col-xl-12">
        <div class="card">
            <div class="card-header align-items-center d-flex">
                <h4 class="card-title mb-0 flex-grow-1">Lista de Productos</h4>
                <div class="flex-shrink-0">
                    <div class="form-check form-switch form-switch-right form-switch-md">
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#productsModal">Agregar Producto</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <div class="table-responsive">
                    <table class="table align-middle table-nowrap mb-0" id="productsTable">
                        <thead class="table-light">
                            <tr>
                                <th scope="col" class="text-center">ID</th>
                                <th scope="col" class="text-center">Nombre</th>
                                <th scope="col" class="text-center">Codigo</th>
                                <th scope="col" class="text-center">Categoria</th>
                                <th scope="col" class="text-center">Departamento</th>
                                <th scope="col" class="text-center">Precio venta</th>
                                <th scope="col" class="text-center">Exist.</th>
                                <th scope="col" class="text-center">Unit venta</th>
                                <th scope="col" class="text-center">Estado</th>
                                <th scope="col" class="text-center">Acciones</th>
                            </tr>
                        </thead>

                    </table>
                </div>
            </div><!-- end card-body -->
        </div><!-- end card -->
    </div>
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

<!-- AlpineJS para manejar el modal -->
<script src="{{ URL::asset('build/js/alpine.min.js') }}"></script>

<script src="{{ URL::asset('build/js/app.js') }}"></script>
<script src="{{ URL::asset('build/js/functionAjaxCategories.js') }}"></script>
@endsection