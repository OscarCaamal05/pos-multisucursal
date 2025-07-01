<!-- ========== App Menu ========== -->
<div class="app-menu navbar-menu">
    <!-- LOGO -->
    <div class="navbar-brand-box">
        <!-- Dark Logo-->
        <a href="index" class="logo logo-dark">
            <span class="logo-sm">
                <img src="{{ URL::asset('build/images/logo-sm.png') }}" alt="" height="22">
            </span>
            <span class="logo-lg">
                <img src="{{ URL::asset('build/images/logo-dark.png') }}" alt="" height="17">
            </span>
        </a>
        <!-- Light Logo-->
        <a href="index" class="logo logo-light">
            <span class="logo-sm">
                <img src="{{ URL::asset('build/images/logo-sm.png') }}" alt="" height="22">
            </span>
            <span class="logo-lg">
                <img src="{{ URL::asset('build/images/logo-light.png') }}" alt="" height="17">
            </span>
        </a>
        <button type="button" class="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover">
            <i class="ri-record-circle-line"></i>
        </button>
    </div>

    <div id="scrollbar">
        <div class="container-fluid">

            <div id="two-column-menu">
            </div>
            <ul class="navbar-nav" id="navbar-nav">
                <li class="menu-title"><span>@lang('translation.menu')</span></li>
                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarDashboards"
                        aria-expanded="false" aria-controls="sidebarDashboards">
                        <i class="bx bxs-dashboard"></i> <span>Panel de control</span>
                    </a>
                </li> <!-- end Dashboard Menu -->

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarVentas" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarVentas">
                        <i class="bx bx-layout"></i> <span>Ventas</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarVentas">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="layouts-vertical" class="nav-link">Realizar Venta</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Reportes Ventas</a>
                            </li>
                        </ul>
                    </div>
                </li> <!-- end Dashboard Menu -->

                <li class="menu-title"><i class="ri-more-fill"></i> <span>@lang('translation.pages')</span></li>

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarCompras" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarCompras">
                        <i class="bx bx-layout"></i> <span>Compras</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarCompras">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="layouts-vertical" class="nav-link">Realizar Compra</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Reportes Compras</a>
                            </li>
                        </ul>
                    </div>
                </li>

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarInventario" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarInventario">
                        <i class="bx bx-layout"></i> <span>Inventario</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarInventario">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="{{ route('departments.index') }}" class="nav-link">Departamentos</a>
                            </li>
                            <li class="nav-item">
                                <a href="{{ route('categories.index') }}" class="nav-link">Categorias</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Productos</a>
                            </li>
                        </ul>
                    </div>
                </li>

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarClientes" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarClientes">
                        <i class="bx bx-layout"></i> <span>Clientes</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarClientes">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="{{ route('customers.index') }}" class="nav-link">Lista de Clientes</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Historial Crediticio</a>
                            </li>
                        </ul>
                    </div>
                </li>

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarProveedores" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarProveedores">
                        <i class="bx bx-layout"></i> <span>Proveedores</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarProveedores">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="{{ route('suppliers.index') }}" class="nav-link">Lista de Proveedores</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Historial Crediticio</a>
                            </li>
                        </ul>
                    </div>
                </li>

                <li class="nav-item">
                    <a class="nav-link menu-link" href="#sidebarCajas" data-bs-toggle="collapse" role="button"
                        aria-expanded="false" aria-controls="sidebarCajas">
                        <i class="bx bx-layout"></i> <span>Cajas</span>
                    </a>
                    <div class="collapse menu-dropdown" id="sidebarCajas">
                        <ul class="nav nav-sm flex-column">
                            <li class="nav-item">
                                <a href="layouts-vertical" class="nav-link">Lista de Cajas</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Registrar movimientos</a>
                            </li>
                            <li class="nav-item">
                                <a href="layouts-detached" class="nav-link">Reporte de movimiento</a>
                            </li>
                        </ul>
                    </div>
                </li>
            </ul>
        </div>
        <!-- Sidebar -->
    </div>
    <div class="sidebar-background"></div>
</div>
<!-- Left Sidebar End -->
<!-- Vertical Overlay-->
<div class="vertical-overlay"></div>