import { HomeTownControl } from "@/components/HomeTownControl";
import { WindDateCarousel } from "@/components/WindDateCarousel";
import { fetchWindForDate } from "@/lib/openMeteo";
import {
  addDaysIso,
  buildCommuteLegs,
  copenhagenDateLabel,
  copenhagenToday,
  DEFAULT_HOME,
  midpointBetween,
  WORK_DESTINATION,
} from "@/lib/wind";

export const revalidate = 600; // seconds

const MAX_FUTURE_DAYS = 2;

type HomeProps = {
  searchParams?:
    | {
        date?: string | string[];
        home?: string | string[];
        hlat?: string | string[];
        hlon?: string | string[];
      }
    | Promise<{
        date?: string | string[];
        home?: string | string[];
        hlat?: string | string[];
        hlon?: string | string[];
      }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseCoordinate(v: string | undefined): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const rawHome = firstParam(resolvedSearchParams?.home)?.trim();
  const rawHomeLat = parseCoordinate(firstParam(resolvedSearchParams?.hlat));
  const rawHomeLon = parseCoordinate(firstParam(resolvedSearchParams?.hlon));
  const hasValidHomeCoords =
    rawHomeLat !== null &&
    rawHomeLon !== null &&
    rawHomeLat >= -90 &&
    rawHomeLat <= 90 &&
    rawHomeLon >= -180 &&
    rawHomeLon <= 180;

  const home = hasValidHomeCoords
    ? {
        name: rawHome || DEFAULT_HOME.name,
        lat: rawHomeLat,
        lon: rawHomeLon,
      }
    : DEFAULT_HOME;

  const routeMidpoint = midpointBetween(home, WORK_DESTINATION);
  const legs = buildCommuteLegs(home, WORK_DESTINATION);

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
        const dayData = await fetchWindForDate(option.value, routeMidpoint);
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
            Bike commute · midpoint weather · data from open-meteo
          </p>
        </div>
        <div className="text-right pt-0.5">
          <HomeTownControl homeTown={home.name} />
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
