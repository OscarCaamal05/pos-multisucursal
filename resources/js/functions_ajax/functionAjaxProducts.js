// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert } from './utils/alerts';
import { bindCategoryFormSubmit, closeCategoryModal, selectCategoryAndDept } from './helpers/categoryHelper';
import { bindDepartmentFormSubmit, closeDepartmentModal, selectDepartmet } from './helpers/departmentHelper';
import { bindProductFormSubmit, closeProductModal, showProductsModal } from './helpers/productHelper';

// =========================================
// VARIABLES GLOBALES
// =========================================

let productsTable = null;

// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    initializeSelect2();
    closeDepartmentModal();
    closeCategoryModal();
    closeProductModal();
    bindEditEvents();
    bindDeleteEvents();
    bindToggleStatusEvents();
    // =========================================
    // Inicializando la funcion para crear o actualizar la categoria
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindCategoryFormSubmit({
        onSuccess: (response) => {
            // Se crea una nueva categoria y agrega al <select> y se autoselecciona
            if (response.status === 'create' && response.category) {
                selectCategoryAndDept(response.category, '.products_categories', '.products_departments')
            }
        }
    });

    // =========================================
    // Inicializando la funcion para crear o actualizar la el departamento
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindDepartmentFormSubmit({
        onSuccess: (response) => {
            //Auto completa el select del modal de categorias cuando el registro se crea desde la vista de categoria
            if (response.status === 'create' && response.department) {
                selectDepartmet(response.department, '.departments');
            }
        }
    });

    // =========================================
    // Inicializando la funcion para crear o actualizar la el departamento
    // =========================================
    /**
     * Recibe parametros del modulo, el form, modal, tabla, y una funcion callback para realizar funciones adicionales
     */
    bindProductFormSubmit({
        table: productsTable,
    });

    // =========================================
    // EVENTO: Abrir el modal de categorias
    // =========================================
    /**
     * Muestra el modal de categorias para crear una nueva categoria desde el modal de producto
     */
    $('#btn-modal-category').on('click', function (e) {
        e.preventDefault();
        $('#categoryModal').modal('show');
        $('.departments').select2({
            dropdownParent: $('#categoryModal'),
        });
    })

    // =========================================
    // EVENTO: Click en el boton dentro del modal de categoria
    // =========================================
    /**
     * Abre el modal de departamento desde el modal de categoria para agregar un nuevo departamento 
     */
    $('#btn-modal-department').on('click', function (e) {
        e.preventDefault();
        $('#departmentModal').modal('show');
    });

    selectUnits();

    // Escucha el cambio de unidades de compra y venta para actualizar el texto de las unidades
    $('#purchase_unit_id, #sale_unit_id').on('change', selectUnits);

    // Escucha el cambio de unidades de compra y venta para calcular el precio unitario
    $('#purchase_price, #conversion_factor').on('input', function () {

        const purchase_price = parseFloat($('#purchase_price').val());
        const conversionFactor = parseFloat($('#conversion_factor').val());
        $('#price_iva').val(purchase_price.toFixed(2));
        const unitPrice = calculateUnitPrice(purchase_price, conversionFactor)
        $('#unit_price').val(unitPrice);
    })

    // Escucha todos los márgenes dinámicamente
    $('.margin-input').on('input', function () {
        const index = $(this).data('index');
        const margin = $(this).val();
        const unitPrice = $('#unit_price').val();
        const targetSalePrice = $(`#sale_price_${index}`);

        const price = calculateSalePriceFromMargin(unitPrice, margin);
        targetSalePrice.val(price);
    });

    // Escucha todos los precios de venta dinámicamente
    $('.sale-price-input').on('input', function () {
        const index = $(this).data('index');
        const salePrice = $(this).val();
        const unitPrice = $('#unit_price').val();
        const targetMargin = $(`#margen_${index}`);

        const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
        targetMargin.val(margin);
    });

    let chkIvaSelec = false;
    let chkNetoSelec = true;
    // Escucha los cambios en los checkboxes de IVA y Neto
    $('#iva, #neto').on('change', function () {
        // Verificando cuál check está seleccionado
        if ($(this).attr('id') === 'iva') {
            chkIvaSelec = $(this).is(":checked");
        } else if ($(this).attr('id') === 'neto') {
            chkNetoSelec = $(this).is(":checked");
        }
        validateInputChecked(chkIvaSelec, chkNetoSelec);
    })
    /**
     * Escucha el cambio del select de categoría para actualizar automaticamente el select de departamento asociado a la categoria seleccionada.
     */
    $('#product_category_id').on('change', function () {
        const selectedOption = $(this).find(':selected');
        const departmentId = selectedOption.data('department-id');
        if (departmentId) {
            // Si hay un departamento, actualiza el select de departamento
            $('#product_department_id').val(departmentId).trigger('change');
        }
    });

})

function initializeDataTable() {
    productsTable = $('#productsTable').DataTable({
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
                    data-product-id="${row.id}"
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
            <a href="javascript:void(0);" class="link-warning btn-edit-product" data-id="${data}">
                <i class="ri-edit-2-line"></i>
            </a>
            <a href="javascript:void(0);" class="link-danger btn-delete-product" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Vincula evento de edición
// =========================================

/**
 * Asocia el evento de edición de productos.
 */
function bindEditEvents() {
    $('#productsTable tbody').on('click', '.btn-edit-product', function () {
        const $button = $(this);
        const rowData = productsTable.row($button.closest('tr')).data();

        showConfirmationAlert(
            '¿Estás seguro?',
            'Editar este registro.',
            'Sí, editar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    showProductsModal({ id: rowData.id })
                        .then((response) => {
                            if (response.status === 'success') {
                                $('#product_name').val(response.data.product_name);
                                $('#barcode').val(response.data.barcode);
                                $('.products_departments').val(response.data.department_id).trigger('change');
                                $('.products_categories').val(response.data.category_id).trigger('change');
                                $('.purchase_unit').val(response.data.purchase_unit_id).trigger('change');
                                $('.sale_unit').val(response.data.sale_unit_id).trigger('change');
                                $('#conversion_factor').val(response.data.conversion_factor);
                                $('#purchase_price').val(response.data.purchase_price);
                                $('#price_iva').val(response.data.purchase_price);
                                $('#stock').val(response.data.stock);
                                $('#stock_min').val(response.data.stock_min);
                                $('#stock_max').val(response.data.stock_max);
                                $('#sale_price_1').val(response.data.sale_price_1);
                                $('#price_1_min_qty').val(response.data.price_1_min_qty);
                                $('#sale_price_2').val(response.data.sale_price_2);
                                $('#price_2_min_qty').val(response.data.price_2_min_qty);
                                $('#sale_price_3').val(response.data.sale_price_3);
                                $('#price_3_min_qty').val(response.data.price_3_min_qty);
                                $('#product_description').val(response.data.product_description);
                                $('#is_fractional').prop('checked', response.data.is_fractional === 1);
                                $('#iva').prop('checked', response.data.iva === 1);
                                $('#neto').prop('checked', response.data.neto === 1);
                                $('#is_service').prop('checked', response.data.is_service === 1);

                                validateInputChecked(response.data.iva === 1, response.data.neto === 1);

                                calculateUnitPrice(response.data.purchase_price, response.data.conversion_factor);
                                const unitPrice = parseFloat(response.data.unit_price); // asegurarte de que sea número
                                $('#unit_price').val(unitPrice.toFixed(2));

                                [1, 2, 3].forEach(index => {
                                    const salePrice = parseFloat(response.data[`sale_price_${index}`]);

                                    const margin = calculateMarginFromSalePrice(unitPrice, salePrice);

                                    $(`#margen_${index}`).val(margin); // solo mostrar el margen
                                });

                            } else {
                                showAlert('error', 'Error', response.message);
                            }
                        })
                        .catch((error) => {
                            showAlert('error', 'Error', error);
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
 * Asocia el evento de eliminación de productos.
 */
function bindDeleteEvents() {
    $('#productsTable tbody').on('click', '.btn-delete-product', function () {
        const productId = $(this).data('id');

        showConfirmationAlert(
            '¿Estás seguro?',
            '¡No podrás revertir esta acción!',
            'Sí, eliminar',
            'Cancelar',
            (confirmed) => {
                if (confirmed) {
                    $.ajax({
                        url: `/products/${productId}`,
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
                            productsTable.ajax.reload(null, false);
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
 * Asocia el evento de activación/desactivación del estado del producto.
 */
function bindToggleStatusEvents() {
    $(document).on('change', '.toggle-status', function () {
        const productId = $(this).data('product-id');
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
                    updateProductStatus(productId, newStatus);
                } else {
                    $switch.prop('checked', !newStatus);
                }
            }
        );
    });
}

// =========================================
// FUNCIÓN: Actualiza el estado de la categoría
// =========================================

/**
 * Envía la solicitud AJAX para actualizar el estado activo/inactivo.
 *
 * @param {number} productId
 * @param {number} status
 */
function updateProductStatus(productId, status) {
    $.ajax({
        url: `/products/${productId}/status`,
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
            productsTable.ajax.reload(null, false);
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

function initializeSelect2() {
    $('.products_departments').select2({
        dropdownParent: $('#productsModal'),
    });
    $('.products_categories').select2({
        dropdownParent: $('#productsModal'),
    });
}

// =========================================
// FUNCIÓN: Para validar las unidades de compra y venta selecionadas
// =========================================

/**
 * Para marcar la unidad de compra y venta validando si son iguales o no.
 */
function selectUnits() {
    const $purchaseUnit = $('#purchase_unit_id');
    const $saleUnit = $('#sale_unit_id');
    const $conversionFactor = $('#conversion_factor');

    // Obtiene el valor y texto de una unidad de compra seleccionada
    const purchaseUnitValue = $purchaseUnit.val();
    const purchaseUnitText = $purchaseUnit.find('option:selected').text();

    // Obtiene el valor y texto de una unidad de venta seleccionada
    const saleUnitValue = $saleUnit.val();
    const saleUnitText = $saleUnit.find('option:selected').text();

    const isSameUnit = purchaseUnitValue === saleUnitValue;
    const isZeroValue = purchaseUnitValue == 0 || saleUnitValue == 0;

    if (isSameUnit || isZeroValue) {
        // Si las unidades son iguales o una de ellas es cero, deshabilita el factor de conversión
        $conversionFactor.val(1).prop('disabled', true);
    } else {
        // Si las unidades son diferentes y ninguna es cero, habilita el factor de conversión
        $conversionFactor.prop('disabled', false);
    }

    $('.purchase_unit_text').text(`X ${purchaseUnitText}`);
    $('.sale_unit_text').text(`X ${saleUnitText}`);
}

// =========================================
// FUNCIÓN: Calcular el precio unitario 
// =========================================

/**
 * Calcula el precio de unitario del producto dependiendo del factor de compra.
 * @param {number} purchasePrice
 * @param {number} conversionFactor
 */
export function calculateUnitPrice(purchasePrice, conversionFactor) {
    const price = parseFloat(purchasePrice);
    const factor = parseFloat(conversionFactor);
    // Valida que los precios sean números e igual a cero
    if (isNaN(price) || isNaN(factor) || factor === 0) {
        $('#unit_price').val('0.00');
        return;
    }

    const unitPrice = (price / factor).toFixed(2);
    return unitPrice;

}

// =========================================
// FUNCIÓN: Calcula el precio de venta dependiendo del margen
// =========================================

/**
 * Calcula el precio de venta en función del precio unitario y el porcentaje de margen de beneficio.
 * @param {number} unitPrice
 * @param {number} profitMargin
 */
export function calculateSalePriceFromMargin(unitPrice, margin) {
    const price = parseFloat(unitPrice);
    const profitMargin = parseFloat(margin);
    // Valida que los precios sean números y mayores a cero
    if (isNaN(price) || isNaN(profitMargin) || price <= 0) {
        return '';
    }

    const profit = price * (profitMargin / 100);
    return (price + profit).toFixed(2);
}

// =========================================
// FUNCIÓN: Calcula el margen dependiendo del precio de venta
// =========================================

/**
 * Calcula el margen de beneficio (%) en función del precio unitario y el precio de venta.
 * @param {number} unitPrice
 * @param {number} salePrice
 */
export function calculateMarginFromSalePrice(unitPrice, salePrice) {
    const price = parseFloat(unitPrice);
    const sale = parseFloat(salePrice);
    // Valida que los precios sean números y mayores a cero
    if (isNaN(price) || isNaN(sale) || price <= 0) {
        return '';
    }

    const margin = ((sale - price) / price * 100);
    return margin.toFixed(3);
}

// =========================================
// FUNCIÓN: Recalcula el precio de compra y unitario sin iva
// =========================================

/**
 * Valida los inputs de IVA y Neto seleccionados y actualiza los precios sin iva a los campos correspondientes.
 *
 * @param {boolean} chkIvaSelec
 * @param {boolean} chkNetoSelec
 */
function validateInputChecked(chkIvaSelec, chkNetoSelec) {
    const price = parseFloat($('#purchase_price').val()) || 0;
    const unitPrice = parseFloat($('#unit_price').val()) || 0;
    const conversionFactor = parseFloat($('#conversion_factor').val()) || 1;
    const iva = parseFloat($('#iva').attr('data-iva')) || 0;
    // Función auxiliar para calcular precio sin IVA
    const removeIva = (amount) => (amount / (1 + (iva / 100)));
    let finalPrice = price;
    let finalUnitPrice = calculateUnitPrice(price, conversionFactor);

    if (chkIvaSelec && chkNetoSelec) {
        // Ambos seleccionados: mostrar precios sin IVA
        finalPrice = removeIva(price);
        finalUnitPrice = removeIva(unitPrice);
    } else if (chkIvaSelec || chkNetoSelec) {
        // Solo uno seleccionado: mostrar precios con IVA (originales)
        // finalPrice y finalUnitPrice ya están calculados arriba
    }

    $('#price_iva').val(finalPrice.toFixed(2));
    $('#unit_price').val(Number(finalUnitPrice).toFixed(2));

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
