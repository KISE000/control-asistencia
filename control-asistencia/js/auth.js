// === AUTENTICACIÓN SUPABASE ===

/**
 * Constantes de mensajes de error para autenticación
 * Centralizados para fácil mantenimiento y traducción
 */
const AUTH_MESSAGES = {
    ERRORS: {
        EMPTY_FIELDS: 'Por favor completa todos los campos',
        INVALID_EMAIL: 'El formato del email no es válido',
        PASSWORD_SHORT: 'La contraseña debe tener al menos 6 caracteres',
        PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
        NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
        INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
        EMAIL_NOT_CONFIRMED: 'Por favor confirma tu email primero',
        EMAIL_ALREADY_REGISTERED: 'Este email ya está registrado. Intenta iniciar sesión.',
        WEAK_PASSWORD: 'Contraseña demasiado débil. Usa al menos 6 caracteres.',
        DATABASE_ERROR: 'Error de conexión a base de datos',
        GENERIC_LOGIN: 'Error al iniciar sesión',
        GENERIC_REGISTER: 'Error al crear la cuenta'
    },
    SUCCESS: {
        LOGIN: '✅ Bienvenido! Sesión iniciada correctamente',
        REGISTER: '✅ Cuenta creada e iniciada sesión!',
        REGISTER_CONFIRM: '📧 Revisa tu email para confirmar tu cuenta',
        LOGOUT: '👋 Sesión cerrada correctamente',
        PASSWORD_RESET: '📧 Revisa tu correo para restablecer tu contraseña',
        PASSWORD_RESET_SENT: '✅ Email enviado! Revisa tu bandeja de entrada.'
    }
};

/**
 * Valida el formato de un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
function validarEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // Regex simple pero efectivo para validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Obtiene un elemento por ID de forma segura (helper local)
 * @param {string} id - ID del elemento
 * @returns {HTMLElement|null}
 */
function getAuthElement(id) {
    return document.getElementById(id);
}

/**
 * Iniciar sesión con Supabase
 * @returns {Promise<void>}
 */
async function loginSupabase() {
    const emailInput = getAuthElement('loginEmail');
    const passwordInput = getAuthElement('loginPassword');
    
    if (!emailInput || !passwordInput) {
        console.error('Elementos de login no encontrados');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validaciones
    if (!email || !password) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.EMPTY_FIELDS);
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.INVALID_EMAIL);
        return;
    }
    
    if (!supabase) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.DATABASE_ERROR);
        return;
    }
    
    // UI Loading
    const btn = getAuthElement('btnLogin');
    const btnTextContent = btn?.querySelector('.btn-text-content');
    const btnLoader = btn?.querySelector('.btn-loader');
    
    if (btn) btn.disabled = true;
    if (btnTextContent) btnTextContent.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'block';
    ocultarErrorLogin();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Guardar sesión
        if (data.session) {
            localStorage.setItem(APP_CONSTANTS.KEYS.SESSION, JSON.stringify(data.session));
        }
        
        // Guardar email si "Recordar sesión" está marcado
        const recordarSesion = getAuthElement('recordarSesion');
        if (recordarSesion?.checked) {
            localStorage.setItem(APP_CONSTANTS.KEYS.REMEMBERED_EMAIL, email);
        } else {
            localStorage.removeItem(APP_CONSTANTS.KEYS.REMEMBERED_EMAIL);
        }
        
        // Desbloquear contenido
        toggleContentLock(false);
        
        // Actualizar UI
        actualizarUIUsuario(data.user);
        
        // Cerrar modal
        cerrarModalLogin();
        
        // Mostrar mensaje de éxito
        showToast(AUTH_MESSAGES.SUCCESS.LOGIN, 'success');
        
        // Limpiar contraseña
        passwordInput.value = '';
        if (!recordarSesion?.checked) {
            emailInput.value = '';
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        const mensaje = mapearErrorAuth(error, 'login');
        mostrarErrorLogin(mensaje);
        
    } finally {
        if (btn) btn.disabled = false;
        if (btnTextContent) btnTextContent.style.display = 'flex';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Mapea errores de Supabase a mensajes amigables
 * @param {Error} error - Error de Supabase
 * @param {string} context - Contexto: 'login' o 'register'
 * @returns {string} Mensaje de error amigable
 */
function mapearErrorAuth(error, context = 'login') {
    const message = error.message || '';
    
    if (message.includes('Invalid login credentials')) {
        return AUTH_MESSAGES.ERRORS.INVALID_CREDENTIALS;
    }
    if (message.includes('Email not confirmed')) {
        return AUTH_MESSAGES.ERRORS.EMAIL_NOT_CONFIRMED;
    }
    if (message.includes('already registered')) {
        return AUTH_MESSAGES.ERRORS.EMAIL_ALREADY_REGISTERED;
    }
    if (message.includes('Invalid email')) {
        return AUTH_MESSAGES.ERRORS.INVALID_EMAIL;
    }
    if (message.includes('Password should be')) {
        return AUTH_MESSAGES.ERRORS.WEAK_PASSWORD;
    }
    if (message.includes('network') || message.includes('Failed to fetch')) {
        return AUTH_MESSAGES.ERRORS.NETWORK_ERROR;
    }
    
    return context === 'login' 
        ? AUTH_MESSAGES.ERRORS.GENERIC_LOGIN 
        : AUTH_MESSAGES.ERRORS.GENERIC_REGISTER;
}

/**
 * Verificar sesión activa
 * @returns {Promise<boolean>} True si hay sesión activa
 */
async function verificarSesion() {
    if (!supabase) return false;
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session !== null;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

/**
 * Abrir modal de login
 * @returns {void}
 */
function abrirModalLogin() {
    const modal = getAuthElement('modalLogin');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Cargar email recordado si existe
    const rememberedEmail = localStorage.getItem(APP_CONSTANTS.KEYS.REMEMBERED_EMAIL);
    const emailInput = getAuthElement('loginEmail');
    const recordarCheckbox = getAuthElement('recordarSesion');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (recordarCheckbox) {
            recordarCheckbox.checked = true;
        }
        // Focus en contraseña si hay email guardado
        setTimeout(() => {
            getAuthElement('loginPassword')?.focus();
        }, 100);
    } else {
        // Focus en email si no hay nada guardado
        setTimeout(() => {
            emailInput?.focus();
        }, 100);
    }
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Mostrar modal de recuperar contraseña
 * @returns {void}
 */
function mostrarRecuperarPassword() {
    const modal = getAuthElement('modalRecuperarPassword');
    if (!modal) return;
    
    // Limpiar campos
    const emailRecuperar = getAuthElement('recuperarEmail');
    if (emailRecuperar) emailRecuperar.value = '';
    ocultarInfoRecuperar();
    
    // Pre-llenar con email del login si existe
    const emailLogin = getAuthElement('loginEmail')?.value;
    if (emailLogin && emailRecuperar) {
        emailRecuperar.value = emailLogin;
    }
    
    modal.style.display = 'flex';
    
    // Focus en el input
    setTimeout(() => {
        emailRecuperar?.focus();
    }, 100);
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Cerrar modal de recuperar contraseña
 * @returns {void}
 */
function cerrarRecuperarPassword() {
    const modal = getAuthElement('modalRecuperarPassword');
    if (modal) {
        modal.style.display = 'none';
        ocultarInfoRecuperar();
    }
}

/**
 * Enviar email de recuperación de contraseña
 * @returns {Promise<void>}
 */
async function enviarRecuperacionPassword() {
    const emailInput = getAuthElement('recuperarEmail');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    // Validaciones
    if (!email) {
        mostrarInfoRecuperar('Por favor ingresa tu correo electrónico', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarInfoRecuperar(AUTH_MESSAGES.ERRORS.INVALID_EMAIL, 'error');
        return;
    }
    
    if (!supabase) {
        mostrarInfoRecuperar(AUTH_MESSAGES.ERRORS.DATABASE_ERROR, 'error');
        return;
    }
    
    // UI Loading
    const btn = getAuthElement('btnEnviarRecuperacion');
    const btnTextContent = btn?.querySelector('.btn-text-content');
    const btnLoader = btn?.querySelector('.btn-loader');
    
    if (btn) btn.disabled = true;
    if (btnTextContent) btnTextContent.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'block';
    ocultarInfoRecuperar();
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        
        if (error) throw error;
        
        mostrarInfoRecuperar(AUTH_MESSAGES.SUCCESS.PASSWORD_RESET_SENT, 'success');
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            cerrarRecuperarPassword();
            showToast(AUTH_MESSAGES.SUCCESS.PASSWORD_RESET, 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Error recuperando contraseña:', error);
        mostrarInfoRecuperar('Error al enviar el correo. Intenta nuevamente.', 'error');
    } finally {
        if (btn) btn.disabled = false;
        if (btnTextContent) btnTextContent.style.display = 'flex';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Mostrar mensaje en modal de recuperar
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} [tipo='error'] - Tipo: 'error' o 'success'
 * @returns {void}
 */
function mostrarInfoRecuperar(mensaje, tipo = 'error') {
    const infoDiv = getAuthElement('recuperarInfo');
    const infoText = getAuthElement('recuperarInfoText');
    const infoIcon = getAuthElement('recuperarInfoIcon');
    
    if (!infoDiv || !infoText || !infoIcon) return;
    
    infoText.textContent = mensaje;
    
    if (tipo === 'success') {
        infoDiv.style.background = '#ecfdf5';
        infoDiv.style.border = '1px solid #a7f3d0';
        infoDiv.style.color = '#065f46';
        infoIcon.setAttribute('data-lucide', 'check-circle');
    } else {
        infoDiv.style.background = '#fef2f2';
        infoDiv.style.border = '1px solid #fecaca';
        infoDiv.style.color = '#dc2626';
        infoIcon.setAttribute('data-lucide', 'alert-circle');
    }
    
    infoDiv.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
}

/**
 * Ocultar mensaje en modal de recuperar
 * @returns {void}
 */
function ocultarInfoRecuperar() {
    const infoDiv = getAuthElement('recuperarInfo');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

/**
 * Cerrar modal de login
 * @returns {void}
 */
function cerrarModalLogin() {
    const modal = getAuthElement('modalLogin');
    if (modal) {
        modal.style.display = 'none';
        ocultarErrorLogin();
    }
}

/**
 * Toggle visibilidad de contraseña
 * @param {string} inputId - ID del input de contraseña
 * @param {string} iconId - ID del icono
 * @returns {void}
 */
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = getAuthElement(inputId);
    const toggleIcon = getAuthElement(iconId);
    
    if (!passwordInput || !toggleIcon) return;
    
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Cambiar entre tabs de Login y Registro
 * @param {string} modo - 'login' o 'registro'
 * @returns {void}
 */
function cambiarTabAuth(modo) {
    const elements = {
        tabLogin: getAuthElement('tabLogin'),
        tabRegistro: getAuthElement('tabRegistro'),
        formLogin: getAuthElement('formLogin'),
        formRegistro: getAuthElement('formRegistro'),
        btnLogin: getAuthElement('btnLogin'),
        btnRegistro: getAuthElement('btnRegistro'),
        title: getAuthElement('authModalTitle')
    };
    
    // Verificar elementos necesarios
    if (!elements.tabLogin || !elements.formLogin) return;
    
    ocultarErrorLogin();
    
    // Estilos para tabs
    const activeStyle = {
        background: 'white',
        color: 'var(--primary)',
        fontWeight: '600',
        borderBottom: '3px solid var(--primary)'
    };
    
    const inactiveStyle = {
        background: 'transparent',
        color: 'var(--text-muted)',
        fontWeight: '500',
        borderBottom: '3px solid transparent'
    };
    
    /**
     * Aplica estilos a un tab
     * @param {HTMLElement} tab - Elemento tab
     * @param {Object} style - Estilos a aplicar
     */
    const applyStyle = (tab, style) => {
        if (!tab) return;
        Object.assign(tab.style, style);
    };
    
    if (modo === 'login') {
        applyStyle(elements.tabLogin, activeStyle);
        applyStyle(elements.tabRegistro, inactiveStyle);
        
        if (elements.formLogin) elements.formLogin.style.display = 'block';
        if (elements.formRegistro) elements.formRegistro.style.display = 'none';
        if (elements.btnLogin) elements.btnLogin.style.display = 'block';
        if (elements.btnRegistro) elements.btnRegistro.style.display = 'none';
        if (elements.title) elements.title.textContent = 'Iniciar Sesión';
        
    } else if (modo === 'registro') {
        applyStyle(elements.tabLogin, inactiveStyle);
        applyStyle(elements.tabRegistro, activeStyle);
        
        if (elements.formLogin) elements.formLogin.style.display = 'none';
        if (elements.formRegistro) elements.formRegistro.style.display = 'block';
        if (elements.btnLogin) elements.btnLogin.style.display = 'none';
        if (elements.btnRegistro) elements.btnRegistro.style.display = 'block';
        if (elements.title) elements.title.textContent = 'Crear Cuenta';
    }
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Registrar nuevo usuario en Supabase
 * @returns {Promise<void>}
 */
async function registrarSupabase() {
    const nombreInput = getAuthElement('registroNombre');
    const emailInput = getAuthElement('registroEmail');
    const passwordInput = getAuthElement('registroPassword');
    const passwordConfirmInput = getAuthElement('registroPasswordConfirm');
    
    if (!nombreInput || !emailInput || !passwordInput || !passwordConfirmInput) {
        console.error('Elementos de registro no encontrados');
        return;
    }
    
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    
    // Validaciones
    if (!nombre || !email || !password || !passwordConfirm) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.EMPTY_FIELDS);
        return;
    }
    
    if (!validarEmail(email)) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.INVALID_EMAIL);
        return;
    }
    
    if (password.length < 6) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.PASSWORD_SHORT);
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.PASSWORD_MISMATCH);
        return;
    }
    
    if (!supabase) {
        mostrarErrorLogin(AUTH_MESSAGES.ERRORS.DATABASE_ERROR);
        return;
    }
    
    // UI Loading
    const btn = getAuthElement('btnRegistro');
    const btnTextContent = btn?.querySelector('.btn-text-content');
    const btnLoader = btn?.querySelector('.btn-loader');
    
    if (btn) btn.disabled = true;
    if (btnTextContent) btnTextContent.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'block';
    ocultarErrorLogin();
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: nombre
                }
            }
        });
        
        if (error) throw error;
        
        // Limpiar campos
        const limpiarCampos = () => {
            nombreInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            passwordConfirmInput.value = '';
        };
        
        // Verificar si requiere confirmación de email
        if (data.user && !data.session) {
            showToast(AUTH_MESSAGES.SUCCESS.REGISTER_CONFIRM, 'success');
            limpiarCampos();
            
            setTimeout(() => {
                cambiarTabAuth('login');
                mostrarErrorLogin('✅ Cuenta creada. Revisa tu email para confirmarla.');
            }, 1500);
            
        } else if (data.session) {
            localStorage.setItem(APP_CONSTANTS.KEYS.SESSION, JSON.stringify(data.session));
            toggleContentLock(false);
            actualizarUIUsuario(data.user);
            cerrarModalLogin();
            showToast(AUTH_MESSAGES.SUCCESS.REGISTER, 'success');
            limpiarCampos();
        }
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        const mensaje = mapearErrorAuth(error, 'register');
        mostrarErrorLogin(mensaje);
        
    } finally {
        if (btn) btn.disabled = false;
        if (btnTextContent) btnTextContent.style.display = 'flex';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Mostrar error en el modal de login
 * @param {string} mensaje - Mensaje de error
 * @returns {void}
 */
function mostrarErrorLogin(mensaje) {
    const errorDiv = getAuthElement('loginError');
    const errorText = getAuthElement('loginErrorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = mensaje || 'Error desconocido';
        errorDiv.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Ocultar error del modal de login
 * @returns {void}
 */
function ocultarErrorLogin() {
    const errorDiv = getAuthElement('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Configurar listeners para el menú de usuario
 * @returns {void}
 */
function setupUserMenuListeners() {
    const btn = getAuthElement('btnUserMenu');
    const dropdown = getAuthElement('userDropdown');

    if (!btn || !dropdown) return;
    
    // Clonar para remover listeners anteriores
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        if (window.lucide) lucide.createIcons();
    });

    // Listener global para cerrar al hacer clic fuera (solo una vez)
    if (!window.userMenuClickOutsideAttached) {
        document.addEventListener('click', (e) => {
            const d = getAuthElement('userDropdown');
            const b = getAuthElement('btnUserMenu');
            
            if (d && d.style.display === 'block') {
                if (!d.contains(e.target) && (!b || !b.contains(e.target))) {
                    d.style.display = 'none';
                }
            }
        });
        window.userMenuClickOutsideAttached = true;
    }
}

// Inicializar listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUserMenuListeners);
} else {
    setupUserMenuListeners();
}

/**
 * Actualizar UI con información del usuario
 * @param {Object} userData - Datos del usuario de Supabase
 * @returns {void}
 */
function actualizarUIUsuario(userData) {
    if (!userData || !userData.email) return;
    
    const email = userData.email;
    const nombreCorto = email.split('@')[0];
    
    const nameDisplay = getAuthElement('userNameDisplay');
    const emailDisplay = getAuthElement('userEmailDisplay');
    
    if (nameDisplay) nameDisplay.textContent = nombreCorto;
    if (emailDisplay) emailDisplay.textContent = email;
}

/**
 * Bloquear/Desbloquear contenido de la aplicación
 * @param {boolean} locked - True para bloquear, false para desbloquear
 * @returns {void}
 */
function toggleContentLock(locked) {
    const dashboardContainer = document.querySelector('.dashboard-container');
    const topbar = document.querySelector('.topbar');
    
    const toggleClass = (element, className, add) => {
        if (element) {
            add ? element.classList.add(className) : element.classList.remove(className);
        }
    };
    
    toggleClass(dashboardContainer, 'content-locked', locked);
    toggleClass(topbar, 'content-locked', locked);
    toggleClass(document.body, 'login-mode', locked);
}

/**
 * Mostrar modal de confirmación de cierre de sesión
 * @returns {void}
 */
function logoutSupabase() {
    const modal = getAuthElement('modalConfirmarLogout');
    if (!modal) return;
    
    // Cerrar dropdown de usuario primero
    const dropdown = getAuthElement('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    modal.style.display = 'flex';
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Cerrar modal de confirmación de logout
 * @returns {void}
 */
function cerrarModalLogout() {
    const modal = getAuthElement('modalConfirmarLogout');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirmar y ejecutar cierre de sesión
 * @returns {Promise<void>}
 */
async function confirmarLogout() {
    if (!supabase) return;
    
    cerrarModalLogout();
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('supabaseSession');
        showToast(AUTH_MESSAGES.SUCCESS.LOGOUT, 'success');
        
        // Bloquear contenido y mostrar login
        toggleContentLock(true);
        setTimeout(() => {
            abrirModalLogin();
        }, 300);
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('❌ Error al cerrar sesión', 'error');
    }
}

/**
 * Verificar y configurar autenticación al cargar
 * @returns {Promise<void>}
 */
async function inicializarAutenticacion() {
    if (!supabase) {
        console.error('❌ Supabase no está disponible');
        toggleContentLock(true);
        abrirModalLogin();
        return;
    }
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
            toggleContentLock(false);
            actualizarUIUsuario(session.user);
            cerrarModalLogin();
        } else {
            toggleContentLock(true);
            abrirModalLogin();
        }
        
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        toggleContentLock(true);
        abrirModalLogin();
    }
}

// Inicializar autenticación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAutenticacion);
} else {
    inicializarAutenticacion();
}
