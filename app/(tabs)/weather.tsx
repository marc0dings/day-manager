import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WeatherScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('weather.title')}</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('weather.current')}</ThemedText>
          <ThemedText style={styles.hint}>{t('weather.currentHint')}</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('weather.hourly')}</ThemedText>
          <ThemedText style={styles.hint}>{t('weather.hourlyHint')}</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('weather.sevenDay')}</ThemedText>
          <ThemedText style={styles.hint}>{t('weather.sevenDayHint')}</ThemedText>
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: { marginBottom: 4 },
  card: { borderRadius: 14, padding: 16, gap: 8 },
  hint: { opacity: 0.45, fontStyle: 'italic', fontSize: 14 },
});
