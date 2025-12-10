// === MÓDULO EXCEL - GENERACIÓN (Multi-Hoja), EDICIÓN y PERSISTENCIA ===

let datosAsistenciaExcel = [];
let modoEdicionExcel = false;

// Nota: obtenerNombreMes, showToast, empleados, feriados, supabase son globales del scope modular.

/**
 * Aplica estilos profesionales, colores, formato condicional y fórmulas al Excel
 * @param {Object} ws - La hoja de trabajo de SheetJS
 * @param {Object} opts - Opciones: { tableHeaderRow: index, tableDataStartRow: index, range: decoded_range, isEdited: boolean }
 */
function aplicarEstilosYFormulasExcel(ws, opts = {}) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const tableHeaderRow = opts.tableHeaderRow || 0;
    const dataStartRow = opts.tableDataStartRow || (tableHeaderRow + 1);

    // === COLORES Y ESTILOS "APPLE-LIKE" ===
    const styles = {
        header: {
            fill: { fgColor: { rgb: "333333" } }, // Gris oscuro elegante
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "medium", color: { rgb: "FFFFFF" } },
                bottom: { style: "medium", color: { rgb: "FFFFFF" } },
                left: { style: "medium", color: { rgb: "FFFFFF" } },
                right: { style: "medium", color: { rgb: "FFFFFF" } }
            }
        },
        cellBase: {
            font: { color: { rgb: "333333" }, sz: 11, name: "Calibri" },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "E5E7EB" } }, // Gris muy suave
                bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                left: { style: "thin", color: { rgb: "E5E7EB" } },
                right: { style: "thin", color: { rgb: "E5E7EB" } }
            }
        },
        altRow: { fgColor: { rgb: "F9FAFB" } }, // Gris casi blanco
        status: {
            feriado: { fill: { fgColor: { rgb: "FFF7ED" } }, font: { color: { rgb: "C2410C" } } }, // Naranja
            ausente: { fill: { fgColor: { rgb: "FEF2F2" } }, font: { color: { rgb: "DC2626" } } }, // Rojo
            presente: { fill: { fgColor: { rgb: "FFFFFF" } }, font: { color: { rgb: "333333" } } }
        },
        totals: {
            fill: { fgColor: { rgb: "F3F4F6" } },
            font: { bold: true, color: { rgb: "111827" }, sz: 11, name: "Calibri" },
            border: { top: { style: "double", color: { rgb: "9CA3AF" } } }
        }
    };

    // 1. Estilos para Encabezados de Tabla
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: tableHeaderRow, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = styles.header;
    }

    // 2. Estilos para Datos y Fórmulas
    for (let R = dataStartRow; R <= range.e.r; ++R) {
        const estadoCell = ws[XLSX.utils.encode_cell({ r: R, c: 3 })]; // Columna D (Estado)
        const estado = estadoCell ? estadoCell.v : '';
        const isFeriado = estado === 'Feriado';
        const isAusente = ['Ausente', 'Incapacidad', 'Permiso'].includes(estado);

        // Color de fondo base (Alternado o por estado)
        let rowStyle = { ...styles.cellBase };
        let bgColor = "FFFFFF";
        let fontColor = "333333";

        if (isFeriado) {
            bgColor = styles.status.feriado.fill.fgColor.rgb;
            fontColor = styles.status.feriado.font.color.rgb;
        } else if (isAusente) {
            bgColor = styles.status.ausente.fill.fgColor.rgb;
            fontColor = styles.status.ausente.font.color.rgb;
        } else if (R % 2 !== 0) { // Alternar filas
            bgColor = styles.altRow.fgColor.rgb;
        }

        // Aplicar estilos celda por celda
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            const existingBorder = rowStyle.border;

            ws[cellAddress].s = {
                fill: { fgColor: { rgb: bgColor } },
                font: { color: { rgb: fontColor }, sz: 11, name: "Calibri" },
                alignment: {
                    horizontal: (C >= 1 && C <= 2) || (C >= 4 && C <= 7) ? "center" : "left",
                    vertical: "center",
                    wrapText: C === 8
                },
                border: existingBorder
            };

            // Formatos Específicos
            if (C === 1) ws[cellAddress].z = "dd/mm/yyyy"; // Fecha
            if (C === 6 || C === 7) ws[cellAddress].z = "0.00";
        }

        // Fórmulas
        if (!isFeriado && !isAusente) {
            const horaEntradaCell = XLSX.utils.encode_cell({ r: R, c: 4 }); // E
            const horaSalidaCell = XLSX.utils.encode_cell({ r: R, c: 5 });  // F
            const horasTrabajadasCell = XLSX.utils.encode_cell({ r: R, c: 6 }); // G
            const horasExtraCell = XLSX.utils.encode_cell({ r: R, c: 7 });     // H

            ws[horasTrabajadasCell].f = `IF(AND(${horaEntradaCell}<>"",${horaSalidaCell}<>""), ROUND((${horaSalidaCell}-${horaEntradaCell})*24, 2), 0)`;
            ws[horasExtraCell].f = `IF(${horasTrabajadasCell}>8, ${horasTrabajadasCell}-8, 0)`;
        }
    }

    // 3. Fila de Totales
    const totalRow = range.e.r + 2;

    // Etiqueta TOTALES
    const labelCell = XLSX.utils.encode_cell({ r: totalRow, c: 0 });
    ws[labelCell] = { v: "TOTALES DEL MES", t: 's' };
    ws[labelCell].s = {
        ...styles.totals,
        alignment: { horizontal: "right", vertical: "center" }
    };

    // Merge para etiqueta
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 5 } });

    // Sumatorias
    const startSum = dataStartRow;
    const endSum = range.e.r + 1; // Ajuste por índice

    // Total H.Trabajadas
    const cellG = XLSX.utils.encode_cell({ r: totalRow, c: 6 });
    ws[cellG] = { f: `SUM(G${startSum}:G${endSum})`, t: 'n', z: '0.00' };
    ws[cellG].s = { ...styles.totals, alignment: { horizontal: "center" } };

    // Total H.Extra
    const cellH = XLSX.utils.encode_cell({ r: totalRow, c: 7 });
    ws[cellH] = { f: `SUM(H${startSum}:H${endSum})`, t: 'n', z: '0.00' };
    ws[cellH].s = { ...styles.totals, alignment: { horizontal: "center" }, font: { ...styles.totals.font, color: { rgb: "C2410C" } } };

    // Actualizar Rango
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRow + 1, c: 8 } });

    // Anchos de Columna
    ws['!cols'] = [
        { wch: 12 }, // Día Sem
        { wch: 14 }, // Fecha
        { wch: 6 },  // Día Num
        { wch: 15 }, // Estado
        { wch: 12 }, // Ent
        { wch: 12 }, // Sal
        { wch: 12 }, // H.Trab
        { wch: 12 }, // H.Ext
        { wch: 40 }  // Obs
    ];

    ws['!freeze'] = { xSplit: 0, ySplit: tableHeaderRow + 1 };
    ws['!sheetView'] = { showGridLines: false };
}

/**
 * Genera archivo Excel descargable con una hoja por empleado.
 */
async function generarExcel() {
    const seleccionados = empleados.filter(e => e.seleccionado);
    if (seleccionados.length === 0) {
        return showToast('Selecciona al menos un empleado', 'warning');
    }

    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const nombreMes = obtenerNombreMes(mes);
    
    const horaEstandar = document.getElementById('horaEstandar').value || "09:00";
    const horaSalida = document.getElementById('horaSalida').value || "18:00";
    
    const wb = XLSX.utils.book_new();

    seleccionados.forEach(emp => {
        // 1. Preparar Datos de la Tabla
        const datos = [];
        const diasMes = new Date(ano, mes, 0).getDate();

        for (let dia = 1; dia <= diasMes; dia++) {
            const currDate = new Date(ano, mes - 1, dia);
            const fechaStr = currDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const esFeriado = feriados.some(f => f.fecha === fechaStr);
            
            // Lógica simple de estado (se puede refinar)
            let estado = esFeriado ? 'Feriado' : 'Presente';
            
            datos.push({
                'Dia': currDate.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''),
                'Fecha': fechaStr,
                '#': dia,
                'Estado': estado,
                'Entrada': esFeriado ? '' : horaEstandar,
                'Salida': esFeriado ? '' : horaSalida,
                'Hrs': '',   // Fórmula
                'Extras': '', // Fórmula
                'Observaciones': esFeriado ? (feriados.find(f => f.fecha === fechaStr)?.descripcion || 'Feriado') : ''
            });
        }

        // 2. Crear Hoja iniciando en fila 6 (A6) para dejar espacio al Header
        // Usamos origin: A6 (fila index 5)
        const ws = XLSX.utils.json_to_sheet(datos, { origin: "A6" });

        // 3. Agregar Encabezados Corporativos (Filas 1-5)
        XLSX.utils.sheet_add_aoa(ws, [
            ["REPORTE DE ASISTENCIA MENSUAL"], // A1
            [`Empleado: ${emp.nombre.toUpperCase()}`], // A2
            [`Periodo: ${nombreMes} ${ano}`], // A3
            [`Fecha Emisión: ${new Date().toLocaleDateString()}`], // A4
            [""] // A5 (Espaciador)
        ], { origin: "A1" });

        // Merge del Título Principal (A1:I1)
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
        
        // === ESTILO TÍTULO PRINCIPAL - PREMIUM ===
        const tituloCell = ws['A1'];
        if(tituloCell) {
            tituloCell.s = {
                font: { bold: true, sz: 18, color: { rgb: "FFFFFF" }, name: "Calibri" },
                fill: { fgColor: { rgb: "1F2937" } }, // Gris oscuro profesional
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "medium", color: { rgb: "1F2937" } },
                    bottom: { style: "medium", color: { rgb: "3B82F6" } }, // Línea azul decorativa
                    left: { style: "medium", color: { rgb: "1F2937" } },
                    right: { style: "medium", color: { rgb: "1F2937" } }
                }
            };
        }
        
        // === ESTILO INFO EMPLEADO (A2-A4) - ELEGANTE ===
        const infoStyle = {
            font: { bold: true, sz: 11, color: { rgb: "1F2937" }, name: "Calibri" },
            fill: { fgColor: { rgb: "F8FAFC" } }, // Gris muy claro
            alignment: { horizontal: "left", vertical: "center" },
            border: {
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } }
            }
        };
        
        ['A2', 'A3', 'A4'].forEach(ref => {
            if(ws[ref]) {
                ws[ref].s = infoStyle;
            }
        });
        
        // Merge info para mejor presentación (A2:C2, A3:C3, A4:C4)
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }); // A2:C2
        ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }); // A3:C3
        ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }); // A4:C4

        // 4. Aplicar Estilos a la Tabla
        // La tabla comienza con HEADERS en Fila 6 (Index 5)
        // Los datos comienzan en Fila 7 (Index 6)
        aplicarEstilosYFormulasExcel(ws, { 
            tableHeaderRow: 5, 
            tableDataStartRow: 6 
        });

        const nombreHoja = emp.nombre.substring(0, 30).replace(/[:\/?*\[\]\\]/g, "");
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja || "Empleado");
    });

    try {
        const nombreArchivo = `Reporte_Asistencia_${nombreMes}_${ano}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        showToast('Reporte generado con éxito', 'success');
    } catch (error) {
        console.error('Error generando Excel:', error);
        showToast('Error al generar Excel. Asegúrate de que SheetJS está cargado.', 'error');
    }
}

/**
 * Abre modal con tabla editable de datos para el periodo seleccionado (Mantenido)
 */
/**
 * Abre modal con tabla editable de datos para el periodo seleccionado
 * Carga datos existentes de Supabase y los combina
 */
/**
 * Abre modal con tabla editable de datos para el periodo seleccionado
 * Carga datos existentes de Supabase y los combina
 */
async function abrirEditorExcel() {
    const seleccionados = empleados.filter(e => e.seleccionado);
    if (seleccionados.length === 0) {
        return showToast('Selecciona al menos un empleado', 'warning');
    }

    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const diasMes = new Date(ano, mes, 0).getDate();
    const horaEstandar = document.getElementById('horaEstandar').value || "09:00 a. m.";
    const horaSalida = document.getElementById('horaSalida').value || "06:00 p. m.";
    const periodo = `${obtenerNombreMes(mes)}_${ano}`;

    // Mostrar loader
    const btn = document.querySelector('button[onclick="abrirEditorExcel()"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<div class="btn-loader"></div> Cargando...';
        btn.disabled = true;
    }

    try {
        // 1. Cargar datos existentes de Supabase
        let datosExistentes = [];
        if (typeof cargarAsistenciasDesdeSupabase === 'function') {
            datosExistentes = await cargarAsistenciasDesdeSupabase(periodo) || [];
        }

        // Generar datos base mergeando con existentes
        datosAsistenciaExcel = [];

        seleccionados.forEach(emp => {
            for (let dia = 1; dia <= diasMes; dia++) {
                const fecha = new Date(ano, mes - 1, dia);
                const fechaStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                
                // Buscar si ya existe registro para este empleado y fecha
                const registroExistente = datosExistentes.find(d => 
                    d.empleado_id === emp.id && d.fecha === fechaStr
                );

                const esFeriado = feriados.some(f => f.fecha === fechaStr);

                let estado = 'Presente';
                if (esFeriado) estado = 'Feriado';

                // Datos default
                let horaEntradaDef = esFeriado ? '' : horaEstandar;
                let horaSalidaDef = esFeriado ? '' : horaSalida;
                let horasTrabajadasDef = (horaSalida && horaEstandar) ? calcularDiferenciaHoras(horaEstandar, horaSalida) : 8;
                let horasExtraDef = 0;
                let obsDef = esFeriado ? `Feriado: ${feriados.find(f => f.fecha === fechaStr)?.descripcion || ''}` : '';
                let completadoDef = false;

                // Si existe registro, usar sus datos (Prioridad a lo guardado)
                if (registroExistente) {
                    estado = registroExistente.estado || estado;
                    
                    // Convertir de formato DB (HH:MM:SS) a formato App (hh:mm a. m.)
                    horaEntradaDef = formatearHoraDesdeDB(registroExistente.hora_entrada) || '';
                    horaSalidaDef = formatearHoraDesdeDB(registroExistente.hora_salida) || '';
                    
                    horasTrabajadasDef = registroExistente.horas_trabajadas || 0;
                    horasExtraDef = registroExistente.horas_extra || 0;
                    
                    // Recuperar 'completado' desde observaciones (hack con tag [✓])
                    let obsRaw = registroExistente.observaciones || '';
                    if (obsRaw.includes('[✓]')) {
                        completadoDef = true;
                        obsDef = obsRaw.replace('[✓]', '').trim();
                    } else {
                        completadoDef = registroExistente.completado || false; // Fallback compatibilidad
                        obsDef = obsRaw;
                    }
                }

                datosAsistenciaExcel.push({
                    id: `${emp.id}_${fechaStr}`,
                    empleado: emp.nombre,
                    empleadoId: emp.id,
                    fecha: fechaStr,
                    dia: dia,
                    estado: estado,
                    horaEntrada: horaEntradaDef,
                    horaSalida: horaSalidaDef,
                    horasTrabajadas: horasTrabajadasDef,
                    horasExtra: horasExtraDef,
                    observaciones: obsDef,
                    completado: completadoDef
                });
            }
        });

        renderTablaExcel();
        document.getElementById('modalExcel').style.display = 'flex';
        modoEdicionExcel = true;
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error('Error al abrir editor:', error);
        showToast('Error al cargar datos previos', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

/**
 * Convierte hora DB (24h) a Formato Display (12h am/pm)
 * Ej: 14:00:00 -> 02:00 p. m.
 */
function formatearHoraDesdeDB(hora24) {
    if (!hora24) return null;
    // Si ya tiene formato am/pm, devolver tal cual (legacy o local)
    if (hora24.includes('m.')) return hora24;
    
    try {
        const [h, m] = hora24.split(':');
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'p. m.' : 'a. m.';
        hour = hour % 12;
        hour = hour ? hour : 12; // el 0 es 12
        return `${String(hour).padStart(2, '0')}:${m} ${ampm}`;
    } catch(e) {
        return hora24;
    }
}

/**
 * Convierte hora Display (12h am/pm) a Formato DB (24h)
 * Ej: 02:00 p. m. -> 14:00:00
 */
function convertirHoraAFormato24h(horaStr) {
    if (!horaStr) return null;
    
    // Si ya parece formato 24h (sin letras), devolver
    if (!horaStr.match(/[a-z]/i)) return horaStr;

    try {
        const match = horaStr.match(/(\d{1,2}):(\d{2})\s*([ap]\.?\s*m\.?)/i);
        if (match) {
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const ampm = match[3].toLowerCase();
            
            if (ampm.includes('p') && h < 12) h += 12;
            if (ampm.includes('a') && h === 12) h = 0;
            
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        }
        return null;
    } catch(e) {
        console.error('Error parseando hora:', horaStr, e);
        return null;
    }
}

/**
 * Genera opciones de hora para selectores (cada 30 minutos)
 */
function generarOpcionesHora(valorSeleccionado) {
    let opciones = '';
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            // Generar formato AM/PM para coincidir con los inputs
            const hour = h;
            const period = hour >= 12 ? 'p. m.' : 'a. m.';
            const hour12 = hour % 12 || 12; // 0 se convierte en 12
            
            const horaStr = `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
            
            // Comparación flexible para selección
            const selected = (valorSeleccionado && valorSeleccionado === horaStr) ? 'selected' : '';
            opciones += `<option value="${horaStr}" ${selected}>${horaStr}</option>`;
        }
    }
    return opciones;
}

/**
 * Renderiza tabla HTML editable con sistema de pestañas (Tabs)
 */
function renderTablaExcel() {
    const container = document.getElementById('tablaExcelContainer');
    
    if (datosAsistenciaExcel.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">No hay datos para mostrar</p>';
        return;
    }

    // 1. Agrupar datos por empleado
    const grupos = {};
    datosAsistenciaExcel.forEach((fila, idx) => {
        if (!grupos[fila.empleadoId]) {
            grupos[fila.empleadoId] = {
                nombre: fila.empleado,
                id: fila.empleadoId,
                filas: []
            };
        }
        grupos[fila.empleadoId].filas.push({ ...fila, globalIdx: idx });
    });

    const gruposArray = Object.values(grupos);
    
    // 2. HTML: Barra de Pestañas
    let html = '<div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">';
    
    // Tabs Header
    html += '<div style="display: flex; background: #f8fafc; border-bottom: 2px solid #e2e8f0; overflow-x: auto;">';
    
    gruposArray.forEach((grupo, idx) => {
        const isActive = idx === 0;
        html += `
            <button 
                onclick="cambiarTabEmpleado('${grupo.id}')" 
                data-tab-id="${grupo.id}"
                style="
                    flex: 0 0 auto;
                    padding: 14px 24px;
                    border: none;
                    background: ${isActive ? 'white' : 'transparent'};
                    color: ${isActive ? '#1e293b' : '#64748b'};
                    font-weight: ${isActive ? '600' : '500'};
                    font-size: 0.95rem;
                    cursor: pointer;
                    border-bottom: 3px solid ${isActive ? '#3b82f6' : 'transparent'};
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "
                onmouseover="if(!this.classList.contains('tab-active')) this.style.background='#f1f5f9'"
                onmouseout="if(!this.classList.contains('tab-active')) this.style.background='transparent'"
                class="${isActive ? 'tab-active' : ''}">
                <div style="
                    background: ${isActive ? '#3b82f6' : '#cbd5e1'};
                    color: white;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 0.8rem;
                ">${grupo.nombre.charAt(0)}</div>
                <span>${grupo.nombre}</span>
                <span style="
                    background: ${isActive ? '#dbeafe' : '#e2e8f0'};
                    color: ${isActive ? '#1e40af' : '#64748b'};
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                ">${grupo.filas.length}</span>
            </button>
        `;
    });
    
    html += '</div>'; // Fin tabs header
    
    // 3. Contenido de las pestañas
    html += '<div style="padding: 0;">';
    
    gruposArray.forEach((grupo, idx) => {
        const isActive = idx === 0;
        
        html += `
            <div 
                id="tab-content-${grupo.id}" 
                data-tab-content="${grupo.id}"
                style="display: ${isActive ? 'block' : 'none'}; animation: fadeIn 0.3s ease;">
                
                <div style="overflow-x: auto; max-height: 60vh; overflow-y: auto;">
                    <table class="tabla-excel" style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; z-index: 10;">
                            <tr style="background: #1e293b;">
                                <th style="padding: 14px 16px; text-align: left; font-size: 0.85rem; color: white; font-weight: 600; min-width: 100px;">Fecha</th>
                                <th style="padding: 14px 16px; text-align: left; font-size: 0.85rem; color: white; font-weight: 600; min-width: 140px;">Estado</th>
                                <th style="padding: 14px 16px; text-align: left; font-size: 0.85rem; color: white; font-weight: 600; min-width: 120px;">Hora Entrada</th>
                                <th style="padding: 14px 16px; text-align: left; font-size: 0.85rem; color: white; font-weight: 600; min-width: 120px;">Hora Salida</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 0.85rem; color: white; font-weight: 600; min-width: 90px;">Hrs Trab.</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 0.85rem; color: white; font-weight: 600; min-width: 90px;">Hrs Extra</th>
                                <th style="padding: 14px 16px; text-align: left; font-size: 0.85rem; color: white; font-weight: 600; min-width: 200px;">Observaciones</th>
                                <th style="padding: 14px 16px; text-align: center; font-size: 0.85rem; color: white; font-weight: 600; min-width: 80px;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        grupo.filas.forEach(fila => {
            const idx = fila.globalIdx;
            const esFeriado = fila.estado === 'Feriado';
            
            // Si está completado, usar verde. Si es feriado, naranja. Si no, alternar.
            let rowBg = esFeriado ? '#fff7ed' : (fila.dia % 2 === 0 ? '#fafafa' : 'white');
            if (fila.completado) rowBg = '#dcfce7'; // Verde realizado

            const borderLeft = esFeriado ? '4px solid #f97316' : (fila.completado ? '4px solid #22c55e' : '4px solid transparent');
            
            // Input readonly para TimePicker
            // Nota: usamos un input text readonly en lugar de select para la hora, para ser consistente con el nuevo TimePicker
            // O si queremos usar el select generado por generarOpcionesHora, hay que ver si el timepicker funciona con selects.
            // El timepicker está diseñado para inputs.
            
            // SOLUCIÓN: Usar inputs readonly que abren el timepicker en lugar de selects
            const inputEntrada = `
                <input type="text" 
                    value="${fila.horaEntrada}" 
                    readonly
                    onclick="abrirTimePickerParaTabla(${idx}, 'horaEntrada', 'Entrada ${fila.fecha}')"
                    class="input-tabla"
                    ${esFeriado ? 'disabled' : ''}
                    style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-family: monospace; text-align: center; font-size: 0.95rem; cursor: pointer; ${esFeriado ? 'background: #f1f5f9; color: #94a3b8;' : 'background: white;'}"
                    placeholder="--:--"
                >
            `;
            
            const inputSalida = `
                <input type="text" 
                    value="${fila.horaSalida}" 
                    readonly
                    onclick="abrirTimePickerParaTabla(${idx}, 'horaSalida', 'Salida ${fila.fecha}')"
                    class="input-tabla"
                    ${esFeriado ? 'disabled' : ''}
                    style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-family: monospace; text-align: center; font-size: 0.95rem; cursor: pointer; ${esFeriado ? 'background: #f1f5f9; color: #94a3b8;' : 'background: white;'}"
                    placeholder="--:--"
                >
            `;

            html += `
                <tr data-idx="${idx}" style="background: ${rowBg}; border-bottom: 1px solid #f1f5f9; border-left: ${borderLeft};">
                    <td style="padding: 10px 16px; color: #334155; font-variant-numeric: tabular-nums;">${fila.fecha.split('-').slice(1).join('/')}</td>
                    <td style="padding: 10px 16px;">
                        <select class="input-tabla" onchange="actualizarCeldaExcel(${idx}, 'estado', this.value)" 
                            style="width: 100%; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; ${esFeriado ? 'color: #ea580c; font-weight: 600;' : ''}">
                            <option value="Presente" ${fila.estado === 'Presente' ? 'selected' : ''}>Presente</option>
                            <option value="Ausente" ${fila.estado === 'Ausente' ? 'selected' : ''}>Ausente</option>
                            <option value="Permiso" ${fila.estado === 'Permiso' ? 'selected' : ''}>Permiso</option>
                            <option value="Incapacidad" ${fila.estado === 'Incapacidad' ? 'selected' : ''}>Incapacidad</option>
                            <option value="Vacaciones" ${fila.estado === 'Vacaciones' ? 'selected' : ''}>Vacaciones</option>
                            <option value="Día Libre" ${fila.estado === 'Día Libre' ? 'selected' : ''}>Día Libre</option>
                            <option value="Feriado" ${fila.estado === 'Feriado' ? 'selected' : ''} ${esFeriado ? '' : 'disabled'}>Feriado</option>
                        </select>
                    </td>
                    <td style="padding: 10px 16px;">
                        ${inputEntrada}
                    </td>
                    <td style="padding: 10px 16px;">
                        ${inputSalida}
                    </td>
                    <td style="padding: 10px 16px;">
                        <input type="number" class="input-tabla" value="${fila.horasTrabajadas}" 
                            onchange="actualizarCeldaExcel(${idx}, 'horasTrabajadas', this.value)" 
                            min="0" max="24" step="0.5" 
                            ${esFeriado ? 'disabled' : ''} 
                            style="width: 100%; text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; ${esFeriado ? 'background: #f1f5f9;' : ''}">
                    </td>
                    <td style="padding: 10px 16px;">
                        <input type="number" class="input-tabla" value="${fila.horasExtra}" 
                            onchange="actualizarCeldaExcel(${idx}, 'horasExtra', this.value)" 
                            min="0" max="12" step="0.5"
                            style="width: 100%; text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; ${fila.horasExtra > 0 ? 'color: #ea580c; font-weight: bold; background: #fff7ed;' : ''}">
                    </td>
                    <td style="padding: 10px 16px;">
                        <input type="text" class="input-tabla" value="${fila.observaciones}" 
                            onchange="actualizarCeldaExcel(${idx}, 'observaciones', this.value)" 
                            placeholder="Observaciones..."
                            style="width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
                    </td>
                    <td style="padding: 10px 16px; text-align: center;">
                        <button onclick="completarDia(${idx})" 
                            class="btn-icon-small"
                            title="${fila.completado ? 'Marcar como pendiente' : 'Marcar como realizado'}"
                            style="
                                background: ${fila.completado ? '#22c55e' : '#f1f5f9'}; 
                                color: ${fila.completado ? 'white' : '#64748b'};
                                border: none;
                                border-radius: 6px;
                                width: 32px;
                                height: 32px;
                                cursor: pointer;
                                transition: all 0.2s;
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                            ">
                            <i data-lucide="${fila.completado ? 'check' : 'check-circle'}" style="width: 18px; height: 18px;"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>'; // Fin contenido y contenedor principal
    
    // 4. Añadir animación CSS
    html += `
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        </style>
    `;
    
    container.innerHTML = html;
}

/**
 * Función auxiliar para conectar el TimePicker con la tabla
 * Se necesita porque el TimePicker original usa IDs, y aquí generamos dinámicamente inputs sin ID único fácil
 * O podemos asignarles IDs dinámicos.
 */
function abrirTimePickerParaTabla(idx, campo, titulo) {
    // Generar un ID temporal único si no tiene
    const inputId = `time_input_${idx}_${campo}`;
    
    // Buscar el input en el DOM (usando selectores relativos al row)
    const row = document.querySelector(`tr[data-idx="${idx}"]`);
    if (!row) return;
    
    // Encontrar el input específico. Como sabemos el HTML, podemos buscar por onclick
    // O más fácil: asignar el ID al elemento que disparó el evento (this) no funciona directo aqui
    // Mejor: buscar el input que tiene ese evento onclick
    const input = row.querySelector(`input[onclick*="'${campo}'"]`);
    if (input) {
        input.id = inputId;
        
        // Escuchar cambios en este input específico para actualizar el modelo de datos
        // Usamos oncchange o un listener una sola vez
        input.onchange = function() {
            actualizarCeldaExcel(idx, campo, this.value);
        };
        
        abrirTimePicker(inputId, titulo);
    }
}

/**
 * Cambia la pestaña activa del empleado
 */
function cambiarTabEmpleado(empleadoId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('[data-tab-content]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar el contenido seleccionado
    const content = document.getElementById('tab-content-' + empleadoId);
    if (content) {
        content.style.display = 'block';
    }
    
    // Actualizar estilos de las pestañas
    document.querySelectorAll('[data-tab-id]').forEach(tab => {
        const isActive = tab.getAttribute('data-tab-id') === empleadoId;
        tab.style.background = isActive ? 'white' : 'transparent';
        tab.style.color = isActive ? '#1e293b' : '#64748b';
        tab.style.fontWeight = isActive ? '600' : '500';
        tab.style.borderBottom = isActive ? '3px solid #3b82f6' : '3px solid transparent';
        
        // Actualizar avatar
        const avatar = tab.querySelector('div');
        if (avatar) {
            avatar.style.background = isActive ? '#3b82f6' : '#cbd5e1';
        }
        
        // Actualizar badge
        const badge = tab.querySelector('span:last-child');
        if (badge) {
            badge.style.background = isActive ? '#dbeafe' : '#e2e8f0';
            badge.style.color = isActive ? '#1e40af' : '#64748b';
        }
        
        // Clase para CSS hover
        if (isActive) {
            tab.classList.add('tab-active');
        } else {
            tab.classList.remove('tab-active');
        }
    });
}

/**
 * Actualiza una celda específica en memoria (Mantenido)
 */
function actualizarCeldaExcel(idx, campo, valor) {
    if (datosAsistenciaExcel[idx]) {
        datosAsistenciaExcel[idx][campo] = valor;

        if (campo === 'horaEntrada' || campo === 'horaSalida') {
            // Calcular diferencia (soportando formato AM/PM)
            const horas = calcularDiferenciaHorasAMPM(datosAsistenciaExcel[idx].horaEntrada, datosAsistenciaExcel[idx].horaSalida);
            datosAsistenciaExcel[idx].horasTrabajadas = horas;

            const rowElement = document.querySelector(`tr[data-idx="${idx}"]`);
            if (rowElement) {
                const inputHrsTrabajadas = rowElement.querySelector('input[type="number"][onchange*="horasTrabajadas"]');
                if (inputHrsTrabajadas) inputHrsTrabajadas.value = horas;
            }
        }

        if (campo === 'estado' && valor !== 'Presente') {
            datosAsistenciaExcel[idx].horasTrabajadas = 0;
            const rowElement = document.querySelector(`tr[data-idx="${idx}"]`);
            if (rowElement) {
                const inputHrsTrabajadas = rowElement.querySelector('input[type="number"][onchange*="horasTrabajadas"]');
                if (inputHrsTrabajadas) inputHrsTrabajadas.value = 0;
            }
        }
    }
}

/**
 * Calcula la diferencia de horas en formato decimal (Mantenido)
 */
function calcularDiferenciaHoras(hora1, hora2) {
    if (!hora1 || !hora2) return 0;

    const [h1, m1] = hora1.split(':').map(Number);
    const [h2, m2] = hora2.split(':').map(Number);

    const entrada = h1 * 60 + m1;
    let salida = h2 * 60 + m2;

    if (salida < entrada) {
        salida += 24 * 60;
    }

    const diff = salida - entrada;
    return (diff / 60).toFixed(1);
}

/**
 * Calcula diferencia de horas soportando formato 12h (AM/PM) y 24h
 */
function calcularDiferenciaHorasAMPM(hora1, hora2) {
    if (!hora1 || !hora2) return 0;
    
    // Función helper para convertir a minutos desde medianoche
    const toMinutes = (timeStr) => {
        // Regex para AM/PM
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([ap]\.?\s*m\.?)/i);
        if (match) {
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const ampm = match[3].toLowerCase();
            
            if (ampm.includes('p') && h < 12) h += 12;
            if (ampm.includes('a') && h === 12) h = 0;
            return h * 60 + m;
        }
        
        // Regex para 24h (fallback)
        const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match24) {
            return parseInt(match24[1]) * 60 + parseInt(match24[2]);
        }
        return 0;
    };

    const min1 = toMinutes(hora1);
    const min2 = toMinutes(hora2);
    
    // Si salida es menor que entrada, asumir día siguiente (add 24h)
    let diff = min2 - min1;
    if (diff < 0) diff += 24 * 60;
    
    return (diff / 60).toFixed(1);
}

// Mantener compatibilidad con la función anterior
function calcularDiferenciaHoras(h1, h2) {
    return calcularDiferenciaHorasAMPM(h1, h2);
}

/**
 * Guarda el progreso actual y mantiene el modal abierto (Guardado Diario)
 */
async function guardarProgreso() {
    await guardarExcelSupabase(true);
}

/**
 * Guarda los datos editados en Supabase con validación de autenticación
 * @param {boolean} keepOpen - Si es true, mantiene el modal abierto (guardado parcial)
 */
async function guardarExcelSupabase(keepOpen = false) {
    // Verificar que Supabase existe
    if (!supabase) {
        return showToast('❌ Error: Conexión a base de datos no disponible', 'error');
    }

    // Identificar botón a usar para loading state
    const btnId = keepOpen ? 'btnGuardarProgreso' : 'btnGuardarExcel';
    const btn = document.getElementById(btnId);
    if (!btn) return; // Seguridad

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="btn-loader"></div> Guardando...';

    try {
        // Verificar autenticación
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            throw new Error('Error al verificar sesión: ' + authError.message);
        }
        
        if (!session) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
            if (window.lucide) lucide.createIcons();
            
            showToast('🔐 Debes iniciar sesión primero', 'warning');
            setTimeout(() => {
                abrirModalLogin();
            }, 500);
            return;
        }

        const mes = parseInt(document.getElementById('mes').value);
        const ano = parseInt(document.getElementById('ano').value);
        const periodo = `${obtenerNombreMes(mes)}_${ano}`;

        // Validar que hay datos
        if (datosAsistenciaExcel.length === 0) {
            throw new Error('No hay datos para guardar');
        }

        // Preparar registros
        // 1. Convertir horas a formato 24h para la DB (Postgres TIME)
        // 2. Empaquetar estado 'completado' dentro de observaciones con tag [✓] para persistencia sin cambiar schema
        const registros = datosAsistenciaExcel.map(d => {
            let obsFinal = d.observaciones || '';
            // Si está completado, agregar tag si no existe
            if (d.completado && !obsFinal.includes('[✓]')) {
                obsFinal = `${obsFinal} [✓]`.trim();
            } else if (!d.completado) {
                // Limpiar tag si existe (desmarcado)
                obsFinal = obsFinal.replace('[✓]', '').trim();
            }

            return {
                empleado_id: d.empleadoId,
                empleado_nombre: d.empleado,
                fecha: d.fecha,
                estado: d.estado,
                hora_entrada: convertirHoraAFormato24h(d.horaEntrada),
                hora_salida: convertirHoraAFormato24h(d.horaSalida),
                horas_trabajadas: parseFloat(d.horasTrabajadas) || 0,
                horas_extra: parseFloat(d.horasExtra) || 0,
                observaciones: obsFinal,
                periodo: periodo,
                periodo_etiqueta: periodo
                // Removido 'completado' directo columna para evitar error de schema
            };
        });

        console.log('📤 Intentando guardar', registros.length, 'registros...');

        // Upsert
        const { data, error } = await supabase
            .from('asistencias')
            .upsert(registros, { onConflict: 'empleado_id,fecha' });

        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw new Error(`Error de base de datos: ${error.message}`);
        }

        console.log('✅ Datos guardados correctamente');
        
        if (keepOpen) {
            showToast('✅ Progreso guardado correctamente', 'success');
        } else {
            showToast('✅ Datos guardados exitosamente en la nube', 'success');
            cerrarModalExcel();
        }

    } catch (error) {
        console.error('❌ Error guardando en Supabase:', error);
        
        let mensajeError = 'Error al guardar en la nube';
        if (error.message.includes('sesión')) {
            mensajeError = '🔒 Debes iniciar sesión para guardar';
        } else {
            mensajeError = error.message;
        }
        
        showToast(mensajeError, 'error');
        
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Descarga Excel desde la tabla editada CON DISEÑO PROFESIONAL Y VISUAL
 */
function descargarExcelEditado() {
    if (datosAsistenciaExcel.length === 0) {
        return showToast('No hay datos para descargar', 'warning');
    }

    try {
        const mes = parseInt(document.getElementById('mes').value);
        const ano = parseInt(document.getElementById('ano').value);
        const nombreMes = obtenerNombreMes(mes);
        
        // Agrupar por empleado
        const empleadosUnicos = [...new Set(datosAsistenciaExcel.map(d => d.empleado))];
        
        const wb = XLSX.utils.book_new();
        
        empleadosUnicos.forEach(nombreEmpleado => {
            // Filtrar datos del empleado
            const datosEmpleado = datosAsistenciaExcel.filter(d => d.empleado === nombreEmpleado);
            
            // Preparar datos para Excel
            const datosExport = datosEmpleado.map(d => ({
                'Dia': new Date(d.fecha).toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''),
                'Fecha': d.fecha,
                '#': d.dia,
                'Estado': d.estado,
                'Entrada': d.horaEntrada,
                'Salida': d.horaSalida,
                'Hrs': parseFloat(d.horasTrabajadas) || 0,
                'Extras': parseFloat(d.horasExtra) || 0,
                'Observaciones': d.observaciones
            }));

            // Crear hoja con datos en A6
            const ws = XLSX.utils.json_to_sheet(datosExport, { origin: "A6" });

            // === HEADER PROFESIONAL Y VISUAL ===
            XLSX.utils.sheet_add_aoa(ws, [
                ["REPORTE DE ASISTENCIA MENSUAL"], // A1
                [`Empleado: ${nombreEmpleado.toUpperCase()}`], // A2
                [`Periodo: ${nombreMes} ${ano}`], // A3
                [`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`], // A4
                [""] // A5 (Espaciador)
            ], { origin: "A1" });

            // === MERGE Y ESTILOS DEL HEADER ===
            if (!ws['!merges']) ws['!merges'] = [];
            
            // Merge título principal (A1:I1)
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
            
            // Estilo Título Principal (A1) - Oscuro y Premium
            if (ws['A1']) {
                ws['A1'].s = {
                    font: { bold: true, sz: 18, color: { rgb: "FFFFFF" }, name: "Calibri" },
                    fill: { fgColor: { rgb: "1F2937" } }, // Gris oscuro profesional
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: "3B82F6" } }
                    }
                };
            }
            
            // Estilos para info del empleado (A2-A4) - Elegante
            const infoStyle = {
                font: { bold: true, sz: 11, color: { rgb: "1F2937" }, name: "Calibri" },
                fill: { fgColor: { rgb: "F8FAFC" } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    left: { style: "thin", color: { rgb: "E2E8F0" } },
                    right: { style: "thin", color: { rgb: "E2E8F0" } },
                    top: { style: "thin", color: { rgb: "E2E8F0" } },
                    bottom: { style: "thin", color: { rgb: "E2E8F0" } }
                }
            };
            
            ['A2', 'A3', 'A4'].forEach(ref => {
                if (ws[ref]) {
                    ws[ref].s = infoStyle;
                }
            });
            
            // Merge info (A2:C2, A3:C3, A4:C4) para que se vea mejor
            ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }); // A2:C2
            ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }); // A3:C3
            ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }); // A4:C4

            // === APLICAR ESTILOS PROFESIONALES A LA TABLA ===
            aplicarEstilosYFormulasExcel(ws, { 
                tableHeaderRow: 5, 
                tableDataStartRow: 6 
            });

            // Nombre de la hoja (sin caracteres inválidos)
            const nombreHoja = nombreEmpleado.substring(0, 30).replace(/[:\/?*\[\]\\]/g, "");
            XLSX.utils.book_append_sheet(wb, ws, nombreHoja || "Empleado");
        });

        // Generar archivo
        const nombreArchivo = `Asistencia_${nombreMes}_${ano}_Editado.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        showToast('📊 Excel Premium generado con éxito', 'success');

    } catch (error) {
        console.error('Error descargando Excel:', error);
        showToast('Error al descargar Excel', 'error');
    }
}

/**
 * Cierra modal de Excel (Mantenido)
 */
function cerrarModalExcel() {
    document.getElementById('modalExcel').style.display = 'none';
    modoEdicionExcel = false;
    datosAsistenciaExcel = [];
}

/**
 * Obtiene nombre del mes (Mantenido)
 */
function obtenerNombreMes(num) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[num - 1] || 'Mes';
}

/**
 * Marca un día como completado (Realizado)
 * Alterna el estado y actualiza el estilo de la fila
 */
function completarDia(idx) {
    if (datosAsistenciaExcel[idx]) {
        // Alternar estado
        datosAsistenciaExcel[idx].completado = !datosAsistenciaExcel[idx].completado;
        const completado = datosAsistenciaExcel[idx].completado;
        
        // Si se marca como completado y no tiene horas, se podría intentar poner horas default
        // Pero por ahora solo cambiamos el estado visual
        
        // Actualizar fila en el DOM para feedback inmediato
        const row = document.querySelector(`tr[data-idx="${idx}"]`);
        if (row) {
            // Actualizar fondo y borde
            const esFeriado = datosAsistenciaExcel[idx].estado === 'Feriado';
            
            if (completado) {
                row.style.background = '#dcfce7'; // Verde
                row.style.borderLeft = '4px solid #22c55e';
            } else {
                // Restaurar color original
                row.style.background = esFeriado ? '#fff7ed' : (datosAsistenciaExcel[idx].dia % 2 === 0 ? '#fafafa' : 'white');
                row.style.borderLeft = esFeriado ? '4px solid #f97316' : '4px solid transparent';
            }
            
            // Actualizar botón
            const btn = row.querySelector('button[onclick^="completarDia"]');
            if (btn) {
                btn.style.background = completado ? '#22c55e' : '#f1f5f9';
                btn.style.color = completado ? 'white' : '#64748b';
                btn.title = completado ? 'Marcar como pendiente' : 'Marcar como realizado';
                
                // Actualizar icono (necesita reinicializar lucide o cambiar innerHTML)
                // Es más seguro cambiar el innerHTML del SVG si no podemos llamar a lucide inmediatamente
                 if (window.lucide) {
                    btn.innerHTML = `<i data-lucide="${completado ? 'check' : 'check-circle'}" style="width: 18px; height: 18px;"></i>`;
                    lucide.createIcons({ root: btn });
                }
            }
        }
    }
}
