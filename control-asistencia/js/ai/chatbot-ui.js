/**
 * === CHATBOT UI PRO - Interfaz Avanzada ===
 * Widget flotante con:
 * - Reconocimiento de voz (Speech-to-Text)
 * - Tarjetas de datos visuales
 * - Sugerencias contextuales
 * - Sonidos y animaciones premium
 * - Historial persistente
 */

class ChatbotUI {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.isListening = false;
        this.container = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.recognition = null;
        this.initialized = false;
        this.soundEnabled = true;
    }

    /**
     * Inicializa la UI del chatbot
     */
    init() {
        if (this.initialized) return;

        this.createWidget();
        this.bindEvents();
        this.initSpeechRecognition();
        this.loadHistory();
        this.initialized = true;
    }

    /**
     * Crea el widget completo en el DOM
     */
    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'chatbot-widget';
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <!-- Tooltip inicial -->
            <div class="chatbot-tooltip" id="chatbotTooltip">
                <span>¡Hola! ¿Necesitas ayuda?</span>
                <button class="tooltip-close" id="tooltipClose">×</button>
            </div>

            <!-- Botón flotante -->
            <button class="chatbot-fab" id="chatbotFab" aria-label="Abrir asistente virtual">
                <div class="fab-icon-container">
                    <i data-lucide="bot" class="fab-icon-open"></i>
                    <i data-lucide="x" class="fab-icon-close"></i>
                </div>
                <span class="chatbot-fab-pulse"></span>
                <span class="chatbot-fab-ring"></span>
            </button>

            <!-- Ventana del chat -->
            <div class="chatbot-window" id="chatbotWindow">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <i data-lucide="bot"></i>
                            <span class="avatar-status-dot"></span>
                        </div>
                        <div class="chatbot-header-text">
                            <span class="chatbot-title">Asistente IA</span>
                            <span class="chatbot-status" id="chatbotStatus">
                                <span class="status-dot"></span>
                                <span id="statusText">En línea</span>
                            </span>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button class="chatbot-header-btn" id="chatbotSoundBtn" title="Sonido">
                            <i data-lucide="volume-2" id="soundIcon"></i>
                        </button>
                        <button class="chatbot-header-btn" id="chatbotClearBtn" title="Limpiar chat">
                            <i data-lucide="trash-2"></i>
                        </button>
                        <button class="chatbot-header-btn" id="chatbotMinBtn" title="Minimizar">
                            <i data-lucide="minus"></i>
                        </button>
                    </div>
                </div>

                <!-- Mensajes -->
                <div class="chatbot-messages" id="chatbotMessages">
                    <!-- Mensaje de bienvenida -->
                    <div class="chatbot-message bot welcome-message">
                        <div class="message-avatar">
                            <i data-lucide="bot"></i>
                        </div>
                        <div class="message-content">
                            <p>¡Hola! 👋 Soy tu asistente de <b>Control de Asistencia</b>.</p>
                            <p class="message-subtitle">Pregúntame sobre tus horarios, faltas, horas extra y más.</p>
                        </div>
                    </div>
                    
                    <!-- Quick Actions iniciales -->
                    <div class="quick-actions-container" id="quickActionsContainer">
                        <div class="quick-actions">
                            <button class="quick-action-btn" data-msg="¿A qué hora entré hoy?">
                                <i data-lucide="log-in"></i> Mi entrada
                            </button>
                            <button class="quick-action-btn" data-msg="¿Cuántas faltas tengo?">
                                <i data-lucide="calendar-x"></i> Mis faltas
                            </button>
                            <button class="quick-action-btn" data-msg="Dame un resumen">
                                <i data-lucide="bar-chart-3"></i> Resumen
                            </button>
                            <button class="quick-action-btn" data-msg="¿Cuántos retardos tengo?">
                                <i data-lucide="clock"></i> Retardos
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Sugerencias contextuales -->
                <div class="chatbot-suggestions" id="chatbotSuggestions" style="display: none;">
                    <div class="suggestions-label">Sugerencias:</div>
                    <div class="suggestions-list" id="suggestionsList"></div>
                </div>

                <!-- Indicador de escritura -->
                <div class="chatbot-typing" id="chatbotTyping" style="display: none;">
                    <div class="message-avatar">
                        <i data-lucide="bot"></i>
                    </div>
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <!-- Input -->
                <div class="chatbot-input-area">
                    <div class="chatbot-input-wrapper">
                        <input 
                            type="text" 
                            id="chatbotInput" 
                            placeholder="Escribe tu pregunta..." 
                            autocomplete="off"
                        />
                        <button class="chatbot-voice-btn" id="chatbotVoiceBtn" title="Hablar">
                            <i data-lucide="mic" id="micIcon"></i>
                            <div class="voice-pulse" id="voicePulse"></div>
                        </button>
                        <button class="chatbot-send-btn" id="chatbotSendBtn" disabled>
                            <i data-lucide="send"></i>
                        </button>
                    </div>
                    <div class="chatbot-input-hint">
                        <span><kbd>Enter</kbd> para enviar • <kbd>🎤</kbd> para voz</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Guardar referencias
        this.container = widget;
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.inputField = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSendBtn');
        this.window = document.getElementById('chatbotWindow');
        this.fab = document.getElementById('chatbotFab');

        // Inicializar iconos
        if (window.lucide) lucide.createIcons();
        
        // Mostrar tooltip después de 3 segundos
        setTimeout(() => this.showTooltip(), 3000);
    }

    /**
     * Inicializa reconocimiento de voz
     */
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'es-MX';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI(true);
                document.getElementById('statusText').textContent = 'Escuchando...';
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.inputField.value = transcript;
                this.sendBtn.disabled = !transcript.trim();
                
                // Si es resultado final, enviar
                if (event.results[0].isFinal) {
                    setTimeout(() => this.sendMessage(), 300);
                }
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceUI(false);
                document.getElementById('statusText').textContent = 'En línea';
            };
            
            this.recognition.onerror = (event) => {
                this.isListening = false;
                this.updateVoiceUI(false);
                document.getElementById('statusText').textContent = 'En línea';
            };
        } else {
            // Ocultar botón de voz
            const voiceBtn = document.getElementById('chatbotVoiceBtn');
            if (voiceBtn) voiceBtn.style.display = 'none';
        }
    }

    /**
     * Actualiza UI del botón de voz
     */
    updateVoiceUI(listening) {
        const voiceBtn = document.getElementById('chatbotVoiceBtn');
        const voicePulse = document.getElementById('voicePulse');
        
        if (listening) {
            voiceBtn.classList.add('listening');
            voicePulse.classList.add('active');
        } else {
            voiceBtn.classList.remove('listening');
            voicePulse.classList.remove('active');
        }
    }

    /**
     * Bindea eventos de interacción
     */
    bindEvents() {
        // Toggle window
        this.fab.addEventListener('click', () => {
            this.hideTooltip();
            this.toggle();
        });
        document.getElementById('chatbotMinBtn').addEventListener('click', () => this.toggle());

        // Enviar mensaje
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Habilitar/deshabilitar botón según input
        this.inputField.addEventListener('input', () => {
            this.sendBtn.disabled = !this.inputField.value.trim();
        });

        // Limpiar chat
        document.getElementById('chatbotClearBtn').addEventListener('click', () => this.clearChat());
        
        // Toggle sonido
        document.getElementById('chatbotSoundBtn').addEventListener('click', () => this.toggleSound());
        
        // Reconocimiento de voz
        document.getElementById('chatbotVoiceBtn').addEventListener('click', () => this.toggleVoice());
        
        // Cerrar tooltip
        document.getElementById('tooltipClose').addEventListener('click', () => this.hideTooltip());

        // Quick actions
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                const msg = e.target.closest('.quick-action-btn').dataset.msg;
                if (msg) {
                    this.inputField.value = msg;
                    this.sendMessage();
                }
            }
            // Suggestions
            if (e.target.closest('.suggestion-btn')) {
                const msg = e.target.closest('.suggestion-btn').dataset.msg;
                if (msg) {
                    this.inputField.value = msg;
                    this.sendMessage();
                }
            }
        });

        // Cerrar al hacer click fuera (solo en desktop)
        if (window.innerWidth > 480) {
            document.addEventListener('click', (e) => {
                if (this.isOpen && 
                    !this.container.contains(e.target) && 
                    !e.target.closest('.chatbot-widget')) {
                    this.close();
                }
            });
        }
    }

    /**
     * Muestra tooltip inicial
     */
    showTooltip() {
        if (this.isOpen) return;
        const tooltip = document.getElementById('chatbotTooltip');
        if (tooltip) tooltip.classList.add('visible');
        
        // Auto-ocultar después de 8 segundos
        setTimeout(() => this.hideTooltip(), 8000);
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('chatbotTooltip');
        if (tooltip) tooltip.classList.remove('visible');
    }

    /**
     * Toggle reconocimiento de voz
     */
    toggleVoice() {
        if (!this.recognition) return;
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.playSound('start');
        }
    }

    /**
     * Toggle sonido
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.getElementById('soundIcon');
        if (icon) {
            icon.setAttribute('data-lucide', this.soundEnabled ? 'volume-2' : 'volume-x');
            if (window.lucide) lucide.createIcons();
        }
    }

    /**
     * Reproduce un sonido
     */
    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Sonidos generados con Web Audio API (sin archivos externos)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'send') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'receive') {
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else if (type === 'start') {
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            // Ignorar errores de audio
        }
    }

    /**
     * Abre/cierra la ventana del chat
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.window.classList.add('open');
        this.fab.classList.add('active');
        
        setTimeout(() => this.inputField.focus(), 300);
        this.scrollToBottom();
        this.playSound('start');
    }

    close() {
        this.isOpen = false;
        this.window.classList.remove('open');
        this.fab.classList.remove('active');
    }

    /**
     * Envía un mensaje del usuario
     */
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isTyping) return;

        // Ocultar quick actions iniciales
        const quickContainer = document.getElementById('quickActionsContainer');
        if (quickContainer) quickContainer.style.display = 'none';

        // Limpiar input
        this.inputField.value = '';
        this.sendBtn.disabled = true;

        // Agregar mensaje del usuario
        this.addMessage(message, 'user');
        this.playSound('send');

        // Mostrar indicador de escritura
        this.showTyping();

        // Procesar con el engine
        try {
            const response = await chatbot.processMessage(message);
            
            // Simular tiempo de respuesta natural
            const delay = 400 + Math.random() * 400 + (response.text.length * 5);
            await this.delay(Math.min(delay, 1500));
            
            this.hideTyping();
            this.addMessage(response.text, 'bot', response.card);
            this.playSound('receive');
            
            // Mostrar sugerencias contextuales
            this.showSuggestions(chatbot.getSuggestions());
            
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            this.hideTyping();
            this.addMessage('❌ Ocurrió un error. Intenta de nuevo.', 'bot');
        }
    }

    /**
     * Agrega un mensaje al chat
     */
    addMessage(text, sender, card = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        
        // Procesar markdown
        const formattedText = this.formatMarkdown(text);
        
        let cardHtml = '';
        if (card && sender === 'bot') {
            cardHtml = this.renderCard(card);
        }
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i data-lucide="bot"></i>
                </div>
                <div class="message-content">
                    ${formattedText}
                    ${cardHtml}
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">${formattedText}</div>
            `;
        }

        this.messagesContainer.appendChild(messageDiv);
        
        if (window.lucide) lucide.createIcons();
        this.scrollToBottom();
        this.saveHistory();
    }

    /**
     * Renderiza una tarjeta de datos
     */
    renderCard(card) {
        if (!card) return '';
        
        const statusClasses = {
            success: 'card-success',
            warning: 'card-warning',
            danger: 'card-danger',
            info: 'card-info',
            neutral: 'card-neutral'
        };
        
        const statusClass = statusClasses[card.status] || 'card-info';
        
        return `
            <div class="message-card ${statusClass}">
                <div class="card-icon">
                    <i data-lucide="${card.icon || 'info'}"></i>
                </div>
                <div class="card-content">
                    <div class="card-label">${card.label || ''}</div>
                    <div class="card-value">${card.value || ''}</div>
                    ${card.date ? `<div class="card-date">${card.date}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Muestra sugerencias contextuales
     */
    showSuggestions(suggestions) {
        const container = document.getElementById('chatbotSuggestions');
        const list = document.getElementById('suggestionsList');
        
        if (!suggestions || suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        list.innerHTML = suggestions.map(s => `
            <button class="suggestion-btn" data-msg="${s}">
                ${s}
            </button>
        `).join('');
        
        container.style.display = 'block';
    }

    /**
     * Formatea markdown básico a HTML
     */
    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/^• (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
            .replace(/_([^_]+)_/g, '<em>$1</em>');
    }

    /**
     * Muestra el indicador de escritura
     */
    showTyping() {
        this.isTyping = true;
        document.getElementById('chatbotTyping').style.display = 'flex';
        document.getElementById('statusText').textContent = 'Escribiendo...';
        this.scrollToBottom();
    }

    /**
     * Oculta el indicador de escritura
     */
    hideTyping() {
        this.isTyping = false;
        document.getElementById('chatbotTyping').style.display = 'none';
        document.getElementById('statusText').textContent = 'En línea';
    }

    /**
     * Limpia el chat
     */
    clearChat() {
        const messages = this.messagesContainer.querySelectorAll('.chatbot-message:not(.welcome-message)');
        messages.forEach(msg => msg.remove());
        
        // Mostrar quick actions de nuevo
        const quickContainer = document.getElementById('quickActionsContainer');
        if (quickContainer) quickContainer.style.display = 'block';
        
        // Ocultar sugerencias
        document.getElementById('chatbotSuggestions').style.display = 'none';
        
        if (window.chatbot) chatbot.clearHistory();
        this.clearSavedHistory();
    }

    /**
     * Guarda historial en localStorage
     */
    saveHistory() {
        try {
            const messages = this.messagesContainer.innerHTML;
            localStorage.setItem('chatbot_history', messages);
        } catch (e) {
            // Ignorar errores de storage
        }
    }

    /**
     * Carga historial de localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('chatbot_history');
            if (saved && saved.length > 500) {
                // Solo cargar si hay contenido significativo
                // Por ahora no cargamos para mantener fresco
            }
        } catch (e) {
            // Ignorar errores de storage
        }
    }

    /**
     * Limpia historial guardado
     */
    clearSavedHistory() {
        try {
            localStorage.removeItem('chatbot_history');
        } catch (e) {
            // Ignorar errores
        }
    }

    /**
     * Hace scroll al final de los mensajes
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * Promesa de delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instancia global
const chatbotUI = new ChatbotUI();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        chatbotUI.init();
        chatbot.init();
    }, 800);
});
