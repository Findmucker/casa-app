"use client";

export type WeatherLocationSource = "current" | "geocoding" | "fallback";
export type GeolocationPermissionState = PermissionState | "unsupported";

export interface WeatherLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  label: string;
  timezone: string;
  source: WeatherLocationSource;
  isFallback: boolean;
  admin1?: string;
  country?: string;
  countryCode?: string;
}

interface GeocodingApiResult {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country?: string;
  country_code?: string;
  timezone?: string;
}

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  id: "fallback-obidos-pt",
  latitude: 39.36,
  longitude: -9.16,
  name: "Óbidos",
  label: "Óbidos",
  timezone: "Europe/Lisbon",
  source: "fallback",
  isFallback: true,
  admin1: "Leiria",
  country: "Portugal",
  countryCode: "PT",
};

export function createWeatherLocationId(
  latitude: number,
  longitude: number,
  timezone: string
): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}@${timezone || "auto"}`;
}

export function formatWeatherLocationLabel(
  name: string,
  admin1?: string,
  country?: string
): string {
  return [name, admin1, country].filter(Boolean).join(" · ");
}

export function weatherLocationFromPosition(
  position: GeolocationPosition
): WeatherLocation {
  const { latitude, longitude } = position.coords;
  return {
    id: "current",
    latitude,
    longitude,
    name: "Current location",
    label: "Current location",
    timezone: "auto",
    source: "current",
    isFallback: false,
  };
}

export function normalizeGeocodingResponse(payload: unknown): WeatherLocation[] {
  if (!payload || typeof payload !== "object") return [];
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  const locations: WeatherLocation[] = [];
  const seen = new Set<string>();

  for (const raw of results as GeocodingApiResult[]) {
    const latitude = Number(raw.latitude);
    const longitude = Number(raw.longitude);
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (
      !name
      || !Number.isFinite(latitude)
      || latitude < -90
      || latitude > 90
      || !Number.isFinite(longitude)
      || longitude < -180
      || longitude > 180
    ) {
      continue;
    }

    const timezone = typeof raw.timezone === "string" && raw.timezone
      ? raw.timezone
      : "auto";
    const id = createWeatherLocationId(latitude, longitude, timezone);
    if (seen.has(id)) continue;
    seen.add(id);

    const admin1 = typeof raw.admin1 === "string" ? raw.admin1 : undefined;
    const country = typeof raw.country === "string" ? raw.country : undefined;
    const countryCode = typeof raw.country_code === "string"
      ? raw.country_code.toUpperCase()
      : undefined;

    locations.push({
      id,
      latitude,
      longitude,
      name,
      label: formatWeatherLocationLabel(name, admin1, country),
      timezone,
      source: "geocoding",
      isFallback: false,
      admin1,
      country,
      countryCode,
    });
  }

  return locations;
}

export function createGeocodingUrl(
  query: string,
  language: "pt" | "en",
  count: number = 8
): string {
  const params = new URLSearchParams({
    name: query.trim(),
    count: String(Math.min(Math.max(count, 1), 10)),
    language,
    format: "json",
  });
  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (
    typeof navigator === "undefined"
    || !navigator.geolocation
    || !navigator.permissions?.query
  ) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unsupported";
  }
}

export function getCurrentWeatherLocation(): Promise<WeatherLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("geolocation-unsupported"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(weatherLocationFromPosition(position)),
      (error) => reject(new Error(`geolocation-${error.code}`)),
      {
        enableHighAccuracy: false,
        timeout: 8_000,
        maximumAge: 30 * 60 * 1_000,
      }
    );
  });
}

export function weatherLocationKey(location: WeatherLocation): string {
  return `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}@${location.timezone || "auto"}`;
}

export function createForecastUrl(
  location: WeatherLocation,
  query: Record<string, string | number>
): string {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone || "auto",
  });

  Object.entries(query)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => params.set(key, String(value)));

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function dateKeyInTimeZone(
  date: Date,
  timezone: string,
  locale: "pt" | "en" = "pt"
): string {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "sv-SE", {
      timeZone: timezone === "auto" ? undefined : timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

export function hourInTimeZone(date: Date, timezone: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone === "auto" ? undefined : timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date));
  } catch {
    return date.getHours();
  }
}
