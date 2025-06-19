
<div class="mb-3">
    <label for="name">Nombre</label>
    <input type="text" class="form-control @error('name') is-invalid @enderror"
        name="name" id="name" value="{{ old('name', $product->name ?? '') }}">
    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
</div>