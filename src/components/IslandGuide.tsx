const STOPS: { n: string; d: string; time: string }[] = [
  { n: "Penguin Parade", d: "The little penguins come ashore at dusk. Book ahead over summer.", time: "12 min" },
  { n: "Cape Woolamai", d: "The island's best walk. Granite cliffs, surf beach, and the pinnacles.", time: "18 min" },
  { n: "The Nobbies & Seal Rocks", d: "Boardwalks over the blowhole and Australia's largest fur seal colony.", time: "15 min" },
  { n: "Phillip Island Circuit", d: "Ride the MotoGP track, or just watch from the hill on race weekend.", time: "10 min" },
  { n: "Churchill Island", d: "Working heritage farm, sheep dogs, and the best scones on the island.", time: "14 min" },
  { n: "Koala Conservation Reserve", d: "Treetop boardwalks through the bushland. Best late afternoon.", time: "9 min" },
  { n: "San Remo Pelican Feeding", d: "Daily at noon on the jetty, then fish and chips from the co-op.", time: "20 min" },
  { n: "Smiths Beach & Surf Beach", d: "Patrolled in summer, and where the surf schools run.", time: "11 min" },
];

export function IslandGuide() {
  return (
    <section className="sec" id="guide">
      <div className="wrap">
        <div className="sec-head rv">
          <div className="txt">
            <span className="eyebrow">The island</span>
            <h2 className="serif d2">
              Twenty minutes to
              <br />
              most of it.
            </h2>
            <p className="lede">The island runs about forty minutes end to end. Drive times below are from Cowes.</p>
          </div>
        </div>
        <div className="guide">
          <div className="guide-media rv">
            <img src="/images/site/guide.webp" alt="Covered outdoor terrace and garden at Haven Stay, Newhaven" loading="lazy" />
          </div>
          <div className="guide-list rv">
            {STOPS.map((s) => (
              <div className="gi" key={s.n}>
                <span className="n">
                  {s.n}
                  <em>{s.d}</em>
                </span>
                <span className="d">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
