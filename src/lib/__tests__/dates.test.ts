import { describe, expect, it } from "vitest";
import { addMonths, fmtDay, iso, monthShape, nightsBetween, nightsOf, parseISO } from "../dates.ts";

describe("iso / parseISO", () => {
  it("round-trips a local date without a UTC day shift", () => {
    // The classic bug this guards against: toISOString() on a local Date
    // shifts the calendar day for any timezone ahead of UTC (which includes
    // every guest on Phillip Island, UTC+10/11).
    const d = new Date(2026, 2, 1); // 1 Mar 2026, local midnight
    expect(iso(d)).toBe("2026-03-01");
    expect(parseISO("2026-03-01").getTime()).toBe(d.getTime());
  });

  it("pads single-digit months and days", () => {
    expect(iso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("nightsBetween", () => {
  it("counts whole nights", () => {
    expect(nightsBetween("2026-03-01", "2026-03-05")).toBe(4);
  });
  it("is 0 when either end is missing", () => {
    expect(nightsBetween(null, "2026-03-05")).toBe(0);
    expect(nightsBetween("2026-03-01", null)).toBe(0);
  });
  it("is 0 for a same-day (solo) selection", () => {
    expect(nightsBetween("2026-03-01", "2026-03-01")).toBe(0);
  });
});

describe("fmtDay", () => {
  it("formats as 'Sun 1 Mar'", () => {
    // 2026-03-01 is a Sunday.
    expect(fmtDay("2026-03-01")).toBe("Sun 1 Mar");
  });
  it("is empty for null", () => {
    expect(fmtDay(null)).toBe("");
  });
});

describe("monthShape", () => {
  it("computes Monday-first lead and day count for March 2026 (starts Sunday)", () => {
    const { lead, days } = monthShape(new Date(2026, 2, 1));
    expect(lead).toBe(6); // Sunday is index 6 in a Monday-first week
    expect(days).toBe(31);
  });
  it("handles February in a non-leap year", () => {
    expect(monthShape(new Date(2026, 1, 1)).days).toBe(28);
  });
});

describe("addMonths", () => {
  it("rolls over into the next year", () => {
    const d = addMonths(new Date(2026, 11, 15), 1);
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1); // always normalized to the 1st
  });
});

describe("nightsOf", () => {
  it("lists each night of a stay — arrival day up to, but not including, departure", () => {
    expect(nightsOf("2026-10-13", "2026-10-16")).toEqual(["2026-10-13", "2026-10-14", "2026-10-15"]);
  });

  it("crosses month and year boundaries", () => {
    expect(nightsOf("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01"]);
  });

  it("is empty without both dates or a positive stay", () => {
    expect(nightsOf(null, "2026-10-16")).toEqual([]);
    expect(nightsOf("2026-10-13", null)).toEqual([]);
    expect(nightsOf("2026-10-13", "2026-10-13")).toEqual([]);
    expect(nightsOf("2026-10-16", "2026-10-13")).toEqual([]);
  });
});
