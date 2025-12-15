document.addEventListener('DOMContentLoaded', () => {
  console.log('Event listeners are being set up.');

  // Helper function to add listeners by ID
  const addClickListener = (id, callback) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', callback);
    }
  };

  const addKeypressListener = (id, callback) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('keypress', callback);
    }
  };

  // --- MODAL EXCEL ---
  addClickListener('btnCloseModalExcel', cerrarModalExcel);
  addClickListener('btnCancelModalExcel', cerrarModalExcel);
  addClickListener('btnDownloadExcelEdited', descargarExcelEditado);
  addClickListener('btnGuardarExcel', () => guardarExcelSupabase(true));

  // --- AUTH MODAL ---
  addClickListener('tabLogin', () => cambiarTabAuth('login'));
  addClickListener('tabRegistro', () => cambiarTabAuth('registro'));

  // Login Form
  addClickListener('toggleLoginPass', () => togglePasswordVisibility('loginPassword', 'togglePasswordIcon'));
  addClickListener('forgotPasswordLink', (e) => {
      e.preventDefault();
      mostrarRecuperarPassword();
  });
  addClickListener('btnLogin', loginSupabase);
  addKeypressListener('loginEmail', (e) => {
      if (e.key === 'Enter') loginSupabase();
  });
  addKeypressListener('loginPassword', (e) => {
      if (e.key === 'Enter') loginSupabase();
  });

  // Register Form
  addClickListener('toggleRegisterPass', () => togglePasswordVisibility('registroPassword', 'togglePasswordIcon2'));
  addClickListener('btnRegistro', registrarSupabase);
  addKeypressListener('registroPassword', (e) => {
      if (e.key === 'Enter') registrarSupabase();
  });
  addKeypressListener('registroPasswordConfirm', (e) => {
      if (e.key === 'Enter') registrarSupabase();
  });

  // --- TIME PICKER MODAL ---
  addClickListener('btnCloseTimePicker', cerrarTimePicker);
  addClickListener('btnCancelTimePicker', cerrarTimePicker);
  addClickListener('btnConfirmTimePicker', confirmarTiempo);

  // --- PASSWORD RECOVERY MODAL ---
  addClickListener('btnCloseRecuperar', cerrarRecuperarPassword);
  addClickListener('btnCancelRecuperar', cerrarRecuperarPassword);
  addClickListener('btnEnviarRecuperacion', enviarRecuperacionPassword);
  addKeypressListener('recuperarEmail', (e) => {
    if (e.key === 'Enter') enviarRecuperacionPassword();
  });

});
