// ===================================================
// TIME PICKER FUNCTIONALITY - Ultra Professional Version
// ===================================================

let currentTimeInputId = null;
let isTimePickerInitialized = false;

// Inicializar el time picker (se llama una sola vez al cargar la página)
function inicializarTimePicker() {
    if (isTimePickerInitialized) return;
    
    try {
        // Generar todas las opciones de minutos
        generarMinutos();
        
        // Agregar event listeners a las opciones estáticas (hora y AM/PM)
        agregarEventListenersHora();
        agregarEventListenersAMPM();
        
        // Prevenir que se cierre el modal al hacer clic fuera (overlay)
        // El overlay debe cerrar el modal, no el content
        const modal = document.getElementById('modalTimePicker');
        if (modal) {
            modal.addEventListener('click', function(e) {
                // Si se hace clic en el fondo oscuro (el modal mismo), cerrar
                if (e.target === modal) {
                    cerrarTimePicker();
                }
            });
        }
        
        isTimePickerInitialized = true;
        console.log('Time picker inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar time picker:', error);
    }
}

// Abrir modal de time picker
function abrirTimePicker(inputId, title) {
    try {
        currentTimeInputId = inputId;
        const modal = document.getElementById('modalTimePicker');
        const titleElement = document.getElementById('timePickerTitle');
        
        if (!modal || !titleElement) {
            console.error('Elementos del modal no encontrados');
            return;
        }
        
        titleElement.textContent = title;
        
        // Obtener valor actual del input
        const input = document.getElementById(inputId);
        if (!input) {
            console.error('Input no encontrado:', inputId);
            return;
        }
        
        const currentValue = input.value;
        
        // Parsear valor (ej: "09:00 a. m." o "09:00 a.m." o "09:00 AM")
        // Regex robusto para capturar hora, minutos y periodo
        const parts = currentValue.match(/(\d{1,2}):(\d{2})\s*([ap]\.?\s*m\.?)/i);
        
        if (parts) {
            const hour = parts[1].padStart(2, '0');
            const minute = parts[2].padStart(2, '0');
            let ampm = parts[3].toLowerCase();
            
            // Normalizar AM/PM para coincidir con data-value del HTML
            // data-value="a. m." o "p. m."
            if (ampm.includes('a')) {
                ampm = 'a. m.';
            } else {
                ampm = 'p. m.';
            }
            
            // Establecer valores en los selectores
            setearValorSelector('hourSelector', hour);
            setearValorSelector('minuteSelector', minute);
            setearValorSelector('ampmSelector', ampm);
        } else {
            // Default si no matchea: 09:00 a. m.
            setearValorSelector('hourSelector', '09');
            setearValorSelector('minuteSelector', '00');
            setearValorSelector('ampmSelector', 'a. m.');
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Bloquear scroll
        
        // Reinicializar iconos de Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error al abrir time picker:', error);
    }
}

// Cerrar modal de time picker
function cerrarTimePicker() {
    try {
        const modal = document.getElementById('modalTimePicker');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.style.overflow = ''; // Restaurar scroll
        // NO nullificar currentTimeInputId aquí si se necesita después, 
        // pero es mejor limpiarlo para evitar ediciones fantasma.
        // Lo limpiamos al final de la animación o inmediatamente.
        currentTimeInputId = null;
    } catch (error) {
        console.error('Error al cerrar time picker:', error);
    }
}

// Generar opciones de minutos (00-59)
function generarMinutos() {
    const minuteSelector = document.getElementById('minuteSelector');
    if (!minuteSelector) {
        console.error('Selector de minutos no encontrado');
        return;
    }
    
    // Evitar duplicar si ya tiene hijos
    if (minuteSelector.children.length > 5) return;
    
    minuteSelector.innerHTML = '';
    
    for (let i = 0; i <= 59; i++) {
        const value = i.toString().padStart(2, '0');
        const div = document.createElement('div');
        div.className = 'time-option';
        div.setAttribute('data-value', value);
        div.textContent = value;
        
        div.onclick = function() {
            seleccionarOpcion('minuteSelector', value);
        };
        
        if (i === 0) {
            div.classList.add('active');
        }
        
        minuteSelector.appendChild(div);
    }
}

// Agregar event listeners a las opciones de hora
function agregarEventListenersHora() {
    const hourSelector = document.getElementById('hourSelector');
    if (!hourSelector) return;
    
    // Delegación de eventos en lugar de múltiples listeners
    // (Opcional, pero mantenemos simple para no romper HTML existente si no es necesario)
    const hourOptions = hourSelector.querySelectorAll('.time-option');
    hourOptions.forEach(option => {
        // Remover listeners anteriores reemplazando el nodo o usando onclick
        option.onclick = function() {
            const value = this.getAttribute('data-value');
            seleccionarOpcion('hourSelector', value);
        };
    });
}

// Agregar event listeners a las opciones de AM/PM
function agregarEventListenersAMPM() {
    const ampmSelector = document.getElementById('ampmSelector');
    if (!ampmSelector) return;

    const ampmOptions = ampmSelector.querySelectorAll('.time-option');
    ampmOptions.forEach(option => {
        option.onclick = function() {
            const value = this.getAttribute('data-value');
            seleccionarOpcion('ampmSelector', value);
        };
    });
}

// Setear valor en un selector
function setearValorSelector(selectorId, value) {
    try {
        const selector = document.getElementById(selectorId);
        if (!selector) {
            console.error('Selector no encontrado:', selectorId);
            return;
        }
        
        const options = selector.querySelectorAll('.time-option');
        let encontrado = false;
        
        options.forEach(option => {
            const optionValue = option.getAttribute('data-value');
            // Comparación laxa para 'a. m.' vs 'a.m.'
            if (optionValue === value || optionValue.replace(/\s/g, '') === value.replace(/\s/g, '')) {
                option.classList.add('active');
                encontrado = true;
                // Scroll para centrar la opción
                setTimeout(() => {
                    option.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                option.classList.remove('active');
            }
        });
        
        if (!encontrado && options.length > 0) {
            // Si no encuentra, activar el primero por defecto
            options[0].classList.add('active');
        }
    } catch (error) {
        console.error('Error al setear valor del selector:', error);
    }
}

// Seleccionar opción
function seleccionarOpcion(selectorId, value) {
    try {
        const selector = document.getElementById(selectorId);
        if (!selector) {
            console.error('Selector no encontrado:', selectorId);
            return;
        }
        
        const options = selector.querySelectorAll('.time-option');
        
        options.forEach(option => {
            if (option.getAttribute('data-value') === value) {
                option.classList.add('active');
                // Scroll suave
                option.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                option.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error al seleccionar opción:', error);
    }
}

// Confirmar tiempo seleccionado
function confirmarTiempo() {
    try {
        if (!currentTimeInputId) {
            console.error('No hay input ID seleccionado para actualizar');
            cerrarTimePicker(); // Cerrar de todos modos para no bloquear UI
            return;
        }
        
        const hourSelector = document.getElementById('hourSelector');
        const minuteSelector = document.getElementById('minuteSelector');
        const ampmSelector = document.getElementById('ampmSelector');
        
        // Verificar que existan elementos activos
        const hourActive = hourSelector.querySelector('.time-option.active');
        const minuteActive = minuteSelector.querySelector('.time-option.active');
        const ampmActive = ampmSelector.querySelector('.time-option.active');
        
        if (!hourActive || !minuteActive || !ampmActive) {
            console.error('No hay opciones activas seleccionadas');
            if(window.showToast) showToast('Por favor selecciona hora, minutos y AM/PM', 'warning');
            else alert('Por favor selecciona hora, minutos y AM/PM');
            return;
        }
        
        const hour = hourActive.getAttribute('data-value');
        const minute = minuteActive.getAttribute('data-value');
        const ampm = ampmActive.getAttribute('data-value');
        
        const timeString = `${hour}:${minute} ${ampm}`;
        
        const input = document.getElementById(currentTimeInputId);
        if (input) {
            input.value = timeString;
            // Disparar evento change para que otros scripts detecten el cambio
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
            console.log('Tiempo actualizado:', timeString, 'en input:', currentTimeInputId);
        } else {
            console.error('Input destino no encontrado:', currentTimeInputId);
        }
        
        cerrarTimePicker();
    } catch (error) {
        console.error('Error al confirmar tiempo:', error);
        if(window.showToast) showToast('Ocurrió un error al confirmar la hora.', 'error');
        else alert('Ocurrió un error al confirmar la hora.');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarTimePicker();
});

// También inicializar si el DOM ya está cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarTimePicker);
} else {
    inicializarTimePicker();
}
