import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

const AnimatedSplash: React.FC<Props> = ({ onFinish }) => {
  const fillHeight = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [percentVal, setPercentVal] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    // Listen to progress to update percentage state
    const listenerId = progress.addListener(({ value }) => {
      setPercentVal(Math.floor(value));
    });

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
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount += 1;
      const currentVal = tickCount * 5;
      if (currentVal < 30) setStatusText('Loading engine...');
      else if (currentVal < 70) setStatusText('Preparing UI...');
      else setStatusText('Almost ready...');
    }, 500);

    return () => {
      clearInterval(interval);
      progress.removeListener(listenerId);
    };
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
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.percent}>{percentVal}%</Text>
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