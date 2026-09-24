import { iso, parseISO, searchHorizon, today } from "./dates.ts";

export type Route = "home" | "homes";

/** Hash of the all-homes listing page. */
export const HOMES_HASH = "#/homes";

/**
 * Hash routing needs no server rewrite rules, and every landing-page anchor
 * (`#owners`, `#search`, …) keeps working untouched: anything that isn't
 * `#/homes` is the landing page.
 */
export function parseRoute(hash: string): Route {
  return /^#\/homes(?:[/?].*)?$/.test(hash) ? "homes" : "home";
}

/** What a search is, as far as the listing page is concerned. Dates are both set or both null. */
export interface HomesSearch {
  dest: string;
  guests: number;
  checkIn: string | null;
  checkOut: string | null;
}

/**
 * The listing page's URL for a search, e.g.
 * `#/homes?dest=Cowes&guests=4&checkIn=2026-10-13&checkOut=2026-10-17`.
 * The search lives in the URL so that reloading the page, opening a shared
 * link or coming back with the browser's Back button still shows the same
 * results. Dates only go in once both are chosen.
 */
export function homesHash(s: { dest: string; guests: number; checkIn: string | null; checkOut: string | null }): string {
  const q = new URLSearchParams({ dest: s.dest, guests: String(s.guests) });
  if (s.checkIn && s.checkOut) {
    q.set("checkIn", s.checkIn);
    q.set("checkOut", s.checkOut);
  }
  return `${HOMES_HASH}?${q}`;
}

const MAX_DEST = 40;
const MAX_GUESTS = 30;

const isRealDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(parseISO(s)) === s;

/**
 * The search carried by a listing-page hash, or null when the hash has none
 * (the bare `#/homes`, another page, or a query string that isn't ours). The
 * URL is user-editable, so everything is checked: nonsense falls back to
 * "anywhere" / 2 guests, and dates that aren't a real, future, in-range stay
 * are dropped rather than sent to Guesty.
 */
export function parseHomesSearch(hash: string): HomesSearch | null {
  if (parseRoute(hash) !== "homes") return null;
  const at = hash.indexOf("?");
  if (at < 0) return null;

  const q = new URLSearchParams(hash.slice(at + 1));
  if (!["dest", "guests", "checkIn", "checkOut"].some((k) => q.has(k))) return null;

  const dest = q.get("dest");
  const guests = Number(q.get("guests"));
  const checkIn = q.get("checkIn");
  const checkOut = q.get("checkOut");
  const datesOk =
    isRealDay(checkIn) &&
    isRealDay(checkOut) &&
    checkOut > checkIn &&
    checkIn >= iso(today()) &&
    checkOut <= searchHorizon();

  return {
    dest: dest && dest.length <= MAX_DEST ? dest : "all",
    guests: Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS ? guests : 2,
    checkIn: datesOk ? checkIn : null,
    checkOut: datesOk ? checkOut : null,
  };
}

export function sameSearch(a: HomesSearch | null, b: HomesSearch | null): boolean {
  if (!a || !b) return a === b;
  return a.dest === b.dest && a.guests === b.guests && a.checkIn === b.checkIn && a.checkOut === b.checkOut;
}
