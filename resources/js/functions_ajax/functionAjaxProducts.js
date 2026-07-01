// =========================================
// IMPORTACION DE FUNCIONES GENERICAS PARA LAS ALERTAS
// =========================================
import { showAlert, showConfirmationAlert } from './utils/alerts';
import { bindCategoryFormSubmit, closeCategoryModal, selectCategoryAndDept } from './helpers/categoryHelper';
import { bindDepartmentFormSubmit, closeDepartmentModal, selectDepartmet } from './helpers/departmentHelper';
import { bindProductFormSubmit, closeProductModal, showProductsModal } from './helpers/productHelper';
import flatpickr from 'flatpickr';
import { initFilePond, destroyFilePond, getFilePondFile, loadFilePondImage, clearFilePondFiles } from './utils/filePondManager';

// =========================================
// VARIABLES GLOBALES
// =========================================

let productsTable = null;
let productFilePond = null;
let filePondInitialized = false;
let pendingProductImage = null;
let imageLoadTimeout = null; // Para cancelar el setTimeout si se cierra el modal
// =========================================
// INICIALIZACIÓN PRINCIPAL
// =========================================
$(document).ready(function () {
    initializeDataTable();
    initializeSelect2();
    closeDepartmentModal();
    closeCategoryModal();
    closeProductModal();
    bindAjustInventoryEvents();
    bindEditEvents();
    bindDeleteEvents();
    bindToggleStatusEvents();
    //const inputElement = document.querySelector('#product-images-input');
    //initializeProductFilePond(inputElement);
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
        e.stopPropagation();
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
        e.stopPropagation();
        e.preventDefault();
        $('#departmentModal').modal('show');
    });

    selectUnits();

    // Escucha el cambio de unidades de compra y venta para actualizar el texto de las unidades
    $('#purchase_unit_id, #sale_unit_id').on('change', selectUnits);

    // Escucha el cambio de unidades de compra y venta para calcular el precio unitario
    $('#purchase_price, #conversion_factor, #purchase_unit_id, #sale_unit_id').on('input change', function () {

        const purchase_price = parseFloat($('#purchase_price').val());
        const conversionFactor = parseFloat($('#conversion_factor').val());

        // Guardar el precio base cuando el usuario modifica purchase_price
        if ($(this).attr('id') === 'purchase_price') {
            $('#purchase_price').data('base-price', purchase_price);
        }

        $('#price_iva').val(purchase_price.toFixed(2));
        const unitPrice = calculateUnitPrice(purchase_price, conversionFactor)
        $('#unit_price').val(unitPrice);

        // Recalcular con los impuestos actuales
        validateInputChecked();
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

    $(document).on('change', 'input[name="taxes[]"], #is_net_price', function () {
        validateInputChecked();
    });

    /**
     * Escucha el cambio del select de categoría para actualizar automaticamente el select de departamento asociado a la categoria seleccionada.
     */
    $('.products_categories').on('change', function () {
        const selectedOption = $(this).find(':selected');
        const departmentId = selectedOption.data('department-id');
        if (departmentId) {
            // Si hay un departamento, actualiza el select de departamento
            $('.products_departments').val(departmentId).trigger('change');
        }
    });

    // Escucha los cambios en los checkboxes de impuestos dinámicos
    $(document).on('change', 'input[name="taxes[]"], #neto', function () {
        validateInputChecked();
    });

    flatpickr('#expiry_date', {
        minDate: new Date().fp_incr(1), // Establece la fecha mínima como mañana
        dateFormat: 'Y-m-d', // Formato de fecha para enviar al backend
        altInput: true,
        altFormat: 'd M, Y', // Formato de fecha para mostrar al usuario
    });
    $('#expiry_date').on('change', function () {
        const selectedData = new Date($(this).val());
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Establece la hora a medianoche para comparar solo fechas
        selectedData.setHours(0, 0, 0, 0); // Establece la hora a medianoche para comparar solo fechas
        if (selectedData < currentDate) {
            showAlert('error', 'Error', 'La fecha de caducidad no puede ser anterior a la fecha actual.');
            $(this).val('');
        }

        const diffTime = selectedData - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Mostrar solo días positivos (futuro)
        if (diffDays >= 0) {
            $('#shelf_life_days').val(diffDays);
        } else {
            showAlert('error', 'Error', 'La fecha seleccionada es anterior a hoy');
        }

    });

    // Inicializar FilePond cuando se muestra el tab de Imagen
    $('a[href="#imageDetails"]').off('shown.bs.tab.filepond').on('shown.bs.tab.filepond', function () {
        if (!$('#productsModal').hasClass('show')) {
            return;
        }

        if (!filePondInitialized) {
            const pond = initFilePond(
                'product-main',
                '#product-images-input',
                {
                    removeInputSelector: '#remove_image',
                    onaddfile: (error, file) => {
                        if (!error) {
                            $('#remove_image').val('0');
                        }
                    }
                }
            );

            if (pond) {
                filePondInitialized = true;

                if (pendingProductImage) {
                    imageLoadTimeout = setTimeout(() => {
                        if (!$('#productsModal').hasClass('show')) {
                            return;
                        }
                        loadFilePondImage('product-main', pendingProductImage);
                        pendingProductImage = null;
                        imageLoadTimeout = null;
                    }, 150);
                }
            }
        }
    });

    // Destruir al cerrar el modal
    $('#productsModal').off('hidden.bs.modal.filepond').on('hidden.bs.modal.filepond', function () {
        if (imageLoadTimeout) {
            clearTimeout(imageLoadTimeout);
            imageLoadTimeout = null;
        }

        if (filePondInitialized) {
            destroyFilePond('product-main');
            filePondInitialized = false;
        }

        pendingProductImage = null;
    });

    // Si el modal se abre con el tab de imagen activo
    $('#productsModal').off('shown.bs.modal.filepond').on('shown.bs.modal.filepond', function () {
        if ($('#imageDetails').hasClass('active') && !filePondInitialized) {
            $('a[href="#imageDetails"]').trigger('shown.bs.tab');
        }
    });

});

function initializeDataTable() {
    productsTable = $('#productsTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: '/products/data',
            data: function (d) {
                d.department_id = $('#id-department-filter').val();
                d.category_id = $('#id-category-filter').val();
                d.status = $('#id-status-filter').val();
            }
        },
        columns: [
            { data: 'id', name: 'id' },
            { data: 'name', name: 'name' },
            {
                data: 'barcode',
                name: 'barcode',
                orderable: false,
            },
            {
                data: 'category_name',
                name: 'c.name',
                className: 'text-center',
                searchable: false,
            },
            {
                data: 'department_name',
                name: 'd.name',
                className: 'text-center',
                searchable: false,
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
                searchable: false,
                orderable: false,
            },
            {
                data: 'is_active',
                name: 'is_active',
                render: renderStatusColumn,
                orderable: false,
                searchable: false,
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
        dom: 'rt<"bottom row"<"col-sm-4"l><"col-sm-4 text-center d-flex justify-content-center"p><"col-sm-4 text-end"i>><"clear">',
    });

    // Búsqueda por input de texto
    $('#search-product-input').off('keyup.productSearch').on('keyup.productSearch', function () {
        const searchValue = $(this).val();
        productsTable.search(searchValue).draw();
    });

    // Filtro por departamento
    $('#id-department-filter').on('change', function () {
        productsTable.ajax.reload();
    });

    // Filtro por categoría
    $('#id-category-filter').on('change', function () {
        productsTable.ajax.reload();
    });

    // Filtro por status
    $('#id-status-filter').on('change', function () {
        productsTable.ajax.reload();
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
 * Renderiza los botones de acciones (ajustar, editar, eliminar).
 */
function renderActionsColumn(data) {
    return `
        <div class="hstack gap-2 fs-15 d-flex justify-content-center">
            <a href="javascript:void(0);" class="link-primary btn-adjust-product" data-id="${data}">
                <i class="ri-settings-4-line"></i>
            </a>
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
// FUNCIÓN: Vincula evento de ajuste de inventario
// =========================================

/**
 * Asocia el evento de ajuste de inventario.
 */

function bindAjustInventoryEvents() {

    $('#productsTable tbody').on('click', '.btn-adjust-product', function () {
        const $button = $(this);
        const rowData = productsTable.row($button.closest('tr')).data();

        $('#product-adjust-id').val(rowData.id);
        $('#name_product_adjustment').html(rowData.name);
        $('#current_stock_value').data('original-stock', rowData.stock);
        $('#current_stock_value').text(rowData.stock);

        $('#inventoryModal').modal('show');
    });

    /**
    * Evento para actualizar el stock actual con el nuevo stock dependiendo del tipo de ajuste      seleccionado (entrada, salida o ajuste)
    */
    $('#adjustment_type, #adjustment_quantity').on('change input', function () {
        const adjustmentType = $('#adjustment_type').val();
        const adjustmentQuantity = parseFloat($('#adjustment_quantity').val()) || 0;
        const originalStock = parseFloat($('#current_stock_value').data('original-stock')) || 0;

        let newStock = originalStock;
        switch (adjustmentType) {
            case 'entrada':
                newStock = originalStock + adjustmentQuantity;
                break;
            case 'salida':
                newStock = originalStock - adjustmentQuantity;
                if (newStock < 0) {
                    $('#current_stock_value').addClass('text-danger');
                    newStock = 0; // O mostrar mensaje de error
                } else {
                    $('#current_stock_value').removeClass('text-danger');
                }
                break;
            case 'ajuste':
                newStock = adjustmentQuantity;
                break;
        }

        $('#current_stock_value').text(newStock.toFixed(2));
    });

    // Accion para eviar los datos al controlador para realizar el registro de stock
    $('#btn-confirm-modal-inventory').on('click', function () {
        const adjustmentType = $('#adjustment_type').val();
        const adjustmentQuantity = parseFloat($('#adjustment_quantity').val()) || 0;
        const productId = $('#product-adjust-id').val();
        updateStock(adjustmentType, adjustmentQuantity, productId);
    });

    $('#btn-close-modal-inventory, #btn-cancel-modal-inventory').on('click', function () {
        $('#inventoryForm')[0].reset();
        $('#current_stock_value').removeClass('text-danger').text('');
        $('#inventoryModal').modal('hide');
    });
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
                                // Valores para inputs de texto en general
                                $('#name').val(response.data.name);
                                $('#barcode').val(response.data.barcode);
                                $('#conversion_factor').val(response.data.conversion_factor);
                                $('#purchase_price').val(response.data.purchase_price).data('base-price', response.data.purchase_price);
                                $('#price_iva').val(response.data.purchase_price);
                                $('#sale_price_1').val(response.data.sale_price_1);
                                $('#price_1_min_qty').val(response.data.price_1_min_qty);
                                $('#sale_price_2').val(response.data.sale_price_2);
                                $('#price_2_min_qty').val(response.data.price_2_min_qty);
                                $('#sale_price_3').val(response.data.sale_price_3);
                                $('#price_3_min_qty').val(response.data.price_3_min_qty);

                                // Calcular el precio unitario basado en el precio de compra y el factor de conversión
                                calculateUnitPrice(response.data.purchase_price, response.data.conversion_factor);
                                const unitPrice = parseFloat(response.data.unit_price); // asegurarte de que sea número
                                $('#unit_price').val(unitPrice.toFixed(2));

                                // Funcion para mostrar los precios con sus respectivos margene
                                [1, 2, 3].forEach(index => {
                                    const salePrice = parseFloat(response.data[`sale_price_${index}`]);

                                    const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
                                    $(`#margen_${index}`).val(margin); // solo mostrar el margen
                                });

                                // Cuando recibas los datos del producto para editar:
                                const taxIds = response.data.tax_ids ? response.data.tax_ids.split(',') : [];
                                // Marca los checkboxes correspondientes
                                $('input[name="taxes[]"]').each(function () {
                                    const taxId = $(this).val();
                                    if (taxIds.includes(taxId)) {
                                        $(this).prop('checked', true);
                                    }
                                });

                                // Validar los checkboxes de IVA y Neto para mostrar los precios correctamente
                                validateInputChecked();

                                // Valores para inputs de texto en adicional
                                $('#description').val(response.data.description);
                                $('#stock_min').val(response.data.stock_min);
                                $('#stock_max').val(response.data.stock_max);
                                $('#expiry-date').flatpickr().setDate(response.data.expiry_date);
                                $('#shelf_life_days').val(response.data.shelf_life_days);
                                $('#alert_days_before_expiration').val(response.data.alert_days_before_expiration);

                                // Valores para los select
                                $('.products_departments').val(response.data.department_id).trigger('change');
                                $('.products_categories').val(response.data.category_id).trigger('change');
                                $('.purchase_unit').val(response.data.purchase_unit_id).trigger('change');
                                $('.sale_unit').val(response.data.sale_unit_id).trigger('change');

                                // Valores para los checkboxes
                                $('#is_fractional').prop('checked', response.data.is_fractional === 1);
                                $('#is_net_price').prop('checked', response.data.is_net_price === 1);
                                $('#is_service').prop('checked', response.data.is_service === 1);
                                $().prop('checked', response.data.taxes ? response.data.taxes.map(tax => tax.id) : []);
                                $('#allow_fractional_sale').prop('checked', response.data.allow_fractional_sale === 1);
                                $('#allow_decimal_quantity').prop('checked', response.data.allow_decimal_quantity === 1);
                                $('#requires_batch_control').prop('checked', response.data.requires_batch_control === 1);
                                $('#requires_serial_number').prop('checked', response.data.requires_serial_number === 1);

                                // =========================================
                                // CARGAR IMAGEN EXISTENTE EN FILEPOND
                                // =========================================
                                if (response.data.image_url || response.data.image) {
                                    const imagePath = response.data.image_url || response.data.image;

                                    // Guardar en variable JavaScript
                                    pendingProductImage = imagePath;

                                    // Si ya está inicializado (tab activo), cargar inmediatamente
                                    if (filePondInitialized) {
                                        loadFilePondImage('product-main', imagePath);
                                        pendingProductImage = null; // Limpiar inmediatamente
                                    }
                                } else {
                                    // Limpiar si no hay imagen
                                    pendingProductImage = null;
                                    if (filePondInitialized) {
                                        clearFilePondFiles('product-main');
                                    }
                                    $('#remove_image').val('0');
                                }

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

// =========================================
// FUNCIÓN: Actualización de stock en el modal de ajuste de inventario
// =========================================

/**
 * @param {number} adjustmentType - Tipo de ajuste (entrada, salida, ajuste)
 * @param {number} adjustmentQuantity - Cantidad de ajuste
 * @param {number} productId - ID del producto
 */
function updateStock(adjustmentType, adjustmentQuantity, productId) {
    $.ajax({
        url: `/products/${productId}/adjust-stock`,
        type: 'POST',
        data: {
            adjustment_type: adjustmentType,
            adjustment_quantity: adjustmentQuantity,
            _token: $('meta[name="csrf-token"]').attr('content')
        },
        success: function (response) {
            showAlert(
                'success',
                'Éxito',
                response.message
            );
            $('#inventoryModal').modal('hide');
            $('#inventoryForm')[0].reset();
            $('#current_stock_value').removeClass('text-danger').text('');
            productsTable.ajax.reload(null, false);
        },
        error: function () {
            showAlert(
                'error',
                'Error',
                'No se pudo actualizar el stock.'
            );
        }
    });
}

// =========================================
// FUNCIÓN: Inicializa los select2 para departamentos y categorías
// =========================================
function initializeSelect2() {
    $('.products_departments').select2({
        dropdownParent: $('#productsModal'),
    });
    $('.products_categories').select2({
        dropdownParent: $('#productsModal'),
    });
}

// =========================================
// FUNCIÓN: Para validar las unidades de compra y venta seleccionadas
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
    const price = parseFloat(unitPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    // Valida que los precios sean números y mayores a cero
    if (isNaN(price) || isNaN(sale) || price <= 0 || sale <= 0) {
        return 0;
    }

    const margin = ((sale - price) / price * 100);
    // Validar que el margen no sea un número inválido
    if (isNaN(margin) || !isFinite(margin)) {
        return 0;
    }

    return margin.toFixed(3);
}

// =========================================
// FUNCIÓN: Recalcula el precio de compra y unitario sin iva
// =========================================

/**
 * Valida los inputs de IVA y Neto seleccionados y actualiza los precios sin iva a los campos correspondientes.
 *
 * @param {boolean|null} taxChecked - Estado del checkbox de impuestos (null = calcular desde DOM)
 * @param {boolean|null} netoChecked - Estado del checkbox de precio neto (null = calcular desde DOM)
 */
export function validateInputChecked(taxChecked = null, netoChecked = null) {
    // Si no se pasan parámetros, calcularlos desde el DOM
    if (taxChecked === null) {
        taxChecked = $('input[name="taxes[]"]:checked').length > 0;
    }
    if (netoChecked === null) {
        netoChecked = $('#is_net_price').is(':checked');
    }

    // Obtener el precio base guardado o el valor actual si no existe
    let basePrice = parseFloat($('#purchase_price').data('base-price'));
    if (!basePrice || isNaN(basePrice)) {
        basePrice = parseFloat($('#purchase_price').val()) || 0;
        $('#purchase_price').data('base-price', basePrice);
    }

    const conversionFactor = parseFloat($('#conversion_factor').val()) || 1;

    // Calcular el total de impuestos de los checkboxes seleccionados
    let totalTaxRate = 0;
    $('input[name="taxes[]"]:checked').each(function () {
        const taxRate = $(this).data('tax-value');
        if (taxRate) {
            totalTaxRate += parseFloat(taxRate);
        }
    });

    // Función auxiliar para calcular precio sin impuestos
    const removeTaxes = (amount) => (amount / (1 + (totalTaxRate / 100)));

    // SIEMPRE partir del precio base original
    let finalPrice = basePrice;
    let finalUnitPrice = parseFloat(calculateUnitPrice(basePrice, conversionFactor));

    if (taxChecked && netoChecked) {
        // Ambos seleccionados: mostrar precios sin impuestos
        finalPrice = removeTaxes(basePrice);
        finalUnitPrice = removeTaxes(finalUnitPrice);
    } else if (taxChecked || netoChecked) {
        // Solo uno seleccionado: mostrar precios con impuestos (originales del precio base)
        // finalPrice y finalUnitPrice ya están calculados arriba con basePrice
    }

    $('#price_iva').val(finalPrice.toFixed(2));
    $('#unit_price').val(finalUnitPrice.toFixed(2));
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