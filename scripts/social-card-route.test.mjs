import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  loadSocialCardImageDataUrl,
  prepareSocialCardImage,
} from "../src/lib/socialCardImage.ts";

const ROOT = process.cwd();
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const NEWS_CARD = "/api/social-card?kind=news&id=melty-blood-twi-lumina-release-date&v=9";
const NEWS_ARTWORK = path.join(ROOT, "public", "news", "melty-blood-twi-lumina-release-date.webp");
const AGENT_RULES = path.join(ROOT, "AGENTS.md");

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitUntilReady(baseUrl, child, output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next dev exited early\n${output.join("")}`);
    try {
      const response = await fetch(`${baseUrl}/robots.txt`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Next dev did not become ready\n${output.join("")}`);
}

test("the approved WebP news artwork renders as a PNG social card", { timeout: 60_000 }, async () => {
  const agentRules = await readFile(AGENT_RULES);
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = [];
  const child = spawn(process.execPath, [NEXT_BIN, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: ROOT,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    await waitUntilReady(baseUrl, child, output);
    const response = await fetch(`${baseUrl}${NEWS_CARD}`, { signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200, output.join(""));
    assert.match(response.headers.get("content-type") || "", /^image\/png\b/);
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 1200);
  } finally {
    child.kill();
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]);
    await writeFile(AGENT_RULES, agentRules);
  }
});

test("WebP artwork is converted to bounded PNG data", async () => {
  const prepared = await prepareSocialCardImage(await readFile(NEWS_ARTWORK), "image/webp");
  assert.ok(prepared);
  assert.equal(prepared.type, "image/png");
  const metadata = await sharp(prepared.bytes).metadata();
  assert.ok(metadata.width <= 1200);
  assert.ok(metadata.height <= 1200);
});

test("relative first-party news artwork loads without network access", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("network access is disabled"); };
  try {
    const image = await loadSocialCardImageDataUrl("/news/melty-blood-twi-lumina-release-date.webp");
    assert.match(image || "", /^data:image\/png;base64,/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
