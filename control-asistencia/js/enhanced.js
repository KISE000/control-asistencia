// ===================================================
// ENHANCED UI FUNCTIONALITY
// ===================================================

/**
 * Dark Mode Toggle
 */
function initDarkMode() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Animate the transition
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

/**
 * Counter Animation for Stats
 */
function animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        if (!isNaN(target)) {
            counter.textContent = '0';
            // Start animation when visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(counter, target, 800);
                        observer.unobserve(counter);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(counter);
        }
    });
}

/**
 * Generate Avatar Initials and Color
 */
function generateAvatar(name) {
    const initials = name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    
    // Generate consistent color based on name
    const colors = ['avatar-color-1', 'avatar-color-2', 'avatar-color-3', 'avatar-color-4', 'avatar-color-5', 'avatar-color-6'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { initials, colorClass };
}

/**
 * Add Ripple Effect to Buttons
 */
function addRippleEffect(button, event) {
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
        animation: ripple 0.6s ease-out;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Add ripple to all buttons
document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-primary, .btn-hero');
    if (button) {
        addRippleEffect(button, e);
    }
}, true);

/**
 * Fade In Animation on Scroll
 */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.card, .stat-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.animation = 'fadeInUp 0.5s ease forwards';
                }, index * 50); // Stagger animation
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
 * Smooth Scroll for Anchors
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Loading State Helper
 */
function showLoading(container) {
    const skeleton = `
        <div class="skeleton-row">
            <div class="skeleton-icon"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                <div class="skeleton-line" style="width: 60%"></div>
                <div class="skeleton-line" style="width: 40%"></div>
            </div>
        </div>
    `.repeat(3);
    
    container.innerHTML = skeleton;
}

/**
 * Toast with Better Animations
 */
const originalShowToast = window.showToast;
if (originalShowToast) {
    window.showToast = function(message, type = 'info') {
        const result = originalShowToast(message, type);
        
        // Add entrance animation
        const toasts = document.querySelectorAll('.toast, [class*="toast"]');
        const lastToast = toasts[toasts.length - 1];
        if (lastToast) {
            lastToast.style.animation = 'slideInRight 0.3s ease';
        }
        
        return result;
    };
}

// Add slideInRight animation
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
`;
document.head.appendChild(style);

/**
 * Enhanced Checkbox Handler
 */
function enhanceCheckboxes() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (!checkbox.dataset.enhanced) {
            checkbox.dataset.enhanced = 'true';
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    this.style.animation = 'checkBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    setTimeout(() => {
                        this.style.animation = '';
                    }, 300);
                }
            });
        }
    });
}

/**
 * Parallax Effect on Scroll (subtle)
 */
function initParallax() {
    const parallaxElements = document.querySelectorAll('.stat-icon-wrapper');
    
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
 * Initialize all enhancements
 */
function initEnhancements() {
    initDarkMode();
    initCounters();
    initScrollAnimations();
    initSmoothScroll();
    enhanceCheckboxes();
    // initParallax(); // Uncomment if you want parallax effect
    
    console.log('🎨 UI Enhancements initialized');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
    initEnhancements();
}

// Re-enhance checkboxes when new content is added
const originalRenderEmpleados = window.renderEmpleados;
if (originalRenderEmpleados) {
    window.renderEmpleados = function() {
        const result = originalRenderEmpleados.apply(this, arguments);
        setTimeout(() => {
            enhanceCheckboxes();
            initCounters();
        }, 50);
        return result;
    };
}
