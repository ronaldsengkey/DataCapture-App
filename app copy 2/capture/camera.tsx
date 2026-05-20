import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';

export default function CameraCapture() {
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const cameraRef = useRef<any>(null);
    const router = useRouter();

    if (!permission) {
        return (
            <View style={styles.permissionContainer}>
                <ActivityIndicator size="large" color="#004ac6" />
                <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.iconContainer}>
                    <Text style={styles.permissionIcon}>📷</Text>
                </View>
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionText}>
                    We need your permission to access the camera for capturing and analyzing document data.
                </Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>GRANT CAMERA PERMISSION</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backBtnLink} onPress={() => router.back()}>
                    <Text style={styles.backBtnLinkText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleCapture = async () => {
        setIsAnalyzing(true);
        // Simulate image analysis process
        setTimeout(() => {
            setIsAnalyzing(false);
            router.push('/review/');
        }, 1500);
    };

    return (
        <View style={styles.cameraContainer}>
            <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef}>
                <View style={styles.overlayContainer}>
                    {/* Top Bar Controls */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.controlBtn}>
                            <Text style={styles.controlText}>✕</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                            style={styles.controlBtn}
                        >
                            <Text style={styles.controlText}>🔄</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Aiming/Framing Guide */}
                    <View style={styles.frameGuideContainer}>
                        <View style={styles.guideCornerTopLeft} />
                        <View style={styles.guideCornerTopRight} />
                        <View style={styles.guideCornerBottomLeft} />
                        <View style={styles.guideCornerBottomRight} />
                        <Text style={styles.guideHelperText}>Align document or table within frame</Text>
                    </View>

                    {/* Bottom Controls Area */}
                    <View style={styles.bottomControlsContainer}>
                        {/* Capture Shutter Button */}
                        <TouchableOpacity 
                            onPress={handleCapture}
                            style={styles.shutterButtonOuter}
                            activeOpacity={0.8}
                            disabled={isAnalyzing}
                        >
                            <View style={styles.shutterButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>

            {/* Simulated Analysis Overlay */}
            {isAnalyzing && (
                <View style={styles.analysisOverlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.analysisText}>Analyzing image contents...</Text>
                    <Text style={styles.analysisSubtext}>Extracting text, numbers, and layout structures</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f9fb',
        padding: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dae2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    permissionIcon: {
        fontSize: 36,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#191c1e',
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionText: {
        textAlign: 'center',
        color: '#434655',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    permissionBtn: {
        backgroundColor: '#004ac6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#004ac6',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        width: '100%',
        alignItems: 'center',
    },
    permissionBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 1.2,
        fontSize: 13,
    },
    backBtnLink: {
        marginTop: 16,
        padding: 8,
    },
    backBtnLinkText: {
        color: '#5c647a',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingText: {
        marginTop: 12,
        color: '#434655',
        fontSize: 14,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    overlayContainer: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    controlBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
    },
    controlText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    frameGuideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 32,
        marginVertical: 120,
        position: 'relative',
    },
    guideCornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 32,
        height: 32,
        borderLeftWidth: 3,
        borderTopWidth: 3,
        borderColor: '#ffffff',
    },
    guideCornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRightWidth: 3,
        borderTopWidth: 3,
        borderColor: '#ffffff',
    },
    guideCornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 32,
        height: 32,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderColor: '#ffffff',
    },
    guideCornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRightWidth: 3,
        borderBottomWidth: 3,
        borderColor: '#ffffff',
    },
    guideHelperText: {
        color: '#ffffff',
        opacity: 0.8,
        fontSize: 13,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    bottomControlsContainer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    },
    shutterButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#ffffff',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff',
    },
    analysisOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    analysisText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    analysisSubtext: {
        color: '#eceef0',
        opacity: 0.8,
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
    },
});
