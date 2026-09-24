import { createPortal } from "react-dom";
import { useBooking } from "../context/booking.tsx";
import { usePanel } from "../hooks/usePanel.ts";
import { searchHorizon } from "../lib/dates.ts";
import { homesHash } from "../lib/route.ts";
import { RangePicker } from "./RangePicker.tsx";

const pinSVG = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M8 14.5s5-4.4 5-8a5 5 0 10-10 0c0 3.6 5 8 5 8z" />
    <circle cx="8" cy="6.4" r="1.8" />
  </svg>
);

const TOWNS: { value: string; label: string; note: string }[] = [
  { value: "all", label: "Anywhere on the island", note: "Cowes to San Remo" },
  { value: "Cowes", label: "Cowes", note: "Shops, jetty and the north beaches" },
  { value: "Newhaven", label: "Newhaven", note: "Quiet, and closest to the bridge" },
  { value: "Sunderland Bay", label: "Sunderland Bay", note: "Ocean frontage on the south coast" },
  { value: "Cape Woolamai", label: "Cape Woolamai", note: "Surf beach and the coastal track" },
  { value: "San Remo", label: "San Remo", note: "Mainland side, pelicans at noon" },
];

/** Availability is only known about a year ahead, so the calendar stops there. */
const MAX_DATE = searchHorizon();

/**
 * The hero search bar: destination dropdown, the two-month RangePicker, a
 * guests popover, and Search. Matches the prototype's `.searchbar` grid.
 * Submitting applies destination, guest count and dates as the search and
 * opens the full listing page, which hides the homes that aren't free for
 * those dates.
 */
export function SearchBar() {
  const b = useBooking();
  const dest = usePanel<HTMLDivElement, HTMLDivElement>();
  const guests = usePanel<HTMLButtonElement, HTMLDivElement>();

  const selectedTown = TOWNS.find((t) => t.value === b.dest) ?? TOWNS[0];

  function guestLabel(): string {
    const t = b.adults + b.kids;
    let s = `${t} guest${t === 1 ? "" : "s"}`;
    if (b.dogs) s += `, ${b.dogs} dog${b.dogs === 1 ? "" : "s"}`;
    return s;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    b.apply();
    window.location.hash = homesHash({ dest: b.dest, guests: b.guests, checkIn: b.checkIn, checkOut: b.checkOut });
  }

  return (
    <form className="searchbar rise" data-delay="460" id="search" autoComplete="off" onSubmit={submit}>
      <div className={`sf${dest.open ? " is-active" : ""}`} id="destField" ref={dest.anchorRef}>
        <label>Destination</label>
        <button
          type="button"
          className="val"
          aria-expanded={dest.open}
          onClick={(e) => {
            e.stopPropagation();
            dest.toggle();
          }}
        >
          {selectedTown.value === "all" ? "Anywhere on the island" : selectedTown.label}
        </button>
        <svg className="chev" width="11" height="7" viewBox="0 0 11 7" fill="none">
          <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {dest.open &&
          createPortal(
            <div
              className="dd open"
              ref={dest.panelRef}
              style={{ left: dest.pos.left, top: dest.pos.top }}
              onClick={(e) => e.stopPropagation()}
            >
              {TOWNS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={t.value === b.dest ? "on" : undefined}
                  onClick={() => {
                    b.set({ dest: t.value });
                    dest.close();
                  }}
                >
                  <span className="pin">{pinSVG}</span>
                  <span className="tx">
                    {t.label}
                    <em>{t.note}</em>
                  </span>
                </button>
              ))}
            </div>,
            document.body,
          )}
      </div>

      <RangePicker
        checkIn={b.checkIn}
        checkOut={b.checkOut}
        onChange={b.setRange}
        maxDate={MAX_DATE}
      />

      <div className={`sf${guests.open ? " is-active" : ""}`} id="guestField">
        <label>Guests</label>
        <button
          type="button"
          className="fake"
          ref={guests.anchorRef}
          aria-expanded={guests.open}
          onClick={(e) => {
            e.stopPropagation();
            guests.toggle();
          }}
        >
          <span>{guestLabel()}</span>
        </button>
        <svg className="chev" width="11" height="7" viewBox="0 0 11 7" fill="none">
          <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {guests.open &&
          createPortal(
            <div
              className="pop open"
              ref={guests.panelRef}
              style={{ left: guests.pos.left, top: guests.pos.top }}
              onClick={(e) => e.stopPropagation()}
            >
              <GuestRow
                label="Adults"
                note="13 years and over"
                value={b.adults}
                onStep={(d) => b.step("adults", d)}
                min={1}
              />
              <GuestRow label="Children" note="Ages 2 to 12" value={b.kids} onStep={(d) => b.step("kids", d)} min={0} />
              <GuestRow label="Dogs" note="Selected homes only" value={b.dogs} onStep={(d) => b.step("dogs", d)} min={0} />
            </div>,
            document.body,
          )}
      </div>

      <button className="search-go" type="submit">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.4" cy="6.4" r="5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.2 10.2L14 14" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Search
      </button>
    </form>
  );
}

function GuestRow({
  label,
  note,
  value,
  min,
  onStep,
}: {
  label: string;
  note: string;
  value: number;
  min: number;
  onStep: (delta: number) => void;
}) {
  return (
    <div className="pop-row">
      <span className="t">
        {label}
        <em>{note}</em>
      </span>
      <span className="stepper">
        <button type="button" disabled={value <= min} onClick={() => onStep(-1)} aria-label={`Fewer ${label}`}>
          −
        </button>
        <output>{value}</output>
        <button type="button" onClick={() => onStep(1)} aria-label={`More ${label}`}>
          +
        </button>
      </span>
    </div>
  );
}
