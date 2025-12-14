// === UI RENDERING & UTILS ===

/**
 * Enhanced Toast Notification System
 * @param {string} msg - Main message to display
 * @param {string} type - Type of notification: 'info', 'success', 'error', 'warning', 'loading'
 * @param {string} description - Optional description text (secondary line)
 * @param {number} duration - Duration in ms before auto-hide (0 = no auto-hide)
 * @returns {HTMLElement} - The toast element for further manipulation
 */
function showToast(msg, type = 'info', description = '', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return null;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon mapping
    let icon = 'info';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'alert-circle';
    if(type === 'warning') icon = 'alert-triangle';
    if(type === 'loading') icon = 'loader';

    // Build toast structure
    let toastHTML = `
        <div class="toast-icon">
            <i data-lucide="${icon}" style="width: 24px; height: 24px;"></i>
        </div>
        <div class="toast-body">
            <div class="toast-content">${msg}</div>
            ${description ? `<div class="toast-description">${description}</div>` : ''}
        </div>
    `;
    
    // Add progress bar for loading state
    if (type === 'loading') {
        toastHTML += '<div class="toast-progress"></div>';
    }
    
    toast.innerHTML = toastHTML;
    container.appendChild(toast);
    
    // Initialize Lucide icons
    if(window.lucide) lucide.createIcons();

    // Auto-hide logic with pause on hover
    let autoHideTimeout = null;
    
    const startAutoHide = () => {
        if (duration > 0 && type !== 'loading') {
            autoHideTimeout = setTimeout(() => {
                hideToast(toast);
            }, duration);
        }
    };
    
    const pauseAutoHide = () => {
        if (autoHideTimeout) {
            clearTimeout(autoHideTimeout);
            autoHideTimeout = null;
        }
    };
    
    // Pause on hover, resume on leave
    toast.addEventListener('mouseenter', pauseAutoHide);
    toast.addEventListener('mouseleave', startAutoHide);
    
    // Start auto-hide
    startAutoHide();
    
    // Store toast ID for reference
    toast.toastId = Date.now();
    
    return toast;
}

/**
 * Hide and remove a toast notification
 */
function hideToast(toast) {
    if (!toast || !toast.parentElement) return;
    
    toast.style.animation = 'slideOut 0.3s forwards cubic-bezier(0.4, 0, 1, 1)';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 300);
}

/**
 * Show a loading toast that persists until manually closed
 * Returns an object with update and close methods
 */
function showLoadingToast(msg, description = '') {
    const toast = showToast(msg, 'loading', description, 0); // Duration 0 = no auto-hide
    
    return {
        // Update the toast message
        update: (newMsg, newDescription = '') => {
            if (!toast || !toast.parentElement) return;
            
            const contentEl = toast.querySelector('.toast-content');
            const descEl = toast.querySelector('.toast-description');
            
            if (contentEl) contentEl.textContent = newMsg;
            
            if (newDescription && descEl) {
                descEl.textContent = newDescription;
            } else if (newDescription && !descEl) {
                const body = toast.querySelector('.toast-body');
                const desc = document.createElement('div');
                desc.className = 'toast-description';
                desc.textContent = newDescription;
                body.appendChild(desc);
            }
        },
        
        // Close the loading toast and optionally show a new one
        close: (finalMsg = '', finalType = 'success', finalDescription = '') => {
            if (toast && toast.parentElement) {
                hideToast(toast);
                
                if (finalMsg) {
                    // Small delay to ensure smooth transition
                    setTimeout(() => {
                        showToast(finalMsg, finalType, finalDescription);
                    }, 200);
                }
            }
        },
        
        // Get the toast element reference
        element: toast
    };
}

// Alias para compatibilidad
const mostrarNotificacion = showToast; 

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return "Hace " + Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return "Hace " + Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return "Hace " + Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return "Hace " + Math.floor(interval) + " h";
    interval = seconds / 60;
    if (interval > 1) return "Hace " + Math.floor(interval) + " min";
    return "Hace un momento";
}

// === RENDERIZADO ===

function renderEmpleados() {
    const grid = document.getElementById('empleadosGrid');
    if (!grid) return;
    if (empleados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="empty-state-icon">
                    <i data-lucide="users" style="width:80px; height:80px;"></i>
                </div>
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: 8px;">Lista de empleados vacía</p>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Agrega tu primer empleado para comenzar</p>
            </div>`;
        actualizarEstadisticas();
        if(window.lucide) lucide.createIcons();
        return;
    }
    
    grid.innerHTML = empleados.map(emp => {
        // Generate avatar
        const avatar = typeof generateAvatar === 'function' ? generateAvatar(emp.nombre) : { initials: emp.nombre.substring(0, 2).toUpperCase(), colorClass: 'avatar-color-1' };
        
        return `
        <div class="empleado-card fade-in">
            <div class="card-left">
                <div class="employee-avatar ${avatar.colorClass}">
                    ${avatar.initials}
                </div>
                <input type="checkbox" class="card-checkbox" ${emp.seleccionado ? 'checked' : ''} onchange="toggleSeleccionEmpleado(${emp.id})">
                <div class="empleado-nombre">${emp.nombre}</div>
            </div>
            <div class="card-actions">
                <button class="btn-action-mini" onclick="editarNombre(${emp.id})" title="Editar">
                    <i data-lucide="pencil" style="width:14px;"></i>
                </button>
                <button class="btn-action-mini btn-delete" onclick="eliminarEmpleado(${emp.id})" title="Eliminar">
                    <i data-lucide="trash-2" style="width:14px;"></i>
                </button>
            </div>
        </div>`;
    }).join('');
    
    if(window.lucide) lucide.createIcons();
    actualizarEstadisticas();
}

function renderFeriados() {
    const lista = document.getElementById('listaFeriados');
    if (!lista) return;
    lista.innerHTML = feriados.length ? feriados.map(f => `
        <div style="background:#eff6ff; color:var(--primary); padding:4px 10px; border-radius:12px; font-size:0.8rem; display:flex; align-items:center; gap:6px; border:1px solid var(--primary-light);">
            <span style="font-weight:600;">${formatearFechaCorta(f.fecha)}</span> ${f.descripcion}
            <button onclick="eliminarFeriado('${f.fecha}')" style="background:none; border:none; cursor:pointer; color:var(--primary); opacity:0.6; display:flex;">
                <i data-lucide="x" style="width:14px;"></i>
            </button>
        </div>
    `).join('') : '';
    
    const msg = document.getElementById('emptyFeriadosMsg');
    if(msg) msg.style.display = feriados.length ? 'none' : 'block';
    if(window.lucide) lucide.createIcons();
}

function renderLogo() {
    const preview = document.getElementById('logoPreview');
    const container = document.getElementById('logoPreviewContainer');
    const btnEliminar = document.getElementById('btnEliminarLogo');
    
    if (!preview) return;
    
    if (logoData) {
        preview.src = logoData; preview.style.display = 'block';
        if(container.querySelector('.text-placeholder')) container.querySelector('.text-placeholder').style.display = 'none';
        if(btnEliminar) btnEliminar.style.display = 'flex';
    } else {
        preview.src = ''; preview.style.display = 'none';
        if(container.querySelector('.text-placeholder')) container.querySelector('.text-placeholder').style.display = 'flex';
        if(btnEliminar) btnEliminar.style.display = 'none';
    }
}

function actualizarEstadisticas() {
    document.getElementById('totalEmpleados').textContent = empleados.length;
    document.getElementById('totalSeleccionados').textContent = empleados.filter(e => e.seleccionado).length;
}

function formatearFechaCorta(s) { const p=s.split('-'); return `${p[2]}/${p[1]}`; }

// === DRAG AND DROP ===

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const input = document.getElementById('archivoInput');

    if (!dropZone) return;

    dropZone.addEventListener('click', () => input.click());

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault(); e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault(); e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            input.files = files;
            mostrarNombreArchivo();
        }
    });
}

function mostrarNombreArchivo() {
    const input = document.getElementById('archivoInput');
    const preview = document.getElementById('filePreview');
    const nameDisplay = document.getElementById('fileNameDisplay');
    
    if (input.files.length > 0) {
        preview.style.display = 'inline-flex';
        nameDisplay.textContent = input.files[0].name;
    }
}

function limpiarSeleccionArchivo() {
    const input = document.getElementById('archivoInput');
    input.value = '';
    document.getElementById('filePreview').style.display = 'none';
}

