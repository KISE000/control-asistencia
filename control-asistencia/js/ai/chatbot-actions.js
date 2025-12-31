/**
 * === CHATBOT ACTIONS PRO - Acciones Avanzadas ===
 * Conecta las intenciones del chatbot con la base de datos Supabase
 * Versión mejorada con más funciones y respuestas ricas
 */

const ChatbotActions = {
    
    /**
     * Obtiene la hora de entrada de una fecha específica
     */
    async getEntrada(fecha) {
        try {
            const registro = await this._getRegistroDia(fecha);
            
            if (!registro) {
                return { text: this._formatNoData(fecha, 'entrada') };
            }
            
            if (registro.hora_entrada) {
                const fechaLabel = this._formatFechaLabel(fecha);
                return {
                    text: `🕐 Tu entrada ${fechaLabel} fue a las **${registro.hora_entrada}**`,
                    card: {
                        type: 'time',
                        icon: 'log-in',
                        label: 'Hora de Entrada',
                        value: registro.hora_entrada,
                        date: fecha.toLocaleDateString('es-ES')
                    }
                };
            } else if (registro.estado === 'Ausente') {
                return { text: `❌ ${this._formatFechaLabel(fecha, true)} no registraste asistencia (Ausente)` };
            } else if (['Feriado', 'Día Libre', 'Vacaciones'].includes(registro.estado)) {
                return { text: `📅 ${this._formatFechaLabel(fecha, true)} fue **${registro.estado}**, no se requería entrada.` };
            } else {
                return { text: `⚠️ No hay hora de entrada registrada para ${this._formatFechaLabel(fecha)}.` };
            }
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar tus datos. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene la hora de salida de una fecha específica
     */
    async getSalida(fecha) {
        try {
            const registro = await this._getRegistroDia(fecha);
            
            if (!registro) {
                return { text: this._formatNoData(fecha, 'salida') };
            }
            
            if (registro.hora_salida) {
                const fechaLabel = this._formatFechaLabel(fecha);
                return {
                    text: `🕐 Tu salida ${fechaLabel} fue a las **${registro.hora_salida}**`,
                    card: {
                        type: 'time',
                        icon: 'log-out',
                        label: 'Hora de Salida',
                        value: registro.hora_salida,
                        date: fecha.toLocaleDateString('es-ES')
                    }
                };
            } else if (registro.estado === 'Ausente') {
                return { text: `❌ ${this._formatFechaLabel(fecha, true)} no registraste asistencia.` };
            } else if (['Feriado', 'Día Libre', 'Vacaciones'].includes(registro.estado)) {
                return { text: `📅 ${this._formatFechaLabel(fecha, true)} fue **${registro.estado}**, no aplica salida.` };
            } else {
                return { text: `⚠️ No hay hora de salida registrada para ${this._formatFechaLabel(fecha)}.` };
            }
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar tus datos. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene el conteo de retardos del mes actual
     */
    async getRetardos() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros de asistencia para este mes aún.' };
            }
            
            // Obtener hora estándar de entrada del sistema
            const horaEstandarInput = document.getElementById('horaEstandar');
            const horaEstandar = horaEstandarInput ? horaEstandarInput.value : '10:00 a. m.';
            
            // Contar retardos
            let retardos = 0;
            let diasConRetardo = [];
            
            for (const reg of registros) {
                if (reg.estado === 'Presente' && reg.hora_entrada) {
                    if (this._esRetardo(reg.hora_entrada, horaEstandar)) {
                        retardos++;
                        diasConRetardo.push(new Date(reg.fecha + 'T00:00:00').toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}));
                    }
                }
            }
            
            if (retardos === 0) {
                return {
                    text: '✅ ¡Excelente! No tienes retardos este mes. 🎉\n\n¡Sigue así, la puntualidad es tu superpoder!',
                    card: {
                        type: 'stat',
                        icon: 'clock',
                        label: 'Retardos',
                        value: '0',
                        status: 'success'
                    }
                };
            } else {
                const diasStr = diasConRetardo.slice(0, 5).join(', ') + (diasConRetardo.length > 5 ? '...' : '');
                return {
                    text: `⏰ Tienes **${retardos} retardo${retardos > 1 ? 's' : ''}** este mes.\n\n📅 Días: ${diasStr}`,
                    card: {
                        type: 'stat',
                        icon: 'clock',
                        label: 'Retardos',
                        value: retardos.toString(),
                        status: retardos > 3 ? 'danger' : 'warning'
                    }
                };
            }
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar retardos. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene el conteo de ausencias del mes actual
     */
    async getAusencias() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros de asistencia para este mes aún.' };
            }
            
            const ausencias = registros.filter(r => r.estado === 'Ausente').length;
            
            if (ausencias === 0) {
                return {
                    text: '✅ ¡Perfecto! No tienes faltas este mes. 🌟\n\n¡Tu compromiso es admirable!',
                    card: {
                        type: 'stat',
                        icon: 'calendar-check',
                        label: 'Faltas',
                        value: '0',
                        status: 'success'
                    }
                };
            } else {
                return {
                    text: `📊 Tienes **${ausencias} falta${ausencias > 1 ? 's' : ''}** registrada${ausencias > 1 ? 's' : ''} este mes.`,
                    card: {
                        type: 'stat',
                        icon: 'calendar-x',
                        label: 'Faltas',
                        value: ausencias.toString(),
                        status: ausencias > 2 ? 'danger' : 'warning'
                    }
                };
            }
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar ausencias. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene el total de horas trabajadas del mes
     */
    async getHorasTrabajadas() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros de asistencia para este mes aún.' };
            }
            
            const totalHoras = registros.reduce((sum, r) => sum + (parseFloat(r.horas_trabajadas) || 0), 0);
            const diasTrabajados = registros.filter(r => r.estado === 'Presente').length;
            const promedio = diasTrabajados > 0 ? (totalHoras / diasTrabajados).toFixed(1) : 0;
            
            return {
                text: `⏱️ **Horas trabajadas este mes:**\n\n• Total: **${totalHoras.toFixed(1)} horas**\n• Días laborados: **${diasTrabajados}**\n• Promedio diario: **${promedio} hrs/día**`,
                card: {
                    type: 'stat',
                    icon: 'timer',
                    label: 'Horas Totales',
                    value: totalHoras.toFixed(1) + ' hrs',
                    status: 'info'
                }
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar horas. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene el total de horas extra del mes
     */
    async getHorasExtra() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros de asistencia para este mes aún.' };
            }
            
            const totalExtras = registros.reduce((sum, r) => sum + (parseFloat(r.horas_extra) || 0), 0);
            const diasConExtras = registros.filter(r => (r.horas_extra || 0) > 0).length;
            
            if (totalExtras === 0) {
                return {
                    text: '📊 No tienes horas extra registradas este mes.\n\n¿Trabajaste de más? Puede que no estén registradas aún.',
                    card: {
                        type: 'stat',
                        icon: 'moon',
                        label: 'Horas Extra',
                        value: '0',
                        status: 'neutral'
                    }
                };
            } else {
                return {
                    text: `🌙 **Horas extra este mes:**\n\n• Total: **${totalExtras.toFixed(1)} horas** adicionales\n• En **${diasConExtras} día${diasConExtras > 1 ? 's' : ''}** diferente${diasConExtras > 1 ? 's' : ''}\n\n💪 ¡Buen esfuerzo!`,
                    card: {
                        type: 'stat',
                        icon: 'moon',
                        label: 'Horas Extra',
                        value: totalExtras.toFixed(1) + ' hrs',
                        status: 'success'
                    }
                };
            }
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar horas extra. Intenta de nuevo.' };
        }
    },

    /**
     * Genera un resumen completo de asistencia del mes
     */
    async getResumen() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay datos de asistencia para generar un resumen este mes.' };
            }
            
            // Calcular estadísticas
            const presentes = registros.filter(r => r.estado === 'Presente').length;
            const ausentes = registros.filter(r => r.estado === 'Ausente').length;
            const permisos = registros.filter(r => ['Permiso', 'Vacaciones', 'Incapacidad'].includes(r.estado)).length;
            const feriados = registros.filter(r => r.estado === 'Feriado' || r.estado === 'Día Libre').length;
            const totalHoras = registros.reduce((sum, r) => sum + (parseFloat(r.horas_trabajadas) || 0), 0);
            const totalExtras = registros.reduce((sum, r) => sum + (parseFloat(r.horas_extra) || 0), 0);
            
            // Calcular retardos
            const horaEstandarInput = document.getElementById('horaEstandar');
            const horaEstandar = horaEstandarInput ? horaEstandarInput.value : '10:00 a. m.';
            let retardos = 0;
            for (const reg of registros) {
                if (reg.estado === 'Presente' && reg.hora_entrada && this._esRetardo(reg.hora_entrada, horaEstandar)) {
                    retardos++;
                }
            }
            
            const mes = new Date().toLocaleDateString('es-ES', { month: 'long' });
            const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
            
            // Determinar estado general
            let estadoGeneral = '';
            if (ausentes === 0 && retardos === 0) {
                estadoGeneral = '\n\n🏆 **¡Asistencia PERFECTA!** Eres un ejemplo a seguir.';
            } else if (ausentes === 0) {
                estadoGeneral = '\n\n🌟 **¡Sin faltas!** Solo cuida la puntualidad.';
            } else if (ausentes <= 1 && retardos <= 2) {
                estadoGeneral = '\n\n👍 Vas bien, ¡sigue así!';
            }
            
            return {
                text: `📊 **Resumen de ${mesCapitalizado}**

✅ Días trabajados: **${presentes}**
❌ Faltas: **${ausentes}**
⏰ Retardos: **${retardos}**
📝 Permisos/Vacaciones: **${permisos}**
🎉 Feriados/Libres: **${feriados}**

⏱️ Horas trabajadas: **${totalHoras.toFixed(1)} hrs**
🌙 Horas extra: **${totalExtras.toFixed(1)} hrs**${estadoGeneral}`
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al generar resumen. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene permisos y vacaciones
     */
    async getPermisos() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros de asistencia para este mes aún.' };
            }
            
            const permisos = registros.filter(r => r.estado === 'Permiso').length;
            const vacaciones = registros.filter(r => r.estado === 'Vacaciones').length;
            const incapacidades = registros.filter(r => r.estado === 'Incapacidad').length;
            const total = permisos + vacaciones + incapacidades;
            
            if (total === 0) {
                return { text: '📋 No tienes permisos, vacaciones ni incapacidades registradas este mes.' };
            }
            
            return {
                text: `📝 **Permisos y ausencias justificadas:**\n\n• Permisos: **${permisos}** día${permisos !== 1 ? 's' : ''}\n• Vacaciones: **${vacaciones}** día${vacaciones !== 1 ? 's' : ''}\n• Incapacidades: **${incapacidades}** día${incapacidades !== 1 ? 's' : ''}`
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al consultar permisos. Intenta de nuevo.' };
        }
    },

    /**
     * Obtiene el día más puntual del mes
     */
    async getMejorDia() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay registros suficientes para determinar tu mejor día.' };
            }
            
            const horaEstandarInput = document.getElementById('horaEstandar');
            const horaEstandar = horaEstandarInput ? horaEstandarInput.value : '10:00 a. m.';
            
            // Encontrar la entrada más temprana
            let mejorRegistro = null;
            let mejorTiempo = Infinity;
            
            for (const reg of registros) {
                if (reg.estado === 'Presente' && reg.hora_entrada) {
                    const minutos = this._horaAMinutos(reg.hora_entrada);
                    if (minutos < mejorTiempo) {
                        mejorTiempo = minutos;
                        mejorRegistro = reg;
                    }
                }
            }
            
            if (!mejorRegistro) {
                return { text: '📋 No encontré registros de entrada para analizar.' };
            }
            
            const fecha = new Date(mejorRegistro.fecha + 'T00:00:00');
            const fechaFormateada = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            
            return {
                text: `🏆 **Tu día más puntual:**\n\n📅 ${fechaFormateada}\n⏰ Llegaste a las **${mejorRegistro.hora_entrada}**\n\n¡Ese es el espíritu! 💪`
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al buscar tu mejor día. Intenta de nuevo.' };
        }
    },

    /**
     * Proyección estimada de horas
     */
    async getProyeccion() {
        try {
            const registros = await this._getRegistrosMesActual();
            
            if (!registros || registros.length === 0) {
                return { text: '📋 No hay datos suficientes para hacer una proyección.' };
            }
            
            const hoy = new Date();
            const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
            const diasTranscurridos = hoy.getDate();
            const diasRestantes = diasDelMes - diasTranscurridos;
            
            const horasTrabajadas = registros.reduce((sum, r) => sum + (parseFloat(r.horas_trabajadas) || 0), 0);
            const diasTrabajados = registros.filter(r => r.estado === 'Presente').length;
            
            if (diasTrabajados === 0) {
                return { text: '📋 Necesito más datos de días trabajados para hacer una proyección.' };
            }
            
            const promedioDiario = horasTrabajadas / diasTrabajados;
            const diasLaborablesRestantes = Math.round(diasRestantes * 0.7); // Aproximado sin fines de semana
            const proyeccionTotal = horasTrabajadas + (promedioDiario * diasLaborablesRestantes);
            
            return {
                text: `📈 **Proyección del mes:**\n\n• Horas hasta hoy: **${horasTrabajadas.toFixed(1)} hrs**\n• Promedio diario: **${promedioDiario.toFixed(1)} hrs**\n• Días laborables restantes: ~**${diasLaborablesRestantes}**\n\n🎯 Proyección total: **~${proyeccionTotal.toFixed(0)} horas**\n\n_*Estimación basada en tu promedio actual_`
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al calcular proyección. Intenta de nuevo.' };
        }
    },

    /**
     * Comparativa con mes anterior
     */
    async getComparativa() {
        try {
            const registrosActual = await this._getRegistrosMesActual();
            const registrosAnterior = await this._getRegistrosMesAnterior();
            
            if (!registrosActual || registrosActual.length === 0) {
                return { text: '📋 No hay datos del mes actual para comparar.' };
            }
            
            if (!registrosAnterior || registrosAnterior.length === 0) {
                return { text: '📋 No hay datos del mes anterior para comparar.' };
            }
            
            const horasActual = registrosActual.reduce((sum, r) => sum + (parseFloat(r.horas_trabajadas) || 0), 0);
            const horasAnterior = registrosAnterior.reduce((sum, r) => sum + (parseFloat(r.horas_trabajadas) || 0), 0);
            
            const faltasActual = registrosActual.filter(r => r.estado === 'Ausente').length;
            const faltasAnterior = registrosAnterior.filter(r => r.estado === 'Ausente').length;
            
            const diffHoras = horasActual - horasAnterior;
            const diffFaltas = faltasActual - faltasAnterior;
            
            const horasIcon = diffHoras >= 0 ? '📈' : '📉';
            const faltasIcon = diffFaltas <= 0 ? '✅' : '⚠️';
            
            return {
                text: `📊 **Comparativa vs mes anterior:**\n\n${horasIcon} Horas: **${diffHoras >= 0 ? '+' : ''}${diffHoras.toFixed(1)}** hrs\n${faltasIcon} Faltas: **${diffFaltas <= 0 ? '' : '+'}${diffFaltas}**\n\n_Mes actual: ${horasActual.toFixed(1)} hrs | Mes anterior: ${horasAnterior.toFixed(1)} hrs_`
            };
            
        } catch (error) {
            console.error('Chatbot Action Error:', error);
            return { text: '❌ Error al generar comparativa. Intenta de nuevo.' };
        }
    },

    // === FUNCIONES AUXILIARES ===
    
    /**
     * Obtiene el registro de asistencia de un día específico
     */
    async _getRegistroDia(fecha) {
        if (!supabase) return null;
        
        const fechaStr = fecha.toISOString().split('T')[0];
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            
            const { data: empleados } = await supabase
                .from('empleados')
                .select('id')
                .eq('created_by', user.id)
                .limit(1);
            
            if (!empleados || empleados.length === 0) return null;
            
            const { data, error } = await supabase
                .from('asistencias')
                .select('*')
                .eq('empleado_id', empleados[0].id)
                .eq('fecha', fechaStr)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
            
        } catch (error) {
            console.error('Error obteniendo registro:', error);
            return null;
        }
    },
    
    /**
     * Obtiene todos los registros del mes actual
     */
    async _getRegistrosMesActual() {
        return await this._getRegistrosMes(new Date());
    },
    
    /**
     * Obtiene todos los registros del mes anterior
     */
    async _getRegistrosMesAnterior() {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - 1);
        return await this._getRegistrosMes(fecha);
    },
    
    /**
     * Obtiene registros de un mes específico
     */
    async _getRegistrosMes(fecha) {
        if (!supabase) return [];
        
        const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        
        const inicioMes = primerDia.toISOString().split('T')[0];
        const finMes = ultimoDia.toISOString().split('T')[0];
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data: empleados } = await supabase
                .from('empleados')
                .select('id')
                .eq('created_by', user.id);
            
            if (!empleados || empleados.length === 0) return [];
            
            const { data, error } = await supabase
                .from('asistencias')
                .select('*')
                .in('empleado_id', empleados.map(e => e.id))
                .gte('fecha', inicioMes)
                .lte('fecha', finMes)
                .order('fecha', { ascending: true });
            
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Error obteniendo registros del mes:', error);
            return [];
        }
    },
    
    /**
     * Formatea la etiqueta de fecha
     */
    _formatFechaLabel(fecha, capitalized = false) {
        const hoy = new Date();
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        
        let label;
        if (fecha.toDateString() === hoy.toDateString()) {
            label = 'hoy';
        } else if (fecha.toDateString() === ayer.toDateString()) {
            label = 'ayer';
        } else {
            label = 'el ' + fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
        }
        
        return capitalized ? label.charAt(0).toUpperCase() + label.slice(1) : label;
    },
    
    /**
     * Mensaje cuando no hay datos
     */
    _formatNoData(fecha, tipo) {
        const fechaLabel = this._formatFechaLabel(fecha, true);
        return `📭 No encontré registro de ${tipo} para ${fechaLabel}. ¿Ya chequeaste ese día?`;
    },
    
    /**
     * Compara si una hora es retardo respecto a la hora estándar
     */
    _esRetardo(horaEntrada, horaEstandar) {
        const minutosEntrada = this._horaAMinutos(horaEntrada);
        const minutosEstandar = this._horaAMinutos(horaEstandar);
        return minutosEntrada > minutosEstandar + 5;
    },
    
    /**
     * Convierte una hora a minutos desde medianoche
     */
    _horaAMinutos(timeStr) {
        if (!timeStr) return 0;
        
        const isPM = timeStr.toLowerCase().includes('p');
        const isAM = timeStr.toLowerCase().includes('a');
        
        const numbers = timeStr.match(/\d+/g);
        if (!numbers || numbers.length < 2) return 0;
        
        let hours = parseInt(numbers[0]);
        const minutes = parseInt(numbers[1]);
        
        if (isPM && hours !== 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    }
};
