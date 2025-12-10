-- ===================================================
-- PASO 1: LIMPIAR DUPLICADOS Y DATOS VIEJOS
-- ===================================================
-- ADVERTENCIA: Esto eliminará TODOS los empleados
-- Ejecuta solo si quieres empezar desde cero
-- ===================================================

-- Eliminar todos los registros de empleados_log
DELETE FROM empleados_log;

-- Eliminar todos los empleados
DELETE FROM empleados;

-- Resetear los contadores de IDs
ALTER SEQUENCE empleados_id_seq RESTART WITH 1;
ALTER SEQUENCE empleados_log_id_seq RESTART WITH 1;

-- Verificar que estén vacías
SELECT COUNT(*) as empleados_count FROM empleados;
SELECT COUNT(*) as log_count FROM empleados_log;

-- ===================================================
-- Esto dejará las tablas completamente vacías
-- Después ejecuta fix_rls_complete.sql
-- ===================================================
