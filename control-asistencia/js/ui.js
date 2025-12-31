// === UI RENDERING & UTILS ===

/**
 * CONTROL DE NOTIFICACIONES (Campana y Status Bar)
 * Sistema de notificaciones mejorado con debounce y limpieza automática.
 */

// === ESTADO DE NOTIFICACIONES ===
let notifications = [];
let isNotificationOpen = false;

// === CONSTANTES ===
const NOTIFICATION_CONSTANTS = {
    EXPIRY_TIME: 60 * 1000, // 1 minuto
    CLEANUP_INTERVAL: 10000, // 10 segundos
    DEBOUNCE_TIME: 2000, // 2 segundos para evitar duplicados
    MAX_NOTIFICATIONS: 10
};

// === TIPOS DE ICONOS ===
const NOTIFICATION_ICONS = {
    success: 'check',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info',
    loading: 'loader'
};

/**
 * Limpia notificaciones que tengan más de 1 minuto de antigüedad
 * @returns {void}
 */
function cleanExpiredNotifications() {
    const now = Date.now();
    const initialCount = notifications.length;
    
    notifications = notifications.filter(notification => {
        const timestamp = notification.timestamp instanceof Date 
            ? notification.timestamp.getTime() 
            : new Date(notification.timestamp).getTime();
        
        if (isNaN(timestamp)) return false;
        
        return (now - timestamp) < NOTIFICATION_CONSTANTS.EXPIRY_TIME;
    });
    
    // Solo actualizar UI si hubo cambios
    if (notifications.length !== initialCount) {
        updateNotificationBadge();
        renderNotifications();
    }
}

// Iniciar limpieza automática
setInterval(cleanExpiredNotifications, NOTIFICATION_CONSTANTS.CLEANUP_INTERVAL);

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    const container = document.querySelector('.notification-container');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (isNotificationOpen && container && dropdown && !container.contains(e.target)) {
        isNotificationOpen = false;
        dropdown.style.display = 'none';
    }
});

/**
 * Alterna la visibilidad del panel de notificaciones
 * @returns {void}
 */
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;
    
    isNotificationOpen = !isNotificationOpen;
    dropdown.style.display = isNotificationOpen ? 'block' : 'none';
}

/**
 * Muestra una notificación en el sistema
 * @param {string} msg - Título de la notificación
 * @param {string} [type='info'] - Tipo: 'success', 'error', 'info', 'warning', 'loading'
 * @param {string} [description=''] - Descripción adicional
 * @returns {Object|null} Objeto con métodos update y close para loading, null para otros
 */
function showToast(msg, type = 'info', description = '') {
    // Validar entrada
    if (!msg || typeof msg !== 'string') {
        console.warn('showToast: mensaje inválido');
        return null;
    }
    
    // Sanitizar mensaje (básico)
    const sanitizedMsg = msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedDesc = description.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Si es loading, delegamos a showLoadingToast
    if (type === 'loading') {
        return showLoadingToast(sanitizedMsg, sanitizedDesc);
    }

    // Evitar duplicados recientes (Debounce)
    if (notifications.length > 0) {
        const last = notifications[0];
        const now = Date.now();
        const lastTime = last.timestamp instanceof Date 
            ? last.timestamp.getTime() 
            : new Date(last.timestamp).getTime();
        const timeDiff = now - lastTime;
        
        if (last.msg === sanitizedMsg && timeDiff < NOTIFICATION_CONSTANTS.DEBOUNCE_TIME) {
            return null;
        }
    }

    const newNotification = {
        id: Date.now(),
        msg: sanitizedMsg,
        type: type,
        description: sanitizedDesc,
        timestamp: new Date()
    };
    
    // Mantener solo la notificación más reciente (o cambiar a unshift para historial)
    notifications = [newNotification];
    
    // Limitar cantidad máxima
    if (notifications.length > NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS) {
        notifications = notifications.slice(0, NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS);
    }
    
    updateNotificationBadge();
    renderNotifications();
    playNotificationSound(type);

    return null;
}

/**
 * Actualiza el badge de contador de notificaciones
 * @returns {void}
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const count = notifications.length;
    
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Renderiza la lista de notificaciones en el dropdown
 * @returns {void}
 */
function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-notifications">
                <i data-lucide="bell" style="opacity:0.3; width:32px;"></i>
                <p>No tienes notificaciones recientes</p>
            </div>
        `;
    } else {
        list.innerHTML = notifications.map(notification => `
            <div class="notification-item unread">
                <div class="notif-icon ${notification.type}">
                    <i data-lucide="${getIconForType(notification.type)}" style="width:16px;"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${notification.msg}</div>
                    ${notification.description ? `<div class="notif-desc">${notification.description}</div>` : ''}
                    <span class="notif-time">${timeAgo(notification.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }
    
    // Re-renderizar iconos de Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
}

/**
 * Obtiene el nombre del icono según el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} Nombre del icono de Lucide
 */
function getIconForType(type) {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;
}

/**
 * Limpia todas las notificaciones
 * @returns {void}
 */
function limpiarNotificaciones() {
    notifications = [];
    updateNotificationBadge();
    renderNotifications();
}

/**
 * Reproduce un sonido de notificación (placeholder)
 * @param {string} type - Tipo de notificación
 * @returns {void}
 */
function playNotificationSound(type) {
    // Implementación opcional de sonidos
    // Se puede agregar usando Web Audio API si se requiere
}

/**
 * Muestra un indicador de carga en la barra superior
 * @param {string} msg - Mensaje de carga
 * @param {string} [description=''] - Descripción adicional
 * @returns {Object} Objeto con métodos update, close y element
 */
function showLoadingToast(msg, description = '') {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    if (indicator && text) {
        text.textContent = msg || 'Cargando...';
        indicator.style.display = 'flex';
    }
    
    return {
        /**
         * Actualiza el mensaje de carga
         * @param {string} newMsg - Nuevo mensaje
         * @param {string} [newDesc] - Nueva descripción (no usado actualmente)
         */
        update: (newMsg, newDesc) => {
            if (text) text.textContent = newMsg || 'Cargando...';
        },
        
        /**
         * Cierra el indicador de carga y muestra un mensaje final
         * @param {string} [finalMsg] - Mensaje final
         * @param {string} [finalType='success'] - Tipo del mensaje final
         * @param {string} [finalDesc] - Descripción del mensaje final
         */
        close: (finalMsg, finalType, finalDesc) => {
            if (indicator) indicator.style.display = 'none';
            if (finalMsg) {
                showToast(finalMsg, finalType || 'success', finalDesc || '');
            }
        },
        
        element: null
    };
}

/**
 * Oculta un toast (compatibilidad con código antiguo)
 * @param {HTMLElement} toast - Elemento toast a ocultar
 * @returns {void}
 * @deprecated Esta función es un no-op para compatibilidad
 */
function hideToast(toast) {
    // No-op para compatibilidad con código antiguo
}

// Alias para compatibilidad
const mostrarNotificacion = showToast;

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {Date|string|number} date - Fecha a comparar
 * @returns {string} Texto descriptivo del tiempo transcurrido
 */
function timeAgo(date) {
    // Validación de entrada
    if (!date) return "Fecha desconocida";
    
    // Convertir a Date si es necesario
    let dateObj;
    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'number') {
        dateObj = new Date(date);
    } else {
        dateObj = new Date(date);
    }
    
    // Verificar fecha válida
    if (isNaN(dateObj.getTime())) {
        return "Fecha inválida";
    }
    
    const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
    
    if (seconds < 0) return "En el futuro";
    if (seconds < 60) return "Hace un momento";
    
    const intervals = [
        { seconds: 31536000, label: 'año', labelPlural: 'años' },
        { seconds: 2592000, label: 'mes', labelPlural: 'meses' },
        { seconds: 86400, label: 'día', labelPlural: 'días' },
        { seconds: 3600, label: 'h', labelPlural: 'h' },
        { seconds: 60, label: 'min', labelPlural: 'min' }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            const label = count === 1 ? interval.label : interval.labelPlural;
            return `Hace ${count} ${label}`;
        }
    }
    
    return "Hace un momento";
}

// === RENDERIZADO ===

/**
 * Renderiza la lista de empleados en el grid
 * @returns {void}
 */
function renderEmpleados() {
    const grid = document.getElementById('empleadosGrid');
    if (!grid) return;
    
    if (!Array.isArray(empleados) || empleados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="empty-state-icon">
                    <i data-lucide="users" style="width:80px; height:80px;"></i>
                </div>
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--text); margin-bottom: 8px;">Lista de empleados vacía</p>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Agrega tu primer empleado para comenzar</p>
            </div>`;
        actualizarEstadisticas();
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    // Usar DocumentFragment para mejor performance
    const fragment = document.createDocumentFragment();
    const tempContainer = document.createElement('div');
    
    tempContainer.innerHTML = empleados.map(emp => {
        // Generar avatar de forma segura
        const avatar = typeof generateAvatar === 'function' 
            ? generateAvatar(emp.nombre) 
            : { 
                initials: (emp.nombre || 'XX').substring(0, 2).toUpperCase(), 
                colorClass: 'avatar-color-1' 
            };
        
        // Escapar HTML en el nombre
        const nombreEscapado = (emp.nombre || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return `
        <div class="empleado-card fade-in">
            <div class="card-left">
                <div class="employee-avatar ${avatar.colorClass}">
                    ${avatar.initials}
                </div>
                <input type="checkbox" class="card-checkbox" ${emp.seleccionado ? 'checked' : ''} onchange="toggleSeleccionEmpleado(${emp.id})">
                <div class="empleado-nombre">${nombreEscapado}</div>
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
    
    grid.innerHTML = tempContainer.innerHTML;
    
    if (window.lucide) lucide.createIcons();
    actualizarEstadisticas();
}

/**
 * Renderiza la lista de feriados
 * @returns {void}
 */
function renderFeriados() {
    const lista = document.getElementById('listaFeriados');
    if (!lista) return;
    
    if (!Array.isArray(feriados) || feriados.length === 0) {
        lista.innerHTML = '';
        const msg = document.getElementById('emptyFeriadosMsg');
        if (msg) msg.style.display = 'block';
        return;
    }
    
    lista.innerHTML = feriados.map(feriado => {
        const fechaFormateada = formatearFechaCorta(feriado.fecha);
        const descripcionEscapada = (feriado.descripcion || 'Feriado').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return `
        <div style="background:#eff6ff; color:var(--primary); padding:4px 10px; border-radius:12px; font-size:0.8rem; display:flex; align-items:center; gap:6px; border:1px solid var(--primary-light);">
            <span style="font-weight:600;">${fechaFormateada}</span> ${descripcionEscapada}
            <button onclick="eliminarFeriado('${feriado.fecha}')" style="background:none; border:none; cursor:pointer; color:var(--primary); opacity:0.6; display:flex;" title="Eliminar feriado">
                <i data-lucide="x" style="width:14px;"></i>
            </button>
        </div>
    `;
    }).join('');
    
    const msg = document.getElementById('emptyFeriadosMsg');
    if (msg) msg.style.display = 'none';
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Renderiza el logo en la interfaz
 * @returns {void}
 */
function renderLogo() {
    const preview = document.getElementById('logoPreview');
    const container = document.getElementById('logoPreviewContainer');
    const btnEliminar = document.getElementById('btnEliminarLogo');
    
    if (!preview) return;
    
    const placeholder = container ? container.querySelector('.text-placeholder') : null;
    
    if (logoData) {
        preview.src = logoData;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        if (btnEliminar) btnEliminar.style.display = 'flex';
    } else {
        preview.src = '';
        preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (btnEliminar) btnEliminar.style.display = 'none';
    }
}

/**
 * Actualiza las estadísticas mostradas en la interfaz
 * @returns {void}
 */
function actualizarEstadisticas() {
    const totalEl = document.getElementById('totalEmpleados');
    const seleccionadosEl = document.getElementById('totalSeleccionados');
    
    const total = Array.isArray(empleados) ? empleados.length : 0;
    const seleccionados = Array.isArray(empleados) 
        ? empleados.filter(e => e.seleccionado).length 
        : 0;
    
    if (totalEl) totalEl.textContent = total;
    if (seleccionadosEl) seleccionadosEl.textContent = seleccionados;
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada como DD/MM
 */
function formatearFechaCorta(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string') return 'Fecha inválida';
    
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    
    return `${partes[2]}/${partes[1]}`;
}

// === DRAG AND DROP ===

/**
 * Configura la funcionalidad de drag and drop para archivos
 * @returns {void}
 */
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const input = document.getElementById('archivoInput');

    if (!dropZone || !input) return;

    // Click para abrir selector
    dropZone.addEventListener('click', () => input.click());

    // Eventos de drag
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    // Procesar archivos soltados
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            let assigned = false;

            if (typeof DataTransfer !== 'undefined') {
                try {
                    const dt = new DataTransfer();
                    Array.from(files).forEach(f => dt.items.add(f));
                    input.files = dt.files;
                    assigned = true;
                } catch (err) {
                    console.warn('No se pudo asignar archivos al input:', err);
                }
            }

            if (!assigned) {
                input._droppedFile = file;
            } else {
                input._droppedFile = null;
            }

            mostrarNombreArchivo(file);
        }
    });
}

/**
 * Muestra el nombre del archivo seleccionado
 * @returns {void}
 */
function mostrarNombreArchivo(fileOverride) {
    const input = document.getElementById('archivoInput');
    const preview = document.getElementById('filePreview');
    const nameDisplay = document.getElementById('fileNameDisplay');
    
    if (!input || !preview || !nameDisplay) return;
    
    const file = fileOverride || (input.files && input.files[0]) || input._droppedFile;
    if (file) {
        const fileName = file.name;
        
        // Truncar nombre si es muy largo
        const maxLength = 30;
        const displayName = fileName.length > maxLength 
            ? fileName.substring(0, maxLength - 3) + '...' 
            : fileName;
        
        nameDisplay.textContent = displayName;
        nameDisplay.title = fileName; // Tooltip con nombre completo
        preview.style.display = 'inline-flex';
    } else {
        preview.style.display = 'none';
    }
}

/**
 * Limpia la selección de archivo actual
 * @returns {void}
 */
function limpiarSeleccionArchivo() {
    const input = document.getElementById('archivoInput');
    const preview = document.getElementById('filePreview');
    
    if (input) input.value = '';
    if (input) input._droppedFile = null;
    if (preview) preview.style.display = 'none';
}
