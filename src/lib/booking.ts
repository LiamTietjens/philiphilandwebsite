import type { Listing } from "../data/types.ts";
import { nightsBetween } from "./dates.ts";

/** "A$1,240" — the prototype's money format, en-AU grouping. */
export const money = (n: number, currency = "AUD"): string => {
  const prefix = currency === "AUD" ? "A$" : `${currency} `;
  return prefix + Math.round(n).toLocaleString("en-AU");
};

export interface Quote {
  nights: number;
  /** Sum of the nightly prices, before fees or discounts. */
  stay: number;
  /** Guesty prices.cleaningFee. 0 across most of this portfolio. */
  clean: number;
  /** Weekly discount, from Guesty's weeklyPriceFactor. 0 when none applies. */
  disc: number;
  total: number;
}

/**
 * The cost of a stay, from Guesty's own per-night calendar prices.
 *
 * A listing's flat `basePrice` is NOT what Guesty charges: the calendar prices
 * each night individually (seasonal / dynamic pricing), and on a live check the
 * base rate matched the calendar on almost no nights and overstated it by up to
 * a third. So the total is only computed when `nightly` — one real price per
 * night of the stay — is supplied. Without it this returns null; it never
 * falls back to the base rate.
 *
 * Cleaning fee and the weekly discount are the listing's real Guesty values
 * (most of this portfolio reports cleaningFee 0 and weeklyPriceFactor 1). Rows
 * for a zero fee or zero discount are simply not rendered.
 */
export function stayCost(
  listing: Listing,
  a: string | null,
  b: string | null,
  nightly: number[] | undefined,
): Quote | null {
  const nights = nightsBetween(a, b);
  if (nights <= 0) return null;
  if (!nightly || nightly.length !== nights) return null;

  const stay = nightly.reduce((sum, n) => sum + n, 0);
  const factor = listing.weeklyFactor;
  // Guesty expresses a weekly discount as a multiplier < 1 (0.9 = 10% off).
  const disc = nights >= 7 && factor > 0 && factor < 1 ? Math.round(stay * (1 - factor)) : 0;
  const clean = listing.cleaningFee;

  return { nights, stay, clean, disc, total: stay + clean - disc };
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
