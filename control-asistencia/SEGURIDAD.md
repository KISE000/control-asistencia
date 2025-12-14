# Seguridad y Protección de Datos por Usuario

Este documento explica cómo funciona la seguridad en el sistema de Control de Asistencia, garantizando que cada usuario tenga sus datos completamente separados y protegidos.

## 🔒 Arquitectura de Seguridad

### Principio Fundamental

**Cada usuario solo puede ver y modificar sus propios datos**. Esto se logra mediante:

1. **Autenticación**: Supabase Auth gestiona usuarios y sesiones
2. **Row Level Security (RLS)**: Políticas a nivel de base de datos que filtran automáticamente los datos
3. **Relaciones en cascada**: Los empleados pertenecen a usuarios, las asistencias pertenecen a empleados

### Flujo de Seguridad

```
Usuario Autenticado (UUID)
    ↓
Empleados (created_by = Usuario UUID)
    ↓
Asistencias (empleado_id → Empleado.id)
```

## 📊 Tablas Protegidas

### Tabla: `empleados`

**Protección**: ✅ Row Level Security ACTIVO

**Columnas de seguridad**:

- `id` - Identificador único del empleado
- `created_by` - UUID del usuario que creó el empleado
- `activo` - Estado del empleado

**Políticas RLS**:

- ✅ SELECT: Solo ver empleados propios
- ✅ INSERT: Solo crear empleados para ti mismo
- ✅ UPDATE: Solo modificar tus empleados
- ✅ DELETE: Solo eliminar tus empleados

**Implementado en**: [`solucion_definitiva_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/solucion_definitiva_rls.sql)

---

### Tabla: `asistencias`

**Protección**: ✅ Row Level Security ACTIVO (después de ejecutar setup)

**Columnas de seguridad**:

- `empleado_id` - Referencia al empleado (quien a su vez tiene `created_by`)

**Políticas RLS**:

- ✅ SELECT: Solo ver asistencias de tus empleados
- ✅ INSERT: Solo crear asistencias para tus empleados
- ✅ UPDATE: Solo modificar asistencias de tus empleados
- ✅ DELETE: Solo eliminar asistencias de tus empleados

**Implementado en**: [`setup_asistencias_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/setup_asistencias_rls.sql)

---

### Tabla: `empleados_log`

**Protección**: ✅ Row Level Security ACTIVO

**Función**: Auditoría de operaciones sobre empleados

**Políticas**: Solo acceso a logs de tus propios empleados

---

## 🚀 Cómo Configurar la Seguridad

### Paso 1: Acceder a Supabase

1. Abre tu navegador y ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Configurar Seguridad de Empleados

> **Nota**: Este paso probablemente YA está hecho si ya puedes ver/crear empleados.

1. Abre el archivo [`solucion_definitiva_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/solucion_definitiva_rls.sql)
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run**
5. Verifica que se muestren mensajes de éxito ✅

### Paso 3: Configurar Seguridad de Asistencias

> **Importante**: Este es el paso CRÍTICO para proteger las asistencias.

1. Abre el archivo [`setup_asistencias_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/setup_asistencias_rls.sql)
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **Run**
5. Verifica que aparezcan 4 políticas creadas ✅

### Paso 4: Verificar la Configuración

1. Abre el archivo [`verificar_seguridad_completa.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/verificar_seguridad_completa.sql)
2. Copia y ejecuta en SQL Editor
3. Verifica los resultados:
   - ✅ `empleados`: RLS ACTIVO con 4 políticas
   - ✅ `asistencias`: RLS ACTIVO con 4 políticas

## ✅ Cómo Probar que Funciona

### Prueba 1: Verificar Aislamiento de Empleados

**Con tu cuenta actual**:

1. Crea un empleado llamado "Test Seguridad A"
2. Verifica que lo ves en la lista

**Con otra cuenta**:

1. Cierra sesión
2. Crea/usa otra cuenta diferente
3. ❌ NO deberías ver "Test Seguridad A"
4. Crea tu propio empleado "Test Seguridad B"
5. ✅ Solo deberías ver "Test Seguridad B"

### Prueba 2: Verificar Aislamiento de Asistencias

**Con la primera cuenta**:

1. Abre el editor
2. Guarda asistencias para "Test Seguridad A"
3. Ve a "Ver Registros en Nube" → Deberías ver tus registros

**Con la segunda cuenta**:

1. Ve a "Ver Registros en Nube"
2. ❌ NO deberías ver registros de "Test Seguridad A"
3. Guarda tus propias asistencias
4. ✅ Solo deberías ver tus registros

## 🛡️ ¿Qué Protege Exactamente?

### Protegido ✅

| Escenario                                          | Resultado                |
| -------------------------------------------------- | ------------------------ |
| Usuario A crea empleado "Juan"                     | Solo Usuario A lo ve     |
| Usuario B intenta ver empleado "Juan"              | ❌ No lo ve              |
| Usuario A guarda asistencias de "Juan"             | Solo Usuario A las ve    |
| Usuario B intenta ver asistencias de "Juan"        | ❌ No las ve             |
| Usuario A y B tienen empleados con el mismo nombre | Cada uno ve solo el suyo |

### Cómo Funciona Internamente

**A nivel de base de datos**, cuando haces una consulta:

```javascript
// Tu código JavaScript
const { data } = await supabase.from("asistencias").select("*");
```

**Supabase automáticamente agrega**:

```sql
-- La política RLS añade este filtro invisible
WHERE EXISTS (
  SELECT 1 FROM empleados
  WHERE empleados.id = asistencias.empleado_id
  AND empleados.created_by = auth.uid()
)
```

**Resultado**: Solo recibes TUS datos, automáticamente.

## 🔍 Solución de Problemas

### Problema: "Veo datos de otros usuarios"

**Causa**: RLS no está configurado correctamente

**Solución**:

1. Ejecuta [`verificar_seguridad_completa.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/verificar_seguridad_completa.sql)
2. Verifica qué tabla muestra "INACTIVO"
3. Ejecuta el script correspondiente:
   - `empleados` → [`solucion_definitiva_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/solucion_definitiva_rls.sql)
   - `asistencias` → [`setup_asistencias_rls.sql`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/sql/setup_asistencias_rls.sql)

### Problema: "No puedo guardar datos"

**Causa**: Políticas RLS demasiado restrictivas o sesión expirada

**Solución**:

1. Verifica que estés autenticado
2. Cierra sesión y vuelve a iniciar
3. Si persiste, revisa los logs del navegador (F12 → Console)

### Problema: "Error: created_by no existe"

**Causa**: La tabla no tiene la columna `created_by`

**Solución**:

```sql
-- Ejecutar en SQL Editor
ALTER TABLE empleados
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

## 📚 Recursos Adicionales

- [Documentación de Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guía del Proyecto](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/GUIA_PROYECTO.md)

## ⚠️ Advertencias Importantes

1. **No deshabilites RLS**: Esto expondrá todos los datos a todos los usuarios
2. **No compartas credenciales**: Cada persona debe tener su propia cuenta
3. **Backup regular**: Aunque los datos están protegidos, siempre haz respaldos
4. **Revisar periódicamente**: Ejecuta el script de verificación mensualmente

## 📝 Notas Técnicas

- **RLS se aplica a nivel de base de datos**: No importa desde dónde accedas (app, API, SQL directo)
- **Cero cambios en el código JavaScript**: Las políticas son transparentes
- **Alto rendimiento**: Los índices aseguran que los filtros sean rápidos
- **Auditable**: Todos los accesos se pueden rastrear si es necesario

---

**Última actualización**: Diciembre 2025  
**Versión de seguridad**: 2.0 (Con protección de asistencias)
