//==> Start from deep
// app/capture/url.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { DatabaseService } from '../../src/services/DatabaseService';
import { DataCaptureItem } from '../../src/types';

export default function URLCapture() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP/HTTPS URL');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      const db = DatabaseService.getInstance();
      let item: DataCaptureItem;

      if (contentType.includes('application/json') || url.endsWith('.json')) {
        const data = JSON.parse(rawText);
        if (Array.isArray(data) && data.length) {
          const headers = Object.keys(data[0]);
          const rows = data.map(obj => headers.map(h => String(obj[h] ?? '')));
          item = {
            id: `SRC-URL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'table',
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
            content: JSON.stringify({ title: 'JSON API Data', headers, rows, source_url: url }),
          };
        } else {
          item = {
            id: `SRC-URL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'text',
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
            content: JSON.stringify({ title: 'JSON Response', text: JSON.stringify(data, null, 2), source_url: url }),
          };
        }
      } 
      else if (contentType.includes('text/csv') || url.endsWith('.csv')) {
        const lines = rawText.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
        item = {
          id: `SRC-URL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'table',
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          content: JSON.stringify({ title: 'CSV from URL', headers, rows, source_url: url }),
        };
      }
      else {
        // HTML or plain text
        const textOnly = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
        item = {
          id: `SRC-URL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'text',
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          content: JSON.stringify({ title: 'Web Page Content', text: textOnly, source_url: url }),
        };
      }

      await db.saveCapturedItem(item);
      setLoading(false);
      Alert.alert('Success', 'Data extracted and saved', [
        { text: 'View Review', onPress: () => router.push('/review/') },
      ]);
    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch or parse URL');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter URL (HTTP/HTTPS)</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://example.com/data.csv"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleExtract} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Extracting...' : 'Extract Data'}</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#004ac6" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#004ac6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
//==> End from deep

/*
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService, DataCaptureItem } from '../../src/services/DatabaseService';

export default function UrlCapture() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{ title: string; rows: number; cols: number } | null>(null);
    const [extractedItems, setExtractedItems] = useState<DataCaptureItem[]>([]);

    const handleExtract = async () => {
        if (!url.trim()) {
            Alert.alert('No URL entered', 'Please enter a valid URL to extract data from.');
            return;
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            Alert.alert('Invalid URL', 'URL must start with http:// or https://');
            return;
        }

        setIsLoading(true);
        setPreviewData(null);
        setExtractedItems([]);

        try {
            const response = await fetch(url);
            const contentType = response.headers.get('content-type') || '';
            const rawText = await response.text();

            let rowsCount = 0;
            let colsCount = 0;
            let title = 'Extracted Dataset';
            let finalContent = '';
            let itemType: 'text' | 'table' = 'text';

            if (contentType.includes('application/json') || url.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(rawText);
                    if (Array.isArray(parsed)) {
                        rowsCount = parsed.length;
                        const headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
                        colsCount = headers.length;
                        const rows = parsed.map(obj => headers.map(h => String(obj[h] ?? '')));
                        itemType = 'table';
                        finalContent = JSON.stringify({
                            title: 'Web API Dataset (' + url.split('/').pop() + ')',
                            headers,
                            rows
                        });
                    } else {
                        rowsCount = 1;
                        colsCount = Object.keys(parsed).length;
                        finalContent = JSON.stringify({
                            title: 'Web API Single Object',
                            text: JSON.stringify(parsed, null, 2)
                        });
                    }
                } catch (e) {
                    rowsCount = rawText.split('\n').length;
                    colsCount = 1;
                    finalContent = JSON.stringify({
                        title: 'Plain Web Content',
                        text: rawText.slice(0, 500)
                    });
                }
            } else if (contentType.includes('text/csv') || url.endsWith('.csv')) {
                const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
                    rowsCount = dataRows.length;
                    colsCount = headers.length;
                    itemType = 'table';
                    finalContent = JSON.stringify({
                        title: 'Web CSV Dataset (' + url.split('/').pop() + ')',
                        headers,
                        rows: dataRows
                    });
                } else {
                    finalContent = JSON.stringify({ title: 'Empty CSV', headers: [], rows: [] });
                }
            } else {
                rowsCount = 1;
                colsCount = 1;
                finalContent = JSON.stringify({
                    title: 'HTML Text Layer Extract',
                    text: rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
                });
            }

            const item: DataCaptureItem = {
                id: `SRC-URL-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                type: itemType,
                createdAt: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                content: finalContent
            };

            setExtractedItems([item]);
            setPreviewData({ title: title, rows: rowsCount || 1, cols: colsCount || 1 });
        } catch (err) {
            console.warn('URL Extraction failed, falling back:', err);
            const mockItem: DataCaptureItem = {
                id: `SRC-URL-${Date.now().toString().slice(-4)}-MOCK`,
                type: 'table',
                createdAt: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                content: JSON.stringify({
                    title: 'Live Endpoint Data (' + url.split('/').pop() + ')',
                    headers: ['ID', 'Name', 'Email', 'Role'],
                    rows: [
                        ['1', 'Yohanes Ronald', 'ronald@example.com', 'Admin'],
                        ['2', 'Alice Smith', 'alice@example.com', 'Manager'],
                        ['3', 'Bob Johnson', 'bob@example.com', 'Developer']
                    ]
                })
            };
            setExtractedItems([mockItem]);
            setPreviewData({ title: 'Simulated Extracted Dataset (Offline Fallback)', rows: 3, cols: 4 });
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceed = async () => {
        if (extractedItems.length === 0) {
            Alert.alert('No data extracted', 'Please extract data from a URL first.');
            return;
        }

        try {
            const db = DatabaseService.getInstance();
            for (const item of extractedItems) {
                await db.saveCapturedItem(item);
            }
            router.push('/review/');
        } catch (error) {
            console.error('[URL PROCEED ERROR]:', error);
            Alert.alert('Save Error', 'Failed to save extracted data.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */
                /*}
               <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Grab from URL</Text>
                        <Text style={styles.headerSubtitle}>Extract structured data from endpoints</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* URL Input Section 
                    *//*}
                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Data Source URL</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.urlInput}
                                value={url}
                                onChangeText={setUrl}
                                placeholder="https://api.example.com/data"
                                placeholderTextColor="#737686"
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                returnKeyType="done"
                                onSubmitEditing={handleExtract}
                            />
                        </View>
                        <Text style={styles.inputHint}>Supports JSON APIs, CSV endpoints, and HTML tables.</Text>
                    </View>

                    {/* Quick URL Examples
                    *//*}
                    <View style={styles.examplesCard}>
                        <Text style={styles.examplesLabel}>Quick examples:</Text>
                        {[
                            'https://jsonplaceholder.typicode.com/users',
                            'https://api.publicapis.org/entries',
                        ].map((example) => (
                            <TouchableOpacity
                                key={example}
                                style={styles.examplePill}
                                onPress={() => setUrl(example)}
                            >
                                <Text style={styles.examplePillText} numberOfLines={1}>{example}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Extract Button 
                    *//*}
                    <TouchableOpacity
                        style={[styles.extractBtn, isLoading && styles.extractBtnDisabled]}
                        onPress={handleExtract}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.extractBtnText}>🔍  EXTRACT DATA</Text>
                        )}
                    </TouchableOpacity>

                    {/* Loading State
                    *//*}
                    {isLoading && (
                        <View style={styles.loadingCard}>
                            <Text style={styles.loadingTitle}>Fetching & Parsing...</Text>
                            <Text style={styles.loadingDesc}>Connecting to endpoint and extracting structured records. All data is processed locally.</Text>
                        </View>
                    )}

                    {/* Preview Result
                    *//*}
                    {previewData && !isLoading && (
                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <Text style={styles.previewIcon}>✅</Text>
                                <View>
                                    <Text style={styles.previewTitle}>Extraction Successful</Text>
                                    <Text style={styles.previewSubtitle}>{previewData.title}</Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{previewData.rows}</Text>
                                    <Text style={styles.statLabel}>Rows</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{previewData.cols}</Text>
                                    <Text style={styles.statLabel}>Columns</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>JSON</Text>
                                    <Text style={styles.statLabel}>Format</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                                <Text style={styles.proceedBtnText}>REVIEW & STRUCTURE DATA →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
    inputCard: {
        backgroundColor: '#ffffff', borderRadius: 12,
        borderWidth: 1, borderColor: '#c3c6d7', padding: 16,
    },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#434655', marginBottom: 8, letterSpacing: 0.5 },
    inputRow: {
        borderWidth: 1.5, borderColor: '#004ac6', borderRadius: 8,
        backgroundColor: '#f7f9fb', flexDirection: 'row', alignItems: 'center',
    },
    urlInput: { flex: 1, padding: 12, fontSize: 14, color: '#191c1e' },
    inputHint: { fontSize: 11, color: '#737686', marginTop: 8 },
    examplesCard: {
        backgroundColor: '#ffffff', borderRadius: 12,
        borderWidth: 1, borderColor: '#c3c6d7', padding: 16, gap: 8,
    },
    examplesLabel: { fontSize: 12, fontWeight: '600', color: '#5c647a', marginBottom: 4 },
    examplePill: {
        backgroundColor: '#eceef0', borderRadius: 8,
        paddingVertical: 8, paddingHorizontal: 12,
    },
    examplePillText: { fontSize: 11, color: '#004ac6', fontFamily: Platform.OS === 'web' ? 'monospace' : 'System' },
    extractBtn: {
        backgroundColor: '#004ac6', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
        shadowColor: '#004ac6', shadowOpacity: 0.2,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    extractBtnDisabled: { opacity: 0.6 },
    extractBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1.2 },
    loadingCard: {
        backgroundColor: '#dbe1ff', borderRadius: 12,
        borderWidth: 1, borderColor: '#b4c5ff', padding: 16,
    },
    loadingTitle: { fontSize: 14, fontWeight: '700', color: '#004ac6', marginBottom: 4 },
    loadingDesc: { fontSize: 12, color: '#003ea8', lineHeight: 18 },
    previewCard: {
        backgroundColor: '#ffffff', borderRadius: 12,
        borderWidth: 1.5, borderColor: '#004ac6', padding: 16,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    previewIcon: { fontSize: 32 },
    previewTitle: { fontSize: 16, fontWeight: '700', color: '#191c1e' },
    previewSubtitle: { fontSize: 12, color: '#5c647a' },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#f7f9fb', borderRadius: 8, padding: 16, marginBottom: 16,
    },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#004ac6' },
    statLabel: { fontSize: 11, color: '#5c647a', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#e0e3e5' },
    proceedBtn: {
        backgroundColor: '#004ac6', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    proceedBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});*/
