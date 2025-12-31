// ===================================================
// ENHANCED UI FUNCTIONALITY
// Módulo de mejoras visuales y animaciones
// ===================================================

/**
 * Constantes de configuración para mejoras UI
 */
const ENHANCED_CONFIG = {
    COUNTER_DURATION: 800, // ms para animación de contadores
    RIPPLE_DURATION: 600, // ms para efecto ripple
    FADE_DELAY: 50, // ms entre animaciones stagger
    AVATAR_COLORS: [
        'avatar-color-1',
        'avatar-color-2', 
        'avatar-color-3',
        'avatar-color-4',
        'avatar-color-5',
        'avatar-color-6'
    ]
};

/**
 * Inicializa el modo de tema
 * Por defecto usa modo claro
 * @returns {void}
 */
function initDarkMode() {
    // Permitir modo claro por defecto
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
}

/**
 * Anima un contador desde 0 hasta un valor objetivo
 * @param {HTMLElement} element - Elemento que contiene el número
 * @param {number} target - Valor objetivo
 * @param {number} [duration=800] - Duración de la animación en ms
 * @returns {void}
 */
function animateCounter(element, target, duration = ENHANCED_CONFIG.COUNTER_DURATION) {
    if (!element || typeof target !== 'number' || isNaN(target)) return;
    
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Inicializa animación de contadores cuando son visibles
 * @returns {void}
 */
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    if (!counters.length) return;
    
    // Usar IntersectionObserver si está disponible
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.textContent, 10);
                    
                    if (!isNaN(target)) {
                        counter.textContent = '0';
                        animateCounter(counter, target, ENHANCED_CONFIG.COUNTER_DURATION);
                    }
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
}

/**
 * Genera iniciales y color de avatar basado en el nombre
 * @param {string} name - Nombre del usuario
 * @returns {{initials: string, colorClass: string}} Objeto con iniciales y clase de color
 */
function generateAvatar(name) {
    // Validar entrada
    if (!name || typeof name !== 'string') {
        return { initials: '??', colorClass: ENHANCED_CONFIG.AVATAR_COLORS[0] };
    }
    
    // Generar iniciales (máximo 2 caracteres)
    const initials = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    // Generar color consistente basado en el nombre
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = ENHANCED_CONFIG.AVATAR_COLORS[hash % ENHANCED_CONFIG.AVATAR_COLORS.length];
    
    return { initials: initials || '??', colorClass };
}

/**
 * Agrega efecto ripple a un botón
 * @param {HTMLElement} button - Elemento botón
 * @param {MouseEvent} event - Evento del click
 * @returns {void}
 */
function addRippleEffect(button, event) {
    if (!button || !event) return;
    
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: ripple ${ENHANCED_CONFIG.RIPPLE_DURATION}ms ease-out;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, ENHANCED_CONFIG.RIPPLE_DURATION);
}

// Agregar ripple a botones primarios
document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-primary, .btn-hero');
    if (button) {
        addRippleEffect(button, e);
    }
}, true);

/**
 * Inicializa animaciones de fade-in al scroll
 * @returns {void}
 */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.card, .stat-card');
    
    if (!elements.length || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.animation = 'fadeInUp 0.5s ease forwards';
                }, index * ENHANCED_CONFIG.FADE_DELAY);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/**
 * Inicializa scroll suave para enlaces de ancla
 * @returns {void}
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Muestra un estado de carga skeleton en un contenedor
 * @param {HTMLElement} container - Contenedor donde mostrar el skeleton
 * @param {number} [rows=3] - Número de filas skeleton
 * @returns {void}
 */
function showLoading(container, rows = 3) {
    if (!container) return;
    
    const skeleton = `
        <div class="skeleton-row">
            <div class="skeleton-icon"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                <div class="skeleton-line" style="width: 60%"></div>
                <div class="skeleton-line" style="width: 40%"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = skeleton.repeat(rows);
}

// Inyectar estilos de animaciones
(function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes ripple {
            from {
                opacity: 1;
                transform: scale(0);
            }
            to {
                opacity: 0;
                transform: scale(2);
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes checkBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
})();

/**
 * Mejora los checkboxes con animaciones
 * @returns {void}
 */
function enhanceCheckboxes() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.dataset.enhanced) return;
        
        checkbox.dataset.enhanced = 'true';
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                this.style.animation = 'checkBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                setTimeout(() => {
                    this.style.animation = '';
                }, 300);
            }
        });
    });
}

/**
 * Inicializa efecto parallax sutil (opcional)
 * @returns {void}
 */
function initParallax() {
    const parallaxElements = document.querySelectorAll('.stat-icon-wrapper');
    
    if (!parallaxElements.length) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach((el, index) => {
            const speed = 0.05 * (index + 1);
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }, { passive: true });
}

/**
 * Inicializa todas las mejoras UI
 * @returns {void}
 */
function initEnhancements() {
    try {
        initDarkMode();
        initCounters();
        initScrollAnimations();
        initSmoothScroll();
        enhanceCheckboxes();
        // initParallax(); // Descomentar si se quiere efecto parallax
    } catch (error) {
        console.error('Error inicializando mejoras UI:', error);
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
    initEnhancements();
}

// Re-mejorar checkboxes cuando se renderiza nuevo contenido
const originalRenderEmpleados = window.renderEmpleados;
if (originalRenderEmpleados) {
    window.renderEmpleados = function() {
        const result = originalRenderEmpleados.apply(this, arguments);
        
        // Esperar a que el DOM se actualice
        setTimeout(() => {
            enhanceCheckboxes();
            initCounters();
        }, 50);
        
        return result;
    };
}
