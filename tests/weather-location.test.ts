import {
  createForecastUrl,
  createGeocodingUrl,
  dateKeyInTimeZone,
  DEFAULT_WEATHER_LOCATION,
  normalizeGeocodingResponse,
  weatherLocationFromPosition,
  weatherLocationKey,
  type WeatherLocation,
} from "@/lib/weather-location";

describe("weather location helpers", () => {
  const lisbon: WeatherLocation = {
    id: "lisbon",
    latitude: 38.7223,
    longitude: -9.1393,
    name: "Lisboa",
    label: "Lisboa · Portugal",
    timezone: "Europe/Lisbon",
    source: "geocoding",
    isFallback: false,
    country: "Portugal",
    countryCode: "PT",
  };

  it("builds a forecast URL from the supplied coordinates and timezone", () => {
    const url = new URL(
      createForecastUrl(lisbon, { daily: "weather_code", forecast_days: 7 })
    );

    expect(url.searchParams.get("latitude")).toBe("38.7223");
    expect(url.searchParams.get("longitude")).toBe("-9.1393");
    expect(url.searchParams.get("timezone")).toBe("Europe/Lisbon");
    expect(url.searchParams.get("daily")).toBe("weather_code");
  });

  it("uses a stable location and timezone cache key", () => {
    expect(weatherLocationKey(lisbon)).toBe(
      "38.722,-9.139@Europe/Lisbon"
    );
  });

  it("normalizes valid, unique geocoding results and omits undefined fields", () => {
    const locations = normalizeGeocodingResponse({
      results: [
        {
          name: " Porto ",
          latitude: 41.1496,
          longitude: -8.6109,
          country: "Portugal",
          country_code: "pt",
          timezone: "Europe/Lisbon",
        },
        {
          name: "Porto duplicate",
          latitude: 41.1496,
          longitude: -8.6109,
          timezone: "Europe/Lisbon",
        },
        { name: "", latitude: 0, longitude: 0 },
        { name: "Invalid", latitude: 100, longitude: 0 },
      ],
    });

    expect(locations).toHaveLength(1);
    expect(locations[0]).toMatchObject({
      name: "Porto",
      countryCode: "PT",
      source: "geocoding",
      isFallback: false,
    });
    expect(locations[0]).not.toHaveProperty("admin1");
  });

  it("creates a localized and bounded geocoding request", () => {
    const url = new URL(createGeocodingUrl("  Vila Nova de Gaia  ", "pt", 99));
    expect(url.hostname).toBe("geocoding-api.open-meteo.com");
    expect(url.searchParams.get("name")).toBe("Vila Nova de Gaia");
    expect(url.searchParams.get("language")).toBe("pt");
    expect(url.searchParams.get("count")).toBe("10");
  });

  it("does not expose coordinates in the current-location label", () => {
    const location = weatherLocationFromPosition({
      coords: { latitude: 40.1, longitude: -8.2 },
    } as GeolocationPosition);

    expect(location.label).toBe("Current location");
    expect(location.label).not.toContain("40.1");
    expect(location.timezone).toBe("auto");
  });

  it("creates date keys in the forecast location timezone", () => {
    const instant = new Date("2026-01-01T00:30:00.000Z");
    expect(dateKeyInTimeZone(instant, "America/New_York", "en")).toBe(
      "2025-12-31"
    );
  });

  it("marks Óbidos as the explicit fallback", () => {
    expect(DEFAULT_WEATHER_LOCATION).toMatchObject({
      id: "fallback-obidos-pt",
      label: "Óbidos",
      timezone: "Europe/Lisbon",
      source: "fallback",
      isFallback: true,
    });
  });
});
