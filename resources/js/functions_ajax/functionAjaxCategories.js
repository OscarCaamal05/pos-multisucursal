// =========================================
// IMPORTACION DE FUNCIONES GENERICAS
// =========================================
import { showAlert, showConfirmationAlert, } from './utils/alerts';
import { bindCategoryFormSubmit, showCategoryModal, closeCategoryModal } from './helpers/categoryHelper';
import { closeDepartmentModal, bindDepartmentFormSubmit, selectDepartmet } from './helpers/departmentHelper';

// =========================================
// VARIABLES GLOBALES
// =========================================

let categoriesTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    initializeSelect2();
    bindEvents();

    // =========================================
    // Inicializando la funcion para crear o actualizar la el departamento
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindDepartmentFormSubmit({
        onSuccess: (response) => {
            //Auto completa el select del modal de categorias cuando el registro se crea desde la vista de categoria
            if (response.status === 'create' && response.department) {
                selectDepartmet(response.department, '#department_id');
            }
        }
    });

    // =========================================
    // Inicializando la funcion para crear o actualizar la categoria
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindCategoryFormSubmit({
        table: categoriesTable,
    });

    closeDepartmentModal();

    // =========================================
    // EVENTO: Click en el boton dentro del modal de categoria
    // =========================================
    /**
     * Abre el modal de departamento desde categoria para agregar un nuevo departamento
     */
    $('#btn-modal-department').on('click', function (e) {
        e.preventDefault();
        $('#departmentModal').modal('show');
    });

})

function bindEvents() {
    bindDeleteEvents();
    bindEditEvents();
    bindToggleStatusEvents();
    closeCategoryModal();
}

// =========================================
// FUNCIÓN: Inicializa Select2 en los selects de departamentos
// =========================================

/**
 * Inicializa el plugin Select2 para los campos de departamento
 * dentro del modal de categorías.
 */
function initializeSelect2() {
    $('.departments').select2({
        dropdownParent: $('#categoryModal'),
    });

}

function initializeDataTable() {
    categoriesTable = $('#categoriesTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/categories/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'category_name', name: 'category_name' },
            {
                data: 'category_description',
                name: 'category_description',
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
                    showCategoryModal(rowData);
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