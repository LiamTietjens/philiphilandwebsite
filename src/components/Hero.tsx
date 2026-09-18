import { useRise } from "../hooks/useReveal.ts";
import { SearchBar } from "./SearchBar.tsx";

export function Hero() {
  useRise();

  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <img
          src="/images/site/hero.webp"
          alt="Deck looking across the dunes to Bass Strait, Sunderland Bay"
          fetchPriority="high"
        />
      </div>
      <div className="hero-scroll rise" data-delay="900">
        Scroll
      </div>
      <div className="hero-inner wrap">
        <span className="eyebrow light rise" data-delay="120">
          Phillip Island &nbsp;·&nbsp; San Remo &nbsp;·&nbsp; Victoria
        </span>
        <h1 className="serif d1 rise" data-delay="220">
          The good houses on
          <br />
          Phillip Island.
        </h1>
        <p className="lede rise" data-delay="340">
          Holiday houses across Cowes, Newhaven, Cape Woolamai and San Remo, all looked after by our own team. We
          live here. That is most of the job.
        </p>

        <SearchBar />
      </div>
    </section>
  );
}
