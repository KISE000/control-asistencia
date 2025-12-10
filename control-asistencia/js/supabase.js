// === LÓGICA DE NUBE (SUPABASE) ===

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

/**
 * Carga datos de asistencia desde Supabase para un período específico
 */
async function cargarAsistenciasDesdeSupabase(periodo) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('asistencias')
            .select('*')
            .eq('periodo', periodo);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error cargando asistencias:', error);
        return null;
    }
}

/**
 * === VISUALIZADOR DE REGISTROS EN LA NUBE ===
 */

// Variable global para almacenar los registros cargados
let registrosAsistenciaGlobal = [];

/**
 * Carga registros de asistencia desde Supabase con filtros
 */
async function cargarRegistrosAsistencia() {
    if (!supabase) {
        showToast('❌ Conexión a base de datos no disponible', 'error');
        return;
    }

    const container = document.getElementById('registrosTableContainer');
    const badge = document.getElementById('badgeConteoRegistros');
    const textoBadge = document.getElementById('textoConteoRegistros');
    
    // Mostrar skeleton loading
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div class="btn-loader" style="margin: 0 auto 16px;"></div>
            <p>Cargando registros desde la nube...</p>
        </div>
    `;
    
    try {
        // Obtener filtros
        const filtroEmpleadoId = document.getElementById('filtroEmpleado').value;
        const filtroMes = document.getElementById('filtroMes').value;
        const filtroAno = document.getElementById('filtroAno').value;
        
        // Construir query
        let query = supabase
            .from('asistencias')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(500);
        
        // Aplicar filtros
        if (filtroEmpleadoId) {
            query = query.eq('empleado_id', parseInt(filtroEmpleadoId));
        }
        
        if (filtroMes && filtroAno) {
            const mesStr = String(filtroMes).padStart(2, '0');
            const inicioPeriodo = `${filtroAno}-${mesStr}-01`;
            const finPeriodo = `${filtroAno}-${mesStr}-31`;
            query = query.gte('fecha', inicioPeriodo).lte('fecha', finPeriodo);
        } else if (filtroAno) {
            query = query.gte('fecha', `${filtroAno}-01-01`).lte('fecha', `${filtroAno}-12-31`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Guardar en variable global
        registrosAsistenciaGlobal = data || [];
        
        // Actualizar badge de conteo
        textoBadge.textContent = `${registrosAsistenciaGlobal.length} registro${registrosAsistenciaGlobal.length !== 1 ? 's' : ''} encontrado${registrosAsistenciaGlobal.length !== 1 ? 's' : ''}`;
        badge.style.display = 'inline-flex';
        
        // Renderizar tabla
        renderTablaRegistros(registrosAsistenciaGlobal);
        
        if (registrosAsistenciaGlobal.length > 0) {
            showToast(`✅ ${registrosAsistenciaGlobal.length} registros cargados`, 'success');
            
            // Actualizar dropdown de empleados si está vacío
            actualizarDropdownEmpleados(registrosAsistenciaGlobal);
        }
        
    } catch (error) {
        console.error('❌ Error cargando registros:', error);
        showToast('Error al cargar registros: ' + error.message, 'error');
        
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #ef4444; margin-bottom: 12px;"></i>
                <p style="font-weight: 600; color: #ef4444;">Error al cargar datos</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Renderiza la tabla de registros en HTML
 */
function renderTablaRegistros(registros) {
    const container = document.getElementById('registrosTableContainer');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i data-lucide="inbox" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px;"></i>
                <p style="font-weight: 600;">No se encontraron registros</p>
                <p style="font-size: 0.9rem;">Intenta con otros filtros o guarda datos primero</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    // Obtener colores para estados
    const getEstadoBadge = (estado) => {
        const badges = {
            'Presente': { bg: '#d1fae5', color: '#065f46', icon: 'check-circle' },
            'Ausente': { bg: '#fee2e2', color: '#991b1b', icon: 'x-circle' },
            'Permiso': { bg: '#fef3c7', color: '#92400e', icon: 'file-text' },
            'Incapacidad': { bg: '#dbeafe', color: '#1e40af', icon: 'heart-pulse' },
            'Vacaciones': { bg: '#e0e7ff', color: '#3730a3', icon: 'palmtree' },
            'Feriado': { bg: '#fce7f3', color: '#831843', icon: 'calendar' },
            'Día Libre': { bg: '#f3e8ff', color: '#6b21a8', icon: 'coffee' }
        };
        
        const badge = badges[estado] || { bg: '#f3f4f6', color: '#374151', icon: 'circle' };
        return `
            <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                background: ${badge.bg};
                color: ${badge.color};
                border-radius: 6px;
                font-size: 0.85rem;
                font-weight: 600;
            ">
                <i data-lucide="${badge.icon}" style="width: 14px; height: 14px;"></i>
                ${estado}
            </span>
        `;
    };
    
    let html = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead style="background: #1e293b; position: sticky; top: 0; z-index: 1;">
                <tr>
                    <th style="padding: 12px; text-align: left; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Empleado</th>
                    <th style="padding: 12px; text-align: left; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Fecha</th>
                    <th style="padding: 12px; text-align: left; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Estado</th>
                    <th style="padding: 12px; text-align: center; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Entrada</th>
                    <th style="padding: 12px; text-align: center; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Salida</th>
                    <th style="padding: 12px; text-align: center; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Hrs Trab.</th>
                    <th style="padding: 12px; text-align: center; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Hrs Extra</th>
                    <th style="padding: 12px; text-align: left; color: white; font-weight: 600; border-bottom: 2px solid #3b82f6;">Observaciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    registros.forEach((reg, idx) => {
        const rowBg = idx % 2 === 0 ? '#fafafa' : 'white';
        const fecha = new Date(reg.fecha + 'T00:00:00');
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        
        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${reg.empleado_nombre}</td>
                <td style="padding: 10px 12px; color: #475569;">${fechaFormateada}</td>
                <td style="padding: 10px 12px;">${getEstadoBadge(reg.estado)}</td>
                <td style="padding: 10px 12px; text-align: center; font-family: monospace; color: #059669;">${reg.hora_entrada || '--:--'}</td>
                <td style="padding: 10px 12px; text-align: center; font-family: monospace; color: #dc2626;">${reg.hora_salida || '--:--'}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 600; color: #1e293b;">${reg.horas_trabajadas || 0}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: ${reg.horas_extra > 0 ? '#ea580c' : '#94a3b8'};">${reg.horas_extra || 0}</td>
                <td style="padding: 10px 12px; color: #64748b; font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${reg.observaciones || ''}">${reg.observaciones || '-'}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    
    // Re-inicializar iconos de Lucide
    if (window.lucide) lucide.createIcons();
}

/**
 * Actualiza el dropdown de empleados con los empleados únicos de los registros
 */
function actualizarDropdownEmpleados(registros) {
    const select = document.getElementById('filtroEmpleado');
    const opcionesActuales = select.querySelectorAll('option').length;
    
    // Solo actualizar si está vacío (solo tiene "Todos")
    if (opcionesActuales > 1) return;
    
    // Obtener empleados únicos
    const empleadosUnicos = [...new Set(registros.map(r => ({ 
        id: r.empleado_id, 
        nombre: r.empleado_nombre 
    }).filter(e => e.id && e.nombre)))];
    
    // Eliminar duplicados por ID
    const empleadosMap = new Map();
    empleadosUnicos.forEach(emp => {
        if (!empleadosMap.has(emp.id)) {
            empleadosMap.set(emp.id, emp);
        }
    });
    
    // Agregar opciones
    empleadosMap.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.nombre;
        select.appendChild(option);
    });
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltrosRegistros() {
    document.getElementById('filtroEmpleado').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAno').value = new Date().getFullYear();
    
    // Limpiar tabla
    document.getElementById('registrosTableContainer').innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i data-lucide="filter-x" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px;"></i>
            <p>Filtros limpiados. Haz clic en "Cargar Datos" para ver registros.</p>
        </div>
    `;
    
    document.getElementById('badgeConteoRegistros').style.display = 'none';
    registrosAsistenciaGlobal = [];
    
    if (window.lucide) lucide.createIcons();
    showToast('Filtros limpiados', 'success');
}

/**
 * Descarga los registros actuales como archivo Excel
 */
function descargarRegistrosExcel() {
    if (!registrosAsistenciaGlobal || registrosAsistenciaGlobal.length === 0) {
        showToast('⚠️ No hay registros para descargar. Carga datos primero.', 'warning');
        return;
    }
    
    try {
        const wb = XLSX.utils.book_new();
        
        // Agrupar por empleado
        const empleadosUnicos = [...new Set(registrosAsistenciaGlobal.map(r => r.empleado_nombre))];
        
        empleadosUnicos.forEach(nombreEmpleado => {
            const datosEmpleado = registrosAsistenciaGlobal
                .filter(r => r.empleado_nombre === nombreEmpleado)
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
            // Preparar datos para Excel
            const datosExport = datosEmpleado.map(d => {
                const fecha = new Date(d.fecha + 'T00:00:00');
                return {
                    'Fecha': d.fecha,
                    'Día': fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
                    'Estado': d.estado,
                    'Entrada': d.hora_entrada || '',
                    'Salida': d.hora_salida || '',
                    'Hrs Trabajadas': parseFloat(d.horas_trabajadas) || 0,
                    'Hrs Extra': parseFloat(d.horas_extra) || 0,
                    'Observaciones': d.observaciones || ''
                };
            });
            
            // Crear hoja
            const ws = XLSX.utils.json_to_sheet(datosExport);
            
            // Anchos de columna
            ws['!cols'] = [
                { wch: 12 }, // Fecha
                { wch: 10 }, // Día
                { wch: 15 }, // Estado
                { wch: 10 }, // Entrada
                { wch: 10 }, // Salida
                { wch: 14 }, // Hrs Trab
                { wch: 12 }, // Hrs Extra
                { wch: 40 }  // Obs
            ];
            
            // Nombre de hoja (sin caracteres inválidos)
            const nombreHoja = nombreEmpleado.substring(0, 30).replace(/[:\/?*\[\]\\]/g, '');
            XLSX.utils.book_append_sheet(wb, ws, nombreHoja || 'Empleado');
        });
        
        // Generar archivo
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Registros_Asistencia_${fechaActual}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        
        showToast(`✅ Excel descargado: ${nombreArchivo}`, 'success');
        
    } catch (error) {
        console.error('Error descargando Excel:', error);
        showToast('❌ Error al generar Excel', 'error');
    }
}

/**
 * === GESTIÓN DE EMPLEADOS EN BASE DE DATOS ===
 */

/**
 * Guarda un nuevo empleado en la base de datos y registra la operación
 */
async function guardarEmpleadoSupabase(nombre) {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return null;
    }

    try {
        // Obtener información del usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        // Insertar empleado
        const { data: empleado, error: errorEmpleado } = await supabase
            .from('empleados')
            .insert([{ 
                nombre: nombre,
                activo: true,
                created_by: user?.id || null
            }])
            .select()
            .single();

        if (errorEmpleado) throw errorEmpleado;

        // Registrar operación en log
        const { error: errorLog } = await supabase
            .from('empleados_log')
            .insert([{
                empleado_id: empleado.id,
                empleado_nombre: nombre,
                operacion: 'CREAR',
                usuario_email: user?.email || 'Desconocido'
            }]);

        if (errorLog) console.warn('Error registrando log:', errorLog);

        console.log('✅ Empleado guardado en base de datos:', empleado);
        return empleado;

    } catch (error) {
        console.error('❌ Error guardando empleado:', error);
        showToast('Error al guardar en base de datos: ' + error.message, 'error');
        return null;
    }
}

/**
 * Marca un empleado como inactivo y registra la operación
 */
async function eliminarEmpleadoSupabase(empleadoId, nombre) {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return false;
    }

    try {
        // Obtener información del usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        // Marcar como inactivo
        const { error: errorUpdate } = await supabase
            .from('empleados')
            .update({ activo: false, updated_at: new Date().toISOString() })
            .eq('id', empleadoId);

        if (errorUpdate) throw errorUpdate;

        // Registrar operación en log
        const { error: errorLog } = await supabase
            .from('empleados_log')
            .insert([{
                empleado_id: empleadoId,
                empleado_nombre: nombre,
                operacion: 'ELIMINAR',
                usuario_email: user?.email || 'Desconocido'
            }]);

        if (errorLog) console.warn('Error registrando log:', errorLog);

        console.log('✅ Empleado eliminado en base de datos:', empleadoId);
        return true;

    } catch (error) {
        console.error('❌ Error eliminando empleado:', error);
        showToast('Error al eliminar de base de datos: ' + error.message, 'error');
        return false;
    }
}

/**
 * Marca todos los empleados como inactivos y registra las operaciones
 */
async function limpiarEmpleadosSupabase() {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return false;
    }

    try {
        // Obtener información del usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        // Obtener todos los empleados activos
        const { data: empleadosActivos, error: errorGet } = await supabase
            .from('empleados')
            .select('*')
            .eq('activo', true);

        if (errorGet) throw errorGet;

        if (!empleadosActivos || empleadosActivos.length === 0) {
            console.log('No hay empleados activos para eliminar');
            return true;
        }

        // Marcar todos como inactivos
        const { error: errorUpdate } = await supabase
            .from('empleados')
            .update({ activo: false, updated_at: new Date().toISOString() })
            .eq('activo', true);

        if (errorUpdate) throw errorUpdate;

        // Registrar operaciones en log para cada empleado
        const logsToInsert = empleadosActivos.map(emp => ({
            empleado_id: emp.id,
            empleado_nombre: emp.nombre,
            operacion: 'ELIMINAR',
            usuario_email: user?.email || 'Desconocido'
        }));

        const { error: errorLog } = await supabase
            .from('empleados_log')
            .insert(logsToInsert);

        if (errorLog) console.warn('Error registrando logs:', errorLog);

        console.log(`✅ ${empleadosActivos.length} empleados eliminados en base de datos`);
        showToast(`${empleadosActivos.length} empleados eliminados de la base de datos`, 'success');
        return true;

    } catch (error) {
        console.error('❌ Error limpiando empleados:', error);
        showToast('Error al limpiar base de datos: ' + error.message, 'error');
        return false;
    }
}

/**
 * Carga empleados activos desde la base de datos
 */
async function cargarEmpleadosDesdeSupabase() {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('empleados')
            .select('*')
            .eq('activo', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        console.log(`✅ ${data?.length || 0} empleados cargados desde base de datos`);
        return data || [];

    } catch (error) {
        console.error('❌ Error cargando empleados:', error);
        showToast('Error al cargar empleados: ' + error.message, 'error');
        return [];
    }
}

/**
 * Sincroniza empleados locales con la base de datos
 * Sube cualquier empleado local que no esté en la base de datos
 */
async function sincronizarEmpleadosConSupabase() {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return;
    }

    try {
        // Cargar empleados desde Supabase
        const empleadosDB = await cargarEmpleadosDesdeSupabase();
        
        // Mapear empleados locales que no tienen ID de base de datos
        const empleadosLocalesSinDB = empleados.filter(emp => !emp.supabaseId);
        
        if (empleadosLocalesSinDB.length > 0) {
            console.log(`Sincronizando ${empleadosLocalesSinDB.length} empleados locales con Supabase...`);
            
            for (const emp of empleadosLocalesSinDB) {
                const empleadoDB = await guardarEmpleadoSupabase(emp.nombre);
                if (empleadoDB) {
                    // Actualizar el empleado local con el ID de Supabase
                    emp.supabaseId = empleadoDB.id;
                }
            }
            
            // Guardar la configuración actualizada
            if (typeof guardarConfiguracion === 'function') {
                guardarConfiguracion();
            }
        }

        // Actualizar empleados locales con los de la base de datos
        const empleadosMap = new Map();
        
        // Agregar empleados de DB
        empleadosDB.forEach(empDB => {
            empleadosMap.set(empDB.id, {
                id: empDB.id,
                supabaseId: empDB.id,
                nombre: empDB.nombre,
                seleccionado: true
            });
        });
        
        // Agregar empleados locales que ya tienen supabaseId
        empleados.forEach(empLocal => {
            if (empLocal.supabaseId && !empleadosMap.has(empLocal.supabaseId)) {
                empleadosMap.set(empLocal.supabaseId, empLocal);
            }
        });
        
        // Convertir mapa a array
        const empleadosSincronizados = Array.from(empleadosMap.values());
        
        if (empleadosSincronizados.length > 0) {
            empleados = empleadosSincronizados;
            if (typeof renderEmpleados === 'function') {
                renderEmpleados();
            }
            if (typeof guardarConfiguracion === 'function') {
                guardarConfiguracion();
            }
        }

        console.log('✅ Sincronización completada');

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}
