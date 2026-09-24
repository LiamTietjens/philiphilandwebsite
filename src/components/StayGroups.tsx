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
          Available for your exact dates <span className="group-count">{split.exact.length}</span>
        </h2>
        <p className="group-sub">Free every night from {range}. Open one and your dates are already filled in.</p>
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
          <p className="group-empty">No home is free for every night of {range}.</p>
        )}
      </div>

      {partial.length > 0 && (
        <div className="results-group" id="group-partial">
          <h2 className="group-title">
            Available for part of your dates <span className="group-count">{split.partial.length}</span>
          </h2>
          <p className="group-sub">
            These homes are free for some of the nights you searched, not all of them. Open one to pick dates that work.
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
    </>
  );
}
