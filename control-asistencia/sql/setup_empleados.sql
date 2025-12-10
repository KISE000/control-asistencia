-- ===================================================
-- SCRIPT DE CONFIGURACIÓN DE TABLAS DE EMPLEADOS
-- ===================================================
-- Este script crea las tablas necesarias para gestionar empleados
-- y el registro de operaciones (auditoría)
-- ===================================================

-- 1. ELIMINAR TABLAS EXISTENTES (si existen)
DROP TABLE IF EXISTS empleados_log CASCADE;
DROP TABLE IF EXISTS empleados CASCADE;

-- 2. CREAR TABLA DE EMPLEADOS
CREATE TABLE empleados (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. CREAR TABLA DE LOG DE OPERACIONES
CREATE TABLE empleados_log (
  id BIGSERIAL PRIMARY KEY,
  empleado_id BIGINT REFERENCES empleados(id),
  empleado_nombre TEXT NOT NULL,
  operacion TEXT NOT NULL CHECK (operacion IN ('CREAR', 'ELIMINAR')),
  usuario_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_empleados_created_at ON empleados(created_at);
CREATE INDEX idx_empleados_log_empleado_id ON empleados_log(empleado_id);
CREATE INDEX idx_empleados_log_operacion ON empleados_log(operacion);
CREATE INDEX idx_empleados_log_created_at ON empleados_log(created_at);

-- 5. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. CREAR TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE TRIGGER update_empleados_updated_at 
    BEFORE UPDATE ON empleados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados_log ENABLE ROW LEVEL SECURITY;

-- 8. CREAR POLÍTICAS DE SEGURIDAD

-- Política para empleados: permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer empleados"
  ON empleados
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para empleados: permitir inserción a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear empleados"
  ON empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para empleados: permitir actualización a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar empleados"
  ON empleados
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para empleados: permitir eliminación a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden eliminar empleados"
  ON empleados
  FOR DELETE
  TO authenticated
  USING (true);

-- Política para empleados_log: permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer log"
  ON empleados_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para empleados_log: permitir inserción a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear log"
  ON empleados_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 9. INSERTAR DATOS DE PRUEBA (OPCIONAL)
-- Descomenta las siguientes líneas si deseas datos de prueba
/*
INSERT INTO empleados (nombre, activo) VALUES 
  ('Melissa Guzmán', true),
  ('Jimena Hernández', true),
  ('Samantha Varela', true);
*/

-- ===================================================
-- FIN DEL SCRIPT
-- ===================================================
-- Para ejecutar este script:
-- 1. Ve al dashboard de Supabase
-- 2. Selecciona tu proyecto
-- 3. Ve a SQL Editor
-- 4. Copia y pega este contenido
-- 5. Haz clic en "Run"
-- ===================================================
