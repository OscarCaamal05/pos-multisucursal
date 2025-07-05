// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from './utils/alerts';

// =========================================
// VARIABLES GLOBALES
// =========================================

let rolTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    bindEvents();

    $('#assignPermission').on('hidden.bs.modal', function () {
        const $select = $('#permission');
        $select.multiSelect('destroy');
        $select.empty();
    });
})

function bindEvents() {
    bindFormSubmit();
    bindModalCloseEvents();
    bindModalCloseEventsRol();
    bindDeleteEvents();
    bindEditEvents();
    bindFormSubmitRol();
    bindToggleStatusEvents();
    bindAsigEvents();
}

function initializeDataTable() {
    rolTable = $('#rolesTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/roles/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            {
                data: 'id',
                name: 'actions',
                orderable: false,
                searchable: false,
                render: renderActionsColumn
            }
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
    });
}

/**
 * Renderiza los botones de acciones (editar, eliminar).
 */
function renderActionsColumn(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-primary btn-asign-rol" data-id="${data}">
                <i class="ri-settings-4-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-warning btn-edit-rol" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-rol" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Envío del formulario
// =========================================

/**
 * Maneja el envío del formulario para crear roles.
 */
function bindFormSubmit() {
    $('#rolesForm').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const rolId = $('#rolId').val();
        const isEdit = rolId != 0;

        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/roles/${rolId}` : $form.data('action'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#rolModal').modal('hide');
                rolTable.ajax.reload();
                showAlert(
                    'success',
                    'Éxito',
                    response.create ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetRolesForm();
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Vincula evento de asignacion
// =========================================

/**
 * Asocia el evento de asignacion de permisos a los roles.
 */
function bindAsigEvents() {
    $('#rolesTable tbody').on('click', '.btn-asign-rol', function () {
        const $button = $(this);
        const rowData = rolTable.row($button.closest('tr')).data();

        showAsignPermissionModal(rowData.id);

    });
}

// =========================================
// FUNCIÓN: Vincula evento de edicion
// =========================================

/**
 * Asocia el evento de edicion de roles.
 */
function bindEditEvents() {
    $('#rolesTable tbody').on('click', '.btn-edit-rol', function () {
        const $button = $(this);
        const rowData = rolTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showRolesModal(rowData);
                }
            }
        );

    });
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de roles.
 */
function bindDeleteEvents() {
    $('#rolesTable tbody').on('click', '.btn-delete-rol', function () {
        const rolId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/roles/${rolId}`,
                        type: 'DELETE',
                        data: {
                            _token: $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function () {
                            showAlert(
                                'success',
                                'Éxito',
                                'El registro fue eliminado exitosamente.'
                            );
                            rolTable.ajax.reload(null, false);
                        },
                        error: function () {
                            showAlert(
                                'error',
                                'Error',
                                'No se pudo eliminar el registro.'
                            );
                        }
                    });
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Maneja eventos de cierre del modal
// =========================================

/**
 * Confirma el cierre del modal si hay datos ingresados.
 */
function bindModalCloseEvents() {
    $(document).on('click', '#btn-cancelar, #btn-close-modal', function (e) {
        e.preventDefault();

        const hasData = $('#name').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#rolModal').modal('hide');
                        resetRolesForm();
                    }
                }
            );
        } else {
            $('#rolModal').modal('hide');
            resetRolesForm();
        }
    });
}

// =========================================
// FUNCIÓN: Abre el modal de roles
// =========================================

/**
 * Muestra el modal de creación o edición de roles.
 *
 * @param {Object|null} data - Datos del rol o null si es nuevo.
 */
function showRolesModal(data = null) {
    resetRolesForm();

    if (data) {
        $('.modal-title').text('Editar rol');
        $('#name').val(data.name);
        $('#rolId').val(data.id);
    } else {
        $('.modal-title').text('Agregar rol');
    }

    $('#rolModal').modal('show');
}
// =========================================
// FUNCIÓN: Abre el modal de asignacion de rol
// =========================================

/**
 * Muestra el modal con el listado de los permisos para los roles.
 *
 * @param {id} data - Id del rol para la asignacion de permisos.
 */
function showAsignPermissionModal(id) {
    $('#assignPermission').modal('show');

    // Opcional: limpiar antes de volver a llenar
    const select = $('#permission');
    select.empty();

    $.ajax({
        url: `/roles/${id}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log(response);
            $('#rolIdPermission').val(response.role.id);
            $('#assignPermissionLabel').text('Asignar permisos: ' + response.role.name);
            // Agregar opciones al <select>
            response.permissions.forEach(function (permission) {
                const isSelected = response.rolePermissions.includes(permission.id);
                select.append(`<option value="${permission.id}" ${isSelected ? 'selected' : ''}>${permission.name}</option>`);
            });

            // Inicializar o refrescar MultiSelect
            if (select.data('multiselect')) {
                // Si ya está inicializado, refresca
                select.multiSelect('refresh');
            } else {
                // Si no, inicializa por primera vez
                select.multiSelect({
                    selectableHeader: "<input type='text' class='form-control mb-2' autocomplete='off' placeholder='Buscar...'>",
                    selectionHeader: "<div class='custom-header'>Asignados</div>",
                    afterInit: function (ms) {
                        const that = this;
                        const $selectableSearch = that.$selectableUl.prev();
                        const $selectionSearch = that.$selectionUl.prev();
                        const selectableSearchString = '#' + that.$container.attr('id') + ' .ms-elem-selectable:not(.ms-selected)';
                        const selectionSearchString = '#' + that.$container.attr('id') + ' .ms-elem-selection.ms-selected';

                        that.qs1 = $selectableSearch.quicksearch(selectableSearchString)
                            .on('keydown', function (e) {
                                if (e.which === 40) {
                                    that.$selectableUl.focus();
                                    return false;
                                }
                            });

                        that.qs2 = $selectionSearch.quicksearch(selectionSearchString)
                            .on('keydown', function (e) {
                                if (e.which === 40) {
                                    that.$selectionUl.focus();
                                    return false;
                                }
                            });
                    }
                });
            }
        },
        error: function () {
            Swal.fire('Error', 'No se pudo cargar los roles.', 'error');
        }
    });
}

// =========================================
// FUNCIÓN: asginar permisos a roles
// =========================================

/**
 * Asignar los permisos a los roles y guardarlo en la base de datos
 */
function bindFormSubmitRol() {
    $('#assignPermissionForm').on('submit', function (e) {
        e.preventDefault();

        const rolId = $('#rolIdPermission').val();
        const selectedPermission = $('#permission').val(); // Esto será un array de IDs

        $.ajax({
            url: `/roles/assignPermission/${rolId}`,
            method: 'POST',
            data: {
                permission: selectedPermission,
                _token: $('meta[name="csrf-token"]').attr('content'),
                _method: 'PUT'
            },
            success: function (response) {
                showAlert(
                    'success',
                    'Éxito',
                    'Rol asignado correctamente.'
                );
                $('#assignPermission').modal('hide');
            },
            error: function (xhr) {
                Swal.fire('Error', 'Ocurrió un error al asignar los roles.', 'error');
            }
        });

    });

}

// =========================================
// FUNCIÓN: Cerrar el modal de permisos
// =========================================

/**
 * Mensaje de confirmacion al cerrar el modal para asignar los permisos a los roles
 */
function bindModalCloseEventsRol() {
    $('#btn-close-modal-permission').on('click', function () {
        showConfirmationAlert(
            '¿Estás seguro?',
            'Cerrar la ventana.',
            'Sí, Cerrar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $('#assignPermission').modal('hide');
                }
            }
        );
    })
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de roles a su estado inicial.
 */
function resetRolesForm() {
    $('#rolesForm')[0].reset();
    $('#rolId').val(0);
    clearValidationErrors();
    $('.modal-title').text('Agregar rol');
}

// =========================================
// CONSTANTES: Configuración idioma DataTable
// =========================================
const idiomaEspanol = {
    loadingRecords: "Cargando...",
    paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
    },
    processing: "Procesando...",
    search: "Buscar:",
    lengthMenu: "Mostrar _MENU_ registros",
    emptyTable: "No hay datos disponibles",
    info: "Mostrando registros del _START_ al _END_ de _TOTAL_ registros"
};