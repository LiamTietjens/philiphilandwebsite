import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark.tsx";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll.ts";
import { HOMES_HASH } from "../lib/route.ts";

const NAV = [
  { href: HOMES_HASH, label: "Stays" },
  { href: "#story", label: "Our Island" },
  { href: "#included", label: "Included" },
  { href: "#guide", label: "Guide" },
  { href: "#owners", label: "Owners" },
];

const PHONE = "+61 490 465 855";
const EMAIL = "phillipislandcohost@gmail.com";

/**
 * `onPage`: a page with no hero image behind the header (the listing page).
 * The header is solid from the first pixel there, but stays pinned under the
 * announcement bar until the page scrolls it away — `.hdr.solid` alone would
 * jump to top:0 and cover it.
 */
export function Header({ onPage = false }: { onPage?: boolean }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The stylesheet's burger animation and mobile-nav visibility are both
  // driven off `body.menu-open`, matching the ported prototype exactly.
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <>
      <div className="ann">
        <div className="wrap">
          <span>
            <b>Book direct</b> &nbsp;·&nbsp; Best rates guaranteed, no booking fees
          </span>
          <span className="hide-sm">
            Cowes · Newhaven · Cape Woolamai · San Remo &nbsp;·&nbsp; <a href="tel:+61490465855">{PHONE}</a>
          </span>
        </div>
      </div>

      <header className={`hdr${solid || onPage ? " solid" : ""}${onPage && !solid ? " below-ann" : ""}`} id="hdr">
        <div className="wrap bar">
          <a href="#top" className="logo" aria-label="Phillip Island Host home">
            <Wordmark />
          </a>

          <nav className="nav">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="hdr-right">
            <a className="hdr-tel" href="tel:+61490465855">
              {PHONE}
            </a>
            <a href="#search" className="btn outline-light sm">
              Book Direct
            </a>
            <button
              className="burger"
              id="burger"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-nav" id="mobileNav">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </a>
        ))}
        <div className="foot">
          <a href="tel:+61490465855">{PHONE}</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
      </nav>
    </>
  );
}
