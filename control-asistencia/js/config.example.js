// ========================================
// CREDENCIALES SUPABASE - EJEMPLO
// ========================================
// ⚠️ INSTRUCCIONES:
// 1. Copia este archivo como "config.js"
// 2. Reemplaza las credenciales con las tuyas de Supabase
// 3. NUNCA subas config.js a GitHub (ya está en .gitignore)
//
// Para obtener tus credenciales:
// - Ve a https://supabase.com → Tu proyecto → Settings → API
// ========================================

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'tu_clave_anon_aqui';

// Variables Globales
let supabase = null;

// Inicializar Supabase
// ⚠️ ADVERTENCIA DE SEGURIDAD:
// Las claves están expuestas en el cliente. Asegúrate de tener RLS (Row Level Security)
// habilitado en Supabase para proteger tus datos.
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
        if (!supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase inicializado correctamente desde config.js');
        }
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
    }
} else {
    console.error('❌ La librería de Supabase no se ha cargado. Verifica tu conexión a internet.');
}

// Datos iniciales (vacíos por defecto, se cargan desde Supabase)
let empleados = [];
let feriados = []; 
let logoData = null; 
let nextId = 1;
