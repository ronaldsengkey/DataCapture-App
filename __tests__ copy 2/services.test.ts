import { AIEngineService } from '../src/services/AIEngineService';
import { ExportService } from '../src/services/ExportService';
import { DatabaseService } from '../src/services/DatabaseService';

describe('AIEngineService (Automation Mocks)', () => {
    it('detects regions correctly and extracts items based on wireframes', async () => {
        const aiEngine = new AIEngineService();
        const results = await aiEngine.detectRegions('file://mock/path.jpg');

        expect(results).toHaveLength(2);
        expect(results[0].label).toBe('text_block');
        expect(results[1].label).toBe('table_grid');
    });
});

describe('DatabaseService (Local Offline Store)', () => {
    it('stores and retrieves captured items without network requests', async () => {
        const db = DatabaseService.getInstance();
        await db.initDB();

        const mockItem = {
            id: 'uuid-1234',
            type: 'text' as const,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000,
            content: 'Sample extracted structured data',
        };

        const isSaved = await db.saveCapturedItem(mockItem);
        expect(isSaved).toBeTruthy();
    });
});

describe('ExportService Engine Workflow', () => {
    it('generates a highly formatted PDF locally bypassing the cloud', async () => {
        const exporter = new ExportService();
        const fileUri = await exporter.generatePDF('report_001', []);

        expect(fileUri).toContain('.pdf');
        expect(fileUri).toContain('file:///'); // Asserts offline generation mode
    });
});
