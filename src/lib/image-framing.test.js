import { describe, expect, it } from "bun:test";
import { focalPosition, imagePosition, normalizeProductImageFit } from "./image-framing";
import { showcaseRows } from "./showcase-rows";

describe("image framing settings", () => {
  it("preserves the existing appearance when no setting is saved", () => {
    expect(normalizeProductImageFit(undefined)).toBe("current");
    expect(normalizeProductImageFit("contain")).toBe("contain");
    expect(normalizeProductImageFit("cover")).toBe("cover");
  });
  it("centers old photos and bounds focal coordinates", () => {
    expect(imagePosition(undefined, undefined)).toBe("50% 50%");
    expect(focalPosition(-10)).toBe(0);
    expect(focalPosition(110)).toBe(100);
  });
  it("preserves selected photo coordinates when saving cards", () => {
    const row = showcaseRows([{ id: "saved", title: "Klipsli", tag: "", href: "/urunler", image_url: "photo.jpg", sort_order: 1, is_active: true, image_position_x: 20, image_position_y: 80 }])[0];
    expect(row?.image_position_x).toBe(20);
    expect(row?.image_position_y).toBe(80);
  });
});