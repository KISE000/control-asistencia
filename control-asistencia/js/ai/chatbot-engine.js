/**
 * === CHATBOT ENGINE PRO - Motor de NLP Avanzado ===
 * Versión mejorada con:
 * - Más intenciones y patrones
 * - Contexto conversacional (memoria)
 * - Extracción de entidades mejorada
 * - Personalización
 */

// === CORPUS DE ENTRENAMIENTO EXPANDIDO ===
const CHATBOT_CORPUS = {
    intents: [
        // --- SALUDOS ---
        {
            name: 'saludo',
            patterns: [
                'hola', 'buenos dias', 'buenas tardes', 'buenas noches', 
                'que tal', 'hey', 'hi', 'ola', 'saludos', 'holi', 'que onda',
                'como estas', 'que hay', 'buenas', 'wenas', 'holaa', 'ey'
            ],
            responses: [
                '¡Hola {{nombre}}! 👋 ¿En qué puedo ayudarte hoy?',
                '¡Buenos días {{nombre}}! ¿Qué necesitas saber sobre tu asistencia?',
                '¡Hola! 😊 Estoy aquí para ayudarte con tus consultas.',
                '¡Qué tal {{nombre}}! Cuéntame, ¿qué necesitas?'
            ]
        },
        // --- DESPEDIDAS ---
        {
            name: 'despedida',
            patterns: [
                'adios', 'bye', 'hasta luego', 'nos vemos', 'chao', 
                'gracias bye', 'me voy', 'hasta pronto', 'hasta manana',
                'ya me voy', 'eso es todo', 'nada mas', 'listo gracias'
            ],
            responses: [
                '¡Hasta luego {{nombre}}! 👋 Que tengas un excelente día.',
                '¡Nos vemos! Si necesitas algo más, aquí estaré. 😊',
                '¡Adiós! Fue un gusto ayudarte. ¡Éxito! 🌟',
                '¡Hasta pronto! Recuerda que puedo ayudarte cuando quieras.'
            ]
        },
        // --- AGRADECIMIENTOS ---
        {
            name: 'agradecimiento',
            patterns: [
                'gracias', 'muchas gracias', 'te agradezco', 'thanks', 
                'genial gracias', 'perfecto gracias', 'ok gracias', 'thx',
                'mil gracias', 'super gracias', 'te lo agradezco', 'grax'
            ],
            responses: [
                '¡De nada {{nombre}}! 😊 ¿Hay algo más en lo que pueda ayudarte?',
                '¡Con gusto! Para eso estoy aquí. 💪',
                '¡No hay de qué! Pregunta lo que necesites.',
                '¡Siempre a tu servicio! 🤖✨'
            ]
        },
        // --- ESTADO DE ÁNIMO POSITIVO ---
        {
            name: 'estado_positivo',
            patterns: [
                'estoy bien', 'todo bien', 'excelente', 'muy bien',
                'de maravilla', 'genial', 'increible', 'super'
            ],
            responses: [
                '¡Me alegra escuchar eso! 🎉 ¿En qué puedo ayudarte?',
                '¡Qué bueno! 😊 Cuéntame qué necesitas.',
                '¡Excelente! Ahora dime, ¿qué consulta tienes?'
            ]
        },
        // --- HORA DE ENTRADA ---
        {
            name: 'consultar_entrada',
            patterns: [
                'a que hora entre', 'hora de entrada', 'cuando llegue', 
                'a que hora llegue', 'mi entrada', 'hora entrada hoy',
                'a que hora cheque', 'cuando entre', 'mi hora de llegada',
                'que hora marque entrada', 'hora llegada', 'registro entrada',
                'a que hora inicie', 'cuando comence', 'hora de inicio',
                'entrada de hoy', 'entrada de ayer', 'mi llegada'
            ],
            responses: ['__ACTION:consultar_entrada__'],
            requiresData: true
        },
        // --- HORA DE SALIDA ---
        {
            name: 'consultar_salida',
            patterns: [
                'a que hora sali', 'hora de salida', 'cuando me fui',
                'a que hora me fui', 'mi salida', 'hora salida hoy',
                'que hora marque salida', 'hora de salir', 'cuando termine',
                'a que hora acabe', 'hora de cierre', 'salida de hoy',
                'salida de ayer', 'cuando me retire'
            ],
            responses: ['__ACTION:consultar_salida__'],
            requiresData: true
        },
        // --- RETARDOS ---
        {
            name: 'consultar_retardos',
            patterns: [
                'llegue tarde', 'tengo retardos', 'cuantos retardos', 
                'mis retardos', 'fui impuntual', 'llegue impuntual',
                'veces que llegue tarde', 'retardos del mes', 'retardos este mes',
                'cuantas veces tarde', 'impuntualidades', 'tardanzas',
                'he llegado tarde', 'llego tarde seguido'
            ],
            responses: ['__ACTION:consultar_retardos__'],
            requiresData: true
        },
        // --- FALTAS / AUSENCIAS ---
        {
            name: 'consultar_ausencias',
            patterns: [
                'cuantas faltas', 'mis faltas', 'dias que falte',
                'ausencias', 'cuantas ausencias', 'cuando falte',
                'cuantos dias falte', 'veces que falte', 'inasistencias',
                'dias sin asistir', 'faltas del mes', 'he faltado',
                'cuantas veces falte', 'mis inasistencias'
            ],
            responses: ['__ACTION:consultar_ausencias__'],
            requiresData: true
        },
        // --- HORAS TRABAJADAS ---
        {
            name: 'consultar_horas',
            patterns: [
                'cuantas horas trabaje', 'horas trabajadas', 'mis horas',
                'total de horas', 'horas del mes', 'horas laboradas',
                'tiempo trabajado', 'cuanto trabaje', 'horas acumuladas',
                'mis horas del mes', 'horas totales', 'cuanto he trabajado',
                'tiempo que trabaje'
            ],
            responses: ['__ACTION:consultar_horas__'],
            requiresData: true
        },
        // --- HORAS EXTRA ---
        {
            name: 'consultar_extras',
            patterns: [
                'horas extra', 'mis extras', 'cuantas extras',
                'horas adicionales', 'tiempo extra', 'overtime',
                'extras del mes', 'cuantas horas extra', 'sobretiempo',
                'horas de mas', 'trabaje de mas'
            ],
            responses: ['__ACTION:consultar_extras__'],
            requiresData: true
        },
        // --- RESUMEN GENERAL ---
        {
            name: 'resumen_asistencia',
            patterns: [
                'mi asistencia', 'como va mi asistencia', 'resumen',
                'estadisticas', 'mi situacion', 'como estoy',
                'dame un resumen', 'resumen del mes', 'status',
                'mi reporte', 'reporte de asistencia', 'como voy',
                'mis estadisticas', 'balance del mes', 'todo mi mes'
            ],
            responses: ['__ACTION:resumen_asistencia__'],
            requiresData: true
        },
        // --- PERMISOS / VACACIONES ---
        {
            name: 'consultar_permisos',
            patterns: [
                'cuantos permisos', 'mis permisos', 'dias de permiso',
                'vacaciones', 'mis vacaciones', 'dias libres',
                'incapacidades', 'mis incapacidades', 'dias de descanso'
            ],
            responses: ['__ACTION:consultar_permisos__'],
            requiresData: true
        },
        // --- MEJOR DÍA / PEOR DÍA ---
        {
            name: 'mejor_dia',
            patterns: [
                'mi mejor dia', 'cuando llegue mas temprano',
                'dia mas puntual', 'mejor puntualidad', 'mas temprano'
            ],
            responses: ['__ACTION:mejor_dia__'],
            requiresData: true
        },
        // --- PROYECCIÓN ---
        {
            name: 'proyeccion',
            patterns: [
                'cuanto voy a ganar', 'proyeccion', 'estimado del mes',
                'cuanto ganare', 'calculo de nomina', 'pago estimado'
            ],
            responses: ['__ACTION:proyeccion__'],
            requiresData: true
        },
        // --- COMPARATIVA ---
        {
            name: 'comparativa',
            patterns: [
                'comparar meses', 'mes pasado', 'vs mes anterior',
                'diferencia con', 'mejor o peor que'
            ],
            responses: ['__ACTION:comparativa__'],
            requiresData: true
        },
        // --- AYUDA ---
        {
            name: 'ayuda',
            patterns: [
                'ayuda', 'que puedes hacer', 'comandos', 'opciones',
                'help', 'que sabes', 'como funciona', 'que me puedes decir',
                'para que sirves', 'que haces', 'funciones', 'menu',
                'como te uso', 'que preguntas', 'ejemplos'
            ],
            responses: ['__ACTION:mostrar_ayuda__']
        },
        // --- FECHA/TIEMPO ---
        {
            name: 'consultar_fecha',
            patterns: [
                'que dia es', 'fecha de hoy', 'que fecha es',
                'hoy es', 'dia actual', 'que dia estamos'
            ],
            responses: ['__ACTION:fecha_actual__']
        },
        // --- CLIMA (Easter Egg) ---
        {
            name: 'clima',
            patterns: [
                'que clima hace', 'como esta el clima', 'va a llover',
                'hace frio', 'hace calor'
            ],
            responses: [
                '🌤️ No tengo información del clima, pero sí puedo decirte: ¡llegas a tiempo hoy! 😄',
                '☀️ No sé del clima, pero dentro de la oficina siempre está perfecto. ¿Algo sobre tu asistencia?'
            ]
        },
        // --- CHISTES (Easter Egg) ---
        {
            name: 'chiste',
            patterns: [
                'cuentame un chiste', 'dime un chiste', 'hazme reir',
                'algo gracioso', 'chiste'
            ],
            responses: [
                '😂 ¿Por qué el empleado llegó tarde? Porque su despertador también quería dormir. \n\n¡Ahora sí, cuéntame tu consulta!',
                '🤖 Un robot entra a RH y dice: "Vengo a checar... mis circuitos". \n\nBueno, ¿en qué te ayudo?',
                '⏰ ¿Cuál es el colmo de un reloj checador? ¡Llegar tarde a su propio turno! \n\n¿Qué necesitas saber?'
            ]
        },
        // --- IDENTIDAD DEL BOT ---
        {
            name: 'identidad_bot',
            patterns: [
                'quien eres', 'como te llamas', 'eres un robot',
                'eres humano', 'que eres', 'eres real', 'eres ia'
            ],
            responses: [
                '🤖 Soy tu **Asistente de Control de Asistencia**, potenciado con IA. Estoy aquí para responder tus dudas sobre horarios, faltas, horas extra y más. ¡Pregúntame lo que quieras!',
                '¡Hola! Soy un asistente virtual 🤖 especializado en tu sistema de asistencia. No tengo nombre oficial, pero puedes llamarme "Asistente PRO". 😊'
            ]
        },
        // --- QUEJAS ---
        {
            name: 'queja',
            patterns: [
                'no sirves', 'eres tonto', 'no entiendes', 'eres malo',
                'que inutil', 'no me ayudas'
            ],
            responses: [
                '😅 ¡Lo siento! Aún estoy aprendiendo. ¿Podrías reformular tu pregunta? O escribe "ayuda" para ver qué puedo hacer.',
                '🙏 Disculpa si no te entendí bien. Intenta preguntar de otra forma o usa los botones de sugerencia.',
                '😔 Perdón por la confusión. Estoy mejorando cada día. ¿Me das otra oportunidad?'
            ]
        }
    ],
    
    // Entidades para extracción
    entities: {
        fecha: {
            'hoy': () => new Date(),
            'ayer': () => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d;
            },
            'anteayer': () => {
                const d = new Date();
                d.setDate(d.getDate() - 2);
                return d;
            },
            'antier': () => {
                const d = new Date();
                d.setDate(d.getDate() - 2);
                return d;
            },
            'lunes': () => getLastWeekday(1),
            'martes': () => getLastWeekday(2),
            'miercoles': () => getLastWeekday(3),
            'jueves': () => getLastWeekday(4),
            'viernes': () => getLastWeekday(5),
            'sabado': () => getLastWeekday(6),
            'domingo': () => getLastWeekday(0),
            'lunes pasado': () => getLastWeekday(1),
            'la semana pasada': () => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return d;
            },
            'hace una semana': () => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                return d;
            },
            'el otro dia': () => {
                const d = new Date();
                d.setDate(d.getDate() - 2);
                return d;
            }
        },
        periodo: {
            'este mes': 'current',
            'mes actual': 'current',
            'mes pasado': 'previous',
            'el mes pasado': 'previous',
            'mes anterior': 'previous'
        }
    },
    
    // Respuestas cuando no se entiende
    fallback: [
        '🤔 No entendí eso. ¿Podrías reformularlo? O escribe "ayuda" para ver qué puedo hacer.',
        'Mmm, no estoy seguro de entender. Prueba preguntar de otra forma.',
        '¿Puedes ser más específico? Usa los botones rápidos o escribe "ayuda".',
        'No capté tu pregunta. 🧐 Intenta con frases como "¿a qué hora entré?" o "dame un resumen".'
    ]
};

// === FUNCIONES DE UTILIDAD ===

/**
 * Obtiene el último día de la semana especificado
 */
function getLastWeekday(targetDay) {
    const today = new Date();
    const currentDay = today.getDay();
    let diff = currentDay - targetDay;
    if (diff <= 0) diff += 7;
    const result = new Date(today);
    result.setDate(today.getDate() - diff);
    return result;
}

/**
 * Normaliza texto para comparación
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^\w\s]/g, '') // Quitar puntuación
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
}

/**
 * Calcula similitud entre dos strings (algoritmo mejorado)
 */
function calculateSimilarity(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;
    
    // Tokenización y coincidencia de palabras
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    let matches = 0;
    let partialMatches = 0;
    
    for (const w1 of words1) {
        for (const w2 of words2) {
            if (w1 === w2) {
                matches++;
                break;
            } else if (w1.length > 3 && w2.length > 3) {
                // Coincidencia parcial para palabras largas
                if (w1.includes(w2) || w2.includes(w1)) {
                    partialMatches++;
                    break;
                }
            }
        }
    }
    
    const totalMatches = matches + (partialMatches * 0.5);
    return totalMatches / Math.max(words1.length, words2.length);
}

// === CLASE PRINCIPAL DEL CHATBOT ===

class ChatbotEngine {
    constructor() {
        this.corpus = CHATBOT_CORPUS;
        this.conversationHistory = [];
        this.context = {
            lastIntent: null,
            lastEntities: null,
            userName: null,
            messageCount: 0
        };
        this.initialized = false;
    }

    /**
     * Inicializa el motor
     */
    async init() {
        // Intentar obtener nombre del usuario
        await this.loadUserContext();
        
        this.initialized = true;
        return true;
    }

    /**
     * Carga contexto del usuario desde Supabase
     */
    async loadUserContext() {
        try {
            if (typeof supabase !== 'undefined') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Extraer nombre del email o metadata
                    const email = user.email || '';
                    const nombre = user.user_metadata?.nombre || 
                                   email.split('@')[0].split('.')[0];
                    
                    this.context.userName = nombre.charAt(0).toUpperCase() + nombre.slice(1);
                }
            }
        } catch (e) {
            // No se pudo cargar contexto de usuario
        }
    }

    /**
     * Procesa un mensaje del usuario y devuelve una respuesta
     */
    async processMessage(userMessage) {
        if (!this.initialized) await this.init();
        
        const normalizedInput = normalizeText(userMessage);
        this.context.messageCount++;
        
        // 1. Detectar intención
        const intent = this.detectIntent(normalizedInput);
        
        // 2. Extraer entidades (fechas, etc.)
        const entities = this.extractEntities(normalizedInput);
        
        // 3. Actualizar contexto
        this.context.lastIntent = intent?.name || null;
        this.context.lastEntities = entities;
        
        // 4. Generar respuesta
        let response;
        let responseType = 'text';
        let cardData = null;
        
        if (intent) {
            // Seleccionar respuesta aleatoria del intent
            const randomResponse = intent.responses[Math.floor(Math.random() * intent.responses.length)];
            
            // Si es una acción especial, ejecutarla
            if (randomResponse.startsWith('__ACTION:')) {
                const actionName = randomResponse.replace('__ACTION:', '').replace('__', '');
                const actionResult = await this.executeAction(actionName, entities);
                
                response = actionResult.text || actionResult;
                if (actionResult.type) responseType = actionResult.type;
                if (actionResult.card) cardData = actionResult.card;
            } else {
                // Personalizar respuesta con nombre
                response = this.personalizeResponse(randomResponse);
            }
        } else {
            // Fallback inteligente
            response = this.getSmartFallback(normalizedInput);
        }
        
        // Guardar en historial
        this.conversationHistory.push({
            user: userMessage,
            bot: response,
            intent: intent?.name || 'unknown',
            timestamp: new Date()
        });
        
        return {
            text: response,
            type: responseType,
            card: cardData,
            intent: intent?.name || 'unknown',
            entities: entities
        };
    }

    /**
     * Personaliza respuesta con datos del usuario
     */
    personalizeResponse(response) {
        const nombre = this.context.userName || '';
        return response.replace(/\{\{nombre\}\}/g, nombre);
    }

    /**
     * Fallback inteligente basado en historial
     */
    getSmartFallback(input) {
        // Si es la primera vez, ser más amigable
        if (this.context.messageCount <= 2) {
            return '¡Hola! No entendí tu pregunta. 🤔 Prueba con algo como:\n\n• "¿A qué hora entré hoy?"\n• "¿Cuántas faltas tengo?"\n• "Dame un resumen"';
        }
        
        // Fallback normal
        return this.corpus.fallback[Math.floor(Math.random() * this.corpus.fallback.length)];
    }

    /**
     * Detecta la intención del mensaje
     */
    detectIntent(normalizedInput) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const intent of this.corpus.intents) {
            for (const pattern of intent.patterns) {
                const score = calculateSimilarity(normalizedInput, pattern);
                if (score > bestScore && score >= 0.45) {
                    bestScore = score;
                    bestMatch = intent;
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Extrae entidades del mensaje
     */
    extractEntities(normalizedInput) {
        const extracted = {
            fecha: null,
            fechaLabel: null,
            periodo: 'current'
        };
        
        // Buscar entidades de fecha
        for (const [key, resolver] of Object.entries(this.corpus.entities.fecha)) {
            if (normalizedInput.includes(normalizeText(key))) {
                extracted.fecha = resolver();
                extracted.fechaLabel = key;
                break;
            }
        }
        
        // Buscar periodo
        for (const [key, value] of Object.entries(this.corpus.entities.periodo)) {
            if (normalizedInput.includes(normalizeText(key))) {
                extracted.periodo = value;
                break;
            }
        }
        
        // Si no se detectó fecha, asumir HOY
        if (!extracted.fecha) {
            extracted.fecha = new Date();
            extracted.fechaLabel = 'hoy';
        }
        
        return extracted;
    }

    /**
     * Ejecuta acciones que requieren datos
     */
    async executeAction(actionName, entities) {
        if (typeof ChatbotActions === 'undefined') {
            return { text: '⚠️ El módulo de acciones no está cargado. Recarga la página.' };
        }
        
        const actions = ChatbotActions;
        
        switch (actionName) {
            case 'consultar_entrada':
                return await actions.getEntrada(entities.fecha);
                
            case 'consultar_salida':
                return await actions.getSalida(entities.fecha);
                
            case 'consultar_retardos':
                return await actions.getRetardos();
                
            case 'consultar_ausencias':
                return await actions.getAusencias();
                
            case 'consultar_horas':
                return await actions.getHorasTrabajadas();
                
            case 'consultar_extras':
                return await actions.getHorasExtra();
                
            case 'resumen_asistencia':
                return await actions.getResumen();
                
            case 'consultar_permisos':
                return await actions.getPermisos();
                
            case 'mejor_dia':
                return await actions.getMejorDia();
                
            case 'proyeccion':
                return await actions.getProyeccion();
                
            case 'comparativa':
                return await actions.getComparativa();
                
            case 'fecha_actual':
                const hoy = new Date();
                const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                return { text: `📅 Hoy es **${hoy.toLocaleDateString('es-ES', opciones)}**` };
                
            case 'mostrar_ayuda':
                return { 
                    text: `📋 **¿En qué puedo ayudarte?**

🕐 **Horarios:**
• "¿A qué hora entré hoy/ayer?"
• "¿A qué hora salí el lunes?"

📊 **Estadísticas:**
• "¿Cuántas faltas tengo?"
• "¿Cuántos retardos llevo?"
• "¿Cuántas horas he trabajado?"
• "¿Cuántas horas extra tengo?"

📈 **Resumen:**
• "Dame un resumen del mes"
• "¿Cómo va mi asistencia?"

💡 ¡Solo pregunta de manera natural!`
                };
                
            default:
                return { text: '⚠️ Esta función aún está en desarrollo. Pronto estará disponible.' };
        }
    }

    /**
     * Limpia el historial de conversación
     */
    clearHistory() {
        this.conversationHistory = [];
        this.context.messageCount = 0;
        this.context.lastIntent = null;
        this.context.lastEntities = null;
    }

    /**
     * Obtiene sugerencias basadas en contexto
     */
    getSuggestions() {
        const lastIntent = this.context.lastIntent;
        
        // Sugerencias contextuales
        if (lastIntent === 'consultar_entrada') {
            return ['¿Y mi salida?', 'Dame un resumen', '¿Llegué tarde?'];
        }
        if (lastIntent === 'consultar_retardos') {
            return ['¿Cuántas faltas?', 'Horas trabajadas', 'Resumen del mes'];
        }
        if (lastIntent === 'resumen_asistencia') {
            return ['Horas extra', 'Retardos', 'Gracias'];
        }
        
        // Sugerencias por defecto
        return ['Mi entrada de hoy', 'Resumen del mes', '¿Cuántas faltas?'];
    }
}

// Instancia global del chatbot
const chatbot = new ChatbotEngine();
