// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from './utils/alerts';

// =========================================
// VARIABLES GLOBALES
// =========================================

let userTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    bindEvents();

    $('#assignRoles').on('hidden.bs.modal', function () {
        const $select = $('#roles');
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
}

function initializeDataTable() {
    userTable = $('#usersTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/users/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            { data: 'email', name: 'email' },
            {
                data: 'status',
                name: 'status',
                render: renderStatusColumn
            },
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
 * Renderiza la columna de estado con el switch de activación.
 */
function renderStatusColumn(data, type, row) {
    const badgeClass = data === 1 ? 'bg-success-subtle text-success' :
        data === 0 ? 'bg-danger-subtle text-danger' :
            'bg-secondary-subtle text-secondary';
    const badgeText = data === 1 ? 'Activo' :
        data === 0 ? 'Inactivo' :
            'Desconocido';

    return `
        <div class="d-flex align-items-center justify-content-between">
            <span class="badge ${badgeClass}">${badgeText}</span>
            <div class="form-check form-switch">
                <input 
                    class="form-check-input toggle-status"
                    type="checkbox"
                    role="switch"
                    data-user-id="${row.id}"
                    ${data == 1 ? 'checked' : ''}
                >
            </div>
        </div>
    `;
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
            <a href="javascript:void(0);" class="link-danger btn-delete-user" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Envío del formulario
// =========================================

/**
 * Maneja el envío del formulario para crear usuarios.
 */
function bindFormSubmit() {
    $('#userForm').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);


        clearValidationErrors();

        $.ajax({
            url: $form.data('action'),
            method: 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#userModal').modal('hide');
                userTable.ajax.reload();
                showAlert(
                    'success',
                    'Éxito',
                    response.create ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetUsersForm();
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Vincula evento de edición
// =========================================

/**
 * Asocia el evento de edición de departamento.
 */
function bindEditEvents() {
    $('#usersTable tbody').on('click', '.btn-asign-rol', function () {
        const $button = $(this);
        const rowData = userTable.row($button.closest('tr')).data();

        showAsignRolModal(rowData.id);

    });
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de categorías.
 */
function bindDeleteEvents() {
    $('#usersTable tbody').on('click', '.btn-delete-user', function () {
        const userId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/users/${userId}`,
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
                            userTable.ajax.reload(null, false);
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
// FUNCIÓN: Vincula evento de cambio de estado
// =========================================

/**
 * Asocia el evento de activación/desactivación del estado de la categoría.
 */
function bindToggleStatusEvents() {
    $(document).on('change', '.toggle-status', function () {
        const userId = $(this).data('user-id');
        const newStatus = $(this).is(':checked') ? 1 : 0;
        const $switch = $(this);

        const message = newStatus
            ? '¿Deseas habilitar este registro?'
            : '¿Deseas deshabilitar este registro?';

        showConfirmationAlert(
            '¿Estás seguro?',
            message,
            'Sí, confirmar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    updateUsersStatus(userId, newStatus);
                } else {
                    $switch.prop('checked', !newStatus);
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Actualiza el estado de la categoría
// =========================================

/**
 * Envía la solicitud AJAX para actualizar el estado activo/inactivo.
 *
 * @param {number} userId
 * @param {number} status
 */
function updateUsersStatus(userId, status) {
    $.ajax({
        url: `/users/${userId}/status`,
        type: 'PUT',
        data: {
            status: status,
            _token: $('meta[name="csrf-token"]').attr('content')
        },
        success: function (response) {
            showAlert(
                'success',
                'Éxito',
                response.message
            );
            userTable.ajax.reload(null, false);
        },
        error: function () {
            showAlert({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado.'
            });
        }
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

        const hasData = $('#name').val().trim() !== '' ||
            $('#email').val().trim() !== '' ||
            $('#password').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#userModal').modal('hide');
                        resetUsersForm();
                    }
                }
            );
        } else {
            $('#userModal').modal('hide');
            resetUsersForm();
        }
    });
}

// =========================================
// FUNCIÓN: Abre el modal de asignacion de rol
// =========================================

/**
 * Muestra el modal con el listado de los roles para asignarle a un usuario.
 *
 * @param {id} data - Id del usuario para la asignacion de roles.
 */
function showAsignRolModal(id) {
    $('#assignRoles').modal('show');

    // Opcional: limpiar antes de volver a llenar
    const select = $('#roles');
    select.empty();

    $.ajax({
        url: `/users/${id}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            $('#userIdRol').val(response.user.id);
            $('#assignPermissionLabel').text('Asignar rol: ' + response.user.name);
            // Agregar opciones al <select>
            response.roles.forEach(function (role) {
                const isSelected = response.userRoles.includes(role.id);
                select.append(`<option value="${role.id}" ${isSelected ? 'selected' : ''}>${role.name}</option>`);
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
// FUNCIÓN: asginar el rol al usuario
// =========================================

/**
 * Asignar los roles a los usuarios y guardarlo en la base de datos
 */
function bindFormSubmitRol() {
    $('#formAssignRoles').on('submit', function (e) {
        e.preventDefault();

        const userId = $('#userIdRol').val();
        const selectedRoles = $('#roles').val(); // Esto será un array de IDs

        $.ajax({
            url: `/users/assignRoles/${userId}`,
            method: 'POST',
            data: {
                roles: selectedRoles,
                _token: $('meta[name="csrf-token"]').attr('content'),
                _method: 'PUT'
            },
            success: function (response) {
                showAlert(
                    'success',
                    'Éxito',
                    'Rol asignado correctamente.'
                );
                $('#assignRoles').modal('hide');
            },
            error: function (xhr) {
                Swal.fire('Error', 'Ocurrió un error al asignar los roles.', 'error');
            }
        });

    });


}

// =========================================
// FUNCIÓN: Cerrar el modal de roles
// =========================================

/**
 * Mensaje de confirmacion al cerrar el modal para asignar los roles a los usuarios
 */
function bindModalCloseEventsRol() {
    $('#btn-close-modal-roles').on('click', function () {
        showConfirmationAlert(
            '¿Estás seguro?',
            'Cerrar la ventana.',
            'Sí, Cerrar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $('#assignRoles').modal('hide');
                }
            }
        );
    })
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de departamento a su estado inicial.
 */
function resetUsersForm() {
    $('#userForm')[0].reset();
    clearValidationErrors();
    $('.modal-title').text('Agregar Usuario');
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