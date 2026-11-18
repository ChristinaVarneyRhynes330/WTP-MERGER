import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { sha256Hex, verifyOriginalBytes } from "../src/lib/integrity.ts";

const sample = new TextEncoder().encode("fictional test record; not actual case data");
const buffer = sample.buffer;

test("SHA-256 reproducibly fingerprints original bytes", async () => {
  const expected = await webcrypto.subtle.digest("SHA-256", buffer);
  const manual = Buffer.from(expected).toString("hex");
  assert.equal(await sha256Hex(buffer), manual);
  assert.equal(await verifyOriginalBytes(buffer, sample.byteLength, manual), manual);
});

test("rejects changed bytes, size mismatch, and missing hash", async () => {
  const hash = await sha256Hex(buffer);
  await assert.rejects(verifyOriginalBytes(new TextEncoder().encode("tampered").buffer, null, hash), /checksum/);
  await assert.rejects(verifyOriginalBytes(buffer, 1, hash), /size/);
  await assert.rejects(verifyOriginalBytes(buffer, null, null), /missing/);
});
