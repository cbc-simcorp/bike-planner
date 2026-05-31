// Wind & geometry helpers for the BikePlanner dashboard.
// All angles in degrees. "windFromDeg" follows meteorological convention:
// the compass direction the wind is coming FROM (0 = N, 90 = E, 180 = S, 270 = W).

export type Leg = {
  id: "morning" | "evening";
  label: string;       // e.g. "07:00 — To Work"
  timeLabel: string;   // "07:00"
  routeLabel: string;  // "To Work"
  hour: number;        // 7 or 17
  travelBearing: number; // degrees, compass
};

export const LEGS: Leg[] = [
  {
    id: "morning",
    label: "07:00 — To Work",
    timeLabel: "07:00",
    routeLabel: "To Work",
    hour: 7,
    travelBearing: 177, // roughly due south along the coast
  },
  {
    id: "evening",
    label: "17:00 — From Work",
    timeLabel: "17:00",
    routeLabel: "From Work",
    hour: 17,
    travelBearing: 357, // roughly due north
  },
];

// Midpoint of the bike route along the Øresund coast (≈ Rungsted area).
export const ROUTE_LAT = 55.83;
export const ROUTE_LON = 12.55;

export type WindAssessment = {
  kind: "tailwind" | "headwind" | "crosswind";
  along: number;       // m/s component along travel direction (>0 tail, <0 head)
  cross: number;       // m/s component perpendicular
  ratio: number;       // along / speed, in [-1, 1]
};

export function assessWind(
  windFromDeg: number,
  windSpeedMs: number,
  travelBearingDeg: number
): WindAssessment {
  // Direction the wind is blowing TO:
  const windToDeg = (windFromDeg + 180) % 360;
  // Angle between wind-vector and travel-vector:
  const theta = ((windToDeg - travelBearingDeg) * Math.PI) / 180;
  const along = windSpeedMs * Math.cos(theta);
  const cross = windSpeedMs * Math.sin(theta);
  const ratio = windSpeedMs > 0.05 ? along / windSpeedMs : 0;

  // Classification thresholds: cos(60°) = 0.5
  let kind: WindAssessment["kind"];
  if (ratio > 0.5) kind = "tailwind";
  else if (ratio < -0.5) kind = "headwind";
  else kind = "crosswind";

  return { kind, along, cross, ratio };
}

const COMPASS_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function compassLabel(deg: number): string {
  const i = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return COMPASS_16[i];
}

// Today's date in Europe/Copenhagen as YYYY-MM-DD (Swedish locale gives ISO format).
export function copenhagenToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Copenhagen",
  }).format(new Date());
}
