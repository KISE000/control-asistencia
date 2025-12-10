// CREDENCIALES SUPABASE
const SUPABASE_URL = 'https://exttzsyfyqmonbleihna.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dHR6c3lmeXFtb25ibGVpaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzMxMTMsImV4cCI6MjA4MDkwOTExM30.6Nhkyyx6ds7VSvVzq_XDHDugL9XKXQhfxCu8HLGSLEU';

// Variables Globales
let supabase = null;

// Inicializar Supabase
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
}
let empleados = [
    {id: 1, nombre: 'Melissa Guzmán', seleccionado: true},
    {id: 2, nombre: 'Jimena Hernández', seleccionado: true},
    {id: 3, nombre: 'Samantha Varela', seleccionado: true}
];
let feriados = []; 
let logoData = null; 
let nextId = 4;