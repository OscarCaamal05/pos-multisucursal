<div class="mb-3">
    <label for="name">Departamento</label>
    <select name="department_id" id="department_id" class="departments form-select @error('department_id') is-invalid @enderror">
        <option value="">Seleccione un departamento</option>
        @foreach ($departments as $department)
            <option value="{{ $department->id }}">
            {{ $department->name }}
        </option>
        @endforeach
    </select>
    @error('department_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>

<div class="mb-3">
    <label for="name">Nombre</label>
    <input type="text" class="form-control @error('name') is-invalid @enderror"
        name="name" id="name" value="{{ old('name') }}">
    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>

<div class="mb-3">
    <label for="description">Descripcion</label>
    <input type="text" class="form-control @error('description') is-invalid @enderror"
        name="description" id="description" value="{{ old('description') }}">
    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>