import { showAlert } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import {
    bindSupplierFormSubmit,
    closeSupplierModal,
    formatCleave,
    initCreditTermsAndDate,
} from '../../helpers/supplierHelper';
import {
    PURCHASES_CONFIG as CONFIG,
    formatPhoneNumber,
    validateSupplierSelected,
} from '../../helpers/PurchasesHelper';

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let suppliersTable = null;
let autoCompleteInstance = null;

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================

/**
 * Punto de entrada del módulo de proveedores.
 * Se llama desde purchaseMain.js dentro del $(document).ready
 */
export function initSupplierModule() {
    initStoredSupplier();
    setupSupplierAutoComplete();
    bindSupplierEvents();
    bindSupplierFormSubmit({
        table: suppliersTable,
        onSuccess: (response) => {
            getSupplierData(response.supplier.id);
            $('#modal-suppliers').modal('hide');
        }
    });
    closeSupplierModal();
    formatCleave();
    initCreditTermsAndDate('#credit_terms', '#credit_due_date', 30);
}

// =========================================
// LOCALSTORAGE: Recuperar proveedor guardado
// =========================================

/**
 * Lee el proveedor guardado en localStorage y lo muestra en la interfaz.
 * Se ejecuta al cargar la página para restaurar el estado previo.
 */
function initStoredSupplier() {
    const stored = localStorage.getItem(CONFIG.storage.supplierKey);
    if (!stored) return;

    try {
        const data = JSON.parse(stored);
        updateSupplierUI(data);
        $('#supplier_id').val(data.supplierId || 0);
    } catch (error) {
        console.error('Error al parsear proveedor guardado:', error);
        localStorage.removeItem(CONFIG.storage.supplierKey);
    }
}

// =========================================
// AUTOCOMPLETADO DE PROVEEDORES
// =========================================

/**
 * Inicializa la librería autoComplete.js para el campo de búsqueda de proveedores.
 */
function setupSupplierAutoComplete() {
    autoCompleteInstance = new autoComplete({
        selector: '#auto_complete_supplier',
        data: {
            src: async (query) => {
                try {
                    const response = await searchSuppliers(query);
                    return response.data;
                } catch (error) {
                    console.error('Error en autocompletado de proveedores:', error);
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
                    $('#supplier_id').val(selection.value.id).trigger('change');
                },
            },
        },
    });
}

// =========================================
// AJAX: Búsqueda de proveedores (autocomplete)
// =========================================

/**
 * Envía la cadena de búsqueda al servidor para el autocompletado.
 *
 * @param {string} query - Texto introducido por el usuario
 * @returns {Promise} Promesa con la respuesta del servidor
 */
function searchSuppliers(query) {
    return $.ajax({
        url: `temp_purchases_detail/autoCompleteSuppliers/${query}`,
        type: 'GET',
        dataType: 'json',
    });
}

// =========================================
// AJAX: Obtener datos de un proveedor por ID
// =========================================

/**
 * Consulta los datos completos de un proveedor y los muestra en la interfaz.
 * También guarda los datos en localStorage para persistencia al recargar.
 *
 * @param {number} supplierId - ID del proveedor seleccionado
 */
export function getSupplierData(supplierId) {
    $.ajax({
        url: `/temp_purchases_detail/${supplierId}/show`,
        method: 'GET',
        success: function (response) {
            console.log(response);
            const phoneFormatted = formatPhoneNumber(response.phone);
            updateSupplierUI({
                representative: response.representative,
                company_name: response.company_name,
                email: response.email,
                phone: phoneFormatted,
                tax_id: response.tax_id,
                credit_available: response.credit_available,
                credit_limit: response.credit_limit,
                credit_days: response.credit_days,
                credit_due_date: response.credit_due_date,
            });

            $('#supplier_id').val(supplierId || 0);

            saveSupplierToStorage(supplierId, response);
        },
        error: function (xhr) {
            console.error('Error al obtener datos del proveedor:', xhr);
            showAlert('error', 'Error', 'No se pudieron obtener los datos del proveedor.');
        },
    });
}

// =========================================
// UI: Actualizar campos del proveedor en pantalla
// =========================================

/**
 * Refleja los datos del proveedor en los elementos de la vista.
 *
 * @param {Object} data - Datos del proveedor
 */
function updateSupplierUI(data) {
    $('.name_supplier').text(data.representative || 'No hay dato');
    $('.company_name').text(data.company_name || 'No hay dato');
    $('.email_supplier').text(data.email || 'No hay dato');
    $('.phone_supplier').text(data.phone || 'No hay dato');
    $('.tax_id_supplier').text(data.tax_id || 'No hay dato');
    $('.credit_supplier').text(data.credit_available || 'No hay dato');
    $('.credit-limit-supplier').val(data.credit_limit || 0);
    $('.credit-terms').val(data.credit_days || 0);
    $('.credit-due-date').val(data.credit_due_date || 0);
}

// =========================================
// LOCALSTORAGE: Guardar proveedor seleccionado
// =========================================

/**
 * Persiste los datos del proveedor en localStorage.
 *
 * @param {number} supplierId - ID del proveedor
 * @param {Object} response   - Respuesta completa del servidor
 */
function saveSupplierToStorage(supplierId, response) {
    const supplier = {
        supplierId: supplierId,
        representative: response.representative,
        company_name: response.company_name,
        email: response.email,
        phone: formatPhoneNumber(response.phone),
        tax_id: response.tax_id,
        credit_available: response.credit_available,
        credit_limit: response.credit_limit,
        credit_days: response.credit_days ? response.credit_days : 30,
        credit_due_date: response.credit_due_date,
        
    };
    localStorage.setItem(CONFIG.storage.supplierKey, JSON.stringify(supplier));
}

// =========================================
// DATATABLE: Cargar lista de proveedores en modal
// =========================================

/**
 * Destruye e inicializa la tabla de proveedores dentro del modal de búsqueda.
 * Incluye el input de búsqueda personalizado.
 */
export function loadListSuppliers() {

    if ($.fn.DataTable.isDataTable('#tableSuppliers')) {
        suppliersTable = $('#tableSuppliers').DataTable();
        suppliersTable.columns.adjust().draw();
        return;
    }

    suppliersTable = $('#tableSuppliers').DataTable({
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
                data: 'credit_limit_granted',
                name: 'credit_limit_granted',
                orderable: false
            },
            {
                data: 'credit_available',
                name: 'credit_available',
                orderable: false,
                searchable: false,
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
            _bindSupplierTableEvents(suppliersTable);
        }
    });

    // Input de búsqueda personalizado
    $('#searchSupplierInput')
        .off('keyup.supplierSearch')
        .on('keyup.supplierSearch', function () {
            suppliersTable.search($(this).val()).draw();
        });
}

// =========================================
// EVENTOS DEL MÓDULO
// =========================================

/**
 * Registra todos los eventos relacionados con proveedores.
 * Se llaman una sola vez desde initSupplierModule().
 */
function bindSupplierEvents() {
    // Cuando cambia el valor del input hidden #supplier_id
    $('#supplier_id').on('change', function () {
        const supplierId = $(this).val();
        if (supplierId && supplierId != 0) {
            getSupplierData(supplierId);
        }
    });

    // Abrir modal de búsqueda de proveedores
    $('#btn-search-suppliers').on('click', function () {
        $('#modal-suppliers').modal('show');
    });

    // Seleccionar proveedor con doble clic en la tabla del modal
    $('#tableSuppliers tbody').on('dblclick', 'tr', function () {
        if (!suppliersTable) return;
        const data = suppliersTable.row(this).data();
        if (data && data.id) {
            getSupplierData(data.id);
            $('#modal-suppliers').modal('hide');
        }
    });

    // Cerrar modal de lista de proveedores
    $('#btn-close-supplier').on('click', function () {
        $('#modal-suppliers').modal('hide');
    });

    // Abrir modal para agregar nuevo proveedor
    $('#btn-add-supplier').on('click', function (e) {
        e.preventDefault();
        $('#supplierModal').modal('show');
    });

    // Limpiar input de búsqueda al abrir el modal
    $('#modal-suppliers').on('shown.bs.modal', function () {
        $('#searchSupplierInput').val('').trigger('keyup');
        loadListSuppliers();
    });
    $('#modal-suppliers').on('hidden.bs.modal', function () {
        if (suppliersTable) {
            suppliersTable.search('').draw(false);
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
function _bindSupplierTableEvents(tableInstance) {
    $('#tableSuppliers tbody')
        .off('dblclick.supplierSelect')
        .on('dblclick.supplierSelect', 'tr', function () {
            // Usar la instancia recibida como parámetro, no la variable del módulo
            const data = tableInstance.row(this).data();

            if (!data) {
                console.warn('No se pudieron obtener los datos de la fila seleccionada');
                return;
            }

            getSupplierData(data.id);
            $('#modal-suppliers').modal('hide');
        });
}

// =========================================
// FUNCIONES PÚBLICAS EXPORTADAS
// =========================================

/**
 * Limpia todos los campos visuales y del DOM relacionados al proveedor.
 * Se exporta para que purchaseMain.js la llame al cancelar/limpiar compra.
 */
export function cleanSupplierData() {
    $('#supplier_id').val(0);
    $('#auto_complete_supplier').val('');
    $('.company_name').html('No seleccionado');
    $('.name_supplier').html('Proveedor');
    $('.email_supplier').html('');
    $('.phone_supplier').html('');
    $('.tax_id_supplier').html('');
    $('.credit_supplier').html('');
    $('.credit-terms').val(0);
    $('.credit-limit-supplier').val(0);
    $('.credit_available').val(0);
    $('.credit-due-date').val(0);
    localStorage.removeItem(CONFIG.storage.supplierKey);
}

/**
 * Retorna el ID del proveedor actualmente seleccionado.
 * Se exporta para que otros módulos (ej. paymentModule, waitingModule) lo usen.
 *
 * @returns {string} ID del proveedor o '0' si no hay ninguno
 */
export function getCurrentSupplierId() {
    return $('#supplier_id').val() || '0';
}

/**
 * Valida que haya un proveedor seleccionado antes de continuar.
 * Muestra alerta si no hay proveedor.
 *
 * @returns {boolean}
 */
export function validateSupplier() {
    const supplierId = getCurrentSupplierId();
    if (!validateSupplierSelected(supplierId)) {
        showAlert('warning', 'Alerta', CONFIG.messages.noSupplier);
        return false;
    }
    return true;
}

/**
 * Retorna los datos del proveedor almacenados en localStorage.
 * @returns {Object|null} Datos del proveedor o null si no hay datos válidos
 */
export function getCurrentSupplierData() {
    const stored = localStorage.getItem(CONFIG.storage.supplierKey);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error al parsear proveedor guardado:', error);
        return null;
    }
}
