import { Fraunces_600SemiBold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary, ErrorFallback } from '../components';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootErrorFallback({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <ErrorFallback
      onRetry={reset}
      onGoHome={() => {
        router.replace('/');
        reset();
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_900Black,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_700Bold,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary renderFallback={(reset) => <RootErrorFallback reset={reset} />}>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
