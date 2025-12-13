// === GENERADOR PDF ===

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

    // Load existing attendance data ONCE for all employees
    let datosMes = [];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodo = `${meses[mes-1]}_${ano}`;
    
    if (typeof cargarAsistenciasDesdeSupabase === 'function') {
        try {
            showToast('Cargando datos de asistencia...', 'info');
            datosMes = await cargarAsistenciasDesdeSupabase(periodo) || [];
            console.log(`Loaded ${datosMes.length} records for PDF generation`);
        } catch(e) {
            console.error('Error loading attendance for PDF:', e);
            showToast('Error cargando datos de asistencia', 'error');
        }
    }

    try {
        for(let i=0; i<sels.length; i++) {
            const p = Math.round(((i+1)/sels.length)*100);
            document.getElementById('progressFill').style.width = p+'%';
            document.getElementById('progressText').textContent = p+'%';
            
            // Filter data for this specific employee
            // Loose equality to handle string/number ID mismatch
            const datosEmpleado = datosMes.filter(d => d.empleado_id == sels[i].id);
            
            await generarPDFEmpleado(sels[i], mes, ano, hIn, hOut, opts, datosEmpleado);
            await new Promise(r => setTimeout(r, 100)); // Small delay for UI update
        }
        showToast('Documentos generados correctamente', 'success');
    } catch(e) { 
        console.error(e); 
        showToast('Error al generar PDF: ' + e.message, 'error');
    }
    finally { 
        btn.disabled = false; 
        setTimeout(() => { document.getElementById('progress').style.display = 'none'; }, 2000);
    }
}

async function generarPDFEmpleado(emp, mes, ano, hIn, hOut, opts, datosEmpleado = []) {
    if (!window.jspdf) {
        showToast('Error: Librería PDF no cargada', 'error');
        throw new Error("jsPDF no definido");
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const dias = new Date(ano, mes, 0).getDate();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Configuración de Colores
    const colors = {
        primary: [44, 62, 80],
        secondary: [52, 73, 94],
        accent: [66, 185, 131],
        gray: [241, 245, 249],
        text: [60, 60, 60],
        lightText: [100, 100, 100],
        white: [255, 255, 255]
    };

    let y = 8; // Margen superior más reducido

    // --- HEADER ---
    if(logoData) {
        try { 
            doc.addImage(logoData, 'PNG', 14, 5, 12, 12, undefined, 'FAST'); 
        } catch(e){}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12); // Más pequeño
    doc.setTextColor(...colors.primary);
    doc.text('CONTROL DE ASISTENCIA', 108, y+3, {align:'center'});
    
    // Subtítulo
    y += 7;
    doc.setFontSize(8); 
    doc.setTextColor(...colors.lightText);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Mensual de Actividades', 108, y, {align:'center'});

    // --- INFO BOX ---
    y += 5;
    doc.setDrawColor(200); 
    doc.setLineWidth(0.1); 
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 188, 12, 2, 2, 'FD'); // Caja más compacta
    
    const infoY = y + 5;
    const infoY2 = y + 9; // Lineas más pegadas

    doc.setFontSize(7.5);
    doc.setTextColor(...colors.secondary);
    
    // Fila 1: Empleado y Periodo
    doc.setFont('helvetica', 'bold'); doc.text('EMPLEADO:', 20, infoY);
    doc.setFont('helvetica', 'normal'); doc.text(emp.nombre, 42, infoY);
    
    doc.setFont('helvetica', 'bold'); doc.text('PERIODO:', 130, infoY);
    doc.setFont('helvetica', 'normal'); doc.text(`${meses[mes-1].toUpperCase()} ${ano}`, 148, infoY);

    // Fila 2: Horario
    doc.setFont('helvetica', 'bold'); doc.text('HORARIO:', 20, infoY2);
    doc.setFont('helvetica', 'normal'); doc.text(`${hIn} - ${hOut}`, 42, infoY2);

    y += 15; // Espacio reducido antes de tabla

    // --- TABLE COLUMNS ---
    let cols = [
        {header:'Día', dataKey:'d'}, 
        {header:'Fecha', dataKey:'f'}, // Ancho ajustado abajo
        {header:'Entrada', dataKey:'in'}, 
        {header:'Salida', dataKey:'out'}, 
        {header:'Hrs Ord.', dataKey:'tot'}
    ];
    
    if(opts.incluirHorasExtras) cols.push({header:'Extra', dataKey:'ex'});
    if(opts.incluirMotivoAusencia) cols.push({header:'Motivo / Observación', dataKey:'mo'});
    cols.push({header:'Firma', dataKey:'fi'});

    // --- TABLE DATA ---
    const rows = [];
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for(let d=1; d<=dias; d++) {
        const date = new Date(ano, mes-1, d);
        const dayIdx = date.getDay();
        const dayName = days[dayIdx];
        const isWeekend = (dayIdx===0 || dayIdx===6);
        const fStr = `${ano}-${(mes).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const holiday = feriados.find(x => x.fecha === fStr);
        
        // Look for existing attendance record (datosEmpleado is already filtered by employee)
        const registro = datosEmpleado.find(r => r.fecha === fStr);
        
        // Format data for PDF
        let entrada = '';
        let salida = '';
        let horasTot = '';
        let horasEx = '';
        let motivo = holiday ? holiday.descripcion : '';
        
        if (registro) {
            // Format hours from DB (24h) to display format (12h am/pm)
            if (registro.hora_entrada) {
                const [h, m] = registro.hora_entrada.split(':');
                let hour = parseInt(h);
                const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
                hour = hour % 12 || 12;
                entrada = `${hour}:${m} ${ampm}`;
            }
            
            if (registro.hora_salida) {
                const [h, m] = registro.hora_salida.split(':');
                let hour = parseInt(h);
                const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
                hour = hour % 12 || 12;
                salida = `${hour}:${m} ${ampm}`;
            }
            
            if (registro.horas_trabajadas) {
                horasTot = registro.horas_trabajadas.toFixed(1);
            }
            
            if (registro.horas_extra && registro.horas_extra > 0) {
                horasEx = registro.horas_extra.toFixed(1);
            }
            
            if (registro.observaciones && !motivo) {
                motivo = registro.observaciones.replace('[✓]', '').trim();
            }
        }
        
        rows.push({
            d: dayName.substring(0,3).toUpperCase(), 
            f: d, 
            in: entrada, 
            out: salida, 
            tot: horasTot, 
            ex: horasEx, 
            mo: motivo, 
            fi:'',
            isGray: (isWeekend || !!holiday),
            isSunday: dayIdx === 0
        });
    }


    // --- GENERATE TABLE ---
    if (typeof doc.autoTable !== 'function') {
        throw new Error("Plugin AutoTable no cargado");
    }
    doc.autoTable({
        startY: y, 
        columns: cols, 
        body: rows,
        theme: 'grid',
        styles: { 
            fontSize: 7.5, // Aumentado para mejor lectura
            font: 'helvetica', 
            cellPadding: 1.5, // Más aire en las celdas
            lineColor: [200, 200, 200], // Líneas más suaves
            lineWidth: 0.1, 
            valign: 'middle', 
            halign: 'center', 
            textColor: colors.text,
            minCellHeight: 5.5 // Celdas más altas (menos comprimido)
        },
        headStyles: { 
            fillColor: colors.primary, 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 8, 
            halign: 'center',
            cellPadding: 2
        },
        columnStyles: { 
            d: {cellWidth:14, fontStyle:'bold'}, 
            f: {cellWidth:14}, 
            in: {cellWidth:22}, // Más espacio para horas
            out: {cellWidth:22}, 
            tot: {cellWidth:16},
            ex: {cellWidth:14},
            fi: {cellWidth:30}, // Más espacio para firma
            mo: {halign:'left', cellWidth:'auto'} 
        },
        didParseCell: (data) => {
            if(data.section==='body') {
                const row = rows[data.row.index];
                if(row.isGray) data.cell.styles.fillColor = [248, 250, 252];
                if(row.isSunday) data.cell.styles.fillColor = [241, 245, 249];
            }
        },
        margin: { left: 14, right: 14 }
    });

    // --- FOOTER & SIGNATURES ---
    // Calcular posición final asegurando que cabe
    let finalY = doc.lastAutoTable.finalY + 5; 
    const pageHeight = doc.internal.pageSize.height;
    
    // Si queda muy poco espacio, ajustar
    if (finalY > pageHeight - 40) finalY = pageHeight - 40;

    // Resumen Box
    doc.setDrawColor(200); 
    doc.setLineWidth(0.1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, finalY, 188, 11, 2, 2, 'S'); 

    doc.setFontSize(7.5); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(...colors.primary);
    doc.text('RESUMEN MENSUAL', 18, finalY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    const lineY = finalY + 8;
    
    doc.text('Días Lab: ____', 18, lineY); 
    doc.text('Asistencias: ____', 60, lineY);
    doc.text('Faltas: ____', 95, lineY); 
    doc.text('Retardos: ____', 125, lineY);
    if(opts.incluirHorasExtras) doc.text('Total Extra: ____', 155, lineY);

    // Firmas (Alineadas abajo)
    // Usamos posición absoluta desde el fondo para uniformidad
    const firmaY = pageHeight - 25; 
    
    doc.setDrawColor(100); 
    doc.setLineWidth(0.3);
    
    // Empleado
    doc.line(30, firmaY, 80, firmaY); 
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMA DEL EMPLEADO', 55, firmaY + 3.5, {align:'center'});

    // Supervisor
    if(opts.incluirAprobacion) {
        doc.line(130, firmaY, 180, firmaY); 
        doc.text('FIRMA DEL SUPERVISOR', 155, firmaY + 3.5, {align:'center'});
    }

    // Pie de página
    doc.setFontSize(6); 
    doc.setTextColor(180);
    const footerY = pageHeight - 6;
    doc.text(`Generado el ${new Date().toLocaleDateString()}`, 108, footerY, {align:'center'});
    
    const safeName = emp.nombre.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Asistencia_${safeName}_${meses[mes-1]}_${ano}.pdf`);
}