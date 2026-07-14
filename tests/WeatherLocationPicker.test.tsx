import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import WeatherLocationPicker from "@/components/WeatherLocationPicker";
import type { WeatherLocation } from "@/lib/weather-location";

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
};
const porto: WeatherLocation = {
  id: "porto",
  latitude: 41.1496,
  longitude: -8.6109,
  name: "Porto",
  label: "Porto · Portugal",
  timezone: "Europe/Lisbon",
  source: "geocoding",
  isFallback: false,
  country: "Portugal",
};

const mockSearchLocations = jest.fn();
const mockSelectLocation = jest.fn();
const mockSelectFavorite = jest.fn();
const mockUseCurrentLocation = jest.fn();
const mockRemoveFavorite = jest.fn();

jest.mock("@/lib/i18n", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

jest.mock("@/components/WeatherLocationProvider", () => ({
  useWeatherLocation: () => ({
    activeLocation: lisbon,
    favorites: [lisbon],
    permissionState: "prompt",
    loadingPreferences: false,
    locating: false,
    errorCode: null,
    maxFavorites: 10,
    searchLocations: mockSearchLocations,
    selectLocation: mockSelectLocation,
    selectFavorite: mockSelectFavorite,
    selectFallback: jest.fn(),
    useCurrentLocation: mockUseCurrentLocation,
    addFavorite: jest.fn(),
    removeFavorite: mockRemoveFavorite,
    isFavorite: (id: string) => id === lisbon.id,
    clearError: jest.fn(),
  }),
}));

describe("WeatherLocationPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchLocations.mockResolvedValue([porto]);
  });

  it("allows explicit current-location use and favorite selection", async () => {
    render(<WeatherLocationPicker />);
    fireEvent.click(
      screen.getByRole("button", { name: /weather.location.active/ })
    );
    const dialog = screen.getByRole("dialog", {
      name: "weather.location.dialog",
    });
    expect(dialog).toHaveClass("z-[60]");
    expect(dialog.parentElement).toHaveClass("z-50");

    fireEvent.click(
      screen.getByRole("button", { name: "weather.location.useCurrent" })
    );
    expect(mockUseCurrentLocation).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Lisboa · Portugal" })
      );
      await Promise.resolve();
    });
    expect(mockSelectFavorite).toHaveBeenCalledWith(lisbon);
  });

  it("debounces global search and supports a temporary location", async () => {
    jest.useFakeTimers();
    render(<WeatherLocationPicker />);
    fireEvent.click(
      screen.getByRole("button", { name: /weather.location.active/ })
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "weather.location.searchLabel" }),
      { target: { value: "Porto" } }
    );

    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSearchLocations).toHaveBeenCalledWith("Porto");
    const results = screen.getByRole("list", {
      name: "weather.location.results",
    });
    fireEvent.click(
      within(results).getByRole("button", { name: /^Porto/ })
    );
    expect(mockSelectLocation).toHaveBeenCalledWith(porto);
    jest.useRealTimers();
  });
});
