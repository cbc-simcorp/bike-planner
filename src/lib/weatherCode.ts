// WMO weather interpretation codes used by open-meteo.
// https://open-meteo.com/en/docs (see "weather_code")

export type WeatherDescription = {
  label: string;
  emoji: string;
};

export function describeWeather(code: number | null | undefined): WeatherDescription {
  if (code == null) return { label: "Unknown", emoji: "❓" };
  if (code === 0) return { label: "Clear sky", emoji: "☀️" };
  if (code === 1) return { label: "Mostly clear", emoji: "🌤️" };
  if (code === 2) return { label: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { label: "Overcast", emoji: "☁️" };
  if (code === 45 || code === 48) return { label: "Fog", emoji: "🌫️" };
  if (code === 51) return { label: "Light drizzle", emoji: "🌦️" };
  if (code === 53) return { label: "Drizzle", emoji: "🌦️" };
  if (code === 55) return { label: "Heavy drizzle", emoji: "🌦️" };
  if (code === 56 || code === 57) return { label: "Freezing drizzle", emoji: "🌧️" };
  if (code === 61) return { label: "Light rain", emoji: "🌦️" };
  if (code === 63) return { label: "Rain", emoji: "🌧️" };
  if (code === 65) return { label: "Heavy rain", emoji: "🌧️" };
  if (code === 66 || code === 67) return { label: "Freezing rain", emoji: "🌧️" };
  if (code === 71) return { label: "Light snow", emoji: "🌨️" };
  if (code === 73) return { label: "Snow", emoji: "🌨️" };
  if (code === 75) return { label: "Heavy snow", emoji: "❄️" };
  if (code === 77) return { label: "Snow grains", emoji: "🌨️" };
  if (code === 80) return { label: "Rain showers", emoji: "🌦️" };
  if (code === 81) return { label: "Rain showers", emoji: "🌧️" };
  if (code === 82) return { label: "Violent showers", emoji: "⛈️" };
  if (code === 85 || code === 86) return { label: "Snow showers", emoji: "🌨️" };
  if (code === 95) return { label: "Thunderstorm", emoji: "⛈️" };
  if (code === 96 || code === 99) return { label: "Thunder + hail", emoji: "⛈️" };
  return { label: `Code ${code}`, emoji: "❓" };
}
