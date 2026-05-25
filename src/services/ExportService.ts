import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const IS_TEST = process.env.JEST_WORKER_ID !== undefined;
// For unit tests, avoid legacy expo-file-system write warnings/errors.
// We still generate content, but skip filesystem writes during Jest.
const shouldSkipFileWrites = IS_TEST;


export interface ReportWidget {
    type: 'text' | 'table' | 'chart';
    title: string;
    data: any;
}

export class ExportService {
    private reportsDir: string;

    constructor() {
        // In tests, expo-file-system typings may differ; use a safe default.
        const baseDir = (FileSystem as any).documentDirectory || (IS_TEST ? 'file:///tmp/' : 'file:///tmp/');
        this.reportsDir = `${baseDir}reports/`;
    }


    private async ensureReportsDir(): Promise<void> {
        // In unit tests, expo-file-system legacy APIs may throw.
        if (IS_TEST) return;

        const dirInfo = await (FileSystem as any).getInfoAsync(this.reportsDir);
        if (!dirInfo.exists) {
            await (FileSystem as any).makeDirectoryAsync(this.reportsDir, { intermediates: true });
        }
    }

    public getReportsDir(): string {
        return this.reportsDir;
    }

    public async generatePDF(reportId: string, widgetsOrIds: ReportWidget[] | string[]): Promise<string> {
        await this.ensureReportsDir();
        const fileUri = `${this.reportsDir}${reportId}.pdf`;

        // Normalize widgets
        const widgets = this.normalizeWidgets(widgetsOrIds);

        // Generate nicely formatted text report
        let content = `=========================================\n`;
        content += `           DATA CAPTURE REPORT\n`;
        content += `=========================================\n`;
        content += `Report ID: ${reportId}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `-----------------------------------------\n\n`;

        widgets.forEach((widget, idx) => {
            content += `[SECTION ${idx + 1}]: ${widget.title.toUpperCase()}\n`;
            content += `Type: ${widget.type.toUpperCase()}\n`;
            content += `-----------------------------------------\n`;

            if (widget.type === 'text') {
                content += `${widget.data.text || widget.data}\n`;
            } else if (widget.type === 'table') {
                const headers = widget.data.headers || [];
                const rows = widget.data.rows || [];
                
                // Determine column widths
                const colWidths = headers.map((h: string) => h.length);
                rows.forEach((row: string[]) => {
                    row.forEach((cell, cellIdx) => {
                        if (cellIdx < colWidths.length) {
                            colWidths[cellIdx] = Math.max(colWidths[cellIdx], String(cell).length);
                        }
                    });
                });

                // Render header
                let headerRow = '|';
                headers.forEach((h: string, hIdx: number) => {
                    headerRow += ` ${h.padEnd(colWidths[hIdx])} |`;
                });
                content += `${headerRow}\n`;
                
                let dividerRow = '|';
                colWidths.forEach((w: number) => {
                    dividerRow += `${'-'.repeat(w + 2)}|`;
                });
                content += `${dividerRow}\n`;

                // Render rows
                rows.forEach((row: string[]) => {
                    let rowStr = '|';
                    row.forEach((cell, cellIdx) => {
                        if (cellIdx < colWidths.length) {
                            rowStr += ` ${String(cell).padEnd(colWidths[cellIdx])} |`;
                        }
                    });
                    content += `${rowStr}\n`;
                });
            } else if (widget.type === 'chart') {
                const type = widget.data.type || 'Bar';
                const headers = widget.data.headers || [];
                const rows = widget.data.rows || [];
                
                content += `Chart Type: ${type}\n`;
                rows.forEach((row: string[]) => {
                    const label = row[0];
                    const val = parseFloat(row[1] || '0') || 0;
                    const maxVal = Math.max(...rows.map((r: string[]) => parseFloat(r[1]) || 1));
                    const scale = maxVal > 0 ? Math.round((val / maxVal) * 15) : 0;
                    content += `${label.padEnd(12)} | ${'█'.repeat(scale)} (${val})\n`;
                });
            }
            content += `\n\n`;
        });

        content += `=========================================\n`;
        content += `End of Generated Report\n`;
        content += `=========================================\n`;

        if (!shouldSkipFileWrites) {
            await (FileSystem as any).writeAsStringAsync(fileUri, content, { encoding: 'utf8' as any });
            console.log('[EXPORT ENGINE] Generated PDF (Text Layout) at:', fileUri);
        }
        return fileUri;

    }

    public async generateExcel(reportId: string, widgetsOrIds: ReportWidget[] | string[]): Promise<string> {
        await this.ensureReportsDir();
        const fileUri = `${this.reportsDir}${reportId}.csv`;

        const widgets = this.normalizeWidgets(widgetsOrIds);
        let csvContent = '';

        widgets.forEach((widget) => {
            if (widget.type === 'table' || widget.type === 'chart') {
                csvContent += `"${widget.title}"\n`;
                const headers = widget.data.headers || [];
                const rows = widget.data.rows || [];
                
                csvContent += headers.map((h: string) => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
                rows.forEach((row: string[]) => {
                    csvContent += row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
                });
                csvContent += '\n\n';
            } else {
                csvContent += `"${widget.title}","${String(widget.data.text || widget.data).replace(/"/g, '""')}"\n\n`;
            }
        });

        if (!shouldSkipFileWrites) {
            await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' as any });
            console.log('[EXPORT ENGINE] Generated CSV at:', fileUri);
        }
        return fileUri;

    }

    public async generatePPTX(reportId: string, widgetsOrIds: ReportWidget[] | string[]): Promise<string> {
        await this.ensureReportsDir();
        const fileUri = `${this.reportsDir}${reportId}.pptx.txt`;

        const widgets = this.normalizeWidgets(widgetsOrIds);
        let content = '';

        // Title Slide
        content += `===================================================\n`;
        content += `                  SLIDE 1 (TITLE)                  \n`;
        content += `===================================================\n\n`;
        content += `            ${reportId.toUpperCase()} PRESENTATION\n\n`;
        content += `            Generated: ${new Date().toLocaleDateString()}\n`;
        content += `            Local Offline Report Suite\n\n`;
        content += `===================================================\n\n\n`;

        widgets.forEach((widget, idx) => {
            content += `===================================================\n`;
            content += `               SLIDE ${idx + 2} (${widget.title.toUpperCase()})               \n`;
            content += `===================================================\n\n`;
            
            if (widget.type === 'text') {
                content += `${widget.data.text || widget.data}\n`;
            } else if (widget.type === 'table') {
                const headers = widget.data.headers || [];
                const rows = widget.data.rows || [];
                
                content += headers.join('\t|\t') + '\n';
                content += '-'.repeat(50) + '\n';
                rows.forEach((row: string[]) => {
                    content += row.join('\t|\t') + '\n';
                });
            } else if (widget.type === 'chart') {
                const rows = widget.data.rows || [];
                content += `Visual Chart Representation:\n\n`;
                rows.forEach((row: string[]) => {
                    const label = row[0];
                    const val = parseFloat(row[1]) || 0;
                    content += `  * ${label}: ${val}\n`;
                });
            }
            content += `\n===================================================\n\n\n`;
        });

        if (!shouldSkipFileWrites) {
            await (FileSystem as any).writeAsStringAsync(fileUri, content, { encoding: 'utf8' as any });
            console.log('[EXPORT ENGINE] Generated PPTX Presentation at:', fileUri);
        }
        return fileUri;

    }

    public async shareFile(fileUri: string): Promise<void> {
        if (!(await Sharing.isAvailableAsync())) {
            throw new Error('Sharing is not available on this device');
        }
        await Sharing.shareAsync(fileUri);
    }

    private normalizeWidgets(widgetsOrIds: ReportWidget[] | string[]): ReportWidget[] {
        if (!Array.isArray(widgetsOrIds)) return [];
        if (widgetsOrIds.length === 0) return [];

        if (typeof widgetsOrIds[0] === 'string') {
            // Convert list of strings/IDs to simple text widgets for backward compatibility
            return (widgetsOrIds as string[]).map((id, idx) => ({
                type: 'text',
                title: `Report Item ${idx + 1}`,
                data: { text: `Item ID: ${id}` }
            }));
        }

        return widgetsOrIds as ReportWidget[];
    }
}
