import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from './components/AnimatedSplash';
import AppNavigator from './AppNavigator';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  if (!appIsReady) {
    return <AnimatedSplash onFinish={() => setAppIsReady(true)} />;
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}