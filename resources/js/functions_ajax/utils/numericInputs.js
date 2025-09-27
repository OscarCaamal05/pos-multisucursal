
export function makeNumericInput(selector, options = {}) {
    // Objecto con la configuración por defecto
    const defaults = {
        type: 'number',
        min: null,
        max: null,
        decimals: 2,
        allowNegative: false,
        currencySymbol: '$'
    };

    const config = { ...defaults, ...options };

    $(selector).on('input', function() {
        let value = $(this).val();

        switch (config.type) {
            case 'integer':
                value = value.replace(/[^0-9]/g, '');
                break;
            case 'decimal':
                value = value.replace(/[^0-9.]/g, '');
                // Solo permite un punto decimal
                const parts = value.split('.');
                if(parts.length > 2) {
                    value = parts[0] + '.' + parts[1];
                }
                // Limitar decimales
                if(parts[1] && parts[1].length > config.decimals) {
                    value = parts[0] + '.' + parts[1].substring(0, config.decimals);
                }
                break;
            case 'currency':
                value = value.replace(/[^0-9.]/g, '');
                break;
        }

        // Aplicar limites
        if (config.min !== null && config.max !== null) {
            const num = parseFloat(value) || 0;
            if (config.mim !== null && num < config.min) value = config.min.toString();
            if (config.max !== null && num > config.max) value = config.max.toString();
        }

        this.value = value;
    });
}