import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { I18nManager, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore, useColors } from '../src/store/themeStore';
import { ToastHost } from '../src/components/Toast';

// الواجهة عربية من اليمين لليسار. يبدأ التفعيل الكامل من ثاني تشغيل بعد التثبيت.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync().catch(() => {});

const PUBLIC_ROUTES = ['login', 'register', 'legal'];

function AuthGuard({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    if (!ready) return;
    const first = segments[0];
    const isPublic = PUBLIC_ROUTES.includes(first);
    const signedIn = !!(user || token);
    if (!signedIn && !isPublic) router.replace('/login');
    else if (signedIn && (first === 'login' || first === 'register')) router.replace('/');
  }, [ready, user, token, segments]);

  return children;
}

export default function RootLayout() {
  const C = useColors();
  const mode = useThemeStore((s) => s.mode);
  const init = useAuthStore((s) => s.init);
  const ready = useAuthStore((s) => s.ready);
  const loadTheme = useThemeStore((s) => s.load);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    loadTheme().finally(() => setThemeLoaded(true));
    init();
  }, []);

  const appReady = fontsLoaded && ready && themeLoaded;

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.bg },
            }}
          >
            <Stack.Screen name="viewer" options={{ animation: 'fade', presentation: 'transparentModal' }} />
          </Stack>
        </AuthGuard>
        <ToastHost />
      </View>
    </SafeAreaProvider>
  );
}
