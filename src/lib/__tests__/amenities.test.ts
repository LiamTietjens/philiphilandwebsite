import { describe, expect, it } from "vitest";
import { badgeFor, tagsFor } from "../amenities.ts";

describe("tagsFor", () => {
  it("maps real Guesty amenity strings to display tags", () => {
    expect(tagsFor(["Hot tub", "Garden or backyard", "Free parking on premises"])).toEqual([
      "Hot tub",
      "Garden",
    ]);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(tagsFor([" HOT TUB "])).toEqual(["Hot tub"]);
  });

  it("returns no tags for an amenity list with nothing distinguishing", () => {
    expect(tagsFor(["Kitchen", "Wireless Internet", "Hangers"])).toEqual([]);
  });

  it("never surfaces Guesty's own ops tags — only amenities are matched", () => {
    // A raw Guesty `tags` value like ["Victor & Aoi"] (an owner name) must
    // never reach this function in the first place; confirm it produces
    // nothing if it accidentally did.
    expect(tagsFor(["Victor & Aoi"])).toEqual([]);
  });

  it("orders by rule priority, not input order", () => {
    expect(tagsFor(["Garden or backyard", "Ocean Front"])).toEqual(["Ocean views", "Garden"]);
  });
});

describe("badgeFor", () => {
  it("prefers ocean views over other tags", () => {
    expect(badgeFor(["Ocean views", "Pool"], 4)).toBe("Ocean views");
  });
  it("falls back to a capacity badge for a large home with no feature tags", () => {
    expect(badgeFor([], 12)).toBe("Sleeps 12");
  });
  it("returns undefined rather than inventing marketing copy", () => {
    expect(badgeFor([], 4)).toBeUndefined();
  });
});
