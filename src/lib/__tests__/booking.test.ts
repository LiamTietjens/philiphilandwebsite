import { describe, expect, it } from "vitest";
import { bookingPath, buildBookingUrl, money, stayCost } from "../booking.ts";
import type { Listing } from "../../data/types.ts";

const listing: Listing = {
  id: "l1",
  name: "Test House",
  town: "Cowes",
  type: "House",
  guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  price: 200,
  currency: "AUD",
  cleaningFee: 0,
  weeklyFactor: 1,
  photos: ["/a.jpg"],
  summary: "",
  amenities: [],
  tags: [],
};

describe("money", () => {
  it("formats AUD with the A$ prefix and en-AU grouping", () => {
    expect(money(1240)).toBe("A$1,240");
  });
  it("rounds to the nearest whole unit", () => {
    expect(money(199.6)).toBe("A$200");
  });
  it("uses a plain currency-code prefix for non-AUD", () => {
    expect(money(50, "USD")).toBe("USD 50");
  });
});

describe("stayCost", () => {
  // Guesty's calendar prices each night; the listing's flat base rate is NOT what it charges.
  const nightly = (n: number, price = 200) => Array.from({ length: n }, () => price);

  it("returns null without a full date range", () => {
    expect(stayCost(listing, null, null, nightly(3))).toBeNull();
    expect(stayCost(listing, "2026-03-01", null, nightly(3))).toBeNull();
  });

  it("returns null without real nightly prices — it must never fall back to the flat base rate", () => {
    expect(stayCost(listing, "2026-03-01", "2026-03-04", undefined)).toBeNull();
    expect(stayCost(listing, "2026-03-01", "2026-03-04", [])).toBeNull();
  });

  it("returns null when the nightly prices don't cover every night of the stay", () => {
    expect(stayCost(listing, "2026-03-01", "2026-03-04", nightly(2))).toBeNull();
    expect(stayCost(listing, "2026-03-01", "2026-03-04", nightly(4))).toBeNull();
  });

  it("sums each night's own price, so a pricey weekend costs what Guesty says it costs", () => {
    const q = stayCost(listing, "2026-03-01", "2026-03-04", [163, 163, 245]); // 3 nights
    expect(q).toEqual({ nights: 3, stay: 571, clean: 0, disc: 0, total: 571 });
  });

  it("adds a real cleaning fee from Guesty rather than a hard-coded one", () => {
    const q = stayCost({ ...listing, cleaningFee: 120 }, "2026-03-01", "2026-03-04", nightly(3));
    expect(q?.clean).toBe(120);
    expect(q?.total).toBe(720);
  });

  it("applies the weekly discount only at 7+ nights, from Guesty's weeklyPriceFactor", () => {
    const weekly = { ...listing, weeklyFactor: 0.9 }; // 10% off
    const sixNights = stayCost(weekly, "2026-03-01", "2026-03-07", nightly(6));
    expect(sixNights?.disc).toBe(0);

    const sevenNights = stayCost(weekly, "2026-03-01", "2026-03-08", nightly(7));
    // stay = 200 * 7 = 1400; 10% off = 140
    expect(sevenNights).toEqual({ nights: 7, stay: 1400, clean: 0, disc: 140, total: 1260 });
  });

  it("never discounts when weeklyFactor is 1 (no weekly rate set)", () => {
    const q = stayCost(listing, "2026-03-01", "2026-03-10", nightly(9)); // 9 nights
    expect(q?.disc).toBe(0);
  });
});

// bookingPath() is the path+query half of buildBookingUrl(), split out because
// VITE_GUESTY_BOOKING_URL isn't loaded under `vitest run` (Vite skips .env.local
// in test mode) — this is the part we can actually exercise. Shape confirmed
// against a real checkout link:
//   https://guest.phillipislandhost.com/en/properties/63e18360285088002cda224c
//     /checkout?minOccupancy=8&checkIn=2026-10-08&checkOut=2026-10-15&adults=8
describe("bookingPath", () => {
  const parse = (path: string) => new URL(path, "https://x.test");

  it("matches the real Guesty checkout link's shape exactly", () => {
    const u = parse(
      bookingPath({ listingId: "63e18360285088002cda224c", checkIn: "2026-10-08", checkOut: "2026-10-15", guests: 8 }),
    );
    expect(u.pathname).toBe("/en/properties/63e18360285088002cda224c/checkout");
    expect(Object.fromEntries(u.searchParams)).toEqual({
      minOccupancy: "8",
      checkIn: "2026-10-08",
      checkOut: "2026-10-15",
      adults: "8",
    });
  });

  it("sends the real adult count on `adults` when it differs from total guests (kids included)", () => {
    const u = parse(bookingPath({ listingId: "abc123", guests: 6, adults: 4 }));
    expect(u.searchParams.get("minOccupancy")).toBe("6");
    expect(u.searchParams.get("adults")).toBe("4");
  });

  it("falls back to the guest total for `adults` when no separate adult count is given", () => {
    const u = parse(bookingPath({ listingId: "abc123", guests: 5 }));
    expect(u.searchParams.get("adults")).toBe("5");
  });

  it("omits guest params entirely without a guest count", () => {
    const u = parse(bookingPath({ listingId: "abc123", checkIn: "2026-10-08" }));
    expect(u.searchParams.has("minOccupancy")).toBe(false);
    expect(u.searchParams.has("adults")).toBe(false);
  });

  it("omits check-in/check-out independently when only one is set", () => {
    const u = parse(bookingPath({ listingId: "abc123", checkIn: "2026-10-08" }));
    expect(u.searchParams.get("checkIn")).toBe("2026-10-08");
    expect(u.searchParams.has("checkOut")).toBe(false);
  });

  it("has no /checkout suffix without a listing id — there's nothing to check out of yet", () => {
    const u = parse(bookingPath({ checkIn: "2026-10-08" }));
    expect(u.pathname).toBe("/en/properties");
  });

  it("URL-encodes the listing id", () => {
    const u = parse(bookingPath({ listingId: "abc/../def" }));
    expect(u.pathname).toBe("/en/properties/abc%2F..%2Fdef/checkout");
  });
});

describe("buildBookingUrl", () => {
  it("is null without VITE_GUESTY_BOOKING_URL configured", () => {
    // True in this test run (see the bookingPath comment above) and the
    // behaviour buildBookingUrl must have whenever it's unset in production.
    expect(buildBookingUrl({ listingId: "abc123" })).toBeNull();
  });
});

