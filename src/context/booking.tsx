import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Shared search state.
 *
 * Dates are "YYYY-MM-DD" strings, not Date objects: every consumer (the
 * calendar grid, Guesty's availability set, the Booking Engine query string)
 * speaks local calendar days, and a Date would invite a toISOString() that
 * silently shifts the day for anyone east of UTC.
 *
 * `applied` mirrors the prototype's two-stage behaviour: changing dates
 * re-quotes every card immediately, but destination and guest count only
 * filter the grid once Search is submitted.
 */
export interface BookingState {
  dest: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  kids: number;
  dogs: number;
  applied: { dest: string; guests: number } | null;
}

interface BookingContextValue extends BookingState {
  /** adults + kids; dogs are not guests. */
  guests: number;
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

/** Adults can't go below one; children and dogs can. */
const floorFor = (key: "adults" | "kids" | "dogs") => (key === "adults" ? 1 : 0);

const Ctx = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initial);

  const value = useMemo<BookingContextValue>(() => {
    const set = (patch: Partial<BookingState>) => setState((s) => ({ ...s, ...patch }));
    return {
      ...state,
      guests: state.adults + state.kids,
      set,
      setRange: (checkIn, checkOut) => set({ checkIn, checkOut }),
      step: (key, delta) =>
        setState((s) => ({ ...s, [key]: Math.max(floorFor(key), s[key] + delta) })),
      apply: () =>
        setState((s) => ({ ...s, applied: { dest: s.dest, guests: s.adults + s.kids } })),
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
