import { ROUTE_LAT, ROUTE_LON, copenhagenToday } from "./wind";

export type HourlySample = {
  time: string;             // "YYYY-MM-DDTHH:MM" local (Europe/Copenhagen)
  windFromDeg: number;      // 0..360, direction the wind comes FROM
  windSpeedMs: number;      // m/s at 10 m
  windGustMs: number | null;
  temperatureC: number;     // air temperature at 2 m
  precipitationMm: number;  // mm in that hour
  weatherCode: number;      // WMO interpretation code
};

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m?: number[];
    temperature_2m: number[];
    precipitation: number[];
    weather_code: number[];
  };
};

export type LegWind = {
  hour: number;          // 7 or 17
  data: HourlySample | null;
  isForecast: boolean;   // true if the slot is in the future
};

/** Fetch today's hourly weather for the bike-route midpoint, pick the 07:00 and 17:00 slots. */
export async function fetchTodaysWind(): Promise<{
  date: string;
  morning: LegWind;
  evening: LegWind;
}> {
  const date = copenhagenToday();
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${ROUTE_LAT}` +
    `&longitude=${ROUTE_LON}` +
    "&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m," +
    "temperature_2m,precipitation,weather_code" +
    "&wind_speed_unit=ms" +
    "&timezone=Europe%2FCopenhagen" +
    "&forecast_days=2" +
    "&past_days=1";

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`open-meteo: HTTP ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoResponse;

  // Current hour-of-day in Copenhagen, used to decide forecast vs. observed.
  const cphHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  const pick = (hour: number): LegWind => {
    const hh = hour.toString().padStart(2, "0");
    const target = `${date}T${hh}:00`;
    const idx = json.hourly.time.indexOf(target);
    if (idx < 0) return { hour, data: null, isForecast: hour >= cphHour };
    const data: HourlySample = {
      time: json.hourly.time[idx],
      windFromDeg: json.hourly.wind_direction_10m[idx],
      windSpeedMs: json.hourly.wind_speed_10m[idx],
      windGustMs: json.hourly.wind_gusts_10m?.[idx] ?? null,
      temperatureC: json.hourly.temperature_2m[idx],
      precipitationMm: json.hourly.precipitation[idx],
      weatherCode: json.hourly.weather_code[idx],
    };
    return { hour, data, isForecast: hour >= cphHour };
  };

  return {
    date,
    morning: pick(7),
    evening: pick(17),
  };
}
