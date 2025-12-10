-- ===================================================
-- SOLUCIÓN DEFINITIVA: DESACTIVAR RLS
-- ===================================================
-- Este script desactiva completamente Row Level Security
-- para las tablas de empleados, permitiendo todas las operaciones
-- ===================================================

-- DESACTIVAR RLS EN AMBAS TABLAS
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log DISABLE ROW LEVEL SECURITY;

-- ===================================================
-- ¡LISTO! Ahora deberías poder:
-- ✅ Agregar empleados
-- ✅ Eliminar empleados
-- ✅ Ver el log de operaciones
-- ===================================================
