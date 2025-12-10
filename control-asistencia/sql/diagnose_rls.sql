-- ===================================================
-- DIAGNÓSTICO: Verificar políticas RLS actuales
-- ===================================================
-- Ejecuta estas queries para ver qué está pasando
-- ===================================================

-- 1. Ver todas las políticas actuales en la tabla empleados
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'empleados';

-- 2. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('empleados', 'empleados_log');

-- 3. Ver empleados con sus creadores
SELECT 
  id,
  nombre,
  activo,
  created_by,
  created_at
FROM empleados
ORDER BY created_at DESC
LIMIT 10;

-- 4. Ver tu ID de usuario actual
SELECT auth.uid() as mi_user_id;

-- ===================================================
-- Si ves que created_by es NULL en algunos empleados,
-- esos empleados no serán visibles porque la política
-- filtra por created_by = auth.uid()
-- 
-- Si los empleados tienen created_by pero aún los ves
-- todos, significa que las políticas no se aplicaron
-- correctamente.
-- ===================================================
