import { useMemo, useState } from "react";
import type { Listing } from "../data/types.ts";
import { useBooking } from "../context/booking.tsx";
import { useFromPrices, useStaySearch } from "../hooks/useLivePricing.ts";
import { chipsFor } from "../hooks/useListings.ts";
import type { ListingsStatus } from "../hooks/useListings.ts";
import { stayCost } from "../lib/booking.ts";
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
 * by submitting Search. Destination, guests and dates come from the submitted
 * search (BookingProvider's `applied`); the chip row filters immediately.
 *
 * With dates, Guesty is asked which homes can actually be booked for that
 * stay: homes that are booked (or whose minimum stay isn't met) are hidden,
 * and the rest are priced night by night from Guesty's calendar. If Guesty
 * can't be reached nothing is hidden or priced — availability is never guessed.
 */
export function HomesPage({ listings, status, onOpen }: Props) {
  const b = useBooking();
  const [chip, setChip] = useState("all");
  const chips = useMemo(() => chipsFor(listings), [listings]);

  const checkIn = b.applied?.checkIn ?? null;
  const checkOut = b.applied?.checkOut ?? null;
  const dated = !!(checkIn && checkOut);
  const range = dated ? `${fmtDay(checkIn)} – ${fmtDay(checkOut)}` : "";

  const ids = useMemo(() => listings.map((l) => l.id), [listings]);
  const from = useFromPrices(ids);
  const search = useStaySearch(ids, checkIn, checkOut);
  const checking = dated && search.status === "loading";

  const shown = checking
    ? []
    : filterListings(listings, chips, b.applied, chip, search.status === "ready" ? search.stay : null);

  // Echo the search back, so an empty or short list is never a mystery.
  const searchParts = [
    b.applied && b.applied.dest !== "all" ? b.applied.dest : null,
    b.applied ? `Sleeps ${b.applied.guests}+` : null,
    dated ? range : null,
  ].filter(Boolean);

  const homes = (n: number) => `${n} ${n === 1 ? "home" : "homes"}`;
  let countText: string;
  if (status === "loading") countText = "Loading homes…";
  else if (status === "error")
    countText = "We couldn't load our homes just now. Please refresh the page, or call us on +61 490 465 855.";
  else if (checking) countText = `Checking availability for ${range}…`;
  else if (shown.length === 0) countText = dated && search.status === "ready" ? "No homes available" : "No homes match";
  else if (dated && search.status === "ready") countText = `${homes(shown.length)} available for ${range}`;
  else if (dated && search.status === "error")
    countText = `Showing ${homes(shown.length)}. We couldn't check availability for ${range}, so dates are confirmed when you book.`;
  else if (shown.length === listings.length) countText = `Showing ${homes(shown.length)}`;
  else countText = `Showing ${shown.length} of ${listings.length} homes`;

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
              dates to see only the homes that are free, with a live total.
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
          {countText}
        </p>

        <div className="grid" id="grid">
          {shown.map((l, i) => {
            const nightly = search.status === "ready" ? search.stay?.[l.id]?.nightly : undefined;
            return (
              <PropertyCard
                key={l.id}
                listing={l}
                index={i}
                onOpen={() => onOpen(l)}
                from={from[l.id]}
                quote={dated ? stayCost(l, checkIn, checkOut, nightly) : null}
              />
            );
          })}
        </div>
        <p
          className={`empty${status === "ready" && !checking && shown.length === 0 ? " show" : ""}`}
          id="empty"
        >
          {dated && search.status === "ready"
            ? "No homes are free for those dates. Try different dates, or fewer nights."
            : "Nothing matches that combination. Try a wider date range, or fewer guests."}
        </p>
      </div>
    </section>
  );
}
