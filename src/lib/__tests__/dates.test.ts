import { afterEach, describe, expect, it, vi } from "vitest";
import { addMonths, fmtDay, iso, monthShape, fmtRange, nightsBetween, nightsOf, parseISO, searchHorizon, today } from "../dates.ts";

describe("today / searchHorizon use the island's calendar day, not the visitor's", () => {
  afterEach(() => vi.useRealTimers());

  it("is already tomorrow on the island while it is still evening in Europe or India", () => {
    // 24 Sep 15:51 UTC = 25 Sep 01:51 in Melbourne. The server rejects 24 Sep as "in the past".
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T15:51:00Z"));
    expect(iso(today())).toBe("2026-09-25");
  });

  it("is still yesterday on the island late in the evening in the Americas", () => {
    // 24 Sep 13:00 UTC = 24 Sep 23:00 in Melbourne (before DST) — not the 25th.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T13:00:00Z"));
    expect(iso(today())).toBe("2026-09-24");
  });

  it("follows daylight saving (UTC+11 from the first Sunday of October)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T13:30:00Z")); // 00:30 on 11 Oct in Melbourne
    expect(iso(today())).toBe("2026-10-11");
  });

  it("returns local midnight, so it works with the rest of the date helpers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T15:51:00Z"));
    const t = today();
    expect([t.getHours(), t.getMinutes(), t.getSeconds()]).toEqual([0, 0, 0]);
  });

  it("the search horizon is 360 days after the island's today (inside the server's 365)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T15:51:00Z"));
    expect(searchHorizon()).toBe("2027-09-20");
  });
});


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

describe("fmtRange", () => {
  it("collapses the month when both ends share it", () => {
    expect(fmtRange("2026-10-13", "2026-10-15")).toBe("13 – 15 Oct");
  });

  it("names both months when the range crosses one", () => {
    expect(fmtRange("2026-10-30", "2026-11-02")).toBe("30 Oct – 2 Nov");
    expect(fmtRange("2026-12-30", "2027-01-02")).toBe("30 Dec – 2 Jan");
  });

  it("shows a single day range as one date", () => {
    expect(fmtRange("2026-10-13", "2026-10-13")).toBe("13 Oct");
  });
});
