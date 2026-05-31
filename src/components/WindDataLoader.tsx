import { WindDateCarousel } from "@/components/WindDateCarousel";
import { fetchWindForDates } from "@/lib/openMeteo";
import { type Leg, type Point } from "@/lib/wind";

type DateOption = {
  value: string;
  label: string;
};

type Props = {
  dateOptions: DateOption[];
  selectedIndex: number;
  legs: Leg[];
  routePoints: Point[];
  morningHour: number;
  eveningHour: number;
};

export async function WindDataLoader({
  dateOptions,
  selectedIndex,
  legs,
  routePoints,
  morningHour,
  eveningHour,
}: Props) {
  let dataByDate: Awaited<ReturnType<typeof fetchWindForDates>> = {};
  let error: string | null = null;

  try {
    dataByDate = await fetchWindForDates(
      dateOptions.map((o) => o.value),
      routePoints,
      { morningHour, eveningHour }
    );
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Could not load wind data: {error}
        </div>
      )}
      <WindDateCarousel
        options={dateOptions}
        initialIndex={selectedIndex}
        legs={legs}
        dataByDate={dataByDate}
      />
    </>
  );
}
