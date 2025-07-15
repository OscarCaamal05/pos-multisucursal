<div class="row ">
    <div class="col-sm-10   ">
        <div class="mb-3">
            <select name="department_id" id="department_id" class="departments form-select @error('department_id') is-invalid @enderror">
                <option value="">Seleccione un departamento</option>
                @foreach ($departments as $department)
                <option value="{{ $department->id }}">
                    {{ $department->department_name }}
                </option>
                @endforeach
            </select>
            @error('department_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
        </div>
    </div>
    <div class="col-sm-2">
        <button type="button" class="btn btn-light btn-icon waves-effect" id="btn-modal-department"><i class="bx bx-plus-medical"></i></button>
    </div>
</div>


<div class="mb-3">
    <label for="category_name">Nombre</label>
    <input type="text" class="form-control @error('category_name') is-invalid @enderror"
        name="category_name" id="category_name" value="{{ old('category_name') }}">
    @error('category_name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>

<div class="mb-3">
    <label for="category_description">Descripcion</label>
    <input type="text" class="form-control @error('category_description') is-invalid @enderror"
        name="category_description" id="category_description" value="{{ old('category_description') }}">
    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>