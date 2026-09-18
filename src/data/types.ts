// The public shape the site renders, mapped from a raw Guesty listing in
// src/lib/guesty.ts. Only fields that are safe to show a visitor belong here:
// Guesty's own `tags` are internal ops labels (they hold owner names, e.g.
// ["Victor & Aoi"]) and are deliberately never mapped through.
export interface Listing {
  /** Guesty listing _id. */
  id: string;
  /** Marketing name — Guesty title, falling back to nickname. */
  name: string;
  /** Suburb, from address.city (e.g. "Cowes", "Newhaven"). */
  town: string;
  /** Property type, e.g. "House", "Townhouse" (Guesty propertyType). */
  type: string;
  /** Max guests (Guesty accommodates). */
  guests: number;
  bedrooms: number;
  /** May be fractional — Guesty reports e.g. 1.5. */
  bathrooms: number;
  /** Nightly base rate (Guesty prices.basePrice). 0 = not published. */
  price: number;
  /** ISO currency, e.g. "AUD". */
  currency: string;
  /** Cleaning fee (Guesty prices.cleaningFee). 0 on most of this portfolio. */
  cleaningFee: number;
  /** Guesty prices.weeklyPriceFactor — 1 means no weekly discount. */
  weeklyFactor: number;
  /** Hosted photo URLs, best resolution first (original → large → regular). */
  photos: string[];
  /** One-paragraph summary (Guesty publicDescription.summary). */
  summary: string;
  /** Amenity labels, straight from Guesty. */
  amenities: string[];
  /** Display tags derived from amenities — never Guesty's own tags field. */
  tags: string[];
  /** Derived marketing badge, omitted when nothing real distinguishes it. */
  badge?: string;
}

/** Filter chips: "all" plus town and feature filters, built from live data. */
export interface Chip {
  value: string;
  label: string;
  /** "town" matches Listing.town; "tag" matches a derived display tag. */
  kind: "all" | "town" | "tag";
}
