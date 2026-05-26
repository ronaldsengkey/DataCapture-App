//==> Start from deep

// app/capture/camera.tsx
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { AIEngineService } from '../../src/services/AIEngineService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { DataCaptureItem } from '../../src/types';

export default function CameraCapture() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const parseTableFromText = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(/\s{2,}|\t/).map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(/\s{2,}|\t/).map(cell => cell.trim()));
    return { headers, rows };
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setIsAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('No photo taken');

      const aiService = new AIEngineService();
      const regions = await aiService.detectRegions(photo.uri);
      const db = DatabaseService.getInstance();
      const extractedItems: DataCaptureItem[] = [];

      for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        let item: DataCaptureItem;
        if (region.label === 'text_block') {
          const text = await aiService.extractText(photo.uri, region.box);
          item = {
            id: `SRC-CAM-TXT-${Date.now()}-${i}`,
            type: 'text',
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            content: JSON.stringify({ title: `Text Block ${i+1}`, text, source: 'camera' }),
          };
        } else {
          const tableText = await aiService.extractText(photo.uri, region.box);
          const { headers, rows } = parseTableFromText(tableText);
          item = {
            id: `SRC-CAM-TBL-${Date.now()}-${i}`,
            type: 'table',
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            content: JSON.stringify({ title: `Table ${i+1}`, headers, rows, source: 'camera' }),
          };
        }
        await db.saveCapturedItem(item);
        extractedItems.push(item);
      }

      setIsAnalyzing(false);
      Alert.alert('Success', `Captured ${extractedItems.length} item(s)`, [
{ text: 'View Review', onPress: () => router.push('/review') },
      ]);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      Alert.alert('Capture Error', 'Failed to analyze image. Ensure good lighting.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back" />
      {isAnalyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Analyzing...</Text>
        </View>
      )}
      <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={isAnalyzing}>
        <Text style={styles.captureText}>Capture</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#004ac6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  captureText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: { color: 'white', marginTop: 10, fontSize: 16 },
  button: { backgroundColor: '#004ac6', padding: 10, borderRadius: 8, marginTop: 20 },
});

//==> End from deep
/*
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { DatabaseService, DataCaptureItem } from '../../src/services/DatabaseService';
import { AIEngineService } from '../../src/services/AIEngineService';

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
        try {
            let photoUri = 'file://mock/photo.jpg';
            if (cameraRef.current) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({
                        quality: 0.8,
                        skipProcessing: true,
                    });
                    if (photo && photo.uri) {
                        photoUri = photo.uri;
                    }
                } catch (e) {
                    console.log('[CAMERA] takePictureAsync failed (expected in simulators):', e);
                }
            }

            const aiService = new AIEngineService();
            const regions = await aiService.detectRegions(photoUri);
            const dbService = DatabaseService.getInstance();

            for (let i = 0; i < regions.length; i++) {
                const reg = regions[i];
                let item: DataCaptureItem;

                if (reg.label === 'text_block') {
                    const extractedText = await aiService.extractText(photoUri, reg.box);
                    item = {
                        id: `SRC-CAM-TXT-${Date.now().toString().slice(-4)}-${i}`,
                        type: 'text',
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                        content: JSON.stringify({
                            title: 'Camera Captured Text Block',
                            text: 'Regional revenue growth peaked in Q3 due to heightened demand for digital capture integrations, resulting in a +18.4% variance over the baseline projections.'
                        })
                    };
                } else {
                    item = {
                        id: `SRC-CAM-TBL-${Date.now().toString().slice(-4)}-${i}`,
                        type: 'table',
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                        content: JSON.stringify({
                            title: 'Camera Captured Table Data',
                            headers: ['Month', 'Target ($k)', 'Actual ($k)', 'Variance'],
                            rows: [
                                ['July', '120', '135', '+12.5%'],
                                ['August', '140', '168', '+20.0%'],
                                ['September', '150', '184', '+22.6%']
                            ]
                        })
                    };
                }
                await dbService.saveCapturedItem(item);
            }
            
            setIsAnalyzing(false);
            router.push('/review/');
        } catch (error) {
            console.error('[CAMERA CAPTURE] error:', error);
            setIsAnalyzing(false);
            Alert.alert('Capture Error', 'Failed to capture or analyze image.');
        }
    };

    return (
        <View style={styles.cameraContainer}>
            <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef}>
                <View style={styles.overlayContainer}>
                    {/* Top Bar Controls 
                    *//*}
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

                    {/* Aiming/Framing Guide 
                    *//*}
                    <View style={styles.frameGuideContainer}>
                        <View style={styles.guideCornerTopLeft} />
                        <View style={styles.guideCornerTopRight} />
                        <View style={styles.guideCornerBottomLeft} />
                        <View style={styles.guideCornerBottomRight} />
                        <Text style={styles.guideHelperText}>Align document or table within frame</Text>
                    </View>

                    {/* Bottom Controls Area 
                    *//*}
                    <View style={styles.bottomControlsContainer}>
                        {/* Capture Shutter Button 
                        *//*}
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

            {/* Simulated Analysis Overlay 
            *//*}
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
*/