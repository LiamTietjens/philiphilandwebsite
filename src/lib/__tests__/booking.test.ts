import { describe, expect, it } from "vitest";
import { money, stayCost } from "../booking.ts";
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
  it("returns null without a full date range", () => {
    expect(stayCost(listing, null, null)).toBeNull();
    expect(stayCost(listing, "2026-03-01", null)).toBeNull();
  });

  it("computes nights × nightly rate with no fees when Guesty reports none", () => {
    const q = stayCost(listing, "2026-03-01", "2026-03-04"); // 3 nights
    expect(q).toEqual({ nights: 3, stay: 600, clean: 0, disc: 0, total: 600 });
  });

  it("adds a real cleaning fee from Guesty rather than a hard-coded one", () => {
    const q = stayCost({ ...listing, cleaningFee: 120 }, "2026-03-01", "2026-03-04");
    expect(q?.clean).toBe(120);
    expect(q?.total).toBe(720);
  });

  it("applies the weekly discount only at 7+ nights, from Guesty's weeklyPriceFactor", () => {
    const weekly = { ...listing, weeklyFactor: 0.9 }; // 10% off
    const sixNights = stayCost(weekly, "2026-03-01", "2026-03-07");
    expect(sixNights?.disc).toBe(0);

    const sevenNights = stayCost(weekly, "2026-03-01", "2026-03-08");
    // stay = 200 * 7 = 1400; 10% off = 140
    expect(sevenNights).toEqual({ nights: 7, stay: 1400, clean: 0, disc: 140, total: 1260 });
  });

  it("never discounts when weeklyFactor is 1 (no weekly rate set)", () => {
    const q = stayCost(listing, "2026-03-01", "2026-03-10"); // 9 nights
    expect(q?.disc).toBe(0);
  });
});
