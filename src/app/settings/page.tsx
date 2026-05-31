"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

  const canSave = useMemo(() => !saving, [saving]);

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
      const [homeHit, destinationHit] = await Promise.all([
        geocodeDenmarkFirst(homeText.trim()),
        geocodeDenmarkFirst(destinationText.trim()),
      ]);

      if (!homeHit) {
        setError("Could not validate home town/address.");
        setHint(null);
        return;
      }

      if (!destinationHit) {
        setError("Could not validate destination town/address.");
        setHint(null);
        return;
      }

      const settings: CommuteSettings = {
        home: {
          name: homeHit.name,
          lat: homeHit.latitude,
          lon: homeHit.longitude,
        },
        destination: {
          name: destinationHit.name,
          lat: destinationHit.latitude,
          lon: destinationHit.longitude,
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500/40 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
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
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500/40 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
        Input is validated using geocoding and prefers Danish matches first.
      </p>
    </main>
  );
}
