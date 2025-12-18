// === UI RENDERING & UTILS ===

/**
 * CONTROL DE NOTIFICACIONES (Campana y Status Bar)
 * Reemplaza al antiguo sistema de Toast.
 */

let notifications = [];
let isNotificationOpen = false;

/**
 * Limpia notificaciones que tengan más de 1 minuto de antigüedad automaticamente.
 */
function cleanExpiredNotifications() {
    const ONE_MINUTE = 60 * 1000;
    const now = Date.now();
    const initialCount = notifications.length;
    
    notifications = notifications.filter(n => {
        const timestamp = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp).getTime();
        const diff = now - timestamp;
        return diff < ONE_MINUTE;
    });
    
    // Si hubo cambios, actualizar UI
    if (notifications.length !== initialCount) {
        updateNotificationBadge();
        renderNotifications();
    }
}

// Iniciar limpieza automática cada 10 segundos
setInterval(cleanExpiredNotifications, 10000);

// Inicialización de event listeners
document.addEventListener('click', (e) => {
    const container = document.querySelector('.notification-container');
    const dropdown = document.getElementById('notificationDropdown');
    
    // Cerrar si clic fuera
    if(isNotificationOpen && container && !container.contains(e.target)) {
        isNotificationOpen = false;
        dropdown.style.display = 'none';
    }
});

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if(!dropdown) return;
    
    isNotificationOpen = !isNotificationOpen;
    dropdown.style.display = isNotificationOpen ? 'block' : 'none';
    
    if(isNotificationOpen) {
        // Marcar como vistas (visual) o lógica adicional si se requiere
    }
}

/**
 * Muestra notificación en la lista de la campana.
 * @param {string} msg - Título principal
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {string} description - Texto secundario
 */
function showToast(msg, type = 'info', description = '') {
    // Si es loading, delegamos a showLoadingToast (por compatibilidad si alguien llama showToast con 'loading')
    if(type === 'loading') {
        return showLoadingToast(msg, description);
    }

    // Evitar duplicados recientes (Debounce de 2 segundos para mismo mensaje)
    if (notifications.length > 0) {
        const last = notifications[0];
        const now = new Date();
        const lastTime = last.timestamp instanceof Date ? last.timestamp : new Date(last.timestamp);
        const timeDiff = now - lastTime;
        
        if (last.msg === msg && timeDiff < 2000) {
            console.log('🚫 Notificación duplicada prevenida:', msg);
            return null;
        }
    }

    const newNotif = {
        id: Date.now(),
        msg,
        type,
        description,
        timestamp: new Date()
    };
    
    // Reemplazamos toda la lista con la nueva notificación (SOLO UNA)
    notifications = [newNotif];
    updateNotificationBadge();
    renderNotifications();
    playNotificationSound(type);

    return null; // Ya no retornamos elemento DOM
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if(!badge) return;
    
    const count = notifications.length;
    if(count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if(!list) return;
    
    if(notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-notifications">
                <i data-lucide="bell" style="opacity:0.3; width:32px;"></i>
                <p>No tienes notificaciones recientes</p>
            </div>
        `;
    } else {
        list.innerHTML = notifications.map(n => `
            <div class="notification-item unread">
                <div class="notif-icon ${n.type}">
                    <i data-lucide="${getIconForType(n.type)}" style="width:16px;"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${n.msg}</div>
                    ${n.description ? `<div class="notif-desc">${n.description}</div>` : ''}
                    <span class="notif-time">${timeAgo(n.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }
    
    if(window.lucide) lucide.createIcons();
}

function getIconForType(type) {
    if(type === 'success') return 'check';
    if(type === 'error') return 'x-circle';
    if(type === 'warning') return 'alert-triangle';
    return 'info';
}

function limpiarNotificaciones() {
    notifications = [];
    updateNotificationBadge();
    renderNotifications();
    playNotificationSound('clear');
}

function playNotificationSound(type) {
    // Opcional: Sonido sutil
}

/**
 * Muestra indicador de carga en la barra superior.
 * Reemplaza al toast persistente de loading.
 */
function showLoadingToast(msg, description = '') {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    if(indicator && text) {
        text.textContent = msg;
        indicator.style.display = 'flex';
    }
    
    return {
        update: (newMsg, newDesc) => {
            if(text) text.textContent = newMsg;
        },
        close: (finalMsg, finalType, finalDesc) => {
            if(indicator) indicator.style.display = 'none';
            if(finalMsg) {
                showToast(finalMsg, finalType || 'success', finalDesc);
            }
        },
        element: null
    };
}

// Compatibilidad con código antiguo que intente borrar el toast manualmente
function hideToast(toast) {
    // No-op
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

