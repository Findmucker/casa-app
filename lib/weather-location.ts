"use client";

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
  isFallback: boolean;
}

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  latitude: 39.36,
  longitude: -9.16,
  label: "Óbidos (predefinição)",
  isFallback: true,
};

let cachedLocation: WeatherLocation | null = null;

function fromPosition(position: GeolocationPosition): WeatherLocation {
  const { latitude, longitude } = position.coords;
  return {
    latitude,
    longitude,
    label: `Localização atual (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
    isFallback: false,
  };
}

export function getWeatherLocation(): Promise<WeatherLocation> {
  if (cachedLocation) return Promise.resolve(cachedLocation);
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(DEFAULT_WEATHER_LOCATION);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedLocation = fromPosition(position);
        resolve(cachedLocation);
      },
      () => resolve(DEFAULT_WEATHER_LOCATION),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 10 * 60 * 1_000 }
    );
  });
}

export function watchWeatherLocation(
  onLocation: (location: WeatherLocation) => void
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onLocation(DEFAULT_WEATHER_LOCATION);
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      cachedLocation = fromPosition(position);
      onLocation(cachedLocation);
    },
    () => onLocation(cachedLocation ?? DEFAULT_WEATHER_LOCATION),
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5 * 60 * 1_000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function weatherLocationKey(location: WeatherLocation): string {
  return `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
}

export function createForecastUrl(
  location: WeatherLocation,
  query: Record<string, string | number>
): string {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "Europe/Lisbon",
  });

  Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}
