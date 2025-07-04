// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors } from './utils/alerts';

// =========================================
// VARIABLES GLOBALES
// =========================================

let categoriesTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    bindEvents();
})

function bindEvents() {
    bindFormSubmit();
    bindModalCloseEvents();
    bindDeleteEvents();
    bindEditEvents();
    bindToggleStatusEvents();
}

function initializeDataTable() {
    categoriesTable = $('#categoriesTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/categories/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            {
                data: 'description',
                name: 'description',
                orderable: false,
                searchable: false
            },
            {
                data: 'department_id',
                name: 'department_id',
                visible: false
            },
            {
                data: 'department_name',
                name: 'department_name',
                orderable: false,
                searchable: false
            },
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
                    data-category-id="${row.id}"
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
            <a href="javascript:void(0);" class="link-warning btn-edit-category" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-category" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Envío del formulario
// =========================================

/**
 * Maneja el envío del formulario para crear o actualizar departamento.
 */
function bindFormSubmit() {
    $('#categoryForm').on('submit', function (e) {
        e.preventDefault();

        const $form = $(this);
        const categoryId = $('#categoryId').val();
        const isEdit = categoryId != 0;

        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/categories/${categoryId}` : $form.data('action'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#categoryModal').modal('hide');
                categoriesTable.ajax.reload();
                showAlert(
                    'success',
                    'Éxito',
                    response.create ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetCategoryForm();
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
    $('#categoriesTable tbody').on('click', '.btn-edit-category', function () {
        const $button = $(this);
        const rowData = categoriesTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showDepartmentModal(rowData);
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de categorías.
 */
function bindDeleteEvents() {
    $('#categoriesTable tbody').on('click', '.btn-delete-category', function () {
        const categoryId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/categories/${categoryId}`,
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
                            categoriesTable.ajax.reload(null, false);
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
        const categoryId = $(this).data('category-id');
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
                    updateCategoryStatus(categoryId, newStatus);
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
 * @param {number} categoryId
 * @param {number} status
 */
function updateCategoryStatus(categoryId, status) {
    $.ajax({
        url: `/categories/${categoryId}/status`,
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
            categoriesTable.ajax.reload(null, false);
        },
        error: function () {
            showAlert(
                'error',
                'Error',
                'No se pudo actualizar el estado.'
            );
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
            $('#description').val().trim() !== '';

        if (hasData) {
            showConfirmationAlert(
                '¿Estás seguro?',
                'Perderás los datos ingresados.',
                'Sí, cancelar',
                'No, volver',
                (confirmed) => {
                    if (confirmed) {
                        $('#categoryModal').modal('hide');
                        resetCategoryForm();
                    }
                }
            );
        } else {
            $('#categoryModal').modal('hide');
            resetCategoryForm();
        }
    });
}

// =========================================
// FUNCIÓN: Abre el modal de departamento
// =========================================

/**
 * Muestra el modal de creación o edición de departamento.
 *
 * @param {Object|null} data - Datos de la departamento o null si es nuevo.
 */
function showDepartmentModal(data = null) {
    resetCategoryForm();

    if (data) {
        $('.modal-title').text('Editar Categoria');
        $('#name').val(data.name);
        $('#description').val(data.description);
        $('#department_id').val(data.department_id).trigger('change');
        $('#categoryId').val(data.id);
    } else {
        $('.modal-title').text('Agregar Categoria');
    }

    $('#categoryModal').modal('show');
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de departamento a su estado inicial.
 */
function resetCategoryForm() {
    $('#categoryForm')[0].reset();
    $('#categoryId').val(0);
    $('#department_id').val(null).trigger('change');
    clearValidationErrors();
    $('.modal-title').text('Agregar Categoria');
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