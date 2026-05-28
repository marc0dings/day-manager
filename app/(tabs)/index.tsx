import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/events-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  type SavedCity,
  type WeatherData,
  fetchWeather,
  loadSavedCity,
  weatherEmoji,
} from '@/services/weather';
import { type Suggestion, generateSuggestions } from '@/services/suggestions';

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

  const greeting = (() => {
    const h = today.getHours();
    const period =
      h >= 5 && h < 12 ? 'morning' :
      h >= 12 && h < 18 ? 'afternoon' :
      h >= 18 && h < 22 ? 'evening' : 'night';
    const variants = t(`today.greetings.${period}`, { returnObjects: true }) as string[];
    return variants[today.getDate() % variants.length];
  })();

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

  const [city, setCity] = useState<SavedCity | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    loadSavedCity().then(saved => {
      if (!saved) { setWeatherLoading(false); return; }
      setCity(saved);
      fetchWeather(saved.latitude, saved.longitude)
        .then(data => {
          setWeather(data);
          setSuggestions(generateSuggestions(events, data.daily));
        })
        .catch(() => {})
        .finally(() => setWeatherLoading(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{greeting}</ThemedText>
          <ThemedText style={[styles.date, { color: colors.icon }]}>{dateLabel}</ThemedText>
        </ThemedView>

        {/* Weather quick view */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle">{t('today.weather')}</ThemedText>

          {weatherLoading && (
            <ActivityIndicator size="small" color={colors.tint} style={{ alignSelf: 'flex-start' }} />
          )}

          {!weatherLoading && !city && (
            <ThemedText style={styles.hint}>{t('today.weatherNoCity')}</ThemedText>
          )}

          {!weatherLoading && weather && city && (
            <View style={styles.weatherRow}>
              <ThemedText style={styles.weatherEmoji}>
                {weatherEmoji(weather.current.weatherCode)}
              </ThemedText>
              <View style={styles.weatherMain}>
                <ThemedText style={styles.weatherTemp}>
                  {Math.round(weather.current.temperature)}°C
                </ThemedText>
                <ThemedText style={[styles.weatherCity, { color: colors.icon }]}>
                  {city.name}{city.country ? `, ${city.country}` : ''}
                </ThemedText>
              </View>
              <View style={styles.weatherStats}>
                <ThemedText style={[styles.weatherStat, { color: colors.icon }]}>
                  💧 {weather.current.humidity}%
                </ThemedText>
                <ThemedText style={[styles.weatherStat, { color: colors.icon }]}>
                  💨 {Math.round(weather.current.windSpeed)} km/h
                </ThemedText>
              </View>
            </View>
          )}
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

          {weatherLoading && (
            <ActivityIndicator size="small" color={colors.tint} style={{ alignSelf: 'flex-start' }} />
          )}

          {!weatherLoading && !city && (
            <ThemedText style={styles.hint}>{t('today.suggestionsNoCity')}</ThemedText>
          )}

          {!weatherLoading && city && suggestions.length === 0 && (
            <ThemedText style={styles.hint}>{t('today.suggestionsNone')}</ThemedText>
          )}

          {!weatherLoading && suggestions.length > 0 && (
            <View style={styles.suggestionList}>
              {suggestions.map((s, i) => {
                const dateLabel = s.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <View key={i} style={[styles.suggestionRow, { borderColor: colors.tint + '44' }]}>
                    <ThemedText style={styles.suggestionEmoji}>{s.emoji}</ThemedText>
                    <View style={styles.suggestionContent}>
                      <ThemedText type="defaultSemiBold" style={styles.suggestionTitle}>
                        {s.activity}
                      </ThemedText>
                      <ThemedText style={[styles.suggestionMeta, { color: colors.icon }]}>
                        {t('today.suggestionOn')} {dateLabel}
                      </ThemedText>
                      <ThemedText style={[styles.suggestionMeta, { color: colors.icon }]}>
                        {weatherEmoji(s.weatherCode)} {t('today.suggestionWeather', { temp: s.maxTemp })}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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

  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherEmoji: { fontSize: 40 },
  weatherMain: { flex: 1, gap: 2 },
  weatherTemp: { fontSize: 28, fontWeight: '300', letterSpacing: -1 },
  weatherCity: { fontSize: 13 },
  weatherStats: { alignItems: 'flex-end', gap: 4 },
  weatherStat: { fontSize: 13 },

  eventList: { gap: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  eventContent: { flex: 1, gap: 3 },
  eventTitle: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },

  suggestionList: { gap: 10 },
  suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 10, padding: 10 },
  suggestionEmoji: { fontSize: 28, lineHeight: 34 },
  suggestionContent: { flex: 1, gap: 3 },
  suggestionTitle: { fontSize: 15 },
  suggestionMeta: { fontSize: 12 },
});
