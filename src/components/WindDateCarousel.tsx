"use client";

import { useEffect, useRef, useState, type TouchEventHandler } from "react";
import { WindCard } from "@/components/WindCard";
import { type Leg } from "@/lib/wind";
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
    startAtRef.current = e.timeStamp;
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

    const elapsed = Math.max(1, e.timeStamp - startAtRef.current);
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
    <section className="flex flex-col gap-4">
      <div
        ref={trackRef}
        className="overflow-hidden py-1"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`flex ${isDragging ? "transition-none" : "transition-transform duration-220 ease-out"}`}
          style={{
            width: `${options.length * 100}%`,
            transform: `translate3d(calc(${-(index * (100 / options.length))}% + ${dragX}px), 0, 0)`,
          }}
        >
          {options.map((option) => {
            const dayData = dataByDate[option.value];
            return (
              <div
                key={option.value}
                className="flex-none px-1"
                style={{ width: `${100 / options.length}%` }}
              >
                <div className="grid grid-cols-1 gap-3">
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

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-2">
          {options.map((option, idx) => {
            const active = idx === index;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => goToIndex(idx)}
                className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-sky-600 text-white ring-2 ring-sky-300 shadow-sm dark:bg-sky-500 dark:text-slate-950 dark:ring-sky-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
