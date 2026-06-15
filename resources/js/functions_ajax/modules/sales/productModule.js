import { showAlert, clearValidationErrors, handleValidationError } from '../../utils/alerts';
import { getDataTableLanguage } from '../../utils/datatableLanguage';
import { calculateUnitPrice, calculateMarginFromSalePrice } from '../../functionAjaxProducts';
import { showConfirmationAlert } from '../../utils/alerts';
import { showProductsModal, closeProductModal, bindProductFormSubmit } from '../../helpers/productHelper';
import { validateInputChecked } from '../../functionAjaxProducts';
import { closeDepartmentModal, bindDepartmentFormSubmit, selectDepartmet } from '../../helpers/departmentHelper';
import { closeCategoryModal, bindCategoryFormSubmit, selectCategoryAndDept } from '../../helpers/categoryHelper';
import { getTableDetails } from './detailModule';
import {
    SALES_CONFIG as CONFIG,
} from '../../helpers/SalesHelper';
// =========================================
// CONFIGURACIÓN DEL MÓDULO
// =========================================
const PRODUCT_CONFIG = {
    selectors: {
        autoComplete: '#auto_complete_product',
        productId: '#product_id',
        modalProductsList: '#modal-products',
        modalAddProduct: '#productsModal',
        tableProducts: '#tableProducts',
        searchInput: '#searchArticleInput',
        btnSearch: '#btn-search-product',
        btnClose: '#btn-close-product',
        btnAddArticle: '#btn-add-article',
        btnEditProduct: '.btn-edit-product',
        // Modal detalle
        modalDetails: '#modal-product-details',
        formDetails: '#productDetails',
        tempId: '#temp_id',
        quantity: '#quantity',
    },
    classes: {
        factor: '.factor',
        autoSelect: '.auto-select',
    },
    api: {
        autocomplete: 'temp_purchases_detail/autoCompleteProducts',
        findByBarcode: 'temp_sales_detail/findByBarcode',
        addProduct: '/temp_sales_detail/addProductToSalesDetails',
        products: '/products/data',
    }
};

// =========================================
// VARIABLES LOCALES (privadas al módulo)
// =========================================
let productsTable = null;   // instancia DataTable del modal de listado
let isProcessing = false;  // flag anti-doble disparo en autocomplete/dblclick

// =========================================
// INICIALIZACIÓN
// =========================================

/**
 * Punto de entrada del módulo. Llamar desde salesMain.js
 */
export function initProductModule() {
    try {
        setupProductAutoComplete();
        bindProductEvents();     // escucha evento del detailModule
        console.log('✅ Módulo de productos (ventas) inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de productos:', error);
    }
}

// =========================================
// AUTOCOMPLETADO
// =========================================

/**
 * Inicializa el autocompletado de productos.
 * La instancia se mantiene interna — no se exporta porque autoComplete.js
 * requiere el contexto del DOM al momento de crearse.
 */
function setupProductAutoComplete() {
    const instance = new autoComplete({
        selector: PRODUCT_CONFIG.selectors.autoComplete,
        data: {
            src: async (query) => {
                try {
                    const response = await searchProductsQuery(query);
                    return response.data;
                } catch (error) {
                    console.error('Error en autocompletado de productos:', error);
                    return [];
                }
            },
            keys: ['value'],
            cache: false
        },
        resultsList: {
            element: (list, data) => {
                if (!data.results.length) {
                    const msg = document.createElement('div');
                    msg.setAttribute('class', CONFIG.cssClasses.noResult);
                    msg.innerHTML = `<span>No se encontraron productos para "${data.query}"</span>`;
                    list.prepend(msg);
                }
            },
            noResults: true
        },
        resultItem: { highlight: true },
        events: {
            input: {
                selection: (event) => {
                    if (isProcessing) return;
                    isProcessing = true;

                    try {
                        const selection = event.detail.selection;
                        const selectedText = typeof selection.value === 'string'
                            ? selection.value
                            : (selection.value?.value || '');

                        instance.input.value = selectedText;
                        instance.input.select();

                        // Limpiar el input después de seleccionar para permitir otro producto
                        $(PRODUCT_CONFIG.selectors.productId).val(selection.value.id).trigger('change');
                    } catch (err) {
                        console.error('Error al procesar selección de producto:', err);
                    } finally {
                        setTimeout(() => { isProcessing = false; }, 800);
                    }
                }
            }
        }
    });
}

/**
 * AJAX del autocompletado.
 * @param {string} query
 */
function searchProductsQuery(query) {
    return $.ajax({
        url: `${PRODUCT_CONFIG.api.autocomplete}/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

/**
 * Busca un producto por código de barras (lectura directa) y lo agrega a la venta.
 * @param {string} barcode
 */
function searchAndAddByBarcode(barcode) {
    $.ajax({
        url: `${PRODUCT_CONFIG.api.findByBarcode}/${barcode}`,
        type: 'GET',
        dataType: 'json',
        success: (response) => {
            if (response.success) {
                addProductTempSale(response.id);
            } else {
                showAlert('error', response.message || 'Producto no encontrado');
            }
        }
    });
}

// =========================================
// TABLA MODAL DE LISTADO DE PRODUCTOS
// =========================================

/**
 * Inicializa (o reinicia) el DataTable dentro del modal de búsqueda de productos.
 */
export function loadListProducts() {
    // Destruir instancia anterior si existe
    if ($.fn.DataTable.isDataTable(PRODUCT_CONFIG.selectors.tableProducts)) {
        productsTable = $(PRODUCT_CONFIG.selectors.tableProducts).DataTable();
        productsTable.columns.adjust().draw();
        return;
    }

    productsTable = $(PRODUCT_CONFIG.selectors.tableProducts).DataTable({
        processing: true,
        serverSide: true,
        ajax: PRODUCT_CONFIG.api.products,
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            { data: 'barcode', name: 'barcode', orderable: false, searchable: false },
            { data: 'category_name', name: 'category_name', className: 'text-center' },
            { data: 'department_name', name: 'department_name', className: 'text-center' },
            { data: 'sale_price_1', name: 'sale_price_1', orderable: false, searchable: false, className: 'text-end' },
            { data: 'stock', name: 'stock', orderable: false, searchable: false, className: 'text-end' },
            { data: 'sale_unit_name', name: 'sale_unit_name', searchable: false, className: 'text-center' },
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: getDataTableLanguage({
            emptyTable: "Sin productos disponibles"
        }),
        searching: true,
        info: false,
        dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>><"clear">'
    });

    // Búsqueda personalizada con namespace para evitar acumulación
    $(PRODUCT_CONFIG.selectors.searchInput)
        .off('keyup.productSearch')
        .on('keyup.productSearch', function () {
            productsTable.search($(this).val()).draw();
        });

    // Limpiar buscador al abrir el modal
    $(PRODUCT_CONFIG.selectors.modalProductsList)
        .off('shown.bs.modal.productSearch')
        .on('shown.bs.modal.productSearch', function () {
            $(PRODUCT_CONFIG.selectors.searchInput).val('').trigger('keyup');
        });
}

// =========================================
// EVENTOS DE INTERACCIÓN
// =========================================

function bindProductEvents() {
    const sel = PRODUCT_CONFIG.selectors;

    // --- DETECCIÓN DE LECTOR DE CÓDIGO DE BARRAS ---
    let barcodeBuffer = '';
    let lastKeyTime = 0;
    const SCANNER_THRESHOLD_MS = 50; // ms entre pulsaciones para considerar lectura
    const MIN_BARCODE_LENGTH = 3; // longitud mínima para considerar código de barras

    $(sel.autoComplete).on('keydown', function (e) {
        const now = Date.now();
        const timeDiff = now - lastKeyTime;
        lastKeyTime = now;

        if (e.key === 'Enter') {
            const scanned = barcodeBuffer.trim();
            barcodeBuffer = '';

            // Solo actuar si llegó rápido y tiene longitud válida
            if (scanned.length >= MIN_BARCODE_LENGTH) {
                e.preventDefault();
                e.stopImmediatePropagation();

                setTimeout(() => {                
                    searchAndAddByBarcode(scanned);
                    $(sel.autoComplete).val(''); // limpiar el input
                },200);
            }
            return;
        }

        // Acumular caracteres si llegan rápido (escáner) o si el buffer ya tiene contenido
        if (timeDiff < SCANNER_THRESHOLD_MS || barcodeBuffer.length > 0) {
            if (e.key.length === 1) { // solo caracteres imprimibles
                barcodeBuffer += e.key;
            }
        } else {
            barcodeBuffer = e.key.length === 1 ? e.key : '';
        }
    });

    $(sel.productId).on('change', function () {
        const productId = $(this).val();
        if (productId) {
            addProductTempSale(productId);
        }
    });

    // Botón buscar producto → abrir modal listado
    $(sel.btnSearch).on('click', () => $(sel.modalProductsList).modal('show'));

    // Doble click en tabla listado → seleccionar producto
    $(`${PRODUCT_CONFIG.selectors.tableProducts} tbody`).on('dblclick', 'tr', function () {
        if (!productsTable) return;

        if (isProcessing) return;
        isProcessing = true;

        const data = productsTable.row(this).data();
        if (data?.id) {
            $(sel.productId).val(data.id).trigger('change');
            $(sel.modalProductsList).modal('hide');
        }

        setTimeout(() => { isProcessing = false; }, 800);
    });

    // Cerrar modal listado productos
    $(sel.btnClose).on('click', () => $(sel.modalProductsList).modal('hide'));

    // Botón agregar nuevo artículo
    $(sel.btnAddArticle).on('click', () => $(sel.modalAddProduct).modal('show'));

    // Auto-select en focus
    $(document).on('focus', PRODUCT_CONFIG.classes.autoSelect, function () {
        const $this = $(this);
        $this.trigger('select');
        $this.one('mouseup.selectText', (e) => e.preventDefault());
    });

    // Focus automático en cantidad al abrir el modal detalle
    $(sel.modalDetails).on('shown.bs.modal', () => {
        $(sel.quantity).trigger('focus').trigger('select');
    });

    // Formulario de nuevo producto (modal agregar artículo)
    bindProductFormSubmit({
        table: null,
        onSuccess: (response) => {
            if (response.status === 'create') {
                $(sel.productId).val(response.product.id).trigger('change');
                $(sel.modalAddProduct).modal('hide');
            }
        }
    });

    // Formularios de departamento y categoría (anidados en el modal de producto)
    bindDepartmentFormSubmit({
        onSuccess: (response) => {
            if (response.status === 'create' && response.department) {
                selectDepartment(response.department, '.departments');
            }
        }
    });

    bindCategoryFormSubmit({
        onSuccess: (response) => {
            if (response.status === 'create' && response.category) {
                selectCategoryAndDept(response.category, '.products_categories', '.products_departments');
            }
        }
    });

    $(sel.modalProductsList).on('shown.bs.modal', function () {
        loadListProducts();
    });

    // Cierre de modales anidados
    closeProductModal();
    closeDepartmentModal();
    closeCategoryModal();
}

function addProductTempSale(productId) {
    const tempSaleId = $('#temp_sale_id').val();
    $.ajax({
        url: PRODUCT_CONFIG.api.addProduct,
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        data: {
            product_id: productId,
            temp_sale_id: tempSaleId
        },
        dataType: 'json',
        success: (response) => {
            // Notificar a detailModule para que recargue totales y tabla
            $(document).trigger('sale:productSaved', [response]);
        },
    });
}

// =========================================
// HELPERS PRIVADOS
// =========================================

function closeModal(modalId) {
    $(modalId).modal('hide');
}