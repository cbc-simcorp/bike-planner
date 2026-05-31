import { assessWind, compassLabel, type Leg } from "@/lib/wind";
import type { LegWind } from "@/lib/openMeteo";
import { describeWeather } from "@/lib/weatherCode";

type Props = {
  leg: Leg;
  wind: LegWind;
};

export function WindCard({ leg, wind }: Props) {
  if (!wind.data) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Header leg={leg} forecast={wind.isForecast} />
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No data for {leg.timeLabel} today.
        </p>
      </article>
    );
  }

  const {
    windFromDeg,
    windSpeedMs,
    windGustMs,
    temperatureC,
    precipitationMm,
    weatherCode,
  } = wind.data;
  const a = assessWind(windFromDeg, windSpeedMs, leg.travelBearing);
  const cond = describeWeather(weatherCode);

  const palette = {
    tailwind: {
      ring: "ring-emerald-400/60",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      arrow: "text-emerald-600 dark:text-emerald-400",
      verdict: "Tailwind",
    },
    headwind: {
      ring: "ring-rose-400/60",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      arrow: "text-rose-600 dark:text-rose-400",
      verdict: "Headwind",
    },
    crosswind: {
      ring: "ring-amber-400/60",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      arrow: "text-amber-600 dark:text-amber-400",
      verdict: "Crosswind",
    },
  }[a.kind];

  // Arrow points where the wind is going (windFrom + 180), with 0° = up (north).
  const arrowRotation = (windFromDeg + 180) % 360;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-2 dark:border-slate-800 dark:bg-slate-900 ${palette.ring}`}
    >
      <Header leg={leg} forecast={wind.isForecast} />

      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="text-2xl leading-none" aria-hidden>
          {cond.emoji}
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {cond.label}
        </span>
        <span className="text-slate-400">·</span>
        <span className="tabular-nums font-semibold">
          {Math.round(temperatureC)} °C
        </span>
        {precipitationMm > 0 && (
          <>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums text-sky-700 dark:text-sky-300">
              {precipitationMm.toFixed(1)} mm
            </span>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-5">
        <CompassArrow
          rotationDeg={arrowRotation}
          travelBearing={leg.travelBearing}
          colorClass={palette.arrow}
        />

        <div className="flex-1">
          <div
            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${palette.bg} ${palette.text}`}
          >
            {palette.verdict}
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">
            {windSpeedMs.toFixed(1)}{" "}
            <span className="text-base font-medium text-slate-500 dark:text-slate-400">
              m/s
            </span>
          </div>
          {windGustMs !== null && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              gusts {windGustMs.toFixed(1)} m/s
            </div>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <dt>From</dt>
            <dd className="text-right tabular-nums">
              {compassLabel(windFromDeg)} ({Math.round(windFromDeg)}°)
            </dd>
            <dt>Along travel</dt>
            <dd className="text-right tabular-nums">
              {a.along >= 0 ? "+" : ""}
              {a.along.toFixed(1)} m/s
            </dd>
            <dt>Crosswind</dt>
            <dd className="text-right tabular-nums">
              {Math.abs(a.cross).toFixed(1)} m/s
            </dd>
          </dl>
        </div>
      </div>
    </article>
  );
}

function Header({ leg, forecast }: { leg: Leg; forecast: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {leg.timeLabel} CET
        </div>
        <h2 className="text-lg font-semibold leading-tight">
          {leg.routeLabel}
        </h2>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
          forecast
            ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {forecast ? "Forecast" : "Observed"}
      </span>
    </div>
  );
}

function CompassArrow({
  rotationDeg,
  travelBearing,
  colorClass,
}: {
  rotationDeg: number;
  travelBearing: number;
  colorClass: string;
}) {
  // SVG viewBox is 100x100, center (50,50). 0° = up (north), clockwise.
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-28 shrink-0"
      aria-label={`Wind blowing toward ${Math.round(rotationDeg)}°`}
    >
      {/* compass ring */}
      <circle
        cx="50"
        cy="50"
        r="46"
        className="fill-slate-50 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600"
        strokeWidth="1.5"
      />
      {/* cardinal letters */}
      <text x="50" y="14" textAnchor="middle" className="fill-slate-400 text-[9px]">N</text>
      <text x="88" y="53" textAnchor="middle" className="fill-slate-400 text-[9px]">E</text>
      <text x="50" y="92" textAnchor="middle" className="fill-slate-400 text-[9px]">S</text>
      <text x="12" y="53" textAnchor="middle" className="fill-slate-400 text-[9px]">W</text>

      {/* travel-direction indicator: a faint chevron pointing where I'm going */}
      <g
        transform={`rotate(${travelBearing} 50 50)`}
        className="stroke-slate-400/70 dark:stroke-slate-500/70"
        strokeWidth="1.5"
        fill="none"
      >
        <path d="M 42 78 L 50 84 L 58 78" />
      </g>

      {/* wind arrow */}
      <g transform={`rotate(${rotationDeg} 50 50)`} className={colorClass}>
        <path
          d="M 50 18 L 60 38 L 53 38 L 53 76 L 47 76 L 47 38 L 40 38 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
