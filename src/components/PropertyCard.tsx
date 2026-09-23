import type { Listing } from "../data/types.ts";
import { money } from "../lib/booking.ts";
import type { Quote } from "../lib/booking.ts";

const arrow = (
  <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
    <path d="M0 4.5h15M11.5 1L15 4.5 11.5 8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const cameraSVG = (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="2.5" width="12" height="9" rx="1.5" />
    <circle cx="7" cy="7" r="2.4" />
  </svg>
);

interface Props {
  listing: Listing;
  index: number;
  onOpen: () => void;
  /** The home's real "from" price (its cheapest open night, from Guesty's
   *  calendar). undefined = still loading · null = Guesty didn't give one. */
  from?: number | null;
  /** Total for the searched dates from Guesty's per-night prices, when available. */
  quote?: Quote | null;
}

/** Matches the prototype's `.card` markup, with prices that come only from Guesty's calendar. */
export function PropertyCard({ listing, index, onOpen, from, quote }: Props) {
  return (
    <button
      type="button"
      className="card rv"
      style={{ transitionDelay: `${Math.min(index, 5) * 70}ms` }}
      onClick={onOpen}
    >
      <span className="card-media">
        <img
          src={listing.photos[0]}
          alt={`${listing.name}, ${listing.town}`}
          loading={index < 3 ? "eager" : "lazy"}
        />
        {listing.badge && <span className="card-badge">{listing.badge}</span>}
        {listing.photos.length > 1 && (
          <span className="card-count">
            {cameraSVG}
            {listing.photos.length} photos
          </span>
        )}
      </span>
      <span className="card-body">
        <span className="card-loc">
          {listing.town} &nbsp;·&nbsp; {listing.type}
        </span>
        <span className="card-name">{listing.name}</span>
        <span className="card-specs">
          {listing.guests} guests<i className="dot" />
          {listing.bedrooms} bedrooms<i className="dot" />
          {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
        </span>
        {listing.tags.length > 0 && (
          <span className="card-tags">
            {listing.tags.map((t) => (
              <i className="tag" key={t}>
                {t}
              </i>
            ))}
          </span>
        )}
        <span className="card-foot">
          <span className="price">
            <em>From</em>
            {typeof from === "number" ? (
              <>
                <b>{money(from, listing.currency)}</b> <i>/ night</i>
              </>
            ) : (
              <b className="price-na">{from === undefined ? "Loading price…" : "Price on request"}</b>
            )}
            {quote && (
              <span className="stay on">
                {quote.nights} night{quote.nights === 1 ? "" : "s"} &middot;{" "}
                <strong>{money(quote.total, listing.currency)}</strong> total
                {quote.disc > 0 && <span style={{ opacity: 0.75 }}> (weekly rate)</span>}
              </span>
            )}
          </span>
          <span className="card-go">View home {arrow}</span>
        </span>
      </span>
    </button>
  );
}
