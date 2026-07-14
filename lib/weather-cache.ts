import {
  createForecastUrl,
  weatherLocationKey,
  type WeatherLocation,
} from "@/lib/weather-location";

export interface WeatherForecastResult<T = unknown> {
  data: T;
  fetchedAt: number;
  isStale: boolean;
}

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  expiresAt: number;
}

const FORECAST_TTL_MS = 30 * 60 * 1_000;
const forecastCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<WeatherForecastResult>>();

function forecastQueryKey(query: Record<string, string | number>): string {
  return Object.entries(query)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function weatherForecastCacheKey(
  location: WeatherLocation,
  query: Record<string, string | number>
): string {
  return `${weatherLocationKey(location)}|${forecastQueryKey(query)}`;
}

export async function fetchWeatherForecast<T = unknown>(
  location: WeatherLocation,
  query: Record<string, string | number>
): Promise<WeatherForecastResult<T>> {
  const key = weatherForecastCacheKey(location, query);
  const now = Date.now();
  const cached = forecastCache.get(key);

  if (cached && cached.expiresAt > now) {
    return {
      data: cached.data as T,
      fetchedAt: cached.fetchedAt,
      isStale: false,
    };
  }

  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<WeatherForecastResult<T>>;

  const request = (async () => {
    try {
      const response = await fetch(createForecastUrl(location, query));
      if (!response.ok) {
        throw new Error(`Weather request failed (${response.status})`);
      }
      const data = await response.json() as T;
      const fetchedAt = Date.now();
      forecastCache.set(key, {
        data,
        fetchedAt,
        expiresAt: fetchedAt + FORECAST_TTL_MS,
      });
      return { data, fetchedAt, isStale: false };
    } catch (error) {
      if (cached) {
        return {
          data: cached.data as T,
          fetchedAt: cached.fetchedAt,
          isStale: true,
        };
      }
      throw error;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, request);
  return request;
}

export function clearWeatherForecastCache(): void {
  forecastCache.clear();
  inFlightRequests.clear();
}
