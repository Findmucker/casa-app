import {
  DEFAULT_WEATHER_LOCATION,
  type WeatherLocation,
} from "@/lib/weather-location";

export const MAX_WEATHER_FAVORITES = 10;

export interface WeatherPreferences {
  defaultMode: "current" | "favorite" | "fallback";
  defaultFavoriteId?: string;
  favorites: WeatherLocation[];
}

export const DEFAULT_WEATHER_PREFERENCES: WeatherPreferences = {
  defaultMode: "fallback",
  favorites: [],
};

function isFavoriteLocation(value: unknown): value is WeatherLocation {
  if (!value || typeof value !== "object") return false;
  const location = value as Partial<WeatherLocation>;
  return (
    location.source === "geocoding"
    && typeof location.id === "string"
    && typeof location.name === "string"
    && typeof location.label === "string"
    && typeof location.timezone === "string"
    && Number.isFinite(location.latitude)
    && Number.isFinite(location.longitude)
  );
}

export function normalizeWeatherPreferences(value: unknown): WeatherPreferences {
  if (!value || typeof value !== "object") return DEFAULT_WEATHER_PREFERENCES;
  const raw = value as Partial<WeatherPreferences>;
  const favorites: WeatherLocation[] = [];
  const seen = new Set<string>();

  if (Array.isArray(raw.favorites)) {
    for (const location of raw.favorites) {
      if (!isFavoriteLocation(location) || seen.has(location.id)) continue;
      seen.add(location.id);
      favorites.push({ ...location, isFallback: false });
      if (favorites.length === MAX_WEATHER_FAVORITES) break;
    }
  }

  const defaultFavoriteId = typeof raw.defaultFavoriteId === "string"
    && favorites.some((location) => location.id === raw.defaultFavoriteId)
    ? raw.defaultFavoriteId
    : undefined;

  if (raw.defaultMode === "current") {
    return { defaultMode: "current", favorites };
  }
  if (raw.defaultMode === "favorite" && defaultFavoriteId) {
    return { defaultMode: "favorite", defaultFavoriteId, favorites };
  }
  return { defaultMode: "fallback", favorites };
}

export function addWeatherFavorite(
  preferences: WeatherPreferences,
  location: WeatherLocation
): WeatherPreferences {
  if (location.source !== "geocoding") return preferences;
  if (preferences.favorites.some((favorite) => favorite.id === location.id)) {
    return preferences;
  }
  if (preferences.favorites.length >= MAX_WEATHER_FAVORITES) return preferences;
  return {
    ...preferences,
    favorites: [...preferences.favorites, { ...location, isFallback: false }],
  };
}

export function removeWeatherFavorite(
  preferences: WeatherPreferences,
  id: string
): WeatherPreferences {
  const favorites = preferences.favorites.filter((location) => location.id !== id);
  if (preferences.defaultMode === "favorite" && preferences.defaultFavoriteId === id) {
    return { defaultMode: "fallback", favorites };
  }
  return { ...preferences, favorites };
}

export function resolveDefaultWeatherLocation(
  preferences: WeatherPreferences
): WeatherLocation {
  if (preferences.defaultMode === "favorite") {
    return preferences.favorites.find(
      (location) => location.id === preferences.defaultFavoriteId
    ) ?? DEFAULT_WEATHER_LOCATION;
  }
  return DEFAULT_WEATHER_LOCATION;
}
