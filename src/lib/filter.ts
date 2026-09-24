import type { Chip, Listing } from "../data/types.ts";
import { fmtRange, nightsBetween } from "./dates.ts";

/** How many homes the landing page features before pointing at the full list. */
export const FEATURED_COUNT = 5;

/** What Search applied: destination town ("all" = anywhere), minimum guests, and the stay dates. */
export interface AppliedSearch {
  dest: string;
  guests: number;
  checkIn?: string | null;
  checkOut?: string | null;
}

/**
 * Guesty's verdict on one home for the searched dates (from the
 * public-availability endpoint). `known: false` means Guesty didn't answer —
 * which must never be read as "free".
 */
export interface StayInfo {
  known: boolean;
  available?: boolean;
  reason?: "booked" | "min_nights";
  /** One real Guesty price per night of the stay, when every night has one. */
  nightly?: number[];
  minNights?: number;
  /**
   * When the exact stay isn't bookable: the runs of consecutive nights inside it
   * that ARE free (arrive `from`, leave `to`). Non-empty = a partial match.
   */
  segments?: { from: string; to: string }[];
}

export type StayMap = Record<string, StayInfo>;

/** The landing page's short list: the first few homes in feed order. */
export function featuredListings(listings: Listing[], count = FEATURED_COUNT): Listing[] {
  return listings.slice(0, count);
}

/**
 * The all-homes page filter. Destination + guest count only apply once Search
 * has been submitted (`applied`); the chip row filters immediately. When the
 * searched dates have been checked (`stay`), homes with no free night in them
 * are hidden — but only on a definite "no": unknown or unchecked homes stay
 * visible, and homes free for only some nights are kept (see splitByStay).
 */
export function filterListings(
  listings: Listing[],
  chips: Chip[],
  applied: AppliedSearch | null,
  chip: string,
  stay?: StayMap | null,
): Listing[] {
  return listings.filter((l) => {
    if (applied && applied.dest !== "all" && l.town !== applied.dest) return false;
    if (applied && l.guests < applied.guests) return false;
    const s = stay?.[l.id];
    // Only a home with NO free night at all is dropped; one with some free
    // nights is a partial match and stays for the second section.
    if (s && s.known && s.available === false && !(s.segments && s.segments.length > 0)) return false;
    if (chip === "all") return true;
    const asChip = chips.find((c) => c.value === chip);
    if (asChip?.kind === "town") return l.town === chip;
    return l.tags.includes(chip);
  });
}

/** How many of the searched nights are free in this home. */
export function freeNights(info: StayInfo | undefined): number {
  if (!info?.segments) return 0;
  return info.segments.reduce((n, seg) => n + nightsBetween(seg.from, seg.to), 0);
}

export interface StaySplit {
  /** Free for every night of the searched dates. */
  exact: Listing[];
  /** Free for only some of them (most free nights first), then any Guesty couldn't confirm. */
  partial: Listing[];
}

/**
 * Split the (already filtered) homes into the two result sections. Homes with no
 * free night are left out of both. Without search results everything is `exact`
 * — there are no sections to show. A home is only ever called "exact" when
 * Guesty confirmed it: unknown or unchecked homes go to the end of `partial`.
 */
export function splitByStay(listings: Listing[], stay: StayMap | null): StaySplit {
  if (!stay) return { exact: listings, partial: [] };

  const exact: Listing[] = [];
  const someFree: { l: Listing; nights: number; i: number }[] = [];
  const unconfirmed: Listing[] = [];

  listings.forEach((l, i) => {
    const s = stay[l.id];
    if (!s || !s.known) unconfirmed.push(l);
    else if (s.available) exact.push(l);
    else if (s.segments && s.segments.length > 0) someFree.push({ l, nights: freeNights(s), i });
    // else: fully booked — in neither section
  });

  someFree.sort((a, b) => b.nights - a.nights || a.i - b.i);
  return { exact, partial: [...someFree.map((x) => x.l), ...unconfirmed] };
}

/** The line on a partial-match card saying what is (and isn't) free. */
export function partialNote(info: StayInfo | undefined, totalNights: number): string {
  if (!info || !info.known) return "Availability couldn't be confirmed for these dates";

  if (info.reason === "min_nights") {
    const need = info.minNights ? `${info.minNights} nights` : "a longer stay";
    return `Free for your dates, but this home needs a minimum stay of ${need}`;
  }

  const ranges = (info.segments ?? []).map((seg) => fmtRange(seg.from, seg.to));
  let list: string;
  if (ranges.length <= 1) list = ranges.join("");
  else if (ranges.length <= 3) list = `${ranges.slice(0, -1).join(", ")} and ${ranges[ranges.length - 1]}`;
  else list = `${ranges[0]}, ${ranges[1]} and ${ranges.length - 2} more`;

  return `Free ${list} · ${freeNights(info)} of ${totalNights} nights`;
}
