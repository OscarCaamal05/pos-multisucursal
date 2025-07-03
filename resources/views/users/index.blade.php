@extends('layouts.master')
@section('title') @lang('translation.starter') @endsection
@section('content')
@component('components.breadcrumb')
@slot('li_1') Control de acceso @endslot
@slot('title') Usuarios @endslot
@endcomponent
@vite('resources/js/functions_ajax/functionAjaxUsers.js')
<!-- Modal para asignar los roles -->
<div class="modal zoomIn" id="assignRoles" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title text-center" id="assignPermissionLabel">Asignar roles</h4>
                <button class="btn-close py-0" type="button" aria-label="Close" id="btn-close-modal-roles"></button>
            </div>
            <form id="formAssignRoles">
                <div class="modal-body">
                    <div>
                        <h5 class="fs-9 mb-1 textUser"></h5>
                        <p class="text-muted">Lista de roles en el sistema </p>

                        @csrf
                        <input type="hidden" name="rolId" id="userIdRol" value="0">
                        <select multiple="multiple" name="roles[]" id="roles">

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

<!-- Modal con formulario -->
<div class="modal zoomIn" id="userModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Agregar Usuario</h5>
                <button class="btn-close py-0" type="button" id="btn-close-modal" aria-label="Close"></button>
            </div>
            <form id="userForm" method="POST" action="{{ route('users.store') }}">
                @csrf
                <div class="modal-body">
                    <!-- Campos -->
                    <div class="mb-3">
                        <label for="name">Usuario</label>
                        <input type="text" class="form-control @error('name') is-invalid @enderror"
                            name="name" id="name" value="{{ old('name') }}">
                        @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="mb-3">
                        <label for="email">Correo</label>
                        <input type="email" class="form-control @error('email') is-invalid @enderror"
                            name="email" id="email" value="{{ old('email') }}">
                        @error('email') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="mb-3">
                        <label for="password">Contraseña</label>
                        <input type="password" class="form-control @error('password') is-invalid @enderror"
                            name="password" id="password">
                        @error('password') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    <div class="mb-3">
                        <label for="password_confirmation">Confirmar Contraseña</label>
                        <input type="password" class="form-control" name="password_confirmation" id="password_confirmation">
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


<div class="row">
    <div class="col-xl-12">
        <div class="card">
            <div class="card-header align-items-center d-flex">
                <h4 class="card-title mb-0 flex-grow-1">Lista de usuarios</h4>
                <div class="flex-shrink-0">
                    <div class="form-check form-switch form-switch-right form-switch-md">
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#userModal">Agregar Usuario</button>
                    </div>
                </div>
            </div><!-- end card header -->

            <div class="card-body">
                <p class="text-muted">Usuarios registrados en el sistema.</p>
                <div class="table-responsive">
                    <table class="table align-middle table-nowrap mb-0" id="usersTable">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Usuario</th>
                                <th scope="col">Correo</th>
                                <th scope="col">Estado</th>
                                <th scope="col"></th>
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.13.0/cdn.min.js" defer></script>

<script src="{{ URL::asset('build/libs/multiselect/js/jquery.multi-select.js') }}"></script>
<script src="{{ URL::asset('build/libs/multiselect/js/jquery.quicksearch.js') }}"></script>
<script src="{{ URL::asset('build/js/app.js') }}"></script>
@endsection