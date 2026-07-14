import {
  clearWeatherForecastCache,
  fetchWeatherForecast,
  weatherForecastCacheKey,
} from "@/lib/weather-cache";
import type { WeatherLocation } from "@/lib/weather-location";

const location: WeatherLocation = {
  id: "porto",
  latitude: 41.1496,
  longitude: -8.6109,
  name: "Porto",
  label: "Porto · Portugal",
  timezone: "Europe/Lisbon",
  source: "geocoding",
  isFallback: false,
};

describe("weather forecast cache", () => {
  beforeEach(() => {
    clearWeatherForecastCache();
    jest.restoreAllMocks();
  });

  it("canonicalizes query order and deduplicates simultaneous requests", async () => {
    let resolveJson: (value: unknown) => void = () => undefined;
    const json = new Promise((resolve) => {
      resolveJson = resolve;
    });
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => json,
    } as Response);

    const first = fetchWeatherForecast(location, {
      daily: "weather_code",
      forecast_days: 7,
    });
    const second = fetchWeatherForecast(location, {
      forecast_days: 7,
      daily: "weather_code",
    });
    resolveJson({ daily: [] });

    await expect(first).resolves.toMatchObject({ data: { daily: [] }, isStale: false });
    await expect(second).resolves.toMatchObject({ data: { daily: [] }, isStale: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      weatherForecastCacheKey(location, { daily: "weather_code", forecast_days: 7 })
    ).toBe(
      weatherForecastCacheKey(location, { forecast_days: 7, daily: "weather_code" })
    );
  });

  it("serves cached data and marks expired data stale when refresh fails", async () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1_000);
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ temperature: 20 }),
    } as Response);

    await expect(fetchWeatherForecast(location, { current: "temperature_2m" }))
      .resolves.toMatchObject({ data: { temperature: 20 }, isStale: false });

    await fetchWeatherForecast(location, { current: "temperature_2m" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000 + 31 * 60 * 1_000);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchWeatherForecast(location, { current: "temperature_2m" }))
      .resolves.toMatchObject({ data: { temperature: 20 }, isStale: true });
  });
});
