// Pure amenity → marketing-copy derivation, shared by the live listings hook
// and the offline sample data. No network code lives here.

// Amenity vocabulary → the display tags the cards and filter chips use.
// Keyed off what this portfolio actually reports (surveyed across every live
// listing); order is priority, since a card shows at most three.
const TAG_RULES: { label: string; match: string[] }[] = [
  { label: "Ocean views", match: ["ocean front", "beach front", "waterfront", "sea view", "ocean view", "water view", "beach view", "near ocean"] },
  { label: "Hot tub", match: ["hot tub", "jacuzzi"] },
  { label: "Pool", match: ["swimming pool", "outdoor pool", "communal pool", "indoor pool", "pool"] },
  { label: "Beach access", match: ["beach access", "beach"] },
  { label: "Pet friendly", match: ["pets allowed", "pets live on this property", "dogs allowed"] },
  { label: "Fireplace", match: ["indoor fireplace", "fireplace"] },
  { label: "Fire pit", match: ["fire pit"] },
  { label: "Garden", match: ["garden or backyard", "garden view"] },
  { label: "Single level", match: ["single level home"] },
  { label: "Garage", match: ["garage"] },
];

/** Derived display tags. Never Guesty's own `tags` field — that is ops-internal. */
export function tagsFor(amenities: string[]): string[] {
  const have = new Set(amenities.map((a) => a.toLowerCase().trim()));
  return TAG_RULES.filter((r) => r.match.some((m) => have.has(m))).map((r) => r.label);
}

/**
 * A marketing badge, only when something real distinguishes the listing.
 * Returns undefined rather than inventing copy — the card omits the badge.
 */
export function badgeFor(tags: string[], guests: number): string | undefined {
  if (tags.includes("Ocean views")) return "Ocean views";
  if (tags.includes("Hot tub")) return "Hot tub";
  if (tags.includes("Pool")) return "Pool";
  if (tags.includes("Beach access")) return "Walk to beach";
  if (tags.includes("Pet friendly")) return "Pet friendly";
  if (guests >= 10) return "Sleeps " + guests;
  return undefined;
}
