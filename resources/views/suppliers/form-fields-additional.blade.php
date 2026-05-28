<div class="row">

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Términos De Pago
    </div>

    <div class="col-8">
        <div class="mb-3">
            <label for="choices-payment-frequency-input" class="form-label">Frecuencia De Pago</label>

            <select class="form-select" id="choices-payment-frequency-input" data-choices data-choices-search-false>
                <option value="unico" selected>Unico</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
            </select>
        </div>
    </div>

    <div class="col-4">

        <div class="mb-3">
            <label for="payment_day_of_month">Día De Pago</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('payment_day_of_month') is-invalid @enderror"
                    name="payment_day_of_month"
                    id="payment_day_of_month"
                    value="{{ old('payment_day_of_month') }}">
                <i class="ri-calendar-event-line "></i>
                @error('payment_day_of_month')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>
    </div>

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Intereses Por Mora
    </div>

    <div class="col-4">

        <div class="mb-3">
            <label for="supplier_interest_rate">% de Interés</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('supplier_interest_rate') is-invalid @enderror"
                    name="supplier_interest_rate"
                    id="supplier_interest_rate"
                    value="{{ old('supplier_interest_rate') }}">
                <i class="ri-percent-line"></i>
                @error('supplier_interest_rate')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>
    <div class="col-4">

        <div class="mb-3">
            <label for="supplier_late_fee">Monto De Interés</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('supplier_late_fee') is-invalid @enderror"
                    name="supplier_late_fee"
                    id="supplier_late_fee"
                    value="{{ old('supplier_late_fee') }}">
                <i class="ri-coins-line"></i>
                @error('supplier_late_fee')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>
    <div class="col-4">

        <div class="mb-3">
            <label for="grace_period_days">Días Para Pago</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('grace_period_days') is-invalid @enderror"
                    name="grace_period_days"
                    id="grace_period_days"
                    value="{{ old('grace_period_days') }}">
                <i class="ri-calendar-event-line "></i>
                @error('grace_period_days')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="pb-2 mb-3 text-muted border-bottom border-light text-center">
        Descuentos Por Pronto Pago
    </div>

    <div class="col-6">

        <div class="mb-3">
            <label for="early_payment_discount">% De Descuento</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('early_payment_discount') is-invalid @enderror"
                    name="early_payment_discount"
                    id="early_payment_discount"
                    value="{{ old('early_payment_discount') }}">
                <i class="ri-percent-line"></i>
                @error('early_payment_discount')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-6">

        <div class="mb-3">
            <label for="early_payment_days">Días Para Pago Anticipado</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('early_payment_days') is-invalid @enderror"
                    name="early_payment_days"
                    id="early_payment_days"
                    value="{{ old('early_payment_days') }}">
                <i class="ri-calendar-event-line "></i>
                @error('early_payment_days')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

</div>