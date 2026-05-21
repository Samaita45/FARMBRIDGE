import { CACHE_TTL, getCached, getStaleCached, setCached } from './cacheService';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  minTemp: number;
  maxTemp: number;
  rainProbability: number;
  rainAmount: number;
  condition: string;
  icon: string;
}

export interface RainForecast {
  nextRainDate: string | null;
  daysUntil: number | null;
  amount: number;
}

export interface AgriculturalWeather {
  soilTemperature: number;
  soilMoisture: number;
  insight: string;
}

export interface WeatherBundle {
  current: CurrentWeather;
  daily: DailyForecast[];
  rain: RainForecast;
  agricultural: AgriculturalWeather;
}

function mapWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear sky', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly cloudy', icon: '⛅' };
  if (code <= 48) return { condition: 'Foggy', icon: '🌫️' };
  if (code <= 57) return { condition: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { condition: 'Rain', icon: '🌧️' };
  if (code <= 77) return { condition: 'Snow', icon: '❄️' };
  if (code <= 82) return { condition: 'Showers', icon: '🌧️' };
  if (code <= 86) return { condition: 'Snow showers', icon: '🌨️' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Cloudy', icon: '☁️' };
}

function getFarmingInsight(
  current: CurrentWeather,
  rainProb: number,
  soilMoisture: number
): string {
  if (current.precipitation > 2) return 'Avoid spraying today — rain expected.';
  if (rainProb > 60) return 'Good day to prepare drainage; rain likely soon.';
  if (soilMoisture < 0.2) return 'Soil is dry — consider irrigation for young crops.';
  if (current.humidity > 85) return 'High humidity — watch for fungal diseases.';
  if (current.windSpeed > 25) return 'Strong winds — secure greenhouse covers.';
  return 'Good conditions for field work and light spraying.';
}

async function fetchForecast(lat: number, lon: number): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'Africa/Harare',
    forecast_days: '7',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'precipitation',
      'weather_code',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
    ].join(','),
    hourly: 'soil_temperature_0cm,soil_moisture_0_to_1cm',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Weather service unavailable');

  const json = await res.json();
  const { current, daily, hourly } = json;

  const mapped = mapWeatherCode(current.weather_code);
  const currentWeather: CurrentWeather = {
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    precipitation: current.precipitation ?? 0,
    condition: mapped.condition,
    icon: mapped.icon,
  };

  const dailyForecast: DailyForecast[] = daily.time.map((date: string, i: number) => {
    const w = mapWeatherCode(daily.weather_code[i]);
    return {
      date,
      minTemp: Math.round(daily.temperature_2m_min[i]),
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      rainProbability: daily.precipitation_probability_max[i] ?? 0,
      rainAmount: daily.precipitation_sum[i] ?? 0,
      condition: w.condition,
      icon: w.icon,
    };
  });

  let nextRainDate: string | null = null;
  let daysUntil: number | null = null;
  for (let i = 0; i < dailyForecast.length; i++) {
    if (dailyForecast[i].rainProbability >= 40 || dailyForecast[i].rainAmount > 1) {
      nextRainDate = dailyForecast[i].date;
      daysUntil = i;
      break;
    }
  }

  const soilTemp = hourly?.soil_temperature_0cm?.[0] ?? 22;
  const soilMoisture = hourly?.soil_moisture_0_to_1cm?.[0] ?? 0.3;

  return {
    current: currentWeather,
    daily: dailyForecast,
    rain: {
      nextRainDate,
      daysUntil,
      amount: daysUntil !== null ? dailyForecast[daysUntil].rainAmount : 0,
    },
    agricultural: {
      soilTemperature: Math.round(soilTemp),
      soilMoisture,
      insight: getFarmingInsight(
        currentWeather,
        dailyForecast[0]?.rainProbability ?? 0,
        soilMoisture
      ),
    },
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherBundle> {
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = await getCached<WeatherBundle>(cacheKey, CACHE_TTL.weather);
  if (cached) return cached;

  try {
    const data = await fetchForecast(lat, lon);
    await setCached(cacheKey, data);
    return data;
  } catch {
    const stale = await getStaleCached<WeatherBundle>(cacheKey);
    if (stale) return stale;
    return getOfflineFallback();
  }
}

function getOfflineFallback(): WeatherBundle {
  const mapped = mapWeatherCode(1);
  return {
    current: {
      temp: 24,
      feelsLike: 24,
      humidity: 55,
      windSpeed: 8,
      precipitation: 0,
      condition: mapped.condition,
      icon: mapped.icon,
    },
    daily: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        minTemp: 14,
        maxTemp: 26,
        rainProbability: i === 2 ? 65 : 20,
        rainAmount: i === 2 ? 8 : 0,
        condition: 'Partly cloudy',
        icon: '⛅',
      };
    }),
    rain: { nextRainDate: null, daysUntil: 2, amount: 8 },
    agricultural: {
      soilTemperature: 22,
      soilMoisture: 0.28,
      insight: 'Offline data — connect to refresh live weather.',
    },
  };
}

export const getCurrentWeather = async (lat: number, lon: number) =>
  (await getWeather(lat, lon)).current;

export const getWeekForecast = async (lat: number, lon: number) =>
  (await getWeather(lat, lon)).daily;

export const getRainForecast = async (lat: number, lon: number) =>
  (await getWeather(lat, lon)).rain;

export const getAgriculturalWeather = async (lat: number, lon: number) =>
  (await getWeather(lat, lon)).agricultural;
