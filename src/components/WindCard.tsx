"use client";

import { assessWind, compassLabel, type Leg } from "@/lib/wind";
import type { LegWind } from "@/lib/openMeteo";
import { describeWeather } from "@/lib/weatherCode";
import { useEffect, useState } from "react";

type Props = {
  leg: Leg;
  wind: LegWind;
};

export function WindCard({ leg, wind }: Props) {
  const [isGusting, setIsGusting] = useState(false);

  useEffect(() => {
    if (!isGusting) return;
    const timeout = window.setTimeout(() => setIsGusting(false), 700);
    return () => window.clearTimeout(timeout);
  }, [isGusting]);

  const triggerGust = () => {
    setIsGusting(true);
  };

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
  const pointAlong = wind.points.map((p) =>
    assessWind(p.windFromDeg, p.windSpeedMs, leg.travelBearing).along
  );
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

  const gustLabel = isGusting
    ? a.kind === "tailwind"
      ? "gust mode: pushing from behind"
      : a.kind === "headwind"
        ? "gust mode: pushing against you"
        : "gust mode: sideways breeze"
    : null;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-2 dark:border-slate-800 dark:bg-slate-900 ${palette.ring}`}
    >
      <Header leg={leg} forecast={wind.isForecast} />

      <div className="mt-3 flex items-end justify-between gap-3">
        <div
          className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${palette.bg} ${palette.text}`}
        >
          {palette.verdict}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold leading-none tabular-nums sm:text-4xl">
            {windSpeedMs.toFixed(1)}
            <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">
              m/s
            </span>
          </div>
          {windGustMs !== null && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              gusts {windGustMs.toFixed(1)} m/s
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr] items-start gap-2 sm:gap-4">
        <div>
          <button
            type="button"
            onClick={triggerGust}
            className="touch-manipulation rounded-full outline-none ring-sky-500/30 transition focus-visible:ring-2"
            aria-label="Play wind gust animation"
            title="Tap for a gust"
          >
            <CompassArrow
              rotationDeg={arrowRotation}
              travelBearing={leg.travelBearing}
              colorClass={palette.arrow}
              gusting={isGusting}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={triggerGust}
          className="touch-manipulation text-left outline-none ring-sky-500/30 transition focus-visible:ring-2"
          aria-label="Wind segment chart"
          title="Tap for a gust"
        >
          <AlongBarChart values={pointAlong} gusting={isGusting} gustLabel={gustLabel} />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-xl leading-none" aria-hidden>
            {cond.emoji}
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {cond.label}
          </span>
          <span className="text-slate-400">·</span>
          <span className="tabular-nums font-semibold">
            {Math.round(temperatureC)} °C
          </span>
          {precipitationMm > 0 && (
            <>
              <span className="text-slate-400">·</span>
              <span className="tabular-nums text-sky-700 dark:text-sky-300">
                {precipitationMm.toFixed(1)} mm
              </span>
            </>
          )}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
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
    </article>
  );
}

function AlongBarChart({
  values,
  gusting,
  gustLabel,
}: {
  values: number[];
  gusting: boolean;
  gustLabel: string | null;
}) {
  const bars = values.slice(0, 7);
  const count = bars.length || 7;
  const maxAbs = Math.max(0.5, ...bars.map((v) => Math.abs(v)));
  const width = 220;
  const height = 96;
  const mid = height / 2;
  const innerPad = 8;
  const slot = (width - innerPad * 2) / count;
  const barWidth = Math.max(8, slot * 0.6);
  const scale = (height * 0.42) / maxAbs;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-950/40">
      {gustLabel ? (
        <div className="flex h-20 items-center justify-center px-2">
          <p className="text-center text-sm font-semibold leading-snug text-sky-700 dark:text-sky-300 sm:text-base">
            {gustLabel}
          </p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-20 w-full"
          role="img"
          aria-label="Route segment wind projection chart"
        >
          <line
            x1={innerPad}
            x2={width - innerPad}
            y1={mid}
            y2={mid}
            className="stroke-slate-400/70 dark:stroke-slate-500/70"
            strokeWidth="1"
          />
          {Array.from({ length: count }).map((_, i) => {
            const v = bars[i] ?? 0;
            const h = Math.abs(v) * scale;
            const x = innerPad + i * slot + (slot - barWidth) / 2;
            const y = v >= 0 ? mid - h : mid;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(1, h)}
                rx="2"
                fill={v >= 0 ? "#16a34a" : "#dc2626"}
                opacity="0.9"
              />
            );
          })}
        </svg>
      )}
      <div className="mt-0.5 flex justify-between px-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>Start</span>
        <span>End</span>
      </div>
    </div>
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
  gusting,
}: {
  rotationDeg: number;
  travelBearing: number;
  colorClass: string;
  gusting: boolean;
}) {
  // SVG viewBox is 100x100, center (50,50). 0° = up (north), clockwise.
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-24 w-24 shrink-0 sm:h-28 sm:w-28 ${
        gusting ? "animate-[spin_700ms_ease-in-out]" : ""
      }`}
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
