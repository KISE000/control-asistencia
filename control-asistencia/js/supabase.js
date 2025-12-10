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