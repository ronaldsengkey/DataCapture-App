import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Camera } from 'expo-camera';

const CUP_WIDTH = 320;
const CUP_HEIGHT = 380;
const WAVE_AMPLITUDE = 8;
const WAVE_FREQUENCY = 2.5;
const FRAME_INTERVAL = 16; // ~60fps

interface SplashScreenProps {
    onFinish: () => void;
}

function generateWavePath(
    width: number,
    height: number,
    waterLevel: number,
    waveOffset: number,
    amplitude: number,
    frequency: number
): string {
    const y = height - waterLevel;
    let path = `M 0 ${height}`;
    path += ` L 0 ${y}`;
    const step = 2;
    for (let x = 0; x <= width; x += step) {
        const waveY = y + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI + waveOffset);
        path += ` L ${x} ${waveY}`;
    }
    path += ` L ${width} ${height} Z`;
    return path;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [progressPercent, setProgressPercent] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing secure local environment...');
    const [wavePath1, setWavePath1] = useState('');
    const [wavePath2, setWavePath2] = useState('');

    // Progress bar width interpolation
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    useEffect(() => {
        let wavePhase = 0;
        let currentProgress = 0;

        // Start fill animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 3500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: false,
        }).start();

        // Track progress for percentage text
        const progressListener = progressAnim.addListener(({ value }) => {
            currentProgress = value;
            setProgressPercent(Math.floor(value * 100));
        });

        // Animate wave via requestAnimationFrame loop
        let frameId: number;
        const animateWave = () => {
            wavePhase += 0.06; // wave speed
            const waterLevel = currentProgress * CUP_HEIGHT;

            const path1 = generateWavePath(
                CUP_WIDTH,
                CUP_HEIGHT,
                waterLevel,
                wavePhase,
                WAVE_AMPLITUDE,
                WAVE_FREQUENCY
            );
            const path2 = generateWavePath(
                CUP_WIDTH,
                CUP_HEIGHT,
                waterLevel - 3,
                wavePhase + 1.5,
                WAVE_AMPLITUDE * 0.6,
                WAVE_FREQUENCY * 1.3
            );

            setWavePath1(path1);
            setWavePath2(path2);

            frameId = requestAnimationFrame(animateWave);
        };

        frameId = requestAnimationFrame(animateWave);

        // Request permissions in parallel
        const requestPermissions = async () => {
            try {
                setStatusMessage('Requesting camera access...');
                await Camera.requestCameraPermissionsAsync();
            } catch (err) {
                console.warn('Error requesting permissions:', err);
            } finally {
                setStatusMessage('Configuring database & services...');
            }
        };
        requestPermissions();

        // Finish after animation
        const finishTimer = setTimeout(() => {
            onFinish();
        }, 3800);

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(finishTimer);
            progressAnim.removeListener(progressListener);
        };
    }, []);

    return (
        <View style={styles.outerContainer}>
            {/* Subtle grid line decoration */}
            <View style={styles.gridLinesContainer} pointerEvents="none">
                <View style={styles.horizontalLineTop} />
                <View style={styles.horizontalLineBottom} />
                <View style={styles.verticalLineLeft} />
                <View style={styles.verticalLineRight} />
            </View>

            <View style={styles.mainContent}>
                {/* Cup / Liquid Container */}
                <View style={styles.cupContainer}>
                    {/* Base Layer (Unfilled) */}
                    <View style={styles.baseLayer}>
                        <Image

                            source={{
                                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1LHCP3SoUkvfqlpXEvndCRA7LE_jkzibk28sr6J4v7cAgzt_nJNnKbf8EncXCGd322pazL_9zx6VuAZ_mS3gImQWDk1oaawrXXc1b83vt4Q1105t4LcENP7wfFqSVQiLKgq9w0f6XaqeL4K90kdfUXNUNEbLy14rACIed8l-foR5anLnPR8O4r63swOmAyKcAGiNPqGvIhfIHSS9TznBciNU0wwMDe_OtvGbSxO3qnPpxDJKe3Nt8pPJrQkNo4sbf1tCDUunFm43f',
                            }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.titleBase}>DataCapture</Text>
                        <Text style={styles.subtitleBase}>PRECISION UTILITY ENVIRONMENT</Text>
                    </View>

                    {/* Animated Wave Fill (SVG) */}
                    <View style={styles.waveContainer} pointerEvents="none">
                        <Svg
                            width={CUP_WIDTH}
                            height={CUP_HEIGHT}
                            viewBox={`0 0 ${CUP_WIDTH} ${CUP_HEIGHT}`}
                        >
                            {/* Background wave (lighter, offset) */}
                            {wavePath2 ? (
                                <Path d={wavePath2} fill="rgba(0, 74, 198, 0.3)" />
                            ) : null}
                            {/* Primary wave */}
                            {wavePath1 ? (
                                <Path d={wavePath1} fill="#004ac6" />
                            ) : null}
                        </Svg>
                    </View>
                </View>
            </View>

            {/* Bottom Footer */}
            <View style={styles.footer}>
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
                </View>

                {/* Status Row */}
                <View style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusPulseIcon}>⏳</Text>
                        <Text style={styles.statusText} numberOfLines={1}>{statusMessage}</Text>
                    </View>
                    <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#f7f9fb',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    gridLinesContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
    },
    horizontalLineTop: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#737686',
    },
    horizontalLineBottom: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#737686',
    },
    verticalLineLeft: {
        position: 'absolute',
        left: 24,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#737686',
    },
    verticalLineRight: {
        position: 'absolute',
        right: 24,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#737686',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cupContainer: {
        width: CUP_WIDTH,
        height: CUP_HEIGHT,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#c3c6d7',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#ffffff',
    },
    baseLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 1,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },
    titleBase: {
        fontSize: 30,
        fontWeight: '600',
        color: '#004ac6',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitleBase: {
        fontSize: 11,
        fontWeight: '700',
        color: '#434655',
        opacity: 0.8,
        letterSpacing: 2,
        textAlign: 'center',
    },
    waveContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    footer: {
        width: '100%',
        maxWidth: 320,
        paddingBottom: 24,
    },
    progressBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#eceef0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: '#c3c6d7',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#004ac6',
        borderRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    statusPulseIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    statusText: {
        fontSize: 13,
        color: '#434655',
        flex: 1,
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '700',
        color: '#004ac6',
    },
});
