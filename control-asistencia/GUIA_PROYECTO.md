# Guía Completa del Proyecto: Control de Asistencia PRO

Esta guía proporciona una visión detallada de tu aplicación **Control de Asistencia PRO**, diseñada para gestionar la asistencia de empleados, generar reportes profesionales en Excel y sincronizar datos con la nube mediante Supabase.

---

## 1. Visión General del Proyecto

**Objetivo**: Facilitar la gestión de nóminas y asistencia, permitiendo editar registros diarios, calcular horas trabajadas/extras automáticamente y exportar reportes con formato corporativo.

**Tecnologías Principales**:

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend / Nube**: Supabase (Base de datos PostgreSQL, Autenticación, Almacenamiento de Archivos).
- **Seguridad**: Row Level Security (RLS) para aislamiento completo de datos por usuario.
- **Librerías Clave**:
  - `SheetJS` (`xlsx-js-style`): Para generar y estilizar archivos Excel.
  - `Supabase JS Client`: Conexión con la nube.
  - `Lucide`: Iconos SVG modernos.
  - `jsPDF`: Generación de PDFs (funcionalidad secundaria).

---

## 2. Estructura de Archivos

El proyecto se encuentra en la carpeta `control-asistencia`. Aquí están los componentes más importantes:

### Directorios

- **`css/`**: Contiene todos los estilos visuales.
  - `components.css`: Estilos de botones, inputs y tarjetas.
  - `enhanced.css` / `mobile.css`: Estilos para diseño responsivo y mejoras visuales.
  - `excel-theme.css`: Estilos específicos para temas de Excel.
- **`js/`**: Lógica de la aplicación.
  - `app.js`: Punto de entrada. Inicializa la app, configura fechas y maneja empleados locales.
  - `supabase.js`: Maneja **toda** la comunicación con la nube (Guardar asistencias, Cargar empleados, Historial).
  - `excel.js`: El módulo más complejo. Maneja el **Editor Modal**, cálculos de horas y la generación del archivo `.xlsx` estético.
  - `auth.js`: Gestión de sesiones de usuario, login/registro.
  - `timepicker.js`: Lógica del selector de hora personalizado visual.
  - `constants.js`: Constantes globales (nombres de tablas, claves localStorage).
  - `pdf-service.js`: Servicio de generación de reportes PDF usando jsPDF.
  - `pdf.js`: Controlador de la interfaz para la exportación a PDF.
  - `ui.js`: Sistema centralizado de notificaciones (Toasts) y renderizado de UI.
  - `events.js`: Manejador central de eventos del DOM.
  - `enhanced.js`: Mejoras visuales (animaciones, efectos).
- **`sql/`**: Scripts de configuración de base de datos.
  - `setup_empleados.sql`: Crea tabla de empleados y logs de auditoría.
  - `solucion_definitiva_rls.sql`: Configura seguridad para tabla empleados.
  - `setup_asistencias_rls.sql`: Configura seguridad para tabla asistencias.
  - `verificar_seguridad_completa.sql`: Script para verificar que RLS esté activo.
- **`assets/`**: Imágenes y recursos estáticos.

### Archivos Clave

- **`index.html`**: La interfaz de usuario principal. Contiene los modales (Login, Editor Excel) y la estructura del Dashboard.
- **`GUIA_PROYECTO.md`**: Este archivo. Documentación completa del proyecto.
- **`SEGURIDAD.md`**: Documentación detallada sobre el sistema de seguridad y RLS.

---

## 3. Funcionalidades Principales

### A. Autenticación y Seguridad 🔒

**Sistema multi-usuario con aislamiento completo de datos**:

- **Login/Registro**: Cada usuario tiene su propia cuenta protegida.
- **Separación de datos**: Cada usuario ve SOLO sus empleados y asistencias.
- **Row Level Security (RLS)**: Políticas a nivel de base de datos que garantizan seguridad.

**Flujo de seguridad**:

```
Usuario → Empleados (created_by) → Asistencias (empleado_id)
```

- Los empleados tienen un campo `created_by` que identifica al usuario creador.
- Las asistencias se vinculan a empleados mediante `empleado_id`.
- Las políticas RLS verifican automáticamente que solo accedas a TUS datos.

**Ver más**: [`SEGURIDAD.md`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/SEGURIDAD.md)

### B. Gestión de Empleados

- **Nube persistente**: Los empleados se guardan en Supabase con vínculo al usuario (`created_by`).
- **Sincronización**: Al iniciar sesión, se cargan automáticamente tus empleados.
- **Operaciones**: Crear, eliminar (marca como inactivo), listar.
- **Selección**: Casillas para seleccionar qué empleados incluir en el reporte actual.

### C. Editor de Asistencia (El "Corazón" de la App)

Al hacer clic en **"Abrir Editor Completo"**, se despliega un modal avanzado:

- **Vista Tabular**: Una pestaña por empleado seleccionado.
- **Edición Rápida**:
  - Inputs de fecha/hora (usan el TimePicker visual).
  - Selectores de estado (Presente, Ausente, Feriado, Permiso, Vacaciones, etc.).
  - Cálculo automático de **Almuerzo** (deducible) y **Horas Extras**.
- **Validaciones**: Si seleccionas "Feriado" o "Día Libre", las horas se bloquean automáticamente.
- **Guardado en Nube**: Botón "Guardar Progreso" para sincronizar con Supabase (upsert).

### D. Generación de Excel Profesional

Tu código en `js/excel.js` incluye un motor de estilizado avanzado ("Apple-like"):

- **Formato**: Encabezados corporativos, bordes, colores alternados por fila.
- **Fórmulas Reales**: El Excel exportado contiene fórmulas (`=SI(...)`, `=SUMA(...)`), no solo valores estáticos, permitiendo recalcular si se edita el archivo después.
- **Multi-hoja**: Una hoja por empleado seleccionado.
- **Footer**: Totales de horas trabajadas y extras al final de cada hoja.

### E. Visualización de Registros en la Nube

Sección "Ver Registros en Nube":

- **Filtros**: Por empleado, mes y año.
- **Vista tabular**: Muestra todos los registros guardados.
- **Descarga**: Exporta a Excel con formato profesional.
- **Eliminación**: Borrar registros de períodos específicos.

**Seguridad**: Solo ves registros de asistencias de TUS empleados, gracias a RLS.

### F. Generación de PDF Nativa 📄

Posibilidad de generar reportes individuales en formato PDF listos para firmar:

- **Diseño Profesional**: Encabezado con logo, tabla limpia y sección de firmas.
- **Generación Cliente**: Todo el proceso ocurre en el navegador (rápido y seguro).
- **Personalizable**: Opciones para incluir/excluir horas extras, motivos de ausencia, etc.

---

## 4. Flujo de Trabajo Típico

### Primera vez (Configuración)

1. **Abrir la aplicación**: Abre `index.html` en tu navegador (o el servidor local en puerto 8080).
2. **Crear cuenta**: Haz clic en "Crear Cuenta" y regístrate con email y contraseña.
3. **Agregar empleados**: En el panel izquierdo, agrega los nombres de tus empleados.

### Uso diario

1. **Iniciar sesión**: Si cerraste sesión, inicia nuevamente.

2. **Configuración del período**:

   - Seleccionar Mes y Año en el panel izquierdo.
   - Configurar "Hora Estándar" (ej: 9:00 AM) y "Hora Salida" (ej: 6:00 PM).

3. **Seleccionar empleados**: Marca las casillas de los empleados para incluir en el reporte.

4. **Edición de asistencias**:

   - Clic en **"Abrir Editor Completo"**.
   - Cambiar entre pestañas de empleados.
   - Llenar horas de entrada/salida para cada día.
   - Marcar faltas, permisos o vacaciones usando el selector de estado.
   - El sistema calcula automáticamente horas trabajadas y extras.

5. **Guardar progreso**:

   - **Opción A (Guardar en Nube)**: Clic en "Guardar Progreso en Nube" para sincronizar sin cerrar el editor.
   - **Opción B (Descargar Excel)**: Clic en "Descargar Excel" para generar el archivo `.xlsx` listo para enviar.

6. **Ver registros históricos** (Opcional):
   - Ve a la sección "Ver Registros en Nube".
   - Filtra por empleado/mes/año.
   - Descarga o elimina según necesites.

---

## 5. Arquitectura de la Base de Datos

### Tablas Principales

#### `empleados`

- `id` (BIGSERIAL): Identificador único
- `nombre` (TEXT): Nombre del empleado
- `activo` (BOOLEAN): Estado (activo/inactivo)
- `created_by` (UUID): Usuario que creó el empleado 🔒
- `created_at`, `updated_at`: Timestamps

**RLS**: ✅ Solo puedes ver/modificar empleados donde `created_by = tu_usuario_id`

#### `asistencias`

- `id` (BIGSERIAL): Identificador único
- `empleado_id` (BIGINT): Referencia a `empleados.id` 🔗
- `empleado_nombre` (TEXT): Nombre (redundante para queries rápidos)
- `fecha` (DATE): Fecha del registro
- `estado` (TEXT): Presente, Ausente, Permiso, etc.
- `hora_entrada`, `hora_salida` (TIME): Horarios en formato 24h
- `horas_trabajadas`, `horas_extra` (NUMERIC): Cálculos
- `observaciones` (TEXT): Notas
- `periodo` (TEXT): Ej. "Enero_2025"
- `created_at`, `updated_at`: Timestamps

**RLS**: ✅ Solo puedes ver/modificar asistencias de empleados creados por ti

**Índices**:

- `idx_asistencias_empleado_id`: Para filtrado rápido por empleado
- Unique constraint en `(empleado_id, fecha)` para evitar duplicados

#### `empleados_log`

- Tabla de auditoría que registra operaciones (CREAR, ELIMINAR) sobre empleados.

#### `historial_nominas`

- Almacena referencias a archivos PDF/Excel subidos al storage de Supabase.

---

## 6. Detalles Técnicos para Desarrolladores

### Estado Global

- Se usan variables globales como `empleados` y `feriados` para compartir estado entre módulos (un patrón común en Vanilla JS simple, aunque requiere cuidado).
- `datosAsistenciaExcel`: Array global que contiene los datos editados en el modal.

### Manejo de Tiempos

- `formatearHoraDesdeDB(hora24)`: Convierte "14:00:00" → "02:00 p. m."
- `convertirHoraAFormato24h(horaStr)`: Convierte "02:00 p. m." → "14:00:00"
- Estas funciones en `excel.js` son críticas para traducir entre el formato de la BD y el UI.

### Persistencia Local

- La app guarda preferencias (colores, último mes usado, empleados en localStorage si no hay conexión) usando `localStorage`.
- Función `cargarConfiguracion()` en `app.js` para persistencia entre recargas.

### Autenticación

- `inicializarAutenticacion()` en `auth.js` verifica sesión al cargar la página.
- Si no hay sesión, bloquea el contenido y muestra modal de login.
- `supabase.auth.getUser()` obtiene el usuario actual para filtrar datos.

### Sincronización

- `sincronizarEmpleadosConSupabase()` en `supabase.js` sincroniza empleados locales con la nube.
- Se ejecuta al iniciar sesión o al abrir el editor.

### Guardado de Asistencias

- Usa **upsert** (INSERT ON CONFLICT UPDATE) para evitar duplicados.
- El conflict key es `(empleado_id, fecha)`.
- Función `ejecutarGuardado()` en `excel.js`.

### Sistema de Notificaciones (`ui.js`)

- Reemplazo de `alert()` o toasts nativos antiguos por un sistema personalizado.
- `showToast(msg, type)`: Muestra notificaciones no intrusivas en la esquina inferior.
- Centro de notificaciones (campana) que agrupa historial reciente.

### Gestión de Eventos (`events.js`)

- Centralización de `addEventListener` para mantener el código organizado.
- Facilita el mantenimiento al tener todos los disparadores en un solo archivo.

---

## 7. Configuración de Seguridad (Primera vez)

Si es la primera vez que usas el proyecto, necesitas configurar las políticas RLS en Supabase:

### Scripts SQL a ejecutar (en orden):

1. **`setup_empleados.sql`**: Crea la tabla de empleados
2. **`solucion_definitiva_rls.sql`**: Configura RLS para empleados
3. **`setup_asistencias_rls.sql`**: Configura RLS para asistencias

### Cómo ejecutar:

1. Ve a [https://supabase.com](https://supabase.com) → Tu proyecto → SQL Editor
2. Copia el contenido de cada script
3. Pégalo en el editor y haz clic en "Run"

### Verificación:

- Ejecuta `verificar_seguridad_completa.sql` para confirmar que todo está bien.
- Deberías ver que ambas tablas (`empleados` y `asistencias`) tienen RLS ACTIVO con 4 políticas cada una.

**Ver guía detallada**: [`SEGURIDAD.md`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/SEGURIDAD.md)

---

## 8. Solución de Problemas Comunes

### "No veo mis empleados/asistencias"

**Posibles causas**:

1. No estás autenticado → Revisa que hayas iniciado sesión
2. Los datos no se guardaron → Verifica la conexión a internet
3. RLS bloqueando acceso → Verifica que ejecutaste los scripts SQL

**Solución**:

- Cierra sesión y vuelve a iniciar
- Revisa la consola del navegador (F12) para ver errores

### "Error al guardar en la nube"

**Posibles causas**:

1. Sesión expirada
2. Sin conexión a internet
3. RLS mal configurado

**Solución**:

- Verifica tu conexión
- Cierra sesión e inicia nuevamente
- Ejecuta `verificar_seguridad_completa.sql` en Supabase

### "Veo datos de otros usuarios"

**Causa**: RLS no está configurado correctamente

**Solución**: Ejecuta `setup_asistencias_rls.sql` y `solucion_definitiva_rls.sql` en Supabase

---

## 9. Mejoras de UX Implementadas 🎨

### Modal de Cierre de Sesión Moderno

**Actualización**: Diciembre 2024

- **Diseño limpio**: Eliminado el header rojo agresivo en favor de un diseño minimalista centrado
- **Iconografía amigable**: Icono circular con gradiente gris y animación de pulso sutil
- **Colores neutros**: Reemplazado el rojo alarmante por tonos grises profesionales (#374151)
- **Texto directo**: Cambio de "¿Estás seguro?" a "¿Cerrar sesión?" para ser más claro
- **Efectos hover**: Animaciones suaves con elevación en botones
- **Responsive**: Botones apilados en móvil (< 480px) con mejor accesibilidad táctil

**Archivos**: `index.html` (estructura), `css/modals.css` (estilos)

### Formulario de Login Refinado

**Mejoras implementadas**:

- **Tipografía optimizada**: Labels sin mayúsculas (más profesional), tamaños balanceados
- **Inputs mejorados**: Altura reducida a 64px, bordes visibles, sombras sutiles
- **Tabs elegantes**: Efecto hover en pestañas inactivas, transiciones suaves con cubic-bezier
- **Placeholders claros**: Cambio de `••••••••` a "Ingresa tu contraseña" (elimina confusión)
- **Botones refinados**: Tamaño 60px, efectos hover más sutiles y profesionales
- **Espaciado optimizado**: Mejor balance visual entre componentes

**Beneficios**:

- Menos intimidante para nuevos usuarios
- Mejor legibilidad y comprensión
- Experiencia más moderna y profesional
- Feedback visual claro en todas las interacciones

---

## 10. Próximos Pasos / Mejoras Futuras

- [ ] Agregar reportes de estadísticas (gráficas de asistencia)
- [ ] Notificaciones automáticas para ausencias
- [x] Exportar a PDF directamente (Implementado ✅)
- [ ] App móvil nativa
- [ ] Roles y permisos (admin, supervisor, empleado)

---

## 10. Recursos Adicionales

- **Documentación Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **SheetJS Documentation**: [https://docs.sheetjs.com/](https://docs.sheetjs.com/)
- **Guía de Seguridad**: [`SEGURIDAD.md`](file:///c:/Users/roman/Documents/Asistencia%20iShop/control-asistencia/SEGURIDAD.md)

---

**Última actualización**: Diciembre 2024  
**Versión**: 2.1 (Con mejoras de UX en modal de logout y formulario de login)
