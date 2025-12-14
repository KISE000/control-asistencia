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
        doc.rect(0, 0, 216, 20, 'F'); // Reduced to 20mm
        
        const rightMargin = 18; 

        // Logo
        if (data.logoData) {
            try {
                // White circle background for logo
                doc.setFillColor(...this.colors.white);
                doc.circle(22, 10, 6.5, 'F'); 
                doc.addImage(data.logoData, 'PNG', 17, 5.5, 9, 9, undefined, 'FAST');
            } catch (e) {
                console.warn('Error adding logo:', e);
            }
        }

        // Title
        doc.setFont(this.fonts.main, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...this.colors.white);
        doc.text('REPORTE DE ASISTENCIA', 216 - rightMargin, 10, { align: 'right' });

        // Subtitle (Period)
        doc.setFontSize(8);
        doc.setFont(this.fonts.main, 'normal');
        doc.setTextColor(240, 253, 244); 
        doc.text(data.period, 216 - rightMargin, 16, { align: 'right' });

        return 26; 
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
        doc.setFontSize(8);
        doc.setFont(this.fonts.main, 'normal');

        // Show actual employee and schedule data
        doc.text(data.employee.nombre, leftMargin, startY + 4);
        doc.text(`${data.startTime} - ${data.endTime}`, col2X, startY + 4);
        
        // Decorative line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(leftMargin, startY + 7, 216 - 18, startY + 7);

        return startY + 10;
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

        // Create blank rows for manual entry
        const blankRows = data.rows.map((row, index) => {
            const blankRow = {
                d: row.d,  // Keep day name
                f: row.f,  // Keep date number
                in: '',    // Blank check-in
                out: '',   // Blank check-out
                tot: '',   // Blank total
                fi: ''     // Blank firma
            };
            if (data.includeExtraHours) blankRow.ex = '';
            if (data.includeAbsenceReason) blankRow.mo = '';
            return blankRow;
        });
        
        doc.autoTable({
            startY: startY,
            columns: cols,
            body: blankRows,
            theme: 'striped',
            styles: {
                fontSize: 6.5,
                font: this.fonts.main,
                cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
                valign: 'middle',
                halign: 'center',
                textColor: this.colors.text,
                lineColor: [220, 220, 220], // Subtle light gray borders
                lineWidth: 0.15, // Very thin modern borders
                minCellHeight: 5.2 // Compact but writable
            },
            headStyles: {
                fillColor: [249, 250, 251], // Very subtle gray
                textColor: this.colors.primary,
                fontStyle: 'bold',
                fontSize: 7,
                halign: 'center',
                lineWidth: 0.2,
                lineColor: [200, 200, 200],
                cellPadding: 1.5
            },
            columnStyles: {
                d: { cellWidth: 13, fontStyle: 'bold', textColor: this.colors.secondary },
                f: { cellWidth: 12, textColor: this.colors.lightText },
                in: { cellWidth: 22 },
                out: { cellWidth: 22 },
                tot: { cellWidth: 13, fontStyle: 'bold' },
                ex: { cellWidth: 12, textColor: this.colors.accent },
                mo: { halign: 'left', cellWidth: 'auto' },
                fi: { cellWidth: 30 }
            },
            alternateRowStyles: {
                fillColor: [252, 252, 253] // Subtle zebra striping
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
            margin: { left: 18, right: 18, bottom: 38 }
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
        const cardH = 11;
        const cardsY = pageHeight - 36;
        
        const availableWidth = 216 - (margin * 2);
        const gap = 3;
        const cardW = (availableWidth - (gap * 3)) / 4;

        const drawCard = (index, label, value) => {
            const x = margin + (index * (cardW + gap));
            
            // Modern card with subtle border instead of fill
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, cardsY, cardW, cardH, 1.5, 1.5, 'S');
            
            doc.setFontSize(5.5);
            doc.setTextColor(...this.colors.lightText);
            doc.setFont(this.fonts.main, 'bold');
            doc.text(label.toUpperCase(), x + cardW / 2, cardsY + 3.5, { align: 'center' });
            
            doc.setFontSize(8);
            doc.setTextColor(...this.colors.primary);
            doc.setFont(this.fonts.main, 'normal');
            doc.text(value || '____', x + cardW / 2, cardsY + 8, { align: 'center' });
        };

        // Leave summary cards blank for manual entry
        drawCard(0, 'Días Lab.', '____');
        drawCard(1, 'Asistencias', '____');
        drawCard(2, 'Faltas', '____');
        drawCard(3, 'Extra (Hrs)', '____');

        // --- Signatures ---
        const firmaY = pageHeight - 18;
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.setFontSize(6);
        doc.setTextColor(...this.colors.text);

        // Employee
        doc.line(margin + 5, firmaY, margin + 65, firmaY);
        doc.text('FIRMA DEL EMPLEADO', margin + 35, firmaY + 3.5, { align: 'center' });

        // Supervisor
        if (data.includeApproval) {
            doc.line(216 - margin - 65, firmaY, 216 - margin - 5, firmaY);
            doc.text('FIRMA DEL SUPERVISOR', 216 - margin - 35, firmaY + 3.5, { align: 'center' });
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
