import { showAlert, clearValidationErrors, handleValidationError } from '../../utils/alerts';
import { calculateUnitPrice, calculateMarginFromSalePrice } from '../../functionAjaxProducts';
import { SALES_CONFIG, productsTable } from './saleMain';
import { closeDepartmentModal, bindDepartmentFormSubmit, selectDepartmet } from '../../helpers/departmentHelper';
import { closeCategoryModal, bindCategoryFormSubmit, selectCategoryAndDept } from '../../helpers/categoryHelper';
import { closeProductModal, bindProductFormSubmit } from '../../helpers/productHelper';
import {
    bindEditProduct,
} from '../../helpers/PurchasesHelper';

// =========================================
// CONFIGURACIÓN ESPECÍFICA DEL MÓDULO
// =========================================
const PRODUCT_MODULE_CONFIG = {
    selectors: {
        autoCompleteProduct: '#auto_complete_product',
        productId: '#product_id',
        modalProductDetails: '#modal-product-details',
        modalProductsList: '#modal-products',
        modalAddProduct: '#add-modal-product',
        tableProducts: '#tableProducts',
        formProductDetails: '#productDetails',
        searchInput: '#searchArticleInput',
        tempId: '#temp_id',
        quantity: '#quantity',
        cost: '#cost',
        discountNumber: '#discount-number',
        discountPercentage: '#discount-percentage',
        newFactor: '#new-factor'
    },
    classes: {
        noResult: 'autoComplete_result',
        priceSale: '.price-sale',
        marginClass: '.margin-',
        autoSelect: '.auto-select'
    }
};

// =========================================
// VARIABLES LOCALES DEL MÓDULO
// =========================================
let autoCompleteProducts = null;
let productTable = null;
let tableDetails = null;
let lastProcessedProductId = null; // Almacena el ID del último producto procesado
let isProcessing = false; // Bandera para evitar múltiples solicitudes simultáneas al elegir un producto en el autocompletado

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================
export function initProductModule() {
    try {
        // Evitar inicialización múltiple
        if (tableDetails !== null) {
            console.log('⚠️ Módulo de productos ya inicializado');
            return;
        }

        setupProductAutoComplete();
        //loadTableDetails();
        bindProductEvents();
        /*
        bindCalculationEvents();
        bindFormEvents();*/
        console.log('✅ Módulo de productos inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de productos:', error);
    }
}

// =========================================
// AUTOCOMPLETADO DE PRODUCTOS
// =========================================
function setupProductAutoComplete() {
    const products = new autoComplete({
        selector: PRODUCT_MODULE_CONFIG.selectors.autoCompleteProduct,
        data: {
            src: async (query) => {
                try {
                    const response = await searchProducts(query);
                    return response.data;
                } catch (error) {
                    console.error('Error en búsqueda de productos:', error);
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
                    message.setAttribute("class", PRODUCT_MODULE_CONFIG.classes.noResult);
                    message.innerHTML = `<span>No se encontraron productos para "${data.query}"</span>`;
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

                    // Prevenir múltiples solicitudes
                    if (isProcessing) {
                        return
                    }
                    isProcessing = true;

                    try {
                        const selection = event.detail.selection;
                        const selectedText = typeof selection.value === 'string'
                            ? selection.value
                            : (selection.value?.value || '');

                        products.input.value = selectedText;
                        products.input.select();
                        addProductDetail(selection.value.id);
                    } catch (error) {
                        console.error('❌ Error al procesar selección de producto:', error);
                    } finally {
                        // Resetear el flag después de un delay
                        setTimeout(() => {
                            isProcessing = false;
                            //console.log('🔄 Procesamiento completado');
                        }, 1000); // 1 segundo de delay
                    }

                    //$(PRODUCT_MODULE_CONFIG.selectors.productId).val(selection.value.id).trigger('change');
                }
            }
        }
    });
}

// =========================================
// EVENTOS DEL MÓDULO
// =========================================

function bindProductEvents() {
    /*
    $(PRODUCT_MODULE_CONFIG.selectors.productId).on('change', function () {
        const productId = $(this).val();
        addProductDetail(productId);
    });*/

    /**
     * Abrir el modal para buscar producto en la tabla de productos
     */
    $('#btn-search-product').on('click', function () {
        $(PRODUCT_MODULE_CONFIG.selectors.modalProductsList).modal('show');
        loadProductsList();
    });

    /**
     * Elegir un producto de la tabla del listado
     */
    $('#tableProducts tbody').on('dblclick', 'tr', function (e) {
        e.preventDefault();

        if (isProcessing) {
            return;
        }
        const data = productTable.row(this).data();

        if (data && data.id) {
            // Verificar si es el mismo producto que se procesó recientemente
            if (lastProcessedProductId === data.id) {
                console.log('🚫 Mismo producto recién procesado, ignorando');
                return;
            }

            // Establecer flags de control
            isProcessing = true;
            lastProcessedProductId = data.id;

            try {
                // Ocultar modal inmediatamente
                $(PRODUCT_MODULE_CONFIG.selectors.modalProductsList).modal('hide');

                // Procesar después de que se cierre el modal
                setTimeout(() => {
                    addProductDetail(data.id);
                }, 200); // Delay para asegurar que el modal se cierre

            } catch (error) {
                console.error('❌ Error al procesar doble clic:', error);
            }
        }
    });

    /**
     * Agregar nuevos productos al inventario desde la tabla de productos
     */
    $('#btn-add-article').on('click', function () {
        $(PRODUCT_MODULE_CONFIG.selectors.modalAddProduct).modal('show');
        $(PRODUCT_MODULE_CONFIG.selectors.modalAddProduct).on('shown.bs.modal', function () {

        });
    });

    bindProductFormSubmit({
        table: productsTable,
        onSuccess: (response) => {
            if (response.status === 'create') {
                addProductDetail(response.product.id);
                $(PRODUCT_MODULE_CONFIG.selectors.modalAddProduct).modal('hide');
            }
        }
    });

    // ========================================================================================================
    // * FUNCIONES PARA EL FORM PARA AGREGAR DEPARTAMENTOS *
    // ========================================================================================================
    bindDepartmentFormSubmit({
        onSuccess: (response) => {
            //Auto completa el select del modal de categorias cuando el registro se crea desde la vista de categoria
            if (response.status === 'create' && response.department) {
                selectDepartmet(response.department, '.departments');
            }
        }
    });

    // ========================================================================================================
    // * FUNCIONES PARA EL FORM PARA AGREGAR CATEGORÍAS *
    // ========================================================================================================
    bindCategoryFormSubmit({
        onSuccess: (response) => {
            // Se crea una nueva categoria y agrega al <select> y se autoselecciona
            if (response.status === 'create' && response.category) {
                selectCategoryAndDept(response.category, '.products_categories', '.products_departments')
            }
        }
    });

    /**
     * Eventos para cerrar los modales
     */
    $('#btn-close-product').on('click', () => closeModal(PRODUCT_MODULE_CONFIG.selectors.modalProductsList));
    closeCategoryModal();
    closeDepartmentModal();
    closeProductModal();
    $(PRODUCT_MODULE_CONFIG.selectors.modalAddProduct).on('shown.bs.modal', function () {
        initializeSelect2Elements();
    });
    $(PRODUCT_MODULE_CONFIG.selectors.modalAddProduct).on('hidden.bs.modal', function () {
        $('.select2-container').remove();
    });
}

// =========================================
// NUEVA FUNCIÓN: Inicializar elementos Select2
// =========================================
function initializeSelect2Elements() {
    try {
        // Destruir Select2 existentes para evitar conflictos
        $('.select2-container').remove();

        // Inicializar Select2 para categorías
        if ($('.products_categories').length) {
            $('.products_categories').select2({
                dropdownParent: $('#add-modal-product'),
            });
        }

        // Inicializar Select2 para departamentos
        if ($('.products_departments').length) {
            $('.products_departments').select2({
                dropdownParent: $('#add-modal-product'),
            });
        }

        // Inicializar Select2 para unidades
        if ($('.purchase_unit, .sale_unit').length) {
            $('.purchase_unit, .sale_unit').select2({
                dropdownParent: $('#add-modal-product'),
            });
        }

        console.log('✅ Elementos Select2 inicializados');

    } catch (error) {
        console.error('❌ Error al inicializar Select2:', error);
    }
}

// ============================================================
// GESTIÓN DE PRODUCTOS
// ============================================================

/**
 * Envia el ID del producto seleccionado para agregarlo al detalle de la venta
 * 
 * @param {number} productId - id del producto seleccionado
 */
export function addProductDetail(productId) {
    try {
        $.ajax({
            url: `${SALES_CONFIG.api.base}/addProductToSalesDetails`,
            type: 'POST',
            dataType: 'json',
            data: {
                product_id: productId,
                temp_sale_id: $('#temp_sale_id').val(),
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                console.log(response);
                if (response.success) {
                    // Recargar la tabla si existe
                    if (tableDetails && $.fn.DataTable.isDataTable('#tableTempSale')) {
                        tableDetails.ajax.reload(null, false);
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('❌ Error al agregar producto:', error);
                showAlert('error', 'Error', 'No se pudo agregar el producto');
            }
        });
    } catch (error) {
        console.error('❌ Error al agregar producto al detalle de venta:', error);
    }
}

// =========================================
// FUNCIONES AUXILIARES
// =========================================

/**
 * Envia la cadena introducida en el campo de búsqueda de productos
 * 
 * @param {string} query - Cadena de búsqueda introducida por el usuario
 */
async function searchProducts(query) {
    return $.ajax({
        url: `${SALES_CONFIG.api.base}/autoCompleteProducts/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

/**
 * Cierra un modal específico
 * @param {string} modalId - ID del modal a cerrar
 */
export function closeModal(modalId) {
    $(modalId).modal('hide');
}

// =================================================================================
// FUNCIÓN: Carga los datos de los productos en la tabla dentro del modal para busqueda
// profunda
// =================================================================================
function loadProductsList() {
    if ($.fn.DataTable.isDataTable('#tableProducts')) {
        $('#tableProducts').DataTable().destroy();
        $('#tableProducts tbody').empty();
    }

    productTable = $('#tableProducts').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/products/data',
        columns: [
            { data: 'id', name: 'id' },
            { data: 'product_name', name: 'product_name' },
            {
                data: 'barcode',
                name: 'barcode',
                orderable: false,
                searchable: false
            },
            {
                data: 'category_name',
                name: 'category_name',
                className: 'text-center',
            },
            {
                data: 'department_name',
                name: 'department_name',
                className: 'text-center',
            },
            {
                data: 'sale_price_1',
                name: 'sale_price_1',
                orderable: false,
                searchable: false,
                className: 'text-end',
            },
            {
                data: 'stock',
                name: 'stock',
                orderable: false,
                searchable: false,
                className: 'text-end',
            },
            {
                data: 'sale_unit_name',
                name: 'sale_unit_name',
                searchable: false,
                className: 'text-center',
            },
            {
                data: 'id',
                name: 'actions',
                orderable: false,
                searchable: false,
                render: renderActionsColumnProduct,
            },
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        searching: true,
        info: false,
        dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>><"clear">',
    });

    // Vincular eventos de edición ahora que la tabla está inicializada
    bindEditProduct(productTable);

    // Agregar funcionalidad al input personalizado de búsqueda
    $('#searchArticleInput').off('keyup.articleSearch').on('keyup.articleSearch', function () {
        const searchValue = $(this).val();
        productTable.search(searchValue).draw();
    });

    // Limpiar el input cuando se abra el modal
    $('#modal-products').on('shown.bs.modal', function () {
        $('#searchArticleInput').val('').trigger('keyup');
    });
}

// ============================================================
// FUNCIONE PARA RENDERIZAR LA COLUMNA DE ACCIONES EN LA TABLA DE PRODUCTOS
// ============================================================

/**
 * Renderiza los botones de acciones (editar)
 * @param {any} data - ID del elemento
 * @returns {string} HTML renderizado
 */
function renderActionsColumnProduct(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-warning btn-edit-product" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
        </div>
    `;
}

// ============================================================
// FUNCIONE PARA TRADUCIR LOS TEXTOS DE LA TABLA DE PRODUCTOS
// ============================================================
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

// ============================================================
// FUNCIONE PARA TRADUCIR LOS TEXTOS DE LA TABLA DE PRODUCTOS
// ============================================================