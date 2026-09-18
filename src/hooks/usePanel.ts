import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A dropdown/popover/calendar panel that renders into document.body and is
 * positioned fixed against its trigger field.
 *
 * Why not nest the panel inside the search bar? The prototype learned this
 * the hard way (see its comment at the placePanel definition): a closed panel
 * still contributed to document scroll width, which widened the layout
 * viewport, which made window.innerWidth lie to the very clamp meant to stop
 * the overflow. Portalling to body and positioning against the anchor's rect
 * keeps the panel out of the layout entirely.
 */

// One panel open at a time, across every instance of this hook.
const registry = new Set<() => void>();

function closeOthers(keep: () => void): void {
  for (const close of registry) if (close !== keep) close();
}

const GAP = 12;
const EDGE = 14;

export interface PanelPos {
  left: number;
  top: number;
}

export function place(anchor: HTMLElement, panel: HTMLElement): PanelPos {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const a = anchor.getBoundingClientRect();
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;

  let left = a.left;
  if (left + pw > vw - EDGE) left = vw - EDGE - pw;
  if (left < EDGE) left = EDGE;

  let top = a.bottom + GAP;
  if (top + ph > vh - GAP) {
    const above = a.top - GAP - ph;
    if (above > GAP) top = above;
  }
  // "Above the field" is still off-screen when the field itself is, so pin the
  // panel to the viewport whatever the anchor is doing.
  top = Math.max(GAP, Math.min(top, vh - GAP - ph));

  return { left: Math.round(left), top: Math.round(top) };
}

export function usePanel<A extends HTMLElement = HTMLElement, P extends HTMLElement = HTMLElement>() {
  const [open, setOpenState] = useState(false);
  const [pos, setPos] = useState<PanelPos>({ left: 0, top: 0 });
  const anchorRef = useRef<A | null>(null);
  const panelRef = useRef<P | null>(null);

  const close = useCallback(() => setOpenState(false), []);

  const reposition = useCallback(() => {
    if (anchorRef.current && panelRef.current) {
      setPos(place(anchorRef.current, panelRef.current));
    }
  }, []);

  const setOpen = useCallback(
    (v: boolean) => {
      if (v) closeOthers(close);
      setOpenState(v);
    },
    [close],
  );

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  useEffect(() => {
    registry.add(close);
    return () => {
      registry.delete(close);
    };
  }, [close]);

  // Measure after the panel is in the DOM but before it becomes visible: the
  // stylesheet keeps `.dp`/`.dd`/`.pop` at opacity 0 until `.open` is added,
  // so a first paint at the wrong coordinates is never seen.
  useEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;

    // Capture phase, so scrolling the modal's own side panel keeps up too.
    const onScroll = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      // Anchor scrolled out of view — nothing to pin to.
      if (a.bottom < 0 || a.top > window.innerHeight) return close();
      reposition();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      close();
    };

    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick);
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
    };
  }, [open, close, reposition]);

  return { open, setOpen, toggle, close, anchorRef, panelRef, pos, reposition };
}
