//==> Start from deep
// app/review/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet, Modal, ScrollView, Dimensions
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { DatabaseService } from '../../src/services/DatabaseService';
import { ExportService } from '../../src/services/ExportService';
import { DataCaptureItem, ReportWidget } from '../../src/types';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

const { width } = Dimensions.get('window');

export default function ReviewScreen() {
  const [sources, setSources] = useState<DataCaptureItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [draggedItem, setDraggedItem] = useState<DataCaptureItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const db = DatabaseService.getInstance();
      const items = await db.fetchActiveItems();
      setSources(items);
    } catch (err) {
      Alert.alert('Error', 'Failed to load captured data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(sources.map(s => s.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const onDragStart = (item: DataCaptureItem) => {
    setDraggedItem(item);
  };

  const onDrop = (targetType: 'table' | 'chart') => {
    if (!draggedItem) return;
    if (targetType === 'chart' && draggedItem.type !== 'table') {
      Alert.alert('Invalid', 'Only table data can be visualized as chart');
      return;
    }
    let parsedContent;
    try { parsedContent = JSON.parse(draggedItem.content); } catch(e) { parsedContent = {}; }
    const newWidget: ReportWidget = {
      id: `WIDGET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sourceId: draggedItem.id,
      type: targetType,
      title: parsedContent.title || `Data from ${draggedItem.type}`,
      data: parsedContent,
    };
    setWidgets(prev => [...prev, newWidget]);
    setDraggedItem(null);
  };

  const renderSourceCard = ({ item }: { item: DataCaptureItem }) => {
    let preview = '';
    try {
      const parsed = JSON.parse(item.content);
      preview = parsed.title || parsed.text?.substring(0, 80) || 'No preview';
    } catch { preview = item.content.substring(0, 80); }
    return (
      <TouchableOpacity
        style={[styles.sourceCard, selectedIds.has(item.id) && styles.selectedCard]}
        onPress={() => toggleSelect(item.id)}
        onLongPress={() => onDragStart(item)}
        delayLongPress={200}
      >
        <Text style={styles.sourceType}>{item.type.toUpperCase()}</Text>
        <Text style={styles.sourcePreview}>{preview}</Text>
        <Text style={styles.sourceDate}>{new Date(item.createdAt).toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  const renderWidget = ({ item }: { item: ReportWidget }) => {
    if (item.type === 'table') {
      const data = item.data;
      if (!data.headers || !data.rows) return <Text>Invalid table data</Text>;
      return (
        <View style={styles.widgetContainer}>
          <Text style={styles.widgetTitle}>{item.title}</Text>
          <ScrollView horizontal>
            <View>
              <View style={styles.tableHeaderRow}>
                {data.headers.map((h: string, idx: number) => (
                  <Text key={idx} style={styles.tableHeaderCell}>{h}</Text>
                ))}
              </View>
              {data.rows.map((row: string[], rowIdx: number) => (
                <View key={rowIdx} style={styles.tableRow}>
                  {row.map((cell: string, cellIdx: number) => (
                    <Text key={cellIdx} style={styles.tableCell}>{cell}</Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    } else if (item.type === 'chart') {
      const data = item.data;
      if (!data.rows || data.rows.length === 0) return <Text>No chart data</Text>;
      const chartData = data.rows.map((row: any, idx: number) => ({
        x: row[0] || `Item ${idx+1}`,
        y: parseFloat(row[1]) || 0,
      }));
      return (
        <View style={styles.widgetContainer}>
          <Text style={styles.widgetTitle}>{item.title}</Text>
          <VictoryChart width={width - 40} theme={VictoryTheme.material}>
            <VictoryAxis label="Category" />
            <VictoryAxis dependentAxis label="Value" />
            <VictoryBar data={chartData} x="x" y="y" style={{ data: { fill: "#004ac6" } }} />
          </VictoryChart>
        </View>
      );
    }
    return null;
  };

  const handleDraftReview = () => {
    if (widgets.length === 0) {
      Alert.alert('No Widgets', 'Drag data from sources to the report area first.');
      return;
    }
    setShowDraftModal(true);
  };

  const generateReport = async (format: 'pdf' | 'excel' | 'pptx') => {
    setGenerating(true);
    setShowDraftModal(false);
    try {
      const exportService = new ExportService();
      const reportId = `report_${Date.now()}`;
      const reportData = widgets.map(w => ({ type: w.type, title: w.title, data: w.data }));
      const fileUri = await exportService.generateReport(reportId, reportData, format);
      await exportService.shareReport(fileUri, format);
      Alert.alert('Success', `Report generated as ${format.toUpperCase()}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.sourcesArea}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>📦 Captured Sources</Text>
          <TouchableOpacity onPress={selectAll}><Text>Select All</Text></TouchableOpacity>
          <TouchableOpacity onPress={clearSelection}><Text>Clear</Text></TouchableOpacity>
        </View>
        <FlatList
          data={sources}
          renderItem={renderSourceCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourceList}
        />
      </View>

      <View style={styles.dropZones}>
        <Text style={styles.sectionTitle}>⬇️ Drag & Drop to:</Text>
        <View style={styles.dropZoneRow}>
          <TouchableOpacity style={styles.dropZone} onPress={() => onDrop('table')}>
            <Text>📊 Table</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropZone} onPress={() => onDrop('chart')}>
            <Text>📈 Chart</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportArea}>
        <Text style={styles.sectionTitle}>📄 Report Builder</Text>
        <FlatList
          data={widgets}
          renderItem={renderWidget}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.widgetList}
          ListEmptyComponent={<Text style={styles.emptyText}>Drag items here</Text>}
        />
      </View>

      <TouchableOpacity style={styles.draftButton} onPress={handleDraftReview}>
        <Text style={styles.draftButtonText}>Review Draft & Generate</Text>
      </TouchableOpacity>

      {/* Draft Modal */}
      <Modal visible={showDraftModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Draft Review</Text>
            <ScrollView style={styles.draftList}>
              {widgets.map(w => (
                <View key={w.id} style={styles.draftItem}>
                  <Text style={styles.draftItemTitle}>{w.title}</Text>
                  <Text style={styles.draftItemType}>{w.type}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.formatLabel}>Select export format:</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity style={styles.formatBtnPdf} onPress={() => generateReport('pdf')}>
                <Text>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtnExcel} onPress={() => generateReport('excel')}>
                <Text>Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formatBtnPptx} onPress={() => generateReport('pptx')}>
                <Text>PowerPoint</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowDraftModal(false)} style={styles.closeModal}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {generating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#004ac6" />
          <Text>Generating report...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f5f5f5' },
  sourcesArea: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sourceList: { paddingRight: 16 },
  sourceCard: { backgroundColor: 'white', padding: 12, marginRight: 10, borderRadius: 8, width: 160, elevation: 2 },
  selectedCard: { backgroundColor: '#e0f0ff', borderWidth: 1, borderColor: '#004ac6' },
  sourceType: { fontWeight: 'bold', marginBottom: 4 },
  sourcePreview: { fontSize: 12, color: '#333' },
  sourceDate: { fontSize: 10, color: '#888', marginTop: 6 },
  dropZones: { marginBottom: 20 },
  dropZoneRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  dropZone: { backgroundColor: '#e0e0e0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  reportArea: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  widgetList: { paddingBottom: 20 },
  widgetContainer: { marginBottom: 20, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10 },
  widgetTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f0f0f0' },
  tableHeaderCell: { fontWeight: 'bold', padding: 8, borderWidth: 1, borderColor: '#ccc', minWidth: 100 },
  tableRow: { flexDirection: 'row' },
  tableCell: { padding: 8, borderWidth: 1, borderColor: '#ccc', minWidth: 100 },
  draftButton: { backgroundColor: '#004ac6', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  draftButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: 'white', width: '90%', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  draftList: { maxHeight: 200, marginBottom: 12 },
  draftItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 },
  draftItemTitle: { fontSize: 14 },
  draftItemType: { fontSize: 12, color: '#666' },
  formatLabel: { fontSize: 16, marginVertical: 12 },
  formatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  formatBtnPdf: { backgroundColor: '#ff6b6b', padding: 10, borderRadius: 8, width: '30%', alignItems: 'center' },
  formatBtnExcel: { backgroundColor: '#51cf66', padding: 10, borderRadius: 8, width: '30%', alignItems: 'center' },
  formatBtnPptx: { backgroundColor: '#ffa94d', padding: 10, borderRadius: 8, width: '30%', alignItems: 'center' },
  closeModal: { alignSelf: 'center', marginTop: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
});
// End from deep
/*
import React, { useState, useEffect } from 'react';
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
    Platform,
    Dimensions
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService, DataCaptureItem } from '../../src/services/DatabaseService';
import { ExportService, ReportWidget } from '../../src/services/ExportService';

const { width } = Dimensions.get('window');

interface SandboxWidget {
    id: string;
    sourceId: string;
    type: 'text' | 'table' | 'chart';
    title: string;
    data: any;
}

export default function ReviewScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const dbService = DatabaseService.getInstance();
    const exportService = new ExportService();

    // State
    const [detectedSources, setDetectedSources] = useState<DataCaptureItem[]>([]);
    const [reportWidgets, setReportWidgets] = useState<SandboxWidget[]>([]);
    const [activeTab, setActiveTab] = useState<'sources' | 'report'>('sources');
    const [isExporting, setIsExporting] = useState(false);
    const [exportedFile, setExportedFile] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Multi-select state
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());

    // Drag simulation visual state
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    // Draft review modal state
    const [draftFormat, setDraftFormat] = useState<'pdf' | 'excel' | 'pptx' | null>(null);

    // Fetch captured data on focus
    const loadActiveItems = async () => {
        setIsLoadingData(true);
        try {
            const items = await dbService.fetchActiveItems();
            setDetectedSources(items);
        } catch (error) {
            console.error('[REVIEW SCREEN] fetchActiveItems failed:', error);
            Alert.alert('Database Error', 'Could not load captured items.');
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        loadActiveItems();
        const unsubscribe = navigation.addListener('focus', () => {
            loadActiveItems();
        });
        return unsubscribe;
    }, [navigation]);

    // Helpers
    const parseContent = (contentString: string) => {
        try {
            return JSON.parse(contentString);
        } catch {
            return { text: contentString };
        }
    };

    // Card/Source selection
    const toggleSourceSelection = (id: string) => {
        setSelectedSourceIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkAdd = (widgetType: 'text' | 'table' | 'chart') => {
        if (selectedSourceIds.size === 0) return;

        const newWidgets: SandboxWidget[] = [];
        let duplicatesCount = 0;

        detectedSources.forEach((source) => {
            if (selectedSourceIds.has(source.id)) {
                // Ensure only tables/charts map to table/chart type
                if (widgetType === 'chart' && source.type !== 'table') {
                    return; // Skip mapping charts from non-tables
                }

                const parsed = parseContent(source.content);
                const exists = reportWidgets.some(w => w.sourceId === source.id && w.type === widgetType);
                if (exists) {
                    duplicatesCount++;
                    return;
                }

                newWidgets.push({
                    id: `WIDGET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    sourceId: source.id,
                    type: widgetType,
                    title: parsed.title || `Data Object (${source.id})`,
                    data: parsed
                });
            }
        });

        if (newWidgets.length > 0) {
            setReportWidgets([...reportWidgets, ...newWidgets]);
        }

        setSelectedSourceIds(new Set());
        Alert.alert(
            'Batch Action Success',
            `Successfully added ${newWidgets.length} widgets to report.${duplicatesCount > 0 ? ` (Skipped ${duplicatesCount} duplicates)` : ''}`
        );
    };

    // Actions
    const addWidget = (source: DataCaptureItem, widgetType: 'text' | 'table' | 'chart') => {
        const parsed = parseContent(source.content);
        
        const exists = reportWidgets.some(w => w.sourceId === source.id && w.type === widgetType);
        if (exists) {
            Alert.alert('Duplicate Widget', 'This data source is already mapped to a ' + widgetType + ' widget.');
            return;
        }

        const newWidget: SandboxWidget = {
            id: `WIDGET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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

    // Trigger Draft Review Modal first
    const handleTriggerExport = (format: 'pdf' | 'excel' | 'pptx') => {
        if (reportWidgets.length === 0) {
            Alert.alert('Empty Report', 'Please map at least one detected source to a widget first.');
            return;
        }
        setDraftFormat(format);
    };

    // Confirm Draft & Generate File
    const handleConfirmExport = async () => {
        const format = draftFormat;
        if (!format) return;

        setDraftFormat(null);
        setIsExporting(true);
        const reportId = `REP-${Date.now().toString().slice(-6)}`;

        try {
            // Map sandbox widgets to service widgets
            const serviceWidgets: ReportWidget[] = reportWidgets.map(w => ({
                type: w.type,
                title: w.title,
                data: w.data
            }));

            let fileUri = '';
            if (format === 'pdf') {
                fileUri = await exportService.generatePDF(reportId, serviceWidgets);
            } else if (format === 'excel') {
                fileUri = await exportService.generateExcel(reportId, serviceWidgets);
            } else {
                fileUri = await exportService.generatePPTX(reportId, serviceWidgets);
            }

            // Share native file sheet (Issues 9, 10, 13)
            try {
                await exportService.shareFile(fileUri);
            } catch (shareErr) {
                console.log('Sharing failed or cancelled:', shareErr);
            }

            setExportedFile(fileUri);
        } catch (e) {
            console.error('[EXPORT ERROR]:', e);
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
            {isLoadingData ? (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color="#004ac6" />
                    <Text style={styles.loadingDataText}>Fetching captured inputs...</Text>
                </View>
            ) : detectedSources.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>No captured data found</Text>
                    <Text style={styles.emptyDesc}>Go back and capture some data first via camera, file, or URL.</Text>
                    <TouchableOpacity style={styles.emptyGoBackBtn} onPress={() => router.back()}>
                        <Text style={styles.emptyGoBackBtnText}>GO BACK TO CAPTURE</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={[styles.scrollContainer, selectedSourceIds.size > 0 && { paddingBottom: 100 }]}>
                    {activeTab === 'sources' ? (
                        // Section 1: Raw Detected Data Sources
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Separated Data Inputs</Text>
                            <Text style={styles.sectionDesc}>
                                Select one or more cards to batch import, or add them individually:
                            </Text>

                            {detectedSources.map((source) => {
                                const parsed = parseContent(source.content);
                                const isSelected = selectedSourceIds.has(source.id);
                                return (
                                    <TouchableOpacity 
                                        key={source.id} 
                                        style={[styles.sourceCard, isSelected && styles.sourceCardSelected]}
                                        onPress={() => toggleSourceSelection(source.id)}
                                        activeOpacity={0.9}
                                    >
                                        {/* Card Header metadata */}
                                        <View style={styles.sourceHeader}>
                                            <View style={styles.leftHeaderRow}>
                                                {/* Checkbox */}
                                                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                                    {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                                                </View>
                                                <View style={styles.sourceIdContainer}>
                                                    <Text style={styles.sourceIdText}>{source.id}</Text>
                                                </View>
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
                                                    <Text style={styles.imagePreviewStubMeta}>{parsed.meta || 'Encrypted Image Resource'}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Layout Actions */}
                                        <View style={styles.actionRow} onStartShouldSetResponder={() => true} onSubmitEditing={(e) => e.stopPropagation()}>
                                            <Text style={styles.actionLabel}>Map to Report Widget:</Text>
                                            <View style={styles.actionButtons}>
                                                {source.type === 'text' && (
                                                    <TouchableOpacity 
                                                        style={styles.actionBtn}
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            addWidget(source, 'text');
                                                        }}
                                                    >
                                                        <Text style={styles.actionBtnText}>+ Text Block</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {source.type === 'table' && (
                                                    <>
                                                        <TouchableOpacity 
                                                            style={styles.actionBtn}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                addWidget(source, 'table');
                                                            }}
                                                        >
                                                            <Text style={styles.actionBtnText}>+ Table</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.actionBtn, styles.actionBtnChart]}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                addWidget(source, 'chart');
                                                            }}
                                                        >
                                                            <Text style={styles.actionBtnText}>+ Bar Chart</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                                {source.type === 'image' && (
                                                    <TouchableOpacity 
                                                        style={styles.actionBtn}
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            addWidget(source, 'text');
                                                        }}
                                                    >
                                                        <Text style={styles.actionBtnText}>+ Image Block</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        // Section 2: Sandbox Document Builder
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sandbox Document Layout</Text>
                            <Text style={styles.sectionDesc}>
                                Rearrange widgets (long-press triggers visual drag cue) or update titles:
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
                                reportWidgets.map((widget, index) => {
                                    const isBeingDragged = activeDragId === widget.id;
                                    return (
                                        <TouchableOpacity 
                                            key={widget.id} 
                                            activeOpacity={0.9}
                                            onLongPress={() => {
                                                setActiveDragId(widget.id);
                                            }}
                                            onPressOut={() => {
                                                setActiveDragId(null);
                                            }}
                                            style={[
                                                styles.widgetCard, 
                                                isBeingDragged && styles.widgetCardActiveDrag
                                            ]}
                                        >
                                            {/* Widget Header & Reorder Controls */}
                                            <View style={styles.widgetHeader}>
                                                <View style={styles.widgetInfo}>
                                                    <View style={styles.widgetMetaRow}>
                                                        <Text style={styles.dragIndicator}>⋮⋮ </Text>
                                                        <Text style={styles.widgetMetaText}>{widget.id} ({widget.sourceId})</Text>
                                                    </View>
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
                                                            {widget.data.text || widget.data.meta || 'Text Content'}
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
                                                                const val = parseFloat(row[2]?.replace(/[^0-9.]/g, '') || '0') || 0;
                                                                const heightPercent = Math.min((val / 100) * 100, 100);
                                                                return (
                                                                    <View key={idx} style={styles.barGroup}>
                                                                        <View style={styles.barTrack}>
                                                                            <View style={[styles.barFill, { height: `${heightPercent || 20}%` }]} />
                                                                        </View>
                                                                        <Text style={styles.barLabel}>{row[0]}</Text>
                                                                        <Text style={styles.barValText}>{row[2] || row[1]}</Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}

                            {/* Report Export Settings Panel */}
                            {reportWidgets.length > 0 && (
                                <View style={styles.exportPanel}>
                                    <Text style={styles.exportPanelTitle}>Compile & Export Report</Text>
                                    <Text style={styles.exportPanelDesc}>
                                        Generates highly structured files locally. Launches interactive draft verification before saving.
                                    </Text>
                                    <View style={styles.exportButtonGroup}>
                                        <TouchableOpacity 
                                            style={[styles.exportBtn, styles.pdfBtn]}
                                            onPress={() => handleTriggerExport('pdf')}
                                        >
                                            <Text style={styles.exportBtnText}>📄 PDF Document</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.exportBtn, styles.excelBtn]}
                                            onPress={() => handleTriggerExport('excel')}
                                        >
                                            <Text style={styles.exportBtnText}>📊 Excel Sheets</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.exportBtn, styles.pptxBtn]}
                                            onPress={() => handleTriggerExport('pptx')}
                                        >
                                            <Text style={styles.exportBtnText}>💻 PowerPoint Slides</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Floating Selection Bar for Multi-select */}
            {selectedSourceIds.size > 0 && activeTab === 'sources' && (
                <View style={styles.floatingActionBar}>
                    <View style={styles.floatingInfo}>
                        <Text style={styles.floatingCountText}>{selectedSourceIds.size} selected</Text>
                    </View>
                    <View style={styles.floatingActions}>
                        <TouchableOpacity style={styles.floatingActionBtn} onPress={() => handleBulkAdd('text')}>
                            <Text style={styles.floatingActionBtnText}>+ Text</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.floatingActionBtn} onPress={() => handleBulkAdd('table')}>
                            <Text style={styles.floatingActionBtnText}>+ Table</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.floatingActionBtn, { backgroundColor: '#565e74' }]} 
                            onPress={() => handleBulkAdd('chart')}
                        >
                            <Text style={styles.floatingActionBtnText}>+ Chart</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Draft Review Modal (Issue 8) */}
            <Modal transparent visible={draftFormat !== null} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.draftPreviewContainer}>
                        <View style={styles.draftHeader}>
                            <Text style={styles.draftHeaderTitle}>
                                {draftFormat?.toUpperCase()} Draft Preview
                            </Text>
                            <Text style={styles.draftHeaderSubtitle}>
                                Local verification check before finalizing artifact
                            </Text>
                        </View>

                        {/* Page Preview Content */}
                        <ScrollView style={styles.draftPreviewScroll} contentContainerStyle={styles.draftPreviewScrollContent}>
                            {draftFormat === 'pdf' && (
                                <View style={styles.pdfPageContainer}>
                                    <Text style={styles.pdfPageHeader}>DOCUMENT DRAFT REPORT</Text>
                                    <Text style={styles.pdfPageSub}>Generated Offline • {new Date().toLocaleDateString()}</Text>
                                    <View style={styles.pdfDivider} />

                                    {reportWidgets.map((widget, idx) => (
                                        <View key={widget.id} style={styles.pdfWidgetSection}>
                                            <Text style={styles.pdfWidgetTitle}>{idx + 1}. {widget.title}</Text>
                                            {widget.type === 'text' && (
                                                <Text style={styles.pdfWidgetText}>{widget.data.text || widget.data.meta}</Text>
                                            )}
                                            {widget.type === 'table' && (
                                                <View style={styles.pdfTableGrid}>
                                                    <View style={styles.pdfTableRowHeader}>
                                                        {widget.data.headers?.map((h: string, i: number) => (
                                                            <Text key={i} style={styles.pdfTableCellHeader}>{h}</Text>
                                                        ))}
                                                    </View>
                                                    {widget.data.rows?.map((row: string[], ri: number) => (
                                                        <View key={ri} style={styles.pdfTableRow}>
                                                            {row.map((cell, ci) => (
                                                                <Text key={ci} style={styles.pdfTableCell}>{cell}</Text>
                                                            ))}
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            {widget.type === 'chart' && (
                                                <View style={styles.pdfChartWrap}>
                                                    <Text style={styles.pdfChartHeader}>[Bar Chart: {widget.title}]</Text>
                                                    {widget.data.rows?.map((row: string[], ri: number) => (
                                                        <Text key={ri} style={styles.pdfChartRow}>
                                                            • {row[0]}: {row[2] || row[1]}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {draftFormat === 'excel' && (
                                <View style={styles.excelSheetContainer}>
                                    {/* Excel Headers A B C D */}
                                    <View style={styles.excelRowHeader}>
                                        <View style={styles.excelIndexCell}><Text style={styles.excelIndexCellText}></Text></View>
                                        {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                                            <View key={letter} style={styles.excelHeaderCell}>
                                                <Text style={styles.excelHeaderCellText}>{letter}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    
                                    {/* Excel Mock Rows */}
                                    {reportWidgets.map((widget, wIdx) => {
                                        const headers = widget.data.headers || ['Title', 'Data'];
                                        const rows = widget.data.rows || [[widget.title, widget.data.text || 'Text Content']];
                                        
                                        return (
                                            <View key={widget.id}>
                                                {/* Header in sheet */}
                                                <View style={styles.excelRow}>
                                                    <View style={styles.excelIndexCell}><Text style={styles.excelIndexCellText}>1</Text></View>
                                                    <View style={[styles.excelCell, { backgroundColor: '#e2e8f0' }]}><Text style={[styles.excelCellText, { fontWeight: 'bold' }]}>{widget.title}</Text></View>
                                                    <View style={styles.excelCell} />
                                                    <View style={styles.excelCell} />
                                                    <View style={styles.excelCell} />
                                                    <View style={styles.excelCell} />
                                                </View>
                                                
                                                {/* Table column headers */}
                                                <View style={styles.excelRow}>
                                                    <View style={styles.excelIndexCell}><Text style={styles.excelIndexCellText}>2</Text></View>
                                                    {headers.slice(0, 5).map((h: string, idx: number) => (
                                                        <View key={idx} style={[styles.excelCell, { backgroundColor: '#f1f5f9' }]}>
                                                            <Text style={[styles.excelCellText, { fontWeight: 'bold' }]}>{h}</Text>
                                                        </View>
                                                    ))}
                                                </View>

                                                {/* Data Rows */}
                                                {rows.slice(0, 4).map((row: string[], ri: number) => (
                                                    <View key={ri} style={styles.excelRow}>
                                                        <View style={styles.excelIndexCell}><Text style={styles.excelIndexCellText}>{ri + 3}</Text></View>
                                                        {row.slice(0, 5).map((cell, ci) => (
                                                            <View key={ci} style={styles.excelCell}>
                                                                <Text style={styles.excelCellText} numberOfLines={1}>{cell}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                ))}
                                                <View style={{ height: 16 }} />
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {draftFormat === 'pptx' && (
                                <View style={styles.pptxSlidesContainer}>
                                    {/* Slide 1: Title */}
                                    <View style={styles.pptxSlideCard}>
                                        <Text style={styles.pptxSlideNum}>Slide 1 (Title)</Text>
                                        <View style={styles.pptxSlideBodyCentered}>
                                            <Text style={styles.pptxSlideTitleText}>PROJECT PERFORMANCE DRAFT</Text>
                                            <Text style={styles.pptxSlideSubText}>Generated via Local DataCapture Suite</Text>
                                        </View>
                                    </View>

                                    {/* Slide 2+ for widgets */}
                                    {reportWidgets.map((widget, idx) => (
                                        <View key={widget.id} style={styles.pptxSlideCard}>
                                            <Text style={styles.pptxSlideNum}>Slide {idx + 2} ({widget.title})</Text>
                                            <View style={styles.pptxSlideBody}>
                                                <Text style={styles.pptxSlideWidgetTitle}>{widget.title}</Text>
                                                <Text style={styles.pptxSlideWidgetType}>Format: {widget.type.toUpperCase()}</Text>
                                                
                                                {widget.type === 'text' && (
                                                    <Text style={styles.pptxSlideContentText} numberOfLines={4}>
                                                        {widget.data.text || widget.data.meta}
                                                    </Text>
                                                )}
                                                {widget.type === 'table' && (
                                                    <Text style={styles.pptxSlideContentText}>
                                                        Contains Spreadsheet Dataset ({widget.data.rows?.length || 0} rows)
                                                    </Text>
                                                )}
                                                {widget.type === 'chart' && (
                                                    <Text style={styles.pptxSlideContentText}>
                                                        Contains Variance Projection Data Graph
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.draftActionRow}>
                            <TouchableOpacity 
                                style={styles.draftEditBtn}
                                onPress={() => setDraftFormat(null)}
                            >
                                <Text style={styles.draftEditBtnText}>Edit Draft</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.draftGenerateBtn}
                                onPress={handleConfirmExport}
                            >
                                <Text style={styles.draftGenerateBtnText}>Generate & Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                            The assets were parsed, cataloged, and saved in the SQLite database. A high fidelity copy was exported to local file storage and shared.
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
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingDataText: {
        marginTop: 12,
        color: '#5c647a',
        fontSize: 14,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191c1e',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 13,
        color: '#5c647a',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },
    emptyGoBackBtn: {
        backgroundColor: '#004ac6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    emptyGoBackBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
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
    sourceCardSelected: {
        borderColor: '#004ac6',
        backgroundColor: '#f8faff',
    },
    sourceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leftHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#c3c6d7',
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: '#004ac6',
        backgroundColor: '#004ac6',
    },
    checkboxCheck: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
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
    widgetCardActiveDrag: {
        borderColor: '#004ac6',
        backgroundColor: '#f8faff',
        transform: [{ scale: 1.02 }],
        shadowColor: '#004ac6',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
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
    widgetMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dragIndicator: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#c3c6d7',
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
        marginTop: 2,
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
    // Multi-select floating bar styles
    floatingActionBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#191c1e',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
        zIndex: 999,
    },
    floatingInfo: {
        flex: 1,
    },
    floatingCountText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    floatingActions: {
        flexDirection: 'row',
        gap: 8,
    },
    floatingActionBtn: {
        backgroundColor: '#004ac6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    floatingActionBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Draft Review Modal styles (Issue 8)
    draftPreviewContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        width: '100%',
        maxHeight: '85%',
        padding: 20,
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    draftHeader: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eceef0',
        paddingBottom: 12,
    },
    draftHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#191c1e',
    },
    draftHeaderSubtitle: {
        fontSize: 12,
        color: '#5c647a',
        marginTop: 2,
    },
    draftPreviewScroll: {
        marginVertical: 8,
        backgroundColor: '#eceef0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#c3c6d7',
    },
    draftPreviewScrollContent: {
        padding: 16,
    },
    // PDF Draft styles
    pdfPageContainer: {
        backgroundColor: '#ffffff',
        padding: 20,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        minHeight: 400,
    },
    pdfPageHeader: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
    },
    pdfPageSub: {
        fontSize: 9,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 2,
    },
    pdfDivider: {
        height: 1.5,
        backgroundColor: '#1e293b',
        marginVertical: 12,
    },
    pdfWidgetSection: {
        marginBottom: 18,
    },
    pdfWidgetTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 6,
    },
    pdfWidgetText: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 14,
    },
    pdfTableGrid: {
        borderWidth: 0.7,
        borderColor: '#475569',
    },
    pdfTableRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 0.7,
        borderBottomColor: '#475569',
        padding: 4,
    },
    pdfTableCellHeader: {
        flex: 1,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    pdfTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
        padding: 4,
    },
    pdfTableCell: {
        flex: 1,
        fontSize: 8,
        color: '#334155',
    },
    pdfChartWrap: {
        backgroundColor: '#f8fafc',
        padding: 8,
        borderWidth: 0.5,
        borderColor: '#94a3b8',
    },
    pdfChartHeader: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    pdfChartRow: {
        fontSize: 8,
        color: '#475569',
        marginVertical: 1,
    },
    // Excel Draft styles
    excelSheetContainer: {
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#cbd5e1',
    },
    excelRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    excelHeaderCell: {
        flex: 1,
        paddingVertical: 4,
        alignItems: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#cbd5e1',
    },
    excelHeaderCellText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
    },
    excelIndexCell: {
        width: 25,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
    },
    excelIndexCellText: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: '600',
    },
    excelRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    excelCell: {
        flex: 1,
        padding: 4,
        borderRightWidth: 0.5,
        borderRightColor: '#e2e8f0',
        justifyContent: 'center',
    },
    excelCellText: {
        fontSize: 8,
        color: '#334155',
    },
    // PPTX Draft styles
    pptxSlidesContainer: {
        gap: 16,
    },
    pptxSlideCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        aspectRatio: 1.77, // 16:9 widescreen slide!
        padding: 16,
        justifyContent: 'space-between',
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    pptxSlideNum: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: 'bold',
    },
    pptxSlideBodyCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pptxSlideTitleText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    pptxSlideSubText: {
        fontSize: 8,
        color: '#64748b',
        marginTop: 4,
    },
    pptxSlideBody: {
        flex: 1,
        marginTop: 8,
    },
    pptxSlideWidgetTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    pptxSlideWidgetType: {
        fontSize: 7,
        color: '#64748b',
        marginVertical: 2,
    },
    pptxSlideContentText: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 11,
        marginTop: 4,
    },
    // Draft Actions styles
    draftActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    draftEditBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#004ac6',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    draftEditBtnText: {
        color: '#004ac6',
        fontWeight: 'bold',
        fontSize: 13,
    },
    draftGenerateBtn: {
        flex: 1.5,
        backgroundColor: '#004ac6',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    draftGenerateBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    },
});
*/