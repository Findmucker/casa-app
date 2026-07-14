import {
  addWeatherFavorite,
  MAX_WEATHER_FAVORITES,
  normalizeWeatherPreferences,
  removeWeatherFavorite,
  resolveDefaultWeatherLocation,
  type WeatherPreferences,
} from "@/lib/weather-preferences";
import type { WeatherLocation } from "@/lib/weather-location";

function location(index: number): WeatherLocation {
  return {
    id: `place-${index}`,
    latitude: 40 + index / 100,
    longitude: -8 - index / 100,
    name: `Place ${index}`,
    label: `Place ${index} · Portugal`,
    timezone: "Europe/Lisbon",
    source: "geocoding",
    isFallback: false,
    country: "Portugal",
  };
}

describe("weather preferences", () => {
  it("normalizes duplicates, invalid values, and the maximum favorite count", () => {
    const favorites = Array.from(
      { length: MAX_WEATHER_FAVORITES + 3 },
      (_, index) => location(index)
    );
    const normalized = normalizeWeatherPreferences({
      defaultMode: "favorite",
      defaultFavoriteId: "place-2",
      favorites: [favorites[0], favorites[0], ...favorites.slice(1), { bad: true }],
    });

    expect(normalized.favorites).toHaveLength(MAX_WEATHER_FAVORITES);
    expect(new Set(normalized.favorites.map(({ id }) => id)).size).toBe(
      MAX_WEATHER_FAVORITES
    );
    expect(resolveDefaultWeatherLocation(normalized).id).toBe("place-2");
  });

  it("falls back when the configured favorite no longer exists", () => {
    const normalized = normalizeWeatherPreferences({
      defaultMode: "favorite",
      defaultFavoriteId: "missing",
      favorites: [location(1)],
    });

    expect(normalized.defaultMode).toBe("fallback");
    expect(resolveDefaultWeatherLocation(normalized).source).toBe("fallback");
  });

  it("deduplicates additions and enforces the favorite limit", () => {
    let preferences: WeatherPreferences = {
      defaultMode: "fallback",
      favorites: [],
    };
    preferences = addWeatherFavorite(preferences, location(0));
    expect(addWeatherFavorite(preferences, location(0))).toBe(preferences);

    for (let index = 1; index < MAX_WEATHER_FAVORITES; index += 1) {
      preferences = addWeatherFavorite(preferences, location(index));
    }
    expect(addWeatherFavorite(preferences, location(99))).toBe(preferences);
  });

  it("removing the default favorite returns to the fallback", () => {
    const favorite = location(1);
    const next = removeWeatherFavorite(
      {
        defaultMode: "favorite",
        defaultFavoriteId: favorite.id,
        favorites: [favorite],
      },
      favorite.id
    );

    expect(next).toEqual({ defaultMode: "fallback", favorites: [] });
  });
});
