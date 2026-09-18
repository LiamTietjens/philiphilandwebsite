import { useEffect, useState } from "react";

export interface Availability {
  /** ISO days that cannot be booked. Empty when the endpoint withheld it. */
  booked: Set<string>;
  /** False when availability is unknown — the calendar must not imply every
   *  date is free, and shows no strike-throughs. */
  known: boolean;
}

const UNKNOWN: Availability = { booked: new Set<string>(), known: false };

// The public-availability Supabase Edge Function — wraps Guesty's calendar
// server-side. This account 403'd on that scope until 2026-09-18 (see
// backend/supabase/functions/_shared/guesty.ts:6-11); it now returns real
// booked dates. `known: false` is still the fallback on any failure — the
// endpoint isn't deployed, Guesty is unreachable, or a permission regresses —
// and the calendar must never show strike-throughs when that's the case.
const API = import.meta.env.VITE_AVAILABILITY_API as string | undefined;

// Availability is stable for a page session; cache per listing so reopening
// a property doesn't re-request every time.
const cache = new Map<string, Availability>();

export function useAvailability(listingId: string | null): Availability {
  const [av, setAv] = useState<Availability>(() => (listingId && cache.get(listingId)) || UNKNOWN);

  useEffect(() => {
    if (!listingId || !API) return setAv(UNKNOWN);

    const hit = cache.get(listingId);
    if (hit) return setAv(hit);

    let alive = true;
    setAv(UNKNOWN);
    fetch(`${API}?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`availability ${r.status}`))))
      .then((data: { booked: string[]; known: boolean }) => {
        const res: Availability = { booked: new Set(data.booked ?? []), known: !!data.known };
        cache.set(listingId, res);
        if (alive) setAv(res);
      })
      .catch(() => {
        if (alive) setAv(UNKNOWN);
      });

    return () => {
      alive = false;
    };
  }, [listingId]);

  return av;
}
