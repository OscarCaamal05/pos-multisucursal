import { showAlert } from '../../utils/alerts';
import { SALES_CONFIG } from './saleMain';
import { bindCustomerFormSubmit, closeCustomerModal } from '../../helpers/customerHelper';

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let autoCompleteCustomers = null;
let customersTable = null;

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
                    message.setAttribute("class", CONFIG.cssClasses.noResult);
                    message.innerHTML = `<span>No se encontraron resultados para "${data.query}"</span>`;
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
                    const selectedText = typeof selection.value === 'string'
                        ? selection.value
                        : (selection.value?.value || '');

                    autoCompleteCustomers.input.value = selectedText;
                    autoCompleteCustomers.input.select();

                    // Actualizar el campo hidden del ID del cliente
                    $(SALES_CONFIG.selectors.customerId).val(selection.value.id).trigger('change');
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
            url: `${SALES_CONFIG.api.base}/${customerId}`,
            method: 'GET'
        });

        updateCustomerUI(response);
        saveCustomerToStorage(customerId, response);


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

    $('.customer-name').text(customerData.full_name || 'Publico General');
    $('.customer-email').text(customerData.email || 'No registrado');
    $('.customer-phone').text(formatPhoneNumber(customerData.phone) || 'No registrado');
    $('.customer-available-credit').text(`$Credito disponible: ${customerData.credit_limit}` || '$0.00');

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
    // Si es una cadena vacía o undefined, limpiar selección
    if (!customerData) {
        cleanCustomerData();
        return;
    }

    // Determinar el texto y el ID del cliente
    let selectedText, customerId;

    if (typeof customerData === 'string') {
        selectedText = customerData;
        customerId = 0; // Si es solo texto, no tenemos ID
    } else if (typeof customerData === 'object' && customerData !== null) {
        selectedText = customerData.value || customerData.label || '';
        customerId = customerData.id || 0;
    } else {
        console.error('Tipo de dato no esperado en selectCustomer:', typeof customerData);
        return;
    }
    // Actualizar el input del autocompletado
    if (autoCompleteCustomers && autoCompleteCustomers.input) {
        autoCompleteCustomers.input.value = selectedText;
    }

    // Actualizar el campo hidden del ID del cliente
    $(SALES_CONFIG.selectors.customerId).val(customerId).trigger('change');
}

/**
 * GUARDA LOS DATOS DEL CLIENTE EN LOCALSTORAGE
 * @param {number} customerId // Id del cliente
 * @param {object} customerData // Datos del cliente
 */
function saveCustomerToStorage(customerId, customerData) {
    const customer = {
        customerId: customerId,
        full_name: customerData.full_name,
        email: customerData.email,
        phone: formatPhoneNumber(customerData.phone),
        rfc: customerData.rfc,
        credit_available: customerData.credit_available,
        credit_limit: customerData.credit_limit,
        credit_days: customerData.credit_days,
        credit_due_date: customerData.credit_due_date,
    };

    localStorage.setItem(SALES_CONFIG.storage.customerKey, JSON.stringify(customer));
}

// =========================================
// EVENTOS
// =========================================
function bindCustomerEvents() {

    /**
     * EVENTO PARA MANEJAR EL ID DEL CLIENTE SELECIONADO EL AUTOCOMPLETADO
     */
    $(SALES_CONFIG.selectors.customerId).on('change', function () {
        const customerId = $(this).val();
        if (customerId && customerId !== '0') {
            getCustomerData(customerId);
        } else {
            cleanCustomerDisplay();
        }
    });

    /**
     * EVENTO PARA ABRIR EL MODAL DE LISTA DE CLIENTES
     */
    $('#btn-search-customers').on('click', function () {
        $(SALES_CONFIG.selectors.modalCustomers).modal('show');
        loadCustomersList();
    });

    /**
    * EVENTO PARA CERRAR EL MODAL DE LISTA DE CLIENTES
    */
    $('#btn-close-list-customer').on('click', function () {
        $(SALES_CONFIG.selectors.modalCustomers).modal('hide');
    });

    /**
     * EVENTO PARA SELECCIONAR CLIENTE DE LA TABLA POR DOBLE CLIC
     */
    $('#tableCustomers tbody').on('dblclick', 'tr', function () {
        if (customersTable) {
            const data = customersTable.row(this).data();
            if (data && data.id) {
                getCustomerData(data.id);
                $(SALES_CONFIG.selectors.modalCustomers).modal('hide');
            }
        }
    });

    /**
     * EVENTO PARA ABRIR EL MODAL DE AGREGAR CLIENTE
     */
    $('#btn-add-customer').on('click', function () {
        $(SALES_CONFIG.selectors.customerId).val(0);
        $(SALES_CONFIG.selectors.modalAddCustomers).modal('show');
    });


    /**
     * EVENTO PARA GUARDAR EL NUEVO CLIENTE
     */
    $(SALES_CONFIG.selectors.modalAddCustomers).on('shown.bs.modal', function () {

        bindCustomerFormSubmit({
            table: null, // Siempre null aquí, se maneja en onSuccess
            onSuccess: (response) => {
                getCustomerData(response.customer.id);
                $(SALES_CONFIG.selectors.modalAddCustomers).modal('hide');

                // Si existe la tabla, recargar los datos
                if (customersTable && $.fn.DataTable.isDataTable('#tableCustomers')) {
                    customersTable.ajax.reload(null, false);
                }
            }
        });
    });

    /**
     * EVENTO PARA LIMPIAR EL MODAL DE NUEVO CLIENTE
     */
    $(SALES_CONFIG.selectors.modalAddCustomers).on('hidden.bs.modal', function () {
        // Limpiar el formulario al cerrar el modal
        const $form = $(this).find('form');
        $form[0].reset();
        $form.find('#customerId').val(0);
    });

    // CERRAR MODAL DE NUEVO CLIENTE
    closeCustomerModal();
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
        if ($.fn.DataTable.isDataTable('#tableCustomers')) {
            $('#tableCustomers').DataTable().destroy();
            $('#tableCustomers tbody').empty();
        }

        // Crear nueva tabla
        customersTable = $('#tableCustomers').DataTable({
            ajax: {
                url: `${SALES_CONFIG.api.customers}/data`,
                type: 'GET'
            },
            columns: [
                {
                    data: 'id',
                    name: 'id'
                },
                {
                    data: 'full_name',
                    name: 'full_name',
                },
                {
                    data: 'rfc',
                    name: 'rfc'
                },
                {
                    data: null,
                    name: 'phone',
                    render: function (data, type, row) {
                        return formatPhoneNumber(data.phone);
                    }
                },
                {
                    data: 'email',
                    name: 'email'
                },
                {
                    data: null,
                    name: 'credit_available',
                    orderable: false,
                    searchable: false,
                    render: function (data, type, row) {
                        return data.credit_available - data.credit;
                    }
                }
            ],
            language: idiomaEspanol,
            pageLength: 10,
            responsive: true,
            processing: true,
            serverSide: true,
            scrollY: 450,
            deferRender: true,
            scroller: true,
            searching: true,
            info: false,
            dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>><"clear">',
        });

        // Agregar funcionalidad al input personalizado de búsqueda
        $('#search-customer-input').off('keyup.customerSearch').on('keyup.customerSearch', function () {
            const searchValue = $(this).val();
            customersTable.search(searchValue).draw();
        });

        // Limpiar el input cuando se abra el modal
        $(SALES_CONFIG.selectors.modalCustomers).on('shown.bs.modal', function () {
            $('#search-customer-input').val('').trigger('keyup');
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

// Exportar funciones para uso en otros módulos
export {
    updateCustomerUI,
    selectCustomer,
    saveCustomerToStorage,
    formatPhoneNumber
};