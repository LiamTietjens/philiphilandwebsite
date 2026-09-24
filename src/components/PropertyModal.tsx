import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Listing } from "../data/types.ts";
import { useAvailability } from "../hooks/useAvailability.ts";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll.ts";
import { avgNightly, buildBookingUrl, buildEnquiryMailto, money } from "../lib/booking.ts";
import { nightsOf } from "../lib/dates.ts";
import { RangePicker } from "./RangePicker.tsx";

const checkSVG = (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 7.4l3.2 3.2L12 3.8" />
  </svg>
);

interface Props {
  listing: Listing;
  guests: number;
  /** Adults only (guests minus kids), for the Booking Engine's `adults` param. */
  adults: number;
  /** Dates already chosen in the search bar, so a search carries into the popup. Omitted for a partial match. */
  initialStay?: { checkIn: string | null; checkOut: string | null };
  /** The searched check-in: the calendar opens on its month when no dates are pre-filled. */
  viewFrom?: string | null;
  /** A line above the dates, e.g. which nights of the search this home is free. */
  hint?: string;
  onClose: () => void;
}

/**
 * Matches the prototype's `.modal` markup: a photo gallery on the left, a
 * details + booking rail on the right. Everything date- and price-related
 * comes from Guesty's calendar for this listing (useAvailability): the booked
 * days, each night's price, and the minimum stay. If that can't be fetched the
 * popup says so — it never shows a made-up price or implies a date is free.
 */
export function PropertyModal({ listing, guests, adults, initialStay, viewFrom, hint, onClose }: Props) {
  useLockBodyScroll(true);
  const [cur, setCur] = useState(0);
  const [checkIn, setCheckIn] = useState<string | null>(initialStay?.checkIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(initialStay?.checkOut ?? null);
  const [requested, setRequested] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const availability = useAvailability(listing.id);
  const photos = listing.photos;

  const stayNights = nightsOf(checkIn, checkOut);
  const dated = stayNights.length > 0;
  const nightly =
    availability.known && dated && stayNights.every((d) => availability.prices[d] !== undefined)
      ? stayNights.map((d) => availability.prices[d])
      : undefined;
  // The chosen dates may have been carried in from the search bar, so check
  // them against this home's own calendar rather than assuming they're free.
  const unavailable = availability.known && stayNights.some((d) => availability.booked.has(d));
  const minStay = checkIn ? availability.minNights[checkIn] : undefined;
  const belowMin = !!minStay && dated && stayNights.length < minStay;
  const blocked = unavailable || belowMin;
  // Guesty's nightly rates are before fees and taxes; the final price is shown at checkout.
  const avg = blocked ? null : avgNightly(nightly);
  const nightlySum = blocked || !nightly ? null : nightly.reduce((a, n) => a + n, 0);
  const priceValues = Object.values(availability.prices);
  const fromPrice = availability.known && priceValues.length ? Math.min(...priceValues) : null;

  // The scrim animates its own blur. Adding the "on" class in the same paint
  // as mount collapses the transition to nothing, because the browser
  // composites a filtered layer in one step rather than interpolating it —
  // so the class needs to land a frame after the element exists. A forced
  // synchronous reflow (reading offsetHeight) guarantees that frame boundary
  // without depending on requestAnimationFrame, which never fires in a
  // background tab and would leave the dialog with no scrim at all.
  useLayoutEffect(() => {
    void bgRef.current?.offsetHeight;
    bgRef.current?.classList.add("on");
    cardRef.current?.classList.add("on");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCur((v) => (v - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setCur((v) => (v + 1) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // Centre the active thumbnail by scrolling the strip itself. scrollIntoView()
  // would also scroll every scrollable ancestor — including the overflow:hidden
  // card — which pushed the title and close button out of view on open.
  useEffect(() => {
    const strip = thumbRef.current;
    const t = strip?.children[cur] as HTMLElement | undefined;
    if (!strip || !t) return;
    const s = strip.getBoundingClientRect();
    const r = t.getBoundingClientRect();
    strip.scrollTo({ left: strip.scrollLeft + (r.left - s.left) - (s.width - r.width) / 2, behavior: "smooth" });
  }, [cur]);

  const query = { listingId: listing.id, name: listing.name, checkIn: checkIn ?? undefined, checkOut: checkOut ?? undefined, guests, adults };
  const bookUrl = buildBookingUrl(query);

  return (
    <div className="modal open" id="modal" role="dialog" aria-modal="true" aria-label="Property details">
      <div className="modal-bg" ref={bgRef} onClick={onClose} />
      <div className="modal-card" ref={cardRef}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>

        <div className="gal">
          <div className="gal-main">
            {photos.map((src, i) => (
              <img key={src} src={src} alt={`${listing.name} photo ${i + 1}`} className={i === cur ? "on" : undefined} loading={i ? "lazy" : undefined} />
            ))}
          </div>
          {photos.length > 1 && (
            <>
              <button className="gal-nav prev" aria-label="Previous photo" onClick={() => setCur((v) => (v - 1 + photos.length) % photos.length)}>
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M8 1L1.5 7.5 8 14" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
              <button className="gal-nav next" aria-label="Next photo" onClick={() => setCur((v) => (v + 1) % photos.length)}>
                <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
                  <path d="M1 1l6.5 6.5L1 14" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
              <span className="gal-idx">
                {cur + 1} / {photos.length}
              </span>
            </>
          )}
          <div className="gal-thumbs" ref={thumbRef}>
            {photos.map((src, i) => (
              <button key={src} type="button" className={i === cur ? "on" : undefined} aria-label={`Photo ${i + 1}`} onClick={() => setCur(i)}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="modal-side">
          <span className="card-loc">
            {listing.town} &nbsp;·&nbsp; {listing.type} &nbsp;·&nbsp; Phillip Island
          </span>
          <h3>{listing.name}</h3>
          <div className="modal-specs">
            {listing.guests} guests<i className="dot" />
            {listing.bedrooms} bedrooms<i className="dot" />
            {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
          </div>
          <p className="modal-desc">{listing.summary}</p>
          {listing.amenities.length > 0 && (
            <div className="amen">
              {listing.amenities.map((a) => (
                <div key={a}>
                  {checkSVG}
                  {a}
                </div>
              ))}
            </div>
          )}

          <div className="book">
            {hint && <p className="book-hint">{hint}</p>}
            <div className="book-dates">
              <RangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(a, b) => {
                  setCheckIn(a);
                  setCheckOut(b);
                }}
                booked={availability.booked}
                availabilityKnown={availability.known}
                checking={availability.loading}
                initialMonth={viewFrom}
                maxDate={availability.horizon ?? undefined}
              />
            </div>
            <div className="book-sum">
              {!dated ? (
                <div className="row">
                  <span>
                    {availability.loading
                      ? "Loading prices…"
                      : fromPrice !== null
                        ? `From ${money(fromPrice, listing.currency)} a night`
                        : "Price on request"}
                  </span>
                  <span>Add dates for a total</span>
                </div>
              ) : unavailable ? (
                <div className="row">
                  <span>Not available for these dates</span>
                  <span>Try other dates</span>
                </div>
              ) : belowMin ? (
                <div className="row">
                  <span>
                    Minimum stay for this arrival date is {minStay} nights
                  </span>
                </div>
              ) : availability.loading ? (
                <div className="row">
                  <span>Checking prices…</span>
                </div>
              ) : avg === null || nightlySum === null ? (
                <div className="row">
                  <span>
                    {availability.known
                      ? "The price for these dates is shown at checkout"
                      : "We couldn\u2019t check these dates \u2014 we\u2019ll confirm when you book"}
                  </span>
                </div>
              ) : (
                <>
                  <div className="row">
                    <span>
                      {stayNights.length} night{stayNights.length === 1 ? "" : "s"} &middot; avg {money(avg, listing.currency)} / night
                    </span>
                    <span>{money(nightlySum, listing.currency)}</span>
                  </div>
                  <div className="row">
                    <span>Fees &amp; taxes</span>
                    <span>Added at checkout</span>
                  </div>
                </>
              )}
            </div>
            {bookUrl ? (
              <a
                href={bookUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
                aria-disabled={blocked || undefined}
                tabIndex={blocked ? -1 : undefined}
                style={blocked ? { opacity: 0.45, pointerEvents: "none" } : undefined}
              >
                Request to book
              </a>
            ) : (
              <a
                href={buildEnquiryMailto(query)}
                className="btn"
                onClick={() => setRequested(true)}
                aria-disabled={blocked || undefined}
                tabIndex={blocked ? -1 : undefined}
                style={blocked ? { opacity: 0.45, pointerEvents: "none" } : requested ? { opacity: 0.72, pointerEvents: "none" } : undefined}
              >
                {requested ? "Request sent" : "Request to book"}
              </a>
            )}
            <p className="note">Nightly rates are shown before fees and taxes. The final price is shown at checkout, and nothing is charged until you book.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
