<div class="row">
    <div class="pb-2 mb-3 text text-end-muted border-bottom border-light text-center">
        <span class="">Total a pagar</span>
        <h3 class="total">$</h3>
    </div>
    <div class="pb-2 mb-3 text text-end-muted border-bottom border-light text-center">
        <div class="form-check form-radio-secondary mb-3">
            <input class="form-check-input" type="radio" name="payment_method" id="payment-box" checked>
            <label class="form-check-label" for="payment-box">
                Pago con caja
            </label>
        </div>
        <div class="row justify-content-center g-3">
            <div class="col-auto d-flex flex-column align-items-center">
                <div class="d-flex justify-content-center mb-1">
                    <img src="{{URL::asset('build/images/svg-pos/021-dinero.svg')}}" alt="" class="avatar-xs" />
                </div>
                <input type="text" class="form-control text-center mb-1 auto-select payment_method" style="max-width: 90px;" name="payment-cash" id="payment-cash" value="0.00">
                <span class="text-muted" style="font-size: 12px;">Efectivo</span>
            </div>
            <div class="col-auto d-flex flex-column align-items-center">
                <div class="d-flex justify-content-center mb-1">
                    <img src="{{URL::asset('build/images/svg-pos/006-edc.svg')}}" alt="" class="avatar-xs" />
                </div>
                <input type="text" class="form-control text-center mb-1 auto-select payment_method" style="max-width: 90px;" name="payment-card" id="payment-card" value="0.00">
                <span class="text-muted" style="font-size: 12px;">Tarjeta</span>
            </div>
            <div class="col-auto d-flex flex-column align-items-center">
                <div class="d-flex justify-content-center mb-1">
                    <img src="{{URL::asset('build/images/svg-pos/014-intercambio.svg')}}" alt="" class="avatar-xs" />
                </div>
                <input type="text" class="form-control text-center mb-1 auto-select payment_method" style="max-width: 90px;" name="payment-transfer" id="payment-transfer" value="0.00">
                <span class="text-muted" style="font-size: 12px;">Transferencia</span>
            </div>
            <div class="col-auto d-flex flex-column align-items-center">
                <div class="d-flex justify-content-center mb-1">
                    <img src="{{URL::asset('build/images/svg-pos/007-cartera.svg')}}" alt="" class="avatar-xs" />
                </div>
                <input type="text" class="form-control text-center mb-1 auto-select payment_method" style="max-width: 90px;" name="payment-voucher" id="payment-voucher" value="0.00">
                <span class="text-muted" style="font-size: 12px;">Vales</span>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-sm-6">
                <label for="colFormLabel" class="col-form-label">Referencia: </label>
                <input type="text" class="form-control form-control-sm auto-select" id="reference" name="reference" value="">
            </div>
            <div class="col-sm-6 d-flex justify-content-center align-items-center">
                <div class="d-block text-center">
                    <span class="">Cambio</span>
                    <h3 class="payment-change text-danger">$ 0.00</h3>
                </div>
            </div>
        </div>
    </div>
    <div class="pb-2 mb-3 text text-end-muted border-bottom border-light text-center">
        <div class="form-check form-radio-secondary mb-3">
            <input class="form-check-input" type="radio" name="payment_method" id="payment-credit">
            <label class="form-check-label" for="payment-credit">
                Crédito
            </label>
        </div>
        <div class="row justify-content-center g-3">
            <div class="d-flex align-items-center">
                <p class="text-muted mb-0 px-1">Proveedor:</p>
                <h6 class="name_supplier mb-0"></h6>
            </div>
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Días de crédito: </label>
                <input type="text" class="form-control text-end credit-terms auto-select" id="credit-days-limit" name="credit-days-limit" value="0" disabled readonly>
            </div>
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Limite de crédito: </label>
                <input type="text" class="form-control text-end credit-limit auto-select" id="credit-limit" name="credit-limit" value="0" disabled readonly>
            </div>
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Crédito disponible: </label>
                <input type="text" class="form-control text-end credit_available auto-select" id="credit_available" name="credit_available" value="0" disabled readonly>
            </div>
        </div>
        <div class="row justify-content-center g-3">
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Crédito: </label>
                <input type="text" class="form-control text-end current-credit auto-select" id="current-credit" name="current-credit" value="0">
            </div>
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Días de crédito: </label>
                <input type="text" class="form-control text-end credit-terms auto-select" id="credit-days" name="credit-days" value="0">
            </div>
            <div class="col-sm-4">
                <label for="colFormLabel" class="col-form-label">Fecha de Vencimiento: </label>
                <input type="date" class="form-control credit-due-date" data-provider="flatpickr" data-date-format="d M, Y" id="due-date" name="due-date" value="{{ date('Y-m-d') }}">
            </div>
        </div>
    </div>
</div>