// App.tsx from deep
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnimatedSplash from './components/AnimatedSplash';
import CameraCapture from './app/capture/camera';
import FileUpload from './app/capture/file';
import URLCapture from './app/capture/url';
import ReviewScreen from './app/review';

const Stack = createNativeStackNavigator();

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    // Preload any resources here
  }, []);

  if (!splashFinished) {
    return <AnimatedSplash onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Review">
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'DataCapture Review' }} />
        <Stack.Screen name="Camera" component={CameraCapture} options={{ title: 'Camera Capture' }} />
        <Stack.Screen name="File" component={FileUpload} options={{ title: 'Upload File' }} />
        <Stack.Screen name="URL" component={URLCapture} options={{ title: 'Extract from URL' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
// end from deep


/*
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
}*/