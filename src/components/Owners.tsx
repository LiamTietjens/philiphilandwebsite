import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { OWNER_LEAD_API } from "../lib/api.ts";
import { ENQUIRY_EMAIL } from "../lib/booking.ts";

// The owner-lead Supabase Edge Function (backend/supabase/functions/owner-lead)
// emails the submission to the address it is configured with (LEAD_NOTIFY_TO).
const API = OWNER_LEAD_API;

type Status = "idle" | "sending" | "sent" | "error";

const checkSVG = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M2 7.4l3.2 3.2L12 3.8" />
  </svg>
);

const POINTS = [
  "A dedicated property manager, based on the island",
  "Automated yield management for the highest nightly returns",
  "Owner dashboard for tracking revenue and blocking out your own dates",
  "Listed across every major platform, plus direct bookings here",
  "Consumables and linen included, processed at our own laundromat",
];

export function Owners() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", addr: "", email: "" });
  const locked = status === "sending" || status === "sent";

  const update = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, address: form.addr, email: form.email }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      setStatus(res.ok && data?.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="sec owners" id="owners">
      <div className="wrap">
        <div className="owners-in">
          <div className="rv">
            <span className="eyebrow light" style={{ display: "block", marginBottom: 18 }}>
              For property owners
            </span>
            <h2 className="serif d2">
              Thinking of letting
              <br />
              yours out?
            </h2>
            <p className="lede">
              Free to sign up and no lock-in contract. We do the listing, the photography, the guests, the linen,
              the cleaning, the maintenance and the gardening.
            </p>
            <ul className="owners-pts" style={{ listStyle: "none", padding: 0, marginTop: 32 }}>
              {POINTS.map((p) => (
                <li key={p}>
                  {checkSVG}
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <form className="est rv" id="estForm" onSubmit={submit}>
            <h3>Free earnings estimate</h3>
            <p>Send through the address and we will come back with an annual earnings estimate based on current island data.</p>
            <div className="field">
              <label htmlFor="eName">Your name</label>
              <input id="eName" type="text" placeholder="Jane Whitmore" required value={form.name} onChange={update("name")} disabled={locked} />
            </div>
            <div className="field">
              <label htmlFor="eAddr">Property address</label>
              <input id="eAddr" type="text" placeholder="12 Thompson Ave, Cowes VIC" required value={form.addr} onChange={update("addr")} disabled={locked} />
            </div>
            <div className="field">
              <label htmlFor="eMail">Email</label>
              <input id="eMail" type="email" placeholder="jane@example.com" required value={form.email} onChange={update("email")} disabled={locked} />
            </div>
            <button className="btn light" type="submit" disabled={locked}>
              {status === "sending" ? "Sending…" : status === "sent" ? "Estimate requested" : "Get my estimate"}
            </button>
            <p className="note">No obligation · No lock-in contract</p>
            <p className={`ok-msg${status === "sent" ? " show" : ""}`} id="estOk">
              Thanks. We will come back to you within one business day.
            </p>
            <p className={`ok-msg err${status === "error" ? " show" : ""}`} role="alert">
              Sorry, that didn&rsquo;t go through. Please email us at {ENQUIRY_EMAIL}.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
