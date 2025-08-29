// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert } from './utils/alerts';
import { bindCustomerFormSubmit, initCreditTermsAndDate, showCustomerModal, closeCustomerModal, formatCleave } from './helpers/customerHelper';

// =========================================
// VARIABLES GLOBALES
// =========================================

let customersTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    bindEvents();

    // =========================================
    // Inicializando la funcion para crear o actualizar clientes
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindCustomerFormSubmit({
        table: customersTable,
    });

    // =========================================
    // EVENTO: Para selccionar el primer input del formulario
    // =========================================
    $('#customerModal').on('shown.bs.modal', function () {
        $('#full_name').trigger('focus');
    });

    $('#credit_available').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    initCreditTermsAndDate("#credit_terms", "#credit_due_date", 30);
})

function bindEvents() {
    bindDeleteEvents();
    bindEditEvents();
    bindToggleStatusEvents();
    formatCleave();
    closeCustomerModal();
}

function initializeDataTable() {
    customersTable = $('#customersTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/customers/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'full_name', name: 'full_name' },
            {
                data: 'rfc',
                name: 'rfc',
                orderable: false,
                searchable: false
            },
            {
                data: 'phone',
                name: 'phone',
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    // Si está vacío o null
                    if (!data) return '';

                    // Quitar todo lo que no sea número
                    const cleaned = data.replace(/\D/g, '');

                    // Aplicar el formato
                    if (cleaned.length === 10) {
                        return `(${cleaned.substr(0, 3)}) ${cleaned.substr(3, 3)}-${cleaned.substr(6, 4)}`;
                    }

                    // Si no tiene 10 dígitos, devuélvelo tal cual
                    return data;
                }
            },
            {
                data: 'email',
                name: 'email',
                orderable: false,
            },
            {
                data: 'address',
                name: 'address',
                orderable: false,
                searchable: false,
                visible: false
            },
            {
                data: null,
                name: 'credit_available',
                orderable: false,
                searchable: false,
                render: function (data, type, row) {
                    return data.credit_available - data.credit;
                }
            },
            {
                data: 'credit',
                name: 'credit',
                visible: false
            },
            {
                data: 'credit_due_date',
                name: 'credit_due_date',
                visible: false
            },
            {
                data: 'credit_terms',
                name: 'credit_terms',
                visible: false
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
                    data-customer-id="${row.id}"
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
            <a href="javascript:void(0);" class="link-warning btn-edit-customer" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-customer" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Vincula evento de edición
// =========================================

/**
 * Asocia el evento de edición de clientes.
 */
function bindEditEvents() {
    $('#customersTable tbody').on('click', '.btn-edit-customer', function () {
        const $button = $(this);
        const rowData = customersTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showCustomerModal(rowData);
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de clientes.
 */
function bindDeleteEvents() {
    $('#customersTable tbody').on('click', '.btn-delete-customer', function () {
        const customerId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/customers/${customerId}`,
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
                            customersTable.ajax.reload(null, false);
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
 * Asocia el evento de activación/desactivación del estado del cliente.
 */
function bindToggleStatusEvents() {
    $(document).on('change', '.toggle-status', function () {
        const customerId = $(this).data('customer-id');
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
                    updateCustomerStatus(customerId, newStatus);
                } else {
                    $switch.prop('checked', !newStatus);
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Actualiza el estado de la cliente
// =========================================

/**
 * Envía la solicitud AJAX para actualizar el estado activo/inactivo.
 *
 * @param {number} customerId
 * @param {number} status
 */
function updateCustomerStatus(customerId, status) {
    $.ajax({
        url: `/customers/${customerId}/status`,
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
            customersTable.ajax.reload(null, false);
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