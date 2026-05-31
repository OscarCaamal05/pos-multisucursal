<div class="row">

    <div class="col-12">

        <div class="mb-3">
            <label for="name">Nombre Completo</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('name') is-invalid @enderror"
                    name="name"
                    id="name"
                    value="{{ old('name') }}">
                <i class="ri-contacts-line"></i>
                @error('name')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-6">

        <div class="mb-3">
            <label for="tax_id">RFC</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('tax_id') is-invalid @enderror"
                    name="tax_id"
                    id="tax_id"
                    value="{{ old('tax_id') }}">
                <i class="ri-auction-line"></i>
                @error('tax_id')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-6">

        <div class="mb-3">
            <label for="phone">Telefono</label>
            <div class="form-icon">
                <input type="tel"
                    class="form-control form-control-icon @error('phone') is-invalid @enderror"
                    name="phone"
                    id="phone"
                    value="{{ old('phone') }}">
                <i class="ri-phone-line"></i>
                @error('phone')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-12">

        <div class="mb-3">
            <label for="email">Correo</label>
            <div class="form-icon">
                <input type="email"
                    class="form-control form-control-icon @error('email') is-invalid @enderror"
                    name="email"
                    id="email"
                    value="{{ old('email') }}">
                <i class="ri-mail-unread-line"></i>
                @error('email')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>
    <div class="col-12">

        <div class="mb-3">
            <label for="address">Direccion</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('address') is-invalid @enderror"
                    name="address"
                    id="address"
                    value="{{ old('address') }}">
                <i class="ri-map-pin-line"></i>
                @error('address')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>

    </div>
    <div class="col-5">

        <div class="mb-3">
            <label for="credit_limit">Credito</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('credit_limit') is-invalid @enderror"
                    name="credit_limit"
                    id="credit_limit"
                    value="{{ old('credit_limit') }}">
                <i class="ri-coins-line"></i>
                @error('credit_limit')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

        </div>

    </div>
    <div class="col-2">

        <div class="mb-3">
            <label for="default_credit_days">Días</label>
            <input type="text"
                class="form-control @error('default_credit_days') is-invalid @enderror"
                name="default_credit_days"
                id="default_credit_days"
                value="{{ old('default_credit_days', '30') }}">
            @error('default_credit_days')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror

        </div>

    </div>
    <div class="col-5">

        <div class="mb-3">
            <label for="credit_due_date">Fecha de Vencimiento</label>
            <input type="date"
                class="form-control"
                data-provider="flatpickr"
                data-date-format="d M, Y"
                id="credit_due_date"
                name="credit_due_date"
                value="{{ old('credit_due_date', date('Y-m-d', strtotime('+30 days'))) }}">
            @error('credit_due_date')
            <div class="invalid-feedback">{{ $message }}</div>
            @enderror

        </div>

    </div>

</div>