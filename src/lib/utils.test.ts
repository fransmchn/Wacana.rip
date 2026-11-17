import assert from "node:assert/strict";
import { formatCompactRupiah } from "./utils.ts";

assert.equal(formatCompactRupiah(12_300_000_000), "Rp 12,3 M");
assert.equal(formatCompactRupiah(450_000_000), "Rp 450 jt");
assert.equal(formatCompactRupiah(12_000), "Rp 12 rb");
