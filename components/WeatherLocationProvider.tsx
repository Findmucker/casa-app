"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHouseContext } from "@/lib/context";
import { useT } from "@/lib/i18n";
import {
  createGeocodingUrl,
  DEFAULT_WEATHER_LOCATION,
  getCurrentWeatherLocation,
  getGeolocationPermissionState,
  normalizeGeocodingResponse,
  type GeolocationPermissionState,
  type WeatherLocation,
} from "@/lib/weather-location";
import {
  addWeatherFavorite,
  DEFAULT_WEATHER_PREFERENCES,
  MAX_WEATHER_FAVORITES,
  normalizeWeatherPreferences,
  removeWeatherFavorite,
  resolveDefaultWeatherLocation,
  type WeatherPreferences,
} from "@/lib/weather-preferences";
import {
  fetchWeatherForecast,
  type WeatherForecastResult,
} from "@/lib/weather-cache";

interface WeatherLocationContextValue {
  activeLocation: WeatherLocation;
  favorites: WeatherLocation[];
  permissionState: GeolocationPermissionState;
  loadingPreferences: boolean;
  locating: boolean;
  errorCode: string | null;
  maxFavorites: number;
  searchLocations: (query: string) => Promise<WeatherLocation[]>;
  selectLocation: (location: WeatherLocation) => void;
  selectFavorite: (location: WeatherLocation) => Promise<void>;
  selectFallback: () => Promise<void>;
  useCurrentLocation: () => Promise<void>;
  addFavorite: (location: WeatherLocation) => Promise<boolean>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  fetchForecast: <T = unknown>(
    query: Record<string, string | number>
  ) => Promise<WeatherForecastResult<T>>;
  clearError: () => void;
}

const WeatherLocationContext = createContext<WeatherLocationContextValue | null>(null);

export function WeatherLocationProvider({ children }: { children: ReactNode }) {
  const { userId } = useHouseContext();
  const { locale } = useT();
  const [preferences, setPreferences] = useState<WeatherPreferences>(
    DEFAULT_WEATHER_PREFERENCES
  );
  const [activeLocation, setActiveLocation] = useState<WeatherLocation>(
    DEFAULT_WEATHER_LOCATION
  );
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("unsupported");
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [locating, setLocating] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const persistPreferences = useCallback(async (next: WeatherPreferences) => {
    setPreferences(next);
    try {
      await setDoc(
        doc(db, "users", userId, "preferences", "weather"),
        { ...next, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setErrorCode(null);
    } catch {
      setErrorCode("preferences-save");
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingPreferences(true);
      try {
        const snapshot = await getDoc(
          doc(db, "users", userId, "preferences", "weather")
        );
        const next = snapshot.exists()
          ? normalizeWeatherPreferences(snapshot.data())
          : DEFAULT_WEATHER_PREFERENCES;
        const permission = await getGeolocationPermissionState();
        if (cancelled) return;

        setPreferences(next);
        setPermissionState(permission);

        if (next.defaultMode === "current" && permission === "granted") {
          try {
            const current = await getCurrentWeatherLocation();
            if (!cancelled) setActiveLocation(current);
          } catch {
            if (!cancelled) {
              setActiveLocation(DEFAULT_WEATHER_LOCATION);
              setErrorCode("location-unavailable");
            }
          }
        } else {
          setActiveLocation(resolveDefaultWeatherLocation(next));
        }
      } catch {
        if (!cancelled) {
          setPreferences(DEFAULT_WEATHER_PREFERENCES);
          setActiveLocation(DEFAULT_WEATHER_LOCATION);
          setErrorCode("preferences-load");
        }
      } finally {
        if (!cancelled) setLoadingPreferences(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      searchAbortRef.current?.abort();
    };
  }, [userId]);

  const searchLocations = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return [];

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      const response = await fetch(
        createGeocodingUrl(normalizedQuery, locale),
        { signal: controller.signal }
      );
      if (!response.ok) {
        throw new Error(`Geocoding request failed (${response.status})`);
      }
      const locations = normalizeGeocodingResponse(await response.json());
      setErrorCode(null);
      return locations;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return [];
      setErrorCode("search-failed");
      return [];
    }
  }, [locale]);

  const selectLocation = useCallback((location: WeatherLocation) => {
    setActiveLocation(location);
    setErrorCode(null);
  }, []);

  const selectFavorite = useCallback(async (location: WeatherLocation) => {
    setActiveLocation(location);
    await persistPreferences({
      ...preferences,
      defaultMode: "favorite",
      defaultFavoriteId: location.id,
    });
  }, [persistPreferences, preferences]);

  const selectFallback = useCallback(async () => {
    setActiveLocation(DEFAULT_WEATHER_LOCATION);
    await persistPreferences({
      ...preferences,
      defaultMode: "fallback",
      defaultFavoriteId: undefined,
    });
  }, [persistPreferences, preferences]);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    setErrorCode(null);
    try {
      const current = await getCurrentWeatherLocation();
      setActiveLocation(current);
      setPermissionState("granted");
      await persistPreferences({
        ...preferences,
        defaultMode: "current",
        defaultFavoriteId: undefined,
      });
    } catch (error) {
      const permission = await getGeolocationPermissionState();
      setPermissionState(permission);
      const message = error instanceof Error ? error.message : "";
      setErrorCode(
        permission === "denied" || message === "geolocation-1"
          ? "location-denied"
          : "location-unavailable"
      );
    } finally {
      setLocating(false);
    }
  }, [persistPreferences, preferences]);

  const addFavorite = useCallback(async (location: WeatherLocation) => {
    const next = addWeatherFavorite(preferences, location);
    if (next === preferences) {
      if (
        preferences.favorites.length >= MAX_WEATHER_FAVORITES
        && !preferences.favorites.some((favorite) => favorite.id === location.id)
      ) {
        setErrorCode("favorite-limit");
        return false;
      }
      return preferences.favorites.some((favorite) => favorite.id === location.id);
    }
    await persistPreferences(next);
    return true;
  }, [persistPreferences, preferences]);

  const removeFavorite = useCallback(async (id: string) => {
    const next = removeWeatherFavorite(preferences, id);
    if (activeLocation.id === id) {
      setActiveLocation(resolveDefaultWeatherLocation(next));
    }
    await persistPreferences(next);
  }, [activeLocation.id, persistPreferences, preferences]);

  const isFavorite = useCallback(
    (id: string) => preferences.favorites.some((favorite) => favorite.id === id),
    [preferences.favorites]
  );

  const fetchForecast = useCallback(
    <T,>(query: Record<string, string | number>) =>
      fetchWeatherForecast<T>(activeLocation, query),
    [activeLocation]
  );

  const value = useMemo<WeatherLocationContextValue>(() => ({
    activeLocation,
    favorites: preferences.favorites,
    permissionState,
    loadingPreferences,
    locating,
    errorCode,
    maxFavorites: MAX_WEATHER_FAVORITES,
    searchLocations,
    selectLocation,
    selectFavorite,
    selectFallback,
    useCurrentLocation,
    addFavorite,
    removeFavorite,
    isFavorite,
    fetchForecast,
    clearError: () => setErrorCode(null),
  }), [
    activeLocation,
    preferences.favorites,
    permissionState,
    loadingPreferences,
    locating,
    errorCode,
    searchLocations,
    selectLocation,
    selectFavorite,
    selectFallback,
    useCurrentLocation,
    addFavorite,
    removeFavorite,
    isFavorite,
    fetchForecast,
  ]);

  return (
    <WeatherLocationContext.Provider value={value}>
      {children}
    </WeatherLocationContext.Provider>
  );
}

export function useWeatherLocation(): WeatherLocationContextValue {
  const context = useContext(WeatherLocationContext);
  if (!context) {
    throw new Error("useWeatherLocation must be used within WeatherLocationProvider");
  }
  return context;
}

export function useWeatherLocationOptional(): WeatherLocationContextValue | null {
  return useContext(WeatherLocationContext);
}
