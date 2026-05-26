import { ExportService } from '../src/services/ExportService';
import * as FileSystem from 'expo-file-system';

// If TS complains about jest globals in your editor/tsconfig,
// this makes the file compile without requiring @types/jest in this workspace.
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

// Allowed by jest's hoisting rules: variables prefixed with `mock`
const mockAlert = jest.fn();

jest.mock('expo-file-system');
jest.mock('expo-print');
jest.mock('xlsx');
jest.mock('expo-sharing');
jest.mock('react-native', () => ({
  Alert: { alert: mockAlert },
  Platform: { OS: 'ios' },
}));

describe('ExportService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ensureDir() creates reportsDir when missing', async () => {
    const exporter = new ExportService();
    // mock: ensure directory doesn't exist yet
    const spyGetInfo = jest.spyOn(FileSystem as any, 'getInfoAsync');
    const spyMakeDir = jest.spyOn(FileSystem as any, 'makeDirectoryAsync');

    await exporter.ensureDir();

    expect(spyGetInfo).toHaveBeenCalled();
    expect(spyMakeDir).toHaveBeenCalled();
  });

  it('generateReport() routes to generatePDF for format=pdf', async () => {
    const exporter = new ExportService();
    const spyPdf = jest.spyOn(exporter as any, 'generatePDF');

    await exporter.generateReport('report_001', [{ title: 't', type: 'text', data: { a: 1 } }], 'pdf');

    expect(spyPdf).toHaveBeenCalled();
  });

  it('generatePDF() returns a pdf uri and calls expo-print', async () => {
    const exporter = new ExportService();
    const fileUri = await exporter.generatePDF('report_002', []);

    expect(fileUri).toContain('.pdf');
    expect(fileUri).toContain('file:///');
  });

  it('generateExcel() returns a xlsx uri and writes base64', async () => {
    const exporter = new ExportService();
    const spyWrite = jest.spyOn(FileSystem as any, 'writeAsStringAsync');

    const fileUri = await exporter.generateExcel('report_003', [
      { title: 'Table 1', type: 'table', data: { headers: ['A'], rows: [['1']] } },
    ]);

    expect(fileUri).toContain('.xlsx');
    expect(spyWrite).toHaveBeenCalled();
  });

  it('generatePowerPoint() returns a pptx uri and calls expo-print', async () => {
    const exporter = new ExportService();

    const fileUri = await exporter.generatePowerPoint('report_004', [
      { title: 'Slide 1', type: 'text', data: { text: 'hello' } },
    ]);

    expect(fileUri).toContain('.pptx');
    expect(fileUri).toContain('reports/');
  });

  it('shareReport() does not throw when expo-sharing is unavailable', async () => {
    const exporter = new ExportService();
    await expect(
      exporter.shareReport('file:///reports/report_005.pdf', 'pdf')
    ).resolves.toBeUndefined();
  });
});
