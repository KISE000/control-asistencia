// === GLOBALES ===
// Las variables (empleados, feriados, etc.) ya están declaradas en config.js

// === INICIALIZACIÓN Y EVENTOS ===

document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
    setupDragAndDrop();
    setupEventListeners();
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

function setupEventListeners() {
    const listen = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    // Excel Modal
    listen('btnCloseModalExcel', 'click', cerrarModalExcel);
    listen('btnCancelModalExcel', 'click', cerrarModalExcel);
    // Unify button ID to match HTML
    listen('btnDownloadExcelEdited', 'click', descargarExcelEditado); 
    listen('btnGuardarExcel', 'click', () => guardarExcelSupabase(false));

    // Auth Modal
    listen('tabLogin', 'click', () => cambiarTabAuth('login'));
    listen('tabRegistro', 'click', () => cambiarTabAuth('registro'));
    listen('loginEmail', 'keypress', e => { if (e.key === 'Enter') loginSupabase(); });
    listen('loginPassword', 'keypress', e => { if (e.key === 'Enter') loginSupabase(); });
    
    // Fix IDs for password toggle (HTML uses toggleLoginPass/toggleRegisterPass)
    listen('toggleLoginPass', 'click', () => togglePasswordVisibility('loginPassword', 'togglePasswordIcon'));
    listen('toggleRegisterPass', 'click', () => togglePasswordVisibility('registroPassword', 'togglePasswordIcon2'));

    // Fix ID for Forgot Password (HTML uses forgotPasswordLink)
    listen('forgotPasswordLink', 'click', e => { e.preventDefault(); mostrarRecuperarPassword(); });

    listen('registroPassword', 'keypress', e => { if (e.key === 'Enter') registrarSupabase(); });
    listen('registroPasswordConfirm', 'keypress', e => { if (e.key === 'Enter') registrarSupabase(); });
    listen('btnLogin', 'click', loginSupabase);
    listen('btnRegistro', 'click', registrarSupabase);
    
    // Time Picker Modal
    listen('btnCloseTimePicker', 'click', cerrarTimePicker);
    listen('btnCancelTimePicker', 'click', cerrarTimePicker);
    listen('btnConfirmTimePicker', 'click', confirmarTiempo);

    // Recover Password Modal
    listen('btnCloseRecuperarPassword', 'click', cerrarRecuperarPassword);
    listen('recuperarEmail', 'keypress', e => { if (e.key === 'Enter') enviarRecuperacionPassword(); });
    listen('btnCancelRecuperarPassword', 'click', cerrarRecuperarPassword);
    listen('btnEnviarRecuperacion', 'click', enviarRecuperacionPassword);

    // Logout Confirm Modal
    listen('btnCancelLogout', 'click', cerrarModalLogout);
    listen('btnConfirmarLogout', 'click', confirmarLogout);

    // Topbar
    listen('btnMobileMenu', 'click', toggleSidebar);
    // listen('btnUserMenu', 'click', toggleUserMenu); // Handled by auth.js setupUserMenuListeners()
    listen('darkModeToggle', 'change', toggleDarkMode);
    listen('btnLogout', 'click', logoutSupabase);
    listen('btnHelp', 'click', mostrarAyuda);

    // Sidebar
    listen('logoPreviewContainer', 'click', () => document.getElementById('logoInput').click());
    listen('logoInput', 'change', cargarLogo);
    listen('btnEliminarLogo', 'click', eliminarLogo);
    listen('mes', 'change', actualizarCalendarioFeriados);
    listen('horaEstandar', 'click', () => abrirTimePicker('horaEstandar', 'Hora de Entrada'));
    listen('horaSalida', 'click', () => abrirTimePicker('horaSalida', 'Hora de Salida'));
    listen('btnAgregarFeriado', 'click', agregarFeriado);

    // Main content
    listen('btnGenerar', 'click', generarPDFs);
    listen('btnGenerarExcel', 'click', generarExcel);
    listen('btnAbrirEditorExcel', 'click', e => { abrirEditorExcel(); e.currentTarget.blur(); });
    
    // Empleados
    listen('btnSeleccionarTodos', 'click', toggleSeleccionarTodos);
    listen('btnLimpiarEmpleados', 'click', limpiarEmpleados);
    listen('nuevoEmpleado', 'keypress', e => { if(e.key==='Enter') agregarEmpleado(); });
    listen('btnAgregarEmpleado', 'click', agregarEmpleado);

    // Registros en la nube
    listen('btnLimpiarFiltrosRegistros', 'click', limpiarFiltrosRegistros);
    listen('btnRefrescarRegistros', 'click', cargarRegistrosAsistencia);
    listen('filtroAno', 'change', cargarRegistrosAsistencia);
    listen('btnCargarDatosNube', 'click', cargarRegistrosAsistencia);
    listen('btnDescargarRegistros', 'click', descargarRegistrosExcel);
    listen('btnEliminarRegistrosMes', 'click', eliminarRegistrosMes);
    
    // Repositorio digital
    listen('btnRefrescarHistorial', 'click', cargarHistorial);
    listen('archivoInput', 'change', mostrarNombreArchivo);
    listen('btnSubir', 'click', subirArchivoSupabase);
    
    const filePreview = document.getElementById('filePreview');
    if (filePreview) {
        filePreview.addEventListener('click', e => {
            if (e.target.matches('.close-preview, .close-preview *')) {
                limpiarSeleccionArchivo();
            }
        });
    }

    // Confirmacion generico
    listen('btnCloseModalConfirmacion', 'click', cerrarModalConfirmacion);
    listen('btnCancelModalConfirmacion', 'click', cerrarModalConfirmacion);

    listen('importFile', 'change', procesarImportacion);

    // Global Key Listener for ESC to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalExcel = document.getElementById('modalExcel');
            if (modalExcel && modalExcel.style.display === 'flex') {
                cerrarModalExcel();
            }
        }
    });
}

// === LOCAL STORAGE & CONFIG LOGIC ===

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = (dropdown.style.display === 'none' || dropdown.style.display === '') ? 'block' : 'none';
        
        // Auto-close when clicking outside
        if (dropdown.style.display === 'block') {
            const closeMenu = (e) => {
                if (!e.target.closest('#userDropdown') && !e.target.closest('#btnUserMenu')) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            };
            // Delay adding listener to avoid immediate close
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        }
    }
}

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