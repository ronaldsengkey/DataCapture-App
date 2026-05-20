import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    TextInput, 
    Alert, 
    ActivityIndicator,
    Modal,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService, DataCaptureItem } from '../../src/services/DatabaseService';
import { ExportService } from '../../src/services/ExportService';

// Pre-defined mock data simulating automatic classification after photo capture
const MOCK_DETECTED_ITEMS: DataCaptureItem[] = [
    {
        id: 'SRC-409A',
        type: 'text',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        content: JSON.stringify({
            title: 'Executive Summary',
            text: 'Regional revenue growth peaked in Q3 due to heightened demand for digital capture integrations, resulting in a +18.4% variance over the baseline projections.'
        })
    },
    {
        id: 'SRC-732B',
        type: 'table',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        content: JSON.stringify({
            title: 'Q3 Financial Performance',
            headers: ['Month', 'Target ($k)', 'Actual ($k)', 'Variance'],
            rows: [
                ['July', '120', '135', '+12.5%'],
                ['August', '140', '168', '+20.0%'],
                ['September', '150', '184', '+22.6%']
            ]
        })
    },
    {
        id: 'SRC-119C',
        type: 'image',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        content: JSON.stringify({
            title: 'Authorized Seal Stamp',
            url: 'https://placehold.co/150x150.png',
            meta: 'OCR signature check validated locally.'
        })
    }
];

interface ReportWidget {
    id: string;
    sourceId: string;
    type: 'text' | 'table' | 'chart';
    title: string;
    data: any;
}

export default function ReviewScreen() {
    const router = useRouter();
    const dbService = DatabaseService.getInstance();
    const exportService = new ExportService();

    // State
    const [detectedSources, setDetectedSources] = useState<DataCaptureItem[]>(MOCK_DETECTED_ITEMS);
    const [reportWidgets, setReportWidgets] = useState<ReportWidget[]>([]);
    const [activeTab, setActiveTab] = useState<'sources' | 'report'>('sources');
    const [isExporting, setIsExporting] = useState(false);
    const [exportedFile, setExportedFile] = useState<string | null>(null);

    // Helpers
    const parseContent = (contentString: string) => {
        try {
            return JSON.parse(contentString);
        } catch {
            return { text: contentString };
        }
    };

    // Actions
    const addWidget = (source: DataCaptureItem, widgetType: 'text' | 'table' | 'chart') => {
        const parsed = parseContent(source.content);
        
        // Prevent duplicate mapping of same source into same widget type to keep layout tidy
        const exists = reportWidgets.some(w => w.sourceId === source.id && w.type === widgetType);
        if (exists) {
            Alert.alert('Duplicate Widget', 'This data source is already mapped to a ' + widgetType + ' widget.');
            return;
        }

        const newWidget: ReportWidget = {
            id: `WIDGET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            sourceId: source.id,
            type: widgetType,
            title: parsed.title || `Data Object (${source.id})`,
            data: parsed
        };

        setReportWidgets([...reportWidgets, newWidget]);
        Alert.alert(
            'Added to Report', 
            `Mapped ${source.id} as a ${widgetType.toUpperCase()} widget in your draft report.`,
            [
                { text: 'Keep Selecting', style: 'cancel' },
                { text: 'View Report Draft', onPress: () => setActiveTab('report') }
            ]
        );
    };

    const removeWidget = (id: string) => {
        setReportWidgets(reportWidgets.filter(w => w.id !== id));
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= reportWidgets.length) return;

        const updated = [...reportWidgets];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;
        setReportWidgets(updated);
    };

    const handleExport = async (format: 'pdf' | 'excel' | 'pptx') => {
        if (reportWidgets.length === 0) {
            Alert.alert('Empty Report', 'Please map at least one detected source to a widget first.');
            return;
        }

        setIsExporting(true);
        const reportId = `REP-${Date.now().toString().slice(-6)}`;
        const sourceIds = reportWidgets.map(w => w.sourceId);

        try {
            // Save to SQLite
            for (const item of detectedSources) {
                await dbService.saveCapturedItem(item);
            }

            // Export to document
            let fileUri = '';
            if (format === 'pdf') {
                fileUri = await exportService.generatePDF(reportId, sourceIds);
            } else if (format === 'excel') {
                fileUri = await exportService.generateExcel(reportId, sourceIds);
            } else {
                fileUri = await exportService.generatePPTX(reportId, sourceIds);
            }

            setExportedFile(fileUri);
        } catch (e) {
            Alert.alert('Export Error', 'An error occurred while generating your report.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Screen Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Review & Structuring</Text>
                    <Text style={styles.headerSubtitle}>Auto-classification completed</Text>
                </View>
            </View>

            {/* Sub-navigation Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'sources' && styles.activeTabButton]}
                    onPress={() => setActiveTab('sources')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'sources' && styles.activeTabButtonText]}>
                        Detected Sources ({detectedSources.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, activeTab === 'report' && styles.activeTabButton]}
                    onPress={() => setActiveTab('report')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'report' && styles.activeTabButtonText]}>
                        Report Layout ({reportWidgets.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {activeTab === 'sources' ? (
                    // Section 1: Raw Detected Data Sources
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Automatically Separated Sources</Text>
                        <Text style={styles.sectionDesc}>
                            The camera has split your capture into distinct, addressable data inputs:
                        </Text>

                        {detectedSources.map((source) => {
                            const parsed = parseContent(source.content);
                            return (
                                <View key={source.id} style={styles.sourceCard}>
                                    {/* Card Header metadata */}
                                    <View style={styles.sourceHeader}>
                                        <View style={styles.sourceIdContainer}>
                                            <Text style={styles.sourceIdText}>{source.id}</Text>
                                        </View>
                                        <View style={[
                                            styles.typeBadge, 
                                            source.type === 'text' && styles.textBadge,
                                            source.type === 'table' && styles.tableBadge,
                                            source.type === 'image' && styles.imageBadge
                                        ]}>
                                            <Text style={styles.typeBadgeText}>
                                                {source.type.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Card Content Previews */}
                                    <View style={styles.sourceBody}>
                                        <Text style={styles.sourceTitleText}>{parsed.title}</Text>
                                        
                                        {source.type === 'text' && (
                                            <Text style={styles.bodyTextPreview}>{parsed.text}</Text>
                                        )}

                                        {source.type === 'table' && (
                                            <View style={styles.tablePreviewContainer}>
                                                <Text style={styles.bodyTextPreviewBold}>
                                                    Table: {parsed.rows?.length || 0} rows x {parsed.headers?.length || 0} cols
                                                </Text>
                                                <View style={styles.miniTable}>
                                                    <View style={styles.miniTableHeaderRow}>
                                                        {parsed.headers?.slice(0, 3).map((h: string, idx: number) => (
                                                            <Text key={idx} style={styles.miniTableHeaderCell}>{h}</Text>
                                                        ))}
                                                    </View>
                                                    {parsed.rows?.slice(0, 2).map((row: string[], rIdx: number) => (
                                                        <View key={rIdx} style={styles.miniTableRow}>
                                                            {row.slice(0, 3).map((cell, cIdx) => (
                                                                <Text key={cIdx} style={styles.miniTableCell}>{cell}</Text>
                                                            ))}
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {source.type === 'image' && (
                                            <View style={styles.imagePreviewStub}>
                                                <Text style={styles.imagePreviewStubText}>📷 [Cropped Target Area Stamp]</Text>
                                                <Text style={styles.imagePreviewStubMeta}>{parsed.meta}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Layout Actions */}
                                    <View style={styles.actionRow}>
                                        <Text style={styles.actionLabel}>Map to Report Widget:</Text>
                                        <View style={styles.actionButtons}>
                                            {source.type === 'text' && (
                                                <TouchableOpacity 
                                                    style={styles.actionBtn}
                                                    onPress={() => addWidget(source, 'text')}
                                                >
                                                    <Text style={styles.actionBtnText}>+ Text Block</Text>
                                                </TouchableOpacity>
                                            )}
                                            {source.type === 'table' && (
                                                <>
                                                    <TouchableOpacity 
                                                        style={styles.actionBtn}
                                                        onPress={() => addWidget(source, 'table')}
                                                    >
                                                        <Text style={styles.actionBtnText}>+ Table</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        style={[styles.actionBtn, styles.actionBtnChart]}
                                                        onPress={() => addWidget(source, 'chart')}
                                                    >
                                                        <Text style={styles.actionBtnText}>+ Bar Chart</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                            {source.type === 'image' && (
                                                <TouchableOpacity 
                                                    style={styles.actionBtn}
                                                    onPress={() => addWidget(source, 'text')}
                                                >
                                                    <Text style={styles.actionBtnText}>+ Image Block</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    // Section 2: Report Sandbox Builder (Drag/Drop Mocking & Reordering)
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sandbox Document Layout</Text>
                        <Text style={styles.sectionDesc}>
                            Arrange widgets and configure presentation formatting:
                        </Text>

                        {reportWidgets.length === 0 ? (
                            <View style={styles.emptySandbox}>
                                <Text style={styles.emptySandboxIcon}>✏️</Text>
                                <Text style={styles.emptySandboxTitle}>No widgets added</Text>
                                <Text style={styles.emptySandboxDesc}>
                                    Go to the "Detected Sources" tab to add text blocks, graphs, and spreadsheet tables.
                                </Text>
                            </View>
                        ) : (
                            reportWidgets.map((widget, index) => (
                                <View key={widget.id} style={styles.widgetCard}>
                                    {/* Widget Header & Reorder Controls */}
                                    <View style={styles.widgetHeader}>
                                        <View style={styles.widgetInfo}>
                                            <Text style={styles.widgetMetaText}>{widget.id} ({widget.sourceId})</Text>
                                            <TextInput 
                                                style={styles.widgetTitleInput} 
                                                value={widget.title}
                                                onChangeText={(text) => {
                                                    const updated = [...reportWidgets];
                                                    updated[index].title = text;
                                                    setReportWidgets(updated);
                                                }}
                                            />
                                        </View>
                                        
                                        <View style={styles.reorderControls}>
                                            <TouchableOpacity 
                                                style={[styles.reorderBtn, index === 0 && styles.disabledReorderBtn]}
                                                onPress={() => moveWidget(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <Text style={styles.reorderBtnText}>▲</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.reorderBtn, index === reportWidgets.length - 1 && styles.disabledReorderBtn]}
                                                onPress={() => moveWidget(index, 'down')}
                                                disabled={index === reportWidgets.length - 1}
                                            >
                                                <Text style={styles.reorderBtnText}>▼</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.reorderBtn, styles.deleteBtn]}
                                                onPress={() => removeWidget(widget.id)}
                                            >
                                                <Text style={styles.deleteBtnText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Widget Render Content */}
                                    <View style={styles.widgetBody}>
                                        {widget.type === 'text' && (
                                            <View style={styles.widgetTextContainer}>
                                                <Text style={styles.widgetTextBody}>
                                                    {widget.data.text || widget.data.meta}
                                                </Text>
                                            </View>
                                        )}

                                        {widget.type === 'table' && (
                                            <View style={styles.widgetTableContainer}>
                                                <View style={styles.fullTable}>
                                                    <View style={styles.tableHeaderRow}>
                                                        {widget.data.headers?.map((h: string, idx: number) => (
                                                            <Text key={idx} style={styles.tableHeaderCell}>{h}</Text>
                                                        ))}
                                                    </View>
                                                    {widget.data.rows?.map((row: string[], rIdx: number) => (
                                                        <View key={rIdx} style={styles.tableRow}>
                                                            {row.map((cell, cIdx) => (
                                                                <Text key={cIdx} style={styles.tableCell}>{cell}</Text>
                                                            ))}
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {widget.type === 'chart' && (
                                            <View style={styles.widgetChartContainer}>
                                                <Text style={styles.chartTitle}>Variance Projection Visualizer</Text>
                                                <View style={styles.barChartContainer}>
                                                    {widget.data.rows?.map((row: string[], idx: number) => {
                                                        // Parse value for bar height percentage
                                                        const val = parseFloat(row[2].replace(/[^0-9.]/g, ''));
                                                        const heightPercent = Math.min((val / 200) * 100, 100);
                                                        return (
                                                            <View key={idx} style={styles.barGroup}>
                                                                <View style={styles.barTrack}>
                                                                    <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
                                                                </View>
                                                                <Text style={styles.barLabel}>{row[0]}</Text>
                                                                <Text style={styles.barValText}>${row[2]}k</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}

                        {/* Report Export Settings Panel */}
                        {reportWidgets.length > 0 && (
                            <View style={styles.exportPanel}>
                                <Text style={styles.exportPanelTitle}>Export Configured Report</Text>
                                <Text style={styles.exportPanelDesc}>
                                    Select formatting framework to save to encrypted local database and generate artifact:
                                </Text>
                                <View style={styles.exportButtonGroup}>
                                    <TouchableOpacity 
                                        style={[styles.exportBtn, styles.pdfBtn]}
                                        onPress={() => handleExport('pdf')}
                                    >
                                        <Text style={styles.exportBtnText}>📄 PDF Document</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.exportBtn, styles.excelBtn]}
                                        onPress={() => handleExport('excel')}
                                    >
                                        <Text style={styles.exportBtnText}>📊 Excel Sheets</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.exportBtn, styles.pptxBtn]}
                                        onPress={() => handleExport('pptx')}
                                    >
                                        <Text style={styles.exportBtnText}>💻 PowerPoint</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Exporting Loading Overlay */}
            <Modal transparent visible={isExporting} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#004ac6" />
                        <Text style={styles.loadingText}>Compiling report layout...</Text>
                        <Text style={styles.loadingSubtext}>Writing records to encrypted SQLite DB</Text>
                    </View>
                </View>
            </Modal>

            {/* Export Success Modal */}
            <Modal transparent visible={exportedFile !== null} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.successBox}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Report Generated Successfully</Text>
                        <Text style={styles.successDesc}>
                            The assets were parsed, cataloged, and saved in SQLite database. A high fidelity copy was exported to local file storage.
                        </Text>
                        <View style={styles.pathBox}>
                            <Text style={styles.pathText} numberOfLines={2}>{exportedFile}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.closeSuccessBtn} 
                            onPress={() => {
                                setExportedFile(null);
                                router.replace('/');
                            }}
                        >
                            <Text style={styles.closeSuccessBtnText}>RETURN TO HOME HUB</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e3e5',
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eceef0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#004ac6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191c1e',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#5c647a',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e3e5',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#004ac6',
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5c647a',
    },
    activeTabButtonText: {
        color: '#004ac6',
    },
    scrollContainer: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#191c1e',
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 13,
        color: '#434655',
        marginBottom: 16,
        lineHeight: 18,
    },
    sourceCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#c3c6d7',
        padding: 16,
        marginBottom: 16,
        shadowColor: '#0f172a',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sourceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sourceIdContainer: {
        backgroundColor: '#eceef0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sourceIdText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
        color: '#191c1e',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    textBadge: {
        backgroundColor: '#dbe1ff',
    },
    tableBadge: {
        backgroundColor: '#dae2fd',
    },
    imageBadge: {
        backgroundColor: '#d3e4fe',
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#003ea8',
    },
    sourceBody: {
        marginBottom: 16,
    },
    sourceTitleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#191c1e',
        marginBottom: 6,
    },
    bodyTextPreview: {
        fontSize: 13,
        color: '#434655',
        lineHeight: 18,
    },
    bodyTextPreviewBold: {
        fontSize: 13,
        color: '#191c1e',
        fontWeight: '600',
        marginBottom: 6,
    },
    tablePreviewContainer: {
        backgroundColor: '#f7f9fb',
        padding: 8,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#c3c6d7',
    },
    miniTable: {
        width: '100%',
    },
    miniTableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#c3c6d7',
        paddingBottom: 4,
        marginBottom: 4,
    },
    miniTableHeaderCell: {
        flex: 1,
        fontSize: 10,
        fontWeight: '700',
        color: '#5c647a',
    },
    miniTableRow: {
        flexDirection: 'row',
        paddingVertical: 2,
    },
    miniTableCell: {
        flex: 1,
        fontSize: 10,
        color: '#434655',
    },
    imagePreviewStub: {
        backgroundColor: '#f2f4f6',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e3e5',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    imagePreviewStubText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#004ac6',
        marginBottom: 4,
    },
    imagePreviewStubMeta: {
        fontSize: 10,
        color: '#737686',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#eceef0',
        paddingTop: 12,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#5c647a',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        backgroundColor: '#004ac6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionBtnChart: {
        backgroundColor: '#565e74',
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    emptySandbox: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#c3c6d7',
        borderStyle: 'dashed',
        padding: 40,
        alignItems: 'center',
        marginTop: 20,
    },
    emptySandboxIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.6,
    },
    emptySandboxTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#191c1e',
        marginBottom: 6,
    },
    emptySandboxDesc: {
        fontSize: 13,
        color: '#5c647a',
        textAlign: 'center',
        lineHeight: 18,
    },
    widgetCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#737686',
        padding: 16,
        marginBottom: 16,
        position: 'relative',
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#eceef0',
        paddingBottom: 12,
        marginBottom: 12,
    },
    widgetInfo: {
        flex: 1,
        marginRight: 8,
    },
    widgetMetaText: {
        fontSize: 10,
        color: '#737686',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
        marginBottom: 4,
    },
    widgetTitleInput: {
        fontSize: 15,
        fontWeight: '700',
        color: '#191c1e',
        padding: 0,
    },
    reorderControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    reorderBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#eceef0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reorderBtnText: {
        fontSize: 10,
        color: '#004ac6',
    },
    disabledReorderBtn: {
        opacity: 0.3,
    },
    deleteBtn: {
        backgroundColor: '#ffdad6',
    },
    deleteBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ba1a1a',
    },
    widgetBody: {
        paddingVertical: 4,
    },
    widgetTextContainer: {
        backgroundColor: '#f7f9fb',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#004ac6',
    },
    widgetTextBody: {
        fontSize: 13,
        color: '#191c1e',
        lineHeight: 18,
    },
    widgetTableContainer: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e3e5',
        overflow: 'hidden',
    },
    fullTable: {
        width: '100%',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#eceef0',
        borderBottomWidth: 1,
        borderBottomColor: '#c3c6d7',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tableHeaderCell: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        color: '#191c1e',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e0e3e5',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tableCell: {
        flex: 1,
        fontSize: 11,
        color: '#434655',
    },
    widgetChartContainer: {
        backgroundColor: '#f7f9fb',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#c3c6d7',
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5c647a',
        marginBottom: 16,
        textAlign: 'center',
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 16,
    },
    barGroup: {
        alignItems: 'center',
        width: 60,
    },
    barTrack: {
        height: 80,
        width: 14,
        backgroundColor: '#eceef0',
        borderRadius: 7,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        backgroundColor: '#004ac6',
        borderRadius: 7,
    },
    barLabel: {
        fontSize: 10,
        color: '#5c647a',
        marginTop: 6,
        fontWeight: '600',
    },
    barValText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#004ac6',
        marginTop: 2,
    },
    exportPanel: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#004ac6',
        padding: 16,
        marginTop: 8,
        marginBottom: 32,
    },
    exportPanelTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#004ac6',
        marginBottom: 6,
    },
    exportPanelDesc: {
        fontSize: 12,
        color: '#434655',
        lineHeight: 16,
        marginBottom: 16,
    },
    exportButtonGroup: {
        flexDirection: 'column',
        gap: 8,
    },
    exportBtn: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    pdfBtn: {
        backgroundColor: '#004ac6',
    },
    excelBtn: {
        backgroundColor: '#565e74',
    },
    pptxBtn: {
        backgroundColor: '#46566c',
    },
    exportBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingBox: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 280,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#191c1e',
        marginTop: 16,
        marginBottom: 4,
    },
    loadingSubtext: {
        fontSize: 11,
        color: '#5c647a',
        textAlign: 'center',
    },
    successBox: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191c1e',
        marginBottom: 8,
        textAlign: 'center',
    },
    successDesc: {
        fontSize: 13,
        color: '#434655',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    pathBox: {
        backgroundColor: '#f7f9fb',
        borderWidth: 1,
        borderColor: '#e0e3e5',
        padding: 10,
        borderRadius: 8,
        width: '100%',
        marginBottom: 24,
    },
    pathText: {
        fontSize: 11,
        color: '#5c647a',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
        textAlign: 'center',
    },
    closeSuccessBtn: {
        backgroundColor: '#004ac6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    closeSuccessBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
