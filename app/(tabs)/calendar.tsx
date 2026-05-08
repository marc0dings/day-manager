import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CalendarScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">Calendar</ThemedText>
        </ThemedView>

        {/* Month view */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Month View</ThemedText>
          <ThemedText style={styles.hint}>
            Calendar grid with week and month view, days with events highlighted
          </ThemedText>
        </ThemedView>

        {/* Events */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Events</ThemedText>
          <ThemedText style={styles.hint}>
            List of upcoming shared events with time, participants and location
          </ThemedText>
        </ThemedView>

        {/* Share */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Share Calendar</ThemedText>
          <ThemedText style={styles.hint}>
            Share the calendar with others via link or invitation
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
