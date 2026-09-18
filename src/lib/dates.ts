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

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "Sat 14 Mar" — the compact form the search fields show once a date is set. */
export function fmtDay(s: string | null): string {
  if (!s) return "";
  const d = parseISO(s);
  return `${DOW[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
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
