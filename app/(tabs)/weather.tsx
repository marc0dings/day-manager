import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WeatherScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">Weather</ThemedText>
        </ThemedView>

        {/* Current weather */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Current</ThemedText>
          <ThemedText style={styles.hint}>
            Temperature, feels like, conditions, humidity and wind speed
          </ThemedText>
        </ThemedView>

        {/* Hourly forecast */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Hourly Forecast</ThemedText>
          <ThemedText style={styles.hint}>
            Horizontal scroll with temperature and icon per hour (next 24 h)
          </ThemedText>
        </ThemedView>

        {/* 7-day forecast */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">7-Day Forecast</ThemedText>
          <ThemedText style={styles.hint}>
            Daily overview with min/max temperature and precipitation probability
          </ThemedText>
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
