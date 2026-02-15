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
<!-- Modal -->
<div class="modal fade zoomIn" id="productsModal" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
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
                <input type="hidden" name="productId" id="productId" value="0">
                <div class="modal-body">
                    <form id="productForm"
                        data-store-url="{{ route('products.store') }}"
                        data-update-url-base="/products/">
                        <input type="hidden" name="productId" id="productId" value="0">
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
                    <button type="button" class="btn btn-danger" id="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>
<!--end modal-->

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
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#productsModal"><i class="ri-add-line align-bottom me-1"></i> Agregar Articulo</button>
                        <button type="button" class="btn btn-success"><i class="ri-file-excel-2-line align-bottom me-1"></i> Importar</button>
                        <button type="button" class="btn btn-danger"><i class=" ri-file-pdf-line align-bottom me-1"></i> Exportar</button>
                        <button type="button" class="btn btn-success"><i class="ri-file-excel-2-line align-bottom me-1"></i> Exportar</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <div class="row g-3 mb-1">
                    <div class="col-12 col-md-12 col-lg-3">
                        <div class="search-box">
                            <input type="text" class="form-control" id="search-category-input" placeholder="Buscar Categoria">
                            <i class="ri-search-line search-icon"></i>
                        </div>
                    </div>
                    <!--end col-->
                    <div class="col-12 col-md-6 col-lg-3">
                        <div>
                            <select class="form-control" data-plugin="choices" data-choices data-choices-search-false name="choices-department" id="id-department-filter">
                                <option value="all-department" selected>Todo los departamentos</option>
                                @foreach ($departments as $department)
                                <option value="{{ $department->id }}">
                                    {{ $department->name }}
                                </option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <!--end col-->
                    <div class="col-12 col-md-6 col-lg-2">
                        <div>
                            <select class="form-select" name="choices-category-input" data-choices data-choices-search-false id="id-status-filter">
                                <option value="all-status" selected>Todo los estados</option>
                                <option value="1">Activos</option>
                                <option value="0">Inactivos</option>
                            </select>
                        </div>
                    </div>
                    <!--end col-->
                </div>
                <div class="table-responsive table-card mt-1">
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