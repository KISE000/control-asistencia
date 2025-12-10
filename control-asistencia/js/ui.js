// === UI RENDERING & UTILS ===

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'alert-circle';
    if(type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${icon}"></i></div>
        <div class="toast-content">${msg}</div>
    `;

    container.appendChild(toast);
    if(window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                <i data-lucide="users" style="width:48px; height:48px; opacity:0.2; margin-bottom:10px;"></i>
                <p>Lista de empleados vacía</p>
            </div>`;
        actualizarEstadisticas();
        if(window.lucide) lucide.createIcons();
        return;
    }
    grid.innerHTML = empleados.map(emp => `
        <div class="empleado-card">
            <div class="card-left">
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
        </div>
    `).join('');
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