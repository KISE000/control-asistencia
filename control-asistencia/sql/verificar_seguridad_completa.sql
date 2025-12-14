-- ===================================================
-- SCRIPT DE VERIFICACIÓN DE SEGURIDAD COMPLETA
-- ===================================================
-- Este script verifica que todas las tablas tengan
-- Row Level Security (RLS) configurado correctamente
-- ===================================================

-- 1. VERIFICAR ESTADO DE RLS EN TODAS LAS TABLAS
SELECT 
  '📊 ESTADO DE RLS POR TABLA' as seccion,
  tablename as tabla,
  CASE 
    WHEN rowsecurity = true THEN '✅ ACTIVO'
    ELSE '❌ INACTIVO'
  END as rls_estado,
  CASE 
    WHEN rowsecurity = true THEN '🔒 Protegido'
    ELSE '⚠️ SIN PROTECCIÓN'
  END as seguridad
FROM pg_tables 
WHERE tablename IN ('empleados', 'empleados_log', 'asistencias', 'historial_nominas')
ORDER BY tablename;

-- 2. LISTAR TODAS LAS POLÍTICAS DE SEGURIDAD
SELECT 
  '🛡️ POLÍTICAS DE SEGURIDAD ACTIVAS' as seccion,
  tablename as tabla,
  policyname as nombre_politica,
  cmd as operacion,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Lectura'
    WHEN cmd = 'INSERT' THEN '➕ Creación'
    WHEN cmd = 'UPDATE' THEN '✏️ Modificación'
    WHEN cmd = 'DELETE' THEN '🗑️ Eliminación'
    ELSE cmd
  END as tipo_acceso
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3. CONTAR POLÍTICAS POR TABLA
SELECT 
  '📈 RESUMEN DE POLÍTICAS' as seccion,
  tablename as tabla,
  COUNT(*) as total_politicas,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ Completo (4/4)'
    WHEN COUNT(*) > 0 THEN '⚠️ Incompleto (' || COUNT(*) || '/4)'
    ELSE '❌ Sin políticas'
  END as estado
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('empleados', 'asistencias')
GROUP BY tablename
ORDER BY tablename;

-- 4. VERIFICAR ÍNDICES IMPORTANTES
SELECT 
  '🔍 ÍNDICES DE RENDIMIENTO' as seccion,
  tablename as tabla,
  indexname as nombre_indice,
  indexdef as definicion
FROM pg_indexes 
WHERE tablename IN ('empleados', 'asistencias')
  AND (
    indexname LIKE '%created_by%' OR
    indexname LIKE '%empleado_id%' OR
    indexname = 'empleados_pkey' OR
    indexname = 'asistencias_pkey'
  )
ORDER BY tablename, indexname;

-- 5. VERIFICAR ESTRUCTURA DE TABLA EMPLEADOS
SELECT 
  '👥 ESTRUCTURA TABLA EMPLEADOS' as seccion,
  column_name as columna,
  data_type as tipo,
  CASE 
    WHEN column_name = 'created_by' THEN '✅ Campo de seguridad'
    WHEN column_name = 'id' THEN '🔑 Clave primaria'
    ELSE ''
  END as nota
FROM information_schema.columns 
WHERE table_name = 'empleados'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR ESTRUCTURA DE TABLA ASISTENCIAS
SELECT 
  '📅 ESTRUCTURA TABLA ASISTENCIAS' as seccion,
  column_name as columna,
  data_type as tipo,
  CASE 
    WHEN column_name = 'empleado_id' THEN '🔗 Relación con empleados'
    WHEN column_name = 'id' THEN '🔑 Clave primaria'
    ELSE ''
  END as nota
FROM information_schema.columns 
WHERE table_name = 'asistencias'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ===================================================
--
-- ✅ CORRECTO:
-- - empleados: RLS ACTIVO con 4 políticas
-- - asistencias: RLS ACTIVO con 4 políticas
-- - Índices en created_by y empleado_id
--
-- ❌ REQUIERE ATENCIÓN:
-- - Si alguna tabla muestra "INACTIVO"
-- - Si faltan políticas (menos de 4)
-- - Si no existen índices
--
-- ACCIÓN REQUERIDA:
-- 1. Si empleados no tiene RLS → ejecutar solucion_definitiva_rls.sql
-- 2. Si asistencias no tiene RLS → ejecutar setup_asistencias_rls.sql
--
-- ===================================================
