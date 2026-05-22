import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ThemeMode, useThemeMode } from '@/context/theme-context';
import i18nModule, { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type SavedCity, clearSavedCity, loadSavedCity } from '@/services/weather';

const ACCOUNT_NAME_KEY = '@day_manager_account_name';

const THEME_OPTIONS: { mode: ThemeMode; icon: string }[] = [
  { mode: 'light', icon: '☀️' },
  { mode: 'dark',  icon: '🌙' },
  { mode: 'system', icon: '📱' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const inputBg = scheme === 'light' ? '#E5E5EA' : '#2C2C2E';
  const { t, i18n } = useTranslation();
  const { mode, setMode } = useThemeMode();

  const [displayName, setDisplayName] = useState('');
  const [savedCity, setSavedCity] = useState<SavedCity | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACCOUNT_NAME_KEY).then(v => { if (v) setDisplayName(v); });
    loadSavedCity().then(setSavedCity);
  }, []);

  function changeLanguage(code: string) {
    i18nModule.changeLanguage(code);
    AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  }

  function saveName() {
    AsyncStorage.setItem(ACCOUNT_NAME_KEY, displayName.trim());
  }

  async function handleClearCity() {
    await clearSavedCity();
    setSavedCity(null);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('settings.title')}</ThemedText>
        </ThemedView>

        {/* Account */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.account')}</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: colors.text }]}
            placeholder={t('settings.namePlaceholder')}
            placeholderTextColor={colors.icon}
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            returnKeyType="done"
          />
        </ThemedView>

        {/* Language */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.language')}</ThemedText>
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <View key={lang.code}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.background }]} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => changeLanguage(lang.code)}
                activeOpacity={0.6}
              >
                <ThemedText style={styles.rowLabel}>{lang.nativeLabel}</ThemedText>
                {i18n.language === lang.code && (
                  <Check size={18} color={colors.tint} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        {/* Appearance */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.appearance')}</ThemedText>
          {THEME_OPTIONS.map(({ mode: m, icon }, index) => {
            const labelKey = `settings.theme${m.charAt(0).toUpperCase() + m.slice(1)}` as
              | 'settings.themeLight'
              | 'settings.themeDark'
              | 'settings.themeSystem';
            return (
              <View key={m}>
                {index > 0 && <View style={[styles.separator, { backgroundColor: colors.background }]} />}
                <TouchableOpacity style={styles.row} onPress={() => setMode(m)} activeOpacity={0.6}>
                  <ThemedText style={styles.themeIcon}>{icon}</ThemedText>
                  <ThemedText style={[styles.rowLabel, { flex: 1 }]}>{t(labelKey)}</ThemedText>
                  {mode === m && <Check size={18} color={colors.tint} strokeWidth={2.5} />}
                </TouchableOpacity>
              </View>
            );
          })}
        </ThemedView>

        {/* Weather Source */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.weatherSource')}</ThemedText>
          {savedCity ? (
            <View style={styles.cityRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.cityName}>
                  {savedCity.name}{savedCity.country ? `, ${savedCity.country}` : ''}
                </ThemedText>
                {savedCity.admin1 ? (
                  <ThemedText style={[styles.citySub, { color: colors.icon }]}>{savedCity.admin1}</ThemedText>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: '#FF3B30' }]}
                onPress={handleClearCity}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.clearBtnText}>{t('settings.weatherCityClear')}</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <ThemedText style={styles.hint}>{t('settings.weatherNoCity')}</ThemedText>
          )}
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.notifications')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.notificationsHint')}</ThemedText>
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: { marginBottom: 4 },
  card: { borderRadius: 14, padding: 16, gap: 10 },
  hint: { opacity: 0.45, fontStyle: 'italic', fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 16 },
  separator: { height: 1, marginVertical: 2 },

  themeIcon: { fontSize: 18, marginRight: 10 },

  input: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16,
  },

  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cityName: { fontSize: 15, fontWeight: '500' },
  citySub: { fontSize: 13, marginTop: 1 },
  clearBtn: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  clearBtnText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
});
