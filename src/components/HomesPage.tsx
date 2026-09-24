import { useMemo, useState } from "react";
import type { Listing, OpenListing } from "../data/types.ts";
import { useBooking } from "../context/booking.tsx";
import { useFromPrices, useStaySearch } from "../hooks/useLivePricing.ts";
import { chipsFor } from "../hooks/useListings.ts";
import type { ListingsStatus } from "../hooks/useListings.ts";
import { avgNightly } from "../lib/booking.ts";
import { fmtDay, fmtRange, nightsBetween } from "../lib/dates.ts";
import { filterListings, partialNote, splitByStay } from "../lib/filter.ts";
import { PropertyCard } from "./PropertyCard.tsx";

const backArrow = (
  <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
    <path d="M17 4.5H2M5.5 1L2 4.5 5.5 8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

interface Props {
  listings: Listing[];
  status: ListingsStatus;
  onOpen: OpenListing;
}

/**
 * The full listing page, reached from the landing page's "Show all" button or
 * by submitting Search. Destination, guests and dates come from the submitted
 * search (BookingProvider's `applied`); the chip row filters immediately.
 *
 * With dates, Guesty is asked about every night of the stay and the results are
 * split in two: homes free for the EXACT dates (their popup opens with the
 * dates pre-filled), then homes free for only PART of them (each says which
 * nights; their popup opens without dates, on the searched month). Homes with no
 * free night at all are left out. If Guesty can't be reached nothing is hidden or
 * priced — availability is never guessed.
 */
export function HomesPage({ listings, status, onOpen }: Props) {
  const b = useBooking();
  const [chip, setChip] = useState("all");
  const chips = useMemo(() => chipsFor(listings), [listings]);

  const checkIn = b.applied?.checkIn ?? null;
  const checkOut = b.applied?.checkOut ?? null;
  const dated = !!(checkIn && checkOut);
  const range = dated ? `${fmtDay(checkIn)} – ${fmtDay(checkOut)}` : "";
  const searchedNights = dated ? nightsBetween(checkIn, checkOut) : 0;

  const ids = useMemo(() => listings.map((l) => l.id), [listings]);
  const from = useFromPrices(ids);
  const search = useStaySearch(ids, checkIn, checkOut);
  const checking = dated && search.status === "loading";
  const ready = dated && search.status === "ready";

  const filtered = checking ? [] : filterListings(listings, chips, b.applied, chip, ready ? search.stay : null);
  const split = ready ? splitByStay(filtered, search.stay) : null;
  const shownCount = split ? split.exact.length + split.partial.length : filtered.length;

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
  else if (split) {
    countText =
      shownCount === 0
        ? "No homes available"
        : `${homes(split.exact.length)} available for your exact dates` +
          (split.partial.length ? ` · ${homes(split.partial.length)} for part of them` : "");
  } else if (shownCount === 0) countText = "No homes match";
  else if (dated && search.status === "error")
    countText = `Showing ${homes(shownCount)}. We couldn't check availability for ${range}, so dates are confirmed when you book.`;
  else if (shownCount === listings.length) countText = `Showing ${homes(shownCount)}`;
  else countText = `Showing ${shownCount} of ${listings.length} homes`;

  /** An exact match: free every night, popup opens with the dates filled in. */
  const exactCard = (l: Listing, i: number) => {
    const avg = avgNightly(search.stay?.[l.id]?.nightly);
    return (
      <PropertyCard
        key={l.id}
        listing={l}
        index={i}
        onOpen={() => onOpen(l, { prefill: true })}
        from={from[l.id]}
        stay={avg !== null ? { nights: searchedNights, avgNightly: avg } : null}
      />
    );
  };

  /** A partial match: says which nights are free; popup opens without dates. */
  const partialCard = (l: Listing, i: number) => {
    const note = partialNote(search.stay?.[l.id], searchedNights);
    return (
      <PropertyCard
        key={l.id}
        listing={l}
        index={i}
        note={note}
        onOpen={() => onOpen(l, { prefill: false, hint: `You searched ${fmtRange(checkIn!, checkOut!)}. ${note}.` })}
        from={from[l.id]}
      />
    );
  };

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
              dates to see which homes are free for them.
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

        {split ? (
          <>
            <div className="results-group" id="group-exact">
              <h2 className="group-title">
                Available for your exact dates <span className="group-count">{split.exact.length}</span>
              </h2>
              <p className="group-sub">Free every night from {range}. Open one and your dates are already filled in.</p>
              {split.exact.length > 0 ? (
                <div className="grid" id="grid">
                  {split.exact.map(exactCard)}
                </div>
              ) : (
                <p className="group-empty">No home is free for every night of {range}.</p>
              )}
            </div>

            {split.partial.length > 0 && (
              <div className="results-group" id="group-partial">
                <h2 className="group-title">
                  Available for part of your dates <span className="group-count">{split.partial.length}</span>
                </h2>
                <p className="group-sub">
                  These homes are free for some of the nights you searched, not all of them. Open one to pick dates that
                  work.
                </p>
                <div className="grid" id="grid-partial">
                  {split.partial.map(partialCard)}
                </div>
              </div>
            )}

            <p className={`empty${shownCount === 0 ? " show" : ""}`} id="empty">
              No homes are free for any of those nights. Try different dates.
            </p>
          </>
        ) : (
          <>
            <div className="grid" id="grid">
              {filtered.map((l, i) => (
                <PropertyCard key={l.id} listing={l} index={i} onOpen={() => onOpen(l)} from={from[l.id]} />
              ))}
            </div>
            <p className={`empty${status === "ready" && !checking && filtered.length === 0 ? " show" : ""}`} id="empty">
              Nothing matches that combination. Try a wider date range, or fewer guests.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
