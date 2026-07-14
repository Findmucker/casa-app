"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useWeatherLocation } from "@/components/WeatherLocationProvider";
import type { WeatherLocation } from "@/lib/weather-location";

function weatherErrorMessage(
  code: string | null,
  t: ReturnType<typeof useT>["t"]
): string | null {
  switch (code) {
    case "location-denied":
      return t("weather.location.errorDenied");
    case "location-unavailable":
      return t("weather.location.errorUnavailable");
    case "search-failed":
      return t("weather.location.errorSearch");
    case "favorite-limit":
      return t("weather.location.errorLimit");
    case "preferences-load":
      return t("weather.location.errorLoad");
    case "preferences-save":
      return t("weather.location.errorSave");
    default:
      return null;
  }
}

export default function WeatherLocationPicker() {
  const { t } = useT();
  const {
    activeLocation,
    favorites,
    permissionState,
    loadingPreferences,
    locating,
    errorCode,
    maxFavorites,
    searchLocations,
    selectLocation,
    selectFavorite,
    selectFallback,
    useCurrentLocation,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearError,
  } = useWeatherLocation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchLocations(normalized).then((locations) => {
        if (cancelled) return;
        setResults(locations);
        setSearching(false);
        setSearched(true);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, searchLocations]);

  const activeLabel = activeLocation.source === "current"
    ? t("weather.location.current")
    : activeLocation.label;
  const errorMessage = weatherErrorMessage(errorCode, t);

  const chooseTemporary = (location: WeatherLocation) => {
    selectLocation(location);
    setOpen(false);
  };

  const chooseFavorite = async (location: WeatherLocation) => {
    await selectFavorite(location);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          clearError();
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="min-h-11 w-full rounded-2xl border border-pink-100/50 bg-white/75 px-3 py-2 text-left shadow-sm transition-all active:scale-[0.99]"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-pink-400">
          {t("weather.location.active")}
        </span>
        <span className="flex items-center justify-between gap-2 text-sm font-semibold text-rose-700">
          <span className="truncate">📍 {activeLabel}</span>
          <span aria-hidden="true" className="text-pink-300">⌄</span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("weather.location.dialog")}
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[65vh] overflow-y-auto rounded-3xl border border-pink-100 bg-rose-50/95 p-3 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-700">
              {t("weather.location.dialog")}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("common.close")}
              className="flex h-11 w-11 items-center justify-center rounded-full text-pink-400 hover:bg-pink-100"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <p role="alert" className="mb-3 rounded-xl bg-amber-50 p-2 text-xs text-amber-700">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => void useCurrentLocation()}
            disabled={locating}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white p-3 text-left text-sm font-semibold text-rose-700 disabled:opacity-60"
          >
            <span className="text-xl" aria-hidden="true">◎</span>
            <span className="flex-1">
              {locating
                ? t("weather.location.locating")
                : t("weather.location.useCurrent")}
            </span>
          </button>
          {permissionState === "denied" && (
            <p className="mt-1 px-2 text-[11px] text-amber-600">
              {t("weather.location.permissionDenied")}
            </p>
          )}

          <section className="mt-4" aria-labelledby="weather-favorites-title">
            <div className="mb-2 flex items-center justify-between">
              <h4 id="weather-favorites-title" className="text-xs font-bold uppercase tracking-wider text-pink-500">
                {t("weather.location.favorites")}
              </h4>
              <span className="text-[10px] text-pink-400">
                {favorites.length}/{maxFavorites}
              </span>
            </div>

            {loadingPreferences ? (
              <p className="text-xs text-pink-400">{t("common.loading")}</p>
            ) : favorites.length === 0 ? (
              <p className="rounded-xl bg-white/60 p-2 text-xs text-pink-400">
                {t("weather.location.noFavorites")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {favorites.map((location) => (
                  <div key={location.id} className="flex items-center gap-1 rounded-2xl bg-white p-1">
                    <button
                      type="button"
                      onClick={() => void chooseFavorite(location)}
                      className="min-h-11 min-w-0 flex-1 rounded-xl px-2 text-left text-xs font-medium text-rose-700 hover:bg-pink-50"
                    >
                      <span className="block truncate">{location.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFavorite(location.id)}
                      aria-label={`${t("weather.location.removeFavorite")}: ${location.label}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-pink-400 hover:bg-red-50 hover:text-red-500"
                    >
                      ★
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-4" aria-labelledby="weather-search-title">
            <h4 id="weather-search-title" className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-500">
              {t("weather.location.search")}
            </h4>
            <label className="sr-only" htmlFor="weather-location-search">
              {t("weather.location.searchLabel")}
            </label>
            <input
              id="weather-location-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("weather.location.searchPlaceholder")}
              autoComplete="off"
              className="min-h-11 w-full rounded-2xl border border-pink-200 bg-white px-3 text-sm text-rose-800 outline-none focus:border-rose-400"
            />

            <div aria-live="polite" className="mt-2">
              {searching && (
                <p className="text-xs text-pink-400">{t("weather.location.searching")}</p>
              )}
              {!searching && searched && results.length === 0 && (
                <p className="text-xs text-pink-400">{t("weather.location.noResults")}</p>
              )}
            </div>

            {results.length > 0 && (
              <ul className="mt-2 space-y-1.5" aria-label={t("weather.location.results")}>
                {results.map((location) => {
                  const favorite = isFavorite(location.id);
                  return (
                    <li key={location.id} className="flex items-center gap-1 rounded-2xl bg-white p-1">
                      <button
                        type="button"
                        onClick={() => chooseTemporary(location)}
                        className="min-h-11 min-w-0 flex-1 rounded-xl px-2 text-left text-xs text-rose-700 hover:bg-pink-50"
                      >
                        <span className="block truncate font-semibold">{location.name}</span>
                        <span className="block truncate text-[10px] text-pink-400">
                          {[location.admin1, location.country].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => favorite
                          ? void removeFavorite(location.id)
                          : void addFavorite(location)}
                        aria-pressed={favorite}
                        aria-label={`${favorite ? t("weather.location.removeFavorite") : t("weather.location.addFavorite")}: ${location.label}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-amber-500 hover:bg-amber-50"
                      >
                        {favorite ? "★" : "☆"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <button
            type="button"
            onClick={() => {
              void selectFallback();
              setOpen(false);
            }}
            className="mt-4 min-h-11 w-full rounded-2xl px-3 text-xs font-medium text-pink-500 hover:bg-pink-100"
          >
            {t("weather.location.useDefault")}
          </button>
        </div>
      )}
    </div>
  );
}
