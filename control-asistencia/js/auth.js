// === AUTENTICACIÓN SUPABASE ===

/**
 * Iniciar sesión con Supabase
 */
async function loginSupabase() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validaciones
    if (!email || !password) {
        mostrarErrorLogin('Por favor completa todos los campos');
        return;
    }
    
    if (!supabase) {
        mostrarErrorLogin('Error: Conexión a base de datos no disponible');
        return;
    }
    
    // UI Loading
    const btn = document.getElementById('btnLogin');
    const btnTextContent = btn.querySelector('.btn-text-content');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = true;
    btnTextContent.style.display = 'none';
    btnLoader.style.display = 'block';
    ocultarErrorLogin();
    
    try {
        // Intentar login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        console.log('✅ Login exitoso:', data);
        
        // Guardar sesión en localStorage para persistencia
        localStorage.setItem('supabaseSession', JSON.stringify(data.session));
        
        // Guardar email si "Recordar sesión" está marcado
        const recordarSesion = document.getElementById('recordarSesion');
        if (recordarSesion && recordarSesion.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        // Desbloquear contenido
        toggleContentLock(false);
        
        // Actualizar UI con datos del usuario
        actualizarUIUsuario(data.user);
        
        // Cerrar modal
        cerrarModalLogin();
        
        // Mostrar mensaje de éxito
        showToast('✅ Bienvenido! Sesión iniciada correctamente', 'success');
        
        // Limpiar contraseña (pero no email si está marcado "recordar")
        document.getElementById('loginPassword').value = '';
        if (!recordarSesion || !recordarSesion.checked) {
            document.getElementById('loginEmail').value = '';
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        // Mensajes de error personalizados
        let mensaje = 'Error al iniciar sesión';
        
        if (error.message.includes('Invalid login credentials')) {
            mensaje = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            mensaje = 'Por favor confirma tu email primero';
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            mensaje = 'Error de conexión. Verifica tu internet.';
        } else if (error.message) {
            mensaje = error.message;
        }
        
        mostrarErrorLogin(mensaje);
        
    } finally {
        // Restaurar botón
        btn.disabled = false;
        btnTextContent.style.display = 'flex';
        btnLoader.style.display = 'none';
    }
}

/**
 * Cerrar sesión
 */
async function logoutSupabase() {
    if (!supabase) return;
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        localStorage.removeItem('supabaseSession');
        showToast('Sesión cerrada', 'success');
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión', 'error');
    }
}

/**
 * Verificar sesión activa
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
 */
function abrirModalLogin() {
    const modal = document.getElementById('modalLogin');
    if (modal) {
        modal.style.display = 'flex';
        
        // Cargar email recordado si existe
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        const emailInput = document.getElementById('loginEmail');
        const recordarCheckbox = document.getElementById('recordarSesion');
        
        if (rememberedEmail && emailInput) {
            emailInput.value = rememberedEmail;
            if (recordarCheckbox) {
                recordarCheckbox.checked = true;
            }
            // Focus en contraseña si hay email guardado
            setTimeout(() => {
                document.getElementById('loginPassword')?.focus();
            }, 100);
        } else {
            // Focus en email si no hay nada guardado
            setTimeout(() => {
                emailInput?.focus();
            }, 100);
        }
        
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Mostrar modal de recuperar contraseña
 */
function mostrarRecuperarPassword() {
    const modal = document.getElementById('modalRecuperarPassword');
    if (modal) {
        // Limpiar campos previos
        document.getElementById('recuperarEmail').value = '';
        ocultarInfoRecuperar();
        
        // Pre-llenar con el email del login si existe
        const emailLogin = document.getElementById('loginEmail').value;
        if (emailLogin) {
            document.getElementById('recuperarEmail').value = emailLogin;
        }
        
        modal.style.display = 'flex';
        
        // Focus en el input
        setTimeout(() => {
            document.getElementById('recuperarEmail')?.focus();
        }, 100);
        
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Cerrar modal de recuperar contraseña
 */
function cerrarRecuperarPassword() {
    const modal = document.getElementById('modalRecuperarPassword');
    if (modal) {
        modal.style.display = 'none';
        ocultarInfoRecuperar();
    }
}

/**
 * Enviar email de recuperación de contraseña
 */
async function enviarRecuperacionPassword() {
    const email = document.getElementById('recuperarEmail').value.trim();
    
    // Validaciones
    if (!email) {
        mostrarInfoRecuperar('Por favor ingresa tu correo electrónico', 'error');
        return;
    }
    
    if (!email.includes('@')) {
        mostrarInfoRecuperar('Correo electrónico inválido', 'error');
        return;
    }
    
    if (!supabase) {
        mostrarInfoRecuperar('Error: Conexión no disponible', 'error');
        return;
    }
    
    // UI Loading
    const btn = document.getElementById('btnEnviarRecuperacion');
    const btnTextContent = btn.querySelector('.btn-text-content');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = true;
    btnTextContent.style.display = 'none';
    btnLoader.style.display = 'block';
    ocultarInfoRecuperar();
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        
        if (error) throw error;
        
        mostrarInfoRecuperar('✅ Email enviado! Revisa tu bandeja de entrada.', 'success');
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            cerrarRecuperarPassword();
            showToast('📧 Revisa tu correo para restablecer tu contraseña', 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Error recuperando contraseña:', error);
        mostrarInfoRecuperar('Error al enviar el correo. Intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        btn.disabled = false;
        btnTextContent.style.display = 'flex';
        btnLoader.style.display = 'none';
    }
}

/**
 * Mostrar mensaje en modal de recuperar
 */
function mostrarInfoRecuperar(mensaje, tipo = 'error') {
    const infoDiv = document.getElementById('recuperarInfo');
    const infoText = document.getElementById('recuperarInfoText');
    const infoIcon = document.getElementById('recuperarInfoIcon');
    
    if (infoDiv && infoText && infoIcon) {
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
}

/**
 * Ocultar mensaje en modal de recuperar
 */
function ocultarInfoRecuperar() {
    const infoDiv = document.getElementById('recuperarInfo');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

/**
 * Cerrar modal de login
 */
function cerrarModalLogin() {
    const modal = document.getElementById('modalLogin');
    if (modal) {
        modal.style.display = 'none';
        ocultarErrorLogin();
    }
}

/**
 * Toggle visibilidad de contraseña (versión mejorada)
 */
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.setAttribute('data-lucide', 'eye-off');
        } else {
            passwordInput.type = 'password';
            toggleIcon.setAttribute('data-lucide', 'eye');
        }
        
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Cambiar entre tabs de Login y Registro
 */
function cambiarTabAuth(modo) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegistro = document.getElementById('btnRegistro');
    const authModalTitle = document.getElementById('authModalTitle');
    
    // Ocultar error
    ocultarErrorLogin();
    
    if (modo === 'login') {
        // Activar tab Login
        tabLogin.style.background = 'white';
        tabLogin.style.color = 'var(--primary)';
        tabLogin.style.fontWeight = '600';
        tabLogin.style.borderBottom = '3px solid var(--primary)';
        
        // Desactivar tab Registro
        tabRegistro.style.background = 'transparent';
        tabRegistro.style.color = 'var(--text-muted)';
        tabRegistro.style.fontWeight = '500';
        tabRegistro.style.borderBottom = '3px solid transparent';
        
        // Mostrar formulario Login
        formLogin.style.display = 'block';
        formRegistro.style.display = 'none';
        btnLogin.style.display = 'block';
        btnRegistro.style.display = 'none';
        
        // Cambiar título
        authModalTitle.textContent = 'Iniciar Sesión';
        
    } else if (modo === 'registro') {
        // Desactivar tab Login
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.fontWeight = '500';
        tabLogin.style.borderBottom = '3px solid transparent';
        
        // Activar tab Registro
        tabRegistro.style.background = 'white';
        tabRegistro.style.color = 'var(--primary)';
        tabRegistro.style.fontWeight = '600';
        tabRegistro.style.borderBottom = '3px solid var(--primary)';
        
        // Mostrar formulario Registro
        formLogin.style.display = 'none';
        formRegistro.style.display = 'block';
        btnLogin.style.display = 'none';
        btnRegistro.style.display = 'block';
        
        // Cambiar título
        authModalTitle.textContent = 'Crear Cuenta';
    }
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Registrar nuevo usuario en Supabase
 */
async function registrarSupabase() {
    const nombre = document.getElementById('registroNombre').value.trim();
    const email = document.getElementById('registroEmail').value.trim();
    const password = document.getElementById('registroPassword').value;
    const passwordConfirm = document.getElementById('registroPasswordConfirm').value;
    
    // Validaciones
    if (!nombre || !email || !password || !passwordConfirm) {
        mostrarErrorLogin('Por favor completa todos los campos');
        return;
    }
    
    if (password.length < 6) {
        mostrarErrorLogin('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarErrorLogin('Las contraseñas no coinciden');
        return;
    }
    
    if (!supabase) {
        mostrarErrorLogin('Error: Conexión a base de datos no disponible');
        return;
    }
    
    // UI Loading
    const btn = document.getElementById('btnRegistro');
    const btnTextContent = btn.querySelector('.btn-text-content');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = true;
    btnTextContent.style.display = 'none';
    btnLoader.style.display = 'block';
    ocultarErrorLogin();
    
    try {
        // Intentar registro
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: nombre
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Registro exitoso:', data);
        
        // Verificar si requiere confirmación de email
        if (data.user && !data.session) {
            // Requiere confirmación de email
            showToast('📧 Revisa tu email para confirmar tu cuenta', 'success');
            
            // Limpiar campos
            document.getElementById('registroNombre').value = '';
            document.getElementById('registroEmail').value = '';
            document.getElementById('registroPassword').value = '';
            document.getElementById('registroPasswordConfirm').value = '';
            
            // Cambiar a tab de login
            setTimeout(() => {
                cambiarTabAuth('login');
                mostrarErrorLogin('✅ Cuenta creada. Revisa tu email para confirmarla.');
            }, 1500);
            
        } else if (data.session) {
            // Sesión creada automáticamente (sin confirmación de email)
            localStorage.setItem('supabaseSession', JSON.stringify(data.session));
            
            // Desbloquear contenido
            toggleContentLock(false);
            
            // Actualizar UI
            actualizarUIUsuario(data.user);
            
            // Cerrar modal
            cerrarModalLogin();
            
            showToast('✅ Cuenta creada e iniciada sesión!', 'success');
            
            // Limpiar campos
            document.getElementById('registroNombre').value = '';
            document.getElementById('registroEmail').value = '';
            document.getElementById('registroPassword').value = '';
            document.getElementById('registroPasswordConfirm').value = '';
        }
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        // Mensajes de error personalizados
        let mensaje = 'Error al crear la cuenta';
        
        if (error.message.includes('already registered')) {
            mensaje = 'Este email ya está registrado. Intenta iniciar sesión.';
        } else if (error.message.includes('Invalid email')) {
            mensaje = 'Email inválido';
        } else if (error.message.includes('Password should be')) {
            mensaje = 'Contraseña demasiado débil. Usa al menos 6 caracteres.';
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            mensaje = 'Error de conexión. Verifica tu internet.';
        } else if (error.message) {
            mensaje = error.message;
        }
        
        mostrarErrorLogin(mensaje);
        
    } finally {
        // Restaurar botón
        btn.disabled = false;
        btnTextContent.style.display = 'flex';
        btnLoader.style.display = 'none';
    }
}

/**
 * Mostrar error en el modal de login
 */
function mostrarErrorLogin(mensaje) {
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = mensaje;
        errorDiv.style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Ocultar error del modal de login
 */
function ocultarErrorLogin() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Toggle del menú desplegable de usuario
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (window.lucide) lucide.createIcons();
    }
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const btnUserMenu = document.getElementById('btnUserMenu');
    
    if (dropdown && btnUserMenu) {
        if (!dropdown.contains(e.target) && !btnUserMenu.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }
});

/**
 * Actualizar UI con información del usuario
 */
function actualizarUIUsuario(userData) {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    
    if (userData && userData.email) {
        const email = userData.email;
        const nombreCorto = email.split('@')[0];
        
        if (userNameDisplay) {
            userNameDisplay.textContent = nombreCorto;
        }
        
        if (userEmailDisplay) {
            userEmailDisplay.textContent = email;
        }
        
        console.log('✅ UI actualizada para:', email);
    }
}

/**
 * Bloquear/Desbloquear contenido de la aplicación
 */
function toggleContentLock(locked) {
    const dashboardContainer = document.querySelector('.dashboard-container');
    
    if (dashboardContainer) {
        if (locked) {
            dashboardContainer.classList.add('content-locked');
        } else {
            dashboardContainer.classList.remove('content-locked');
        }
    }
}

/**
 * Mostrar modal de confirmación de cierre de sesión
 */
function logoutSupabase() {
    const modal = document.getElementById('modalConfirmarLogout');
    if (modal) {
        // Cerrar dropdown de usuario primero
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.style.display = 'none';
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Cerrar modal de confirmación de logout
 */
function cerrarModalLogout() {
    const modal = document.getElementById('modalConfirmarLogout');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirmar y ejecutar cierre de sesión
 */
async function confirmarLogout() {
    if (!supabase) return;
    
    // Cerrar modal
    cerrarModalLogout();
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        localStorage.removeItem('supabaseSession');
        showToast('👋 Sesión cerrada correctamente', 'success');
        
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
 */
async function inicializarAutenticacion() {
    if (!supabase) {
        console.error('❌ Supabase no está disponible');
        toggleContentLock(true);
        abrirModalLogin();
        return;
    }
    
    try {
        // Intentar obtener la sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (session && session.user) {
            // HAY SESIÓN: Desbloquear y actualizar UI
            console.log('✅ Sesión activa encontrada:', session.user.email);
            toggleContentLock(false);
            actualizarUIUsuario(session.user);
        } else {
            // NO HAY SESIÓN: Bloquear y mostrar login
            console.log('⚠️ No hay sesión activa');
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
    // DOM ya está listo
    inicializarAutenticacion();
}
