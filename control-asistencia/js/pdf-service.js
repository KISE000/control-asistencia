/**
 * @typedef {Object} PDFColors
 * @property {number[]} primary
 * @property {number[]} secondary
 * @property {number[]} accent
 * @property {number[]} gray
 * @property {number[]} text
 * @property {number[]} lightText
 * @property {number[]} white
 * @property {number[]} success
 * @property {number[]} warning
 * @property {number[]} danger
 */

/**
 * @typedef {Object} PDFRowData
 * @property {string} d - Day name (e.g., "LUN")
 * @property {number} f - Day number
 * @property {string} in - Check-in time
 * @property {string} out - Check-out time
 * @property {string} tot - Total hours
 * @property {string} ex - Extra hours
 * @property {string} mo - Motive/Observation
 * @property {string} fi - Signature placeholder
 * @property {boolean} isGray - Whether to highlight the row
 * @property {boolean} isSunday - Whether the day is a Sunday
 */

/**
 * @typedef {Object} PDFReportData
 * @property {Object} employee
 * @property {string} employee.nombre
 * @property {string} period - e.g., "OCTUBRE 2023"
 * @property {string} startTime - e.g., "09:00 a.m."
 * @property {string} endTime - e.g., "06:00 p.m."
 * @property {boolean} includeExtraHours
 * @property {boolean} includeAbsenceReason
 * @property {boolean} includeApproval
 * @property {PDFRowData[]} rows
 * @property {Object} summary
 * @property {string} summary.daysWorked
 * @property {string} summary.attendances
 * @property {string} summary.absences
 * @property {string} summary.delays
 * @property {string} summary.totalExtra
 * @property {string|null} logoData - Base64 image data
 */

class PDFService {
    constructor() {
        if (!window.jspdf) {
            throw new Error("La librería jsPDF no está cargada.");
        }
        this.jsPDF = window.jspdf.jsPDF;
        
        /** @type {PDFColors} */
        this.colors = {
            primary: [16, 185, 129],   // Modern Emerald
            secondary: [51, 65, 85],   // Slate 700
            accent: [99, 102, 241],    // Indigo 500
            gray: [248, 250, 252],     // Slate 50
            text: [30, 41, 59],        // Slate 800
            lightText: [100, 116, 139],// Slate 500
            white: [255, 255, 255],
            success: [220, 252, 231],  // Green 100 (bg)
            warning: [254, 249, 195],  // Yellow 100 (bg)
            danger: [254, 226, 226]    // Red 100 (bg)
        };
        
        this.fonts = {
            main: 'helvetica'
        };
    }

    /**
     * Generates and downloads the PDF report for a single employee.
     * @param {PDFReportData} data 
     */
    generateClientReport(data) {
        const doc = new this.jsPDF('p', 'mm', 'letter');
        
        // Modern Design: Background Texture (Subtle)
        // We can't easily do a texture, but we can do a header fill.
        
        // 1. Header (Modern Banner)
        let currentY = this._renderHeader(doc, data);

        // 2. Info Grid (Clean Layout)
        currentY = this._renderInfoGrid(doc, currentY, data);

        // 3. Table (Modern Styling)
        currentY = this._renderTable(doc, currentY, data);

        // 4. Summary & Signatures
        this._renderFooterSection(doc, currentY, data);

        // 5. Page Footer (Metadata)
        this._renderPageMeta(doc);

        // Save
        const safeName = data.employee.nombre.replace(/[^a-z0-9]/gi, '_');
        doc.save(`Asistencia_${safeName}_${data.period.replace(' ', '_')}.pdf`);
    }

    /**
     * @private
     * @param {any} doc 
     * @param {PDFReportData} data 
     * @returns {number} Next Y position
     */
    /**
     * @private
     * @param {any} doc 
     * @param {PDFReportData} data 
     * @returns {number} Next Y position
     */
    _renderHeader(doc, data) {
        // Full width header background
        doc.setFillColor(...this.colors.primary);
        doc.rect(0, 0, 216, 25, 'F'); // Reduced to 25mm
        
        const rightMargin = 18; 

        // Logo
        if (data.logoData) {
            try {
                // White circle background for logo
                doc.setFillColor(...this.colors.white);
                doc.circle(24, 12.5, 8, 'F'); 
                doc.addImage(data.logoData, 'PNG', 18, 6.5, 12, 12, undefined, 'FAST');
            } catch (e) {
                console.warn('Error adding logo:', e);
            }
        }

        // Title
        doc.setFont(this.fonts.main, 'bold');
        doc.setFontSize(18); // Reduced size
        doc.setTextColor(...this.colors.white);
        doc.text('REPORTE DE ASISTENCIA', 216 - rightMargin, 12, { align: 'right' });

        // Subtitle (Period)
        doc.setFontSize(9);
        doc.setFont(this.fonts.main, 'normal');
        doc.setTextColor(240, 253, 244); 
        doc.text(data.period, 216 - rightMargin, 19, { align: 'right' });

        return 32; 
    }

    /**
     * @private
     * @param {any} doc 
     * @param {number} startY 
     * @param {PDFReportData} data 
     * @returns {number} Next Y position
     */
    _renderInfoGrid(doc, startY, data) {
        const leftMargin = 18;
        const col2X = 110;
        
        doc.setTextColor(...this.colors.lightText);
        doc.setFontSize(7);
        doc.setFont(this.fonts.main, 'bold');
        
        doc.text('EMPLEADO', leftMargin, startY);
        doc.text('HORARIO', col2X, startY);

        doc.setTextColor(...this.colors.text);
        doc.setFontSize(9);
        doc.setFont(this.fonts.main, 'normal');

        doc.text(data.employee.nombre, leftMargin, startY + 4);
        doc.text(`${data.startTime} - ${data.endTime}`, col2X, startY + 4);
        
        // Decorative line
        doc.setDrawColor(...this.colors.gray);
        doc.setLineWidth(0.5);
        doc.line(leftMargin, startY + 8, 216 - 18, startY + 8);

        return startY + 12; // Very compact
    }

    /**
     * @private
     * @param {any} doc 
     * @param {number} startY 
     * @param {PDFReportData} data 
     * @returns {number} Final Y position after table
     */
    _renderTable(doc, startY, data) {
        const cols = [
            { header: 'Día', dataKey: 'd' },
            { header: 'Fecha', dataKey: 'f' },
            { header: 'Entrada', dataKey: 'in' },
            { header: 'Salida', dataKey: 'out' },
            { header: 'Horas', dataKey: 'tot' }
        ];

        if (data.includeExtraHours) cols.push({ header: 'Extra', dataKey: 'ex' });
        if (data.includeAbsenceReason) cols.push({ header: 'Observación / Estado', dataKey: 'mo' });
        cols.push({ header: 'Firma', dataKey: 'fi' });

        if (typeof doc.autoTable !== 'function') {
            throw new Error("Plugin AutoTable no cargado");
        }

        doc.autoTable({
            startY: startY,
            columns: cols,
            body: data.rows,
            theme: 'plain', 
            styles: {
                fontSize: 7, // Small font to fit 31 days
                font: this.fonts.main,
                cellPadding: 1, // Minimize padding
                valign: 'middle',
                halign: 'center',
                textColor: this.colors.text,
                lineColor: [241, 245, 249],
                lineWidth: 0,
                minCellHeight: 5 // Force compact rows
            },
            headStyles: {
                fillColor: this.colors.white,
                textColor: this.colors.primary,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
                lineWidth: 0,
                cellPadding: 2 
            },
            columnStyles: {
                d: { cellWidth: 15, fontStyle: 'bold', textColor: this.colors.secondary },
                f: { cellWidth: 15, textColor: this.colors.lightText },
                in: { cellWidth: 25 },
                out: { cellWidth: 25 },
                tot: { cellWidth: 15, fontStyle: 'bold' },
                ex: { cellWidth: 15, textColor: this.colors.accent },
                mo: { halign: 'left', cellWidth: 'auto' },
                fi: { cellWidth: 35 }
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    if (data.row.index % 2 === 0) {
                        data.cell.styles.fillColor = [250, 250, 250]; 
                    }
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.dataKey === 'mo') {
                    const text = data.cell.raw || '';
                    if (text) {
                        let fillColor = this.colors.gray;
                        let textColor = this.colors.secondary;
                        
                        const lowerText = text.toLowerCase();
                        if (lowerText.includes('feriado') || lowerText.includes('domingo')) {
                            fillColor = this.colors.success;
                            textColor = [21, 128, 61]; 
                        } else if (lowerText.includes('falta')) {
                            fillColor = this.colors.danger;
                            textColor = [185, 28, 28]; 
                        } else if (lowerText.includes('tardanza') || lowerText.includes('permiso')) {
                            fillColor = this.colors.warning;
                            textColor = [161, 98, 7]; 
                        }

                        const { x, y, width, height } = data.cell;
                        doc.setFillColor(...fillColor);
                        doc.roundedRect(x + 1, y + 1, width - 2, height - 2, 1, 1, 'F');
                        
                        doc.setFontSize(6.5);
                        doc.setTextColor(...textColor);
                        doc.text(text, x + 2, y + height / 2 + 1);
                        
                        return false; 
                    }
                }
            },
            margin: { left: 18, right: 18, bottom: 40 } // Reserve space for footer!
        });

        return doc.lastAutoTable.finalY + 5; 
    }

    /**
     * @private
     * @param {any} doc 
     * @param {number} startY 
     * @param {PDFReportData} data 
     */
    _renderFooterSection(doc, startY, data) {
        const pageHeight = doc.internal.pageSize.height;
        const margin = 18;
        
        // --- Summary Cards ---
        // Compact Cards
        const cardH = 12; // Reduced height
        const cardsY = pageHeight - 50; // Move up slightly
        
        const availableWidth = 216 - (margin * 2);
        const gap = 4;
        const cardW = (availableWidth - (gap * 3)) / 4;

        const drawCard = (index, label, value) => {
            const x = margin + (index * (cardW + gap));
            
            doc.setFillColor(...this.colors.gray);
            doc.roundedRect(x, cardsY, cardW, cardH, 2, 2, 'F');
            
            doc.setFontSize(6);
            doc.setTextColor(...this.colors.lightText);
            doc.setFont(this.fonts.main, 'bold');
            doc.text(label.toUpperCase(), x + cardW / 2, cardsY + 4, { align: 'center' });
            
            doc.setFontSize(9);
            doc.setTextColor(...this.colors.primary);
            doc.setFont(this.fonts.main, 'normal');
            doc.text(value || '-', x + cardW / 2, cardsY + 9, { align: 'center' });
        };

        drawCard(0, 'Días Lab.', data.summary.daysWorked);
        drawCard(1, 'Asistencias', data.summary.attendances);
        drawCard(2, 'Faltas', data.summary.absences);
        drawCard(3, 'Extra (Hrs)', data.summary.totalExtra);

        // --- Signatures ---
        const firmaY = pageHeight - 22; // Lower down
        
        doc.setDrawColor(...this.colors.lightText);
        doc.setLineWidth(0.2);
        doc.setFontSize(7);
        doc.setTextColor(...this.colors.text);

        // Employee
        doc.line(margin + 10, firmaY, margin + 70, firmaY);
        doc.text('FIRMA DEL EMPLEADO', margin + 40, firmaY + 4, { align: 'center' });

        // Supervisor
        if (data.includeApproval) {
            doc.line(216 - margin - 70, firmaY, 216 - margin - 10, firmaY);
            doc.text('FIRMA DEL SUPERVISOR', 216 - margin - 40, firmaY + 4, { align: 'center' });
        }
    }

    /**
     * @private
     * @param {any} doc 
     */
    _renderPageMeta(doc) {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(6);
        doc.setTextColor(...this.colors.lightText);
        doc.text(`Generado el ${new Date().toLocaleDateString()}`, 108, pageHeight - 8, { align: 'center' });
    }
}
