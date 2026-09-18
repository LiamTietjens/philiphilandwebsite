import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { usePanel } from "../hooks/usePanel.ts";
import { DOW, MONTHS, addMonths, iso, monthShape, nightsBetween, parseISO, today } from "../lib/dates.ts";

const TODAY = today();
const TODAY_ISO = iso(TODAY);

interface Props {
  checkIn: string | null;
  checkOut: string | null;
  onChange: (checkIn: string | null, checkOut: string | null) => void;
  /** ISO days that cannot be booked, e.g. from useAvailability(). */
  booked?: ReadonlySet<string>;
  /** False when availability is unknown — no strike-throughs, and the info
   *  line says so instead of implying every date is free. */
  availabilityKnown?: boolean;
}

/** A stay cannot straddle someone else's booking. */
function spanClear(booked: ReadonlySet<string> | undefined, a: string, b: string): boolean {
  if (!booked || booked.size === 0) return true;
  for (let d = parseISO(a); iso(d) < b; d.setDate(d.getDate() + 1)) {
    if (booked.has(iso(d))) return false;
  }
  return true;
}

function fmtDay(s: string | null): string {
  if (!s) return "";
  const d = parseISO(s);
  return `${DOW[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/**
 * Two-month range calendar, portalled to document.body and positioned fixed
 * against whichever field opened it. Mirrors the prototype's createRangePicker:
 * the grid repaints in place on hover rather than being rebuilt, because
 * rebuilding between mousedown and mouseup replaced the button the browser
 * had focused, so the departure click never landed.
 */
export function RangePicker({
  checkIn,
  checkOut,
  onChange,
  booked,
  availabilityKnown = true,
}: Props) {
  const panel = usePanel<HTMLDivElement, HTMLDivElement>();
  const [active, setActive] = useState<"in" | "out">("in");
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState(() =>
    checkIn ? new Date(parseISO(checkIn).getFullYear(), parseISO(checkIn).getMonth(), 1) : new Date(TODAY.getFullYear(), TODAY.getMonth(), 1),
  );

  const monthB = addMonths(view, 1);
  const isFirstMonth = view.getFullYear() === TODAY.getFullYear() && view.getMonth() === TODAY.getMonth();
  const end = checkOut || (active === "out" ? hover : null);

  const nights = nightsBetween(checkIn, checkOut);
  const info = nights
    ? `${nights} night${nights === 1 ? "" : "s"} · ${fmtDay(checkIn)} to ${fmtDay(checkOut)}`
    : checkIn
      ? "Now pick your last night"
      : !availabilityKnown
        ? "Availability isn't confirmed yet — we'll check when you book"
        : booked && booked.size > 0
          ? "Crossed out dates are already booked"
          : "Pick your arrival date";

  function openField(which: "in" | "out") {
    // Nothing to depart from yet — send an empty Leave click to Arrive instead
    // of opening a picker with no start.
    const target = which === "out" && !checkIn ? "in" : which;
    setActive(target);
    if (checkIn) setView(new Date(parseISO(checkIn).getFullYear(), parseISO(checkIn).getMonth(), 1));
    panel.setOpen(true);
  }

  function pick(key: string, disabled: boolean) {
    if (disabled) return;
    if (active === "in" || !checkIn || key <= checkIn) {
      onChange(key, null);
      setActive("out");
      return;
    }
    if (!spanClear(booked, checkIn, key)) {
      onChange(key, null);
      setActive("out");
      return;
    }
    onChange(checkIn, key);
    setActive("in");
    window.setTimeout(() => panel.close(), 180);
  }

  function monthDays(base: Date) {
    const { lead, days } = monthShape(base);
    const cells: { key: string; day: number; disabled: boolean; classes: string[] }[] = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(base.getFullYear(), base.getMonth(), d);
      const key = iso(date);
      const past = date < TODAY;
      const taken = availabilityKnown && !!booked?.has(key);
      const classes: string[] = [];
      if (past) classes.push("is-off");
      if (taken && !past) classes.push("is-booked");
      if (key === TODAY_ISO) classes.push("is-today");
      if (checkIn && key === checkIn) classes.push("is-in");
      if (checkOut && key === checkOut) classes.push("is-out");
      if (checkIn && end && key > checkIn && key < end && spanClear(booked, checkIn, key)) classes.push("is-mid");
      if (checkIn && checkOut && checkIn === checkOut) classes.push("is-solo");
      cells.push({ key, day: d, disabled: past || taken, classes });
    }
    return { lead, cells };
  }

  const gridA = useMemo(() => monthDays(view), [view, checkIn, checkOut, hover, active, booked, availabilityKnown]);
  const gridB = useMemo(() => monthDays(monthB), [monthB, checkIn, checkOut, hover, active, booked, availabilityKnown]);

  function renderMonth(grid: ReturnType<typeof monthDays>) {
    return (
      <div className="dp-cal">
        <div className="dp-dow">
          {DOW.map((d) => (
            <span key={d}>{d[0]}</span>
          ))}
        </div>
        <div className="dp-grid">
          {Array.from({ length: grid.lead }, (_, i) => (
            <span className="dp-pad" key={`pad-${i}`} />
          ))}
          {grid.cells.map((c) => (
            <button
              key={c.key}
              type="button"
              className={["dp-d", ...c.classes].join(" ")}
              data-d={c.key}
              disabled={c.disabled}
              title={c.classes.includes("is-booked") ? "Already booked" : undefined}
              onClick={() => pick(c.key, c.disabled)}
              onMouseOver={() => {
                if (!c.disabled && active === "out" && checkIn) setHover(c.key);
              }}
            >
              <span>{c.day}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sf" id="inField" ref={(el) => void (panel.anchorRef.current = el as never)}>
        <label>Check in</label>
        <button
          type="button"
          className={`val${checkIn ? "" : " ph"}`}
          onClick={(e) => {
            e.stopPropagation();
            openField("in");
          }}
        >
          {checkIn ? fmtDay(checkIn) : "Add a date"}
        </button>
      </div>
      <div className="sf" id="outField">
        <label>Check out</label>
        <button
          type="button"
          className={`val${checkOut ? "" : " ph"}`}
          onClick={(e) => {
            e.stopPropagation();
            openField("out");
          }}
        >
          {checkOut ? fmtDay(checkOut) : "Add a date"}
        </button>
      </div>
      {panel.open &&
        createPortal(
          <div
            className={`dp${panel.open ? " open" : ""}`}
            ref={panel.panelRef as never}
            style={{ left: panel.pos.left, top: panel.pos.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dp-head">
              <button
                type="button"
                className="dp-nav"
                aria-label="Previous month"
                disabled={isFirstMonth}
                onClick={() => setView((v) => addMonths(v, -1))}
              >
                <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                  <path d="M6 1L1.5 5.5 6 10" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
              <div className="dp-titles">
                <span className="dp-title">
                  {MONTHS[view.getMonth()]} {view.getFullYear()}
                </span>
                <span className="dp-title dp-t2">
                  {MONTHS[monthB.getMonth()]} {monthB.getFullYear()}
                </span>
              </div>
              <button type="button" className="dp-nav" aria-label="Next month" onClick={() => setView((v) => addMonths(v, 1))}>
                <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                  <path d="M1 1l4.5 4.5L1 10" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </div>
            <div className="dp-cals">
              {renderMonth(gridA)}
              <div className="dp-c2">{renderMonth(gridB)}</div>
            </div>
            <div className="dp-foot">
              <span className="dp-info">
                {availabilityKnown && booked && booked.size > 0 && !nights && !checkIn ? (
                  <>
                    <i className="dp-key" />
                    {info}
                  </>
                ) : (
                  info
                )}
              </span>
              <span className="dp-acts">
                <button
                  type="button"
                  className="dp-clear"
                  onClick={() => {
                    onChange(null, null);
                    setHover(null);
                    setActive("in");
                  }}
                >
                  Clear
                </button>
                <button type="button" className="dp-done" onClick={() => panel.close()}>
                  Done
                </button>
              </span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
