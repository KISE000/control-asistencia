// ==========================================
// CONFIGURACIÓN SUPABASE
// ==========================================
const SUPABASE_URL = 'https://exttzsyfyqmonbleihna.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dHR6c3lmeXFtb25ibGVpaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzMxMTMsImV4cCI6MjA4MDkwOTExM30.6Nhkyyx6ds7VSvVzq_XDHDugL9XKXQhfxCu8HLGSLEU';

let supabase;

// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================

let empleados = [
    {id: 1, nombre: 'Melissa Guzmán', seleccionado: true},
    {id: 2, nombre: 'Jimena Hernández', seleccionado: true},
    {id: 3, nombre: 'Samantha Varela', seleccionado: true}
];

let feriados = []; 
let logoData = null; 
let nextId = 4;

document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
    setupDragAndDrop();
});

function inicializarApp() {
    if (window.supabase && window.supabase.createClient) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            if (supabase) cargarHistorial();
        } catch (e) { console.error("Error Supabase:", e); }
    } else { console.warn('Librería Supabase no detectada.'); }

    cargarConfiguracion();
    if(!localStorage.getItem('controlAsistencia')) configurarFechaActual();
    if (document.getElementById('empleadosGrid')) renderEmpleados();
    renderFeriados();
    renderLogo();
    actualizarEstadisticas();
    guardarConfiguracionAuto();
    if(window.lucide) lucide.createIcons();
}

// ==========================================
// DRAG & DROP LOGIC (MEJORADA)
// ==========================================
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const input = document.getElementById('archivoInput');

    if (!dropZone) return;

    dropZone.addEventListener('click', () => input.click());

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

// ==========================================
// SUPABASE: SUBIDA, LISTADO Y BORRADO
// ==========================================

async function subirArchivoSupabase() {
    if (!supabase) return showToast('Error de conexión', 'error');

    const fileInput = document.getElementById('archivoInput');
    const nombreManual = document.getElementById('nombreArchivoManual').value;
    const btn = document.getElementById('btnSubir');
    const btnText = btn.querySelector('.btn-text-content');
    const btnLoader = btn.querySelector('.btn-loader');

    const file = fileInput.files[0];

    if (!file) return showToast('Por favor selecciona un archivo', 'warning');
    if (!nombreManual) return showToast('Escribe un nombre para el archivo', 'warning');

    // Loading State
    btn.disabled = true;
    if(btnText) btnText.style.display = 'none';
    if(btnLoader) btnLoader.style.display = 'block';

    try {
        const fileExt = file.name.split('.').pop();
        const safeName = nombreManual.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}_${safeName}.${fileExt}`;
        
        const { error } = await supabase.storage.from('nominas').upload(fileName, file);
        if (error) throw new Error(`Storage: ${error.message}`);

        const { data: publicData } = supabase.storage.from('nominas').getPublicUrl(fileName);
        const publicUrl = publicData.publicUrl;

        const mes = document.getElementById('mes').value;
        const ano = document.getElementById('ano').value;

        const { error: dbError } = await supabase.from('historial_nominas').insert([{ 
            nombre_archivo: nombreManual, 
            url_archivo: publicUrl,
            empleado: 'General', 
            periodo: `${mes}/${ano}`
        }]);

        if (dbError) throw new Error(`DB: ${dbError.message}`);

        showToast('Archivo subido exitosamente', 'success');
        
        // Reset UI
        limpiarSeleccionArchivo();
        document.getElementById('nombreArchivoManual').value = '';
        cargarHistorial();

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        if(btnText) btnText.style.display = 'flex';
        if(btnLoader) btnLoader.style.display = 'none';
    }
}

async function cargarHistorial() {
    if (!supabase) return;
    const container = document.getElementById('historialGrid');
    
    // Skeleton mejorado
    container.innerHTML = `
        <div class="skeleton-row">
            <div class="skeleton-icon"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                <div class="skeleton-line" style="width: 40%"></div>
                <div class="skeleton-line" style="width: 20%"></div>
            </div>
        </div>
        <div class="skeleton-row">
            <div class="skeleton-icon"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                <div class="skeleton-line" style="width: 50%"></div>
                <div class="skeleton-line" style="width: 30%"></div>
            </div>
        </div>
    `;
    
    try {
        const { data, error } = await supabase
            .from('historial_nominas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i data-lucide="folder-open" style="width:48px; height:48px; opacity:0.3; margin-bottom:10px;"></i>
                    <p>No hay archivos en la nube</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        container.innerHTML = data.map(item => {
            const fecha = new Date(item.created_at);
            const tiempo = timeAgo(fecha);
            const pathStorage = item.url_archivo.split('/').pop();
            
            const isPdf = item.url_archivo.toLowerCase().includes('.pdf');
            const iconClass = isPdf ? 'icon-pdf' : 'icon-img';
            const iconName = isPdf ? 'file-text' : 'image';

            return `
            <div class="file-row">
                <div class="file-info">
                    <div class="file-icon ${iconClass}">
                        <i data-lucide="${iconName}"></i>
                    </div>
                    <div class="file-details">
                        <span class="file-name" title="${item.nombre_archivo}">${item.nombre_archivo}</span>
                        <span class="file-meta">${tiempo} • ${item.periodo}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <a href="${item.url_archivo}" target="_blank" class="btn-view">
                        <i data-lucide="eye" style="width:14px;"></i> Ver
                    </a>
                    <button class="btn-trash" onclick="borrarArchivo(${item.id}, '${pathStorage}')" title="Eliminar">
                        <i data-lucide="trash-2" style="width:16px;"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
        
        lucide.createIcons();

    } catch (err) {
        console.error(err);
        showToast('Error cargando historial', 'error');
    }
}

async function borrarArchivo(id, pathStorage) {
    if (!confirm('¿Estás seguro de eliminar este archivo permanentemente?')) return;

    try {
        const { error: stErr } = await supabase.storage.from('nominas').remove([pathStorage]);
        if (stErr) console.warn("Storage warning:", stErr);

        const { error: dbErr } = await supabase.from('historial_nominas').delete().eq('id', id);
        if (dbErr) throw dbErr;

        showToast('Archivo eliminado correctamente', 'success');
        cargarHistorial();

    } catch (err) {
        showToast('Error al eliminar: ' + err.message, 'error');
    }
}

// ==========================================
// UTILS: TOASTS & TIME
// ==========================================

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

// Alias
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

// ==========================================
// LÓGICA LOCAL (MANTENIDA)
// ==========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.toggle('active');
}

function configurarFechaActual() {
    const ahora = new Date();
    document.getElementById('mes').value = ahora.getMonth() + 1;
    document.getElementById('ano').value = ahora.getFullYear();
}

function actualizarCalendarioFeriados() {
    // Placeholder por si queremos lógica futura de limpiar feriados al cambiar año
    guardarConfiguracion();
}

function cargarLogo() {
    const input = document.getElementById('logoInput');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoData = e.target.result;
            renderLogo();
            guardarConfiguracion();
        };
        reader.readAsDataURL(file);
    }
}

function renderLogo() {
    const preview = document.getElementById('logoPreview');
    const container = document.getElementById('logoPreviewContainer');
    const btnEliminar = document.getElementById('btnEliminarLogo');
    
    if (!preview) return;
    
    if (logoData) {
        preview.src = logoData; preview.style.display = 'block';
        if(container.querySelector('.text-placeholder')) container.querySelector('.text-placeholder').style.display = 'none';
        if(btnEliminar) btnEliminar.style.display = 'flex'; // Changed to flex to match center style
    } else {
        preview.src = ''; preview.style.display = 'none';
        if(container.querySelector('.text-placeholder')) container.querySelector('.text-placeholder').style.display = 'flex';
        if(btnEliminar) btnEliminar.style.display = 'none';
    }
}

function eliminarLogo() {
    logoData = null; document.getElementById('logoInput').value = '';
    renderLogo(); guardarConfiguracion();
}

function agregarFeriado() {
    const fecha = document.getElementById('fechaFeriado').value;
    const desc = document.getElementById('descFeriado').value.trim();
    if (!fecha) return showToast('Selecciona fecha', 'warning');
    if (feriados.some(f => f.fecha === fecha)) return;
    feriados.push({ fecha, descripcion: desc || 'Feriado' });
    feriados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    document.getElementById('fechaFeriado').value = '';
    document.getElementById('descFeriado').value = '';
    renderFeriados(); guardarConfiguracion();
}

function eliminarFeriado(fecha) {
    feriados = feriados.filter(f => f.fecha !== fecha);
    renderFeriados(); guardarConfiguracion();
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

function agregarEmpleado() {
    const val = document.getElementById('nuevoEmpleado').value.trim();
    if (!val) return;
    empleados.push({id: nextId++, nombre: val, seleccionado: true});
    document.getElementById('nuevoEmpleado').value = '';
    renderEmpleados(); guardarConfiguracion();
}

function toggleSeleccionEmpleado(id) {
    const e = empleados.find(x => x.id === id); if(e) e.seleccionado = !e.seleccionado;
    actualizarEstadisticas(); guardarConfiguracion();
}

function toggleSeleccionarTodos() {
    const all = empleados.every(e => e.seleccionado);
    empleados.forEach(e => e.seleccionado = !all);
    renderEmpleados(); guardarConfiguracion();
}

function editarNombre(id) {
    const e = empleados.find(x => x.id === id);
    const n = prompt('Nuevo nombre:', e.nombre);
    if(n) { e.nombre = n; renderEmpleados(); guardarConfiguracion(); }
}

function eliminarEmpleado(id) {
    if(confirm('¿Eliminar empleado?')) { 
        empleados = empleados.filter(x => x.id !== id); 
        renderEmpleados(); guardarConfiguracion(); 
    }
}

function limpiarEmpleados() {
    if(confirm('¿Estás seguro de borrar toda la lista?')) { 
        empleados = []; feriados = []; 
        renderEmpleados(); renderFeriados(); guardarConfiguracion(); 
    }
}

function actualizarEstadisticas() {
    document.getElementById('totalEmpleados').textContent = empleados.length;
    document.getElementById('totalSeleccionados').textContent = empleados.filter(e => e.seleccionado).length;
}

// PDF LOGIC (Igual que antes pero optimizado para no romper nada)
async function generarPDFs() {
    const sels = empleados.filter(e => e.seleccionado);
    if (!sels.length) return showToast('Selecciona al menos un empleado', 'warning');
    
    const btn = document.getElementById('btnGenerar');
    btn.disabled = true; 
    document.getElementById('progress').style.display = 'block';

    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const hIn = document.getElementById('horaEstandar').value;
    const hOut = document.getElementById('horaSalida').value;
    const opts = {
        incluirHorasExtras: document.getElementById('incluirHorasExtras').checked,
        incluirTipoJornada: document.getElementById('incluirTipoJornada').checked,
        incluirMotivoAusencia: document.getElementById('incluirMotivoAusencia').checked,
        incluirAprobacion: document.getElementById('incluirAprobacion').checked
    };

    try {
        for(let i=0; i<sels.length; i++) {
            const p = Math.round(((i+1)/sels.length)*100);
            document.getElementById('progressFill').style.width = p+'%';
            document.getElementById('progressText').textContent = p+'%';
            await generarPDFEmpleado(sels[i], mes, ano, hIn, hOut, opts);
            await new Promise(r => setTimeout(r, 100)); // Pequeña pausa visual
        }
        showToast('Documentos generados correctamente', 'success');
    } catch(e) { console.error(e); }
    finally { 
        btn.disabled = false; 
        setTimeout(() => { document.getElementById('progress').style.display = 'none'; }, 2000);
    }
}

async function generarPDFEmpleado(emp, mes, ano, hIn, hOut, opts) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const dias = new Date(ano, mes, 0).getDate();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let y = 12;
    if(logoData) try { doc.addImage(logoData, 'PNG', 14, 6, 15, 15, undefined, 'FAST'); } catch(e){}
    doc.setFontSize(14); doc.setFont(undefined, 'bold');
    doc.text('CONTROL DE ASISTENCIA', 108, y, {align:'center'});
    y+=8; doc.setDrawColor(150); doc.setLineWidth(0.5); doc.line(14, y, 200, y);
    y+=3; doc.setFillColor(248, 250, 252); doc.setDrawColor(220); doc.roundedRect(14, y, 186, 14, 2, 2, 'FD');
    
    const infoY = y+9; doc.setFontSize(9);
    doc.setFont(undefined, 'bold'); doc.text('EMPLEADO:', 18, infoY);
    doc.setFont(undefined, 'normal'); doc.text(emp.nombre, 40, infoY);
    doc.setFont(undefined, 'bold'); doc.text('PERIODO:', 100, infoY);
    doc.setFont(undefined, 'normal'); doc.text(`${meses[mes-1].toUpperCase()} ${ano}`, 118, infoY);
    doc.setFont(undefined, 'bold'); doc.text('HORARIO:', 155, infoY);
    doc.setFont(undefined, 'normal'); doc.text(`${hIn} - ${hOut}`, 173, infoY);
    y+=18;

    let cols = [{header:'Día', dataKey:'d'}, {header:'Fecha', dataKey:'f'}, {header:'Entrada', dataKey:'in'}, {header:'Salida', dataKey:'out'}, {header:'Hrs Ord.', dataKey:'tot'}];
    if(opts.incluirHorasExtras) cols.push({header:'Extra', dataKey:'ex'});
    if(opts.incluirTipoJornada) cols.push({header:'Jornada', dataKey:'jo'});
    if(opts.incluirMotivoAusencia) cols.push({header:'Motivo', dataKey:'mo'});
    cols.push({header:'Firma', dataKey:'fi'});

    const rows = [];
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    for(let d=1; d<=dias; d++) {
        const date = new Date(ano, mes-1, d);
        const dayName = days[date.getDay()];
        const isWeekend = (date.getDay()===0 || date.getDay()===6);
        const fStr = `${ano}-${(mes).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const isHoliday = feriados.find(x => x.fecha === fStr);
        
        rows.push({
            d: dayName.substring(0,3).toUpperCase(), f: d, in:'', out:'', tot:'', ex:'', jo:'', 
            mo: isHoliday ? isHoliday.descripcion : '', fi:'',
            isGray: (isWeekend || !!isHoliday)
        });
    }

    doc.autoTable({
        startY: y, columns: cols, body: rows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1, lineColor: [200], lineWidth: 0.1, valign: 'middle', halign: 'center', minCellHeight: 4 },
        headStyles: { fillColor: [50], textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 2 },
        columnStyles: { d: {cellWidth:10, fontStyle:'bold'}, f: {cellWidth:8}, fi: {cellWidth:20}, mo:{halign:'left'} },
        didParseCell: (data) => {
            if(data.section==='body' && rows[data.row.index].isGray) data.cell.styles.fillColor = [240];
        },
        margin: {bottom:10}
    });

    let fy = doc.lastAutoTable.finalY + 4;
    if(doc.internal.pageSize.height - fy < 35) { /* Ajuste si falta espacio */ }
    
    doc.setDrawColor(150); doc.setLineWidth(0.2); doc.rect(14, fy, 186, 12);
    doc.setFontSize(7); doc.setFont(undefined, 'bold'); doc.text('RESUMEN:', 16, fy+4);
    doc.setFont(undefined, 'normal');
    doc.text('Días Lab: ____', 16, fy+9); doc.text('Asistencias: ____', 40, fy+9);
    doc.text('Faltas: ____', 70, fy+9); doc.text('Retardos: ____', 95, fy+9);
    if(opts.incluirHorasExtras) doc.text('Total Extra: ____', 125, fy+9);

    const firmY = fy+22;
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.line(30, firmY, 80, firmY); doc.text('FIRMA EMPLEADO', 55, firmY+3, {align:'center'});
    if(opts.incluirAprobacion) {
        doc.line(130, firmY, 180, firmY); doc.text('SUPERVISOR', 155, firmY+3, {align:'center'});
    }

    doc.setFontSize(6); doc.setTextColor(150);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 195, doc.internal.pageSize.height-5, {align:'right'});
    
    const safeName = emp.nombre.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Asistencia_${safeName}_${meses[mes-1]}_${ano}.pdf`);
}

function formatearFechaCorta(s) { const p=s.split('-'); return `${p[2]}/${p[1]}`; }
function guardarConfiguracion() {
    const c = { empleados, feriados, logoData, nextId, 
        mes: document.getElementById('mes').value, ano: document.getElementById('ano').value,
        horaEstandar: document.getElementById('horaEstandar').value, horaSalida: document.getElementById('horaSalida').value,
        opciones: {
            incluirHorasExtras: document.getElementById('incluirHorasExtras').checked,
            incluirTipoJornada: document.getElementById('incluirTipoJornada').checked,
            incluirMotivoAusencia: document.getElementById('incluirMotivoAusencia').checked,
            incluirAprobacion: document.getElementById('incluirAprobacion').checked
        }
    };
    try { localStorage.setItem('controlAsistencia', JSON.stringify(c)); } catch(e) { showToast('Memoria llena (Logo)', 'error'); }
}
function cargarConfiguracion() {
    const raw = localStorage.getItem('controlAsistencia'); if(!raw) return;
    try {
        const d = JSON.parse(raw);
        empleados = d.empleados || []; feriados = d.feriados || []; logoData = d.logoData || null; nextId = d.nextId || 4;
        if(d.mes) document.getElementById('mes').value = d.mes;
        if(d.ano) document.getElementById('ano').value = d.ano;
        if(d.horaEstandar) document.getElementById('horaEstandar').value = d.horaEstandar;
        if(d.horaSalida) document.getElementById('horaSalida').value = d.horaSalida;
        if(d.opciones) {
            document.getElementById('incluirHorasExtras').checked = d.opciones.incluirHorasExtras;
            document.getElementById('incluirTipoJornada').checked = d.opciones.incluirTipoJornada;
            document.getElementById('incluirMotivoAusencia').checked = d.opciones.incluirMotivoAusencia;
            document.getElementById('incluirAprobacion').checked = d.opciones.incluirAprobacion;
        }
    } catch(e) { console.error(e); }
}
function guardarConfiguracionAuto() {
    document.querySelectorAll('input, select').forEach(e => {
        if(!['nuevoEmpleado','fechaFeriado','descFeriado','archivoInput','nombreArchivoManual'].includes(e.id)) e.addEventListener('change', guardarConfiguracion);
    });
}
function exportarConfiguracion() {
    const b = new Blob([localStorage.getItem('controlAsistencia')], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
    showToast('Backup descargado', 'success');
}
function importarConfiguracion() { document.getElementById('importFile').click(); }
function procesarImportacion() {
    const f = document.getElementById('importFile').files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = e => {
        try { JSON.parse(e.target.result); localStorage.setItem('controlAsistencia', e.target.result); location.reload(); }
        catch(err) { showToast('Archivo inválido', 'error'); }
    };
    r.readAsText(f);
}
function mostrarAyuda() { alert('Control de Asistencia PRO v2.2\n\nArrastra archivos para subirlos a la nube.'); }