import {
  createForecastUrl,
  DEFAULT_WEATHER_LOCATION,
  weatherLocationKey,
  type WeatherLocation,
} from "@/lib/weather-location";

describe("weather location helpers", () => {
  const lisbon: WeatherLocation = {
    latitude: 38.7223,
    longitude: -9.1393,
    label: "Localização atual",
    isFallback: false,
  };

  it("builds a forecast URL from the supplied coordinates", () => {
    const url = new URL(createForecastUrl(lisbon, { daily: "weather_code", forecast_days: 7 }));

    expect(url.searchParams.get("latitude")).toBe("38.7223");
    expect(url.searchParams.get("longitude")).toBe("-9.1393");
    expect(url.searchParams.get("timezone")).toBe("Europe/Lisbon");
    expect(url.searchParams.get("daily")).toBe("weather_code");
  });

  it("uses a stable rounded key for location-aware caches", () => {
    expect(weatherLocationKey(lisbon)).toBe("38.722,-9.139");
  });

  it("marks the default location as an explicit fallback", () => {
    expect(DEFAULT_WEATHER_LOCATION.isFallback).toBe(true);
    expect(DEFAULT_WEATHER_LOCATION.label).toContain("predefinição");
  });
});
