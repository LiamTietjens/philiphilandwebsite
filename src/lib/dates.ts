// Calendar primitives. All dates are handled as local-midnight Date objects
// and "YYYY-MM-DD" strings — never as UTC ISO timestamps, because a stay is
// a set of local calendar days, and toISOString() would shift them a day for
// anyone east of UTC (which includes every guest on Phillip Island).

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Monday-first, matching the prototype's calendar grid. */
export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The homes are on Phillip Island, and Guesty's availability window starts on the island's today. */
const ISLAND_TZ = "Australia/Melbourne";

/**
 * Today's calendar day ON THE ISLAND, as a local-midnight Date. Not the
 * visitor's own day: while it is evening in Europe or India the island is
 * already tomorrow, and offering the visitor "today" then asks Guesty about a
 * night that is in the past there (the server answers 422 outside_window).
 */
export function today(now: Date = new Date()): Date {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: ISLAND_TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The last day a stay can be searched for. Availability is fetched about 12
 * months ahead, so the search calendar stops a few days short of that rather
 * than offering dates nobody has checked.
 */
export function searchHorizon(): string {
  const d = today();
  d.setDate(d.getDate() + 360);
  return iso(d);
}

/** "Sat 14 Mar" — the compact form the search fields show once a date is set. */
export function fmtDay(s: string | null): string {
  if (!s) return "";
  const d = parseISO(s);
  return `${DOW[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/**
 * A compact date range for notes: "13 – 15 Oct", or "30 Oct – 2 Nov" across a
 * month boundary. Used for the free stretches of a partly-available home.
 */
export function fmtRange(from: string, to: string): string {
  const a = parseISO(from);
  const b = parseISO(to);
  const mon = (d: Date) => MONTHS[d.getMonth()].slice(0, 3);
  if (from === to) return `${a.getDate()} ${mon(a)}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()} – ${b.getDate()} ${mon(b)}`;
  return `${a.getDate()} ${mon(a)} – ${b.getDate()} ${mon(b)}`;
}

/** Each night of a stay as YYYY-MM-DD: the arrival day up to, not including, the departure day. */
export function nightsOf(a: string | null, b: string | null): string[] {
  const n = nightsBetween(a, b);
  if (!a || n <= 0) return [];
  const d = parseISO(a);
  return Array.from({ length: n }, () => {
    const day = iso(d);
    d.setDate(d.getDate() + 1);
    return day;
  });
}

/** Nights between two YYYY-MM-DD strings; 0 when either is missing. */
export function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 864e5);
}

/** Days in a month, and the Monday-first lead offset for its first cell. */
export function monthShape(base: Date): { lead: number; days: number } {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  return {
    lead: (first.getDay() + 6) % 7,
    days: new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(),
  };
}

export const addMonths = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);
