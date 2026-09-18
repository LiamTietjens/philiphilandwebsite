import type { Listing } from "./types.ts";
import { badgeFor, tagsFor } from "../lib/amenities.ts";

// Offline fallback, shown only when Guesty is unreachable — missing
// credentials, CORS, or the ~5-token/24h cap (see src/lib/guesty.ts). A small
// extracted subset of the real portfolio's photos, bundled under
// /public/images/sample so the site still renders with something real.
const g = (prop: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/images/sample/${prop}-${String(i).padStart(2, "0")}.webp`);

function withDerived(l: Omit<Listing, "tags" | "badge">): Listing {
  const tags = tagsFor(l.amenities).slice(0, 3);
  return { ...l, tags, badge: badgeFor(tags, l.guests) };
}

export const SAMPLE_LISTINGS: Listing[] = [
  withDerived({
    id: "sample-beachfront",
    name: "Ultimate Beachfront Retreat",
    town: "Sunderland Bay",
    type: "House",
    guests: 12,
    bedrooms: 5,
    bathrooms: 2.5,
    price: 450,
    currency: "AUD",
    cleaningFee: 0,
    weeklyFactor: 1,
    photos: g("beachfront", 5),
    summary:
      "A five-bedroom home in Sunderland Bay looking straight out over unbroken ocean. It sleeps twelve across two levels, with living space on both, so everyone gets their own corner of the day.",
    amenities: [
      "Near Ocean",
      "Beach access",
      "Two full living areas",
      "Patio or balcony",
      "Kitchen",
      "Dishwasher",
      "Indoor fireplace",
      "Free parking on premises",
    ],
  }),
  withDerived({
    id: "sample-haven",
    name: "Haven Stay Retreat",
    town: "Newhaven",
    type: "House",
    guests: 8,
    bedrooms: 4,
    bathrooms: 2,
    price: 302,
    currency: "AUD",
    cleaningFee: 0,
    weeklyFactor: 1,
    photos: g("haven", 5),
    summary:
      "A light-filled haven tucked away in secluded Newhaven, a short hop from everything Phillip Island and San Remo have to offer. A sea outlook from the deck and a quiet beach a stroll away.",
    amenities: [
      "Sea view",
      "Garden or backyard",
      "Fire pit",
      "TV",
      "Wireless Internet",
      "Washer",
      "Free parking on street",
    ],
  }),
  withDerived({
    id: "sample-villa",
    name: "Family Villa, Pool & Hot Tub",
    town: "Cowes",
    type: "Villa",
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    price: 210,
    currency: "AUD",
    cleaningFee: 0,
    weeklyFactor: 1,
    photos: g("villa", 5),
    summary:
      "A self-contained villa within our family resort in Cowes, with shared access to the heated pool and hot tub. A base for families who want the island on their doorstep.",
    amenities: [
      "Communal pool",
      "Hot tub",
      "Kitchen",
      "Bathtub",
      "Heating",
      "Free parking on premises",
    ],
  }),
];
