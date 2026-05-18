import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import i18n, { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const { t } = useTranslation();

  function changeLanguage(code: string) {
    i18n.changeLanguage(code);
    AsyncStorage.setItem(LANG_STORAGE_KEY, code);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('settings.title')}</ThemedText>
        </ThemedView>

        {/* Language */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.language')}</ThemedText>
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <View key={lang.code}>
              {index > 0 && <View style={[styles.separator, { backgroundColor: colors.background }]} />}
              <TouchableOpacity
                style={styles.langRow}
                onPress={() => changeLanguage(lang.code)}
                activeOpacity={0.6}
              >
                <ThemedText style={styles.langLabel}>{lang.nativeLabel}</ThemedText>
                {i18n.language === lang.code && (
                  <Check size={18} color={colors.tint} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        {/* Account */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.account')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.accountHint')}</ThemedText>
        </ThemedView>

        {/* Appearance */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.appearance')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.appearanceHint')}</ThemedText>
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.notifications')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.notificationsHint')}</ThemedText>
        </ThemedView>

        {/* Weather source */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('settings.weatherSource')}</ThemedText>
          <ThemedText style={styles.hint}>{t('settings.weatherSourceHint')}</ThemedText>
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
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  langLabel: { fontSize: 16 },
  separator: { height: 1, marginVertical: 2 },
});
