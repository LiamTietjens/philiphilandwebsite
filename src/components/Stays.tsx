import { useMemo } from "react";
import type { Listing, OpenListing } from "../data/types.ts";
import { useBooking } from "../context/booking.tsx";
import type { ListingsStatus } from "../hooks/useListings.ts";
import { useFromPrices, useStaySearch } from "../hooks/useLivePricing.ts";
import { fmtDay } from "../lib/dates.ts";
import { FEATURED_COUNT, featuredListings, filterListings, splitByStay } from "../lib/filter.ts";
import { PropertyCard } from "./PropertyCard.tsx";
import { StayGroups } from "./StayGroups.tsx";

const arrow = (
  <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
    <path d="M0 4.5h15M11.5 1L15 4.5 11.5 8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

interface Props {
  listings: Listing[];
  status: ListingsStatus;
  onOpen: OpenListing;
}

/**
 * The landing page's short list: a handful of homes, then a button through to
 * the full listing page (HomesPage), where the filter chips live.
 *
 * Once both dates are picked in the search bar, this list stops being a fixed
 * five and becomes a preview of what Search would show: Guesty is asked about
 * every home for those dates and the list splits into homes free for the exact
 * dates and homes free for only part of them. Fully booked homes are left out,
 * so a card never opens on dates that aren't available.
 */
export function Stays({ listings, status, onOpen }: Props) {
  const b = useBooking();
  const dated = !!(b.checkIn && b.checkOut);
  const range = dated ? `${fmtDay(b.checkIn!)} – ${fmtDay(b.checkOut!)}` : "";

  const ids = useMemo(() => listings.map((l) => l.id), [listings]);
  const search = useStaySearch(ids, b.checkIn, b.checkOut);
  const checking = dated && search.status === "loading";
  const ready = dated && search.status === "ready";

  // Destination and guests count too, exactly as they will once Search is pressed.
  const draft = { dest: b.dest, guests: b.guests, checkIn: b.checkIn, checkOut: b.checkOut };
  const split = ready ? splitByStay(filterListings(listings, [], draft, "all", search.stay), search.stay) : null;

  const featured = featuredListings(listings);
  const visible = split
    ? [...split.exact.slice(0, FEATURED_COUNT), ...split.partial.slice(0, FEATURED_COUNT)]
    : checking
      ? []
      : featured;
  // Real prices from Guesty's calendar, only for the homes actually on screen.
  const from = useFromPrices(visible.map((l) => l.id));

  const homes = (n: number) => `${n} ${n === 1 ? "home" : "homes"}`;
  let countText: string;
  if (status === "loading") countText = "Loading homes…";
  else if (status === "error")
    countText = "We couldn't load our homes just now. Please refresh the page, or call us on +61 490 465 855.";
  else if (checking) countText = `Checking availability for ${range}…`;
  else if (split) {
    countText =
      split.exact.length + split.partial.length === 0
        ? `No homes available for ${range}`
        : `${homes(split.exact.length)} available for your exact dates` +
          (split.partial.length ? ` · ${homes(split.partial.length)} for part of them` : "");
  } else if (dated && search.status === "error")
    countText = `Showing ${featured.length} of ${listings.length} homes. We couldn't check availability for ${range}, so dates are confirmed when you book.`;
  else if (listings.length > featured.length) countText = `Showing ${featured.length} of ${listings.length} homes`;
  else countText = `Showing ${homes(featured.length)}`;

  const hasMore = split
    ? split.exact.length > FEATURED_COUNT || split.partial.length > FEATURED_COUNT
    : !checking && listings.length > featured.length;

  return (
    <section className="sec" id="stays">
      <div className="wrap">
        <div className="sec-head rv">
          <div className="txt">
            <span className="eyebrow">Our houses</span>
            <h2 className="serif d2">The houses we manage.</h2>
            <p className="lede">
              Cleaned, styled and walked through by our own staff between every stay. None of it is
              sub-contracted, which is why the reviews read the way they do.
            </p>
          </div>
          <a href="#owners" className="link-u" style={{ color: "var(--sea)" }}>
            List your property {arrow}
          </a>
        </div>

        <p className="count" id="count">
          {countText}
        </p>

        {split ? (
          <StayGroups
            split={split}
            stay={search.stay}
            checkIn={b.checkIn!}
            checkOut={b.checkOut!}
            from={from}
            onOpen={onOpen}
            limit={FEATURED_COUNT}
          />
        ) : (
          <div className="grid" id="grid">
            {visible.map((l, i) => (
              <PropertyCard key={l.id} listing={l} index={i} onOpen={() => onOpen(l)} from={from[l.id]} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="stays-more rv">
            <a href={b.homesHref} className="btn">
              {split
                ? `See all ${split.exact.length + split.partial.length} homes for these dates`
                : `Show all ${listings.length} homes`}{" "}
              {arrow}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
