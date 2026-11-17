import assert from "node:assert/strict";
import { isProfileValid, normalizeUsername, validateProfile } from "./profileValidation.ts";

assert.equal(isProfileValid({ displayName: "Ab", username: "wacana", bio: "" }), false);
assert.equal(validateProfile({ displayName: "A", username: "ok_name", bio: "" }).displayName, "Nama tampilan harus 2–32 karakter.");
assert.equal(validateProfile({ displayName: "Anonim", username: "Bad-Name", bio: "" }).username, "Username harus 3–20 karakter: huruf kecil, angka, atau garis bawah.");
assert.equal(normalizeUsername("  Peziarah_01 "), "peziarah_01");
assert.equal(isProfileValid({ displayName: "Peziarah", username: "peziarah_01", bio: "Tenang." }), true);
