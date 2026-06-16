import { showAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import {
    bindCustomerFormSubmit,
    closeCustomerModal,
    formatCleave,
    initCreditTermsAndDate,
} from '../../helpers/customerHelper';
import {
    SALES_CONFIG as CONFIG,
    formatPhoneNumber,
    validateCustomerSelected,
} from '../../helpers/SalesHelper';

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let customersTable = null;
let autoCompleteInstance = null;

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================

/**
 * Punto de entrada del módulo de clientes.
 * Se llama desde salesMain.js dentro del $(document).ready
 */
export function initCustomerModule() {
    initStoredCustomer();
    setupCustomerAutoComplete();
    bindCustomerEvents();
    bindCustomerFormSubmit({
        table: customersTable,
        onSuccess: (response) => {
            getCustomerData(response.customer.id);
            $('#modal-customers').modal('hide');
        }
    });
    closeCustomerModal();
    formatCleave();
    initCreditTermsAndDate('#default_credit_days', '#credit_due_date', 30);
}

// =========================================
// LOCALSTORAGE: Recuperar Cliente guardado
// =========================================

/**
 * Lee el cliente guardado en localStorage y lo muestra en la interfaz.
 * Se ejecuta al cargar la página para restaurar el estado previo.
 */
function initStoredCustomer() {
    const stored = localStorage.getItem(CONFIG.storage.customerKey);
    if (!stored) return;

    try {
        const data = JSON.parse(stored);
        updateCustomerUI(data);
        $('#customer_id').val(data.customerId || 0);
    } catch (error) {
        console.error('Error al parsear cliente guardado:', error);
        localStorage.removeItem(CONFIG.storage.customerKey);
    }
}

// =========================================
// AUTOCOMPLETADO DE CLIENTES
// =========================================

/**
 * Inicializa la librería autoComplete.js para el campo de búsqueda de clientes.
 */
function setupCustomerAutoComplete() {
    autoCompleteInstance = new autoComplete({
        selector: '#auto_complete_customer',
        data: {
            src: async (query) => {
                try {
                    const response = await searchCustomers(query);
                    return response.data;
                } catch (error) {
                    console.error('Error en autocompletado de clientes:', error);
                    return [];
                }
            },
            keys: ['value'],
            cache: false,
        },
        resultsList: {
            element: function (list, data) {
                if (!data.results.length) {
                    const message = document.createElement('div');
                    message.setAttribute('class', CONFIG.cssClasses.noResult);
                    message.innerHTML = `<span>No se encontraron resultados para "${data.query}"</span>`;
                    list.prepend(message);
                }
            },
            noResults: true,
        },
        resultItem: {
            highlight: true,
        },
        events: {
            input: {
                selection: function (event) {
                    const selection = event.detail.selection;
                    const selectedText =
                        typeof selection.value === 'string'
                            ? selection.value
                            : selection.value?.value || '';

                    autoCompleteInstance.input.value = selectedText;
                    autoCompleteInstance.input.select();
                    $('#customer_id').val(selection.value.id).trigger('change');
                },
            },
        },
    });
}

// =========================================
// AJAX: Búsqueda de clientes (autocomplete)
// =========================================

/**
 * Envía la cadena de búsqueda al servidor para el autocompletado.
 *
 * @param {string} query - Texto introducido por el usuario
 * @returns {Promise} Promesa con la respuesta del servidor
 */
function searchCustomers(query) {
    return $.ajax({
        url: `temp_sales_detail/autoCompleteCustomers/${query}`,
        type: 'GET',
        dataType: 'json',
    });
}

// =========================================
// AJAX: Obtener datos de un cliente por ID
// =========================================

/**
 * Consulta los datos completos de un cliente y los muestra en la interfaz.
 * También guarda los datos en localStorage para persistencia al recargar.
 *
 * @param {number} customerId - ID del cliente seleccionado
 */
export function getCustomerData(customerId) {
    $.ajax({
        url: `/temp_sales_detail/${customerId}`,
        method: 'GET',
        success: function (response) {
            const phoneFormatted = formatPhoneNumber(response.phone);
            updateCustomerUI({
                name: response.name,
                email: response.email,
                phone: phoneFormatted,
                tax_id: response.tax_id,
                credit_available: response.credit_available,
                credit_limit: response.credit_limit,
                default_credit_days: response.default_credit_days,
                credit_due_date: response.credit_due_date,
            });

            $('#customer_id').val(customerId || 0);

            saveCustomerToStorage(customerId, response);
        },
        error: function (xhr) {
            console.error('Error al obtener datos del cliente:', xhr);
            showAlert('error', 'Error', 'No se pudieron obtener los datos del cliente.');
        },
    });
}

// =========================================
// UI: Actualizar campos del cliente en pantalla
// =========================================

/**
 * Refleja los datos del cliente en los elementos de la vista.
 *
 * @param {Object} data - Datos del cliente
 */
function updateCustomerUI(data) {
    $('.customer-name').text(data.name || 'No hay dato');
    $('.customer-email').text(data.email || 'No hay dato');
    $('.customer-phone').text(data.phone || 'No hay dato');
    $('.customer-tax-id').text(data.tax_id || 'No hay dato');
    $('.customer-credit-available').text(data.credit_available || 'No hay dato');
}

// =========================================
// LOCALSTORAGE: Guardar cliente seleccionado
// =========================================

/**
 * Persiste los datos del cliente en localStorage.
 *
 * @param {number} customerId - ID del cliente
 * @param {Object} response   - Respuesta completa del servidor
 */
function saveCustomerToStorage(customerId, response) {
    const customer = {
        customerId: customerId,
        name: response.name,
        tax_id: response.tax_id,
        email: response.email,
        phone: formatPhoneNumber(response.phone),
        credit_available: response.credit_available,
        credit_limit: response.credit_limit,
        default_credit_days: response.default_credit_days ? response.default_credit_days : 30,
        credit_due_date: response.credit_due_date,

    };
    localStorage.setItem(CONFIG.storage.customerKey, JSON.stringify(customer));
}

// =========================================
// DATATABLE: Cargar lista de clientes en modal
// =========================================

/**
 * Destruye e inicializa la tabla de clientes dentro del modal de búsqueda.
 * Incluye el input de búsqueda personalizado.
 */
export function loadListCustomers() {

    if ($.fn.DataTable.isDataTable('#tableCustomers')) {
        customersTable = $('#tableCustomers').DataTable();
        customersTable.columns.adjust().draw();
        return;
    }

    customersTable = $('#tableCustomers').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/customers/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            {
                data: 'tax_id',
                name: 'tax_id',
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
                data: 'credit_available',
                name: 'credit_available',
                orderable: false,
                searchable: false,
            },
            {
                data: 'credit_limit',
                name: 'credit_limit',
                orderable: false
            },

        ],
        scrollY: 450,
        deferRender: true,
        scroller: true,
        language: getDataTableLanguage(),
        searching: true,
        info: false,
        dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>><"clear">',

        initComplete: function () {
            this.api().columns.adjust().draw();
            _bindCustomerTableEvents(customersTable);
        }
    });

    // Input de búsqueda personalizado
    $('#search-customer-input')
        .off('keyup.customerSearch')
        .on('keyup.customerSearch', function () {
            customersTable.search($(this).val()).draw();
        });
}

/**
 * Registra todos los eventos relacionados con clientes.
 * Se llaman una sola vez desde initCustomerModule().
 */
function bindCustomerEvents() {
    // Cuando cambia el valor del input hidden #customer_id
    $('#customer_id').on('change', function () {
        const customerId = $(this).val();
        if (customerId && customerId != 0) {
            getCustomerData(customerId);
        }
    });

    // Abrir modal de búsqueda de clientes
    $('#btn-search-customers').on('click', () => $('#modal-customers').modal('show'));

    // Seleccionar cliente con doble clic en la tabla del modal
    $('#tableCustomers tbody').on('dblclick', 'tr', function () {
        if (!customersTable) return;
        const data = customersTable.row(this).data();
        if (data && data.id) {
            getCustomerData(data.id);
            $('#modal-customers').modal('hide');
        }
    });

    // Cerrar modal de lista de clientes
    $('#btn-close-list-customer').on('click', () => $('#modal-customers').modal('hide'));

    // Abrir modal para agregar nuevo cliente
    $('#btn-add-customer').on('click', () => $('#customerModal').modal('show'));

    // Limpiar input de búsqueda al abrir el modal
    $('#modal-customers').on('shown.bs.modal', function () {
        $('#search-customer-input').val('').trigger('keyup');
        loadListCustomers();
    });
    $('#modal-customers').on('hidden.bs.modal', function () {
        if (customersTable) {
            customersTable.search('').draw(false);
        }
    });
}

/**
 * Vincula el dblclick al tbody usando la instancia activa del DataTable.
 * Se llama desde initComplete para garantizar que las filas existen.
 * Usa namespace .off().on() para no acumular listeners entre aperturas.
 *
 * @param {DataTable} tableInstance - Instancia activa
 */
function _bindCustomerTableEvents(tableInstance) {
    $('#tableCustomers tbody')
        .off('dblclick.customerSelect')
        .on('dblclick.customerSelect', 'tr', function () {
            // Usar la instancia recibida como parámetro, no la variable del módulo
            const data = tableInstance.row(this).data();

            if (!data) {
                console.warn('No se pudieron obtener los datos de la fila seleccionada');
                return;
            }

            getCustomerData(data.id);
            $('#modal-customers').modal('hide');
        });
}

// =========================================
// FUNCIONES PÚBLICAS EXPORTADAS
// =========================================

/**
 * Limpia todos los campos visuales y del DOM relacionados al cliente.
 * Se exporta para que purchaseMain.js la llame al cancelar/limpiar compra.
 */
export function cleanCustomerData() {
    $('#customer_id').val(1);
    $('#auto_complete_customer').val('');
    $('.customer-name').html('Publico en general');
    $('.customer-email').html('');
    $('.customer-phone').html('');
    $('.customer-tax-id').html('');
    $('.default_credit_days').val(0);
    $('.credit-limit').val(0);
    $('.customer-credit-available').val(0);
    $('.credit-due-date').val(0);
    localStorage.removeItem(CONFIG.storage.customerKey);
}

/**
 * Retorna el ID del cliente actualmente seleccionado.
 * Se exporta para que otros módulos (ej. paymentModule, waitingModule) lo usen.
 *
 * @returns {string} ID del cliente o '1' si no hay ninguno
 */
export function getCurrentCustomerId() {
    return $('#customer_id').val() || '1';
}

/**
 * Valida que haya un cliente seleccionado antes de continuar.
 * Muestra alerta si no hay cliente.
 *
 * @returns {boolean}
 */
export function validateCustomer() {
    const customerId = getCurrentCustomerId();
    if (!validateCustomerSelected(customerId)) {
        showAlert('warning', 'Alerta', CONFIG.messages.noCustomer);
        return false;
    }
    return true;
}

/**
 * Retorna los datos del cliente almacenados en localStorage.
 * @returns {Object|null} Datos del cliente o null si no hay datos válidos
 */
export function getCurrentCustomerData() {
    const stored = localStorage.getItem(CONFIG.storage.customerKey);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error al parsear cliente guardado:', error);
        return null;
    }
}