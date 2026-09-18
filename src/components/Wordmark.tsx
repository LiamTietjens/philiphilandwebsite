/**
 * The `.logo` block: two mark images swapped by the stylesheet's `.hdr.solid`
 * / `.ft` rules (`on-dark` shows over the hero, `on-light` after scroll) plus
 * the wordmark text. `showBoth` renders both images so the header's own CSS
 * can pick which is visible; the footer only ever shows the dark-ground mark.
 */
interface Props {
  showBoth?: boolean;
}

export function Wordmark({ showBoth = true }: Props) {
  return (
    <>
      <img className="mark on-dark" src="/images/brand/mark-light.webp" alt="Phillip Island Host" />
      {showBoth && <img className="mark on-light" src="/images/brand/mark.webp" alt="Phillip Island Host" />}
      <span className="wm">
        <b>Phillip Island Host</b>
        <span>Property Management</span>
      </span>
    </>
  );
}
