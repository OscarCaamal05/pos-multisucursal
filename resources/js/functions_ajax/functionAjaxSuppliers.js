// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert } from './utils/alerts';
import { makeNumericInput } from './utils/numericInputs';
import { bindSupplierFormSubmit, initCreditTermsAndDate, showSupplierModal, closeSupplierModal, formatCleave } from './helpers/supplierHelper';
import { className } from 'gridjs';

// =========================================
// VARIABLES GLOBALES
// =========================================

let suppliersTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    bindEvents();

    // =========================================
    // Inicializando la funcion para crear o actualizar proveedores
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindSupplierFormSubmit({
        table: suppliersTable,
    });

    // =========================================
    // EVENTO: Para selccionar el primer input del formulario
    // =========================================
    $('#supplierModal').on('shown.bs.modal', function () {
        $('#representative').trigger('focus');
    });

    $('#credit_available').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    closeSupplierModal();

    initCreditTermsAndDate("#payment_days_granted", "#credit_due_date", 30);

    // Convertir los campos numéricos a inputs numéricos con formato adecuado
    makeNumericInput('#credit_available', {type: 'decimal', decimals: 2});
    makeNumericInput('#supplier_interest_rate', {type: 'decimal', decimals: 2});
    makeNumericInput('#supplier_late_fee', {type: 'decimal', decimals: 2});
    makeNumericInput('#grace_period_days', {type: 'integer'});
    makeNumericInput('#payment_day_of_month', {type: 'integer'});
    makeNumericInput('#early_payment_discount', {type: 'decimal', decimals: 2});
    makeNumericInput('#early_payment_days', {type: 'integer'});
    makeNumericInput('#credit_limit_granted', {type: 'decimal', decimals: 2});
})

function bindEvents() {
    bindDeleteEvents();
    bindEditEvents();
    bindToggleStatusEvents();
    formatCleave();
}

function initializeDataTable() {
    suppliersTable = $('#suppliersTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/suppliers/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'representative', name: 'representative' },
            { data: 'company_name', name: 'company_name' },
            {
                data: 'tax_id',
                name: 'tax_id',
                orderable: false,
                searchable: false,
                className: 'text-center',
            },
            {
                data: 'phone',
                name: 'phone',
                orderable: false,
                searchable: false,
                className: 'text-center',
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
                className: 'text-center',
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
                className: 'text-center',
                render: function (data, type, row) {
                    return data.credit_limit_granted - data.credit_balance;
                }
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
                    data-supplier-id="${row.id}"
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
            <a href="javascript:void(0);" class="link-warning btn-edit-supplier" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-supplier" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Vincula evento de edición
// =========================================

/**
 * Asocia el evento de edición de Proveedor.
 */
function bindEditEvents() {
    $('#suppliersTable tbody').on('click', '.btn-edit-supplier', function () {
        const $button = $(this);
        const rowData = suppliersTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showSupplierModal({ id: rowData.id })
                        .then((response) => {
                            if (response.status === 'success') {
                                // Valores generales
                                $('#representative').val(response.data.representative);
                                $('#company_name').val(response.data.company_name);
                                $('#rfc').val(response.data.tax_id);
                                $('#phone').val(response.data.phone);
                                $('#email').val(response.data.email);
                                $('#credit_limit_granted').val(response.data.credit_limit_granted);
                                $('#address').val(response.data.address);

                                // Datos adicionales del crédito
                                $('#payment_days_granted').val(response.data.payment_days_granted);
                                $('#credit_due_date').val(response.data.credit_due_date);
                                $('#payment_day_of_month').val(response.data.payment_day_of_month);
                                $('#supplier_interest_rate').val(response.data.supplier_interest_rate);
                                $('#supplier_late_fee').val(response.data.supplier_late_fee);
                                $('#grace_period_days').val(response.data.grace_period_days);
                                $('#early_payment_discount').val(response.data.early_payment_discount);
                                $('#early_payment_days').val(response.data.early_payment_days);
                                $('#choices-payment-frequency-input').val(response.data.payment_frequency).trigger('change');
                            }
                        })
                        .catch(() => {
                            showAlert(
                                'error',
                                'Error',
                                'No se pudieron cargar los datos del registro.'
                            );
                        });
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de proveedor.
 */
function bindDeleteEvents() {
    $('#suppliersTable tbody').on('click', '.btn-delete-supplier', function () {
        const supplierId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/suppliers/${supplierId}`,
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
                            suppliersTable.ajax.reload(null, false);
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
 * Asocia el evento de activación/desactivación del estado del Proveedor.
 */
function bindToggleStatusEvents() {
    $(document).on('change', '.toggle-status', function () {
        const supplierId = $(this).data('supplier-id');
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
                    updateSupplierStatus(supplierId, newStatus);
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
 * @param {number} supplierId
 * @param {number} status
 */
function updateSupplierStatus(supplierId, status) {
    $.ajax({
        url: `/suppliers/${supplierId}/status`,
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
            suppliersTable.ajax.reload(null, false);
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