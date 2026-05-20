import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeHub() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>

            {/* Top App Bar */}
            <View style={styles.appBar}>
                <View style={styles.appBarLeft}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.iconTextPrimary}>☰</Text>
                    </TouchableOpacity>
                    <Text style={styles.appTitle}>DataCapture</Text>
                </View>
                <TouchableOpacity style={styles.iconButtonRight}>
                    <Text style={styles.iconTextSecondary}>⏱️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Context Header */}
                <View style={styles.contextHeader}>
                    <Text style={styles.smallIcon}>🕒</Text>
                    <Text style={styles.monoText}>Last capture: 3 items, 10 min ago</Text>
                </View>

                {/* Capture Methods Grid */}
                <View style={styles.grid}>
                    {/* Camera Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/camera')}
                        style={styles.card}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardIconBox}>
                            <Text style={styles.cardIcon}>📷</Text>
                        </View>
                        <Text style={styles.cardTitle}>Capture using Camera</Text>
                        <Text style={styles.cardSubtitle}>Scan documents, receipts, or objects for OCR and analysis.</Text>
                    </TouchableOpacity>

                    {/* URL Extract Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/url')}
                        style={styles.card}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardIconBox}>
                            <Text style={styles.cardIcon}>🔗</Text>
                        </View>
                        <Text style={styles.cardTitle}>Grab from URL</Text>
                        <Text style={styles.cardSubtitle}>Extract structured data arrays from web endpoints or pages.</Text>
                    </TouchableOpacity>

                    {/* Extract from File Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/file')}
                        style={styles.card}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardIconBox}>
                            <Text style={styles.cardIcon}>📂</Text>
                        </View>
                        <Text style={styles.cardTitle}>Upload File</Text>
                        <Text style={styles.cardSubtitle}>Parse and ingest local datasets (CSV, JSON, PDF).</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fb',
    },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 64,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e3e5',
    },
    appBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 999,
    },
    iconButtonRight: {
        padding: 8,
        marginRight: -8,
        borderRadius: 999,
    },
    iconTextPrimary: {
        color: '#004ac6',
        fontSize: 20,
        fontWeight: 'bold',
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#004ac6',
        letterSpacing: -0.5,
    },
    iconTextSecondary: {
        color: '#5c647a',
        fontSize: 20,
    },
    scrollContent: {
        padding: 16,
        gap: 24,
    },
    contextHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#c3c6d7',
        borderRadius: 8,
        padding: 8,
        alignSelf: 'flex-start',
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    smallIcon: {
        color: '#5c647a',
    },
    monoText: {
        fontFamily: process.env.EXPO_OS === 'web' ? 'monospace' : 'System',
        fontSize: 14,
        color: '#5c647a',
    },
    grid: {
        flexDirection: 'column',
        gap: 16,
    },
    card: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 24,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#c3c6d7',
        borderRadius: 12,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#dae2fd',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardIcon: {
        color: '#004ac6',
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#191c1e',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#434655',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 64,
        height: 64,
        backgroundColor: '#004ac6',
        borderRadius: 24,
        shadowColor: '#0f172a',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
    },
    fabText: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '300',
        marginTop: -4,
    }
});
