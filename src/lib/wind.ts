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

export type Point = {
  lat: number;
  lon: number;
};

export const DEFAULT_HOME = {
  name: "Humlebæk",
  lat: 55.9617,
  lon: 12.5345,
};

export const WORK_DESTINATION = {
  name: "Weidekampsgade 16, Copenhagen",
  lat: 55.668154,
  lon: 12.580684,
};

function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function bearingBetween(from: Point, to: Point): number {
  const phi1 = toRad(from.lat);
  const phi2 = toRad(to.lat);
  const dLambda = toRad(to.lon - from.lon);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  return normalizeBearing(toDeg(Math.atan2(y, x)));
}

export function midpointBetween(a: Point, b: Point): Point {
  return {
    lat: (a.lat + b.lat) / 2,
    lon: (a.lon + b.lon) / 2,
  };
}

export function buildCommuteLegs(home: Point, work: Point): Leg[] {
  return [
    {
      id: "morning",
      label: "07:00 — To Work",
      timeLabel: "07:00",
      routeLabel: "To Work",
      hour: 7,
      travelBearing: bearingBetween(home, work),
    },
    {
      id: "evening",
      label: "17:00 — From Work",
      timeLabel: "17:00",
      routeLabel: "From Work",
      hour: 17,
      travelBearing: bearingBetween(work, home),
    },
  ];
}

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

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function copenhagenDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Copenhagen",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(dt);
}
