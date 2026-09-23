import { useMemo } from "react";
import type { Listing } from "../data/types.ts";

const arrow = (
  <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
    <path d="M0 4.5h15M11.5 1L15 4.5 11.5 8" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

/**
 * The prototype hard-coded "43 houses / 6 towns" — its own comment flagged
 * both as placeholder counters. Both are now the real, live portfolio size
 * and town spread; "2019" is a founding date, not guest data, so it stays
 * as written.
 */
export function Story({ listings }: { listings: Listing[] }) {
  const towns = useMemo(() => new Set(listings.map((l) => l.town)).size, [listings]);

  return (
    <section className="sec" id="story" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="split">
          <div className="split-media rv">
            <img src="/images/site/story.webp" alt="Open living and dining space at Haven Stay, Newhaven" loading="lazy" />
            <div className="stamp">
              <div className="k">Since 2019</div>
              <div className="v">Hosting on the island</div>
            </div>
          </div>
          <div className="split-body rv">
            <span className="eyebrow" style={{ display: "block", marginBottom: 18 }}>
              About us
            </span>
            <h2 className="serif d2">
              We live on
              <br />
              the island.
            </h2>
            <p className="lede">
              Phillip Island Host is a full-service holiday letting company run out of Cowes. If a heater packs
              it in at nine on a Friday night, someone who lives eight minutes away comes and sorts it.
            </p>
            <p className="lede">
              Linen goes through our own laundromat in Cowes. Maintenance and gardening are handled in house.
              Every house gets checked before the next guest turns up.
            </p>
            <div className="split-stats">
              <div>
                <div className="k">{listings.length > 0 ? listings.length : "—"}</div>
                <div className="v">Houses on the books</div>
              </div>
              <div>
                <div className="k">{towns > 0 ? towns : "—"}</div>
                <div className="v">Towns we cover</div>
              </div>
              <div>
                <div className="k">2019</div>
                <div className="v">Hosting since</div>
              </div>
            </div>
            <a href="#included" className="link-u" style={{ color: "var(--sea)" }}>
              What every stay includes {arrow}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
