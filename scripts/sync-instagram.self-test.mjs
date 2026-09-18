import assert from "node:assert/strict";
import test from "node:test";
import { extractEmbedCaption, extractEmbedImageUrl, extractPostShortcodes } from "./sync-instagram.mjs";

test("extractPostShortcodes keeps profile posts and skips carousel slides", () => {
  const html = '\\"shortcode_media\\":{\\"shortcode\\":\\"POST1\\",\\"edge_sidecar_to_children\\":{\\"shortcode\\":\\"SLIDE1\\"}}\\"shortcode_media\\":{\\"shortcode\\":\\"POST2\\"}';
  assert.deepEqual(extractPostShortcodes(html), ["POST1", "POST2"]);
});

test("extractEmbedImageUrl keeps the full image URL", () => {
  assert.equal(extractEmbedImageUrl('<img class="EmbeddedMediaImage" alt="Auto" src="https://cdn.test/photo.jpg?a=1&amp;b=2">'), "https://cdn.test/photo.jpg?a=1&b=2");
});

test("extractEmbedCaption decodes Instagram's escaped caption", () => {
  const html = String.raw`\"edge_media_to_caption\":{\"edges\":[{\"node\":{\"text\":\"\\ud83d\\ude90 OPEL\\nDisponible\"}}]}`;
  assert.equal(extractEmbedCaption(html), "🚐 OPEL\nDisponible");
});
