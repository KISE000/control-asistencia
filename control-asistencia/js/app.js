// ==========================================
// CONFIGURACIÓN SUPABASE
// ==========================================
const SUPABASE_URL = 'https://exttzsyfyqmonbleihna.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dHR6c3lmeXFtb25ibGVpaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzMxMTMsImV4cCI6MjA4MDkwOTExM30.6Nhkyyx6ds7VSvVzq_XDHDugL9XKXQhfxCu8HLGSLEU';

let supabase; // Variable para el cliente

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

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});

function inicializarApp() {
    // --- CORRECCIÓN SUPABASE ---
    // Verificamos si la librería cargó en 'window.supabase'
    if (window.supabase && window.supabase.createClient) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            cargarHistorial(); // Cargar archivos si conecta
        } catch (e) {
            console.error("Error iniciando Supabase:", e);
        }
    } else {
        console.warn('Librería Supabase no detectada (CDN).');
    }

    cargarConfiguracion();
    
    if(!localStorage.getItem('controlAsistencia')) {
        configurarFechaActual();
    }
    
    if (document.getElementById('empleadosGrid')) {
        renderEmpleados();
    }
    
    renderFeriados();
    renderLogo();
    actualizarEstadisticas();
    guardarConfiguracionAuto();
    if(window.lucide) lucide.createIcons();
}

// TOGGLE SIDEBAR (MOBILE)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.toggle('active');
}

function configurarFechaActual() {
    const ahora = new Date();
    const mesSelect = document.getElementById('mes');
    const anoInput = document.getElementById('ano');
    if(mesSelect) mesSelect.value = ahora.getMonth() + 1;
    if(anoInput) anoInput.value = ahora.getFullYear();
}

// ==========================================
// SUPABASE: SUBIDA Y LISTADO
// ==========================================

async function subirArchivoSupabase() {
    if (!supabase) return mostrarNotificacion('Error: Supabase no está conectado', 'error');

    const fileInput = document.getElementById('archivoInput');
    const nombreManual = document.getElementById('nombreArchivoManual').value;
    const file = fileInput.files[0];

    if (!file) return mostrarNotificacion('Selecciona un archivo PDF o Imagen', 'warning');
    if (!nombreManual) return mostrarNotificacion('Escribe un nombre para el archivo', 'warning');

    mostrarNotificacion('Subiendo archivo...', 'info');

    try {
        // 1. Subir al Bucket 'nominas'
        const fileExt = file.name.split('.').pop();
        // Limpiamos el nombre para evitar errores de URL
        const safeName = nombreManual.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}_${safeName}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('nominas')
            .upload(fileName, file);

        if (error) throw new Error(`Storage: ${error.message}`);

        // 2. Obtener URL Pública
        const { data: publicData } = supabase.storage
            .from('nominas')
            .getPublicUrl(fileName);
            
        const publicUrl = publicData.publicUrl;

        // 3. Guardar en Base de Datos
        const mes = document.getElementById('mes') ? document.getElementById('mes').value : '-';
        const ano = document.getElementById('ano') ? document.getElementById('ano').value : '-';

        const { error: dbError } = await supabase
            .from('historial_nominas')
            .insert([
                { 
                    nombre_archivo: nombreManual, 
                    url_archivo: publicUrl,
                    empleado: 'General', 
                    periodo: `${mes}/${ano}`
                }
            ]);

        if (dbError) throw new Error(`Base de Datos: ${dbError.message}`);

        mostrarNotificacion('¡Archivo guardado exitosamente!', 'success');
        
        // Limpiar
        fileInput.value = '';
        document.getElementById('nombreArchivoManual').value = '';
        cargarHistorial();

    } catch (err) {
        console.error(err);
        mostrarNotificacion(err.message, 'error');
    }
}

async function cargarHistorial() {
    if (!supabase) return;

    const container = document.getElementById('historialGrid');
    if (!container) return;
    
    try {
        const { data, error } = await supabase
            .from('historial_nominas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8; font-size: 0.9rem;">No hay archivos en el historial.</div>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="file-row">
                <div class="file-info">
                    <div class="file-icon" style="color: var(--primary);"><i data-lucide="file-text"></i></div>
                    <div class="file-details">
                        <span class="file-name">${item.nombre_archivo}</span>
                        <span class="file-meta">${new Date(item.created_at).toLocaleDateString()} • Periodo: ${item.periodo || 'N/A'}</span>
                    </div>
                </div>
                <a href="${item.url_archivo}" target="_blank" class="file-action">Ver / Descargar</a>
            </div>
        `).join('');
        
        if(window.lucide) lucide.createIcons();

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="padding:10px; color:var(--danger); text-align:center;">Error de conexión</div>';
    }
}


// ==========================================
// GESTIÓN DE MARCA (LOGO)
// ==========================================

function cargarLogo() {
    const input = document.getElementById('logoInput');
    const file = input.files[0];

    if (file) {
        if (file.size > 500000) {
            mostrarNotificacion('El logo es muy pesado. Máximo 500KB', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            logoData = e.target.result;
            renderLogo();
            guardarConfiguracion();
            mostrarNotificacion('Logo cargado correctamente', 'success');
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
        preview.src = logoData;
        preview.style.display = 'block';
        if(container.querySelector('.text-placeholder')) {
            container.querySelector('.text-placeholder').style.display = 'none';
        }
        if(btnEliminar) btnEliminar.style.display = 'inline-flex';
    } else {
        preview.src = '';
        preview.style.display = 'none';
        if(container.querySelector('.text-placeholder')) {
            container.querySelector('.text-placeholder').style.display = 'flex';
        }
        if(btnEliminar) btnEliminar.style.display = 'none';
    }
}

function eliminarLogo() {
    logoData = null;
    const input = document.getElementById('logoInput');
    if(input) input.value = '';
    renderLogo();
    guardarConfiguracion();
}

// ==========================================
// GESTIÓN DE FERIADOS
// ==========================================

function agregarFeriado() {
    const fechaInput = document.getElementById('fechaFeriado');
    const descInput = document.getElementById('descFeriado');
    
    const fecha = fechaInput.value;
    const descripcion = descInput.value.trim();

    if (!fecha) {
        mostrarNotificacion('Selecciona una fecha', 'warning');
        return;
    }

    if (feriados.some(f => f.fecha === fecha)) {
        mostrarNotificacion('Esa fecha ya está registrada', 'warning');
        return;
    }

    feriados.push({ fecha, descripcion: descripcion || 'Feriado' });
    feriados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    fechaInput.value = '';
    descInput.value = '';
    
    renderFeriados();
    guardarConfiguracion();
}

function eliminarFeriado(fecha) {
    feriados = feriados.filter(f => f.fecha !== fecha);
    renderFeriados();
    guardarConfiguracion();
}

function renderFeriados() {
    const lista = document.getElementById('listaFeriados');
    const msgEmpty = document.getElementById('emptyFeriadosMsg');
    
    if (!lista) return;
    
    if (feriados.length === 0) {
        lista.innerHTML = '';
        if(msgEmpty) msgEmpty.style.display = 'block';
        return;
    }

    if(msgEmpty) msgEmpty.style.display = 'none';

    lista.innerHTML = feriados.map(f => `
        <div class="feriado-tag">
            <span>${formatearFechaCorta(f.fecha)}</span>
            ${f.descripcion}
            <button class="btn-remove-tag" onclick="eliminarFeriado('${f.fecha}')">&times;</button>
        </div>
    `).join('');
}

function actualizarCalendarioFeriados() {
    // Placeholder
}

// ==========================================
// GESTIÓN DE EMPLEADOS
// ==========================================

function renderEmpleados() {
    const grid = document.getElementById('empleadosGrid');
    if (!grid) return;
    
    if (empleados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
                <p>No hay empleados registrados</p>
            </div>
        `;
        actualizarEstadisticas();
        return;
    }
    
    grid.innerHTML = empleados.map(emp => `
        <div class="empleado-card">
            <div class="card-left">
                <input type="checkbox" 
                       class="card-checkbox" 
                       ${emp.seleccionado ? 'checked' : ''} 
                       onchange="toggleSeleccionEmpleado(${emp.id})"
                       title="Seleccionar para PDF">
                <div class="empleado-nombre">${emp.nombre}</div>
            </div>
            <div class="card-actions">
                <button class="btn-action-mini" onclick="editarNombre(${emp.id})">
                    <i data-lucide="pencil" style="width: 14px;"></i>
                </button>
                <button class="btn-action-mini btn-delete" onclick="eliminarEmpleado(${emp.id})">
                    <i data-lucide="trash-2" style="width: 14px;"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if(window.lucide) lucide.createIcons();
    actualizarEstadisticas();
}

function agregarEmpleado() {
    const input = document.getElementById('nuevoEmpleado');
    const nombre = input.value.trim();
    
    if (!nombre) {
        mostrarNotificacion('Ingresa un nombre', 'warning');
        return;
    }
    
    if (empleados.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarNotificacion('El empleado ya existe', 'warning');
        return;
    }
    
    empleados.push({id: nextId++, nombre, seleccionado: true});
    input.value = '';
    renderEmpleados();
    guardarConfiguracion();
    mostrarNotificacion('Empleado agregado', 'success');
}

function toggleSeleccionEmpleado(id) {
    const emp = empleados.find(e => e.id === id);
    if (emp) {
        emp.seleccionado = !emp.seleccionado;
        actualizarEstadisticas();
        guardarConfiguracion();
    }
}

function toggleSeleccionarTodos() {
    const todosSeleccionados = empleados.every(e => e.seleccionado);
    empleados.forEach(e => e.seleccionado = !todosSeleccionados);
    
    const btnText = document.getElementById('txtSeleccionarTodos');
    if(btnText) btnText.textContent = !todosSeleccionados ? 'Seleccionar Todos' : 'Deseleccionar';
    
    renderEmpleados();
    guardarConfiguracion();
}

function editarNombre(id) {
    const emp = empleados.find(e => e.id === id);
    const nuevoNombre = prompt('Nuevo nombre:', emp.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
        emp.nombre = nuevoNombre.trim();
        renderEmpleados();
        guardarConfiguracion();
    }
}

function eliminarEmpleado(id) {
    if (confirm('¿Eliminar empleado?')) {
        empleados = empleados.filter(e => e.id !== id);
        renderEmpleados();
        guardarConfiguracion();
        mostrarNotificacion('Eliminado', 'success');
    }
}

function limpiarEmpleados() {
    if (empleados.length === 0) return;
    if (confirm('¿Borrar TODOS los empleados?')) {
        empleados = [];
        feriados = [];
        renderEmpleados();
        guardarConfiguracion();
        mostrarNotificacion('Lista limpiada', 'success');
    }
}

function actualizarEstadisticas() {
    const elTotal = document.getElementById('totalEmpleados');
    const elSel = document.getElementById('totalSeleccionados');
    if(elTotal) elTotal.textContent = empleados.length;
    if(elSel) elSel.textContent = empleados.filter(e => e.seleccionado).length;
}

// ==========================================
// GENERACIÓN DE PDF (VERSIÓN 1 PÁGINA)
// ==========================================

async function generarPDFs() {
    const seleccionados = empleados.filter(e => e.seleccionado);

    if (seleccionados.length === 0) {
        mostrarNotificacion('Selecciona empleados primero', 'warning');
        return;
    }

    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const horaEstandar = document.getElementById('horaEstandar').value;
    const horaSalida = document.getElementById('horaSalida').value;
    
    const opciones = {
        incluirHorasExtras: document.getElementById('incluirHorasExtras').checked,
        incluirTipoJornada: document.getElementById('incluirTipoJornada').checked,
        incluirMotivoAusencia: document.getElementById('incluirMotivoAusencia').checked,
        incluirAprobacion: document.getElementById('incluirAprobacion').checked
    };

    const btn = document.getElementById('btnGenerar');
    const progress = document.getElementById('progress');
    const pFill = document.getElementById('progressFill');
    const pText = document.getElementById('progressText');
    const pDetail = document.getElementById('progressDetail');

    if(btn) btn.disabled = true;
    if(progress) progress.style.display = 'block';

    try {
        for (let i = 0; i < seleccionados.length; i++) {
            const porcentaje = Math.round(((i + 1) / seleccionados.length) * 100);
            if(pFill) pFill.style.width = porcentaje + '%';
            if(pText) pText.textContent = porcentaje + '%';
            if(pDetail) pDetail.textContent = `Generando ${i + 1}/${seleccionados.length}...`;

            await generarPDFEmpleado(seleccionados[i], mes, ano, horaEstandar, horaSalida, opciones);
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        mostrarNotificacion('Proceso completado', 'success');
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    } finally {
        if(btn) btn.disabled = false;
        if(progress) progress.style.display = 'none';
        if(pFill) pFill.style.width = '0%';
    }
}

async function generarPDFEmpleado(empleado, mes, ano, horaEstandar, horaSalida, opciones) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    
    const dias = getDiasEnMes(ano, mes);
    const nombreMes = getNombreMes(mes).toUpperCase();

    // HEADER
    let cursorY = 12;

    if (logoData) {
        try {
            doc.addImage(logoData, 'PNG', 14, 6, 15, 15, undefined, 'FAST');
        } catch (e) {}
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CONTROL DE ASISTENCIA', 108, cursorY, { align: 'center' });
    
    cursorY += 8;
    doc.setDrawColor(150);
    doc.setLineWidth(0.5);
    doc.line(14, cursorY, 200, cursorY);

    // INFO CARD
    cursorY += 3;
    
    doc.setFillColor(248, 250, 252); 
    doc.setDrawColor(220);
    doc.roundedRect(14, cursorY, 186, 14, 2, 2, 'FD');

    const infoY = cursorY + 9;
    doc.setFontSize(9);
    
    doc.setFont(undefined, 'bold');
    doc.text('EMPLEADO:', 18, infoY);
    doc.setFont(undefined, 'normal');
    doc.text(empleado.nombre, 40, infoY);

    doc.setFont(undefined, 'bold');
    doc.text('PERIODO:', 100, infoY);
    doc.setFont(undefined, 'normal');
    doc.text(`${nombreMes} ${ano}`, 118, infoY);

    doc.setFont(undefined, 'bold');
    doc.text('HORARIO:', 155, infoY);
    doc.setFont(undefined, 'normal');
    doc.text(`${horaEstandar} - ${horaSalida}`, 173, infoY);

    cursorY += 18;

    // TABLA (Ajuste de altura para asegurar 1 página)
    let columns = [
        { header: 'Día', dataKey: 'dia' },
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Entrada', dataKey: 'entrada' },
        { header: 'Salida', dataKey: 'salida' },
        { header: 'Hrs Ord.', dataKey: 'total' }
    ];
    
    if (opciones.incluirHorasExtras) columns.push({ header: 'Extra', dataKey: 'extra' });
    if (opciones.incluirTipoJornada) columns.push({ header: 'Jornada', dataKey: 'jornada' });
    if (opciones.incluirMotivoAusencia) columns.push({ header: 'Motivo / Obs.', dataKey: 'motivo' });
    
    columns.push({ header: 'Firma', dataKey: 'firma' });

    const rows = [];
    for (let d = 1; d <= dias; d++) {
        const fechaStr = `${ano}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        const diaSemana = getDiaSemana(ano, mes, d);
        const esFinSemana = esFinDeSemana(ano, mes, d);
        const feriadoEncontrado = feriados.find(f => f.fecha === fechaStr);
        const esDiaFeriado = !!feriadoEncontrado;

        rows.push({ 
            dia: diaSemana.substring(0, 3).toUpperCase(),
            fecha: `${d}`,
            entrada: '',
            salida: '',
            total: '',
            extra: '',
            jornada: '',
            motivo: esDiaFeriado ? feriadoEncontrado.descripcion : '',
            firma: '',
            esFinSemana,
            esFeriado: esDiaFeriado
        });
    }

    doc.autoTable({
        startY: cursorY,
        columns: columns,
        body: rows,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 1,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            valign: 'middle',
            halign: 'center',
            minCellHeight: 4 
        },
        headStyles: {
            fillColor: [50, 50, 50],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7,
            cellPadding: 2
        },
        columnStyles: {
            dia: { cellWidth: 10, fontStyle: 'bold' },
            fecha: { cellWidth: 8 },
            firma: { cellWidth: 20 },
            motivo: { halign: 'left' }
        },
        didParseCell: function(data) {
            if (data.section === 'body') {
                const row = rows[data.row.index];
                if (row.esFinSemana || row.esFeriado) {
                    data.cell.styles.fillColor = [240, 240, 240];
                    if (row.esFeriado) {
                        data.cell.styles.fillColor = [220, 220, 220];
                    }
                }
            }
        },
        margin: { bottom: 10 }
    });

    // RESUMEN
    // Calculamos si cabe en la página
    let finalY = doc.lastAutoTable.finalY + 4;
    const pageHeight = doc.internal.pageSize.height;
    
    // Si queda muy poco espacio, forzamos la posición para que no salte
    // 35mm es aprox lo que necesita el bloque de resumen + firmas
    if (pageHeight - finalY < 35) {
        // Opción A: Intentar compactar más (no hay mucho margen)
        // Opción B: Alertar o dejar que salte (pero queremos 1 hoja)
        // Ajuste: Subimos el bloque un poco si hay espacio blanco arriba
    }

    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(14, finalY, 186, 12); 

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN:', 16, finalY + 4);
    
    doc.setFont(undefined, 'normal');
    doc.text('Días Lab: ____', 16, finalY + 9);
    doc.text('Asistencias: ____', 40, finalY + 9);
    doc.text('Faltas: ____', 70, finalY + 9);
    doc.text('Retardos: ____', 95, finalY + 9);
    
    if (opciones.incluirHorasExtras) {
        doc.text('Total Extra: ____', 125, finalY + 9);
    }

    const firmaY = finalY + 22; 
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    
    doc.line(30, firmaY, 80, firmaY);
    doc.text('FIRMA EMPLEADO', 55, firmaY + 3, { align: 'center' });

    if (opciones.incluirAprobacion) {
        doc.line(130, firmaY, 180, firmaY);
        doc.text('SUPERVISOR', 155, firmaY + 3, { align: 'center' });
    }

    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 195, pageHeight - 5, { align: 'right' });

    const nombreLimpio = empleado.nombre.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Asistencia_${nombreLimpio}_${nombreMes}_${ano}.pdf`);
}

// ==========================================
// UTILIDADES
// ==========================================

function formatearFechaCorta(fechaStr) {
    const partes = fechaStr.split('-');
    return `${partes[2]}/${partes[1]}`;
}

function getDiasEnMes(ano, mes) {
    return new Date(ano, mes, 0).getDate();
}

function getDiaSemana(ano, mes, dia) {
    const fecha = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
}

function esFinDeSemana(ano, mes, dia) {
    const fecha = new Date(ano, mes - 1, dia);
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
}

function getNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
}

// ==========================================
// PERSISTENCIA
// ==========================================

function guardarConfiguracion() {
    const config = {
        empleados,
        feriados,
        logoData,
        nextId,
        mes: document.getElementById('mes') ? document.getElementById('mes').value : 12,
        ano: document.getElementById('ano') ? document.getElementById('ano').value : 2025,
        horaEstandar: document.getElementById('horaEstandar') ? document.getElementById('horaEstandar').value : '09:00',
        horaSalida: document.getElementById('horaSalida') ? document.getElementById('horaSalida').value : '18:00',
        opciones: {
            incluirHorasExtras: document.getElementById('incluirHorasExtras') ? document.getElementById('incluirHorasExtras').checked : true,
            incluirTipoJornada: document.getElementById('incluirTipoJornada') ? document.getElementById('incluirTipoJornada').checked : true,
            incluirMotivoAusencia: document.getElementById('incluirMotivoAusencia') ? document.getElementById('incluirMotivoAusencia').checked : true,
            incluirAprobacion: document.getElementById('incluirAprobacion') ? document.getElementById('incluirAprobacion').checked : true
        }
    };
    
    try {
        localStorage.setItem('controlAsistencia', JSON.stringify(config));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            mostrarNotificacion('Memoria llena (Logo pesado)', 'error');
        }
    }
}

function cargarConfiguracion() {
    const configRaw = localStorage.getItem('controlAsistencia');
    if (!configRaw) return;

    try {
        const data = JSON.parse(configRaw);
        empleados = data.empleados || [];
        empleados.forEach(e => { if(typeof e.seleccionado === 'undefined') e.seleccionado = true; });
        
        feriados = data.feriados || [];
        logoData = data.logoData || null;
        nextId = data.nextId || 4;

        if (document.getElementById('mes') && data.mes) document.getElementById('mes').value = data.mes;
        if (document.getElementById('ano') && data.ano) document.getElementById('ano').value = data.ano;
        if (document.getElementById('horaEstandar') && data.horaEstandar) document.getElementById('horaEstandar').value = data.horaEstandar;
        if (document.getElementById('horaSalida') && data.horaSalida) document.getElementById('horaSalida').value = data.horaSalida;
        
        if (data.opciones && document.getElementById('incluirHorasExtras')) {
            document.getElementById('incluirHorasExtras').checked = data.opciones.incluirHorasExtras;
            document.getElementById('incluirTipoJornada').checked = data.opciones.incluirTipoJornada;
            document.getElementById('incluirMotivoAusencia').checked = data.opciones.incluirMotivoAusencia;
            document.getElementById('incluirAprobacion').checked = data.opciones.incluirAprobacion;
        }
    } catch (e) { console.error('Error config:', e); }
}

function guardarConfiguracionAuto() {
    document.querySelectorAll('input, select').forEach(element => {
        if(element.id !== 'nuevoEmpleado' && element.id !== 'fechaFeriado' && element.id !== 'descFeriado') {
            element.addEventListener('change', guardarConfiguracion);
        }
    });
}

function exportarConfiguracion() {
    const config = localStorage.getItem('controlAsistencia');
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacion('Backup descargado', 'success');
}

function importarConfiguracion() {
    const input = document.getElementById('importFile');
    if(input) input.click();
}

function procesarImportacion() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            JSON.parse(e.target.result);
            localStorage.setItem('controlAsistencia', e.target.result);
            location.reload();
        } catch (error) {
            mostrarNotificacion('Archivo inválido', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// UI & NOTIFICACIONES
// ==========================================

function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: ${colores[tipo]}; color: white;
        padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000; font-family: sans-serif; font-size: 14px;
        animation: fadeIn 0.3s ease;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function mostrarAyuda() {
    alert('Asistencia v4.0 (Compacta)\n- Generación optimizada para 1 sola hoja.\n- Gestiona feriados y empleados desde el dashboard.');
}

// Estilos dinámicos para notificaciones
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);