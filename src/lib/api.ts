// Public Supabase Edge Function endpoints. None of these is a secret (each is
// unauthenticated by design and holds its own credentials server-side), so the
// live URLs are the defaults: a missing VITE_* variable on the host must never
// silently ship the site with sample homes or no availability. Each can still
// be overridden, e.g. to point at another Supabase project.
const FUNCTIONS = "https://ictumlksmzjenevtaqvp.supabase.co/functions/v1";

/** Live Guesty listings. */
export const LISTINGS_API = (import.meta.env.VITE_LISTINGS_API as string | undefined) || `${FUNCTIONS}/public-listings`;

/** Guesty calendars: booked days, per-night prices, minimum stays, and date search. */
export const AVAILABILITY_API =
  (import.meta.env.VITE_AVAILABILITY_API as string | undefined) || `${FUNCTIONS}/public-availability`;

/** The "Free earnings estimate" form. */
export const OWNER_LEAD_API =
  (import.meta.env.VITE_OWNER_LEAD_API as string | undefined) || `${FUNCTIONS}/owner-lead`;
