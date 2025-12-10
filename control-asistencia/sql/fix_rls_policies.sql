-- ===================================================
-- SCRIPT PARA CORREGIR POLÍTICAS RLS
-- ===================================================
-- Este script corrige las políticas de Row Level Security
-- que están bloqueando las operaciones de empleados
-- ===================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar empleados" ON empleados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer log" ON empleados_log;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear log" ON empleados_log;

-- 2. DESHABILITAR RLS TEMPORALMENTE PARA VERIFICACIÓN
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log DISABLE ROW LEVEL SECURITY;

-- 3. VOLVER A HABILITAR RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log ENABLE ROW LEVEL SECURITY;

-- 4. CREAR POLÍTICAS PERMISIVAS (PERMITIR TODO A USUARIOS AUTENTICADOS)

-- Política para empleados: PERMITIR TODO A USUARIOS AUTENTICADOS
CREATE POLICY "empleados_select_policy"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "empleados_insert_policy"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "empleados_update_policy"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "empleados_delete_policy"
  ON empleados
  FOR DELETE
  TO authenticated
  USING (true);

-- Política para empleados_log: PERMITIR TODO A USUARIOS AUTENTICADOS
CREATE POLICY "empleados_log_select_policy"
  ON empleados_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "empleados_log_insert_policy"
  ON empleados_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. OPCIONAL: SI AÚN NO FUNCIONA, PUEDES DESHABILITAR RLS COMPLETAMENTE
-- Descomenta las siguientes líneas SOLO si sigues teniendo problemas:
-- ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE empleados_log DISABLE ROW LEVEL SECURITY;

-- ===================================================
-- FIN DEL SCRIPT
-- ===================================================
-- INSTRUCCIONES:
-- 1. Copia todo este contenido
-- 2. Ve a Supabase > SQL Editor
-- 3. Pega y ejecuta
-- 4. Recarga la aplicación (F5)
-- ===================================================
