/** "A$1,240" — the prototype's money format, en-AU grouping. */
export const money = (n: number, currency = "AUD"): string => {
  const prefix = currency === "AUD" ? "A$" : `${currency} `;
  return prefix + Math.round(n).toLocaleString("en-AU");
};

/**
 * The average of Guesty's own per-night prices for a stay, rounded. This is the
 * nightly rate BEFORE fees and taxes — Guesty adds a markup, bundled fees and a
 * levy at checkout, so the calendar's nights do not sum to what a guest pays and
 * the site never presents them as a total. Null without prices; never a guess.
 */
export function avgNightly(nightly: number[] | undefined): number | null {
  if (!nightly || nightly.length === 0) return null;
  return Math.round(nightly.reduce((sum, n) => sum + n, 0) / nightly.length);
}

// ─── outbound links ─────────────────────────────────────────────────────────
// Recovered verbatim from the previous build: these encode real business
// details (the enquiry address, and the Booking Engine's query contract) and
// are relied on by the modal's "Request to book" and the owners form.

const BOOKING_BASE = import.meta.env.VITE_GUESTY_BOOKING_URL as string | undefined;

export const ENQUIRY_EMAIL = "phillipislandcohost@gmail.com";

// Guesty's guest-facing site is locale-prefixed; the site is English-only for now.
const BOOKING_LOCALE = "en";

export interface BookingLinkOpts {
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  /** Total guests (adults + kids) — becomes Guesty's `minOccupancy`. */
  guests?: number;
  /** Adults only, for Guesty's `adults` param. Falls back to `guests` when omitted. */
  adults?: number;
}

/**
 * The Booking Engine path + query for a stay — split out from buildBookingUrl()
 * so it's testable without VITE_GUESTY_BOOKING_URL (Vite doesn't load .env.local
 * in test mode). Shape confirmed against a real checkout link:
 *   https://guest.phillipislandhost.com/en/properties/{id}/checkout
 *     ?minOccupancy=8&checkIn=2026-10-08&checkOut=2026-10-15&adults=8
 */
export function bookingPath(opts: BookingLinkOpts = {}): string {
  const path = opts.listingId
    ? `/${BOOKING_LOCALE}/properties/${encodeURIComponent(opts.listingId)}/checkout`
    : `/${BOOKING_LOCALE}/properties`;
  const q = new URLSearchParams();
  if (opts.checkIn) q.set("checkIn", opts.checkIn);
  if (opts.checkOut) q.set("checkOut", opts.checkOut);
  if (opts.guests && opts.guests > 0) {
    q.set("minOccupancy", String(opts.guests));
    q.set("adults", String(opts.adults ?? opts.guests));
  }
  const s = q.toString();
  return `${path}${s ? `?${s}` : ""}`;
}

/** Deep link into the Guesty Booking Engine, or null when it isn't configured. */
export function buildBookingUrl(opts: BookingLinkOpts = {}): string | null {
  if (!BOOKING_BASE) return null;
  return `${BOOKING_BASE}${bookingPath(opts)}`;
}

/** Fallback when the Booking Engine URL is unset: a pre-filled enquiry email. */
export function buildEnquiryMailto(
  opts: { name?: string; checkIn?: string; checkOut?: string; guests?: number } = {},
): string {
  const subject = opts.name ? `Booking enquiry — ${opts.name}` : "Booking enquiry";
  const lines = [
    "Hi Phillip Island Host,",
    "",
    opts.name ? `I'd like to enquire about ${opts.name}.` : "I'd like to enquire about a stay.",
    opts.checkIn ? `Check-in: ${opts.checkIn}` : "",
    opts.checkOut ? `Check-out: ${opts.checkOut}` : "",
    opts.guests ? `Guests: ${opts.guests}` : "",
  ].filter(Boolean);
  return `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
