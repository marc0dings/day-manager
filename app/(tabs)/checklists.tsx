import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChecklistsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">Checklists</ThemedText>
        </ThemedView>

        {/* Active checklists */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Active</ThemedText>
          <ThemedText style={styles.hint}>
            Checklists for days with many planned activities — progress visible
          </ThemedText>
        </ThemedView>

        {/* Completed checklists */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">Completed</ThemedText>
          <ThemedText style={styles.hint}>
            Archive of finished checklists
          </ThemedText>
        </ThemedView>

        {/* New checklist */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">New Checklist</ThemedText>
          <ThemedText style={styles.hint}>
            Create a checklist for a specific day and add tasks
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
