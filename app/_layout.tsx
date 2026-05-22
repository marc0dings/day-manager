import '@/i18n';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { EventsProvider } from '@/context/events-context';
import { ThemeModeProvider, useThemeMode } from '@/context/theme-context';
import i18n, { LANG_STORAGE_KEY } from '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppShell() {
  const { effectiveScheme } = useThemeMode();

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then(lang => {
      if (lang && lang !== i18n.language) i18n.changeLanguage(lang);
    });
  }, []);

  return (
    <ThemeProvider value={effectiveScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <EventsProvider>
      <ThemeModeProvider>
        <AppShell />
      </ThemeModeProvider>
    </EventsProvider>
  );
}
