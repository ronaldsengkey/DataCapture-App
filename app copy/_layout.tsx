import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SplashScreen from '../src/components/SplashScreen';

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={errorStyles.container}>
                    <View style={errorStyles.iconBox}>
                        <Text style={errorStyles.icon}>⚠️</Text>
                    </View>
                    <Text style={errorStyles.title}>Something went wrong</Text>
                    <Text style={errorStyles.message}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </Text>
                    <TouchableOpacity
                        style={errorStyles.retryBtn}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={errorStyles.retryText}>TRY AGAIN</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const errorStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f9fb',
        padding: 32,
    },
    iconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ffdad6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    icon: { fontSize: 36 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#191c1e',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#434655',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    retryBtn: {
        backgroundColor: '#004ac6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    retryText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 1.2,
    },
});

export default function Layout() {
    const [isSplashVisible, setIsSplashVisible] = useState(true);

    if (isSplashVisible) {
        return (
            <ErrorBoundary>
                <SplashScreen onFinish={() => setIsSplashVisible(false)} />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="capture/camera" options={{ headerShown: false }} />
                <Stack.Screen name="capture/url" options={{ headerShown: false }} />
                <Stack.Screen name="capture/file" options={{ headerShown: false }} />
                <Stack.Screen name="review/index" options={{ headerShown: false }} />
            </Stack>
        </ErrorBoundary>
    );
}