import { WindCard } from "@/components/WindCard";
import { fetchTodaysWind } from "@/lib/openMeteo";
import { assessWind, LEGS } from "@/lib/wind";

export const revalidate = 600; // seconds

export default async function Home() {
  let data:
    | Awaited<ReturnType<typeof fetchTodaysWind>>
    | null = null;
  let error: string | null = null;
  try {
    data = await fetchTodaysWind();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const scoredLegs = LEGS.map((leg) => {
    const w = leg.id === "morning" ? data?.morning : data?.evening;
    if (!w?.data) return null;
    const assessment = assessWind(
      w.data.windFromDeg,
      w.data.windSpeedMs,
      leg.travelBearing
    );
    return { leg, assessment };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const bestLeg = scoredLegs.length
    ? scoredLegs.reduce((best, current) =>
        current.assessment.along > best.assessment.along ? current : best
      )
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          BikePlanner — Wind
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Bike commute · {data?.date ?? "today"} · data from open-meteo
        </p>
      </header>

      {bestLeg && (
        <section className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
          <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">
            Best leg today
          </p>
          <p className="mt-1 text-base font-semibold">
            {bestLeg.leg.routeLabel} at {bestLeg.leg.timeLabel}
          </p>
          <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
            Along-travel wind: {bestLeg.assessment.along >= 0 ? "+" : ""}
            {bestLeg.assessment.along.toFixed(1)} m/s
          </p>
        </section>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Could not load wind data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {LEGS.map((leg) => {
          const w = leg.id === "morning" ? data?.morning : data?.evening;
          return (
            <WindCard
              key={leg.id}
              leg={leg}
              wind={w ?? { hour: leg.hour, data: null, isForecast: false }}
            />
          );
        })}
      </div>

      <footer className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        Green = tailwind · Amber = crosswind · Red = headwind. Arrow shows where
        the wind is blowing to; the faint chevron at the bottom of the compass
        shows your travel direction.
      </footer>
    </main>
  );
}
