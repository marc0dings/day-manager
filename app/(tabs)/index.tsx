import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/events-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TodayScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const { t } = useTranslation();
  const locale = t('locale');

  const today = new Date();
  const dateLabel = today.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const { events } = useEvents();

  const todayEvents = useMemo(() => {
    const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
    return events
      .filter(e => {
        const s = e.startAt;
        return s.getFullYear() === y && s.getMonth() === m && s.getDate() === d;
      })
      .sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.startAt.getTime() - b.startAt.getTime();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  function fmt(d: Date) {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('today.title')}</ThemedText>
          <ThemedText style={[styles.date, { color: colors.icon }]}>{dateLabel}</ThemedText>
        </ThemedView>

        {/* Weather quick view */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('today.weather')}</ThemedText>
          <ThemedText style={styles.hint}>{t('today.weatherHint')}</ThemedText>
        </ThemedView>

        {/* Today's events */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('today.eventsTitle')}</ThemedText>

          {todayEvents.length === 0 ? (
            <ThemedText style={styles.hint}>{t('today.noEvents')}</ThemedText>
          ) : (
            <View style={styles.eventList}>
              {todayEvents.map(ev => (
                <View
                  key={ev.id}
                  style={[styles.eventRow, { borderLeftColor: ev.color ?? colors.tint }]}
                >
                  <View style={styles.eventContent}>
                    <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                      {ev.title}
                    </ThemedText>
                    {ev.allDay ? (
                      <ThemedText style={[styles.meta, { color: colors.icon }]}>
                        {t('today.allDay')}
                      </ThemedText>
                    ) : (
                      <View style={styles.metaRow}>
                        <Clock size={12} color={colors.icon} />
                        <ThemedText style={[styles.meta, { color: colors.icon }]}>
                          {fmt(ev.startAt)} – {fmt(ev.endAt)}
                        </ThemedText>
                      </View>
                    )}
                    {ev.location ? (
                      <View style={styles.metaRow}>
                        <MapPin size={12} color={colors.icon} />
                        <ThemedText style={[styles.meta, { color: colors.icon }]}>
                          {ev.location}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <View style={[styles.colorDot, { backgroundColor: ev.color ?? colors.tint }]} />
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Suggestions */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('today.suggestions')}</ThemedText>
          <ThemedText style={styles.hint}>{t('today.suggestionsHint')}</ThemedText>
        </ThemedView>

        {/* Daily checklist */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('today.checklist')}</ThemedText>
          <ThemedText style={styles.hint}>{t('today.checklistHint')}</ThemedText>
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: { marginBottom: 4, gap: 4 },
  date: { fontSize: 15 },
  card: { borderRadius: 14, padding: 16, gap: 10 },
  hint: { opacity: 0.45, fontStyle: 'italic', fontSize: 14 },
  eventList: { gap: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  eventContent: { flex: 1, gap: 3 },
  eventTitle: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
});
