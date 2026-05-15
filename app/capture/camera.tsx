import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType, CameraCapturedPicture } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function CleanCameraScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const router = useRouter();

  // Auto‑detection every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (permission?.granted) {
      interval = setInterval(async () => {
        if (cameraRef.current && !isAnalyzing) {
          setIsAnalyzing(true);
          try {
            const photo = await cameraRef.current.takePictureAsync({
              base64: true,
              quality: 0.7,
            });
            const detectedItems = await analyzeImage(photo);
            if (detectedItems.length > 0) {
              await saveDetectedItems(detectedItems);
            }
          } catch (error) {
            console.warn('Frame capture failed', error);
          } finally {
            setIsAnalyzing(false);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [permission]);

  // Replace this with your real ML model (MLKit, TFLite, etc.)
  const analyzeImage = async (photo: CameraCapturedPicture) => {
    // Simulated detection – returns text, numbers, or image type
    return new Promise<Array<{ type: 'text' | 'number' | 'image'; content: string; id: string }>>(
      (resolve) => {
        setTimeout(() => {
          const mock = [];
          if (Math.random() > 0.6) {
            mock.push({ type: 'text', content: 'Detected text from frame', id: `txt_${Date.now()}` });
          }
          if (Math.random() > 0.7) {
            mock.push({ type: 'number', content: '42', id: `num_${Date.now()}` });
          }
          resolve(mock);
        }, 100);
      }
    );
  };

  const saveDetectedItems = async (items: any[]) => {
    // Save to your database (e.g., using DatabaseService)
    console.log('Auto-saved items:', items);
    // await DatabaseService.saveBatch(items);
  };

  const handleCapturePress = async () => {
    if (!cameraRef.current) return;
    setIsAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const items = await analyzeImage(photo);
      await saveDetectedItems(items);
      router.push({
        pathname: '/review',
        params: { items: JSON.stringify(items) },
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to capture and analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Permission handling – no crash
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required to capture data.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapturePress}>
            {isAnalyzing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.captureText}>Capture & Analyze</Text>
            )}
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between' },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#004ac6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 40,
  },
  captureText: { color: 'white', fontWeight: '600' },
  message: { color: 'white', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#004ac6', padding: 12, borderRadius: 8, alignSelf: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});