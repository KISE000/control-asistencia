// ========================================
// CHARTS.JS - Módulo de Gráficas de Estadísticas
// Control de Asistencia PRO
// ========================================

// Variables globales para instancias de gráficas
let chartEstados = null;
let chartHoras = null;
let chartTendencia = null;

// Paleta de colores para estados
const COLORES_ESTADOS = {
    'Presente': '#10b981',      // Verde
    'Ausente': '#ef4444',       // Rojo
    'Permiso': '#f59e0b',       // Amarillo/Ámbar
    'Vacaciones': '#3b82f6',    // Azul
    'Feriado': '#8b5cf6',       // Púrpura
    'Día Libre': '#64748b',     // Gris
    'Incapacidad': '#ec4899',   // Rosa
    'default': '#94a3b8'        // Gris claro
};

// Configuración global de Chart.js
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible');
        return;
    }

    // Configuración global
    Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#64748b';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;

    // Sincronizar filtros con los del dashboard
    sincronizarFiltrosGraficas();
}

/**
 * Sincroniza los filtros de gráficas con los selectores principales del dashboard
 */
function sincronizarFiltrosGraficas() {
    const mesActual = document.getElementById('mes')?.value || new Date().getMonth() + 1;
    const anoActual = document.getElementById('ano')?.value || new Date().getFullYear();
    
    const chartMes = document.getElementById('chartMes');
    const chartAno = document.getElementById('chartAno');
    
    if (chartMes) chartMes.value = mesActual;
    if (chartAno) chartAno.value = anoActual;
}

/**
 * Actualiza todas las gráficas con los datos del período seleccionado
 */
async function actualizarGraficas() {
    const chartMes = document.getElementById('chartMes')?.value;
    const chartAno = document.getElementById('chartAno')?.value;
    const emptyState = document.getElementById('chartsEmptyState');
    const chartsGrid = document.querySelector('.charts-grid');
    
    if (!chartMes || !chartAno) {
        console.warn('Filtros de gráficas no encontrados');
        return;
    }

    // Mostrar loading en cada gráfica
    mostrarLoadingGraficas();

    try {
        // Obtener datos de asistencia del período
        const registros = await obtenerDatosGraficas(chartMes, chartAno);
        
        if (!registros || registros.length === 0) {
            // Mostrar estado vacío
            if (chartsGrid) chartsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            destruirGraficas();
            return;
        }

        // Ocultar estado vacío, mostrar grid
        if (chartsGrid) chartsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        // Procesar datos
        const datosEstados = procesarDistribucionEstados(registros);
        const datosHoras = procesarHorasPorEmpleado(registros);
        const datosTendencia = procesarTendenciaDiaria(registros, chartMes, chartAno);

        // Crear/actualizar gráficas
        crearGraficaEstados(datosEstados);
        crearGraficaHoras(datosHoras);
        crearGraficaTendencia(datosTendencia);

        showToast('📊 Gráficas actualizadas', 'success');

    } catch (error) {
        console.error('Error actualizando gráficas:', error);
        showToast('Error al cargar estadísticas', 'error');
    }
}

/**
 * Obtiene datos de asistencia desde Supabase para el período especificado
 */
async function obtenerDatosGraficas(mes, ano) {
    if (!supabase) {
        console.warn('Supabase no disponible');
        return [];
    }

    try {
        // Primero obtener IDs de empleados del usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: misEmpleados } = await supabase
            .from('empleados')
            .select('id')
            .eq('created_by', user.id)
            .eq('activo', true);

        if (!misEmpleados || misEmpleados.length === 0) return [];

        const idsEmpleados = misEmpleados.map(e => e.id);

        // Calcular rango de fechas
        const mesStr = String(mes).padStart(2, '0');
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const fechaInicio = `${ano}-${mesStr}-01`;
        const fechaFin = `${ano}-${mesStr}-${ultimoDia}`;

        // Consultar asistencias
        const { data, error } = await supabase
            .from('asistencias')
            .select('*')
            .in('empleado_id', idsEmpleados)
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .order('fecha', { ascending: true });

        if (error) throw error;

        return data || [];

    } catch (error) {
        console.error('Error obteniendo datos para gráficas:', error);
        return [];
    }
}

/**
 * Procesa registros para obtener distribución de estados
 */
function procesarDistribucionEstados(registros) {
    const conteo = {};
    
    registros.forEach(r => {
        const estado = r.estado || 'Sin estado';
        conteo[estado] = (conteo[estado] || 0) + 1;
    });

    const labels = Object.keys(conteo);
    const data = Object.values(conteo);
    const colors = labels.map(label => COLORES_ESTADOS[label] || COLORES_ESTADOS.default);

    return { labels, data, colors };
}

/**
 * Procesa registros para obtener horas trabajadas por empleado
 */
function procesarHorasPorEmpleado(registros) {
    const horasPorEmpleado = {};
    
    registros.forEach(r => {
        const nombre = r.empleado_nombre || 'Sin nombre';
        const horas = parseFloat(r.horas_trabajadas) || 0;
        horasPorEmpleado[nombre] = (horasPorEmpleado[nombre] || 0) + horas;
    });

    // Ordenar por horas descendente y tomar top 10
    const sorted = Object.entries(horasPorEmpleado)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return {
        labels: sorted.map(([nombre]) => nombre),
        data: sorted.map(([, horas]) => Math.round(horas * 10) / 10)
    };
}

/**
 * Procesa registros para obtener tendencia diaria de asistencia
 */
function procesarTendenciaDiaria(registros, mes, ano) {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const diasDelMes = Array.from({ length: ultimoDia }, (_, i) => i + 1);
    
    // Contar presentes por día
    const presentesPorDia = {};
    const totalEmpleados = new Set(registros.map(r => r.empleado_id)).size || 1;
    
    registros.forEach(r => {
        const dia = new Date(r.fecha).getDate();
        if (r.estado === 'Presente') {
            presentesPorDia[dia] = (presentesPorDia[dia] || 0) + 1;
        }
    });

    // Calcular porcentaje de asistencia por día
    const porcentajes = diasDelMes.map(dia => {
        const presentes = presentesPorDia[dia] || 0;
        return Math.round((presentes / totalEmpleados) * 100);
    });

    return {
        labels: diasDelMes.map(d => d.toString()),
        data: porcentajes
    };
}

/**
 * Crea o actualiza la gráfica de distribución de estados (Doughnut)
 */
function crearGraficaEstados(datos) {
    const ctx = document.getElementById('chartEstados');
    if (!ctx) return;

    // Destruir gráfica existente
    if (chartEstados) {
        chartEstados.destroy();
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
                            const porcentaje = Math.round((context.raw / total) * 100);
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
 */
function crearGraficaHoras(datos) {
    const ctx = document.getElementById('chartHoras');
    if (!ctx) return;

    if (chartHoras) {
        chartHoras.destroy();
    }

    // Generar gradiente de colores
    const coloresBarra = datos.labels.map((_, i) => {
        const hue = 220 + (i * 15); // Variación de azul a púrpura
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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw} horas`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: (val) => val + 'h'
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
 */
function crearGraficaTendencia(datos) {
    const ctx = document.getElementById('chartTendencia');
    if (!ctx) return;

    if (chartTendencia) {
        chartTendencia.destroy();
    }

    chartTendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.labels,
            datasets: [{
                label: '% Asistencia',
                data: datos.data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#6366f1',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                        title: (ctx) => `Día ${ctx[0].label}`,
                        label: (ctx) => `Asistencia: ${ctx.raw}%`
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
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: (val) => val + '%'
                    }
                }
            }
        }
    });
}

/**
 * Muestra estado de carga en las gráficas
 */
function mostrarLoadingGraficas() {
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
        // Solo mostrar loading si no hay canvas visible
        const canvas = container.querySelector('canvas');
        if (canvas && !canvas.chart) {
            container.innerHTML = `<div class="chart-loading"></div>`;
        }
    });
}

/**
 * Destruye todas las instancias de gráficas
 */
function destruirGraficas() {
    if (chartEstados) {
        chartEstados.destroy();
        chartEstados = null;
    }
    if (chartHoras) {
        chartHoras.destroy();
        chartHoras = null;
    }
    if (chartTendencia) {
        chartTendencia.destroy();
        chartTendencia = null;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que Chart.js esté cargado
    setTimeout(() => {
        initCharts();
    }, 100);
});
