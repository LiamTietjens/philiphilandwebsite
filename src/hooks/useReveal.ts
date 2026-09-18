import { useEffect } from "react";

/**
 * Scroll reveal: adds `.in` to every `.rv` element once it enters view, which
 * the ported stylesheet animates from translateY(28px)/opacity 0. One
 * observer for the whole document, mounted once from App — a MutationObserver
 * picks up `.rv` nodes added later (property cards after Guesty responds, the
 * modal's own content), so callers never need to re-trigger this themselves.
 */
export function useReveal(): void {
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>(".rv").forEach((el) => el.classList.add("in"));
    };
    if (reduced || typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    const observeNew = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((el) => io.observe(el));
    };
    observeNew(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches(".rv:not(.in)")) io.observe(n);
          observeNew(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

/**
 * The hero's staged load-in: `.rise` elements fade up on a per-element delay
 * from `data-delay`, independent of scroll position.
 */
export function useRise(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rise"));
    const timers = els.map((el) =>
      window.setTimeout(() => el.classList.add("in"), Number(el.dataset.delay || 0)),
    );
    return () => timers.forEach(clearTimeout);
  }, []);
}
