// ========================================
// CHARTS.JS - Módulo de Gráficas de Estadísticas
// Control de Asistencia PRO
// ========================================

/**
 * @fileoverview Módulo de visualización de estadísticas con Chart.js
 * Proporciona gráficas interactivas para análisis de asistencia
 */

// === ESTADO DEL MÓDULO ===

/** @type {Chart|null} Instancia de gráfica de estados */
let chartEstados = null;

/** @type {Chart|null} Instancia de gráfica de horas */
let chartHoras = null;

/** @type {Chart|null} Instancia de gráfica de tendencia */
let chartTendencia = null;

// === CONSTANTES DE CONFIGURACIÓN ===

/**
 * Paleta de colores para estados de asistencia
 * @constant {Object<string, string>}
 */
const COLORES_ESTADOS = {
    'Presente': '#10b981',      // Verde esmeralda
    'Ausente': '#ef4444',       // Rojo
    'Permiso': '#f59e0b',       // Ámbar
    'Vacaciones': '#3b82f6',    // Azul
    'Feriado': '#8b5cf6',       // Púrpura
    'Día Libre': '#64748b',     // Gris pizarra
    'Incapacidad': '#ec4899',   // Rosa
    'default': '#94a3b8'        // Gris claro (fallback)
};

/**
 * Configuración por defecto para Chart.js
 * @constant {Object}
 */
const CHART_CONFIG = {
    FONT_FAMILY: "'Plus Jakarta Sans', system-ui, sans-serif",
    FONT_SIZE: 12,
    TEXT_COLOR: '#64748b',
    TOOLTIP_BG: 'rgba(15, 23, 42, 0.9)',
    GRID_COLOR: 'rgba(0,0,0,0.05)',
    PRIMARY_COLOR: '#6366f1',
    MAX_EMPLOYEES_BAR: 10,
    ANIMATION_DURATION: 750
};

// === FUNCIONES DE INICIALIZACIÓN ===

/**
 * Inicializa la configuración global de Chart.js
 * Debe llamarse una vez al cargar la página
 * @returns {void}
 */
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js no está disponible');
        return;
    }

    try {
        // Configuración global de fuentes
        Chart.defaults.font.family = CHART_CONFIG.FONT_FAMILY;
        Chart.defaults.font.size = CHART_CONFIG.FONT_SIZE;
        Chart.defaults.color = CHART_CONFIG.TEXT_COLOR;
        
        // Configuración de leyendas
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 16;
        
        // Configuración de tooltips
        Chart.defaults.plugins.tooltip.backgroundColor = CHART_CONFIG.TOOLTIP_BG;
        Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
        Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.displayColors = true;

        // Sincronizar filtros
        sincronizarFiltrosGraficas();
        
    } catch (error) {
        limpiarLoadingGraficas();
        console.error('Error inicializando Chart.js:', error);
    }
}

/**
 * Sincroniza los filtros de gráficas con los selectores del dashboard
 * @returns {void}
 */
function sincronizarFiltrosGraficas() {
    const mesInput = document.getElementById('mes');
    const anoInput = document.getElementById('ano');
    const chartMes = document.getElementById('chartMes');
    const chartAno = document.getElementById('chartAno');
    
    const mesActual = mesInput?.value || (new Date().getMonth() + 1);
    const anoActual = anoInput?.value || new Date().getFullYear();
    
    if (chartMes) chartMes.value = mesActual;
    if (chartAno) chartAno.value = anoActual;
}

// === FUNCIONES PRINCIPALES ===

/**
 * Actualiza todas las gráficas con datos del período seleccionado
 * @returns {Promise<void>}
 */
async function actualizarGraficas() {
    const chartMesInput = document.getElementById('chartMes');
    const chartAnoInput = document.getElementById('chartAno');
    const emptyState = document.getElementById('chartsEmptyState');
    const chartsGrid = document.querySelector('.charts-grid');
    
    const chartMes = chartMesInput?.value;
    const chartAno = chartAnoInput?.value;
    
    if (!chartMes || !chartAno) {
        console.warn('⚠️ Filtros de gráficas no encontrados');
        return;
    }

    // Mostrar estado de carga
    mostrarLoadingGraficas();

    try {
        // Obtener datos de asistencia
        const registros = await obtenerDatosGraficas(chartMes, chartAno);
        
        if (!registros || registros.length === 0) {
            // Mostrar estado vacío
            if (chartsGrid) chartsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            destruirGraficas();
            showToast('No hay datos para el período seleccionado', 'info');
            return;
        }

        // Mostrar grid, ocultar estado vacío
        if (chartsGrid) chartsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        // Procesar y crear gráficas
        const datosEstados = procesarDistribucionEstados(registros);
        const datosHoras = procesarHorasPorEmpleado(registros);
        const datosTendencia = procesarTendenciaDiaria(registros, chartMes, chartAno);

        crearGraficaEstados(datosEstados);
        crearGraficaHoras(datosHoras);
        crearGraficaTendencia(datosTendencia);
        limpiarLoadingGraficas();

        showToast('📊 Gráficas actualizadas', 'success');

    } catch (error) {
        console.error('❌ Error actualizando gráficas:', error);
        limpiarLoadingGraficas();
        showToast('Error al cargar estadísticas', 'error');
    }
}

/**
 * Obtiene datos de asistencia desde Supabase
 * @param {string|number} mes - Mes a consultar (1-12)
 * @param {string|number} ano - Año a consultar
 * @returns {Promise<Array>} Array de registros de asistencia
 */
async function obtenerDatosGraficas(mes, ano) {
    if (!supabase) {
        console.warn('⚠️ Supabase no disponible');
        return [];
    }

    try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('⚠️ Usuario no autenticado');
            return [];
        }

        // Obtener IDs de empleados del usuario
        const { data: misEmpleados, error: errorEmpleados } = await supabase
            .from('empleados')
            .select('id')
            .eq('created_by', user.id)
            .eq('activo', true);

        if (errorEmpleados) throw errorEmpleados;
        if (!misEmpleados || misEmpleados.length === 0) return [];

        const idsEmpleados = misEmpleados.map(e => e.id);

        // Calcular rango de fechas
        const mesStr = String(mes).padStart(2, '0');
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const fechaInicio = `${ano}-${mesStr}-01`;
        const fechaFin = `${ano}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`;

        // Consultar asistencias (solo campos necesarios)
        const { data, error } = await supabase
            .from('asistencias')
            .select('empleado_id, empleado_nombre, fecha, estado, horas_trabajadas')
            .in('empleado_id', idsEmpleados)
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .order('fecha', { ascending: true });

        if (error) throw error;

        return data || [];

    } catch (error) {
        console.error('❌ Error obteniendo datos para gráficas:', error);
        return [];
    }
}

// === FUNCIONES DE PROCESAMIENTO DE DATOS ===

/**
 * Procesa registros para obtener distribución de estados
 * @param {Array} registros - Registros de asistencia
 * @returns {{labels: string[], data: number[], colors: string[]}}
 */
function procesarDistribucionEstados(registros) {
    const conteo = {};
    
    registros.forEach(registro => {
        const estado = registro.estado || 'Sin estado';
        conteo[estado] = (conteo[estado] || 0) + 1;
    });

    const labels = Object.keys(conteo);
    const data = Object.values(conteo);
    const colors = labels.map(label => COLORES_ESTADOS[label] || COLORES_ESTADOS.default);

    return { labels, data, colors };
}

/**
 * Procesa registros para obtener horas trabajadas por empleado
 * @param {Array} registros - Registros de asistencia
 * @returns {{labels: string[], data: number[]}}
 */
function procesarHorasPorEmpleado(registros) {
    const horasPorEmpleado = {};
    
    registros.forEach(registro => {
        const nombre = registro.empleado_nombre || 'Sin nombre';
        const horas = parseFloat(registro.horas_trabajadas) || 0;
        horasPorEmpleado[nombre] = (horasPorEmpleado[nombre] || 0) + horas;
    });

    // Ordenar por horas descendente y limitar
    const sorted = Object.entries(horasPorEmpleado)
        .sort((a, b) => b[1] - a[1])
        .slice(0, CHART_CONFIG.MAX_EMPLOYEES_BAR);

    return {
        labels: sorted.map(([nombre]) => nombre),
        data: sorted.map(([, horas]) => Math.round(horas * 10) / 10)
    };
}

/**
 * Procesa registros para obtener tendencia diaria de asistencia
 * @param {Array} registros - Registros de asistencia
 * @param {string|number} mes - Mes del período
 * @param {string|number} ano - Año del período
 * @returns {{labels: string[], data: number[]}}
 */
function procesarTendenciaDiaria(registros, mes, ano) {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const diasDelMes = Array.from({ length: ultimoDia }, (_, i) => i + 1);
    
    // Contar empleados únicos y presentes por día
    const totalEmpleados = new Set(registros.map(r => r.empleado_id)).size || 1;
    const presentesPorDia = {};
    
    registros.forEach(registro => {
        if (registro.estado === 'Presente') {
            // Parsear día sin Date() para evitar problemas de zona horaria
            const dia = parseInt(registro.fecha.split('-')[2], 10);
            presentesPorDia[dia] = (presentesPorDia[dia] || 0) + 1;
        }
    });

    // Calcular porcentaje de asistencia por día
    const porcentajes = diasDelMes.map(dia => {
        const presentes = presentesPorDia[dia] || 0;
        return Math.round((presentes / totalEmpleados) * 100);
    });

    return {
        labels: diasDelMes.map(d => String(d)),
        data: porcentajes
    };
}

// === FUNCIONES DE CREACIÓN DE GRÁFICAS ===

/**
 * Crea o actualiza la gráfica de distribución de estados (Doughnut)
 * @param {{labels: string[], data: number[], colors: string[]}} datos - Datos procesados
 * @returns {void}
 */
function crearGraficaEstados(datos) {
    const ctx = document.getElementById('chartEstados');
    if (!ctx) return;

    // Destruir instancia existente
    if (chartEstados) {
        chartEstados.destroy();
        chartEstados = null;
    }

    chartEstados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.labels,
            datasets: [{
                data: datos.data,
                backgroundColor: datos.colors,
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: {
                duration: CHART_CONFIG.ANIMATION_DURATION
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const porcentaje = total > 0 
                                ? Math.round((context.raw / total) * 100) 
                                : 0;
                            return `${context.label}: ${context.raw} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crea o actualiza la gráfica de horas por empleado (Barras horizontales)
 * @param {{labels: string[], data: number[]}} datos - Datos procesados
 * @returns {void}
 */
function crearGraficaHoras(datos) {
    const ctx = document.getElementById('chartHoras');
    if (!ctx) return;

    if (chartHoras) {
        chartHoras.destroy();
        chartHoras = null;
    }

    // Generar gradiente de colores (azul a púrpura)
    const coloresBarra = datos.labels.map((_, i) => {
        const hue = 220 + (i * 15);
        return `hsl(${hue}, 70%, 55%)`;
    });

    chartHoras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.labels,
            datasets: [{
                label: 'Horas trabajadas',
                data: datos.data,
                backgroundColor: coloresBarra,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: CHART_CONFIG.ANIMATION_DURATION
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.raw} horas`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: CHART_CONFIG.GRID_COLOR
                    },
                    ticks: {
                        callback: (val) => `${val}h`
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Crea o actualiza la gráfica de tendencia diaria (Línea)
 * @param {{labels: string[], data: number[]}} datos - Datos procesados
 * @returns {void}
 */
function crearGraficaTendencia(datos) {
    const ctx = document.getElementById('chartTendencia');
    if (!ctx) return;

    if (chartTendencia) {
        chartTendencia.destroy();
        chartTendencia = null;
    }

    chartTendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.labels,
            datasets: [{
                label: '% Asistencia',
                data: datos.data,
                borderColor: CHART_CONFIG.PRIMARY_COLOR,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: CHART_CONFIG.PRIMARY_COLOR,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: CHART_CONFIG.ANIMATION_DURATION
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (context) => `Día ${context[0].label}`,
                        label: (context) => `Asistencia: ${context.raw}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 15
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: CHART_CONFIG.GRID_COLOR
                    },
                    ticks: {
                        callback: (val) => `${val}%`
                    }
                }
            }
        }
    });
}

// === FUNCIONES DE UTILIDAD ===

/**
 * Muestra estado de carga en los contenedores de gráficas
 * @returns {void}
 */
function mostrarLoadingGraficas() {
    const containers = document.querySelectorAll('.chart-container');
    
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        // Solo mostrar loading si no hay gráfica activa
        const existingLoader = container.querySelector('.chart-loading');
        if (existingLoader) existingLoader.remove();

        let chartInstance = null;
        if (canvas && typeof Chart !== 'undefined' && typeof Chart.getChart === 'function') {
            chartInstance = Chart.getChart(canvas);
        }

        if (canvas && !chartInstance) {
            const loader = document.createElement('div');
            loader.className = 'chart-loading';
            container.appendChild(loader);
        }
    });
}

/**
 * Limpia loaders de graficas
 * @returns {void}
 */
function limpiarLoadingGraficas() {
    document.querySelectorAll('.chart-loading').forEach(loader => loader.remove());
}

/**
 * Destruye todas las instancias de graficas y libera memoria
 * @returns {void}
 */
function destruirGraficas() {
    const charts = [
        { instance: chartEstados, setter: (v) => chartEstados = v },
        { instance: chartHoras, setter: (v) => chartHoras = v },
        { instance: chartTendencia, setter: (v) => chartTendencia = v }
    ];
    
    charts.forEach(({ instance, setter }) => {
        if (instance) {
            instance.destroy();
            setter(null);
        }
    });

    limpiarLoadingGraficas();
}

// === INICIALIZACIÓN ===

/**
 * Inicializa el módulo cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que Chart.js esté cargado
    setTimeout(initCharts, 100);
});
