import type { Chip, Listing } from "../data/types.ts";

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
}

export type StayMap = Record<string, StayInfo>;

/** The landing page's short list: the first few homes in feed order. */
export function featuredListings(listings: Listing[], count = FEATURED_COUNT): Listing[] {
  return listings.slice(0, count);
}

/**
 * The all-homes page filter. Destination + guest count only apply once Search
 * has been submitted (`applied`); the chip row filters immediately. When the
 * searched dates have been checked (`stay`), homes Guesty says can't be booked
 * for them are hidden — but only on a definite "no": unknown or unchecked
 * homes stay visible.
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
    if (s && s.known && s.available === false) return false;
    if (chip === "all") return true;
    const asChip = chips.find((c) => c.value === chip);
    if (asChip?.kind === "town") return l.town === chip;
    return l.tags.includes(chip);
  });
}
