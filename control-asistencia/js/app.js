// === INICIALIZACIÓN Y EVENTOS ===

document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
    setupDragAndDrop();
});

function inicializarApp() {
    if (window.supabase && window.supabase.createClient) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            if (supabase) {
                cargarHistorial();
                // Sincronizar empleados con la base de datos
                sincronizarEmpleadosConSupabase();
            }
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

// === LOCAL STORAGE & CONFIG LOGIC ===

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

async function agregarEmpleado() {
    const val = document.getElementById('nuevoEmpleado').value.trim();
    if (!val) return;
    
    // Guardar en Supabase primero
    const empleadoDB = await guardarEmpleadoSupabase(val);
    
    if (empleadoDB) {
        // Agregar localmente con el ID de Supabase
        empleados.push({
            id: empleadoDB.id,
            supabaseId: empleadoDB.id,
            nombre: val,
            seleccionado: true
        });
        showToast('✅ Empleado agregado', 'success');
    } else {
        // Si falla, agregar solo localmente
        empleados.push({id: nextId++, nombre: val, seleccionado: true});
        showToast('⚠️ Empleado agregado solo localmente', 'warning');
    }
    
    document.getElementById('nuevoEmpleado').value = '';
    renderEmpleados(); 
    guardarConfiguracion();
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

async function eliminarEmpleado(id) {
    if(confirm('¿Eliminar empleado?')) {
        const empleado = empleados.find(x => x.id === id);
        
        // Intentar eliminar de Supabase si tiene supabaseId
        if (empleado && empleado.supabaseId) {
            await eliminarEmpleadoSupabase(empleado.supabaseId, empleado.nombre);
        }
        
        // Eliminar localmente
        empleados = empleados.filter(x => x.id !== id); 
        renderEmpleados(); 
        guardarConfiguracion();
    }
}

async function limpiarEmpleados() {
    if(confirm('¿Estás seguro de borrar toda la lista?')) {
        // Eliminar en Supabase
        await limpiarEmpleadosSupabase();
        
        // Limpiar localmente
        empleados = []; 
        feriados = []; 
        renderEmpleados(); 
        renderFeriados(); 
        guardarConfiguracion();
    }
}

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