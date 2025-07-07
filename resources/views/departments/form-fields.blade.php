<div class="mb-3">
    <label for="department_name">Nombre</label>
    <input type="text" class="form-control @error('department_name') is-invalid @enderror"
        name="department_name" id="department_name" value="{{ old('department_name') }}">
    @error('department_name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>

<div class="mb-3">
    <label for="department_description">Descripcion</label>
    <input type="text" class="form-control @error('department_description') is-invalid @enderror"
        name="department_description" id="department_description" value="{{ old('department_description') }}">
    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>