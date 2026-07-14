import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  WeatherLocationProvider,
  useWeatherLocation,
} from "@/components/WeatherLocationProvider";
import type { WeatherLocation } from "@/lib/weather-location";

jest.mock("@/lib/context", () => ({
  useHouseContext: () => ({ userId: "user-1" }),
}));

jest.mock("@/lib/i18n", () => ({
  useT: () => ({ locale: "pt", t: (key: string) => key }),
}));

const mockedGetDoc = getDoc as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;
const mockedServerTimestamp = serverTimestamp as jest.Mock;

function Probe({ favorite }: { favorite?: WeatherLocation }) {
  const weather = useWeatherLocation();
  return (
    <>
      <span data-testid="loading">{String(weather.loadingPreferences)}</span>
      <span data-testid="active">{weather.activeLocation.id}</span>
      {favorite && (
        <button type="button" onClick={() => void weather.addFavorite(favorite)}>
          add favorite
        </button>
      )}
    </>
  );
}

describe("WeatherLocationProvider", () => {
  const getCurrentPosition = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedSetDoc.mockResolvedValue(undefined);
    mockedServerTimestamp.mockReturnValue({ type: "serverTimestamp" });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: jest.fn().mockResolvedValue({ state: "prompt" }) },
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
  });

  it("does not prompt for location automatically when permission is undecided", async () => {
    mockedGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ defaultMode: "current", favorites: [] }),
    });

    render(
      <WeatherLocationProvider>
        <Probe />
      </WeatherLocationProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(screen.getByTestId("active")).toHaveTextContent("fallback-obidos-pt");
  });

  it("persists a favorite without undefined location fields", async () => {
    mockedGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    const favorite: WeatherLocation = {
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

    render(
      <WeatherLocationProvider>
        <Probe favorite={favorite} />
      </WeatherLocationProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    fireEvent.click(screen.getByRole("button", { name: "add favorite" }));

    await waitFor(() => expect(mockedSetDoc).toHaveBeenCalled());
    const payload = mockedSetDoc.mock.calls.at(-1)?.[1];
    expect(payload.favorites).toEqual([favorite]);
    expect(Object.values(payload.favorites[0])).not.toContain(undefined);
    expect(payload.defaultFavoriteId).toBeDefined();
  });
});
