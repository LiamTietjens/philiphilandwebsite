export type Route = "home" | "homes";

/** Hash of the all-homes listing page. */
export const HOMES_HASH = "#/homes";

/**
 * Hash routing needs no server rewrite rules, and every landing-page anchor
 * (`#owners`, `#search`, …) keeps working untouched: anything that isn't
 * `#/homes` is the landing page.
 */
export function parseRoute(hash: string): Route {
  return /^#\/homes(?:[/?].*)?$/.test(hash) ? "homes" : "home";
}
