import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  type DailyItem,
  type GeoResult,
  type SavedCity,
  type WeatherData,
  fetchWeather,
  loadSavedCity,
  saveCity,
  searchCity,
  weatherEmoji,
} from '@/services/weather';

const DEBOUNCE_MS = 400;

function formatHour(timeStr: string): string {
  return timeStr.slice(11, 16);
}

function formatDay(dateStr: string, todayLabel: string, locale: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return todayLabel;
  }
  return date.toLocaleDateString(locale, { weekday: 'short' });
}

export default function WeatherScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const inputBg = scheme === 'light' ? '#E5E5EA' : '#2C2C2E';
  const tint = Colors[scheme].tint;
  const iconColor = Colors[scheme].icon;
  const textColor = Colors[scheme].text;
  const { t, i18n } = useTranslation();
  const locale = i18n.language ?? 'de';

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [city, setCity] = useState<SavedCity | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSavedCity().then(saved => {
      if (saved) {
        setCity(saved);
        loadWeather(saved.latitude, saved.longitude);
      }
    });
  }, []);

  async function loadWeather(lat: number, lon: number) {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function onQueryChange(text: string) {
    setQuery(text);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) return;
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchCity(text, locale.startsWith('de') ? 'de' : 'en');
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function onSelectCity(result: GeoResult) {
    const saved: SavedCity = {
      name: result.name,
      country: result.country,
      admin1: result.admin1,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setCity(saved);
    saveCity(saved);
    setQuery('');
    setSuggestions([]);
    loadWeather(result.latitude, result.longitude);
  }

  const showSuggestions = suggestions.length > 0 || searchLoading;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <ThemedText type="title">{t('weather.title')}</ThemedText>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: inputBg }]}>
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder={t('weather.searchPlaceholder')}
            placeholderTextColor={iconColor}
            value={query}
            onChangeText={onQueryChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchLoading && <ActivityIndicator size="small" color={iconColor} style={styles.searchSpinner} />}
        </View>

        {showSuggestions && (
          <View style={[styles.suggestions, { backgroundColor: cardBg }]}>
            {suggestions.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={() => onSelectCity(item)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.suggestionName}>{item.name}</ThemedText>
                <ThemedText style={styles.suggestionSub}>
                  {[item.admin1, item.country].filter(Boolean).join(', ')}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* States */}
        {!city && !loading && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.hint}>{t('weather.noCity')}</ThemedText>
          </View>
        )}

        {city && loading && (
          <View style={[styles.card, styles.centerCard, { backgroundColor: cardBg }]}>
            <ActivityIndicator size="large" color={tint} />
            <ThemedText style={styles.hint}>{t('weather.loading')}</ThemedText>
          </View>
        )}

        {city && error && !loading && (
          <View style={[styles.card, styles.centerCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.hint}>{t('weather.error')}</ThemedText>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: tint }]}
              onPress={() => city && loadWeather(city.latitude, city.longitude)}
            >
              <ThemedText style={[styles.retryText, { color: tint }]}>{t('weather.retry')}</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {weather && city && !loading && !error && (
          <>
            {/* Current weather */}
            <View style={[styles.card, styles.currentCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.cityName}>
                {city.name}{city.country ? `, ${city.country}` : ''}
              </ThemedText>
              <View style={styles.currentMain}>
                <ThemedText style={styles.weatherEmoji}>
                  {weatherEmoji(weather.current.weatherCode)}
                </ThemedText>
                <ThemedText style={styles.currentTemp}>
                  {Math.round(weather.current.temperature)}°
                </ThemedText>
              </View>
              <View style={styles.currentStats}>
                <StatItem label={t('weather.feelsLike')} value={`${Math.round(weather.current.apparentTemperature)}°`} />
                <StatItem label={t('weather.humidity')} value={`${weather.current.humidity}%`} />
                <StatItem label={t('weather.wind')} value={`${Math.round(weather.current.windSpeed)} km/h`} />
              </View>
            </View>

            {/* Hourly */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {t('weather.hourly')}
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
                <View style={styles.hourlyRow}>
                  {weather.hourly.map((item, i) => (
                    <View key={i} style={styles.hourlyItem}>
                      <ThemedText style={styles.hourlyTime}>{formatHour(item.time)}</ThemedText>
                      <ThemedText style={styles.hourlyEmoji}>{weatherEmoji(item.weatherCode)}</ThemedText>
                      <ThemedText style={styles.hourlyTemp}>{Math.round(item.temperature)}°</ThemedText>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 7-day */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {t('weather.sevenDay')}
              </ThemedText>
              <View style={styles.dailyList}>
                {weather.daily.map((item, i) => (
                  <DailyRow
                    key={i}
                    item={item}
                    label={formatDay(item.date, t('weather.today'), locale)}
                    isLast={i === weather.daily.length - 1}
                    separatorColor={inputBg}
                  />
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

function DailyRow({
  item,
  label,
  isLast,
  separatorColor,
}: {
  item: DailyItem;
  label: string;
  isLast: boolean;
  separatorColor: string;
}) {
  return (
    <View style={[styles.dailyRow, !isLast && { borderBottomWidth: 1, borderBottomColor: separatorColor }]}>
      <ThemedText style={styles.dailyDay}>{label}</ThemedText>
      <ThemedText style={styles.dailyEmoji}>{weatherEmoji(item.weatherCode)}</ThemedText>
      <View style={styles.dailyRight}>
        {item.precipitationProbability > 0 && (
          <ThemedText style={styles.dailyPrecip}>
            💧 {item.precipitationProbability}%
          </ThemedText>
        )}
        <ThemedText style={styles.dailyMinMax}>
          {Math.round(item.minTemp)}° / {Math.round(item.maxTemp)}°
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { marginBottom: 4 },
  hint: { opacity: 0.45, fontStyle: 'italic', fontSize: 14, textAlign: 'center' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },
  searchSpinner: { marginLeft: 8 },

  suggestions: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: -8,
  },
  suggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  suggestionName: { fontSize: 15, fontWeight: '500' },
  suggestionSub: { fontSize: 13, opacity: 0.5 },

  card: { borderRadius: 14, padding: 16, gap: 12 },
  centerCard: { alignItems: 'center', gap: 12 },

  retryBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { fontWeight: '600' },

  currentCard: { alignItems: 'center' },
  cityName: { fontSize: 16, opacity: 0.6 },
  currentMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weatherEmoji: { fontSize: 56 },
  currentTemp: { fontSize: 72, fontWeight: '200', letterSpacing: -4 },
  currentStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 4 },
  statItem: { alignItems: 'center', gap: 2 },
  statLabel: { fontSize: 12, opacity: 0.5 },
  statValue: { fontSize: 14, fontWeight: '600' },

  sectionTitle: { marginBottom: 4 },
  hourlyScroll: { marginHorizontal: -4 },
  hourlyRow: { flexDirection: 'row', gap: 4 },
  hourlyItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  hourlyTime: { fontSize: 12, opacity: 0.5 },
  hourlyEmoji: { fontSize: 22 },
  hourlyTemp: { fontSize: 14, fontWeight: '500' },

  dailyList: { gap: 0 },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  dailyDay: { width: 52, fontSize: 14, fontWeight: '500' },
  dailyEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  dailyRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  dailyPrecip: { fontSize: 13, opacity: 0.55 },
  dailyMinMax: { fontSize: 14, fontWeight: '500', minWidth: 72, textAlign: 'right' },
});
