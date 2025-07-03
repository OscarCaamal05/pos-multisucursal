// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert, clearValidationErrors } from './utils/alerts';

// =========================================
// VARIABLES GLOBALES
// =========================================

let departmentTable = null;

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
}

function initializeDataTable() {
    departmentTable = $('#departmentsTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/departments/data',
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
            <a href="javascript:void(0);" class="link-warning btn-edit-department" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-department" data-id="${data}">
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
    $('#departmentForm').on('submit', function (e) {
        e.preventDefault();

        const $form = $(this);
        const departmentId = $('#departmentId').val();
        const isEdit = departmentId != 0;

        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/departments/${departmentId}` : $form.data('action'),
            method: isEdit ? 'PUT' : 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#departmentModal').modal('hide');
                departmentTable.ajax.reload();
                showAlert(
                    'success',
                    'Éxito',
                    response.create ? 'Registro creado exitosamente.' : 'Registro actualizado exitosamente.'
                );
                resetDepartmentForm();
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
    $('#departmentsTable tbody').on('click', '.btn-edit-department', function () {
        const $button = $(this);
        const rowData = departmentTable.row($button.closest('tr')).data();

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
    $('#departmentsTable tbody').on('click', '.btn-delete-department', function () {
        const departmentId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/departments/${departmentId}`,
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
                            departmentTable.ajax.reload(null, false);
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
                        $('#departmentModal').modal('hide');
                        resetDepartmentForm();
                    }
                }
            );
        } else {
            $('#departmentModal').modal('hide');
            resetDepartmentForm();
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
    resetDepartmentForm();

    if (data) {
        $('.modal-title').text('Editar departamento');
        $('#name').val(data.name);
        $('#description').val(data.description);
        $('#departmentId').val(data.id);
    } else {
        $('.modal-title').text('Agregar departamento');
    }

    $('#departmentModal').modal('show');
}

// =========================================
// FUNCIÓN: Restablece el formulario del modal
// =========================================

/**
 * Resetea el formulario de departamento a su estado inicial.
 */
function resetDepartmentForm() {
    $('#departmentForm')[0].reset();
    $('#departmentId').val(0);
    clearValidationErrors();
    $('.modal-title').text('Agregar Departamento');
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