// These three quotes are genuine owner testimonials, carried over verbatim
// from Phillip Island Host's existing materials — not sample copy.
const QUOTES: { text: string; who: string }[] = [
  {
    text: "I am so impressed with his professionalism and service. He is always so prompt in answering any queries and actioning anything that requires attention.",
    who: "Nicole",
  },
  {
    text: "Matt has greatly impressed me with his professionalism, personable nature and pro-active approach to managing my property as a co-host.",
    who: "William",
  },
  {
    text: "We used to have another company managing our property. Since we switched to Phillip Island Host, our ratings have increased and income almost doubled.",
    who: "Susan",
  },
];

export function Quotes() {
  return (
    <section className="sec" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="sec-head rv" style={{ justifyContent: "center", textAlign: "center" }}>
          <div className="txt" style={{ margin: "0 auto" }}>
            <span className="eyebrow">Owners</span>
            <h2 className="serif d2">What owners say.</h2>
          </div>
        </div>
      </div>
      <div className="quotes">
        {QUOTES.map((q) => (
          <div className="q rv" key={q.who}>
            <span className="qm" aria-hidden="true">
              &rdquo;
            </span>
            <blockquote>&ldquo;{q.text}&rdquo;</blockquote>
            <span className="who">{q.who} &nbsp;·&nbsp; Property owner</span>
          </div>
        ))}
      </div>
    </section>
  );
}
