# Phillip Island Host — marketing website

Public, direct-booking marketing site. React 19 + TypeScript + Vite 8 +
Tailwind CSS v4 (matches the `dashboard/` stack). Single page, anchor nav.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # serve the production build
```

## How listings reach the site

Property data comes from **Guesty**, not from this repo. The browser can't call
Guesty directly (OAuth secret + CORS), so listings are served by a small
backend endpoint:

```
useListings()  →  fetch(VITE_LISTINGS_API)  →  public-listings Edge Function  →  Guesty
```

- Endpoint code: [`backend/supabase/functions/public-listings`](../backend/supabase/functions/public-listings/index.ts)
  (public, `verify_jwt = false`; returns a trimmed, public-safe listing shape).
- Deploy it, then set `VITE_LISTINGS_API` to its URL (see `.env.example`).
- **Until that's set, the site falls back to bundled sample homes** (three, under
  `public/images/sample`) and shows a "sample homes" note, so it always renders.

Deploy the endpoint:

```bash
cd backend
supabase functions deploy public-listings
# URL: https://<project-ref>.supabase.co/functions/v1/public-listings
```

## Booking

Booking hands off to your **Guesty Booking Engine** — the site itself takes no
payments. Set `VITE_GUESTY_BOOKING_URL` to your Booking Engine base URL and the
hero search + each home's "Request to book" deep-link there with the visitor's
dates and guests pre-filled ([`src/lib/booking.ts`](src/lib/booking.ts)).

- The deep-link **parameter names** (`checkIn` / `checkOut` / `minOccupancy`, path
  `/properties/{id}`) are Guesty's documented format but **should be verified**
  against your live Booking Engine — adjust them in one place in `booking.ts`.
- Without `VITE_GUESTY_BOOKING_URL`, "Request to book" falls back to an email
  enquiry to `phillipislandcohost@gmail.com`.

## Configuration

Copy `.env.example` → `.env.local`:

| Variable | Purpose |
| --- | --- |
| `VITE_LISTINGS_API` | URL of the `public-listings` endpoint (live Guesty listings). |
| `VITE_GUESTY_BOOKING_URL` | Guesty Booking Engine base URL, for booking deep-links. |

## Notes

- Fonts (Switzer, Tanker) are self-hosted in `public/fonts` — no external font CDN.
- The original hand-built HTML is preserved at `legacy/original.html` for reference.
- Owners' "earnings estimate" form composes an email on submit; point it at a
  real form endpoint later if you'd rather capture leads server-side.
# philiphilandwebsite
