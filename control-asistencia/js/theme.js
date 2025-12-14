// === THEME HANDLING ===

function toggleDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    // Si la referencia es dark por defecto en CSS, toggling activa 'light-mode'
    // O si es 'dark-mode', depende de la implementación.
    // Asumiremos que el CSS actual es DARK por defecto.
    // Así que el toggle activado = Dark Mode (default). Desactivado = Light Mode.
    
    if (toggle) {
        if (toggle.checked) {
            document.body.classList.remove('light-mode');
            localStorage.setItem(APP_CONSTANTS.KEYS.THEME, 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem(APP_CONSTANTS.KEYS.THEME, 'light');
        }
        
        // Actualizar icono si existe
        const icon = document.getElementById('themeIcon');
        if(icon) {
            if(window.lucide) {
                icon.setAttribute('data-lucide', toggle.checked ? 'moon' : 'sun');
                lucide.createIcons();
            }
        }
    }
}

function inicializarTema() {
    const savedTheme = localStorage.getItem(APP_CONSTANTS.KEYS.THEME);
    const toggle = document.getElementById('darkModeToggle');
    
    // Default a Dark si no hay guardado, o respetar guardado
    const isLight = savedTheme === 'light';
    
    if (isLight) {
        document.body.classList.add('light-mode');
        if (toggle) toggle.checked = false;
    } else {
        document.body.classList.remove('light-mode');
        if (toggle) toggle.checked = true;
    }
    
    // Icono
    const icon = document.getElementById('themeIcon');
    if(icon && window.lucide) {
        icon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
        lucide.createIcons();
    }
}

// Auto-init si el DOM ya cargó
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inicializarTema();
} else {
    document.addEventListener('DOMContentLoaded', inicializarTema);
}
