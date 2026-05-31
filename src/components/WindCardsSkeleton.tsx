export function WindCardsSkeleton({ dateLabels }: { dateLabels: string[] }) {
  return (
    <section>
      {/* Date chips */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-2">
          {dateLabels.map((label, i) => (
            <div
              key={label}
              className={`rounded-lg px-2 py-2 text-center text-sm font-semibold ${
                i === 0
                  ? "bg-sky-600 text-white ring-2 ring-sky-300 shadow-sm dark:bg-sky-500 dark:text-slate-950 dark:ring-sky-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header row */}
            <div className="flex items-start justify-between">
              <div className="h-5 w-28 rounded-md bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Verdict + speed */}
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-20 rounded-md bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Compass + chart row */}
            <div className="mt-4 grid grid-cols-[auto_1fr] items-start gap-2">
              <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Weather row */}
            <div className="mt-3 h-4 w-48 rounded-md bg-slate-100 dark:bg-slate-800" />
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
