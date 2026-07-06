import { initBranchesModule } from './branchesGeneral';

// =========================================
// ENTRY POINT — document.ready
// =========================================

$(document).ready(function () {
    try {
        initBranchesModule();
        console.log('✅ branchesMain inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al inicializar branches:', error);
    }
});