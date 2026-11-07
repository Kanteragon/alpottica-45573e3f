import { describe, expect, it } from "bun:test";
import { showcaseRows } from "./showcase-rows";

const card = { id: "new-1", title: "Klipsli", tag: "", image_url: "", href: "/urunler?tag=klipsli", is_active: true, sort_order: 9 };

describe("showcase card saving", () => {
  it("sends a UUID for a new card without relying on a database default", () => {
    const id = "0ad44179-28e3-44f3-b902-00b445e49a71";
    expect(showcaseRows([card], () => id)[0]?.id).toBe(id);
  });
  it("keeps the saved ID on subsequent saves instead of creating duplicates", () => {
    const saved = showcaseRows([card]);
    expect(showcaseRows(saved, () => { throw new Error("Must not regenerate ID"); })[0]?.id).toBe(saved[0]?.id);
  });
  it("preserves photo and product associations while assigning display order", () => {
    const saved = showcaseRows([{ ...card, product_id: "product-1", image_url: "photo.jpg" }]);
    expect(saved[0]).toMatchObject({ product_id: "product-1", image_url: "photo.jpg", sort_order: 1 });
  });
});