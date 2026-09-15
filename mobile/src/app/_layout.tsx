import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

import { DemoModeProvider } from '../context/DemoModeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    // Hide splash screen after a small delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DemoModeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#09090b' : '#f4f4f5',
            }
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="shipment/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </DemoModeProvider>
    </ThemeProvider>
  );
}
