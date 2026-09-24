import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { HOMES_HASH, homesHash, parseHomesSearch, parseRoute, sameSearch } from "../lib/route.ts";

/**
 * Shared search state.
 *
 * Dates are "YYYY-MM-DD" strings, not Date objects: every consumer (the
 * calendar grid, Guesty's availability set, the Booking Engine query string)
 * speaks local calendar days, and a Date would invite a toISOString() that
 * silently shifts the day for anyone east of UTC.
 *
 * `applied` is what Search submitted: destination, guest count and the stay
 * dates. The listing page filters and prices from it (a home Guesty says is
 * booked for those dates is hidden); merely picking dates in the search bar
 * changes nothing until Search is pressed.
 *
 * The listing page's URL carries the same search (see lib/route.ts), and the
 * URL wins: loading or navigating to `#/homes?…` sets `applied` (and the search
 * bar's own fields) from it, and the bare `#/homes` clears it. That is what
 * lets a reload, a bookmark or the Back button keep the results.
 */
export interface BookingState {
  dest: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  kids: number;
  dogs: number;
  applied: { dest: string; guests: number; checkIn: string | null; checkOut: string | null } | null;
}

interface BookingContextValue extends BookingState {
  /** adults + kids; dogs are not guests. */
  guests: number;
  /** Link to the listing page. Carries the search-bar dates once both are picked, so the page opens already split into exact matches and alternatives. */
  homesHref: string;
  set: (patch: Partial<BookingState>) => void;
  setRange: (checkIn: string | null, checkOut: string | null) => void;
  step: (key: "adults" | "kids" | "dogs", delta: number) => void;
  apply: () => void;
  reset: () => void;
}

const initial: BookingState = {
  dest: "all",
  checkIn: null,
  checkOut: null,
  adults: 2,
  kids: 0,
  dogs: 0,
  applied: null,
};

/** The state a listing-page URL stands for, or null when the URL carries no search. */
function fromUrl(hash: string): Partial<BookingState> | null {
  const s = parseHomesSearch(hash);
  return s ? { dest: s.dest, checkIn: s.checkIn, checkOut: s.checkOut, adults: s.guests, kids: 0, applied: s } : null;
}

/** Adults can't go below one; children and dogs can. */
const floorFor = (key: "adults" | "kids" | "dogs") => (key === "adults" ? 1 : 0);

const Ctx = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  // Read the URL before the first render, so a reload of a search never flashes the unfiltered list.
  const [state, setState] = useState<BookingState>(() => ({ ...initial, ...fromUrl(window.location.hash) }));

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash;
      if (parseRoute(hash) !== "homes") return;
      const next = fromUrl(hash);
      setState((s) => (sameSearch(s.applied, next?.applied ?? null) ? s : next ? { ...s, ...next } : { ...s, applied: null }));
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const value = useMemo<BookingContextValue>(() => {
    const set = (patch: Partial<BookingState>) => setState((s) => ({ ...s, ...patch }));
    return {
      ...state,
      guests: state.adults + state.kids,
      homesHref:
        state.checkIn && state.checkOut
          ? homesHash({ dest: state.dest, guests: state.adults + state.kids, checkIn: state.checkIn, checkOut: state.checkOut })
          : HOMES_HASH,
      set,
      setRange: (checkIn, checkOut) => set({ checkIn, checkOut }),
      step: (key, delta) =>
        setState((s) => ({ ...s, [key]: Math.max(floorFor(key), s[key] + delta) })),
      apply: () =>
        setState((s) => ({
          ...s,
          applied: { dest: s.dest, guests: s.adults + s.kids, checkIn: s.checkIn, checkOut: s.checkOut },
        })),
      reset: () => setState(initial),
    };
  }, [state]);

  return <Ctx value={value}>{children}</Ctx>;
}

export function useBooking(): BookingContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBooking must be used within BookingProvider");
  return v;
}
