-- ===================================================
-- PASO 2: CONFIGURAR RLS CORRECTAMENTE
-- ===================================================
-- Ejecuta DESPUÉS de 01_limpiar_duplicados.sql
-- ===================================================

-- PASO 1: Deshabilitar RLS temporalmente
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'empleados'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON empleados';
    END LOOP;
    
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'empleados_log'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON empleados_log';
    END LOOP;
END $$;

-- PASO 3: Habilitar RLS nuevamente
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas RESTRICTIVAS (solo ver propios empleados)
CREATE POLICY "select_own_employees"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "insert_own_employees"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_employees"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "delete_own_employees"
  ON empleados
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- PASO 5: Políticas para logs
CREATE POLICY "select_own_logs"
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

CREATE POLICY "insert_own_logs"
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

-- PASO 6: Verificar que las políticas se crearon
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('empleados', 'empleados_log')
ORDER BY tablename, cmd;

-- ===================================================
-- IMPORTANTE: Después de ejecutar este script
-- ===================================================
-- 1. Recarga la página de tu aplicación
-- 2. Solo deberías ver TUS empleados
-- 3. Si no ves ningún empleado, es porque los
--    empleados existentes tienen created_by = NULL
--    o created_by de otro usuario
-- 
-- Para ver todos los empleados en la base de datos
-- (solo para verificar, desde el SQL editor):
-- SELECT id, nombre, created_by FROM empleados;
-- ===================================================
