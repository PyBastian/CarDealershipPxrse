import assert from "node:assert/strict";
import test from "node:test";
import { extractCaption, extractEmbedImageUrl } from "./sync-instagram.mjs";

test("extractCaption removes Instagram's wrapper", () => {
  assert.equal(extractCaption('19 likes - mkcars.cl on September 2, 2026: "OPEL VIVARO\nDisponible".'), "OPEL VIVARO\nDisponible");
});

test("extractEmbedImageUrl keeps the full image URL", () => {
  assert.equal(extractEmbedImageUrl('<img class="EmbeddedMediaImage" alt="Auto" src="https://cdn.test/photo.jpg?a=1&amp;b=2">'), "https://cdn.test/photo.jpg?a=1&b=2");
});
