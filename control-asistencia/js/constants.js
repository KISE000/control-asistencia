// === APP CONSTANTS ===

const KEYS = {
    SESSION: 'supabaseSession',
    THEME: 'theme',
    REMEMBERED_EMAIL: 'rememberedEmail',
    CONTROL_ASISTENCIA: 'controlAsistencia', // config local
};

const TABLES = {
    EMPLEADOS: 'empleados',
    HISTORIAL: 'historial_nominas',
    ASISTENCIAS: 'asistencias'
};

const BUCKETS = {
    NOMINAS: 'nominas'
};

// Export global for client-side usage (no modules)
window.APP_CONSTANTS = {
    KEYS,
    TABLES,
    BUCKETS
};
