$(document).ready(function () {
    var autoCompleteFruit = new autoComplete({
        selector: "#auto_complete_supplier",
        data: {
            src: async (query) => {
                try {
                    const response = await autoCompleteSupplier(query);
                    return response.data; // response.data debe ser un array de objetos con { id, value }
                } catch (error) {
                    console.error(error);
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

                    // Asegurarte de obtener el valor como string
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

    $('#supplier_id').on('change', function () {
        const supplierId = $(this).val();
        if (supplierId) {
            getSupplierData(supplierId);
        }
    });

});


function autoCompleteSupplier(query) {
    return $.ajax({
        url: `purchases/autocompleteSuppliers/${query}`,
        type: 'GET',
        dataType: 'json'
    });
}

function getSupplierData(supplierId) {
    $.ajax({
        url: `/purchases/${supplierId}/show`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            const rowPhone = response.phone || '';
            const phoneFormat = rowPhone.length === 10
                ? `(${rowPhone.substring(0, 3)})` + '-' + rowPhone.substring(3, 6) + '-' + rowPhone.substring(6)
                : rowPhone;

            $('.name_supplier').text(response.representative || 'No hay dato');
            $('.company_name').text(response.company_name || 'No hay dato');
            $('.email_supplier').text(response.email || 'No hay dato');
            $('.phone_supplier').text(phoneFormat || 'No hay dato');
            $('.rfc_supplier').text(response.rfc || 'No hay dato');
            $('.credit_supplier').text(response.credit_available || 'No hay dato');

        }
    });
}
