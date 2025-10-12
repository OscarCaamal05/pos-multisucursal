import { showAlert } from '../../utils/alerts';
import { SALES_CONFIG, customersTable } from './saleMain';

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let autoCompleteCustomers = null;

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================
export function initCustomerModule() {
    try {
        initStoredCustomer();
        setupCustomerAutoComplete();
        bindCustomerEvents();
        console.log('✅ Módulo de clientes inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de clientes:', error);
    }
}

// =========================================
// AUTOCOMPLETADO DE CLIENTES
// =========================================
function setupCustomerAutoComplete() {
    autoCompleteCustomers = new autoComplete({
        selector: SALES_CONFIG.selectors.autoCompleteCustomer,
        data: {
            src: async (query) => {
                try {
                    const response = await searchCustomers(query);
                    return response.data;
                } catch (error) {
                    console.error('Error en búsqueda de clientes:', error);
                    return [];
                }
            },
            keys: ['value'],
            cache: false
        },
        resultsList: {
            element: function (list, data) {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", "autoComplete_result");
                    message.innerHTML = `<span>No se encontraron clientes para "${data.query}"</span>`;
                    list.prepend(message);
                }
            },
            noResults: true
        },
        resultItem: {
            highlight: true
        },
        events: {
            input: {
                selection: function (event) {
                    const selection = event.detail.selection;
                    selectCustomer(selection.value);
                }
            }
        }
    });
}

// =========================================
// GESTIÓN DE CLIENTES
// =========================================

/**
 * FUNCIÓN PARA INICIALIZAR EL CLIENTE GUARDADO EN LOCALSTORAGE
 * @param {number} customerId 
 */
export async function getCustomerData(customerId) {
    try {
        //showAlert('info', 'Cargando', 'Obteniendo datos del cliente...');

        const response = await $.ajax({
            url: `${SALES_CONFIG.api.customers}/${customerId}`,
            method: 'GET'
        });

        updateCustomerUI(response);
        saveCustomerToStorage(customerId, response);

        console.log('✅ Datos del cliente cargados:', response);

    } catch (error) {
        console.error('Error al obtener datos del cliente:', error);
        showAlert('error', 'Error', 'No se pudieron obtener los datos del cliente');
    }
}

/**
 * MUESTRA LOS DATOS DEL CLIENTE EN LA INTERFAZ DE USUARIO
 * @param {object} customerData // Objeto con los datos del cliente
 */
function updateCustomerUI(customerData) {
    $('.customer-name').text(customerData.name || 'Cliente General');
    $('.customer-email').text(customerData.email || 'No registrado');
    $('.customer-phone').text(formatPhoneNumber(customerData.phone) || 'No registrado');
    $('.customer-address').text(customerData.address || 'No registrada');

    // Actualizar información adicional si existe
    if (customerData.rfc) {
        $('.customer-rfc').text(customerData.rfc);
    }
}

/**
 * FUNCIÓN PARA SELECCIONAR UN CLIENTE DEL AUTOCOMPLETADO
 * @param {string|object} customerData // Cadena de ingresa en el input de busqueda o el objeto seleccionado
 */
function selectCustomer(customerData) {
    // Si es una cadena vacía, limpiar selección
    const selectedText = typeof customerData === 'string'
        ? customerData
        : (customerData?.value || '');
    // Si es un objeto, obtener el ID
    if (autoCompleteCustomers && autoCompleteCustomers.input) {
        autoCompleteCustomers.input.value = selectedText;
        autoCompleteCustomers.input.select();
    }

    $(SALES_CONFIG.selectors.customerId).val(customerData.id).trigger('change');
}

/**
 * GUARDA LOS DATOS DEL CLIENTE EN LOCALSTORAGE
 * @param {number} customerId // Id del cliente
 * @param {object} customerData // Datos del cliente
 */
function saveCustomerToStorage(customerId, customerData) {
    const customer = {
        customerId: customerId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        rfc: customerData.rfc || null,
        savedAt: new Date().toISOString()
    };

    localStorage.setItem(SALES_CONFIG.storage.customerKey, JSON.stringify(customer));
}

// =========================================
// EVENTOS
// =========================================
function bindCustomerEvents() {
    // Cambio de cliente
    $(SALES_CONFIG.selectors.customerId).on('change', function () {
        const customerId = $(this).val();
        if (customerId && customerId !== '0') {
            getCustomerData(customerId);
        } else {
            cleanCustomerDisplay();
        }
    });

    // Búsqueda de clientes en modal
    $('#btn-search-customers').on('click', function () {
        $(SALES_CONFIG.selectors.modalCustomers).modal('show');
        loadCustomersList();
    });

    // Selección por doble clic en tabla
    $(document).on('dblclick', '#tableCustomers tbody tr', function () {
        if (customersTable) {
            const data = customersTable.row(this).data();
            if (data && data.id) {
                getCustomerData(data.id);
                $(SALES_CONFIG.selectors.modalCustomers).modal('hide');
            }
        }
    });

    // Botón de selección en tabla
    $(document).on('click', '.btn-select-customer', function () {
        const customerId = $(this).data('id');
        if (customerId) {
            getCustomerData(customerId);
            $(SALES_CONFIG.selectors.modalCustomers).modal('hide');
        }
    });
    // Limpiar cliente
    $('#btn-clear-customer').on('click', function () {
        cleanCustomerData();
    });
}

// =========================================
// FUNCIONES AUXILIARES
// =========================================
async function searchCustomers(query) {
    return $.ajax({
        url: `${SALES_CONFIG.api.base}/autoCompleteCustomers/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

function initStoredCustomer() {
    const customerStored = localStorage.getItem(SALES_CONFIG.storage.customerKey);
    if (customerStored) {
        try {
            const data = JSON.parse(customerStored);
            updateCustomerUI(data);
            $(SALES_CONFIG.selectors.customerId).val(data.customerId || 0);
            console.log('✅ Cliente restaurado desde storage:', data.name);
        } catch (error) {
            console.error('Error al parsear cliente guardado:', error);
            localStorage.removeItem(SALES_CONFIG.storage.customerKey);
        }
    }
}

async function loadCustomersList() {
    try {
        // Destruir tabla existente si existe
        if ($.fn.DataTable.isDataTable('#tableCustomers')) {
            $('#tableCustomers').DataTable().destroy();
        }

        // Crear nueva tabla
        customersTable = $('#tableCustomers').DataTable({
            ajax: {
                url: `${SALES_CONFIG.api.customers}/data`,
                type: 'GET'
            },
            columns: [
                { data: 'name', name: 'name', title: 'Nombre' },
                { data: 'email', name: 'email', title: 'Email' },
                { data: 'phone', name: 'phone', title: 'Teléfono' },
                {
                    data: 'id',
                    name: 'actions',
                    title: 'Acciones',
                    orderable: false,
                    searchable: false,
                    render: function (data) {
                        return `
                            <div class="hstack gap-2">
                                <button class="btn btn-sm btn-primary btn-select-customer" data-id="${data}" title="Seleccionar cliente">
                                    <i class="ri-check-line"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            language: {
                url: '/assets/libs/datatables.net/es-ES.json'
            },
            pageLength: 10,
            responsive: true,
            processing: true,
            serverSide: true
        });

    } catch (error) {
        console.error('Error al cargar lista de clientes:', error);
        showAlert('error', 'Error', 'No se pudo cargar la lista de clientes');
    }
}

function formatPhoneNumber(phone) {
    if (!phone || phone.length !== 10) return phone;
    return `(${phone.substring(0, 3)})-${phone.substring(3, 6)}-${phone.substring(6)}`;
}

function cleanCustomerDisplay() {
    $('.customer-name').text('Cliente General');
    $('.customer-email, .customer-phone, .customer-address, .customer-rfc').text('');
}

// =========================================
// FUNCIONES PÚBLICAS EXPORTADAS
// =========================================
export function cleanCustomerData() {
    $(SALES_CONFIG.selectors.customerId).val(0);
    $(SALES_CONFIG.selectors.autoCompleteCustomer).val('');
    cleanCustomerDisplay();
    localStorage.removeItem(SALES_CONFIG.storage.customerKey);
    console.log('✅ Datos de cliente limpiados');
}

export function getCurrentCustomerId() {
    return $(SALES_CONFIG.selectors.customerId).val();
}

export function getCurrentCustomerData() {
    const customerStored = localStorage.getItem(SALES_CONFIG.storage.customerKey);
    return customerStored ? JSON.parse(customerStored) : null;
}

// Exportar funciones para uso en otros módulos
export {
    updateCustomerUI,
    selectCustomer,
    saveCustomerToStorage,
    formatPhoneNumber
};