import type { ShowcaseCategory } from "./homepage";
import { focalPosition } from "./image-framing";

/** Send an explicit ID for every row, even when the target has no ID default. */
export function showcaseRows(cards: ShowcaseCategory[], createId = () => crypto.randomUUID()): ShowcaseCategory[] {
  return cards.map((card, index) => ({
    ...card,
    id: card.id.startsWith("new-") ? createId() : card.id,
    sort_order: index + 1,
    image_position_x: focalPosition(card.image_position_x),
    image_position_y: focalPosition(card.image_position_y),
  }));
}