import { useLayoutEffect, useRef, useState } from "react";
import type { Listing, OpenListing } from "./data/types.ts";
import { BookingProvider, useBooking } from "./context/booking.tsx";
import { useHashRoute } from "./hooks/useHashRoute.ts";
import { useListings } from "./hooks/useListings.ts";
import { useReveal } from "./hooks/useReveal.ts";
import { Header } from "./components/Header.tsx";
import { Hero } from "./components/Hero.tsx";
import { TrustStrip } from "./components/TrustStrip.tsx";
import { Stays } from "./components/Stays.tsx";
import { HomesPage } from "./components/HomesPage.tsx";
import { Story } from "./components/Story.tsx";
import { Included } from "./components/Included.tsx";
import { IslandGuide } from "./components/IslandGuide.tsx";
import { Quotes } from "./components/Quotes.tsx";
import { Owners } from "./components/Owners.tsx";
import { Footer } from "./components/Footer.tsx";
import { PropertyModal } from "./components/PropertyModal.tsx";

function Page() {
  const b = useBooking();
  const route = useHashRoute();
  // Loaded here, not in each page, so landing → all homes → back doesn't refetch.
  const { listings, status } = useListings();
  const [active, setActive] = useState<{ listing: Listing; prefill: boolean; hint?: string } | null>(null);
  const open: OpenListing = (listing, opts) => setActive({ listing, prefill: opts?.prefill ?? true, hint: opts?.hint });

  // The dates a popup should carry in: what Search submitted on the listing page,
  // or what's picked in the hero bar on the landing page.
  const onListingPage = route === "homes";
  const stayIn = onListingPage ? (b.applied?.checkIn ?? null) : b.checkIn;
  const stayOut = onListingPage ? (b.applied?.checkOut ?? null) : b.checkOut;
  useReveal();

  // On a real page change: close any open popup, then land on the clicked
  // landing-page anchor (#owners, #search…) if there is one, else the top. The
  // anchor's section only exists once the new page has rendered, which is why
  // the browser's own hash scrolling can't do this and it happens here.
  const prevRoute = useRef(route);
  useLayoutEffect(() => {
    if (prevRoute.current === route) return;
    prevRoute.current = route;
    setActive(null);
    const id = window.location.hash.slice(1);
    const target = route === "home" && id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [route]);

  return (
    <>
      <Header onPage={route === "homes"} />
      <main>
        {route === "homes" ? (
          <HomesPage listings={listings} status={status} onOpen={open} />
        ) : (
          <>
            <Hero />
            <TrustStrip count={listings.length} />
            <Stays listings={listings} status={status} onOpen={open} />
            <Story listings={listings} />
            <Included />
            <IslandGuide />
            <Quotes />
            <Owners />
          </>
        )}
      </main>
      <Footer />
      {active && (
        <PropertyModal
          listing={active.listing}
          guests={b.guests}
          adults={b.adults}
          initialStay={active.prefill ? { checkIn: stayIn, checkOut: stayOut } : undefined}
          viewFrom={stayIn}
          hint={active.hint}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <BookingProvider>
      <Page />
    </BookingProvider>
  );
}
