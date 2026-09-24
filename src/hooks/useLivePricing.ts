import { useEffect, useMemo, useState } from "react";
import { AVAILABILITY_API } from "../lib/api.ts";
import type { StayMap } from "../lib/filter.ts";

// Every price and every availability answer on the site comes from Guesty's
// calendar via the public-availability endpoint. A listing's flat `basePrice`
// is not what Guesty charges (it matched the calendar on almost no nights and
// overstated it by up to a third), so it is never displayed.

/**
 * Each home's "from" price: its cheapest open night in the next 12 months.
 * `undefined` = not loaded yet · `null` = Guesty didn't give one (unknown, or
 * nothing open) — never a made-up number.
 */
export type FromMap = Record<string, number | null | undefined>;

const fromCache = new Map<string, number | null>();

/** The server gives up on Guesty after 30s; wait a little longer, then treat it as "couldn't check". */
const REQUEST_TIMEOUT_MS = 45_000;

async function post<T>(body: unknown, signal: AbortSignal): Promise<T> {
  // Aborts on the caller's signal (component gone) or on the timeout, whichever comes first.
  const guard = new AbortController();
  const timer = setTimeout(() => guard.abort(), REQUEST_TIMEOUT_MS);
  signal.addEventListener("abort", () => guard.abort(), { once: true });
  try {
    const res = await fetch(AVAILABILITY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: guard.signal,
    });
    if (!res.ok) throw new Error(`availability ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Real "from" prices for these homes. Cached for the page session; only unseen homes are requested. */
export function useFromPrices(ids: string[]): FromMap {
  const key = ids.join(",");
  const [, bump] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const missing = ids.filter((id) => !fromCache.has(id));
    if (missing.length === 0) return;

    const ctrl = new AbortController();
    (async () => {
      // The endpoint takes at most 150 homes per request.
      for (let i = 0; i < missing.length; i += 150) {
        const chunk = missing.slice(i, i + 150);
        try {
          const data = await post<{ listings: Record<string, { known: boolean; from?: number | null }> }>({ listingIds: chunk }, ctrl.signal);
          for (const id of chunk) {
            const l = data.listings?.[id];
            fromCache.set(id, l?.known && typeof l.from === "number" ? l.from : null);
          }
          bump((n) => n + 1);
        } catch {
          if (ctrl.signal.aborted) return;
          // Not cached, so it is retried next time — but don't leave the card loading forever.
          setFailed((f) => new Set([...f, ...chunk]));
        }
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMemo(() => {
    const out: FromMap = {};
    for (const id of ids) out[id] = fromCache.has(id) ? fromCache.get(id) : failed.has(id) ? null : undefined;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, failed, fromCache.size]);
}

export interface StaySearch {
  /** idle: no dates · loading · ready: Guesty answered · error: couldn't check (nothing may be hidden or priced). */
  status: "idle" | "loading" | "ready" | "error";
  stay: StayMap | null;
  /** Ask Guesty again after an error. */
  retry: () => void;
}

const staySearchCache = new Map<string, StayMap>();

/**
 * For the searched dates, ask Guesty whether each home is bookable and what
 * each night costs. Idle until both dates are set.
 */
export function useStaySearch(ids: string[], checkIn: string | null, checkOut: string | null): StaySearch {
  const cacheKey = checkIn && checkOut && ids.length ? `${checkIn}|${checkOut}|${ids.join(",")}` : null;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: "ready" | "error"; stay: StayMap | null } | null>(null);
  const retry = () => setAttempt((n) => n + 1);
  const resultKey = cacheKey ? `${cacheKey}#${attempt}` : null;

  useEffect(() => {
    if (!cacheKey || !checkIn || !checkOut) return;
    if (staySearchCache.has(cacheKey)) {
      setResult({ key: resultKey!, state: "ready", stay: staySearchCache.get(cacheKey)! });
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        // The endpoint takes at most 150 homes per request.
        const stay: StayMap = {};
        for (let i = 0; i < ids.length; i += 150) {
          const data = await post<{ listings: StayMap }>({ listingIds: ids.slice(i, i + 150), checkIn, checkOut }, ctrl.signal);
          Object.assign(stay, data.listings);
        }
        staySearchCache.set(cacheKey, stay);
        setResult({ key: resultKey!, state: "ready", stay });
      } catch {
        if (!ctrl.signal.aborted) setResult({ key: resultKey!, state: "error", stay: null });
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, attempt]);

  if (!cacheKey) return { status: "idle", stay: null, retry };
  // A result for different dates (or an earlier attempt) is stale — treat as loading until the new one lands.
  if (!result || result.key !== resultKey) return { status: "loading", stay: null, retry };
  return { status: result.state, stay: result.stay, retry };
}
