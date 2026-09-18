import type { Listing } from "../data/types.ts";
import { nightsBetween } from "./dates.ts";

/** "A$1,240" — the prototype's money format, en-AU grouping. */
export const money = (n: number, currency = "AUD"): string => {
  const prefix = currency === "AUD" ? "A$" : `${currency} `;
  return prefix + Math.round(n).toLocaleString("en-AU");
};

export interface Quote {
  nights: number;
  /** Nightly rate × nights, before fees or discounts. */
  stay: number;
  /** Guesty prices.cleaningFee. 0 across most of this portfolio. */
  clean: number;
  /** Weekly discount, from Guesty's weeklyPriceFactor. 0 when none applies. */
  disc: number;
  total: number;
}

/**
 * The full cost of a stay, using the listing's real Guesty pricing rather
 * than invented figures: basePrice, cleaningFee, and weeklyPriceFactor.
 *
 * The prototype hard-coded a A$120 cleaning fee and a flat 10% weekly
 * discount. Neither is real here — this portfolio reports cleaningFee 0 and
 * weeklyPriceFactor 1 — so quoting them would overcharge on screen. Rows for
 * a zero fee or zero discount are simply not rendered.
 */
export function stayCost(listing: Listing, a: string | null, b: string | null): Quote | null {
  const nights = nightsBetween(a, b);
  if (nights <= 0) return null;

  const stay = listing.price * nights;
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

export interface BookingLinkOpts {
  listingId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

/** Deep link into the Guesty Booking Engine, or null when it isn't configured. */
export function buildBookingUrl(opts: BookingLinkOpts = {}): string | null {
  if (!BOOKING_BASE) return null;
  const path = opts.listingId
    ? `/properties/${encodeURIComponent(opts.listingId)}`
    : "/properties";
  const q = new URLSearchParams();
  if (opts.checkIn) q.set("checkIn", opts.checkIn);
  if (opts.checkOut) q.set("checkOut", opts.checkOut);
  if (opts.guests && opts.guests > 0) q.set("minOccupancy", String(opts.guests));
  const s = q.toString();
  return `${BOOKING_BASE}${path}${s ? `?${s}` : ""}`;
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
