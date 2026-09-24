import type { Listing, OpenListing } from "../data/types.ts";
import type { FromMap } from "../hooks/useLivePricing.ts";
import { avgNightly } from "../lib/booking.ts";
import { fmtDay, fmtRange, nightsBetween } from "../lib/dates.ts";
import { partialNote } from "../lib/filter.ts";
import type { StayMap, StaySplit } from "../lib/filter.ts";
import { PropertyCard } from "./PropertyCard.tsx";

interface Props {
  split: StaySplit;
  stay: StayMap | null;
  checkIn: string;
  checkOut: string;
  from: FromMap;
  onOpen: OpenListing;
  /** Show at most this many homes per section (the landing page's short list). */
  limit?: number;
}

/** Shown instead of a list when Guesty couldn't be asked: no home is listed that hasn't been confirmed free. */
export function CheckFailed({ range, onRetry }: { range: string; onRetry: () => void }) {
  return (
    <div className="check-failed" role="alert">
      <p>
        We couldn&rsquo;t check which homes are free for {range}. Please try again, or call us on{" "}
        <a href="tel:+61490465855">+61 490 465 855</a>.
      </p>
      <button type="button" className="btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

/**
 * The two result sections for a dated search, shared by the landing page and
 * the listing page: homes free for the EXACT dates (popup opens with the dates
 * filled in), then homes free for only PART of them (each card says which
 * nights; popup opens without dates, on the searched month). A home with no
 * free night is never in either, so no popup opens on unavailable dates.
 */
export function StayGroups({ split, stay, checkIn, checkOut, from, onOpen, limit }: Props) {
  const range = `${fmtDay(checkIn)} – ${fmtDay(checkOut)}`;
  const nights = nightsBetween(checkIn, checkOut);
  const exact = limit ? split.exact.slice(0, limit) : split.exact;
  const partial = limit ? split.partial.slice(0, limit) : split.partial;

  return (
    <>
      <div className="results-group" id="group-exact">
        <h2 className="group-title">
          Exact matches <span className="group-count">{split.exact.length}</span>
        </h2>
        <p className="group-sub">Free every night, {range}. Open one and your dates are already filled in.</p>
        {exact.length > 0 ? (
          <div className="grid" id="grid">
            {exact.map((l: Listing, i) => {
              const avg = avgNightly(stay?.[l.id]?.nightly);
              return (
                <PropertyCard
                  key={l.id}
                  listing={l}
                  index={i}
                  onOpen={() => onOpen(l, { prefill: true })}
                  from={from[l.id]}
                  stay={avg !== null ? { nights, avgNightly: avg } : null}
                />
              );
            })}
          </div>
        ) : (
          <p className="group-empty">
            No exact matches: no home is free for every night of {range}.
            {split.partial.length > 0 && " See the alternatives below."}
          </p>
        )}
      </div>

      {partial.length > 0 && (
        <div className="results-group" id="group-partial">
          <h2 className="group-title">
            Alternatives <span className="group-count">{split.partial.length}</span>
          </h2>
          <p className="group-sub">
            Not free for all of {range}, but free for some of those nights. Open one to pick dates that work.
          </p>
          <div className="grid" id="grid-partial">
            {partial.map((l: Listing, i) => {
              const note = partialNote(stay?.[l.id], nights);
              return (
                <PropertyCard
                  key={l.id}
                  listing={l}
                  index={i}
                  note={note}
                  onOpen={() => onOpen(l, { prefill: false, hint: `You searched ${fmtRange(checkIn, checkOut)}. ${note}.` })}
                  from={from[l.id]}
                />
              );
            })}
          </div>
        </div>
      )}

      {split.unconfirmed.length > 0 && (
        <p className="group-sub">
          {split.unconfirmed.length} {split.unconfirmed.length === 1 ? "home" : "homes"} couldn&rsquo;t be checked just now, so{" "}
          {split.unconfirmed.length === 1 ? "it isn\u2019t" : "they aren\u2019t"} listed. Refresh the page to try again.
        </p>
      )}
    </>
  );
}
