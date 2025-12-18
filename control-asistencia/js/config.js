// CREDENCIALES SUPABASE
const SUPABASE_URL = 'https://exttzsyfyqmonbleihna.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dHR6c3lmeXFtb25ibGVpaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzMxMTMsImV4cCI6MjA4MDkwOTExM30.6Nhkyyx6ds7VSvVzq_XDHDugL9XKXQhfxCu8HLGSLEU';

// Variables Globales
// No declaramos 'var supabase = null' aquí para evitar sobrescribir la librería cargada por CDN antes de usarla.

// Inicializar Supabase
// ⚠️ ADVERTENCIA DE SEGURIDAD:
// Las claves están expuestas en el cliente. Asegúrate de tener RLS (Row Level Security)
// habilitado en Supabase para proteger tus datos.

// Verificar si la librería está cargada (el objeto window.supabase debe tener createClient)
const sbLib = window.supabase;

if (typeof sbLib !== 'undefined' && sbLib !== null && typeof sbLib.createClient === 'function') {
    try {
        // Crear cliente usando la librería
        const client = sbLib.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Asignar el cliente a la variable global 'supabase' (sobrescribiendo la librería, lo cual es intencional para que auth.js funcione)
        window.supabase = client;
        
        console.log('✅ Supabase inicializado correctamente.');
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
    }
} else {
    // Si llegamos aquí, window.supabase no es la librería o no cargó
    // Verificamos si ya es el cliente (por si se ejecutó dos veces)
    if (window.supabase && window.supabase.auth) {
        console.log('ℹ️ Supabase ya estaba inicializado.');
    } else {
        console.error('❌ La librería de Supabase no se ha cargado correctamente.');
        console.log('Estado actual de window.supabase:', window.supabase);
    }
}

let empleados = [
    {id: 1, nombre: 'Melissa Guzmán', seleccionado: true},
    {id: 2, nombre: 'Jimena Hernández', seleccionado: true},
    {id: 3, nombre: 'Samantha Varela', seleccionado: true}
];
let feriados = []; 
let logoData = null; 
let nextId = 4;