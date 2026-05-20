import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing secure local environment...');
  const fillHeightAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const start = async () => {
      // Start water fill animation
      Animated.timing(fillHeightAnim, {
        toValue: 100,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 100 / (3000 / 30);
          return next >= 100 ? 100 : next;
        });
      }, 30);

      // Request camera permission upfront
      setStatus('Requesting camera access...');
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        setStatus('Camera permission denied – some features limited');
      } else {
        setStatus('Camera ready');
      }

      // Simulate other init tasks
      setStatus('Loading data engine...');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus('Almost ready...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      clearInterval(interval);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      onFinish();
    };
    start();
  }, []);

  const fillHeight = fillHeightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const clipProgress = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['100%', '0%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.waterFill,
          { height: fillHeight, bottom: 0, position: 'absolute' },
        ]}
      />

      <View style={styles.content}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LHCP3SoUkvfqlpXEvndCRA7LE_jkzibk28sr6J4v7cAgzt_nJNnKbf8EncXCGd322pazL_9zx6VuAZ_mS3gImQWDk1oaawrXXc1b83vt4Q1105t4LcENP7wfFqSVQiLKgq9w0f6XaqeL4K90kdfUXNUNEbLy14rACIed8l-foR5anLnPR8O4r63swOmAyKcAGiNPqGvIhfIHSS9TznBciNU0wwMDe_OtvGbSxO3qnPpxDJKe3Nt8pPJrQkNo4sbf1tCDUunFm43f' }}
          style={styles.logo}
        />
        <Text style={styles.title}>DataCapture</Text>
        <Text style={styles.subtitle}>Precision Utility Environment</Text>
      </View>

      <Animated.View
        style={[
          styles.clippedContent,
          { clipPath: `inset(${clipProgress} 0% 0% 0%)` } as any,
        ]}
        pointerEvents="none"
      >
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LHCP3SoUkvfqlpXEvndCRA7LE_jkzibk28sr6J4v7cAgzt_nJNnKbf8EncXCGd322pazL_9zx6VuAZ_mS3gImQWDk1oaawrXXc1b83vt4Q1105t4LcENP7wfFqSVQiLKgq9w0f6XaqeL4K90kdfUXNUNEbLy14rACIed8l-foR5anLnPR8O4r63swOmAyKcAGiNPqGvIhfIHSS9TznBciNU0wwMDe_OtvGbSxO3qnPpxDJKe3Nt8pPJrQkNo4sbf1tCDUunFm43f' }}
          style={[styles.logo, { tintColor: 'white' }]}
        />
        <Text style={[styles.title, { color: 'white' }]}>DataCapture</Text>
        <Text style={[styles.subtitle, { color: 'white' }]}>Precision Utility Environment</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{status}</Text>
          <Text style={styles.percent}>{Math.floor(progress)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FB', position: 'relative' },
  waterFill: {
    left: 0,
    right: 0,
    backgroundColor: '#004ac6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  clippedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5, color: '#191C1E', marginBottom: 4 },
  subtitle: { fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', color: '#434655' },
  footer: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  progressBar: { height: 4, backgroundColor: '#E0E3E5', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#004ac6', borderRadius: 2 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 12, color: '#434655' },
  percent: { fontSize: 12, fontWeight: '600', color: '#004ac6' },
});