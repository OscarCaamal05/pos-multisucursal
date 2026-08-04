import { showAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import { showConfirmationAlert } from '../../utils/alerts';
import { PURCHASES_CONFIG as CONFIG } from '../../helpers/PurchasesHelper';
import { getTableDetails, loadTotals, showTotals, cleanInputPurchase } from './detailModule';
import { getCurrentSupplierId, cleanSupplierData } from './supplierModule';

// =========================================
// CONFIGURACIÓN DEL MÓDULO
// =========================================
const WAITING_CONFIG = {
    selectors: {
        btnSetWaiting:      '#btn-set-waiting',
        btnOpenWaiting:     '#btn-purchase-waiting',
        btnClosePending:    '#btn-close-pending',
        modalWaiting:       '#modal-purchase-waiting',
        tableWaiting:       '#tablePurchaseWaiting',
        tempPurchaseId:     '#temp_purchase_id',
        supplierId:         '#supplier_id',
    },
    api: {
        setToWaiting:       '/temp_purchases_detail/set-to-waiting/',
        getPendingList:     '/temp_purchases_detail/getPendingPurchases',
        getOnHold:          '/temp_purchases_detail/getPurchaseOnWaitingList',
    }
};

// =========================================
// VARIABLE LOCAL (privada al módulo)
// =========================================
let purchasesTable = null;  // instancia DataTable del modal de espera

// =========================================
// INICIALIZACIÓN
// =========================================

/**
 * Punto de entrada del módulo. Llamar desde purchaseMain.js
 */
export function initWaitingModule() {
    try {
        bindWaitingEvents();
    } catch (error) {
        console.error('❌ Error al inicializar módulo de espera:', error);
    }
}

// =========================================
// EVENTOS
// =========================================

function bindWaitingEvents() {
    const sel = WAITING_CONFIG.selectors;

    // Botón → enviar compra actual a espera
    $(sel.btnSetWaiting).on('click', () => sendPurchaseToWait());

    // Botón → abrir modal listado de compras en espera
    $(sel.btnOpenWaiting).on('click', () => {
        $(sel.modalWaiting).modal('show');
        loadPendingPurchases();
    });

    // Botón → cerrar modal listado de compras en espera
    $(sel.btnClosePending).on('click', () => $(sel.modalWaiting).modal('hide'));

    // Doble click en fila → recuperar la compra seleccionada
    $(`${sel.tableWaiting} tbody`).on('dblclick', 'tr', function () {
        if (!purchasesTable) return;

        const data = purchasesTable.row(this).data();
        if (data?.id_temp_purchase) {
            getPurchaseOnHold(data.id_temp_purchase);
        }
    });
}

// =========================================
// ENVIAR COMPRA A ESPERA
// =========================================

/**
 * Envía la compra actual al estado de espera.
 * Valida que haya proveedor seleccionado antes de proceder.
 */
function sendPurchaseToWait() {
    const tempId     = $(WAITING_CONFIG.selectors.tempPurchaseId).val();
    const supplierId = getCurrentSupplierId();

    // Validar proveedor seleccionado
    if (!supplierId || supplierId == 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noSupplier);
        return;
    }

    // Validar que haya productos en la tabla
    const tableDetails = getTableDetails();
    if (!tableDetails || tableDetails.rows().count() === 0) {
        showAlert('warning', 'Alerta', CONFIG.messages.noProducts);
        return;
    }

    $.ajax({
        url:  WAITING_CONFIG.api.setToWaiting,
        type: 'POST',
        data: {
            _token:      $('meta[name="csrf-token"]').attr('content'),
            temp_id:     tempId,
            supplier_id: supplierId,
        },
        success: (response) => {
            showAlert(response.status, 'Alerta', response.message);

            // Limpiar la interfaz de la compra actual
            cleanInputPurchase();
            cleanSupplierData();

            // Recargar tabla temporal con el nuevo temp_purchase_id
            const newTempId = response.data?.new_temp_purchase_id;
            if (newTempId) {
                $(WAITING_CONFIG.selectors.tempPurchaseId).val(newTempId);
                loadTotals(newTempId);
            }

            getTableDetails()?.ajax.reload(null, false);
        },
        error: (xhr) => {
            const response = _parseErrorResponse(xhr);
            showAlert(response.status || 'error', 'Alerta', response.message || 'Error al enviar la compra a espera.');
        }
    });
}

// =========================================
// RECUPERAR COMPRA EN ESPERA
// =========================================

/**
 * Recupera una compra en espera y la establece como la compra activa.
 * Si hay una compra en proceso con productos, la envía a espera primero.
 *
 * @param {number} tempId - ID de la compra en espera a recuperar
 */
function getPurchaseOnHold(tempId) {
    const tempActualId   = $(WAITING_CONFIG.selectors.tempPurchaseId).val();
    const supplierId     = getCurrentSupplierId();
    const tableDetails   = getTableDetails();
    const rowCount       = tableDetails ? tableDetails.rows().count() : 0;

    // Si hay productos en la compra actual, validar que haya proveedor
    // para poder enviarla a espera antes de recuperar la otra
    if (rowCount > 0 && (!supplierId || supplierId == 0)) {
        showAlert(
            'warning',
            'Alerta',
            'Seleccione un proveedor para enviar la compra actual a espera antes de continuar.'
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
            supplier_id:     supplierId,
        },
        success: (response) => {
            const data = response.data;

            // Actualizar el proveedor en la interfaz
            $(WAITING_CONFIG.selectors.supplierId)
                .val(data.supplier_id)
                .trigger('change');

            // Actualizar el ID de la compra activa y recargar tabla + totales
            $(WAITING_CONFIG.selectors.tempPurchaseId).val(data.temp_purchase_id);
            loadTotals(data.temp_purchase_id);
            tableDetails?.ajax.reload(null, false);

            // Recargar el listado de compras en espera y cerrar el modal
            $(WAITING_CONFIG.selectors.modalWaiting).modal('hide');
            purchasesTable?.ajax.reload(null, false);
        },
        error: (xhr) => {
            const response = _parseErrorResponse(xhr);
            showAlert(response.status || 'error', 'Alerta', response.message || 'Error al recuperar la compra.');
        }
    });
}

// =========================================
// DATATABLE: LISTADO DE COMPRAS EN ESPERA
// =========================================

/**
 * Inicializa (o reinicia) el DataTable del modal de compras pendientes.
 */
export function loadPendingPurchases() {
    const tableSelector = WAITING_CONFIG.selectors.tableWaiting;

    // Destruir instancia anterior si existe
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
        $(`${tableSelector} tbody`).empty();
    }

    purchasesTable = $(tableSelector).DataTable({
        processing: true,
        serverSide: true,
        ajax:       WAITING_CONFIG.api.getPendingList,
        columns: [
            {
                data:    'id_temp_purchase',
                name:    'id_temp_purchase',
                visible: false
            },
            {
                data:    'supplier_id',
                name:    'supplier_id',
                visible: false
            },
            {
                data:      'date_created',
                name:      't.created_at',
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
                            <h5 class="fs-13 m-1">${row.company_name}</h5>
                            <p class="text-muted mb-0">${row.representative}</p>
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
 * Retorna la instancia actual del DataTable de compras en espera.
 * Útil si otros módulos necesitan forzar un reload.
 */
export function getPurchasesTable() {
    return purchasesTable;
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
