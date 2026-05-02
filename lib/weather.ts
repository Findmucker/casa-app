// Shared weather codes (WMO) — used by Weather.tsx, EventList.tsx
export const WMO_CODES: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "Céu limpo" },
  1: { emoji: "🌤️", label: "Quase limpo" },
  2: { emoji: "⛅", label: "Parcialmente nublado" },
  3: { emoji: "☁️", label: "Nublado" },
  45: { emoji: "🌫️", label: "Nevoeiro" },
  48: { emoji: "🌫️", label: "Nevoeiro gelado" },
  51: { emoji: "🌦️", label: "Chuvisco leve" },
  53: { emoji: "🌦️", label: "Chuvisco" },
  55: { emoji: "🌦️", label: "Chuvisco forte" },
  56: { emoji: "🌧️", label: "Chuvisco gelado" },
  57: { emoji: "🌧️", label: "Chuvisco gelado forte" },
  61: { emoji: "🌧️", label: "Chuva leve" },
  63: { emoji: "🌧️", label: "Chuva" },
  65: { emoji: "🌧️", label: "Chuva forte" },
  66: { emoji: "🌧️", label: "Chuva gelada" },
  67: { emoji: "🌧️", label: "Chuva gelada forte" },
  71: { emoji: "🌨️", label: "Neve leve" },
  73: { emoji: "🌨️", label: "Neve" },
  75: { emoji: "🌨️", label: "Neve forte" },
  77: { emoji: "🌨️", label: "Granizo" },
  80: { emoji: "🌦️", label: "Aguaceiros leves" },
  81: { emoji: "🌦️", label: "Aguaceiros" },
  82: { emoji: "⛈️", label: "Aguaceiros fortes" },
  85: { emoji: "🌨️", label: "Neve leve" },
  86: { emoji: "🌨️", label: "Neve forte" },
  95: { emoji: "⛈️", label: "Trovoada" },
  96: { emoji: "⛈️", label: "Trovoada com granizo" },
  99: { emoji: "⛈️", label: "Trovoada forte" },
};

export function getWeatherInfo(code: number) {
  return WMO_CODES[code] || { emoji: "🌡️", label: "Desconhecido" };
}
