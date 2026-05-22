import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@day_manager_theme';

type ThemeCtx = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveScheme: 'light' | 'dark';
};

const Ctx = createContext<ThemeCtx>({
  mode: 'system',
  setMode: () => {},
  effectiveScheme: 'light',
});

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  }

  const effectiveScheme: 'light' | 'dark' = mode === 'system' ? deviceScheme : mode;

  return (
    <Ctx.Provider value={{ mode, setMode, effectiveScheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useThemeMode() {
  return useContext(Ctx);
}

export function useAppColorScheme(): 'light' | 'dark' {
  return useContext(Ctx).effectiveScheme;
}
