<div class="row">

    <div class="col-12">

        <div class="mb-3">
            <label for="representative">Representante</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('representative') is-invalid @enderror"
                    name="representative"
                    id="representative"
                    value="{{ old('representative') }}">
                <i class="ri-contacts-line"></i>
                @error('representative')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-12">

        <div class="mb-3">
            <label for="company_name">Empresa</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('company_name') is-invalid @enderror"
                    name="company_name"
                    id="company_name"
                    value="{{ old('company_name') }}">
                <i class="ri-booklet-line"></i>
                @error('company_name')
                <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>
        </div>

    </div>

    <div class="col-6">

        <div class="mb-3">
            <label for="rfc">RFC</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('rfc') is-invalid @enderror"
                    name="rfc"
                    id="rfc"
                    value="{{ old('rfc') }}">
                <i class="ri-auction-line"></i>
                @error('rfc')
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

    <div class="col-8">

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
    <div class="col-4">

        <div class="mb-3">
            <label for="credit_available">Credito</label>
            <div class="form-icon">
                <input type="text"
                    class="form-control form-control-icon @error('credit_available') is-invalid @enderror"
                    name="credit_available"
                    id="credit_available"
                    value="{{ old('credit_available') }}">
                <i class="ri-coins-line"></i>
                @error('credit_available')
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

</div>
