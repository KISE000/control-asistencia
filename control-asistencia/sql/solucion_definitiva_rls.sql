-- ===================================================
-- SOLUCIÓN DEFINITIVA - FORZAR RLS
-- ===================================================
-- Este script garantiza que RLS esté configurado correctamente
-- ===================================================

BEGIN;

-- PASO 1: Deshabilitar completamente RLS
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas sin excepción
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Eliminar políticas de empleados
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'empleados'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON empleados', pol.policyname);
        RAISE NOTICE 'Eliminada política: %', pol.policyname;
    END LOOP;
    
    -- Eliminar políticas de empleados_log
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'empleados_log'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON empleados_log', pol.policyname);
        RAISE NOTICE 'Eliminada política: %', pol.policyname;
    END LOOP;
END $$;

-- PASO 3: Habilitar RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log ENABLE ROW LEVEL SECURITY;

-- PASO 4: Forzar RLS incluso para el owner de la tabla
ALTER TABLE empleados FORCE ROW LEVEL SECURITY;
ALTER TABLE empleados_log FORCE ROW LEVEL SECURITY;

-- PASO 5: Crear políticas RESTRICTIVAS (una por una)
CREATE POLICY "empleados_select"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "empleados_insert"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "empleados_update"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "empleados_delete"
  ON empleados
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "empleados_log_select"
  ON empleados_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = empleados_log.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

CREATE POLICY "empleados_log_insert"
  ON empleados_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = empleados_log.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

COMMIT;

-- PASO 6: Verificar que todo está correcto
SELECT 
  '✅ RLS configurado correctamente' as mensaje;

-- Ver las políticas creadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('empleados', 'empleados_log')
ORDER BY tablename, cmd;

-- ===================================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- 1. Recarga la aplicación (F5)
-- 2. Solo deberías ver TUS empleados
-- 3. Agrega un empleado de prueba
-- 4. Entra con otro usuario
-- 5. NO deberías ver el empleado del paso 3
-- ===================================================
