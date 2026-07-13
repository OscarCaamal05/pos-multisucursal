import { showAlert, clearValidationErrors, handleValidationError, showConfirmationAlert } from '../../utils/alerts';
import { bindBranchesFormSubmit } from '../../helpers/branchesHelper';

// =========================================
// INICIALIZACIÓN DEL MÓDULO
// =========================================

const BRENCH_CONFIG = {
    selectors: {
        branchId: '#branchId',
        nameInput: '#nameInput',
        codeInput: '#codeInput',
        taxIdInput: '#taxIdInput',
        addressInput: '#addressInput',
        phoneInput: '#phonenumberInput',
        emailInput: '#emailInput',
        websiteInput: '#websiteInput',
    },
    api: {
        getDefaultDataBrench: '/branches/getBrachDefaultData',
        updateBranch: '/branches/update',
    }
}

/**
 * Punto de entrada del módulo.
 * Se llama desde branchesMain.js dentro del $(document).ready.
 */
export function initBranchesModule() {
    try {
        bindBranchesFormSubmit();

        // Obtener datos de la sucursal por defecto y llenar el formulario
        getDefaultDataBrench().then(response => {
            _fillBranchFormWithData(response.branch_data);
        });

        _bindLogoUpload();

    } catch (error) {
        console.error('❌ Error al inicializar branchesGeneral:', error);
    }
}

/**
 * 
 * @returns Retorna los datos de la sucursal de acuerdo al usuario en session
 */
function getDefaultDataBrench() {
    return $.ajax({
        url: BRENCH_CONFIG.api.getDefaultDataBrench,
        method: 'GET',
        dataType: 'json',
    });
}

/**
 * 
 * @param {Object} branchData // Datos de la sucursal obtenidos desde el backend.
 * Llena el formulario de sucursal con los datos obtenidos.
 */
function _fillBranchFormWithData(branchData) {
    $(BRENCH_CONFIG.selectors.branchId).val(branchData.id);
    $(BRENCH_CONFIG.selectors.nameInput).val(branchData.name);
    $(BRENCH_CONFIG.selectors.codeInput).val(branchData.code);
    $(BRENCH_CONFIG.selectors.taxIdInput).val(branchData.tax_id);
    $(BRENCH_CONFIG.selectors.addressInput).val(branchData.address);
    $(BRENCH_CONFIG.selectors.phoneInput).val(branchData.phone);
    $(BRENCH_CONFIG.selectors.emailInput).val(branchData.email);
    $(BRENCH_CONFIG.selectors.websiteInput).val(branchData.website);

    if (branchData.logo_path) {
        $('.company-logo-image').attr('src', `/storage/${branchData.logo_path}`);
    }
}

function _bindLogoUpload() {
    $('#profile-img-file-input').on('change', function () {
        const file = this.files[0];
        if (!file) return;

        // 1. Preview inmediato sin esperar al servidor
        const reader = new FileReader();
        reader.onload = (e) => {
            $('.company-logo-image').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);

        // 2. Subir al servidor
        const branchId = $(BRENCH_CONFIG.selectors.branchId).val();
        if (!branchId || branchId == 0) {
            console.warn('No hay sucursal cargada aún');
            return;
        }

        const formData = new FormData();
        formData.append('logo', file);
        formData.append('_token', $('meta[name="csrf-token"]').attr('content'));

        $.ajax({
            url: `/branches/${branchId}/upload-logo`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('.company-logo-image').attr('src', response.logo_url);
            },
            error: function (xhr) {
                console.error('❌ Error al subir logo:', xhr.responseJSON);
            }
        });
    });
}
