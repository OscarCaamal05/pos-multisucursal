import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from './utils/alerts';
import { calculateUnitPrice, calculateMarginFromSalePrice } from './functionAjaxProducts';
// =========================================
// VARIABLES GLOBALES
// =========================================

let tableDetails = null;
let selectedRowDetail = null;
let productsTable = null;
let purchasesTable = null;

$(document).ready(function () {
    const input_date = document.querySelector('input[data-provider="flatpickr"]');

    // =============================================================================
    // Obtener la fecha actual y mostrarlo en el input date
    // =============================================================================
    flatpickr(input_date, {
        dateFormat: "d M, Y",
        defaultDate: new Date()
    });

    // =============================================================================
    // Funciones que se inicializan al recargar la página para realizar operaciones especificas
    // =============================================================================
    const temp_purchase_id = $('#temp_purchase_id').val();
    initSupplier();
    initTableDetails();
    loadTotals(temp_purchase_id);
    addProductToTempList();
    bindDeleteEvents();

    // =============================================================================
    // EVENTO: inicializa el autocompletado para proveedores
    // =============================================================================
    autoCompleteSuppliers();

    // =============================================================================
    // EVENTO: inicializa el autocompletado para productos
    // =============================================================================
    autoCompleteProducts();

    // =============================================================================
    // EVENTO: Para obtener el valor de input y mandarlo a la funcion cada que se realice un cambio
    // =============================================================================
    $('#supplier_id').on('change', function () {
        const supplierId = $(this).val();
        if (supplierId) {
            //Si hay un id seleccionado, llama a la función para obtener los datos del proveedor
            getSupplierData(supplierId);
        }
    });

    // =============================================================================
    // EVENTO: Para obtener el valor de input y mandarlo a la funcion cada que se realice un cambio
    // =============================================================================
    $('#product_id').on('change', function () {
        const productId = $(this).val();
        if (productId) {
            //Si hay un id seleccionado, llama a la función para obtener los datos del proveedor
            //addProductToTempList(productId);

            $('#modal-product-details').modal('show');

            getDataProduct(productId);
        }
    });

    // =============================================================================
    // EVENTO: Para calcular el margen de los input dentro del detalle del producto que se va agregar
    // =============================================================================
    $('.price-sale').on('input', function () {
        const index = $(this).data('index');
        const salePrice = parseFloat($(this).val());
        const unitPrice = parseFloat($('#new-price-unit').val());
        const targetMargin = $(`.margin-${index}`);

        const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
        targetMargin.text(margin);
    });

    // ============================================================================
    // EVENTO: Cálculo automático del descuento en cantidad monetaria
    // Al escribir un porcentaje en el input #discount-percentage, se toma el
    // valor actual del precio de costo (#cost), se calcula el descuento en pesos
    // y se muestra automáticamente en el input #discount-number.
    // ============================================================================
    $('#discount-percentage').on('input', function () {
        const discount = $(this).val();
        const costPrice = parseFloat($('#cost').val());
        const result = calculateDiscountPercentage(discount, costPrice);
        $('#discount-number').val(result);
    });

    // ============================================================================
    // EVENTO: Cálculo automático del descuento en cantidad porcentual
    // Al escribir un numero entero en el input #discount-number, se toma el
    // valor actual del precio de costo (#cost), se calcula el descuento en porcentaje
    // y se muestra automáticamente en el input #discount-percentage.
    // ============================================================================
    $('#discount-number').on('input', function () {
        const discount = $(this).val();
        const costPrice = parseFloat($('#cost').val());
        const result = calculateDiscountNumber(discount, costPrice);
        $('#discount-percentage').val(result);
    });

    // ============================================================================
    // EVENTO: Recálculo automático los valores de los input de
    // price-sale, margen, discount-number, cuando se realicen cambios en los input 
    // de cost y new-factor
    // ============================================================================
    $('#cost, #new-factor').on('input', function () {
        const costPrice = parseFloat($('#cost').val());
        const factor = parseFloat($('#new-factor').val());

        // Para cada precio de venta existente (puede haber más de uno)
        $('.price-sale').each(function () {
            const index = $(this).data('index');
            const salePrice = parseFloat($(this).val());
            const targetMargin = $(`.margin-${index}`);

            const unitPrice = calculateUnitPrice(costPrice, factor);
            $('#new-price-unit').val(unitPrice);
            const margin = calculateMarginFromSalePrice(unitPrice, salePrice);
            targetMargin.text(margin);
        });
        const discount = $('#discount-percentage').val();
        const result = calculateDiscountPercentage(discount, costPrice);
        $('#discount-number').val(result);
    });

    // ============================================================================
    // EVENTO: Para cancelar el ingreso de los datos cargados en el modal de detelle
    // del producto a la tabla de temporal de compra, limpiando los campos y
    // y escondiendo el modal.
    // ============================================================================
    $('#btn-cancelar-product-details').on('click', function () {
        clearProductDetailModal();
        $('#modal-product-details').modal('hide');
    });

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de detalles temporales de los productos al hacerle doble click 
    // y manda el id_temp del registro, a al funcion para obtener los datos y actualizar
    // ============================================================================
    $('#tableTempPurchase tbody').on('dblclick', 'tr', function () {
        const data = tableDetails.row(this).data();
        getDataProductDetail(data.id_temp, true);
    })

    // ============================================================================
    // EVENTO: Para agregarle una clase css de boostrap que remarque la fila
    // seleccionado y aparte obtiene el los datos de la fila selecionado para utilizarlos
    // en otras funciones
    // ============================================================================
    $('#tableTempPurchase tbody').on('click', 'tr', function () {
        // Quita la selección previa
        $('#tableTempPurchase tbody tr.selected').removeClass('selected table-light');
        // Marca la fila actual como seleccionada
        $(this).addClass('selected table-light');
        // Guarda el id de la fila seleccionada
        const data = tableDetails.row(this).data();
        selectedRowDetail = data ? data.id_temp : null;
    });

    // ============================================================================
    // EVENTO: Para editar los registros listados en la tabla temporal,
    // Validando que haya una fila seleccionado previamente, en caso de que no este
    // seleccionad muestra un mensaje de advertencia.
    // ============================================================================
    $('#btn-edit-product').on('click', function () {
        if (selectedRowDetail) {
            getDataProductDetail(selectedRowDetail, true);
        } else {
            showAlert('warning', 'Espera', 'Seleccione una fila para continuar');
        }
    })

    // ============================================================================
    // EVENTO: Muestra el modal donde se listan los productos en la base de datos
    // ============================================================================
    $('#btn-search-product').on('click', function () {
        $('#modal-products').modal('show');
        loadListProducts();
    })

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de productos listados y el id se
    // envia el id al input #product_id y esconde el modal. 
    // ============================================================================
    $('#tableProducts tbody').on('dblclick', 'tr', function () {
        const data = productsTable.row(this).data();
        $("#product_id").val(data.id).trigger('change');
        $('#modal-products').modal('hide');
    })

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los productos registrados en la base
    // de datos.
    // ============================================================================
    $('#btn-close-product').on('click', function () {
        $('#modal-products').modal('hide');
    });

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los compra pendientes
    // ============================================================================
    $('#btn-close-pending').on('click', function () {
        $('#modal-purchase-waiting').modal('hide');
    });

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los productos registrados en la base
    // de datos.
    // ============================================================================
    $('#btn-set-waiting').on('click', function () {
        sendPurchaseToWait();
    });

    // ============================================================================
    // EVENTO: Cierra el modal de listado de los productos registrados en la base
    // de datos.
    // ============================================================================
    $('#btn-purchase-waiting').on('click', function () {
        $('#modal-purchase-waiting').modal('show');
        listPendingPurchases();
    });

    // ============================================================================
    // EVENTO: Obtiene los datos de la tabla de productos listados y el id se
    // envia el id al input #product_id y esconde el modal. 
    // ============================================================================
    $('#tablePurchaseWaiting tbody').on('dblclick', 'tr', function () {
        const data = purchasesTable.row(this).data();
        //Recuperar la venta o cambiar el estado de la venta seleccionada a abierta y si hay uno en proceso enviarlo en espera
        getPurchaseOnHold(data.id_temp_purchase);
    })

    // ============================================================================
    // EVENTO: Obtiene el valor del input para mandarlo al controlador y actualizar el 
    // descuento general de la compra
    // ============================================================================
    $('#general-discount-number').on('blur', function () {
        const discount = $(this).val();
        applyDiscount(discount);
    })

    $('#btn-cancel-purchase').on('click', function () {
        cancelTempPurchase();
    });
});
/**
 * ------------------------------------------ FIN READY -------------------------------------------------
 */

/**
 * Inicializa el datatable de la tabla temporal de compra.
 */
function initTableDetails() {
    tableDetails = $('#tableTempPurchase').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/temp_purchases_detail/data',
        columns: [
            {
                data: 'id_temp',
                name: 'id_temp',
                visible: false
            },
            {
                data: 'temp_purchase_id',
                name: 'temp_purchase_id',
                visible: false
            },
            {
                data: 'product_id',
                name: 'product_id',
                visible: false
            },
            {
                data: null,
                name: 'description',
                render: function (data, type, row) {
                    return `
                    <div class="d-flex">
                        <div class="flex-grow-1 ms-3">
                            <h5 class="fs-14 text-body m-1">
                                ${row.product_name}
                            </h5>
                            <p class="text-muted mb-0">Codigo: <span class="fw-medium">${row.barcode}</span></p>
                        </div>
                    </div>
                    `;
                }
            },
            {
                data: null,
                name: 'quantity',
                className: 'text-center fs-6',
                render: function (data, type, row) {
                    return `
                        <h5 class="text-body fs-14"> 
                            ${row.quantity}
                        </h5>`
                }
            },
            {
                data: null,
                name: 'factor',
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <h5 class="text-body fs-14"> 
                            ${row.factor}
                        </h5>`
                }
            },
            {
                data: null,
                name: 'purchase_price',
                render: function (data, type, row) {
                    return `
                    <div class="d-flex justify-content-center">
                        <h5 class="text-body fs-14 me-1"> $${row.purchase_price} </h5>
                        <span class="text-muted fs-12 fw-semibold"> X ${row.unit_name}<span>
                    </div>
                    `;
                }
            },
            {
                data: null,
                name: 'discount',
                className: 'text-center fs-6',
                render: function (data, type, row) {
                    return `
                        <h5 class="text-body fs-14"> 
                            $${row.discount}
                        </h5>
                    `;
                }
            },
            {
                data: null,
                name: 'total',
                className: 'text-center fs-6',
                render: function (data, type, row) {
                    return `
                    <h5 class="text-body fs-14" >
                        $${row.total}
                    </h5>`;
                }
            },
            {
                data: 'unit_id',
                name: 'unit_id',
                visible: false
            },
            {
                data: 'id_temp',
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
        searching: false,
        ordering: false,
        paging: false,
        info: false,
        lengthChange: false,
        pageLength: -1,

    });
}

/**
 * Renderiza los botones de acciones (editar, eliminar).
 */
function renderActionsColumn(data) {
    return `
        <div class="hstack gap-3 fs-15">
            <a href="javascript:void(0);" class="link-danger btn-delete-detail" data-id="${data}">
                <i class="ri-delete-bin-5-line"></i>
            </a>
        </div>
    `;
}

// =========================================
// FUNCIÓN: Vincula evento de eliminación
// =========================================

/**
 * Asocia el evento de eliminación de los productos listados para la compra.
 */
function bindDeleteEvents() {
    $('#tableTempPurchase tbody').on('click', '.btn-delete-detail', function () {
        const detailId = $(this).data('id');

        $.ajax({
            url: `/temp_purchases_detail/${detailId}`,
            type: 'DELETE',
            data: {
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function (response) {
                tableDetails.ajax.reload(null, false);
                showTotals(response);
            },
            error: function () {
                showAlert(
                    'error',
                    'Error',
                    'No se pudo eliminar el registro.'
                );
            }
        });

    });
}
// =========================================
// FUNCIÓN: Para el autocompletado de proveedores
// =========================================
function autoCompleteSuppliers() {
    var autoCompleteFruit = new autoComplete({
        selector: "#auto_complete_supplier",
        data: {
            src: async (query) => {
                try {
                    const response = await autoCompleteSupplier(query);
                    return response.data; // response.data es un array de objetos con { id, value }
                } catch (error) {
                    console.error(error);
                    return [];
                }
            },
            keys: ['value'], //<-- Clave que contiene el texto a mostrar en el autocompletado
            cache: false
        },

        resultsList: {
            element: function (list, data) {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", "no_result");
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

                    // Se asegura de obtener el valor como string
                    const selectedText = typeof selection.value === 'string'
                        ? selection.value
                        : (selection.value?.value || '');

                    autoCompleteFruit.input.value = selectedText;
                    autoCompleteFruit.input.select();
                    $("#supplier_id").val(selection.value.id).trigger('change');
                }
            }
        }
    });
}

// =========================================
// FUNCIÓN: Consultar a los proveedores registrados
// =========================================

/**
 * Envia la cadena introducida en el campo de búsqueda de proveedores
 * 
 * @param {string} query - Cadena de búsqueda introducida por el usuario
 */
function autoCompleteSupplier(query) {
    return $.ajax({
        url: `temp_purchases_detail/autoCompleteSuppliers/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

// =========================================
// FUNCIÓN: Consultar los datos de un proveedor específico
// =========================================

/**
 * Envia el ID del proveedor seleccionado para obtener sus datos
 * 
 * @param {number} supplierId - id del proveedor seleccionado
 */
function getSupplierData(supplierId) {
    $.ajax({
        url: `/temp_purchases_detail/${supplierId}/show`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            // Verifica si la respuesta contiene el numero de teléfono
            const rowPhone = response.phone || '';
            //Si es asi, formatea el número de teléfono para mostarlo en el formato (XXX)-XXX-XXXX
            const phoneFormat = rowPhone.length === 10
                ? `(${rowPhone.substring(0, 3)})` + '-' + rowPhone.substring(3, 6) + '-' + rowPhone.substring(6)
                : rowPhone;
            // LLena los campos con los datos del proveedor validando si existe en registro
            $('.name_supplier').text(response.representative || 'No hay dato');
            $('.company_name').text(response.company_name || 'No hay dato');
            $('.email_supplier').text(response.email || 'No hay dato');
            $('.phone_supplier').text(phoneFormat || 'No hay dato');
            $('.rfc_supplier').text(response.rfc || 'No hay dato');
            $('.credit_supplier').text(response.credit_available || 'No hay dato');
            $('#supplier_id').val(supplierId || 0);

            // Guardar datos en localStorage para permanencia al recargar la pagina
            const supplier = {
                supplierId: supplierId,
                representative: response.representative,
                company_name: response.company_name,
                email: response.email,
                phone: phoneFormat,
                rfc: response.rfc,
                credit_available: response.credit_available
            };
            localStorage.setItem("proveedorSeleccionado", JSON.stringify(supplier));

        }
    });
}

// =========================================
// FUNCIÓN: Recuparar los datos almacenados en el localStrorage y mostrarlo en la interfaz
// =========================================
function initSupplier() {
    const proveedorGuardado = localStorage.getItem("proveedorSeleccionado");
    if (proveedorGuardado) {
        const data = JSON.parse(proveedorGuardado);

        // Mostrar los data en pantalla desde localStorage
        $('.name_supplier').text(data.representative || 'No hay dato');
        $('.company_name').text(data.company_name || 'No hay dato');
        $('.email_supplier').text(data.email || 'No hay dato');
        $('.phone_supplier').text(data.phone || 'No hay dato');
        $('.rfc_supplier').text(data.rfc || 'No hay dato');
        $('.credit_supplier').text(data.credit_available || 'No hay dato');
        $('#supplier_id').val(data.supplierId || 0);
    }
}

// =========================================
// FUNCIÓN: Para el autocompletado de productos
// =========================================
function autoCompleteProducts() {
    var autoCompleteFruit = new autoComplete({
        selector: "#auto_complete_product",
        data: {
            src: async (query) => {
                try {
                    const response = await autoCompleteProduct(query);
                    return response.data; // response.data es un array de objetos con { id, value }
                } catch (error) {
                    console.error(error);
                    return [];
                }
            },
            keys: ['value'], //<-- Clave que contiene el texto a mostrar en el autocompletado
            cache: false,
        },

        resultsList: {
            element: function (list, data) {
                if (!data.results.length) {
                    const message = document.createElement("div");
                    message.setAttribute("class", "no_result");
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

                    // Se asegura de obtener el valor como string
                    const selectedText = typeof selection.value === 'string'
                        ? selection.value
                        : (selection.value?.value || '');

                    autoCompleteFruit.input.value = selectedText;
                    autoCompleteFruit.input.select();
                    $("#product_id").val(selection.value.id).trigger('change');
                }
            }
        }
    });
}

// =========================================
// FUNCIÓN: Consultar los productos registrados
// =========================================

/**
 * Envia la cadena introducida en el campo de búsqueda de productos
 * 
 * @param {string} query - Cadena de búsqueda introducida por el usuario
 */
function autoCompleteProduct(query) {
    return $.ajax({
        url: `temp_purchases_detail/autoCompleteProducts/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

// =========================================
// FUNCIÓN: Consultar los datos de un producto específico
// =========================================
/**
 * Envia el ID del producto seleccionado para obtener sus datos y mostrarlos en el modal de detalle
 * 
 * @param {number} productId - id del producto seleccionado
 * @param {boolean} isEdit - falso si no existe el registro en la tabla temporal de compra
 */
function getDataProduct(productId, isEdit = false) {
    $.ajax({
        url: `/temp_purchases_detail/getDataProduct/${productId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            showProductDetailModal(response.detail, isEdit);
        }

    })
}

// =========================================
// FUNCIÓN: Consultar los datos de un producto específico desde el detalle temporal para la compra
// =========================================
/**
 * Envia el ID del producto seleccionado en la lista de compra para cosultar los datos
 * 
 * @param {number} productId - id del producto seleccionado
 * @param {boolean} isEdit - verdadero si existe el registro en la tabla temporal de compra
 */
function getDataProductDetail(detailId, isEdit = true) {
    $.ajax({
        url: `/temp_purchases_detail/getDataProductTemp/${detailId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            showProductDetailModal(response.detail, isEdit);
        }

    })
}

/**
 * Envia los datos del producto para la compra
 */
function addProductToTempList() {
    $('#productDetails').on('submit', function (e) {

        const tempId = $('#temp_id').val();
        const isEdit = tempId != 0;
        e.preventDefault();
        const $form = $(this).serialize();
        clearValidationErrors();

        $.ajax({
            url: isEdit ? `/temp_purchases_detail/${tempId}` : '/temp_purchases_detail/add',
            method: isEdit ? 'PUT' : 'POST',
            data: $form,
            success: function (response) {
                showTotals(response);
                tableDetails.ajax.reload(null, false); // Recarga la tabla sin reiniciar la paginación
                $('#modal-product-details').modal('hide');
                $('#temp_id').val(0);
            },
            error: function (xhr) {
                handleValidationError(xhr);
            }
        });
    });
}

// =========================================
// FUNCIÓN: Consulta los totales de la venta
// =========================================
/**
 * Envia el id de temp_purchase para recalcular los totales de la compra y mostrarlos en la vista
 * 
 * @param {number} temp_purchase_id - id de la compra
 */
function loadTotals(temp_purchase_id) {
    $.ajax({
        url: `/temp_purchases_detail/totals/${temp_purchase_id}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            showTotals(response);
        }
    });
}

// =========================================
// FUNCIÓN: Para obtener y aplicar un descuento general a la compra y
// recalcular los totales.
// =========================================
function applyDiscount(discount_applied) {
    const tempId = $('#temp_purchase_id').val();
    const discount = discount_applied;

    $.ajax({
        url: '/temp_purchases_detail/updateDiscount/',
        method: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'), // Necesario para POST en Laravel
            temp_id: tempId,
            discount: discount,
        },
        success: function (response) {

            // Actualizar los totales en la vista
            showTotals(response);

        },
        error: function (xhr) {
            showAlert('error', 'Error', 'Error al actualizar el descuento.');
        }
    });
}

// =========================================
// FUNCIÓN: Para mostrar los totales de la compra en la vista
// =========================================
function showTotals(totals) {
    $('.sub-total').text(`$${totals.sub_total}`);
    $('.total-tax').text(`$${totals.total_siva}`);
    $('.tax').text(`$${totals.tax}`);
    $('.total').text(`$${totals.total}`);
    $('.discount-general').val((totals.discount || 0.00.toFixed(2)));
    $('.total-discount').text(`$${totals.sub_total_discount}`);

}
// =========================================
// FUNCIÓN: Para mandar la compra a espera, validando que haya productos en el listado
// y que este seleccionado algun proveedor para la compra
// =========================================
function sendPurchaseToWait() {
    const tempId = $('#temp_purchase_id').val();
    const supplierId = $('#supplier_id').val();
    if (!supplierId || supplierId == 0) {
        showAlert(
            'warning',
            'Alerta',
            'Seleccione un proveedor para enviar a espera.',
        );
        return;
    }

    $.ajax({
        url: '/temp_purchases_detail/set-to-waiting/',
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'),
            temp_id: tempId,
            supplier_id: supplierId,
        },
        success: function (response) {
            localStorage.removeItem("proveedorSeleccionado");
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
            cleanInputPurchase();
            tableDetails.ajax.reload();
            $('#temp_purchase_id').val(response.data.new_temp_purchase_id);
            loadTotals(response.data.new_temp_purchase_id);

        },
        error: function (xhr) {
            let response = {};
            response = JSON.parse(xhr.responseText);
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
        }
    });

}

// =========================================
// FUNCIÓN: Para obtener la compra en espera que se desea retomar
// =========================================
function getPurchaseOnHold(temp_id) {
    const tempActualId = $('#temp_purchase_id').val();
    const supplierId = $('#supplier_id').val();
    const rowCount = tableDetails.rows().count();
    if (rowCount != 0) {
        if (!supplierId || supplierId == 0) {
            showAlert(
                'warning',
                'Alerta',
                'Seleccione un proveedor para enviar a espera.',
            );
            return;
        }
    }

    $.ajax({
        url: '/temp_purchases_detail/getPurchaseOnWaitingList',
        type: 'POST',
        data: {
            _token: $('meta[name="csrf-token"]').attr('content'), // Necesario para POST en Laravel
            temp_id: temp_id,
            temp_actual_id: tempActualId,
            supplier_id: supplierId,
        },
        success: function (response) {

            $('#supplier_id').val(response.data.supplier_id).trigger('change');
            $('#temp_purchase_id').val(response.data.temp_purchase_id);
            loadTotals(response.data.temp_purchase_id);
            tableDetails.ajax.reload(null, false);
            $('#modal-purchase-waiting').modal('hide');
            purchasesTable.ajax.reload();
        },
        error: function (xhr) {
            let response = {};
            response = JSON.parse(xhr.responseText);
            showAlert(
                response.status,
                'Alerta',
                response.message,
            );
        }
    });

}
// =========================================
// FUNCIÓN: Abre el modal de detalle de producto
// =========================================
function listPendingPurchases() {
    if ($.fn.DataTable.isDataTable('#tablePurchaseWaiting')) {
        $('#tablePurchaseWaiting').DataTable().destroy();
        $('#tablePurchaseWaiting tbody').empty();
    }

    purchasesTable = $('#tablePurchaseWaiting').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/temp_purchases_detail/getPendingPurchases',
        columns: [
            {
                data: 'id_temp_purchase',
                name: 'id_temp_purchase',
                visible: false,
            },
            {
                data: 'supplier_id',
                name: 'supplier_id',
                visible: false,
            },
            {
                data: 'date_created',
                name: 't.created_at',
                className: 'text-center',
                render: function (data, type, row) {
                    if (data) {
                        let date = new Date(data);
                        let fechaFormato = date.toLocaleDateString('es-ES');
                        let horaFormato = date.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        return `
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h5 class="fs-13 m-1">${fechaFormato}</h5>
                                    <small class="text-muted">${horaFormato}</small>
                                </div>
                            </div>
            `;
                    }
                    return '';
                }
            },
            {
                data: null,
                name: 'description',
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                    <div class="d-flex">
                        <div class="flex-grow-1">
                            <h5 class="fs-13 m-1">
                                ${row.company_name}
                            </h5>
                            <p class="text-muted mb-0">${row.representative}</p>
                        </div>
                    </div>
                    `;
                }
            },
            {
                data: 'total_amount',
                name: 'total_amount',
                className: 'text-center',
                render: function (data, type, row) {
                    return '$' + parseFloat(data || 0).toFixed(2);
                }
            }
        ],
        scrollY: 400,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
        searching: false,
        info: false,
        lengthChange: false,
        pageLength: -1,
    });
}
/**
 * Muestra el modal del detalle del producto.
 *
 * @param {Object|null} data - Datos de producto o null si es nuevo.
 */
function showProductDetailModal(data, isEdit) {
    // Conversión segura de campos numéricos
    const purchase_price = parseFloat(data.purchase_price) || 0;
    const factor = parseFloat(data.factor || data.conversion_factor);
    const unit_price = parseFloat(data.unit_price) || calculateUnitPrice(purchase_price, factor);
    const sale_price_1 = parseFloat(data.new_sale_price_1 || data.sale_price_1) || 0;
    const sale_price_2 = parseFloat(data.new_sale_price_2 || data.sale_price_2) || 0;
    const sale_price_3 = parseFloat(data.new_sale_price_3 || data.sale_price_3) || 0;
    const quantity = parseFloat(data.quantity) || 0;
    const discount = parseFloat(data.discount) || 0;
    $('#temp_id').val(data.id_temp || 0);
    $('.product-name').text(data.product_name || '');
    $('.barcode').text(data.barcode || '');
    $('.stock').text(data.stock || 0);
    if (factor === 1) {
        $('.factor').prop('disabled', true);
    }
    $('.factor').text(factor).val(factor);
    $('.price-purchase').text(purchase_price);
    $('#cost').val(purchase_price);
    $('.price-purchase-iva').text('por calcular');
    $('.price-sale-1').text(sale_price_1).val(sale_price_1);
    $('.price-sale-2').text(sale_price_2).val(sale_price_2);
    $('.price-sale-3').text(sale_price_3).val(sale_price_3);
    $('#new-price-unit').val(unit_price);
    $('.price-unit').text(unit_price);

    // Calcular y mostrar márgenes
    [1, 2, 3].forEach(index => {
        const salePrice = parseFloat(data[`new_sale_price_${index}`] || data[`sale_price_${index}`]) || 0;
        const margin = calculateMarginFromSalePrice(unit_price, salePrice);
        $(`.margin-${index}`).text(margin || 0);
    });

    $('.unit-purchase').text(`X ${data.unit_name || data.purchase_unit_name || ''}`);
    $('#quantity').val(quantity);
    $('#discount-number').val(discount);
    const result_discount = calculateDiscountNumber(discount, purchase_price);
    $('#discount-percentage').val(result_discount);

    $('#modal-product-details').modal('show');
}

// =========================================
// FUNCIÓN: Cancelar la compra
// =========================================
/**
 * Envia el id de temp_purchase para buscar si existen registros en la tabla temporal
 * en caso de que existan los elimina
 * 
 * @param {number} temp_purchase_id - id de la compra
 */
function cancelTempPurchase() {
    const tempActualId = $('#temp_purchase_id').val();
    $.ajax({
        url: `/temp_purchases_detail/cancelPurchase/${tempActualId}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.status === 'warning') {
                showAlert(response.status, 'Advertencia', response.message);
                return;
            } else {
                cleanInputPurchase();
                location.reload();
            }

        }
    });
}

// =========================================
// FUNCIÓN: Limpia todos los datos del modal de detalle de los productos para compra
// =========================================
function clearProductDetailModal() {
    // Limpia inputs y selects
    $('#productDetails').find('input, select, textarea').each(function () {
        if ($(this).is(':checkbox') || $(this).is(':radio')) {
            $(this).prop('checked', false);
        } else {
            $(this).val('');
        }
    });
    $('.factor').prop('disabled', false);
    // Limpia los textos de los spans/divs
    $('.product-name, .barcode, .stock, .factor, .price-purchase, .price-purchase-iva, .price-sale-1, .price-sale-2, .price-sale-3, .price-unit, .unit-purchase, .margin-1, .margin-2, .margin-3').text('');

    // Si usas clases para los márgenes, también puedes limpiar así:
    [1, 2, 3].forEach(index => {
        $(`.margin-${index}`).text('');
    });
}

// =========================================
// FUNCIÓN: Para limpiar los campos de la compra
// =========================================
function cleanInputPurchase() {
    // Limpia los campos del proveedor
    $('#supplier_id').val(0)
    $('.company_name').html('No seleccionado')
    $('.name_supplier').html('Proveedor')
    $('.email_supplier').html('')
    $('.phone_supplier').html('')
    $('.rfc_supplier').html('')
    $('.credit_supplier').html('')
    $('.discount-general').val(0.00);

    // Limpia el campo de autocompletado
    $('#auto_complete_supplier').val('');
    $('#auto_complete_product').val('');

    // Para restablecer los selects y inputs de la compra
    $('#document-type').val(1).trigger('change');
    $('#voucher-type').val(1).trigger('change');
    $('#folio').val('');

    // Restablecer la fecha de compra al día actual
    const dateInput = $('input[data-provider="flatpickr"]')[0];
    const flatpickrInstance = dateInput._flatpickr;

    if (flatpickrInstance) {
        const today = new Date();
        const currentDate = flatpickrInstance.selectedDates[0];

        // Solo cambiar si es diferente a hoy
        if (!currentDate || currentDate.toDateString() !== today.toDateString()) {
            flatpickrInstance.setDate(today, true);
            console.log('Fecha restablecida a hoy');
        }
    }
}
// =========================================
// FUNCIÓN: Calcula el descuento en porcentaje
// =========================================

/**
 * Retorna el resultado para ser utilizado en eventos
 *
 * @param {number} discount - El porcentaje de descuento
 * @param {number} costPrice - EL costo del producto
 */
function calculateDiscountPercentage(discount, costPrice) {
    return (costPrice * (discount / 100)).toFixed(2);
}

// =========================================
// FUNCIÓN: Calcula el descuento por el precio
// =========================================

/**
 * Retorna el resultado para ser utilizado en eventos
 *
 * @param {number} discount - El precio de descuento
 * @param {number} costPrice - EL costo del producto
 */
function calculateDiscountNumber(discount, costPrice) {
    return ((discount / costPrice) * 100).toFixed(2);
}

// =================================================================================
// FUNCIÓN: Carga los datos de los productos en la tabla dentro del modal para busqueda
// profunda
// =================================================================================
function loadListProducts() {
    if ($.fn.DataTable.isDataTable('#tableProducts')) {
        $('#tableProducts').DataTable().destroy();
        $('#tableProducts tbody').empty();
    }

    productsTable = $('#tableProducts').DataTable({
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
        ],
        scrollY: 500,
        deferRender: true,
        scroller: true,
        language: idiomaEspanol,
    });
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
