import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type SupportedFormat = 'csv' | 'json' | 'pdf';

interface ParsedFileResult {
    name: string;
    format: SupportedFormat;
    rows: number;
    sizeKb: number;
}

const FORMAT_INFO: Record<SupportedFormat, { icon: string; color: string; bg: string }> = {
    csv:  { icon: '📊', color: '#004ac6', bg: '#dbe1ff' },
    json: { icon: '📋', color: '#46566c', bg: '#d3e4fe' },
    pdf:  { icon: '📄', color: '#ba1a1a', bg: '#ffdad6' },
};

const MOCK_FILES: ParsedFileResult[] = [
    { name: 'Q3_FinancialReport.csv', format: 'csv', rows: 312, sizeKb: 48 },
    { name: 'product_inventory.json', format: 'json', rows: 88, sizeKb: 22 },
    { name: 'executive_summary.pdf', format: 'pdf', rows: 14, sizeKb: 540 },
];

export default function FileCapture() {
    const router = useRouter();
    const [isPickerLoading, setIsPickerLoading] = useState(false);
    const [pickedFiles, setPickedFiles] = useState<ParsedFileResult[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleBrowseFiles = () => {
        setIsPickerLoading(true);
        // Simulate file picker & local parsing
        setTimeout(() => {
            setPickedFiles(MOCK_FILES);
            setIsPickerLoading(false);
        }, 1500);
    };

    const toggleFileSelection = (name: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleProceed = () => {
        if (selectedIds.size === 0) {
            Alert.alert('No files selected', 'Please select at least one file to continue.');
            return;
        }
        router.push('/review/');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Upload File</Text>
                    <Text style={styles.headerSubtitle}>Parse local CSV, JSON, or PDF datasets</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Drop Zone / Browse Area */}
                <TouchableOpacity
                    style={[styles.dropZone, isPickerLoading && styles.dropZoneActive]}
                    onPress={handleBrowseFiles}
                    activeOpacity={0.7}
                    disabled={isPickerLoading}
                >
                    {isPickerLoading ? (
                        <>
                            <ActivityIndicator size="large" color="#004ac6" />
                            <Text style={styles.dropZoneText}>Scanning and parsing files...</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.dropZoneIcon}>📂</Text>
                            <Text style={styles.dropZoneTitle}>Tap to Browse Files</Text>
                            <Text style={styles.dropZoneText}>CSV · JSON · PDF</Text>
                            <View style={styles.browseBtn}>
                                <Text style={styles.browseBtnText}>BROWSE LOCAL STORAGE</Text>
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                {/* Supported Formats Info */}
                {pickedFiles.length === 0 && !isPickerLoading && (
                    <View style={styles.formatsCard}>
                        <Text style={styles.formatsTitle}>Supported File Formats</Text>
                        {[
                            { fmt: 'CSV', desc: 'Comma-separated values — best for tabular data and spreadsheets.' },
                            { fmt: 'JSON', desc: 'Structured API payloads, arrays, and nested data objects.' },
                            { fmt: 'PDF', desc: 'Text extraction from native text-layer PDFs.' },
                        ].map(({ fmt, desc }) => (
                            <View key={fmt} style={styles.formatRow}>
                                <Text style={styles.formatBadge}>{fmt}</Text>
                                <Text style={styles.formatDesc}>{desc}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Parsed File Results */}
                {pickedFiles.length > 0 && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.resultsTitle}>Select Files to Import</Text>
                        {pickedFiles.map((file) => {
                            const isSelected = selectedIds.has(file.name);
                            const fmt = FORMAT_INFO[file.format];
                            return (
                                <TouchableOpacity
                                    key={file.name}
                                    style={[styles.fileCard, isSelected && styles.fileCardSelected]}
                                    onPress={() => toggleFileSelection(file.name)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.fileIconBox, { backgroundColor: fmt.bg }]}>
                                        <Text style={styles.fileIcon}>{fmt.icon}</Text>
                                    </View>
                                    <View style={styles.fileInfo}>
                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                        <Text style={styles.fileMeta}>
                                            {file.rows} records · {file.sizeKb} KB · {file.format.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Proceed Button */}
                        <TouchableOpacity
                            style={[styles.proceedBtn, selectedIds.size === 0 && styles.proceedBtnDisabled]}
                            onPress={handleProceed}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.proceedBtnText}>
                                IMPORT SELECTED ({selectedIds.size}) →
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f9fb' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16,
        backgroundColor: '#ffffff', borderBottomWidth: 1,
        borderBottomColor: '#e0e3e5', gap: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#eceef0', alignItems: 'center', justifyContent: 'center',
    },
    backBtnText: { fontSize: 20, fontWeight: 'bold', color: '#004ac6' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#191c1e' },
    headerSubtitle: { fontSize: 12, color: '#5c647a' },
    scrollContent: { padding: 16, gap: 16 },
    dropZone: {
        backgroundColor: '#ffffff', borderRadius: 16,
        borderWidth: 2, borderColor: '#c3c6d7', borderStyle: 'dashed',
        padding: 40, alignItems: 'center', gap: 8,
    },
    dropZoneActive: { borderColor: '#004ac6', backgroundColor: '#f0f4ff' },
    dropZoneIcon: { fontSize: 48, marginBottom: 8 },
    dropZoneTitle: { fontSize: 17, fontWeight: '700', color: '#191c1e' },
    dropZoneText: { fontSize: 13, color: '#5c647a' },
    browseBtn: {
        marginTop: 12, backgroundColor: '#004ac6',
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
    },
    browseBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    formatsCard: {
        backgroundColor: '#ffffff', borderRadius: 12,
        borderWidth: 1, borderColor: '#c3c6d7', padding: 16, gap: 12,
    },
    formatsTitle: { fontSize: 13, fontWeight: '700', color: '#191c1e', marginBottom: 4 },
    formatRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    formatBadge: {
        backgroundColor: '#eceef0', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 2,
        fontSize: 11, fontWeight: '800', color: '#434655',
        minWidth: 44, textAlign: 'center',
    },
    formatDesc: { flex: 1, fontSize: 12, color: '#5c647a', lineHeight: 18 },
    resultsSection: { gap: 12 },
    resultsTitle: { fontSize: 14, fontWeight: '700', color: '#191c1e' },
    fileCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#ffffff', borderRadius: 12,
        borderWidth: 1, borderColor: '#c3c6d7', padding: 12, gap: 12,
    },
    fileCardSelected: { borderColor: '#004ac6', backgroundColor: '#f0f4ff' },
    fileIconBox: {
        width: 44, height: 44, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    fileIcon: { fontSize: 20 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '600', color: '#191c1e' },
    fileMeta: { fontSize: 11, color: '#737686', marginTop: 2 },
    checkbox: {
        width: 24, height: 24, borderRadius: 6,
        borderWidth: 2, borderColor: '#c3c6d7',
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxSelected: { backgroundColor: '#004ac6', borderColor: '#004ac6' },
    checkmark: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
    proceedBtn: {
        backgroundColor: '#004ac6', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
        marginTop: 8,
        shadowColor: '#004ac6', shadowOpacity: 0.2,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    proceedBtnDisabled: { backgroundColor: '#c3c6d7' },
    proceedBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
});
