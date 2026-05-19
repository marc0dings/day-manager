import AsyncStorage from '@react-native-async-storage/async-storage';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const STORAGE_KEY = 'weather_saved_city';

export type GeoResult = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export type SavedCity = {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
};

export type HourlyItem = {
  time: string;
  temperature: number;
  weatherCode: number;
};

export type DailyItem = {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  precipitationProbability: number;
};

export type WeatherData = {
  current: CurrentWeather;
  hourly: HourlyItem[];
  daily: DailyItem[];
};

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export async function searchCity(name: string, language = 'de'): Promise<GeoResult[]> {
  const res = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(name)}&count=5&language=${language}`
  );
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results ?? [];
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();

  const now = new Date();
  const currentHour = now.getHours();
  const todayPrefix = now.toISOString().slice(0, 10);
  const hourlyTimes: string[] = data.hourly.time;

  let startIdx = hourlyTimes.findIndex(
    t => t.startsWith(todayPrefix) && parseInt(t.slice(11, 13), 10) >= currentHour
  );
  if (startIdx < 0) startIdx = 0;

  const hourlyItems: HourlyItem[] = hourlyTimes.slice(startIdx, startIdx + 24).map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[startIdx + i],
    weatherCode: data.hourly.weather_code[startIdx + i],
  }));

  const dailyItems: DailyItem[] = (data.daily.time as string[]).map((date, i) => ({
    date,
    maxTemp: data.daily.temperature_2m_max[i],
    minTemp: data.daily.temperature_2m_min[i],
    weatherCode: data.daily.weather_code[i],
    precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
  }));

  return {
    current: {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
    },
    hourly: hourlyItems,
    daily: dailyItems,
  };
}

export async function loadSavedCity(): Promise<SavedCity | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveCity(city: SavedCity): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(city));
}
