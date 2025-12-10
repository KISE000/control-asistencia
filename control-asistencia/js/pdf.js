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

    try {
        for(let i=0; i<sels.length; i++) {
            const p = Math.round(((i+1)/sels.length)*100);
            document.getElementById('progressFill').style.width = p+'%';
            document.getElementById('progressText').textContent = p+'%';
            await generarPDFEmpleado(sels[i], mes, ano, hIn, hOut, opts);
            await new Promise(r => setTimeout(r, 100));
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

    let y = 10; // Margen superior reducido

    // --- HEADER ---
    if(logoData) {
        try { 
            doc.addImage(logoData, 'PNG', 14, 6, 15, 15, undefined, 'FAST'); 
        } catch(e){}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14); // Un poco más pequeño
    doc.setTextColor(...colors.primary);
    doc.text('CONTROL DE ASISTENCIA', 108, y+4, {align:'center'});
    
    // Subtítulo
    y += 9;
    doc.setFontSize(9); 
    doc.setTextColor(...colors.lightText);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Mensual de Actividades', 108, y, {align:'center'});

    // --- INFO BOX ---
    y += 6;
    doc.setDrawColor(200); 
    doc.setLineWidth(0.1); 
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 188, 14, 2, 2, 'FD'); // Caja más compacta
    
    const infoY = y + 6;
    const infoY2 = y + 11; // Lineas más pegadas

    doc.setFontSize(8);
    doc.setTextColor(...colors.secondary);
    
    // Fila 1: Empleado y Periodo
    doc.setFont('helvetica', 'bold'); doc.text('EMPLEADO:', 20, infoY);
    doc.setFont('helvetica', 'normal'); doc.text(emp.nombre, 42, infoY);
    
    doc.setFont('helvetica', 'bold'); doc.text('PERIODO:', 130, infoY);
    doc.setFont('helvetica', 'normal'); doc.text(`${meses[mes-1].toUpperCase()} ${ano}`, 148, infoY);

    // Fila 2: Horario
    doc.setFont('helvetica', 'bold'); doc.text('HORARIO:', 20, infoY2);
    doc.setFont('helvetica', 'normal'); doc.text(`${hIn} - ${hOut}`, 42, infoY2);

    y += 18; // Espacio antes de tabla

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
        
        rows.push({
            d: dayName.substring(0,3).toUpperCase(), 
            f: d, 
            in:'', out:'', tot:'', ex:'', 
            mo: holiday ? holiday.descripcion : '', 
            fi:'',
            isGray: (isWeekend || !!holiday),
            isSunday: dayIdx === 0
        });
    }

    // --- GENERATE TABLE ---
    doc.autoTable({
        startY: y, 
        columns: cols, 
        body: rows,
        theme: 'grid',
        styles: { 
            fontSize: 7, // Reducido para asegurar espacio
            font: 'helvetica', 
            cellPadding: 1, // Compacto
            lineColor: [220], 
            lineWidth: 0.1, 
            valign: 'middle', 
            halign: 'center', 
            textColor: colors.text,
            minCellHeight: 4.2 // Altura controlada
        },
        headStyles: { 
            fillColor: colors.primary, 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 7.5, 
            halign: 'center',
            cellPadding: 2
        },
        columnStyles: { 
            d: {cellWidth:12, fontStyle:'bold'}, 
            f: {cellWidth:12}, // Ancho aumentado para "Fecha"
            in: {cellWidth:20}, 
            out: {cellWidth:20}, 
            tot: {cellWidth:15},
            ex: {cellWidth:12},
            fi: {cellWidth:25}, 
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
    // Compactar el pie de página
    let finalY = doc.lastAutoTable.finalY + 4; // Menos espacio despues de tabla
    
    // Resumen Box
    doc.setDrawColor(200); 
    doc.setLineWidth(0.1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, finalY, 188, 12, 2, 2, 'S'); // Caja más baja

    doc.setFontSize(7.5); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(...colors.primary);
    doc.text('RESUMEN MENSUAL', 18, finalY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    const lineY = finalY + 8.5;
    
    doc.text('Días Lab: ____', 18, lineY); 
    doc.text('Asistencias: ____', 60, lineY);
    doc.text('Faltas: ____', 95, lineY); 
    doc.text('Retardos: ____', 125, lineY);
    if(opts.incluirHorasExtras) doc.text('Total Extra: ____', 155, lineY);

    // Firmas
    const firmaY = finalY + 24; // Subimos las firmas
    
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
    const footerY = doc.internal.pageSize.height - 6;
    doc.text(`Generado el ${new Date().toLocaleDateString()}`, 108, footerY, {align:'center'});
    
    const safeName = emp.nombre.replace(/[^a-z0-9]/gi, '_');
    doc.save(`Asistencia_${safeName}_${meses[mes-1]}_${ano}.pdf`);
}