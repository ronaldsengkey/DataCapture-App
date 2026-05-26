//==>
// components/AnimatedSplash.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

const AnimatedSplash: React.FC<Props> = ({ onFinish }) => {
  const fillHeight = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const status = useRef('Initializing...');

  useEffect(() => {
    // Simulate loading progress
    Animated.timing(progress, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Water fill animation (rises from bottom)
    Animated.timing(fillHeight, {
      toValue: screenHeight,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => onFinish());

    // Update status text
    const interval = setInterval(() => {
      if (progress.__getValue() < 30) status.current = 'Loading engine...';
      else if (progress.__getValue() < 70) status.current = 'Preparing UI...';
      else status.current = 'Almost ready...';
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Content (Logo & Text) - above water */}
      <View style={styles.content}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>DataCapture</Text>
        <Text style={styles.subtitle}>Precision Utility Environment</Text>
      </View>

      {/* Water fill (animated) - behind content */}
      <Animated.View
        style={[
          styles.waterFill,
          { height: fillHeight },
        ]}
      />

      {/* Footer with progress bar - always on top */}
      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressPercent }]} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{status.current}</Text>
          <Text style={styles.percent}>{Math.floor(progress.__getValue())}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  logo: { width: 120, height: 120, marginBottom: 20, resizeMode: 'contain' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#004ac6', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#004ac6',
    zIndex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 3,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#004ac6',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusText: { color: '#666', fontSize: 12 },
  percent: { color: '#004ac6', fontSize: 12, fontWeight: 'bold' },
});

export default AnimatedSplash;
//==>

/*
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

      // Request camera permission upfront in try-catch
      try {
        setStatus('Requesting camera access...');
        const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
        if (camStatus !== 'granted') {
          setStatus('Camera permission denied – some features limited');
        } else {
          setStatus('Camera ready');
        }
      } catch (err) {
        console.warn('Failed to request camera permission in splash:', err);
        setStatus('Camera initialization skipped');
      }

      // Simulate other init tasks
      setStatus('Loading data engine...');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus('Almost ready...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      clearInterval(interval);
      // Let the fill finish
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onFinish();
    };
    start();
  }, []);

  const fillHeight = fillHeightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* 1. Water Fill wave background 
      *//*}
      <Animated.View
        style={[
          styles.waterFill,
          { height: fillHeight, bottom: 0, position: 'absolute' },
        ]}
      />

      {/* 2. Base Dark/Color Content
      *//*}
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LHCP3SoUkvfqlpXEvndCRA7LE_jkzibk28sr6J4v7cAgzt_nJNnKbf8EncXCGd322pazL_9zx6VuAZ_mS3gImQWDk1oaawrXXc1b83vt4Q1105t4LcENP7wfFqSVQiLKgq9w0f6XaqeL4K90kdfUXNUNEbLy14rACIed8l-foR5anLnPR8O4r63swOmAyKcAGiNPqGvIhfIHSS9TznBciNU0wwMDe_OtvGbSxO3qnPpxDJKe3Nt8pPJrQkNo4sbf1tCDUunFm43f' }}
          style={styles.logo}
        />
        <Text style={styles.title}>DataCapture</Text>
        <Text style={styles.subtitle}>Precision Utility Environment</Text>
      </View>

      {/* 3. Clipped White Content (Revealed as container rises)
       *//*}
      <Animated.View
        style={[
          styles.clippedContainer,
          { height: fillHeight, bottom: 0, position: 'absolute' },
        ]}
        pointerEvents="none"
      >
        <View style={styles.clippedContentInner}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LHCP3SoUkvfqlpXEvndCRA7LE_jkzibk28sr6J4v7cAgzt_nJNnKbf8EncXCGd322pazL_9zx6VuAZ_mS3gImQWDk1oaawrXXc1b83vt4Q1105t4LcENP7wfFqSVQiLKgq9w0f6XaqeL4K90kdfUXNUNEbLy14rACIed8l-foR5anLnPR8O4r63swOmAyKcAGiNPqGvIhfIHSS9TznBciNU0wwMDe_OtvGbSxO3qnPpxDJKe3Nt8pPJrQkNo4sbf1tCDUunFm43f' }}
            style={[styles.logo, { tintColor: 'white' }]}
          />
          <Text style={[styles.title, { color: 'white' }]}>DataCapture</Text>
          <Text style={[styles.subtitle, { color: 'white' }]}>Precision Utility Environment</Text>
        </View>
      </Animated.View>

      {/* 4. Footer Progress Controls 
      *//*}
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
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  clippedContainer: {
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  clippedContentInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5, color: '#191C1E', marginBottom: 4 },
  subtitle: { fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', color: '#434655' },
  footer: { position: 'absolute', bottom: 40, left: 20, right: 20, zIndex: 4 },
  progressBar: { height: 4, backgroundColor: '#E0E3E5', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#004ac6', borderRadius: 2 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 12, color: '#434655' },
  percent: { fontSize: 12, fontWeight: '600', color: '#004ac6' },
});
*/