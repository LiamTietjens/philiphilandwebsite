import { useListings } from "../hooks/useListings.ts";

/**
 * The prototype's four-stat strip led with a "4.9 average guest rating" —
 * flagged in its own source comment as a placeholder to replace before this
 * went live. Guesty's Open API doesn't expose review scores on this account,
 * so rather than ship an unverifiable number we lead with something we can
 * compute honestly: how many homes are actually on the books right now.
 * The other three are standing, non-numeric claims about how the business
 * operates, not per-guest data, so they're kept as written.
 */
export function TrustStrip() {
  const { listings } = useListings();
  const count = listings.length;

  return (
    <section className="trust">
      <div className="trust-grid">
        <div className="trust-item rv">
          <span className="k">{count > 0 ? count : "—"}</span>
          <span className="v">Homes across the island</span>
        </div>
        <div className="trust-item rv">
          <span className="k">#1</span>
          <span className="v">Quality Business Awards 2025</span>
        </div>
        <div className="trust-item rv">
          <span className="k">24/7</span>
          <span className="v">Self check-in &amp; local support</span>
        </div>
        <div className="trust-item rv">
          <span className="k">A$0</span>
          <span className="v">Booking fees on direct bookings</span>
        </div>
      </div>
    </section>
  );
}
