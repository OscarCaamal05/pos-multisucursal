@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Control de acceso @endslot
@slot('title') Roles @endslot
@endcomponent

<!-- Modal para asignar permisos -->
<div class="modal zoomIn" id="assignPermission" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title text-center" id="assignPermissionLabel">Asignar permisos</h4>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-permission"></button>
            </div>
            <form id="formAssignPermission">
                <div class="modal-body">
                    <div>
                        <h5 class="fs-9 mb-1 textRol"></h5>
                        <p class="text-muted">Lista de permisos en el sistema </p>

                        @csrf
                        <input type="hidden" name="rolId" id="rolIdPermission" value="0">
                        <select multiple="multiple" name="permission[]" id="permission">

                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">Aplicar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal para crear/editar -->
<div class="modal zoomIn" id="rolModal" tabindex="-1" aria-hidden="true" data-store-url="{{ route('roles.store') }}"
    data-update-url-base="/roles/">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="rolModalLabel">Agregar Rol</h5>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal"></button>
            </div>
            <form id="rolesForm">
                @csrf
                <input type="hidden" name="rolId" id="rolId" value="0">
                <div class="modal-body">
                    @include('roles.form-fields')
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
                <h4 class="card-title mb-0 flex-grow-1">Lista de roles</h4>
                <div class="flex-shrink-0">
                    <div class="form-check form-switch form-switch-right form-switch-md">
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#rolModal">Agregar Rol</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <p class="text-muted">Roles registrados en el sistema.</p>
                <div class="table-responsive">
                    <table class="table align-middle table-nowrap mb-0" id="rolesTable">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Nombre</th>
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

<!-- AlpineJS para manejar el modal -->
<script src="{{ URL::asset('build/js/alpine.min.js') }}"></script>
<script src="{{ URL::asset('build/libs/multi.js/multi.min.js') }}"></script>
<script src="{{ URL::asset('build/js/app.js') }}"></script>
<script src="{{ URL::asset('build/js/functionAjaxRoles.js') }}"></script>
@endsection