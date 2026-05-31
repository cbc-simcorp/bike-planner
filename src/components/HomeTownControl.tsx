"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type GeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
};

type Props = {
  homeTown: string;
};

export function HomeTownControl({ homeTown }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;

    const input = window.prompt("Update home town", homeTown);
    if (input === null) return;

    const query = input.trim();
    if (!query) return;

    setBusy(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=1&language=en&format=json`
      );

      if (!res.ok) {
        window.alert("Could not update home town right now.");
        return;
      }

      const json = (await res.json()) as GeocodingResponse;
      const hit = json.results?.[0];
      if (!hit) {
        window.alert(`No city match found for \"${query}\".`);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      params.set("home", hit.name);
      params.set("hlat", String(hit.latitude));
      params.set("hlon", String(hit.longitude));

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-lg px-2 py-1 text-sm font-semibold text-sky-700 underline decoration-sky-500/60 underline-offset-4 enabled:hover:text-sky-800 disabled:opacity-60 dark:text-sky-300 dark:decoration-sky-300/60 dark:enabled:hover:text-sky-200"
      aria-label="Update home town"
      title="Tap to update home town"
    >
      {busy ? "Updating..." : homeTown}
    </button>
  );
}
