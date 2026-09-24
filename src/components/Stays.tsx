import type { Listing, OpenListing } from "../data/types.ts";
import type { ListingsStatus } from "../hooks/useListings.ts";
import { useFromPrices } from "../hooks/useLivePricing.ts";
import { featuredListings } from "../lib/filter.ts";
import { HOMES_HASH } from "../lib/route.ts";
import { PropertyCard } from "./PropertyCard.tsx";

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
 * the full listing page (HomesPage), where Search and the filter chips live.
 */
export function Stays({ listings, status, onOpen }: Props) {
  const shown = featuredListings(listings);
  const hasMore = listings.length > shown.length;
  // Real prices from Guesty's calendar. Totals for particular dates appear on
  // the listing page, once Search has checked which homes are actually free.
  const from = useFromPrices(shown.map((l) => l.id));

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
          {status === "loading"
            ? "Loading homes…"
            : status === "error"
              ? "We couldn't load our homes just now. Please refresh the page, or call us on +61 490 465 855."
              : hasMore
              ? `Showing ${shown.length} of ${listings.length} homes`
              : `Showing ${shown.length} ${shown.length === 1 ? "home" : "homes"}`}
        </p>

        <div className="grid" id="grid">
          {shown.map((l, i) => (
            <PropertyCard key={l.id} listing={l} index={i} onOpen={() => onOpen(l)} from={from[l.id]} />
          ))}
        </div>

        {hasMore && (
          <div className="stays-more rv">
            <a href={HOMES_HASH} className="btn">
              Show all {listings.length} homes {arrow}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
