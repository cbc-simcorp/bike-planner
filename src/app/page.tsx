import { WindCard } from "@/components/WindCard";
import { fetchTodaysWind } from "@/lib/openMeteo";
import { LEGS } from "@/lib/wind";

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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          BikePlanner — Wind
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Humlebæk ⇄ Copenhagen · {data?.date ?? "today"} · data from open-meteo
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Could not load wind data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
