import type { Chip, Listing } from "../data/types.ts";

/** How many homes the landing page features before pointing at the full list. */
export const FEATURED_COUNT = 5;

/** What Search applied: destination town ("all" = anywhere) and minimum guests. */
export interface AppliedSearch {
  dest: string;
  guests: number;
}

/** The landing page's short list: the first few homes in feed order. */
export function featuredListings(listings: Listing[], count = FEATURED_COUNT): Listing[] {
  return listings.slice(0, count);
}

/**
 * The all-homes page filter. Destination + guest count only apply once Search
 * has been submitted (`applied`); the chip row filters immediately.
 */
export function filterListings(
  listings: Listing[],
  chips: Chip[],
  applied: AppliedSearch | null,
  chip: string,
): Listing[] {
  return listings.filter((l) => {
    if (applied && applied.dest !== "all" && l.town !== applied.dest) return false;
    if (applied && l.guests < applied.guests) return false;
    if (chip === "all") return true;
    const asChip = chips.find((c) => c.value === chip);
    if (asChip?.kind === "town") return l.town === chip;
    return l.tags.includes(chip);
  });
}
