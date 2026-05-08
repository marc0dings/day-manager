import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>

        {/* Account */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Account</ThemedText>
          <ThemedText style={styles.hint}>
            Profile, name and account management
          </ThemedText>
        </ThemedView>

        {/* Appearance */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Appearance</ThemedText>
          <ThemedText style={styles.hint}>
            Light / dark mode and theme preferences
          </ThemedText>
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Notifications</ThemedText>
          <ThemedText style={styles.hint}>
            Event reminders and weather alerts
          </ThemedText>
        </ThemedView>

        {/* Weather source */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Weather Source</ThemedText>
          <ThemedText style={styles.hint}>
            API key and location settings for weather data
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
