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