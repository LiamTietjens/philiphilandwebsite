import { useEffect, useState } from "react";
import { AVAILABILITY_API } from "../lib/api.ts";

export interface Availability {
  /** ISO days that cannot be booked. Empty when the endpoint withheld it. */
  booked: Set<string>;
  /** False when availability is unknown — the calendar must not imply every
   *  date is free, and shows no strike-throughs. */
  known: boolean;
  /** ISO day -> Guesty's nightly price for that night (open nights only). */
  prices: Record<string, number>;
  /** ISO day -> minimum stay when arriving that day. */
  minNights: Record<string, number>;
  /** ISO days nobody may check IN on (the night is free, but Guesty won't start a stay that day). */
  closedToArrival: Set<string>;
  /** ISO days nobody may check OUT on. */
  closedToDeparture: Set<string>;
  /** ISO day -> maximum stay when arriving that day. */
  maxNights: Record<string, number>;
  /** Last day the calendar covers (~12 months out). Beyond it nothing is known. */
  horizon: string | null;
  /** True until the first answer (or failure) arrives. */
  loading: boolean;
}

const UNKNOWN: Availability = {
  booked: new Set<string>(),
  known: false,
  prices: {},
  minNights: {},
  closedToArrival: new Set<string>(),
  closedToDeparture: new Set<string>(),
  maxNights: {},
  horizon: null,
  loading: false,
};
const LOADING: Availability = { ...UNKNOWN, loading: true };

// The public-availability Supabase Edge Function — wraps Guesty's calendar
// server-side. `known: false` is the fallback on any failure (Guesty
// unreachable, a permission regression…), and the calendar must never show
// strike-throughs or prices when that's the case.

// Availability is stable for a page session; cache per listing so reopening
// a property doesn't re-request every time.
const cache = new Map<string, Availability>();

export function useAvailability(listingId: string | null): Availability {
  const [av, setAv] = useState<Availability>(() => (listingId && cache.get(listingId)) || (listingId ? LOADING : UNKNOWN));

  useEffect(() => {
    if (!listingId) return setAv(UNKNOWN);

    const hit = cache.get(listingId);
    if (hit) return setAv(hit);

    let alive = true;
    setAv(LOADING);
    // A stuck request must end as "unknown", not leave the popup loading forever.
    const timeout = AbortSignal.timeout(25_000);
    fetch(`${AVAILABILITY_API}?listingId=${encodeURIComponent(listingId)}`, { signal: timeout })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`availability ${r.status}`))))
      .then(
        (data: {
          booked?: string[];
          known?: boolean;
          prices?: Record<string, number>;
          minNights?: Record<string, number>;
          closedToArrival?: string[];
          closedToDeparture?: string[];
          maxNights?: Record<string, number>;
          horizon?: string;
        }) => {
          const res: Availability = {
            booked: new Set(data.booked ?? []),
            known: !!data.known,
            prices: data.prices ?? {},
            minNights: data.minNights ?? {},
            closedToArrival: new Set(data.closedToArrival ?? []),
            closedToDeparture: new Set(data.closedToDeparture ?? []),
            maxNights: data.maxNights ?? {},
            horizon: data.horizon ?? null,
            loading: false,
          };
          // Only a definite answer is worth keeping; an unknown is retried on the next open.
          if (res.known) cache.set(listingId, res);
          if (alive) setAv(res);
        },
      )
      .catch(() => {
        if (alive) setAv(UNKNOWN);
      });

    return () => {
      alive = false;
    };
  }, [listingId]);

  return av;
}
