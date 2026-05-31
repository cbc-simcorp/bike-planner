"use client";

import { useRouter } from "next/navigation";
import { useRef, type ReactNode, type TouchEventHandler } from "react";

type DateOption = {
  value: string;
  label: string;
};

type Props = {
  options: DateOption[];
  selectedIndex: number;
  pathname: string;
  children: ReactNode;
};

export function DateRangePane({
  options,
  selectedIndex,
  pathname,
  children,
}: Props) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < options.length - 1;

  const navigateTo = (href: string, direction: "forward" | "backward") => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => {
        finished: Promise<void>;
      };
    };

    document.documentElement.dataset.navDirection = direction;

    if (doc.startViewTransition) {
      doc
        .startViewTransition(() => {
          router.push(href);
        })
        .finished.finally(() => {
          delete document.documentElement.dataset.navDirection;
        });
      return;
    }

    router.push(href);
    delete document.documentElement.dataset.navDirection;
  };

  const goToIndex = (index: number) => {
    if (index < 0 || index > options.length - 1) return;
    const value = options[index].value;
    const direction = index > selectedIndex ? "forward" : "backward";
    if (index === 0) {
      navigateTo(pathname, direction);
    } else {
      navigateTo(`${pathname}?date=${value}`, direction);
    }
  };

  const onTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd: TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    // Swipe right => future day, swipe left => move back toward today.
    if (delta > 40) {
      goToIndex(selectedIndex + 1);
    } else if (delta < -40) {
      goToIndex(selectedIndex - 1);
    }
  };

  return (
    <section onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goToIndex(selectedIndex - 1)}
            disabled={!canGoPrev}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:enabled:hover:bg-slate-800"
            aria-label="Go to earlier day"
          >
            Previous
          </button>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {options[selectedIndex]?.label}
          </p>
          <button
            type="button"
            onClick={() => goToIndex(selectedIndex + 1)}
            disabled={!canGoNext}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:enabled:hover:bg-slate-800"
            aria-label="Go to later day"
          >
            Next
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {options.map((option, index) => {
            const active = index === selectedIndex;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => goToIndex(index)}
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

      <div className="date-cards-pane">{children}</div>
    </section>
  );
}
