import { describe, expect, it } from "vitest";
import type { Chip, Listing } from "../../data/types.ts";
import { FEATURED_COUNT, featuredListings, filterListings, freeNights, partialNote, splitByStay, type StayMap } from "../filter.ts";

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

describe("filterListings — availability for the searched dates", () => {
  const all = [home("free"), home("booked"), home("short-stay"), home("unknown"), home("not-in-map")];
  const ids = (ls: Listing[]) => ls.map((l) => l.id);
  const stay: StayMap = {
    free: { known: true, available: true, nightly: [200, 200] },
    booked: { known: true, available: false, reason: "booked", segments: [] },
    "short-stay": { known: true, available: false, reason: "min_nights", minNights: 3, segments: [{ from: "2026-10-13", to: "2026-10-15" }] },
    unknown: { known: false },
  };

  it("hides homes Guesty says are booked for those dates", () => {
    expect(ids(filterListings(all, chips, null, "all", stay))).not.toContain("booked");
  });

  it("keeps a home whose nights are open but whose minimum stay isn't met — it's a partial match, not a dead end", () => {
    expect(ids(filterListings(all, chips, null, "all", stay))).toContain("short-stay");
  });

  it("treats an unavailable result with no segment info as fully booked (older responses)", () => {
    const old: StayMap = { booked: { known: true, available: false, reason: "booked" } };
    expect(ids(filterListings([home("booked")], chips, null, "all", old))).toEqual([]);
  });

  it("keeps homes that are available", () => {
    expect(ids(filterListings(all, chips, null, "all", stay))).toContain("free");
  });

  it("never hides a home just because its availability is unknown, or it wasn't checked", () => {
    const shown = ids(filterListings(all, chips, null, "all", stay));
    expect(shown).toContain("unknown");
    expect(shown).toContain("not-in-map");
  });

  it("changes nothing when no dates were searched", () => {
    expect(ids(filterListings(all, chips, null, "all", null))).toEqual(ids(all));
    expect(ids(filterListings(all, chips, null, "all"))).toEqual(ids(all));
  });

  it("combines with the destination, guest and chip filters", () => {
    const mixed = [home("a", { town: "Cowes" }), home("b", { town: "Newhaven" }), home("c", { town: "Newhaven" })];
    const st: StayMap = { b: { known: true, available: false, reason: "booked", segments: [] }, c: { known: true, available: true } };
    expect(ids(filterListings(mixed, chips, { dest: "Newhaven", guests: 1 }, "all", st))).toEqual(["c"]);
  });
});

describe("splitByStay", () => {
  const a = home("a"), b = home("b"), c = home("c"), d = home("d"), e = home("e"), f = home("f");
  const stay: StayMap = {
    a: { known: true, available: true },
    b: { known: true, available: false, reason: "booked", segments: [{ from: "2026-10-13", to: "2026-10-14" }] }, // 1 free night
    c: { known: true, available: false, reason: "booked", segments: [{ from: "2026-10-13", to: "2026-10-16" }] }, // 3 free nights
    d: { known: true, available: false, reason: "booked", segments: [] }, // nothing free
    e: { known: false },
  };
  const ids = (ls: Listing[]) => ls.map((l) => l.id);

  it("puts homes free for every night in `exact`", () => {
    expect(ids(splitByStay([a, b, c, d, e, f], stay).exact)).toEqual(["a"]);
  });

  it("puts homes free for some nights in `partial`, most free nights first", () => {
    expect(ids(splitByStay([b, c], stay).partial)).toEqual(["c", "b"]);
  });

  it("leaves fully booked homes out of both", () => {
    const r = splitByStay([d], stay);
    expect(r.exact).toEqual([]);
    expect(r.partial).toEqual([]);
  });

  it("never calls a home 'exact' unless Guesty confirmed it: unknown / unchecked homes go last in partial", () => {
    const r = splitByStay([e, b, f], stay);
    expect(ids(r.exact)).toEqual([]);
    expect(ids(r.partial)).toEqual(["b", "e", "f"]);
  });

  it("keeps feed order among homes with the same number of free nights", () => {
    const tie: StayMap = {
      x: { known: true, available: false, reason: "booked", segments: [{ from: "2026-10-13", to: "2026-10-15" }] },
      y: { known: true, available: false, reason: "booked", segments: [{ from: "2026-10-15", to: "2026-10-17" }] },
    };
    expect(ids(splitByStay([home("x"), home("y")], tie).partial)).toEqual(["x", "y"]);
    expect(ids(splitByStay([home("y"), home("x")], tie).partial)).toEqual(["y", "x"]);
  });

  it("with no search results, everything is `exact` (no sections)", () => {
    expect(ids(splitByStay([a, b], null).exact)).toEqual(["a", "b"]);
    expect(splitByStay([a, b], null).partial).toEqual([]);
  });
});

describe("freeNights", () => {
  it("adds up the nights across all free stretches", () => {
    expect(
      freeNights({ known: true, available: false, segments: [{ from: "2026-12-26", to: "2026-12-29" }, { from: "2027-01-01", to: "2027-01-02" }] }),
    ).toBe(4);
  });

  it("is 0 with no stretches, unknown or missing info", () => {
    expect(freeNights({ known: true, available: false, segments: [] })).toBe(0);
    expect(freeNights({ known: false })).toBe(0);
    expect(freeNights(undefined)).toBe(0);
  });
});

describe("partialNote", () => {
  it("names the free nights and how many of the searched nights they are", () => {
    const info: StayMap[string] = { known: true, available: false, reason: "booked", segments: [{ from: "2026-10-13", to: "2026-10-15" }] };
    expect(partialNote(info, 4)).toBe("Free 13 – 15 Oct · 2 of 4 nights");
  });

  it("lists two separate stretches", () => {
    const info: StayMap[string] = {
      known: true, available: false, reason: "booked",
      segments: [{ from: "2026-12-26", to: "2026-12-29" }, { from: "2027-01-01", to: "2027-01-02" }],
    };
    expect(partialNote(info, 7)).toBe("Free 26 – 29 Dec and 1 – 2 Jan · 4 of 7 nights");
  });

  it("caps a long list of stretches", () => {
    const seg = (d: number) => ({ from: `2026-11-${String(d).padStart(2, "0")}`, to: `2026-11-${String(d + 1).padStart(2, "0")}` });
    const info: StayMap[string] = { known: true, available: false, reason: "booked", segments: [seg(2), seg(4), seg(6), seg(8)] };
    expect(partialNote(info, 8)).toBe("Free 2 – 3 Nov, 4 – 5 Nov and 2 more · 4 of 8 nights");
  });

  it("explains a minimum-stay refusal instead of pretending the nights are booked", () => {
    const info: StayMap[string] = { known: true, available: false, reason: "min_nights", minNights: 5, segments: [{ from: "2026-10-23", to: "2026-10-25" }] };
    expect(partialNote(info, 2)).toBe("Free for your dates, but this home needs a minimum stay of 5 nights");
  });

  it("says plainly when availability couldn't be confirmed", () => {
    expect(partialNote({ known: false }, 4)).toBe("Availability couldn't be confirmed for these dates");
    expect(partialNote(undefined, 4)).toBe("Availability couldn't be confirmed for these dates");
  });
});
