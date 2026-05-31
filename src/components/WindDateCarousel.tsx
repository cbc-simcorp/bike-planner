"use client";

import { useEffect, useMemo, useRef, useState, type TouchEventHandler } from "react";
import { WindCard } from "@/components/WindCard";
import { type Leg, assessWind } from "@/lib/wind";
import { type LegWind } from "@/lib/openMeteo";

type DateOption = {
  value: string;
  label: string;
};

type DayData = {
  date: string;
  morning: LegWind;
  evening: LegWind;
};

type Props = {
  options: DateOption[];
  initialIndex: number;
  legs: Leg[];
  dataByDate: Record<string, DayData>;
};

export function WindDateCarousel({
  options,
  initialIndex,
  legs,
  dataByDate,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startAtRef = useRef(0);
  const dragBaseIndexRef = useRef(initialIndex);

  const currentOption = options[index] ?? options[0];
  const currentData = dataByDate[currentOption.value];

  const bestLeg = useMemo(() => {
    if (!currentData) return null;
    const scored = legs
      .map((leg) => {
        const w = leg.id === "morning" ? currentData.morning : currentData.evening;
        if (!w?.data) return null;
        const assessment = assessWind(
          w.data.windFromDeg,
          w.data.windSpeedMs,
          leg.travelBearing
        );
        return { leg, assessment };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (!scored.length) return null;
    return scored.reduce((best, current) =>
      current.assessment.along > best.assessment.along ? current : best
    );
  }, [currentData, legs]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (index === 0) {
      url.searchParams.delete("date");
    } else {
      url.searchParams.set("date", options[index].value);
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [index, options]);

  const goToIndex = (target: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, target));
    setIndex(clamped);
    setDragX(0);
    dragBaseIndexRef.current = clamped;
  };

  const onTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
    setIsDragging(true);
    startXRef.current = e.touches[0]?.clientX ?? 0;
    startAtRef.current = performance.now();
    dragBaseIndexRef.current = index;
    setDragX(0);
  };

  const onTouchMove: TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;

    const currentX = e.touches[0]?.clientX ?? startXRef.current;
    let delta = currentX - startXRef.current;

    // Add a little edge resistance at boundaries.
    if ((dragBaseIndexRef.current === 0 && delta > 0) ||
        (dragBaseIndexRef.current === options.length - 1 && delta < 0)) {
      delta *= 0.35;
    }

    setDragX(delta);
  };

  const onTouchEnd: TouchEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    const endX = e.changedTouches[0]?.clientX ?? startXRef.current;
    const delta = endX - startXRef.current;

    const elapsed = Math.max(1, performance.now() - startAtRef.current);
    const velocity = delta / elapsed; // px/ms

    const width = trackRef.current?.clientWidth ?? 1;
    const passedDistance = Math.abs(delta) > width * 0.22;
    const passedVelocity = Math.abs(velocity) > 0.35;

    let next = dragBaseIndexRef.current;

    if (passedDistance || passedVelocity) {
      if (delta < 0) {
        // Finger moved right -> left, advance date.
        next = dragBaseIndexRef.current + 1;
      } else if (delta > 0) {
        // Finger moved left -> right, go back toward today.
        next = dragBaseIndexRef.current - 1;
      }
    }

    goToIndex(next);
  };

  return (
    <section>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goToIndex(index - 1)}
            disabled={index <= 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:enabled:hover:bg-slate-800"
            aria-label="Go to earlier day"
          >
            Previous
          </button>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {currentOption.label}
          </p>
          <button
            type="button"
            onClick={() => goToIndex(index + 1)}
            disabled={index >= options.length - 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:enabled:hover:bg-slate-800"
            aria-label="Go to later day"
          >
            Next
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {options.map((option, idx) => {
            const active = idx === index;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {bestLeg && (
        <section className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
          <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">
            Best leg
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

      <div
        ref={trackRef}
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`flex ${isDragging ? "transition-none" : "transition-transform duration-220 ease-out"}`}
          style={{
            width: `${options.length * 100}%`,
            transform: `translate3d(calc(${-index * 100}% + ${dragX}px), 0, 0)`,
          }}
        >
          {options.map((option) => {
            const dayData = dataByDate[option.value];
            return (
              <div
                key={option.value}
                className="flex-none px-0.5"
                style={{ width: `${100 / options.length}%` }}
              >
                <div className="grid grid-cols-1 gap-4">
                  {legs.map((leg) => {
                    const w = leg.id === "morning" ? dayData?.morning : dayData?.evening;
                    return (
                      <WindCard
                        key={`${option.value}-${leg.id}`}
                        leg={leg}
                        wind={w ?? { hour: leg.hour, data: null, isForecast: false }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
