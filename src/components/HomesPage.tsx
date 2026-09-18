import { useMemo, useState } from "react";
import type { Listing } from "../data/types.ts";
import { useBooking } from "../context/booking.tsx";
import { chipsFor } from "../hooks/useListings.ts";
import type { ListingsStatus } from "../hooks/useListings.ts";
import { fmtDay } from "../lib/dates.ts";
import { filterListings } from "../lib/filter.ts";
import { PropertyCard } from "./PropertyCard.tsx";

const backArrow = (
  <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
    <path d="M17 4.5H2M5.5 1L2 4.5 5.5 8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

interface Props {
  listings: Listing[];
  status: ListingsStatus;
  onOpen: (listing: Listing) => void;
}

/**
 * The full listing page, reached from the landing page's "Show all" button or
 * by submitting Search. Destination + guests come from the submitted search
 * (BookingProvider's `applied`); the chip row filters immediately.
 */
export function HomesPage({ listings, status, onOpen }: Props) {
  const b = useBooking();
  const [chip, setChip] = useState("all");
  const chips = useMemo(() => chipsFor(listings), [listings]);
  const shown = filterListings(listings, chips, b.applied, chip);

  // Echo the search back, so an empty or short list is never a mystery.
  const searchParts = [
    b.applied && b.applied.dest !== "all" ? b.applied.dest : null,
    b.applied ? `Sleeps ${b.applied.guests}+` : null,
    b.checkIn && b.checkOut ? `${fmtDay(b.checkIn)} – ${fmtDay(b.checkOut)}` : null,
  ].filter(Boolean);

  return (
    <section className="sec homes-page" id="homes">
      <div className="wrap">
        <a href="#top" className="link-u homes-back" style={{ color: "var(--sea)" }}>
          {backArrow} Back to home
        </a>

        <div className="sec-head rv">
          <div className="txt">
            <span className="eyebrow">Our houses</span>
            <h1 className="serif d2">All our homes.</h1>
            <p className="lede">
              Every house we look after across Phillip Island and San Remo. Filter by town or feature, or pick
              dates to see a live total on each home.
            </p>
          </div>
        </div>

        {searchParts.length > 0 && (
          <div className="homes-search rv">
            <span>{searchParts.join("  ·  ")}</span>
            <a href="#search" className="link-u" style={{ color: "var(--sea)" }}>
              Change search
            </a>
            {b.applied && (
              <button type="button" className="link-u" onClick={() => b.set({ applied: null })}>
                Clear
              </button>
            )}
          </div>
        )}

        <div className="chips rv" id="chips">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`chip${chip === c.value ? " on" : ""}`}
              onClick={() => setChip(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="count" id="count">
          {status === "loading"
            ? "Loading homes…"
            : shown.length === 0
              ? "No homes match"
              : shown.length === listings.length
                ? `Showing ${shown.length} ${shown.length === 1 ? "home" : "homes"}`
                : `Showing ${shown.length} of ${listings.length} homes`}
        </p>

        <div className="grid" id="grid">
          {shown.map((l, i) => (
            <PropertyCard key={l.id} listing={l} index={i} onOpen={() => onOpen(l)} />
          ))}
        </div>
        <p className={`empty${status !== "loading" && shown.length === 0 ? " show" : ""}`} id="empty">
          Nothing matches that combination. Try a wider date range, or fewer guests.
        </p>
      </div>
    </section>
  );
}
