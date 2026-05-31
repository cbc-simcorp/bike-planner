import { SettingsButton } from "@/components/SettingsButton";
import { WindDateCarousel } from "@/components/WindDateCarousel";
import { fetchWindForDate } from "@/lib/openMeteo";
import {
  addDaysIso,
  buildCommuteLegs,
  copenhagenDateLabel,
  copenhagenToday,
  midpointBetween,
} from "@/lib/wind";
import { parseSettingsCookie, SETTINGS_COOKIE } from "@/lib/settings";
import { cookies } from "next/headers";

export const revalidate = 600; // seconds

const MAX_FUTURE_DAYS = 2;

type HomeProps = {
  searchParams?:
    | {
        date?: string | string[];
      }
    | Promise<{
        date?: string | string[];
      }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const cookieStore = await cookies();
  const settingsCookie = cookieStore.get(SETTINGS_COOKIE)?.value;
  const settings = parseSettingsCookie(settingsCookie);

  const routeMidpoint = midpointBetween(settings.home, settings.destination);
  const legs = buildCommuteLegs(
    settings.home,
    settings.destination,
    settings.morningHour,
    settings.eveningHour
  );

  const today = copenhagenToday();
  const maxDate = addDaysIso(today, MAX_FUTURE_DAYS);
  const dateOptions = Array.from({ length: MAX_FUTURE_DAYS + 1 }, (_, i) => {
    const value = addDaysIso(today, i);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : copenhagenDateLabel(value);
    return { value, label };
  });

  const rawDate = Array.isArray(resolvedSearchParams?.date)
    ? resolvedSearchParams?.date[0]
    : resolvedSearchParams?.date;
  const requestedDate =
    typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : today;
  const clampedDate =
    requestedDate < today ? today : requestedDate > maxDate ? maxDate : requestedDate;
  const selectedIndex = Math.max(
    0,
    dateOptions.findIndex((d) => d.value === clampedDate)
  );

  let dataByDate: Record<string, Awaited<ReturnType<typeof fetchWindForDate>>> =
    {};
  let error: string | null = null;
  try {
    const entries = await Promise.all(
      dateOptions.map(async (option) => {
        const dayData = await fetchWindForDate(option.value, routeMidpoint, {
          morningHour: settings.morningHour,
          eveningHour: settings.eveningHour,
        });
        return [option.value, dayData] as const;
      })
    );
    dataByDate = Object.fromEntries(entries);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bike to Work
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {settings.home.name} to {settings.destination.name} · midpoint weather
          </p>
        </div>
        <div className="pt-0.5">
          <SettingsButton />
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Could not load wind data: {error}
        </div>
      )}

      <WindDateCarousel
        options={dateOptions}
        initialIndex={selectedIndex}
        legs={legs}
        dataByDate={dataByDate}
      />

      <footer className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        Green = tailwind · Amber = crosswind · Red = headwind. Arrow shows where
        the wind is blowing to; the faint chevron at the bottom of the compass
        shows your travel direction.
      </footer>
    </main>
  );
}
