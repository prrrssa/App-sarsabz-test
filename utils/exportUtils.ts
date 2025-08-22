
import React from 'react';
import * as jsPDFNs from 'jspdf';
import * as autoTableNs from 'jspdf-autotable';
import { Column } from '../components/common/Table';

// Workaround for esm.sh module resolution issues with default exports from certain libraries.
const jsPDF = (jsPDFNs as any).default;
const autoTable = (autoTableNs as any).default;

const getTextFromReactNode = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (node === null || node === undefined) return '';
    if (Array.isArray(node)) return node.map(getTextFromReactNode).join('');
    if (React.isValidElement(node) && (node.props as any).children) {
        return getTextFromReactNode((node.props as any).children);
    }
    return '';
};

const getRowValue = (accessor: any, row: any): string => {
    let value;
    if (typeof accessor === 'function') {
        const result = accessor(row);
        value = getTextFromReactNode(result);
    } else {
        value = row[accessor];
    }
    
    const valueStr = String(value ?? '').replace(/"/g, '""');
    return `"${valueStr}"`;
};

export const exportToCsv = (filename: string, columns: Column<any>[], data: any[]) => {
    const header = columns.map(c => `"${c.header}"`).join(',');
    const rows = data.map(row => 
        columns.map(col => getRowValue(col.accessor, row)).join(',')
    ).join('\n');

    const csvContent = `\uFEFF${header}\n${rows}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const FONT_FILE_NAME = 'Vazirmatn-Variable.woff2';
let vazirFontPromise: Promise<ArrayBuffer | null> | null = null;
const getVazirFont = (): Promise<ArrayBuffer | null> => {
    if (!vazirFontPromise) {
        vazirFontPromise = fetch(`https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/variable/${FONT_FILE_NAME}`)
            .then(response => {
                if (!response.ok) {
                    console.error(`Font fetch failed with status: ${response.status}`);
                    throw new Error('Font fetch failed');
                }
                return response.arrayBuffer();
            })
            .catch(e => {
                console.error("Could not load Vazirmatn font for PDF export.", e);
                vazirFontPromise = null; 
                return null;
            });
    }
    return vazirFontPromise;
}

const preparePdfDoc = async () => {
    const fontBuffer = await getVazirFont();
    if (!fontBuffer) {
        alert("فونت مورد نیاز برای ساخت PDF بارگذاری نشد. لطفاً اتصال اینترنت خود را بررسی کنید.");
        return null;
    }

    const doc = new jsPDF();
    
    const fontBytes = new Uint8Array(fontBuffer);
    let binary = '';
    for (let i = 0; i < fontBytes.byteLength; i++) {
        binary += String.fromCharCode(fontBytes[i]);
    }
    const base64Font = btoa(binary);

    doc.addFileToVFS(FONT_FILE_NAME, base64Font);
    doc.addFont(FONT_FILE_NAME, 'Vazirmatn', 'normal');
    doc.setFont('Vazirmatn');
    return doc;
}

export const exportToPdf = async (filename: string, title: string, columns: Column<any>[], data: any[]) => {
    const doc = await preparePdfDoc();
    if (!doc) return;

    doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    const head = [columns.map(c => c.header)];
    const body = data.map(row => 
        columns.map(col => getTextFromReactNode(typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor as keyof typeof row]))
    );

    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
        styles: { font: 'Vazirmatn', halign: 'right', cellPadding: 2, fontSize: 8 },
        headStyles: { halign: 'right', fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' }, // Updated to primary-600
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: (data: any) => { data.cell.styles.halign = 'right'; }
    });

    doc.save(`${filename}.pdf`);
};

interface PdfTable {
    title: string;
    columns: string[];
    data: any[][];
}

export const exportMultipleTablesToPdf = async (filename: string, mainTitle: string, tables: PdfTable[]) => {
     const doc = await preparePdfDoc();
    if (!doc) return;

    doc.text(mainTitle, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    let currentY = 25;

    for (const table of tables) {
        if(currentY > 250) {
            doc.addPage();
            currentY = 20;
        }
        doc.text(table.title, doc.internal.pageSize.getWidth() - 14, currentY, { align: 'right' });
        currentY += 7;

        autoTable(doc, {
            head: [table.columns],
            body: table.data,
            startY: currentY,
            styles: { font: 'Vazirmatn', halign: 'right', cellPadding: 2, fontSize: 8 },
            headStyles: { halign: 'right', fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' }, // Updated to primary-600
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didParseCell: (data: any) => { data.cell.styles.halign = 'right'; }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }
    
    doc.save(`${filename}.pdf`);
};
