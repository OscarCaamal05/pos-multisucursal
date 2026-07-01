import { showAlert, showConfirmationAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import { PURCHASES_CONFIG as CONFIG } from '../../helpers/PurchasesHelper';
import { getTableDetails, loadTotals, showTotals, cleanInputSale } from './detailModule';
import { getCurrentCustomerId, cleanCustomerData } from './customerModule';

// =========================================
// CONFIGURACIÓN DEL MÓDULO
// =========================================
const WAITING_CONFIG = {
    selectors: {
        btnSendWaiting: '#btn-send-waiting',
        btnOpenSalePending: '#btn-sale-pending',
        btnClosePending: '#btn-close-pending',
        modalWaiting: '#modal-sales-waiting',
        waitingTable: '#waiting-sales-table',
        tempSaleId: '#temp_sale_id',
        customerId: '#customer_id',
    },
    api: {
        setToWaiting: '/temp_sales_detail/sendToWaiting',
        getPendingSales: '/temp_sales_detail/getPendingSales',
        getOnHold: '/temp_sales_detail/getSaleOnHold',
    }
};

// =========================================
// VARIABLE LOCAL (privada al módulo)
// =========================================
let waitingTable = null;  // instancia DataTable del modal de espera

// =========================================
// INICIALIZACIÓN
// =========================================

/**
 * Punto de entrada del módulo. Llamar desde saleMain.js
 */
export function initWaitingModule() {
    try {
        bindWaitingEvents();
    } catch (error) {
        console.error('❌ Error al inicializar módulo de ventas en espera:', error);
    }
}

// =========================================
// EVENTOS
// =========================================

function bindWaitingEvents() {
    const sel = WAITING_CONFIG.selectors;

    // Botón → enviar venta actual a espera
    $(sel.btnSendWaiting).on('click', () => sendSalesToWait());

    // Botón → abrir modal listado de ventas en espera
    $(sel.btnOpenSalePending).on('click', () => {
        $(sel.modalWaiting).modal('show');
        loadPendingSales();
    });

    // Botón → cerrar modal listado de ventas en espera
    $(sel.btnClosePending).on('click', () => $(sel.modalWaiting).modal('hide'));

    // Doble click en fila → recuperar la venta seleccionada
    $(`${sel.waitingTable} tbody`).on('dblclick', 'tr', function () {
        if (!waitingTable) return;

        const data = waitingTable.row(this).data();
        if (data?.id_temp_sale) {
            getSaleOnHold(data.id_temp_sale);
        }
    });
}

// =========================================
// ENVIAR VENTA A ESPERA
// =========================================

/**
 * Envía la venta actual al estado de espera.
 * Valida que haya cliente seleccionado antes de proceder.
 */
function sendSalesToWait() {
    const tempId = $(WAITING_CONFIG.selectors.tempSaleId).val();
    const customerId = getCurrentCustomerId();

    // Validar cliente seleccionado
    if (!customerId || customerId == 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noCustomer);
        return;
    }

    // Validar que haya productos en la tabla
    const tableDetails = getTableDetails();
    if (!tableDetails || tableDetails.rows().count() === 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noProducts);
        return;
    }

    $.ajax({
        url: WAITING_CONFIG.api.setToWaiting,
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_id: tempId,
            customer_id: customerId,
        },
        success: (response) => {
            showAlert(response.status, 'Alerta', response.message);

            // Limpiar la interfaz de la venta actual
            cleanInputSale();
            cleanCustomerData();

            // Recargar tabla temporal con el nuevo temp_sale_id
            const newTempId = response.data?.new_temp_sale_id;
            if (newTempId) {
                $(WAITING_CONFIG.selectors.tempSaleId).val(newTempId);
                loadTotals(newTempId);
            }

            getTableDetails()?.ajax.reload(null, false);
        },
        error: (xhr) => {
            const response = _parseErrorResponse(xhr);
            showAlert(response.status || 'error', 'Alerta', response.message || 'Error al enviar la venta a espera.');
        }
    });
}

// =========================================
// RECUPERAR venta EN ESPERA
// =========================================

/**
 * Recupera una venta en espera y la establece como la venta activa.
 * Si hay una venta en proceso con productos, la envía a espera primero.
 *
 * @param {number} tempId - ID de la venta en espera a recuperar
 */
function getSaleOnHold(tempId) {
    const tempActualId   = $(WAITING_CONFIG.selectors.tempSaleId).val();
    const customerId     = getCurrentCustomerId();
    const tableDetails   = getTableDetails();
    const rowCount       = tableDetails ? tableDetails.rows().count() : 0;

    // Si hay productos en la venta actual, validar que haya cliente
    // para poder enviarla a espera antes de recuperar la otra
    if (rowCount > 0 && (!customerId || customerId == 0)) {
        showAlert(
            'warning',
            'Alerta',
            'Seleccione un cliente para enviar la venta actual a espera antes de continuar.'
        );
        return;
    }

    $.ajax({
        url:  WAITING_CONFIG.api.getOnHold,
        type: 'POST',
        data: {
            _token:          $('meta[name="csrf-token"]').attr('content'),
            temp_id:         tempId,
            temp_actual_id:  tempActualId,
            customer_id:     customerId,
        },
        success: (response) => {
            const data = response.data;

            // Actualizar el cliente en la interfaz
            $(WAITING_CONFIG.selectors.customerId)
                .val(data.customer_id)
                .trigger('change');

            // Actualizar el ID de la venta activa y recargar tabla + totales
            $(WAITING_CONFIG.selectors.tempSaleId).val(data.temp_sale_id);
            loadTotals(data.temp_sale_id);
            tableDetails?.ajax.reload(null, false);

            // Recargar el listado de ventas en espera y cerrar el modal
            $(WAITING_CONFIG.selectors.modalWaiting).modal('hide');
            waitingTable?.ajax.reload(null, false);
        },
        error: (xhr) => {
            const response = _parseErrorResponse(xhr);
            showAlert(response.status || 'error', 'Alerta', response.message || 'Error al recuperar la venta.');
        }
    });
}

// =========================================
// DATATABLE: LISTADO DE VENTAS EN ESPERA
// =========================================

/**
 * Inicializa (o reinicia) el DataTable del modal de ventas pendientes.
 */
export function loadPendingSales() {
    const tableSelector = WAITING_CONFIG.selectors.waitingTable;

    // Destruir instancia anterior si existe
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
        $(`${tableSelector} tbody`).empty();
    }

    waitingTable = $(tableSelector).DataTable({
        processing: true,
        serverSide: true,
        ajax:       WAITING_CONFIG.api.getPendingSales,
        columns: [
            {
                data:    'id_temp_sale',
                name:    'id_temp_sale',
                visible: false
            },
            {
                data:    'customer_id',
                name:    'customer_id',
                visible: false
            },
            {
                data:      'date_created',
                name:      't.updated_at',
                className: 'text-center',
                render:    (data) => {
                    if (!data) return '';
                    const date = new Date(data);
                    return `
                        <div class="d-flex">
                            <div class="flex-grow-1">
                                <h5 class="fs-13 m-1">${date.toLocaleDateString('es-ES')}</h5>
                                <small class="text-muted">
                                    ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </small>
                            </div>
                        </div>`;
                }
            },
            {
                data:      null,
                name:      'description',
                className: 'text-center',
                render:    (data, type, row) => `
                    <div class="d-flex">
                        <div class="flex-grow-1">
                            <h5 class="fs-13 m-1">${row.customer_name}</h5>
                        </div>
                    </div>`
            },
            {
                data:      'total_amount',
                name:      'total_amount',
                className: 'text-center',
                render:    (data) => `$${parseFloat(data || 0).toFixed(2)}`
            }
        ],
        scrollY:      400,
        deferRender:  true,
        scroller:     true,
        language:     getDataTableLanguage({
            emptyTable: 'No hay compras en espera.',
        }),
        searching:    false,
        info:         false,
        lengthChange: false,
        pageLength:   -1,
    });
}

// =========================================
// GETTER PÚBLICO
// =========================================

/**
 * Retorna la instancia actual del DataTable de ventas en espera.
 * Útil si otros módulos necesitan forzar un reload.
 */
export function getWaitingTable() {
    return waitingTable;
}

// =========================================
// HELPERS PRIVADOS
// =========================================

/**
 * Parsea de forma segura la respuesta de error de un XHR.
 * @param {Object} xhr
 * @returns {Object}
 */
function _parseErrorResponse(xhr) {
    try {
        return JSON.parse(xhr.responseText);
    } catch {
        return { status: 'error', message: xhr.statusText || 'Error desconocido.' };
    }
}