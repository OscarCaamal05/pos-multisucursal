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
    PURCHASES_CONFIG as CONFIG,
    renderActionsColumnProduct,
} from '../../helpers/PurchasesHelper';

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
        cost: '#cost',
        newFactor: '#new-factor',
        newPriceUnit: '#new-price-unit',
        discountNumber: '#discount-number',
        discountPercentage: '#discount-percentage',
    },
    classes: {
        priceSale: '.price-sale',
        marginPrefix: '.margin-',
        unitPurchase: '.unit-purchase',
        factor: '.factor',
        autoSelect: '.auto-select',
    },
    api: {
        autocomplete: 'temp_purchases_detail/autoCompleteProducts',
        getProduct: '/temp_purchases_detail/getDataProduct',
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
 * Punto de entrada del módulo. Llamar desde purchaseMain.js
 */
export function initProductModule() {
    try {
        setupProductAutoComplete();
        bindCalculationEvents();
        bindProductEvents();
        listenDetailEvents();         // escucha evento del detailModule
        console.log('✅ Módulo de productos (compras) inicializado');
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

// =========================================
// OBTENER DATOS DEL PRODUCTO
// =========================================

/**
 * Consulta los datos de un producto para mostrarlo en el modal de detalle.
 * Si el producto ya está en la lista temporal muestra una advertencia.
 *
 * @param {number}  productId - ID del producto seleccionado
 * @param {boolean} isEdit    - false = nuevo, true = edición
 */
export function getDataProduct(productId, isEdit = false) {
    $.ajax({
        url: `${PRODUCT_CONFIG.api.getProduct}/${productId}`,
        method: 'GET',
        dataType: 'json',
        success: (response) => {
            if (response.product_exists) {
                showAlert('warning', 'Espera', CONFIG.messages.productExists);
                closeModal(CONFIG.modals.productDetails);
                return;
            }
            showProductDetailModal(response.detail, isEdit);
        },
        error: () => {
            showAlert('error', 'Error', 'No se pudieron obtener los datos del producto.');
        }
    });
}

// =========================================
// MODAL DE DETALLE DEL PRODUCTO
// =========================================

/**
 * Rellena y abre el modal de detalle de producto.
 * Usada tanto para nuevos productos como para edición de la tabla temporal.
 *
 * @param {Object}  data   - Datos del producto / detalle temporal
 * @param {boolean} isEdit - Si es edición de un registro ya en la tabla
 */
export function showProductDetailModal(data, isEdit) {
    const sel = PRODUCT_CONFIG.selectors;
    const cls = PRODUCT_CONFIG.classes;

    // ── Datos superiores (información del artículo) ──────────────────────
    $(sel.tempId).val(data.id_temp || 0);
    $(sel.productId).val(data.product_id || 0);
    $('.product-name').text(data.product_name || '');
    $('.barcode').text(data.barcode || '');
    $('.stock').text(data.stock || 0);

    // Factor de conversión
    const conversionFactor = parseFloat(data.conversion_factor || 1);
    $(cls.factor).text(conversionFactor).val(conversionFactor);
    $(cls.factor).prop('disabled', conversionFactor === 1);

    // Precios originales
    const origPurchasePrice = parseFloat(data.original_purchase_price || data.purchase_price) || 0;
    const origSalePrice1 = parseFloat(data.original_sale_price_1 || data.sale_price_1) || 0;
    const origSalePrice2 = parseFloat(data.original_sale_price_2 || data.sale_price_2) || 0;
    const origSalePrice3 = parseFloat(data.original_sale_price_3 || data.sale_price_3) || 0;

    $('.price-purchase').text(origPurchasePrice);
    $('.price-sale-1').text(origSalePrice1);
    $('.price-sale-2').text(origSalePrice2);
    $('.price-sale-3').text(origSalePrice3);

    // ── Datos inferiores (detalle de compra) ─────────────────────────────
    const hasTemp = !!data.has_temp_data;
    const purchasePrice = hasTemp ? (parseFloat(data.purchase_price) || origPurchasePrice) : origPurchasePrice;
    const factor = hasTemp ? (parseFloat(data.factor) || conversionFactor) : conversionFactor;
    const quantity = hasTemp ? (parseFloat(data.quantity) || 0) : 1;
    const discount = hasTemp ? (parseFloat(data.discount) || 0) : 0;

    const newSalePrice1 = hasTemp ? (parseFloat(data.new_sale_price_1) || origSalePrice1) : origSalePrice1;
    const newSalePrice2 = hasTemp ? (parseFloat(data.new_sale_price_2) || origSalePrice2) : origSalePrice2;
    const newSalePrice3 = hasTemp ? (parseFloat(data.new_sale_price_3) || origSalePrice3) : origSalePrice3;

    // Rellenar inputs
    $(sel.cost).val(purchasePrice);
    $(sel.quantity).val(quantity);
    $(sel.discountNumber).val(discount);
    $(sel.newPriceUnit).val(purchasePrice);
    $(cls.factor).val(factor);

    // Precios de venta nuevos
    $('#new_price_sale_1').val(newSalePrice1);
    $('#new_price_sale_2').val(newSalePrice2);
    $('#new_price_sale_3').val(newSalePrice3);

    // Precio unitario calculado
    const unitPrice = calculateUnitPrice(purchasePrice, conversionFactor);
    $('.price-unit').text(unitPrice);

    // ── Márgenes ─────────────────────────────────────────────────────────
    calculateAndShowMargins(data, hasTemp, purchasePrice, factor);

    // ── Unidad de compra ──────────────────────────────────────────────────
    const unitName = data.unit_name || data.purchase_unit_name || 'UNIDAD';
    $(cls.unitPurchase).text(`X ${unitName}`);

    // ── Descuento porcentual ──────────────────────────────────────────────
    if (discount > 0 && purchasePrice > 0) {
        const pct = ((discount / purchasePrice) * 100).toFixed(2);
        $(sel.discountPercentage).val(pct);
    } else {
        $(sel.discountPercentage).val(0);
    }

    $(sel.modalDetails).modal('show');
}

/**
 * Calcula y pinta los márgenes de los 3 precios de venta.
 */
function calculateAndShowMargins(data, hasTemp, purchasePrice, factor) {
    const unitCost = parseFloat(purchasePrice) / parseFloat(factor || 1);

    [1, 2, 3].forEach(index => {
        const salePrice = hasTemp
            ? parseFloat(data[`new_sale_price_${index}`] || 0)
            : parseFloat(data[`sale_price_${index}`] || 0);

        let margin = 0;
        if (salePrice > 0 && unitCost > 0) {
            margin = calculateMarginFromSalePrice(unitCost, salePrice);
            if (isNaN(margin) || !isFinite(margin)) margin = 0;
        }

        const $el = $(`${PRODUCT_CONFIG.classes.marginPrefix}${index}`);
        if ($el.length) $el.text(margin ? `${margin}%` : '0%');
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
    if ($.fn.DataTable.isDataTable('#tableProducts')) {
        productsTable = $('#tableProducts').DataTable();
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

    // Vincular edición usando la instancia recién creada
    _bindEditProductRows(productsTable);

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
// EVENTOS DE CÁLCULO
// =========================================

/**
 * Agrupa todos los eventos relacionados a cálculos de precio/margen/descuento.
 * Se ejecutan en el modal de detalle del producto.
 */
function bindCalculationEvents() {
    const sel = PRODUCT_CONFIG.selectors;
    const cls = PRODUCT_CONFIG.classes;

    // Cambio en cualquier precio de venta → recalcular margen de esa fila
    $(document).on('input', cls.priceSale, function () {
        const index = $(this).data('index');
        const salePrice = parseFloat($(this).val());
        const unitPrice = parseFloat($(sel.newPriceUnit).val());
        const margin = calculateMarginFromSalePrice(unitPrice, salePrice);

        $(`${cls.marginPrefix}${index}`).text(isNaN(margin) ? '0%' : `${margin}%`);
    });

    // Cambio en costo o factor → recalcular precio unitario, márgenes y descuento
    $(document).on('input', `${sel.cost}, ${sel.newFactor}`, function () {
        const costPrice = parseFloat($(sel.cost).val()) || 0;
        const factor = parseFloat($(sel.newFactor).val()) || 1;
        const unitPrice = calculateUnitPrice(costPrice, factor);

        $(sel.newPriceUnit).val(unitPrice);

        // Recalcular margen para cada precio de venta
        $(cls.priceSale).each(function () {
            const index = $(this).data('index');
            const salePrice = parseFloat($(this).val());
            const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
            $(`${cls.marginPrefix}${index}`).text(isNaN(margin) ? '0%' : `${margin}%`);
        });

        // Recalcular descuento en pesos según porcentaje actual
        const discountPct = parseFloat($(sel.discountPercentage).val()) || 0;
        const discountAmt = (costPrice * (discountPct / 100)).toFixed(2);
        $(sel.discountNumber).val(discountAmt);
    });

    // Porcentaje de descuento → calcular monto
    $(document).on('input', sel.discountPercentage, function () {
        const pct = parseFloat($(this).val()) || 0;
        const costPrice = parseFloat($(sel.cost).val()) || 0;
        $(sel.discountNumber).val((costPrice * (pct / 100)).toFixed(2));
    });

    // Monto de descuento → calcular porcentaje
    $(document).on('input', sel.discountNumber, function () {
        const amt = parseFloat($(this).val()) || 0;
        const costPrice = parseFloat($(sel.cost).val()) || 0;
        const pct = costPrice > 0 ? ((amt / costPrice) * 100).toFixed(2) : '0.00';
        $(sel.discountPercentage).val(pct);
    });
}

// =========================================
// EVENTOS DE INTERACCIÓN
// =========================================

function bindProductEvents() {
    const sel = PRODUCT_CONFIG.selectors;

    // Cambio en #product_id → abrir modal detalle con datos del producto
    $(sel.productId).on('change', function () {
        const productId = $(this).val();
        if (productId) {
            $(sel.modalDetails).modal('show');
            getDataProduct(productId);
        }
    });

    // Botón buscar producto → abrir modal listado
    $(sel.btnSearch).on('click', () => {
        $(sel.modalProductsList).modal('show');
    });

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

    // Submit formulario de detalle (agregar / editar producto en compra)
    $(sel.formDetails).off('submit').on('submit', function (e) {
        e.preventDefault();
        $(PRODUCT_CONFIG.classes.factor).prop('disabled', false);

        const detailId = $(sel.tempId).val();
        const isEdit = detailId != 0;
        const quantity = parseFloat($(sel.quantity).val());

        if (!quantity || quantity <= 0) {
            showAlert('warning', 'Validación', CONFIG.messages.quantityRequired);
            $(sel.quantity).trigger('focus');
            return;
        }

        const formData = $(this).serialize();
        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/temp_purchases_detail/${detailId}` : '/temp_purchases_detail/add',
            method: isEdit ? 'PUT' : 'POST',
            data: formData,
            success: (response) => {
                if (response.temp_purchase_id) {
                    $('#temp_purchase_id').val(response.temp_purchase_id);
                }

                // Notificar a detailModule para que recargue totales y tabla
                const totals = isEdit ? response.totals : response;
                $(document).trigger('purchases:productSaved', [totals]);

                $(sel.modalDetails).modal('hide');
                $(sel.tempId).val(0);
                $(PRODUCT_CONFIG.classes.factor).prop('disabled', false);
            },
            error: (xhr) => handleValidationError(xhr)
        });
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
                selectDepartmet(response.department, '.departments');
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

// =========================================
// ESCUCHAR EVENTOS DESDE detailModule
// =========================================

/**
 * detailModule dispara 'purchases:showProductDetail' cuando necesita
 * mostrar el modal de detalle desde la tabla temporal (edición / dblclick).
 * Así evitamos importación circular entre ambos módulos.
 */
function listenDetailEvents() {
    $(document).on('purchases:showProductDetail', (e, data, isEdit) => {
        showProductDetailModal(data, isEdit);
    });

    /**
     * detailModule escucha 'purchases:productSaved' para recargar
     * la tabla temporal y los totales después de guardar el formulario.
     * (El evento se dispara en el submit de arriba)
     */
}

// =========================================
// EDICIÓN DE PRODUCTOS DESDE TABLA LISTADO
// =========================================

/**
 * Vincula el botón editar (.btn-edit-product) a la instancia del DataTable.
 * Se llama cada vez que se reinicia el DataTable para usar la instancia correcta.
 *
 * @param {DataTable} tableInstance
 */
function _bindEditProductRows(tableInstance) {
    // Remover listener previo para no acumularlos
    $(`${PRODUCT_CONFIG.selectors.tableProducts} tbody`)
        .off('click.editProduct')
        .on('click.editProduct', PRODUCT_CONFIG.selectors.btnEditProduct, function () {
            const rowData = tableInstance.row($(this).closest('tr')).data();

            if (!rowData) {
                showAlert('error', 'Error', 'No se pudieron obtener los datos del producto.');
                return;
            }

            showConfirmationAlert(
                '¿Estás seguro?',
                'Editar este registro.',
                'Sí, editar',
                'Cancelar',
                (confirmed) => {
                    if (!confirmed) return;

                    showProductsModal({ id: rowData.id })
                        .then((response) => {
                            if (response?.status === 'success') {
                                _fillProductForm(response.data);
                            } else {
                                showAlert('error', 'Error', response?.message || 'Error al cargar datos.');
                            }
                        })
                        .catch(() => {
                            showAlert('error', 'Error', 'No se pudo cargar el formulario del producto.');
                        });
                }
            );
        });
}

/**
 * Rellena el formulario del modal de producto con los datos recibidos.
 * Extraído de PurchasesHelper.bindEditProduct para centralizar aquí.
 *
 * @param {Object} data - Datos del producto
 */
function _fillProductForm(data) {
    $('#product_name').val(data.product_name);
    $('#barcode').val(data.barcode);
    $('.products_departments').val(data.department_id).trigger('change');
    $('.products_categories').val(data.category_id).trigger('change');
    $('.purchase_unit').val(data.purchase_unit_id).trigger('change');
    $('.sale_unit').val(data.sale_unit_id).trigger('change');
    $('#conversion_factor').val(data.conversion_factor);
    $('#purchase_price').val(data.purchase_price);
    $('#price_iva').val(data.purchase_price);
    $('#stock').val(data.stock);
    $('#stock_min').val(data.stock_min);
    $('#stock_max').val(data.stock_max);
    $('#sale_price_1').val(data.sale_price_1);
    $('#price_1_min_qty').val(data.price_1_min_qty);
    $('#sale_price_2').val(data.sale_price_2);
    $('#price_2_min_qty').val(data.price_2_min_qty);
    $('#sale_price_3').val(data.sale_price_3);
    $('#price_3_min_qty').val(data.price_3_min_qty);
    $('#product_description').val(data.product_description);
    $('#is_fractional').prop('checked', data.is_fractional === 1);
    $('#iva').prop('checked', data.iva === 1);
    $('#neto').prop('checked', data.neto === 1);
    $('#is_service').prop('checked', data.is_service === 1);

    validateInputChecked(data.iva === 1, data.neto === 1);

    const unitPrice = parseFloat(data.unit_price) || calculateUnitPrice(data.purchase_price, data.conversion_factor);
    $('#unit_price').val(unitPrice.toFixed(2));

    [1, 2, 3].forEach(index => {
        const salePrice = parseFloat(data[`sale_price_${index}`]) || 0;
        const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
        $(`#margen_${index}`).val(margin);
    });
}

// =========================================
// HELPERS PRIVADOS
// =========================================

function closeModal(modalId) {
    $(modalId).modal('hide');
}
