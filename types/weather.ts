export type WeatherCondition =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy';

export type CurrentWeather = {
  condition: WeatherCondition;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windKph: number;
  location: string;
  updatedAt: Date;
};

export type HourlyForecast = {
  hour: Date;
  condition: WeatherCondition;
  temperatureCelsius: number;
  precipitationPercent: number;
};

export type DailyForecast = {
  date: Date;
  condition: WeatherCondition;
  minCelsius: number;
  maxCelsius: number;
  precipitationPercent: number;
  isGoodWeather: boolean;
};
