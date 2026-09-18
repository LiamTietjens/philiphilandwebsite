import { useSyncExternalStore } from "react";
import { parseRoute } from "../lib/route.ts";
import type { Route } from "../lib/route.ts";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** The current page, derived from `location.hash` (see lib/route.ts). */
export function useHashRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => parseRoute(window.location.hash),
    () => "home",
  );
}
