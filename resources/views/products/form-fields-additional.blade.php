<div class="row">
    <div class="col-12">
        <!-- Comentario -->
        <div class="mb-3">
            <label for="product_description" class="form-label">Comentario</label>
            <textarea class="form-control" id="product_description" name="product_description" rows="3"></textarea>
        </div>
    </div>

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Configuración de Venta
    </div>

    <div class="col-4">
        <div class="form-check checkbox checkbox-secondary mb-3">

            <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
            <input class="form-check-input"
                id="allow_fractional_sale"
                name="allow_fractional_sale"
                value="1"
                type="checkbox">
            <label class="form-check-label" for="allow_fractional_sale">Permitir venta fraccionada</label>

        </div>
        <div class="form-check checkbox checkbox-secondary mb-3">

            <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
            <input class="form-check-input"
                id="allow_decimal_quantity"
                name="allow_decimal_quantity"
                value="1"
                type="checkbox">
            <label class="form-check-label" for="allow_decimal_quantity">Permitir cantidades decimales</label>

        </div>
    </div>

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Control de Inventario
    </div>

    <div class="col-4">
        <div class="form-check checkbox checkbox-secondary mb-3">

            <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
            <input class="form-check-input"
                id="requires_batch_control"
                name="requires_batch_control"
                value="1"
                type="checkbox">
            <label class="form-check-label" for="requires_batch_control">Requiere control de lote</label>

        </div>
        <div class="form-check checkbox checkbox-secondary mb-3">

            <!--CHECK PARA EL PRECIO NETO DEL PRODUCTO-->
            <input class="form-check-input"
                id="requires_serial_number"
                name="requires_serial_number"
                value="1"
                type="checkbox">
            <label class="form-check-label" for="requires_serial_number">Requiere número de serie</label>

        </div>
    </div>

    <div class="col-3">
        <div class="mb-3">
            <label for="stock_min">Stock minimo</label>
            <input type="number"
                class="form-control only-numbers @error('stock_min') is-invalid @enderror"
                name="stock_min"
                id="stock_min"
                value="{{ old('stock_min') }}">
            @error('stock_min')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

    </div>

    <div class="col-3">
        <div class="mb-3">
            <label for="stock_max">Stock maximo</label>
            <input type="number"
                class="form-control only-numbers @error('stock_max') is-invalid @enderror"
                name="stock_max"
                id="stock_max"
                value="{{ old('stock_max') }}">
            @error('stock_max')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>
    </div>
    <div class="col-3">
        <div class="mb-3">
            <label class="form-label mb-0">Fecha de caducidad</label>
            <div class="mt-2">
                <input type="text" class="form-control" data-provider="flatpickr" data-date-format="d M, Y">
            </div>
        </div>
    </div>
    <div class="col-2">
        <div class="mb-3">
            <label for="days_remaining">Días Restantes</label>
            <input type="number"
                class="form-control only-numbers @error('days_remaining') is-invalid @enderror"
                name="days_remaining"
                id="days_remaining"
                value="{{ old('days_remaining') }}">
            @error('days_remaining')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>
    </div>
    <div class="col-3">
        <div class="mb-3">
            <label for="alert_days_before_expiry">Alertar x días antes de vencer</label>
            <input type="number"
                class="form-control only-numbers @error('alert_days_before_expiry') is-invalid @enderror"
                name="alert_days_before_expiry"
                id="alert_days_before_expiry"
                value="{{ old('alert_days_before_expiry') }}">
            @error('alert_days_before_expiry')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>
    </div>



</div>