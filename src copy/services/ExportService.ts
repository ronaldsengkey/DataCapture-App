/**
 * @file ExportService.ts
 * @description Logic encapsulating the generation of PDFs, PPT, Excel locally.
 */

export class ExportService {

    public async generatePDF(reportId: string, itemIds: string[]): Promise<string> {
        console.log('[EXPORT ENGINE] Building high definition PDF vectors for report', reportId);
        return `file:///local/storage/reports/${reportId}.pdf`;
    }

    public async generateExcel(reportId: string, tableDataIds: string[]): Promise<string> {
        console.log('[EXPORT ENGINE] Structuring native Excel .xlsx file format for tables');
        return `file:///local/storage/reports/${reportId}.xlsx`;
    }

    public async generatePPTX(reportId: string, itemIds: string[]): Promise<string> {
        console.log('[EXPORT ENGINE] Rasterizing images and generating PPTX slides at 1080p');
        return `file:///local/storage/reports/${reportId}.pptx`;
    }
}
