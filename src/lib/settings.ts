import {
  DEFAULT_EVENING_HOUR,
  DEFAULT_HOME,
  DEFAULT_MORNING_HOUR,
  WORK_DESTINATION,
  type Point,
} from "@/lib/wind";

export const SETTINGS_COOKIE = "bike_settings";

type Location = Point & { name: string };

export type CommuteSettings = {
  home: Location;
  destination: Location;
  morningHour: number;
  eveningHour: number;
};

export const DEFAULT_SETTINGS: CommuteSettings = {
  home: DEFAULT_HOME,
  destination: WORK_DESTINATION,
  morningHour: DEFAULT_MORNING_HOUR,
  eveningHour: DEFAULT_EVENING_HOUR,
};

function clampHour(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.max(0, Math.min(23, rounded));
}

function parseLocation(value: unknown, fallback: Location): Location {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Partial<Location>;
  const lat = typeof v.lat === "number" ? v.lat : Number.NaN;
  const lon = typeof v.lon === "number" ? v.lon : Number.NaN;
  const name = typeof v.name === "string" ? v.name.trim() : "";

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return fallback;
  }

  return {
    name: name || fallback.name,
    lat,
    lon,
  };
}

export function normalizeSettings(value: unknown): CommuteSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const v = value as Partial<CommuteSettings>;

  return {
    home: parseLocation(v.home, DEFAULT_SETTINGS.home),
    destination: parseLocation(v.destination, DEFAULT_SETTINGS.destination),
    morningHour: clampHour(
      typeof v.morningHour === "number" ? v.morningHour : Number.NaN,
      DEFAULT_SETTINGS.morningHour
    ),
    eveningHour: clampHour(
      typeof v.eveningHour === "number" ? v.eveningHour : Number.NaN,
      DEFAULT_SETTINGS.eveningHour
    ),
  };
}

export function parseSettingsCookie(rawValue: string | undefined): CommuteSettings {
  if (!rawValue) return DEFAULT_SETTINGS;
  try {
    const json = decodeURIComponent(rawValue);
    const parsed = JSON.parse(json);
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function serializeSettingsCookie(settings: CommuteSettings): string {
  return encodeURIComponent(JSON.stringify(normalizeSettings(settings)));
}
