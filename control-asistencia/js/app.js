// === GLOBALES ===
// Las variables (empleados, feriados, etc.) ya están declaradas en config.js

// === CONSTANTES DE CONFIGURACIÓN ===
const APP_DEFAULTS = {
    HORA_ENTRADA: '10:00 a. m.',
    HORA_SALIDA: '07:00 p. m.',
    ALMUERZO_HORAS: 1,
    DEBOUNCE_DELAY: 300
};

// === UTILIDADES ===

/**
 * Crea una función debounced que retrasa la ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Obtiene un elemento del DOM de forma segura
 * @param {string} id - ID del elemento
 * @returns {HTMLElement|null} El elemento o null si no existe
 */
function getElement(id, options = {}) {
    const { warn = true } = options;
    const element = document.getElementById(id);
    if (!element && warn) {
        console.warn(`Elemento con ID "${id}" no encontrado`);
    }
    return element;
}

/**
 * Obtiene el valor de un elemento input de forma segura
 * @param {string} id - ID del elemento
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string} El valor del elemento o el valor por defecto
 */
function getElementValue(id, defaultValue = '') {
    const element = getElement(id);
    return element ? element.value : defaultValue;
}

/**
 * Establece el valor de un elemento input de forma segura
 * @param {string} id - ID del elemento
 * @param {string} value - Valor a establecer
 * @returns {boolean} True si se estableció correctamente
 */
function setElementValue(id, value) {
    const element = getElement(id);
    if (element) {
        element.value = value;
        return true;
    }
    return false;
}

// === INICIALIZACIÓN Y EVENTOS ===

document.addEventListener('DOMContentLoaded', () => {
    try {
        inicializarApp();
        setupDragAndDrop();
        setupEventListeners();
    } catch (error) {
        console.error('❌ Error en la inicialización:', error);
        if (typeof showToast === 'function') {
            showToast('Error al inicializar la aplicación', 'error');
        }
    }
});

/**
 * Inicializa la aplicación cargando configuraciones y renderizando componentes
 * @returns {void}
 */
function inicializarApp() {
    try {
        // Verificación de conexión a Supabase (inicializado en config.js)
        if (typeof supabase !== 'undefined' && supabase) {
            cargarHistorial();
            // Sincronizar empleados con la base de datos si existe la función
            if (typeof sincronizarEmpleadosConSupabase === 'function') {
                sincronizarEmpleadosConSupabase();
            }
        } else { 
            console.warn('⚠️ Cliente Supabase no disponible. La aplicación funcionará en modo local.'); 
        }

        cargarConfiguracion();
        
        if (!localStorage.getItem(APP_CONSTANTS.KEYS.CONTROL_ASISTENCIA)) {
            configurarFechaActual();
        }
        
        const empleadosGrid = getElement('empleadosGrid');
        if (empleadosGrid) {
            renderEmpleados();
        }
        
        renderFeriados();
        renderLogo();
        actualizarEstadisticas();
        guardarConfiguracionAuto();
        
        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error en inicializarApp:', error);
        throw error;
    }
}

/**
 * Configura todos los event listeners de la aplicación
 * @returns {void}
 */
function setupEventListeners() {
    /**
     * Helper para agregar listeners de forma segura
     * @param {string} id - ID del elemento
     * @param {string} event - Tipo de evento
     * @param {Function} handler - Manejador del evento
     */
    const listen = (id, event, handler) => {
        const el = getElement(id, { warn: false });
        if (el) {
            el.addEventListener(event, handler);
        }
    };

    // Excel Modal
    listen('btnCloseModalExcel', 'click', cerrarModalExcel);
    listen('btnCancelModalExcel', 'click', cerrarModalExcel);
    listen('btnDownloadExcelEdited', 'click', descargarExcelEditado); 
    listen('btnGuardarExcel', 'click', () => guardarExcelSupabase(false));

    // Auth Modal
    listen('tabLogin', 'click', () => cambiarTabAuth('login'));
    listen('tabRegistro', 'click', () => cambiarTabAuth('registro'));
    listen('loginEmail', 'keypress', e => { if (e.key === 'Enter') loginSupabase(); });
    listen('loginPassword', 'keypress', e => { if (e.key === 'Enter') loginSupabase(); });
    
    // Password toggle
    listen('toggleLoginPass', 'click', () => togglePasswordVisibility('loginPassword', 'togglePasswordIcon'));
    listen('toggleRegisterPass', 'click', () => togglePasswordVisibility('registroPassword', 'togglePasswordIcon2'));

    // Forgot Password
    listen('forgotPasswordLink', 'click', e => { 
        e.preventDefault(); 
        mostrarRecuperarPassword(); 
    });

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
    listen('btnLogout', 'click', logoutSupabase);

    // Sidebar
    listen('logoPreviewContainer', 'click', () => {
        const logoInput = getElement('logoInput');
        if (logoInput) logoInput.click();
    });
    listen('logoInput', 'change', cargarLogo);
    listen('btnEliminarLogo', 'click', eliminarLogo);
    listen('mes', 'change', actualizarCalendarioFeriados);
    listen('horaEstandar', 'click', () => abrirTimePicker('horaEstandar', 'Hora de Entrada'));
    listen('horaSalida', 'click', () => abrirTimePicker('horaSalida', 'Hora de Salida'));
    listen('btnAgregarFeriado', 'click', agregarFeriado);

    // Main content
    listen('btnGenerar', 'click', generarPDFs);
    listen('btnGenerarExcel', 'click', generarExcel);
    listen('btnAbrirEditorExcel', 'click', e => { 
        abrirEditorExcel(); 
        e.currentTarget.blur(); 
    });
    
    // Empleados
    listen('btnSeleccionarTodos', 'click', toggleSeleccionarTodos);
    listen('btnLimpiarEmpleados', 'click', limpiarEmpleados);
    listen('nuevoEmpleado', 'keypress', e => { if (e.key === 'Enter') agregarEmpleado(); });
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
    
    const filePreview = getElement('filePreview');
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
    
    // Prevenir cierre del modal Excel al hacer clic en el overlay
    const modalExcel = getElement('modalExcel');
    if (modalExcel) {
        const modalContent = modalExcel.querySelector('.modal-excel-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
}

// === LOCAL STORAGE & CONFIG LOGIC ===

/**
 * Alterna la visibilidad del menú de usuario
 * @returns {void}
 */
function toggleUserMenu() {
    const dropdown = getElement('userDropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Auto-close when clicking outside
    if (!isVisible) {
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

/**
 * Alterna la visibilidad del sidebar en móviles
 * @returns {void}
 */
function toggleSidebar() {
    const sidebar = getElement('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Configura la fecha actual en los selectores de mes y año
 * @returns {void}
 */
function configurarFechaActual() {
    const ahora = new Date();
    setElementValue('mes', ahora.getMonth() + 1);
    setElementValue('ano', ahora.getFullYear());
}

/**
 * Actualiza calendario cuando cambia el mes seleccionado
 * @returns {void}
 */
function actualizarCalendarioFeriados() {
    guardarConfiguracion();
}

/**
 * Carga un logo desde un archivo de imagen
 * @returns {void}
 */
function cargarLogo() {
    const input = getElement('logoInput');
    if (!input) return;
    
    const file = input.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showToast('Por favor selecciona una imagen válida', 'warning');
        return;
    }
    
    // Validar tamaño (máximo 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showToast('La imagen es muy grande. Máximo 2MB', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        logoData = e.target.result;
        renderLogo();
        guardarConfiguracion();
        showToast('Logo cargado correctamente', 'success');
    };
    reader.onerror = function() {
        showToast('Error al cargar el logo', 'error');
    };
    reader.readAsDataURL(file);
}

/**
 * Elimina el logo actual
 * @returns {void}
 */
function eliminarLogo() {
    logoData = null;
    const logoInput = getElement('logoInput');
    if (logoInput) logoInput.value = '';
    renderLogo();
    guardarConfiguracion();
    showToast('Logo eliminado', 'success');
}

/**
 * Agrega un nuevo feriado a la lista
 * @returns {void}
 */
function agregarFeriado() {
    const fechaInput = getElement('fechaFeriado');
    const descInput = getElement('descFeriado');
    
    if (!fechaInput) return;
    
    const fecha = fechaInput.value;
    const desc = descInput ? descInput.value.trim() : '';
    
    if (!fecha) {
        return showToast('Selecciona una fecha', 'warning');
    }
    
    // Verificar duplicados
    if (feriados.some(f => f.fecha === fecha)) {
        return showToast('Este feriado ya existe', 'warning');
    }
    
    feriados.push({ 
        fecha, 
        descripcion: desc || 'Feriado' 
    });
    
    // Ordenar por fecha
    feriados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Limpiar inputs
    fechaInput.value = '';
    if (descInput) descInput.value = '';
    
    renderFeriados();
    guardarConfiguracion();
    showToast('Feriado agregado', 'success');
}

/**
 * Elimina un feriado de la lista
 * @param {string} fecha - Fecha del feriado a eliminar (YYYY-MM-DD)
 * @returns {void}
 */
function eliminarFeriado(fecha) {
    if (!fecha) return;
    
    feriados = feriados.filter(f => f.fecha !== fecha);
    renderFeriados();
    guardarConfiguracion();
}

/**
 * Agrega un nuevo empleado a la lista
 * @returns {Promise<void>}
 */
async function agregarEmpleado() {
    const input = getElement('nuevoEmpleado');
    if (!input) return;
    
    const nombre = input.value.trim();
    
    if (!nombre) {
        return showToast('Ingresa un nombre', 'warning');
    }
    
    // Validar longitud
    if (nombre.length < 2) {
        return showToast('El nombre es muy corto', 'warning');
    }
    
    if (nombre.length > 100) {
        return showToast('El nombre es muy largo', 'warning');
    }
    
    // Verificar duplicados (case insensitive)
    const nombreLower = nombre.toLowerCase();
    if (empleados.some(e => e.nombre.toLowerCase() === nombreLower)) {
        return showToast('Este empleado ya existe', 'warning');
    }
    
    try {
        // Guardar en Supabase primero
        const empleadoDB = await guardarEmpleadoSupabase(nombre);
        
        if (empleadoDB) {
            // Agregar localmente con el ID de Supabase
            empleados.push({
                id: empleadoDB.id,
                supabaseId: empleadoDB.id,
                nombre: nombre,
                seleccionado: true
            });
            showToast('✅ Empleado agregado', 'success');
        } else {
            // Si falla, agregar solo localmente
            empleados.push({
                id: nextId++, 
                nombre: nombre, 
                seleccionado: true
            });
            showToast('⚠️ Empleado agregado solo localmente', 'warning');
        }
        
        input.value = '';
        renderEmpleados(); 
        guardarConfiguracion();
        
    } catch (error) {
        console.error('Error agregando empleado:', error);
        showToast('Error al agregar empleado', 'error');
    }
}

/**
 * Alterna la selección de un empleado
 * @param {number} id - ID del empleado
 * @returns {void}
 */
function toggleSeleccionEmpleado(id) {
    const empleado = empleados.find(x => x.id === id);
    if (empleado) {
        empleado.seleccionado = !empleado.seleccionado;
        actualizarEstadisticas();
        guardarConfiguracion();
    }
}

/**
 * Selecciona o deselecciona todos los empleados
 * @returns {void}
 */
function toggleSeleccionarTodos() {
    const todosSeleccionados = empleados.every(e => e.seleccionado);
    empleados.forEach(e => e.seleccionado = !todosSeleccionados);
    renderEmpleados();
    guardarConfiguracion();
}

/**
 * Permite editar el nombre de un empleado
 * @param {number} id - ID del empleado
 * @returns {void}
 */
function editarNombre(id) {
    const empleado = empleados.find(x => x.id === id);
    if (!empleado) return;
    
    const nuevoNombre = prompt('Nuevo nombre:', empleado.nombre);
    
    if (nuevoNombre && nuevoNombre.trim()) {
        const nombreLimpio = nuevoNombre.trim();
        
        if (nombreLimpio.length < 2 || nombreLimpio.length > 100) {
            return showToast('Nombre inválido', 'warning');
        }
        
        empleado.nombre = nombreLimpio;
        renderEmpleados();
        guardarConfiguracion();
        showToast('Nombre actualizado', 'success');
    }
}

/**
 * Elimina un empleado de la lista
 * @param {number} id - ID del empleado
 * @returns {Promise<void>}
 */
async function eliminarEmpleado(id) {
    if (!confirm('¿Eliminar este empleado?')) return;
    
    try {
        const empleado = empleados.find(x => x.id === id);
        
        // Intentar eliminar de Supabase si tiene supabaseId
        if (empleado && empleado.supabaseId) {
            await eliminarEmpleadoSupabase(empleado.supabaseId, empleado.nombre);
        }
        
        // Eliminar localmente
        empleados = empleados.filter(x => x.id !== id); 
        renderEmpleados(); 
        guardarConfiguracion();
        showToast('Empleado eliminado', 'success');
        
    } catch (error) {
        console.error('Error eliminando empleado:', error);
        showToast('Error al eliminar empleado', 'error');
    }
}

/**
 * Elimina todos los empleados y feriados
 * @returns {Promise<void>}
 */
async function limpiarEmpleados() {
    if (!confirm('¿Estás seguro de borrar toda la lista de empleados y feriados?')) return;
    
    try {
        // Eliminar en Supabase
        await limpiarEmpleadosSupabase();
        
        // Limpiar localmente
        empleados = []; 
        feriados = []; 
        renderEmpleados(); 
        renderFeriados(); 
        guardarConfiguracion();
        showToast('Lista limpiada', 'success');
        
    } catch (error) {
        console.error('Error limpiando empleados:', error);
        showToast('Error al limpiar la lista', 'error');
    }
}

/**
 * Guarda la configuración actual en localStorage
 * @returns {boolean} True si se guardó correctamente
 */
function guardarConfiguracion() {
    try {
        const config = { 
            empleados, 
            feriados, 
            logoData, 
            nextId, 
            mes: getElementValue('mes'),
            ano: getElementValue('ano'),
            horaEstandar: getElementValue('horaEstandar'),
            horaSalida: getElementValue('horaSalida'),
            opciones: {
                incluirHorasExtras: getElement('incluirHorasExtras')?.checked ?? false,
                incluirTipoJornada: getElement('incluirTipoJornada')?.checked ?? false,
                incluirMotivoAusencia: getElement('incluirMotivoAusencia')?.checked ?? false,
                incluirAprobacion: getElement('incluirAprobacion')?.checked ?? false
            }
        };
        
        localStorage.setItem(APP_CONSTANTS.KEYS.CONTROL_ASISTENCIA, JSON.stringify(config));
        return true;
        
    } catch (error) {
        console.error('Error guardando configuración:', error);
        
        if (error.name === 'QuotaExceededError') {
            showToast('Memoria llena. Intenta eliminar el logo.', 'error');
        } else {
            showToast('Error al guardar configuración', 'error');
        }
        return false;
    }
}

/**
 * Carga la configuración desde localStorage
 * @returns {boolean} True si se cargó correctamente
 */
function cargarConfiguracion() {
    try {
        const raw = localStorage.getItem(APP_CONSTANTS.KEYS.CONTROL_ASISTENCIA);
        if (!raw) return false;
        
        const data = JSON.parse(raw);
        
        // Cargar datos con validación
        empleados = Array.isArray(data.empleados) ? data.empleados : [];
        feriados = Array.isArray(data.feriados) ? data.feriados : [];
        logoData = data.logoData || null;
        nextId = typeof data.nextId === 'number' ? data.nextId : 4;
        
        // Cargar valores en inputs
        if (data.mes) setElementValue('mes', data.mes);
        if (data.ano) setElementValue('ano', data.ano);
        if (data.horaEstandar) setElementValue('horaEstandar', data.horaEstandar);
        if (data.horaSalida) setElementValue('horaSalida', data.horaSalida);
        
        // Cargar opciones de checkboxes
        if (data.opciones) {
            const setChecked = (id, value) => {
                const el = getElement(id);
                if (el) el.checked = Boolean(value);
            };
            
            setChecked('incluirHorasExtras', data.opciones.incluirHorasExtras);
            setChecked('incluirTipoJornada', data.opciones.incluirTipoJornada);
            setChecked('incluirMotivoAusencia', data.opciones.incluirMotivoAusencia);
            setChecked('incluirAprobacion', data.opciones.incluirAprobacion);
        }
        
        return true;
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
        return false;
    }
}

/**
 * Configura el guardado automático cuando cambian los inputs
 * @returns {void}
 */
function guardarConfiguracionAuto() {
    const excludedIds = [
        'nuevoEmpleado', 
        'fechaFeriado', 
        'descFeriado', 
        'archivoInput', 
        'nombreArchivoManual'
    ];
    
    // Usar debounce para evitar múltiples guardados
    const guardarDebounced = debounce(guardarConfiguracion, APP_DEFAULTS.DEBOUNCE_DELAY);
    
    document.querySelectorAll('input, select').forEach(element => {
        if (!excludedIds.includes(element.id)) {
            element.addEventListener('change', guardarDebounced);
        }
    });
}

/**
 * Exporta la configuración actual como archivo JSON
 * @returns {void}
 */
function exportarConfiguracion() {
    try {
        const configData = localStorage.getItem(APP_CONSTANTS.KEYS.CONTROL_ASISTENCIA);
        
        if (!configData) {
            return showToast('No hay configuración para exportar', 'warning');
        }
        
        const blob = new Blob([configData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_asistencia_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('Backup descargado', 'success');
        
    } catch (error) {
        console.error('Error exportando configuración:', error);
        showToast('Error al exportar', 'error');
    }
}

/**
 * Abre el diálogo para importar configuración
 * @returns {void}
 */
function importarConfiguracion() {
    const importFile = getElement('importFile');
    if (importFile) importFile.click();
}

/**
 * Procesa el archivo de importación de configuración
 * @returns {void}
 */
function procesarImportacion() {
    const input = getElement('importFile');
    if (!input) return;
    
    const file = input.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.name.endsWith('.json')) {
        showToast('Por favor selecciona un archivo JSON', 'warning');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // Validar que es JSON válido
            const parsed = JSON.parse(e.target.result);
            
            // Validar estructura básica
            if (!parsed.empleados && !parsed.feriados) {
                throw new Error('Estructura inválida');
            }
            
            localStorage.setItem(APP_CONSTANTS.KEYS.CONTROL_ASISTENCIA, e.target.result);
            showToast('Configuración importada. Recargando...', 'success');
            
            setTimeout(() => location.reload(), 1000);
            
        } catch (error) {
            console.error('Error procesando importación:', error);
            showToast('Archivo inválido o corrupto', 'error');
        }
    };
    reader.onerror = () => {
        showToast('Error al leer el archivo', 'error');
    };
    reader.readAsText(file);
}
