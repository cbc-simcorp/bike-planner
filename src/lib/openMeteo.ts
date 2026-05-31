import { copenhagenToday, type Point } from "./wind";

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
  points: HourlySample[];
  isForecast: boolean;   // true if the slot is in the future
};

export type CommuteHours = {
  morningHour: number;
  eveningHour: number;
};

type DayWind = {
  date: string;
  morning: LegWind;
  evening: LegWind;
};

function aggregateSamples(samples: HourlySample[]): HourlySample | null {
  if (!samples.length) return null;

  const vector = samples.reduce(
    (acc, s) => {
      const windToDeg = (s.windFromDeg + 180) % 360;
      const r = (windToDeg * Math.PI) / 180;
      acc.east += s.windSpeedMs * Math.sin(r);
      acc.north += s.windSpeedMs * Math.cos(r);
      return acc;
    },
    { east: 0, north: 0 }
  );

  const east = vector.east / samples.length;
  const north = vector.north / samples.length;
  const speed = Math.hypot(east, north);
  const windToDeg = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
  const windFromDeg = (windToDeg + 180) % 360;

  const midpoint = samples[Math.floor(samples.length / 2)];

  const avgTemp =
    samples.reduce((sum, s) => sum + s.temperatureC, 0) / samples.length;
  const avgPrecip =
    samples.reduce((sum, s) => sum + s.precipitationMm, 0) / samples.length;

  const gustValues = samples
    .map((s) => s.windGustMs)
    .filter((v): v is number => v !== null);
  const avgGust = gustValues.length
    ? gustValues.reduce((sum, v) => sum + v, 0) / gustValues.length
    : null;

  return {
    time: midpoint.time,
    windFromDeg,
    windSpeedMs: speed,
    windGustMs: avgGust,
    temperatureC: avgTemp,
    precipitationMm: avgPrecip,
    weatherCode: midpoint.weatherCode,
  };
}

async function fetchHourlySeriesAtPoint(point: Point): Promise<OpenMeteoResponse["hourly"]> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${point.lat}` +
    `&longitude=${point.lon}` +
    "&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m," +
    "temperature_2m,precipitation,weather_code" +
    "&wind_speed_unit=ms" +
    "&timezone=Europe%2FCopenhagen" +
    "&forecast_days=3";

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`open-meteo: HTTP ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoResponse;
  return json.hourly;
}

function pickLeg(
  date: string,
  hour: number,
  hourlySeries: OpenMeteoResponse["hourly"][],
  cphDate: string,
  cphHour: number
): LegWind {
  const hh = hour.toString().padStart(2, "0");
  const target = `${date}T${hh}:00`;
  const isFutureDate = date > cphDate;
  const isPastDate = date < cphDate;
  const isForecast = isPastDate ? false : isFutureDate ? true : hour >= cphHour;

  const pointSamples: HourlySample[] = [];
  for (const hourly of hourlySeries) {
    const idx = hourly.time.indexOf(target);
    if (idx < 0) continue;
    pointSamples.push({
      time: hourly.time[idx],
      windFromDeg: hourly.wind_direction_10m[idx],
      windSpeedMs: hourly.wind_speed_10m[idx],
      windGustMs: hourly.wind_gusts_10m?.[idx] ?? null,
      temperatureC: hourly.temperature_2m[idx],
      precipitationMm: hourly.precipitation[idx],
      weatherCode: hourly.weather_code[idx],
    });
  }

  return {
    hour,
    data: aggregateSamples(pointSamples),
    points: pointSamples,
    isForecast,
  };
}

/** Fetch hourly weather for a selected date at the bike-route midpoint and pick 07:00 / 17:00. */
export async function fetchWindForDate(
  date: string,
  routePoints: Point[],
  hours: CommuteHours
): Promise<DayWind> {
  const days = await fetchWindForDates([date], routePoints, hours);
  return days[date];
}

export async function fetchWindForDates(
  dates: string[],
  routePoints: Point[],
  hours: CommuteHours
): Promise<Record<string, DayWind>> {
  const points = routePoints.length ? routePoints : [{ lat: 55.83, lon: 12.55 }];
  const hourlySeries = await Promise.all(points.map((p) => fetchHourlySeriesAtPoint(p)));

  const cphDate = copenhagenToday();
  const cphHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  const out: Record<string, DayWind> = {};
  for (const date of dates) {
    out[date] = {
      date,
      morning: pickLeg(date, hours.morningHour, hourlySeries, cphDate, cphHour),
      evening: pickLeg(date, hours.eveningHour, hourlySeries, cphDate, cphHour),
    };
  }

  return out;
}

/** Convenience wrapper for current date. */
export async function fetchTodaysWind() {
  return fetchWindForDate(
    copenhagenToday(),
    [{ lat: 55.83, lon: 12.55 }],
    { morningHour: 7, eveningHour: 17 }
  );
}
