// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors, handleValidationError } from './utils/alerts';

// =========================================
// VARIABLES GLOBALES
// =========================================

let permitsTable = null;

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
    bindDeleteEvents();
    bindEditEvents();
}

function initializeDataTable() {
    permitsTable = $('#permitsTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/permission/data',
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
            <a href="javascript:void(0);" class="link-warning btn-edit-permission" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-permission" data-id="${data}">
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
    $('#permitsForm').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const permitsId = $('#permitsId').val();
        const isEdit = permitsId != 0;

        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/permission/${permitsId}` : $form.data('action'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#permissionModal').modal('hide');
                permitsTable.ajax.reload();
                showAlert(
                    'success',
                    'Éxito',
                    response.create ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetPermitsForm();
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Vincula evento de edicion
// =========================================

/**
 * Asocia el evento de edicion de roles.
 */
function bindEditEvents() {
    $('#permitsTable tbody').on('click', '.btn-edit-permission', function () {
        const $button = $(this);
        const rowData = permitsTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showPermitsModal(rowData);
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
    $('#permitsTable tbody').on('click', '.btn-delete-permission', function () {
        const rolId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/permission/${rolId}`,
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
                            permitsTable.ajax.reload(null, false);
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
                        $('#permissionModal').modal('hide');
                        resetPermitsForm();
                    }
                }
            );
        } else {
            $('#permissionModal').modal('hide');
            resetPermitsForm();
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
function showPermitsModal(data = null) {
    resetPermitsForm();

    if (data) {
        $('.modal-title').text('Editar permiso');
        $('#name').val(data.name);
        $('#permitsId').val(data.id);
    } else {
        $('.modal-title').text('Agregar permiso');
    }

    $('#permissionModal').modal('show');
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de roles a su estado inicial.
 */
function resetPermitsForm() {
    $('#permitsForm')[0].reset();
    $('#permitsId').val(0);
    clearValidationErrors();
    $('.modal-title').text('Agregar permiso');
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