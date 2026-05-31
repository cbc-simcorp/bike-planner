"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  parseSettingsCookie,
  serializeSettingsCookie,
  SETTINGS_COOKIE,
  type CommuteSettings,
} from "@/lib/settings";

type GeocodeHit = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type GeocodeResponse = {
  results?: GeocodeHit[];
};

type ResolvedLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

function getCookieValue(name: string): string | undefined {
  const item = document.cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : undefined;
}

function toHour(timeText: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(timeText);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh;
}

async function geocodeDenmarkFirst(query: string): Promise<GeocodeHit | null> {
  const encoded = encodeURIComponent(query);

  const urls = [
    `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=1&language=en&format=json&countryCode=DK`,
    `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=1&language=en&format=json`,
  ];

  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const json = (await res.json()) as GeocodeResponse;
    const hit = json.results?.[0];
    if (hit) return hit;
  }

  return null;
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("da-DK");
}

function displaySuggestion(hit: GeocodeHit): string {
  const region = hit.admin1 || hit.country || "";
  return region ? `${hit.name}, ${region}` : hit.name;
}

export default function SettingsPage() {
  const router = useRouter();

  const initialSettings = useMemo(() => {
    if (typeof document === "undefined") return DEFAULT_SETTINGS;
    const raw = getCookieValue(SETTINGS_COOKIE);
    return parseSettingsCookie(raw);
  }, []);

  const [homeText, setHomeText] = useState(initialSettings.home.name);
  const [destinationText, setDestinationText] = useState(
    initialSettings.destination.name
  );
  const [morningTime, setMorningTime] = useState(
    `${initialSettings.morningHour.toString().padStart(2, "0")}:00`
  );
  const [eveningTime, setEveningTime] = useState(
    `${initialSettings.eveningHour.toString().padStart(2, "0")}:00`
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [homeSuggestions, setHomeSuggestions] = useState<GeocodeHit[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodeHit[]>(
    []
  );

  const canSave = useMemo(() => !saving, [saving]);

  useEffect(() => {
    const query = homeText.trim();
    if (query.length < 2) return;

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=5&language=en&format=json&countryCode=DK`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const json = (await res.json()) as GeocodeResponse;
        if (!cancelled) setHomeSuggestions(json.results ?? []);
      } catch {
        if (!cancelled) setHomeSuggestions([]);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [homeText]);

  useEffect(() => {
    const query = destinationText.trim();
    if (query.length < 2) return;

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=5&language=en&format=json&countryCode=DK`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const json = (await res.json()) as GeocodeResponse;
        if (!cancelled) setDestinationSuggestions(json.results ?? []);
      } catch {
        if (!cancelled) setDestinationSuggestions([]);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [destinationText]);

  const resolveLocation = async (
    input: string,
    initial: CommuteSettings["home"] | CommuteSettings["destination"],
    suggestions: GeocodeHit[]
  ): Promise<ResolvedLocation | null> => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Keep existing coordinates when the user leaves an existing value unchanged.
    if (normalizeText(trimmed) === normalizeText(initial.name)) {
      return {
        name: initial.name,
        latitude: initial.lat,
        longitude: initial.lon,
      };
    }

    const suggestionMatch = suggestions.find(
      (s) => normalizeText(s.name) === normalizeText(trimmed)
    );
    if (suggestionMatch) {
      return {
        name: suggestionMatch.name,
        latitude: suggestionMatch.latitude,
        longitude: suggestionMatch.longitude,
      };
    }

    const geocoded = await geocodeDenmarkFirst(trimmed);
    if (!geocoded) return null;
    return {
      name: geocoded.name,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    };
  };

  const restoreDefaults = () => {
    setHomeText(DEFAULT_SETTINGS.home.name);
    setDestinationText(DEFAULT_SETTINGS.destination.name);
    setMorningTime("07:00");
    setEveningTime("17:00");
    setError(null);
    setHint("Defaults restored in form. Tap Save Settings to apply.");
  };

  const onSave = async () => {
    if (saving) return;

    const morningHour = toHour(morningTime);
    const eveningHour = toHour(eveningTime);

    if (morningHour === null || eveningHour === null) {
      setError("Please use valid morning and afternoon times.");
      return;
    }

    if (morningHour === eveningHour) {
      setError("Morning and afternoon commute times must be different.");
      return;
    }

    setSaving(true);
    setError(null);
    setHint("Validating locations...");

    try {
      const [homeResolved, destinationResolved] = await Promise.all([
        resolveLocation(homeText, initialSettings.home, homeSuggestions),
        resolveLocation(
          destinationText,
          initialSettings.destination,
          destinationSuggestions
        ),
      ]);

      if (!homeResolved) {
        setError("Could not validate home town/address.");
        setHint(null);
        return;
      }

      if (!destinationResolved) {
        setError("Could not validate destination town/address.");
        setHint(null);
        return;
      }

      const settings: CommuteSettings = {
        home: {
          name: homeResolved.name,
          lat: homeResolved.latitude,
          lon: homeResolved.longitude,
        },
        destination: {
          name: destinationResolved.name,
          lat: destinationResolved.latitude,
          lon: destinationResolved.longitude,
        },
        morningHour,
        eveningHour,
      };

      const value = serializeSettingsCookie(settings);
      document.cookie = `${SETTINGS_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;

      router.push("/");
      router.refresh();
    } catch {
      setError("Could not save settings right now.");
      setHint(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalize route endpoints and commute times.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back
        </Link>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Home town/address
          </span>
          <input
            type="text"
            value={homeText}
            onChange={(e) => setHomeText(e.target.value)}
            placeholder="Humlebæk"
            list="home-suggestions"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none ring-sky-500/40 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <datalist id="home-suggestions">
            {(homeText.trim().length >= 2 ? homeSuggestions : []).map((hit) => (
              <option key={`${hit.name}-${hit.latitude}-${hit.longitude}`} value={hit.name}>
                {displaySuggestion(hit)}
              </option>
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Destination town/address
          </span>
          <input
            type="text"
            value={destinationText}
            onChange={(e) => setDestinationText(e.target.value)}
            placeholder="Weidekampsgade 16, Copenhagen"
            list="destination-suggestions"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none ring-sky-500/40 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <datalist id="destination-suggestions">
            {(destinationText.trim().length >= 2
              ? destinationSuggestions
              : []
            ).map((hit) => (
              <option key={`${hit.name}-${hit.latitude}-${hit.longitude}`} value={hit.name}>
                {displaySuggestion(hit)}
              </option>
            ))}
          </datalist>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Morning commute time
            </span>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Afternoon commute time
            </span>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
            {hint}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            type="button"
            onClick={restoreDefaults}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Restore Defaults
          </button>
        </div>
      </section>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Town names are valid input; full street address is optional. Suggestions and
        validation prefer Danish matches first.
      </p>
    </main>
  );
}
