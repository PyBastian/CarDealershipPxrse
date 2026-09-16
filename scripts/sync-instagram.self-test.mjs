import assert from "node:assert/strict";
import test from "node:test";
import { extractCaption } from "./sync-instagram.mjs";

test("extractCaption removes Instagram's wrapper", () => {
  assert.equal(extractCaption('19 likes - mkcars.cl on September 2, 2026: "OPEL VIVARO\nDisponible".'), "OPEL VIVARO\nDisponible");
});
