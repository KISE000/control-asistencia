# Guía Completa del Proyecto: Control de Asistencia PRO

Esta guía proporciona una visión detallada de tu aplicación **Control de Asistencia PRO**, diseñada para gestionar la asistencia de empleados, generar reportes profesionales en Excel y sincronizar datos con la nube mediante Supabase.

---

## 1. Visión General del Proyecto

**Objetivo**: Facilitar la gestión de nóminas y asistencia, permitiendo editar registros diarios, calcular horas trabajadas/extras automáticamente y exportar reportes con formato corporativo.

**Tecnologías Principales**:

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend / Nube**: Supabase (Base de datos PostgreSQL, Autenticación, Almacenamiento de Archivos).
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
  - `excel-theme.css`: Posiblemente estilos específicos para la vista previa.
- **`js/`**: Lógica de la aplicación.
  - `app.js`: Punto de entrada. Inicializa la app, configura fechas y maneja empleados locales.
  - `supabase.js`: Maneja **toda** la comunicación con la nube (Login, Guardar Asistencia, Historial de Archivos).
  - `excel.js`: El módulo más complejo. Maneja el **Editor Modal**, cálculos de horas y la generación del archivo `.xlsx` estético.
  - `auth.js`: Gestión de sesiones de usuario.
  - `timepicker.js`: Lógica del selector de hora personalizado visual.
- **`assets/`**: Imágenes y recursos estáticos.

### Archivos Clave

- **`index.html`**: La interfaz de usuario principal. Contiene los modales (Login, Editor Excel) y la estructura del Dashboard.

---

## 3. Funcionalidades Principales

### A. Gestión de Empleados

- **Local y Nube**: Puedes agregar empleados. Si estás logueado, se guardan en Supabase; si no, en `localStorage`.
- **Selección**: Casillas para seleccionar qué empleados incluir en el reporte actual.

### B. Editor de Asistencia (El "Corazón" de la App)

Al hacer clic en **"Abrir Editor Completo"**, se despliega un modal avanzado:

- **Vista Tabular**: Una pestaña por empleado seleccionado.
- **Edición Rápida**:
  - Inputs de fecha/hora (usan el TimePicker visual).
  - Selectores de estado (Presente, Ausente, Feriado, etc.).
  - Cálculo automático de **Almuerzo** (deducible) y **Horas Extras**.
- **Validaciones**: Si seleccionas "Feriado", las horas se bloquean.

### C. Generación de Excel Profesional

Tu código en `js/excel.js` incluye un motor de estilizado avanzado ("Apple-like"):

- **Formato**: Encabezados corporativos, bordes, colores alternados.
- **Fórmulas Reales**: El Excel exportado contiene fórmulas (`=SI(...)`), no solo valores estáticos, permitiendo recalcular si se edita el archivo después.
- **Footer**: Totales de horas y extras al final de la hoja.

### D. Nube (Supabase)

- **Autenticación**: Login y Registro de usuarios.
- **Persistencia**: Botón "Guardar Progreso en Nube" para salvar el trabajo actual sin descargar archivo.
- **Historial**: Visualización de archivos subidos anteriormente ("Historial de Nóminas").

---

## 4. Flujo de Trabajo Típico

1.  **Configuración Inicial**:

    - Abrir `index.html`.
    - Seleccionar Mes y Año en el panel izquierdo.
    - Configurar "Hora Estándar" y "Hora Salida".

2.  **Selección de Personal**:

    - Agregar empleados nuevos o seleccionar los existentes en la lista.

3.  **Edición de Datos**:

    - Clic en **"Abrir Editor Completo"**.
    - Llenar las horas de entrada/salida para cada día.
    - Marcar faltas, permisos o vacaciones.
    - El sistema calcula automáticamente horas trabajadas y extras.

4.  **Finalización**:
    - **Opción A (Backup)**: Clic en "Guardar Progreso en Nube".
    - **Opción B (Entrega)**: Clic en "Descargar Excel". Se genera un archivo `.xlsx` listo para enviar a contabilidad/RRHH.

---

## 5. Detalles Técnicos para Desarrolladores

- **Estado Global**: Se usan variables globales como `empleados` y `feriados` para compartir estado entre módulos (un patrón común en Vanilla JS simple, aunque requiere cuidado).
- **Manejo de Tiempos**: Funciones como `formatearHoraDesdeDB` y `convertirHoraAFormato24h` en `excel.js` son críticas para traducir entre el formato de la BD (`HH:mm:ss`) y el UI (`hh:mm a.m.`).
- **Configuración**: La app guarda preferencias (colores, último mes usado) en `localStorage` (`cargarConfiguracion` en `app.js`) para persistencia entre recargas.
