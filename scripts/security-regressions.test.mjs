import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { redactSecrets } from "./redact-secrets.mjs";

const ROOT = process.cwd();

test("BrowserStack connection failures redact raw and encoded credentials", () => {
  const username = "qa+owner@example.com";
  const accessKey = "secret/key?value";
  const input = `failed ${username} ${accessKey} ${encodeURIComponent(username)} ${encodeURIComponent(accessKey)}`;
  const output = redactSecrets(input, [username, accessKey]);

  assert.doesNotMatch(output, /qa\+owner|secret\/key|example\.com|%2Fkey/);
  assert.equal(output.match(/\[REDACTED\]/g)?.length, 4);
});

test("BrowserStack connects inside the guarded block and never logs its endpoint", () => {
  const source = readFileSync(path.join(ROOT, "scripts/browserstack-ios15-game.mjs"), "utf8");
  const tryOffset = source.indexOf("try {");
  const connectOffset = source.indexOf("browser = await webkit.connect");

  assert.ok(tryOffset >= 0 && connectOffset > tryOffset);
  assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*wsEndpoint/);
  assert.match(source, /redactSecrets\(error\.message, \[username, accessKey\]\)/);
});
