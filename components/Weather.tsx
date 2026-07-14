"use client";

import { useEffect, useState } from "react";
import TabTip from "@/components/TabTip";
import WeatherLocationPicker from "@/components/WeatherLocationPicker";
import { useWeatherLocation } from "@/components/WeatherLocationProvider";
import { useT } from "@/lib/i18n";
import { getWeatherInfo } from "@/lib/weather";
import {
  dateKeyInTimeZone,
  hourInTimeZone,
} from "@/lib/weather-location";

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weathercode: number;
  precipProb: number;
}

interface HourlyData {
  time: string;
  temperature: number;
  weathercode: number;
  precipProb: number;
  windspeed: number;
}

interface WeatherApiResponse {
  timezone?: string;
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
  };
}

function getDayName(
  dateKey: string,
  todayKey: string,
  locale: "pt" | "en"
): string {
  if (dateKey === todayKey) return locale === "en" ? "Today" : "Hoje";

  const today = new Date(`${todayKey}T00:00:00Z`);
  const date = new Date(`${dateKey}T00:00:00Z`);
  const difference = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (difference === 1) return locale === "en" ? "Tomorrow" : "Amanhã";

  const name = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pt-PT", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date).replace(".", "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getHoursForDate(date: string, hourly: HourlyData[]): HourlyData[] {
  return hourly.filter((hour) => hour.time.startsWith(date));
}

export default function Weather() {
  const { t, locale } = useT();
  const { activeLocation, fetchForecast } = useWeatherLocation();
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [forecastTimezone, setForecastTimezone] = useState(activeLocation.timezone);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestGeneration = 0;

    const loadWeather = async () => {
      const generation = ++requestGeneration;
      setLoading(true);
      try {
        const result = await fetchForecast<WeatherApiResponse>({
          current: "temperature_2m,wind_speed_10m,weather_code",
          daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
          hourly: "temperature_2m,weather_code,precipitation_probability,wind_speed_10m",
          forecast_days: 7,
        });
        if (cancelled || generation !== requestGeneration) return;
        const data = result.data;

        setCurrent({
          temperature: Math.round(data.current.temperature_2m),
          windspeed: Math.round(data.current.wind_speed_10m),
          weathercode: data.current.weather_code,
        });
        setDaily(data.daily.time.map((date, index) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          weathercode: data.daily.weather_code[index],
          precipProb: data.daily.precipitation_probability_max[index],
        })));
        setHourly(data.hourly.time.map((time, index) => ({
          time,
          temperature: Math.round(data.hourly.temperature_2m[index]),
          weathercode: data.hourly.weather_code[index],
          precipProb: data.hourly.precipitation_probability[index],
          windspeed: Math.round(data.hourly.wind_speed_10m[index]),
        })));
        setForecastTimezone(data.timezone || activeLocation.timezone);
        setStale(result.isStale);
        setError(false);
      } catch {
        if (!cancelled && generation === requestGeneration) setError(true);
      } finally {
        if (!cancelled && generation === requestGeneration) setLoading(false);
      }
    };

    void loadWeather();
    const interval = window.setInterval(() => void loadWeather(), 30 * 60 * 1_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeLocation.id, activeLocation.timezone, fetchForecast]);

  const currentInfo = current ? getWeatherInfo(current.weathercode) : null;
  const todayDate = dateKeyInTimeZone(new Date(), forecastTimezone, locale);
  const currentHour = hourInTimeZone(new Date(), forecastTimezone);
  const todayHours = getHoursForDate(todayDate, hourly).filter((item) => {
    const hour = Number(item.time.split("T")[1]?.split(":")[0]);
    return hour >= currentHour;
  });

  return (
    <div className="relative isolate flex h-full flex-col">
      <TabTip
        tabId="weather"
        emoji="🌤️"
        titleKey="tutorial.weather.title"
        tips={["tutorial.weather.tip1", "tutorial.weather.tip2"]}
      />

      <div className="relative z-50 border-b border-pink-100/40 bg-white/60 p-4 backdrop-blur-sm">
        <WeatherLocationPicker />
      </div>

      {loading && !current ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-pink-300 animate-pulse-soft">
            <div className="mb-2 text-3xl">🌤️</div>
            <p className="text-sm">{t("weather.loading")}</p>
          </div>
        </div>
      ) : error && !current ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-pink-300">
            <div className="mb-2 text-3xl">😢</div>
            <p className="text-sm">{t("weather.offline")}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="animate-fade-in-up border-b border-pink-100/40 bg-white/60 p-6 backdrop-blur-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-pink-400">
              {t("weather.now")}
              {stale && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-700">
                  {t("weather.cached")}
                </span>
              )}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{currentInfo?.emoji}</span>
                <div>
                  <p className="text-4xl font-bold text-rose-700">
                    {current?.temperature}°
                  </p>
                  <p className="text-sm text-rose-500">{currentInfo?.label}</p>
                </div>
              </div>
              <p className="text-xs text-pink-400">
                💨 {current?.windspeed} km/h
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {todayHours.length > 0 && (
              <>
                <p className="pb-1 text-xs font-medium uppercase tracking-wider text-pink-400">
                  {t("weather.todayHourly")}
                </p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-hide">
                  {todayHours.map((item) => {
                    const info = getWeatherInfo(item.weathercode);
                    const hour = item.time.split("T")[1].substring(0, 5);
                    return (
                      <div
                        key={item.time}
                        className="min-w-[60px] flex-shrink-0 rounded-2xl border border-pink-100/30 bg-white/70 px-3 py-2.5 text-center shadow-sm backdrop-blur-sm"
                      >
                        <span className="text-[11px] font-medium text-pink-400">{hour}</span>
                        <span className="my-1 block text-lg">{info.emoji}</span>
                        <span className="text-sm font-semibold text-rose-700">{item.temperature}°</span>
                        {item.precipProb > 0 && (
                          <span className="mt-0.5 block text-[9px] text-blue-400">💧{item.precipProb}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <p className="pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-pink-400">
              {t("weather.nextDays")}
            </p>
            {daily.filter((day) => day.date !== todayDate).map((day) => {
              const info = getWeatherInfo(day.weathercode);
              const expanded = expandedDay === day.date;
              const dayHours = getHoursForDate(day.date, hourly);

              return (
                <div key={day.date}>
                  <button
                    type="button"
                    onClick={() => setExpandedDay(expanded ? null : day.date)}
                    aria-expanded={expanded}
                    className={`w-full rounded-2xl border border-pink-100/30 bg-white/70 p-3.5 text-left shadow-sm transition-all active:scale-[0.98] ${expanded ? "rounded-b-none border-b-0 shadow-none" : ""}`}
                  >
                    <div className="flex items-center">
                      <span className="w-20 text-sm font-medium text-rose-600">
                        {getDayName(day.date, todayDate, locale)}
                      </span>
                      <span className="mx-2 text-xl">{info.emoji}</span>
                      <span className="flex-1 truncate text-xs text-pink-400">{info.label}</span>
                      {day.precipProb > 0 && (
                        <span className="mr-2 text-[10px] text-blue-400">💧{day.precipProb}%</span>
                      )}
                      <span className="w-16 text-right">
                        <span className="text-sm font-semibold text-rose-700">{day.tempMax}°</span>
                        <span className="ml-1 text-xs text-pink-300">{day.tempMin}°</span>
                      </span>
                      <span aria-hidden="true" className={`ml-2 text-xs text-pink-300 transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </button>

                  {expanded && dayHours.length > 0 && (
                    <div className="overflow-hidden rounded-b-2xl border border-t-0 border-pink-100/30 bg-white/50 p-3 shadow-sm animate-expand">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {dayHours.map((item) => {
                          const infoForHour = getWeatherInfo(item.weathercode);
                          return (
                            <div key={item.time} className="min-w-[56px] flex-shrink-0 rounded-xl bg-white/80 px-2.5 py-2 text-center">
                              <span className="text-[10px] font-medium text-pink-400">{item.time.split("T")[1].substring(0, 5)}</span>
                              <span className="my-0.5 block text-base">{infoForHour.emoji}</span>
                              <span className="text-xs font-semibold text-rose-700">{item.temperature}°</span>
                              {item.precipProb > 0 && (
                                <span className="mt-0.5 block text-[8px] text-blue-400">💧{item.precipProb}%</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
