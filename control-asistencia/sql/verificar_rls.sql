-- ===================================================
-- VERIFICAR ESTADO ACTUAL DE RLS
-- ===================================================

-- 1. ¿Está habilitado RLS?
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ HABILITADO' ELSE '❌ DESHABILITADO' END as rls_status
FROM pg_tables 
WHERE tablename IN ('empleados', 'empleados_log')
  AND schemaname = 'public';

-- 2. ¿Qué políticas existen?
SELECT 
  tablename,
  policyname,
  cmd as operacion,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Filtra por usuario'
    WHEN qual = 'true' THEN '❌ Permite TODO'
    ELSE '⚠️ Otra condición: ' || qual
  END as tipo_filtro
FROM pg_policies 
WHERE tablename IN ('empleados', 'empleados_log')
ORDER BY tablename, cmd;

-- 3. Ver empleados actuales con sus creadores
SELECT 
  id,
  nombre,
  CASE 
    WHEN created_by IS NULL THEN '❌ SIN USUARIO'
    ELSE '✅ ' || created_by::text
  END as created_by_status,
  activo
FROM empleados
ORDER BY id;

-- 4. ¿Cuál es tu ID de usuario?
SELECT 
  '✅ Tu ID de usuario es: ' || auth.uid()::text as mi_id,
  '✅ Tu email es: ' || (SELECT email FROM auth.users WHERE id = auth.uid()) as mi_email;

-- ===================================================
-- INTERPRETACIÓN:
-- 
-- Si RLS está DESHABILITADO: Ese es el problema
-- Si hay políticas con "Permite TODO": Ese es el problema  
-- Si hay empleados "SIN USUARIO": No los verás con RLS activo
-- ===================================================
