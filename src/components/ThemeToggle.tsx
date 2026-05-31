"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bike_theme";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path
            d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 12.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 17Zm7.25-5a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5ZM6.25 12a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 4 12.75.75.75 0 0 1 4.75 12h1.5Zm10.12 5.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06ZM8.69 8.38a.75.75 0 0 1 1.06 1.06L8.69 10.5a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm8.74 2.12a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L17.43 10.5ZM8.69 15a.75.75 0 0 1 1.06 1.06L8.69 17.12a.75.75 0 1 1-1.06-1.06L8.69 15ZM12 8.5a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path
            d="M14.53 3.44a.75.75 0 0 1 .86.95A8 8 0 1 0 19.61 14a.75.75 0 0 1 .95.86 9.5 9.5 0 1 1-6.98-11.42.75.75 0 0 1 .95 0Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
