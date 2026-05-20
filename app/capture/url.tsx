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

// NOTE:
// NativeWind's Babel/PostCSS pipeline (used during Expo/Metro bundling)
// can choke on certain async PostCSS plugin behavior. If bundling fails with
// errors related to PostCSS async plugins, temporarily disabling NativeWind
// for this screen (via `nativewind/babel` configuration) or avoiding CSS-in-JS
// patterns can unblock the build.
//
// This comment is informational; it does not change runtime behavior.
export default function UrlCapture() {

    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{ title: string; rows: number; cols: number } | null>(null);

    const handleExtract = () => {
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

        // Simulate network fetch & data extraction
        setTimeout(() => {
            setIsLoading(false);
            setPreviewData({ title: 'Extracted Dataset', rows: 24, cols: 6 });
        }, 2000);
    };

    const handleProceed = () => {
        router.push('/review/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
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
                    {/* URL Input Section */}
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

                    {/* Quick URL Examples */}
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

                    {/* Extract Button */}
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

                    {/* Loading State */}
                    {isLoading && (
                        <View style={styles.loadingCard}>
                            <Text style={styles.loadingTitle}>Fetching & Parsing...</Text>
                            <Text style={styles.loadingDesc}>Connecting to endpoint and extracting structured records. All data is processed locally.</Text>
                        </View>
                    )}

                    {/* Preview Result */}
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
});
