import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOMES_HASH, homesHash, parseHomesSearch, parseRoute, sameSearch } from "../route.ts";

describe("the search in the listing page's URL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 24, 12, 0, 0)); // 24 Sep 2026, local
  });
  afterEach(() => vi.useRealTimers());

  const full = { dest: "Cowes", guests: 4, checkIn: "2026-10-13", checkOut: "2026-10-17" };

  it("a search round-trips through the URL", () => {
    expect(parseHomesSearch(homesHash(full))).toEqual(full);
  });

  it("a town with a space survives", () => {
    const s = { ...full, dest: "Sunderland Bay" };
    expect(parseHomesSearch(homesHash(s))).toEqual(s);
  });

  it("dates are left out of the URL until both are chosen, but the search is kept", () => {
    const h = homesHash({ dest: "all", guests: 2, checkIn: "2026-10-13", checkOut: null });
    expect(h).toBe("#/homes?dest=all&guests=2");
    expect(parseHomesSearch(h)).toEqual({ dest: "all", guests: 2, checkIn: null, checkOut: null });
  });

  it("the bare listing page has no search", () => {
    expect(parseHomesSearch("#/homes")).toBeNull();
    expect(parseHomesSearch("#/homes/")).toBeNull();
    expect(parseHomesSearch("")).toBeNull();
    expect(parseHomesSearch("#owners")).toBeNull();
  });

  it("query strings that aren't a search are ignored", () => {
    expect(parseHomesSearch("#/homes?foo=1")).toBeNull();
  });

  it("only reads a search from the listing page's hash", () => {
    expect(parseHomesSearch("#stays?dest=Cowes&guests=2")).toBeNull();
  });

  it("falls back to anywhere / 2 guests when those are missing or nonsense", () => {
    expect(parseHomesSearch("#/homes?checkIn=2026-10-13&checkOut=2026-10-17")).toEqual({
      dest: "all", guests: 2, checkIn: "2026-10-13", checkOut: "2026-10-17",
    });
    for (const g of ["0", "-3", "abc", "99", "2.5"]) {
      expect(parseHomesSearch(`#/homes?guests=${g}`)?.guests).toBe(2);
    }
  });

  it("drops dates that aren't real, are reversed, are in the past or beyond the search horizon", () => {
    const bad = [
      "checkIn=2026-02-31&checkOut=2026-03-03", // not a real day
      "checkIn=13-10-2026&checkOut=17-10-2026", // wrong format
      "checkIn=2026-10-17&checkOut=2026-10-13", // reversed
      "checkIn=2026-10-13&checkOut=2026-10-13", // zero nights
      "checkIn=2026-09-01&checkOut=2026-09-05", // already past
      "checkIn=2027-12-01&checkOut=2027-12-05", // beyond the horizon
      "checkIn=2026-10-13",                      // only one date
    ];
    for (const q of bad) {
      const s = parseHomesSearch(`#/homes?dest=Cowes&guests=3&${q}`);
      expect(s, q).toEqual({ dest: "Cowes", guests: 3, checkIn: null, checkOut: null });
    }
  });

  it("caps an absurdly long town name", () => {
    expect(parseHomesSearch(`#/homes?dest=${"x".repeat(200)}&guests=2`)?.dest).toBe("all");
  });

  it("sameSearch compares every field, and treats two missing searches as equal", () => {
    expect(sameSearch(full, { ...full })).toBe(true);
    expect(sameSearch(null, null)).toBe(true);
    expect(sameSearch(full, null)).toBe(false);
    expect(sameSearch(full, { ...full, guests: 5 })).toBe(false);
    expect(sameSearch(full, { ...full, checkOut: "2026-10-18" })).toBe(false);
    expect(sameSearch(full, { ...full, dest: "all" })).toBe(false);
  });
});

describe("parseRoute", () => {
  it("treats the empty hash as the landing page", () => {
    expect(parseRoute("")).toBe("home");
  });

  it("treats landing-page anchors as the landing page, so #owners etc. keep working", () => {
    for (const h of ["#top", "#stays", "#search", "#owners", "#guide"]) {
      expect(parseRoute(h)).toBe("home");
    }
  });

  it("recognises the all-homes page", () => {
    expect(parseRoute("#/homes")).toBe("homes");
    expect(parseRoute(HOMES_HASH)).toBe("homes");
  });

  it("tolerates a trailing slash or query string on the all-homes page", () => {
    expect(parseRoute("#/homes/")).toBe("homes");
    expect(parseRoute("#/homes?town=Cowes")).toBe("homes");
  });

  it("does not match look-alike hashes", () => {
    expect(parseRoute("#/homestay")).toBe("home");
    expect(parseRoute("#homes")).toBe("home");
    expect(parseRoute("#/other")).toBe("home");
  });
});
