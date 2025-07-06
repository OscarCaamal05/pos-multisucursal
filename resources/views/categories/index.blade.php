@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('css')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" type="text/css" />
@endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Inventario @endslot
@slot('title') Categorias @endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxCategories.js')
<!-- Modal para crear/editar -->
<div class="modal zoomIn" id="categoryModal" data-bs-backdrop="true" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="categoryModalLabel">Agregar Categoria</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal"></button>
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
                    <button type="button" class="btn btn-danger" id="btn-cancelar">Cancelar</button>
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
                <h4 class="card-title mb-0 flex-grow-1">Lista de Categorias</h4>
                <div class="flex-shrink-0">
                    <div class="form-check form-switch form-switch-right form-switch-md">
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#categoryModal">Agregar Categoria</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <div class="table-responsive">
                    <table class="table align-middle table-nowrap mb-0" id="categoriesTable">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Nombre</th>
                                <th scope="col">Descripcion</th>
                                <th scope="col" style="display: none;">Departamento_id</th>
                                <th scope="col">Departamento</th>
                                <th scope="col">Estado</th>
                                <th scope="col">Acciones</th>
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