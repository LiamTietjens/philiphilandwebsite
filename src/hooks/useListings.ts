import { useEffect, useState } from "react";
import type { Chip, Listing } from "../data/types.ts";
import { LISTINGS_API } from "../lib/api.ts";
import { badgeFor, tagsFor } from "../lib/amenities.ts";

export type ListingsStatus = "loading" | "ready" | "error";

interface State {
  listings: Listing[];
  status: ListingsStatus;
}

// The public-listings Supabase Edge Function — it holds the Guesty OAuth
// secret and mints one shared token server-side (see
// backend/supabase/functions/public-listings), rather than the browser
// minting its own against Guesty's ~5-token/24h cap.
const API = LISTINGS_API;

interface RawListing {
  id: string;
  name: string;
  town: string;
  type: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  currency: string;
  cleaningFee: number;
  weeklyFactor: number;
  photos: string[];
  summary: string;
  amenities: string[];
  badge?: string;
}

function mapListing(r: RawListing): Listing {
  const tags = tagsFor(r.amenities).slice(0, 3);
  return { ...r, tags, badge: r.badge ?? badgeFor(tags, r.guests) };
}

/**
 * Loads listings from the public-listings endpoint (Guesty-backed via our
 * Supabase backend). If that fails or is too slow the status becomes "error"
 * and the page says so — it never substitutes made-up sample homes.
 */
export function useListings(): State {
  const [state, setState] = useState<State>({
    listings: [],
    status: "loading",
  });

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    // A stuck request must end in an honest error, not an endless "Loading…".
    const timer = setTimeout(() => ctrl.abort(), 30_000);

    fetch(API, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`listings ${r.status}`);
        return r.json();
      })
      .then((data: RawListing[]) => {
        if (!alive) return;
        const listings = Array.isArray(data) ? data.map(mapListing) : [];
        setState(listings.length ? { listings, status: "ready" } : { listings: [], status: "error" });
      })
      .catch(() => {
        if (alive) setState({ listings: [], status: "error" });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  return state;
}

/**
 * Filter chips built from the listings actually present, rather than a
 * hard-coded town list: this portfolio spans eleven suburbs (Cowes dominates
 * with ~46, then a long tail of one-offs like Rhyll and Ventnor), so a fixed
 * list would both miss towns and advertise empty ones.
 */
export function chipsFor(listings: Listing[]): Chip[] {
  const towns = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const l of listings) {
    towns.set(l.town, (towns.get(l.town) ?? 0) + 1);
    for (const t of l.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
  }

  const byCount = (a: [string, number], b: [string, number]) => b[1] - a[1] || a[0].localeCompare(b[0]);

  return [
    { value: "all", label: "All homes", kind: "all" as const },
    // A town chip that matches everything is just the "All homes" chip again.
    ...[...towns.entries()]
      .filter(([, n]) => n < listings.length)
      .sort(byCount)
      .map(([label]) => ({ value: label, label, kind: "town" as const })),
    ...[...tags.entries()]
      .filter(([, n]) => n < listings.length)
      .sort(byCount)
      .map(([label]) => ({ value: label, label, kind: "tag" as const })),
  ];
}
