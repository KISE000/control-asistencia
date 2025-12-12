const ExcelTheme = {
    // Paleta de Colores "Executive Teal" (Profesional y Moderno)
    colors: {
        headerBg: "0F766E",      // Teal 700 - Fondo Corporativo Elegante
        headerText: "FFFFFF",    // Blanco
        
        // Bloques Info
        infoLabelBg: "F0FDFA",   // Teal 50 - Fondo muy muy suave
        infoText: "134E4A",      // Teal 900 - Texto oscuro
        borderColor: "99F6E4",   // Teal 200 - Bordes sutiles
        
        // Estados
        successBg: "DCFCE7",     // Green 100
        successText: "14532D",   // Green 900
        warningBg: "FFEDD5",     // Orange 100
        warningText: "7C2D12",   // Orange 900
        errorBg: "FEE2E2",       // Red 100
        errorText: "7F1D1D",     // Red 900
    },

    // Estilos de Componentes
    styles: {
        // Título Principal (A1) - Sólido e impactante
        mainTitle: {
            font: { bold: true, sz: 20, color: { rgb: "FFFFFF" }, name: "Calibri" },
            fill: { fgColor: { rgb: "0F766E" } }, // Teal 700
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                bottom: { style: "medium", color: { rgb: "115E59" } } // Teal 800
            }
        },

        // Bloque Info: Etiqueta (Col A) - Diferenciada
        infoLabel: {
            font: { bold: true, sz: 11, color: { rgb: "134E4A" }, name: "Calibri" }, 
            fill: { fgColor: { rgb: "CCFBF1" } }, // Teal 100
            alignment: { horizontal: "right", vertical: "center", indent: 1 },
            border: {
                top: { style: "thin", color: { rgb: "5EEAD4" } }, // Teal 300
                bottom: { style: "thin", color: { rgb: "5EEAD4" } },
                left: { style: "medium", color: { rgb: "0F766E" } }, // Borde Izq Grueso marca la sección
                right: { style: "thin", color: { rgb: "5EEAD4" } }
            }
        },

        // Bloque Info: Valor (Cols B-H)
        infoValue: {
            font: { bold: false, sz: 11, color: { rgb: "0F172A" }, name: "Calibri" },
            fill: { fgColor: { rgb: "F0FDFA" } }, // Teal 50 (Casi blanco)
            alignment: { horizontal: "left", vertical: "center", indent: 1 },
            border: {
                top: { style: "thin", color: { rgb: "5EEAD4" } },
                bottom: { style: "thin", color: { rgb: "5EEAD4" } },
                right: { style: "thin", color: { rgb: "5EEAD4" } }
            }
        },

        // Encabezados de Tabla
        tableHeader: {
            fill: { fgColor: { rgb: "0D9488" } }, // Teal 600 - Un poco más claro que el título
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                left: { style: "thin", color: { rgb: "FFFFFF" } },
                right: { style: "thin", color: { rgb: "FFFFFF" } }
            }
        },

        // Celda Base
        cellBase: {
            font: { color: { rgb: "334155" }, sz: 11, name: "Calibri" },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
                bottom: { style: "thin", color: { rgb: "CBD5E1" } },
                right: { style: "dotted", color: { rgb: "E2E8F0" } }
            }
        },

        // Fila de Totales - Footer Importante
        totals: {
            fill: { fgColor: { rgb: "115E59" } }, // Teal 800 - Base sólida oscura
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
            alignment: { horizontal: "center", vertical: "center" },
            border: { 
                top: { style: "medium", color: { rgb: "FFFFFF" } } // Separación blanca
            }
        },
        
        // Colores de estado
        status: {
            feriado: { fill: { fgColor: { rgb: "FFEDD5" } }, font: { color: { rgb: "9A3412" } } },
            ausente: { fill: { fgColor: { rgb: "FEE2E2" } }, font: { color: { rgb: "991B1B" } } },
            presente: { fill: { fgColor: { rgb: "FFFFFF" } }, font: { color: { rgb: "334155" } } }
        },

        // Fila Alternativa
        altRow: { 
            fgColor: { rgb: "F0F9FF" } // Sky 50 - Muy suave azulito para alternancia
        }
    }
};
