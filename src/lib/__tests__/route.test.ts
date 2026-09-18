import { describe, expect, it } from "vitest";
import { HOMES_HASH, parseRoute } from "../route.ts";

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
