-- ===================================================
-- ACTUALIZAR POLÍTICAS RLS PARA DATOS POR USUARIO
-- ===================================================
-- Este script actualiza las políticas para que cada usuario
-- solo pueda ver y gestionar sus propios empleados
-- ===================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer log" ON empleados_log;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear log" ON empleados_log;

-- Si ya ejecutaste disable_rls.sql, primero habilita RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS BASADAS EN USUARIO

-- Empleados: cada usuario solo ve sus propios empleados
CREATE POLICY "Usuarios ven solo sus empleados"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Empleados: cada usuario solo puede crear empleados para sí mismo
CREATE POLICY "Usuarios crean solo sus empleados"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Empleados: cada usuario solo puede actualizar sus propios empleados
CREATE POLICY "Usuarios actualizan solo sus empleados"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Empleados: cada usuario solo puede eliminar sus propios empleados
CREATE POLICY "Usuarios eliminan solo sus empleados"
  ON empleados
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 3. POLÍTICAS PARA EMPLEADOS_LOG
-- El log debe estar asociado al empleado, así que indirectamente está filtrado

-- Log: permitir lectura de logs de empleados propios
CREATE POLICY "Usuarios ven logs de sus empleados"
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

-- Log: permitir inserción de logs (necesario para auditoría)
CREATE POLICY "Usuarios crean logs de sus empleados"
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

-- ===================================================
-- FIN DEL SCRIPT
-- ===================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase > SQL Editor
-- 2. Copia y pega este contenido
-- 3. Ejecuta (Run)
-- 4. Recarga la aplicación
-- 
-- IMPORTANTE: Después de ejecutar esto, cada usuario
-- solo verá sus propios empleados. Los empleados
-- existentes permanecerán asociados al usuario que
-- los creó (campo created_by).
-- ===================================================
