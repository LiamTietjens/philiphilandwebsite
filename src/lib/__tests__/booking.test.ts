import { describe, expect, it } from "vitest";
import { avgNightly, bookingPath, buildBookingUrl, money } from "../booking.ts";

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

describe("avgNightly", () => {
  it("is the rounded average of Guesty's per-night prices", () => {
    expect(avgNightly([163, 170, 178, 194])).toBe(176); // 705 / 4 = 176.25
    expect(avgNightly([155, 155, 157, 171])).toBe(160); // 638 / 4 = 159.5 -> 160
  });

  it("is the price itself for a single night", () => {
    expect(avgNightly([245])).toBe(245);
  });

  it("is null when there are no prices — never a made-up number", () => {
    expect(avgNightly([])).toBeNull();
    expect(avgNightly(undefined)).toBeNull();
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

