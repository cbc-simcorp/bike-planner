"use client";

import { assessWind, type Leg } from "@/lib/wind";
import type { LegWind } from "@/lib/openMeteo";
import { describeWeather } from "@/lib/weatherCode";
import { pickRandomBikeQuote } from "@/lib/quotes";
import { useEffect, useRef, useState } from "react";

type Props = {
  leg: Leg;
  wind: LegWind;
};

export function WindCard({ leg, wind }: Props) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isQuoteVisible, setIsQuoteVisible] = useState(false);
  const [isQuoteFading, setIsQuoteFading] = useState(false);
  const [gustQuote, setGustQuote] = useState<string | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current);
      if (fadeTimeoutRef.current !== null) window.clearTimeout(fadeTimeoutRef.current);
      if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const triggerGust = () => {
    setGustQuote(pickRandomBikeQuote());
    setIsSpinning(true);
    setIsQuoteVisible(true);
    setIsQuoteFading(false);

    if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current);
    if (fadeTimeoutRef.current !== null) window.clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);

    spinTimeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
    }, 1000);

    fadeTimeoutRef.current = window.setTimeout(() => {
      setIsQuoteFading(true);
    }, 1900);

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsQuoteVisible(false);
      setIsQuoteFading(false);
    }, 2100);
  };

  if (!wind.data) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Header leg={leg} forecast={wind.isForecast} />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          No data for {leg.timeLabel} today.
        </p>
      </article>
    );
  }

  const {
    windFromDeg,
    windSpeedMs,
    temperatureC,
    precipitationMm,
    weatherCode,
  } = wind.data;
  const pointAlong = wind.points.map((p) =>
    assessWind(p.windFromDeg, p.windSpeedMs, leg.travelBearing).along
  );
  const effectiveRouteWind = pointAlong.length
    ? pointAlong.reduce((sum, v) => sum + v, 0) / pointAlong.length
    : 0;
  const avgWindSpeed = wind.points.length
    ? wind.points.reduce((sum, p) => sum + p.windSpeedMs, 0) / wind.points.length
    : windSpeedMs;
  const cond = describeWeather(weatherCode);

  const palette =
    effectiveRouteWind > 0.2
      ? {
      ring: "ring-emerald-400/60",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      arrow: "text-emerald-600 dark:text-emerald-400",
      verdict: "Tailwind",
      }
      : effectiveRouteWind < -0.2
        ? {
      ring: "ring-rose-400/60",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      arrow: "text-rose-600 dark:text-rose-400",
      verdict: "Headwind",
        }
        : {
      ring: "ring-slate-300/70 dark:ring-slate-700/70",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-700 dark:text-slate-300",
      arrow: "text-slate-600 dark:text-slate-300",
      verdict: "Neutral",
    };

  // Arrow points where the wind is going (windFrom + 180), with 0° = up (north).
  const arrowRotation = (windFromDeg + 180) % 360;

  const gustLabel = isQuoteVisible ? gustQuote : null;

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-2 dark:border-slate-800 dark:bg-slate-900 ${palette.ring}`}
    >
      <Header leg={leg} forecast={wind.isForecast} />

      {/* Row 1: verdict (left) baseline-aligned with wind speeds (right) */}
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <div
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${palette.bg} ${palette.text}`}
        >
          {palette.verdict}
        </div>
        <div className="flex items-baseline gap-3">
          <div
            className={`text-xs font-semibold tabular-nums ${
              effectiveRouteWind > 0
                ? "text-emerald-700 dark:text-emerald-300"
                : effectiveRouteWind < 0
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-slate-600 dark:text-slate-400"
            }`}
          >
            eff. {effectiveRouteWind > 0 ? "+" : ""}
            {effectiveRouteWind.toFixed(1)} m/s
          </div>
          <div>
            <span className="text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-slate-100">
              {avgWindSpeed.toFixed(1)}
            </span>
            <span className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              m/s
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: compass (left) + chart (right) — stretch row, compass centers in full height */}
      <div className="mt-2 flex items-stretch gap-4">
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={triggerGust}
            className="touch-manipulation rounded-full outline-none ring-sky-500/30 transition focus-visible:ring-2"
            aria-label="Show random bike quote"
            title="Tap for a quote"
          >
            <CompassArrow
              rotationDeg={arrowRotation}
              travelBearing={leg.travelBearing}
              colorClass={palette.arrow}
              gusting={isSpinning}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={triggerGust}
          className="min-w-0 flex-1 touch-manipulation text-left outline-none ring-sky-500/30 transition focus-visible:ring-2"
          aria-label="Wind segment chart"
          title="Tap for a quote"
        >
          <AlongBarChart
            values={pointAlong}
            gustLabel={gustLabel}
            quoteFading={isQuoteFading}
          />
        </button>
      </div>

      {/* Weather row: below compass+chart, right-aligned */}
      <div className="mt-1.5 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-xs">
        <span className="text-base leading-none" aria-hidden>
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
    </article>
  );
}

function AlongBarChart({
  values,
  gustLabel,
  quoteFading,
}: {
  values: number[];
  gustLabel: string | null;
  quoteFading: boolean;
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
  const quoteFontSizeClass = gustLabel
    ? gustLabel.length <= 24
      ? "text-2xl"
      : gustLabel.length <= 40
        ? "text-xl"
        : gustLabel.length <= 60
          ? "text-lg"
          : gustLabel.length <= 80
            ? "text-base"
            : "text-sm"
    : "text-sm";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-950/40">
      {gustLabel ? (
        <div className="flex h-[115px] items-center justify-center overflow-hidden px-1.5">
          <p
            className={`w-full break-words text-center font-semibold leading-tight text-sky-700 transition-opacity duration-200 dark:text-sky-300 ${quoteFontSizeClass} ${quoteFading ? "opacity-0" : "opacity-100"}`}
          >
            {gustLabel}
          </p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[115px] w-full"
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
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold leading-tight">
        {leg.routeLabel}
      </h2>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {leg.timeLabel} CET
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            forecast
              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {forecast ? "Forecast" : "Observed"}
        </span>
      </div>
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
      className={`h-28 w-28 shrink-0 ${
        gusting ? "animate-[spin_500ms_linear_2]" : ""
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

      {/* travel-direction indicator: filled triangle pointing outward on the ring edge */}
      <g transform={`rotate(${travelBearing} 50 50)`}>
        <polygon points="50,2 44,14 56,14" fill="#0ea5e9" opacity="0.9" />
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
