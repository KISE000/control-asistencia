// === PDF CONTROLLER ===

async function generarPDFs() {
    const sels = empleados.filter(e => e.seleccionado);
    if (!sels.length) return showToast('Selecciona al menos un empleado', 'warning');
    
    const btn = document.getElementById('btnGenerar');
    const progressBar = document.getElementById('progress');
    const pdfService = new PDFService();
    
    // UI State: Loading
    btn.disabled = true; 
    progressBar.style.display = 'block';

    try {
        // 1. Gather Month/Period Data
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

        // 2. Fetch Attendance Data (Batch)
        let datosMes = [];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const periodo = `${meses[mes-1]}_${ano}`;
        
        if (typeof cargarAsistenciasDesdeSupabase === 'function') {
            showToast('Cargando datos de asistencia...', 'info');
            datosMes = await cargarAsistenciasDesdeSupabase(periodo) || [];
        }

        // 3. Generate PDF for each employee
        for (let i = 0; i < sels.length; i++) {
            updateProgress(i, sels.length);

            // Filter specific employee data
            const datosEmpleado = datosMes.filter(d => d.empleado_id == sels[i].id);
            
            // Prepare DTO (Data Transfer Object) for Service
            const reportData = prepareReportData(sels[i], mes, ano, hIn, hOut, opts, datosEmpleado);
            
            // Generate
            pdfService.generateClientReport(reportData);
            
            // Artificial delay for UI responsiveness
            await new Promise(r => setTimeout(r, 100)); 
        }

        showToast('Documentos generados correctamente', 'success');

    } catch (e) { 
        console.error("PDF Generation Error:", e); 
        showToast('Error al generar PDF: ' + e.message, 'error');
    } finally { 
        // UI State: Reset
        btn.disabled = false; 
        setTimeout(() => { progressBar.style.display = 'none'; }, 2000);
    }
}

function updateProgress(current, total) {
    const p = Math.round(((current + 1) / total) * 100);
    document.getElementById('progressFill').style.width = p + '%';
    document.getElementById('progressText').textContent = p + '%';
}

/**
 * Prepares the raw data into a structured object for PDFService.
 * @param {Object} emp Employee object
 * @param {number} mes Month index (1-12)
 * @param {number} ano Year
 * @param {string} hIn Start time
 * @param {string} hOut End time
 * @param {Object} opts Options
 * @param {Array} datosEmpleado Attendance records
 * @returns {PDFReportData}
 */
function prepareReportData(emp, mes, ano, hIn, hOut, opts, datosEmpleado) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasEnMes = new Date(ano, mes, 0).getDate();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Map rows
    const rows = [];
    for (let d = 1; d <= diasEnMes; d++) {
        const date = new Date(ano, mes - 1, d);
        const dayIdx = date.getDay();
        const fStr = `${ano}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        
        // Find holiday & record
        const holiday = (window.feriados || []).find(x => x.fecha === fStr);
        const registro = datosEmpleado.find(r => r.fecha === fStr);

        let entrada = '';
        let salida = '';
        let horasTot = '';
        let horasEx = '';
        let motivo = holiday ? holiday.descripcion : '';

        if (registro) {
            entrada = formatTime(registro.hora_entrada);
            salida = formatTime(registro.hora_salida);
            if (registro.horas_trabajadas) horasTot = registro.horas_trabajadas.toFixed(1);
            if (registro.horas_extra && registro.horas_extra > 0) horasEx = registro.horas_extra.toFixed(1);
            if (registro.observaciones && !motivo) motivo = registro.observaciones.replace('[✓]', '').trim();
        }

        rows.push({
            d: days[dayIdx].substring(0, 3).toUpperCase(),
            f: d,
            in: entrada,
            out: salida,
            tot: horasTot,
            ex: horasEx,
            mo: motivo,
            fi: '',
            isGray: (dayIdx === 0 || dayIdx === 6 || !!holiday),
            isSunday: dayIdx === 0
        });
    }

    return {
        employee: emp,
        period: `${meses[mes - 1].toUpperCase()} ${ano}`,
        startTime: hIn,
        endTime: hOut,
        includeExtraHours: opts.incluirHorasExtras,
        includeAbsenceReason: opts.incluirMotivoAusencia,
        includeApproval: opts.incluirAprobacion,
        rows: rows,
        summary: {
            daysWorked: '', // To be filled if logic exists
            attendances: '',
            absences: '',
            delays: '',
            totalExtra: ''
        },
        logoData: (typeof logoData !== 'undefined') ? logoData : null
    };
}

/**
 * Formats "HH:MM" (24h) to "H:MM a.m./p.m."
 */
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
}
