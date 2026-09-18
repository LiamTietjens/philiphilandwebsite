import type { ReactElement } from "react";

const ITEMS: { icon: ReactElement; title: string; body: string }[] = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M2 17v-4a2 2 0 012-2h16a2 2 0 012 2v4M2 17h20M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3M2 17v3M22 17v3" />
      </svg>
    ),
    title: "Hotel-quality linen",
    body: "Sheets, towels, bath mats and face washers, all washed at our own laundromat in Cowes.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <circle cx="8" cy="12" r="4" />
        <path d="M12 12h9M18 12v3.5M21 12v2.5" />
      </svg>
    ),
    title: "24/7 self check-in",
    body: "Keyless entry, plus an arrival guide sent the day before you travel. Turn up at midnight if you need to.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V9zM17 10h1.5a2.5 2.5 0 010 5H17M4 4.5c.6.8.6 1.7 0 2.5M8.5 4.5c.6.8.6 1.7 0 2.5M13 4.5c.6.8.6 1.7 0 2.5" />
      </svg>
    ),
    title: "The starter basket",
    body: "Coffee, tea and bathroom supplies. Enough to get you through the first morning before the shops open.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <circle cx="12" cy="13" r="4.2" />
        <path d="M8 6.5h2M15.5 6.5h.5" />
      </svg>
    ),
    title: "Laundromat access",
    body: "Guest rates at Phillip Island Laundromat in Cowes. Useful for wet wetsuits and a fortnight of sandy towels.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M6.5 9v6M17.5 9v6M3.5 10.5v3M20.5 10.5v3M6.5 12h11" />
      </svg>
    ),
    title: "Island gym pass",
    body: "Access to our 24/7 gym on the island, included with every booking.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M4 13v-1a8 8 0 0116 0v1M4 13a2 2 0 012-2h1v6H6a2 2 0 01-2-2v-2zM20 13a2 2 0 00-2-2h-1v6h1a2 2 0 002-2v-2zM17 17v1a3 3 0 01-3 3h-2" />
      </svg>
    ),
    title: "Someone who answers",
    body: "One number, picked up by a person on the island who knows which beach is calm today.",
  },
];

export function Included() {
  return (
    <section className="sec inc" id="included">
      <div className="wrap">
        <div className="sec-head rv">
          <div className="txt">
            <span className="eyebrow">Included</span>
            <h2 className="serif d2">Included in every stay.</h2>
            <p className="lede">No cleaning surcharge on arrival, no linen hire, no resort fee.</p>
          </div>
        </div>
        <div className="inc-grid">
          {ITEMS.map((item) => (
            <div className="inc-item rv" key={item.title}>
              <span className="ic">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
