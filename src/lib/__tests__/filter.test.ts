import { describe, expect, it } from "vitest";
import type { Chip, Listing } from "../../data/types.ts";
import { FEATURED_COUNT, featuredListings, filterListings } from "../filter.ts";

const home = (id: string, over: Partial<Listing> = {}): Listing => ({
  id,
  name: id,
  town: "Cowes",
  type: "House",
  guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  price: 200,
  currency: "AUD",
  cleaningFee: 0,
  weeklyFactor: 1,
  photos: ["p.jpg"],
  summary: "",
  amenities: [],
  tags: [],
  ...over,
});

const chips: Chip[] = [
  { value: "all", label: "All homes", kind: "all" },
  { value: "Newhaven", label: "Newhaven", kind: "town" },
  { value: "Pet friendly", label: "Pet friendly", kind: "tag" },
];

describe("featuredListings", () => {
  it("returns the first five in feed order", () => {
    const all = Array.from({ length: 12 }, (_, i) => home(`h${i}`));
    expect(FEATURED_COUNT).toBe(5);
    expect(featuredListings(all).map((l) => l.id)).toEqual(["h0", "h1", "h2", "h3", "h4"]);
  });

  it("returns everything when there are five or fewer", () => {
    const all = [home("a"), home("b"), home("c")];
    expect(featuredListings(all)).toHaveLength(3);
  });
});

describe("filterListings", () => {
  const all = [
    home("cowes-4", { town: "Cowes", guests: 4 }),
    home("haven-8", { town: "Newhaven", guests: 8, tags: ["Pet friendly"] }),
    home("haven-2", { town: "Newhaven", guests: 2 }),
    home("cowes-6-pets", { town: "Cowes", guests: 6, tags: ["Pet friendly"] }),
  ];
  const ids = (ls: Listing[]) => ls.map((l) => l.id);

  it("returns everything with no search applied and the All chip", () => {
    expect(ids(filterListings(all, chips, null, "all"))).toEqual(ids(all));
  });

  it("filters by the applied destination", () => {
    expect(ids(filterListings(all, chips, { dest: "Newhaven", guests: 1 }, "all"))).toEqual(["haven-8", "haven-2"]);
  });

  it("treats destination 'all' as anywhere", () => {
    expect(filterListings(all, chips, { dest: "all", guests: 1 }, "all")).toHaveLength(4);
  });

  it("keeps only homes that sleep at least the applied guest count", () => {
    expect(ids(filterListings(all, chips, { dest: "all", guests: 6 }, "all"))).toEqual(["haven-8", "cowes-6-pets"]);
  });

  it("applies a town chip", () => {
    expect(ids(filterListings(all, chips, null, "Newhaven"))).toEqual(["haven-8", "haven-2"]);
  });

  it("applies a tag chip", () => {
    expect(ids(filterListings(all, chips, null, "Pet friendly"))).toEqual(["haven-8", "cowes-6-pets"]);
  });

  it("combines the applied search with a chip", () => {
    expect(ids(filterListings(all, chips, { dest: "all", guests: 6 }, "Newhaven"))).toEqual(["haven-8"]);
  });

  it("falls back to a tag match for a chip value that is not in the chip list", () => {
    expect(ids(filterListings(all, chips, null, "Pet friendly"))).toEqual(ids(filterListings(all, [], null, "Pet friendly")));
  });
});
