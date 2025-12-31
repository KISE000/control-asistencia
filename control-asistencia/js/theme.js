/* MODO OSCURO ELIMINADO - Solo queda el modo claro por defecto */
function toggleDarkMode() {
    // Dark mode feature has been removed
}

function inicializarTema() {
    // Force clean attributes just in case
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('light-mode');
    // Optional: clear storage
    localStorage.removeItem('theme');
}

// Minimal init to clean up if someone visits with old cache
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTema);
} else {
    inicializarTema();
}
