@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" type="text/css" />
<link href="{{ URL::asset('build/libs/dropzone/dropzone.css') }}" rel="stylesheet">
<link rel="stylesheet" href="{{ URL::asset('build/libs/filepond/filepond.min.css') }}" type="text/css" />
<link rel="stylesheet" href="{{ URL::asset('build/libs/filepond-plugin-image-preview/filepond-plugin-image-preview.min.css') }}">
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Inventario @endslot
@slot('title') Productos @endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxProducts.js')
@vite('resources/js/functions_ajax/importProducts.js')

<!-- MODAL PARA CREAR/EDITAR PRODUCTO -->
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
<!--end modal-->

<!-- MODAL PARA CREAR UNA CATEGORIA -->
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

<!-- MODAL PARA CREAR UN DEPARTAMENTO -->
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

<!-- MODAL PARA AJUSTAR EL INVENTARIO -->
<div class="modal zoomIn" id="inventoryModal" tabindex="-1" data-bs-backdrop="true" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="inventoryModalLabel">Ajustar Inventario</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-inventory"></button>
            </div>
            <form id="inventoryForm">
                @csrf
                <input type="hidden" name="product-adjust-id" id="product-adjust-id" value="0">
                <div class="modal-body">
                    @include('products.form-fields-inventory-adjustment')
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" id="btn-cancel-modal-inventory">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn-confirm-modal-inventory">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal para importar productos desde Excel -->
<div class="modal fade" id="importExcelModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header bg-light">
                <h5 class="modal-title mb-2">
                    <i class="ri-file-excel-2-line me-2"></i>Importar Productos desde Excel
                </h5>
                <button type="button" class="btn-close mb-2" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="importProductsForm" enctype="multipart/form-data">
                @csrf
                <div class="modal-body">
                    <!-- Información importante -->
                    <div class="alert alert-info" role="alert">
                        <h6 class="alert-heading"><i class="ri-information-line me-2"></i>Instrucciones:</h6>
                        <ul class="mb-0 ps-3">
                            <li>El archivo debe estar en formato .xlsx o .xls</li>
                            <li>Descarga la plantilla para conocer el formato correcto</li>
                            <li>Los campos obligatorios son: Nombre, Código de barras, Categoría, Departamento, Precio de compra, Precio de venta</li>
                        </ul>
                    </div>

                    <!-- Botón para descargar plantilla -->
                    <div class="mb-3">
                        <a href="{{ route('products.download-template') }}" class="btn btn-soft-success w-100">
                            <i class="ri-download-2-line me-2"></i>Descargar Plantilla de Excel
                        </a>
                    </div>

                    <!-- Input para subir archivo -->
                    <div class="mb-3">
                        <label for="excel_file" class="form-label">Seleccionar archivo Excel</label>
                        <input type="file" class="form-control" id="excel_file" name="excel_file" 
                               accept=".xlsx,.xls" required>
                        <div class="invalid-feedback"></div>
                    </div>

                    <!-- Barra de progreso (oculta inicialmente) -->
                    <div class="progress mb-3" id="upload-progress" style="display: none;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%">
                            <span class="progress-text">0%</span>
                        </div>
                    </div>

                    <!-- Resultado de la importación (oculto inicialmente) -->
                    <div id="import-result" style="display: none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="btn-submit-import">
                        <i class="ri-upload-2-line me-1"></i>Importar
                    </button>
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
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#productsModal"><i class="ri-add-line align-bottom me-1"></i> Agregar Producto</button>
                        <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#importExcelModal"><i class="ri-file-excel-2-line align-bottom me-1"></i> Importar</button>
                        <button type="button" class="btn btn-danger"><i class=" ri-file-pdf-line align-bottom me-1"></i> Exportar</button>
                        <button type="button" class="btn btn-success"><i class="ri-file-excel-2-line align-bottom me-1"></i> Exportar</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <div class="row g-3 mb-1">
                    <div class="col-12 col-md-12 col-lg-3">
                        <div class="search-box">
                            <input type="text" class="form-control" id="search-product-input" placeholder="Buscar Producto">
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
                    <div class="col-12 col-md-6 col-lg-3">
                        <div>
                            <select class="form-control" data-plugin="choices" data-choices data-choices-search-false name="choices-category" id="id-category-filter">
                                <option value="all-category" selected>Todo las categorias</option>
                                @foreach ($categories as $category)
                                <option value="{{ $category->id }}">
                                    {{ $category->name }}
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

<script src="{{ URL::asset('build/libs/dropzone/dropzone-min.js') }}"></script>
<script src="{{ URL::asset('build/libs/filepond/filepond.min.js') }}"></script>
<script src="{{ URL::asset('build/libs/filepond-plugin-image-preview/filepond-plugin-image-preview.min.js') }}">
</script>
<script
    src="{{ URL::asset('build/libs/filepond-plugin-file-validate-size/filepond-plugin-file-validate-size.min.js') }}">
</script>
<script
    src="{{ URL::asset('build/libs/filepond-plugin-image-exif-orientation/filepond-plugin-image-exif-orientation.min.js') }}">
</script>
<script src="{{ URL::asset('build/libs/filepond-plugin-file-encode/filepond-plugin-file-encode.min.js') }}"></script>

<!-- AlpineJS para manejar el modal -->
<script src="{{ URL::asset('build/js/alpine.min.js') }}"></script>

<script src="{{ URL::asset('build/js/app.js') }}"></script>
<script src="{{ URL::asset('build/js/functionAjaxCategories.js') }}"></script>
@endsection