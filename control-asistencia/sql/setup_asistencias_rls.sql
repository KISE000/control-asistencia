-- ===================================================
-- CONFIGURACIÓN DE SEGURIDAD PARA TABLA ASISTENCIAS
-- ===================================================
-- Este script habilita Row Level Security (RLS) en la tabla
-- asistencias para garantizar que cada usuario solo vea y
-- modifique los datos de sus propios empleados.
-- ===================================================

BEGIN;

-- PASO 1: Verificar que la tabla empleados tiene RLS activo
-- (Requisito previo necesario)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'empleados' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'ERROR: La tabla empleados NO tiene RLS activo. Ejecuta primero solucion_definitiva_rls.sql';
    END IF;
    RAISE NOTICE '✅ Tabla empleados tiene RLS activo';
END $$;

-- PASO 2: Verificar/Crear índice en empleado_id para mejor rendimiento
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_asistencias_empleado_id 
      ON asistencias(empleado_id);
    RAISE NOTICE '✅ Índice creado/verificado en empleado_id';
END $$;

-- PASO 3: Deshabilitar RLS temporalmente (por si estaba activo)
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;

-- PASO 4: Eliminar políticas existentes si las hay
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'asistencias'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON asistencias', pol.policyname);
        RAISE NOTICE 'Eliminada política existente: %', pol.policyname;
    END LOOP;
END $$;

-- PASO 5: Habilitar RLS en tabla asistencias
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- PASO 6: Forzar RLS incluso para el owner de la tabla
ALTER TABLE asistencias FORCE ROW LEVEL SECURITY;

-- PASO 7: Notificar RLS habilitado
DO $$
BEGIN
    RAISE NOTICE '✅ RLS habilitado y forzado en tabla asistencias';
END $$;

-- PASO 8: Crear políticas restrictivas
-- Estas políticas verifican que el empleado_id corresponde a un empleado
-- creado por el usuario actual (created_by = auth.uid())

-- Política SELECT: Solo ver asistencias de empleados propios
CREATE POLICY "asistencias_select"
  ON asistencias
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = asistencias.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

-- Política INSERT: Solo crear asistencias para empleados propios
CREATE POLICY "asistencias_insert"
  ON asistencias
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = asistencias.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

-- Política UPDATE: Solo actualizar asistencias de empleados propios
CREATE POLICY "asistencias_update"
  ON asistencias
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = asistencias.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = asistencias.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

-- Política DELETE: Solo eliminar asistencias de empleados propios
CREATE POLICY "asistencias_delete"
  ON asistencias
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM empleados 
      WHERE empleados.id = asistencias.empleado_id 
      AND empleados.created_by = auth.uid()
    )
  );

COMMIT;

-- ===================================================
-- PASO 9: VERIFICACIÓN
-- ===================================================

-- Confirmar que RLS está activo
SELECT 
  '✅ RLS CONFIGURADO CORRECTAMENTE' as mensaje,
  tablename,
  rowsecurity as rls_activo
FROM pg_tables 
WHERE tablename = 'asistencias';

-- Listar todas las políticas creadas
SELECT 
  '📋 POLÍTICAS CREADAS' as seccion,
  policyname as politica,
  cmd as comando,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Ver'
    WHEN cmd = 'INSERT' THEN '➕ Crear'
    WHEN cmd = 'UPDATE' THEN '✏️ Modificar'
    WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
  END as accion
FROM pg_policies 
WHERE tablename = 'asistencias'
ORDER BY cmd;

-- ===================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ===================================================
-- 1. Verifica que aparezcan 4 políticas (SELECT, INSERT, UPDATE, DELETE)
-- 2. Recarga tu aplicación (F5)
-- 3. Prueba crear un empleado y guardar asistencias
-- 4. Cierra sesión e inicia con otra cuenta
-- 5. Verifica que NO veas los datos del otro usuario
-- ===================================================
