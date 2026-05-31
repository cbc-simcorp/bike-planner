export const BIKE_QUOTES = [
  "Don't be a skeptic, bike electric!",
  "Dance like a butterfly, sprint like a bee",
  "Vingegaard is watching, keep going!",
  "Veni, vidi, velo",
  "Skip depresssion, Race the section",
  "Make the little mermaid turn her head",
  "Relatively speaking, you're already faster.",
  "Carpe velo, seize the bike.",
  "May the watts be with you.",
  "A bike is a bike is a bike",
  "Watts up? You are.",
  "The peloton called — they want you up front.",
  "Cross every bridge in Copenhagen, then cross it again.",
  "To bike or not to bike — there's no question.",
  "Less scrolling, more rolling.",
  "I bike, therefore I am.",
  "Less psychics, more physics",
  "Nyhavn is prettier from a saddle.",
  "Keep calm and bike to work",
  "Heisenberg is certain: you should be biking.",
  "Hygge on wheels.",
  "No focaccia, just Pogačar",
] as const;

const RECENT_WINDOW = Math.max(1, Math.min(8, BIKE_QUOTES.length - 1));

let recentIndexes: number[] = [];

export function pickRandomBikeQuote(): string {
  if (!BIKE_QUOTES.length) return "";

  let candidates = BIKE_QUOTES
    .map((_, idx) => idx)
    .filter((idx) => !recentIndexes.includes(idx));

  if (!candidates.length) {
    candidates = BIKE_QUOTES.map((_, idx) => idx);
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
  recentIndexes = [...recentIndexes, chosen].slice(-RECENT_WINDOW);
  return BIKE_QUOTES[chosen];
}
