"use client";

import { useEffect, useState } from "react";
import TabTip from "@/components/TabTip";
import { getWeatherInfo } from "@/lib/weather";

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
  time: string; // "2026-04-28T14:00"
  temperature: number;
  weathercode: number;
  precipProb: number;
  windspeed: number;
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Hoje";
  if (date.getTime() === tomorrow.getTime()) return "Amanhã";

  const name = date.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getHoursForDate(date: string, hourly: HourlyData[]): HourlyData[] {
  return hourly.filter((h) => h.time.startsWith(date));
}

export default function Weather() {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=39.36&longitude=-9.16&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&timezone=Europe/Lisbon&forecast_days=7"
        );
        const data = await res.json();

        setCurrent({
          temperature: Math.round(data.current.temperature_2m),
          windspeed: Math.round(data.current.wind_speed_10m),
          weathercode: data.current.weather_code,
        });

        const days: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          weathercode: data.daily.weather_code[i],
          precipProb: data.daily.precipitation_probability_max[i],
        }));
        setDaily(days);

        const hours: HourlyData[] = data.hourly.time.map((time: string, i: number) => ({
          time,
          temperature: Math.round(data.hourly.temperature_2m[i]),
          weathercode: data.hourly.weather_code[i],
          precipProb: data.hourly.precipitation_probability[i],
          windspeed: Math.round(data.hourly.wind_speed_10m[i]),
        }));
        setHourly(hours);
      } catch {
        setError("Sem ligação");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-pink-300 animate-pulse-soft">
          <div className="text-3xl mb-2">🌤️</div>
          <p className="text-sm">A ver o tempo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-pink-300">
          <div className="text-3xl mb-2">😢</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentInfo = current ? getWeatherInfo(current.weathercode) : null;
  const todayDate = new Date().toISOString().split("T")[0];
  const todayHours = getHoursForDate(todayDate, hourly).filter((h) => {
    const hour = parseInt(h.time.split("T")[1].split(":")[0]);
    const currentHour = new Date().getHours();
    return hour >= currentHour;
  });

  return (
    <div className="flex flex-col h-full">
      <TabTip tabId="weather" emoji="🌤️" titleKey="tutorial.weather.title" tips={["tutorial.weather.tip1", "tutorial.weather.tip2"]} />
      {/* Current weather */}
      <div className="p-6 bg-white/60 backdrop-blur-sm border-b border-pink-100/40 animate-fade-in-up">
        <p className="text-xs text-pink-400 font-medium mb-3 uppercase tracking-wider">
          📍 Óbidos — agora
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
          <div className="text-right">
            <p className="text-xs text-pink-400">
              💨 {current?.windspeed} km/h
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Today's hourly forecast */}
        {todayHours.length > 0 && (
          <>
            <p className="text-xs text-pink-400 font-medium uppercase tracking-wider pb-1">
              Hoje — hora a hora
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {todayHours.map((h) => {
                const info = getWeatherInfo(h.weathercode);
                const hour = h.time.split("T")[1].substring(0, 5);
                return (
                  <div
                    key={h.time}
                    className="flex-shrink-0 flex flex-col items-center bg-white/70 backdrop-blur-sm rounded-2xl px-3 py-2.5 border border-pink-100/30 shadow-sm shadow-pink-100/30 min-w-[60px]"
                  >
                    <span className="text-[11px] text-pink-400 font-medium">{hour}</span>
                    <span className="text-lg my-1">{info.emoji}</span>
                    <span className="text-sm font-semibold text-rose-700">{h.temperature}°</span>
                    {h.precipProb > 0 && (
                      <span className="text-[9px] text-blue-400 mt-0.5">💧{h.precipProb}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 7-day forecast */}
        <p className="text-xs text-pink-400 font-medium uppercase tracking-wider pb-1 pt-2">
          Próximos dias
        </p>
        {daily.filter((day) => day.date !== todayDate).map((day) => {
          const info = getWeatherInfo(day.weathercode);
          const isExpanded = expandedDay === day.date;
          const dayHours = getHoursForDate(day.date, hourly);

          return (
            <div key={day.date}>
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                className={`w-full flex items-center bg-white/70 backdrop-blur-sm rounded-2xl p-3.5 border border-pink-100/30 shadow-sm shadow-pink-100/30 text-left transition-all active:scale-[0.98] ${isExpanded ? "rounded-b-none border-b-0 shadow-none" : ""}`}
              >
                <span className="text-sm font-medium text-rose-600 w-16">
                  {getDayName(day.date)}
                </span>
                <span className="text-xl mx-2">{info.emoji}</span>
                <span className="flex-1 text-xs text-pink-400 truncate">
                  {info.label}
                </span>
                {day.precipProb > 0 && (
                  <span className="text-[10px] text-blue-400 mr-2">
                    💧{day.precipProb}%
                  </span>
                )}
                <div className="text-right w-16">
                  <span className="text-sm font-semibold text-rose-700">{day.tempMax}°</span>
                  <span className="text-xs text-pink-300 ml-1">{day.tempMin}°</span>
                </div>
                <span className={`text-pink-300 text-xs ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
              </button>

              {/* Expanded hourly for non-today days */}
              {isExpanded && dayHours.length > 0 && (
                <div className="bg-white/50 backdrop-blur-sm rounded-b-2xl border border-t-0 border-pink-100/30 shadow-sm shadow-pink-100/30 p-3 overflow-hidden animate-expand">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {dayHours.map((h) => {
                      const hInfo = getWeatherInfo(h.weathercode);
                      const hour = h.time.split("T")[1].substring(0, 5);
                      return (
                        <div
                          key={h.time}
                          className="flex-shrink-0 flex flex-col items-center bg-white/80 rounded-xl px-2.5 py-2 min-w-[56px]"
                        >
                          <span className="text-[10px] text-pink-400 font-medium">{hour}</span>
                          <span className="text-base my-0.5">{hInfo.emoji}</span>
                          <span className="text-xs font-semibold text-rose-700">{h.temperature}°</span>
                          {h.precipProb > 0 && (
                            <span className="text-[8px] text-blue-400 mt-0.5">💧{h.precipProb}%</span>
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
    </div>
  );
}
