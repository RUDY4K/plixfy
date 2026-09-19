#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const TOOL_PATH = path.join(scriptDir, "agent-sandbox-tool.py");
const DENIED_SEGMENTS = new Set([
  ".git", ".private", ".vercel", ".social", ".health", ".next", "node_modules",
]);
const TEXT_EXTENSIONS = new Set([
  ".css", ".csv", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".txt",
  ".ts", ".tsx", ".yaml", ".yml",
]);
const ALLOWED_ACTIONS = new Set(["files.list", "file.read-range", "text.search"]);

function fail(message) {
  throw new Error(`Agent sandbox denied: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeRelative(input) {
  if (typeof input !== "string" || !input.trim()) fail("path must be a non-empty string");
  const slash = input.replaceAll("\\", "/");
  if (path.posix.isAbsolute(slash) || /^[A-Za-z]:/.test(slash) || slash.includes("\0")) {
    fail("absolute paths are forbidden");
  }
  const normalized = path.posix.normalize(slash);
  if (normalized === ".." || normalized.startsWith("../")) fail("path traversal is forbidden");
  const segments = normalized.split("/");
  if (segments.some((segment) => /~\d+(?:\.|$)/i.test(segment))) {
    fail("Windows short-name aliases are forbidden");
  }
  if (segments.some((segment) => DENIED_SEGMENTS.has(segment.toLowerCase()))) {
    fail("path belongs to a denied directory");
  }
  if (segments.some((segment) => segment.toLowerCase().startsWith(".env"))) {
    fail("environment files are forbidden");
  }
  if (segments.some((segment) => /(?:^|[-_.])(key|keys|secret|secrets|credential|credentials|token|tokens)(?:[-_.]|$)/i.test(segment))) {
    fail("credential-like paths are forbidden");
  }
  return normalized;
}

function ensureNoLinks(root, relativePath) {
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) fail(`symbolic links are forbidden: ${relativePath}`);
  }
}

function redactSecrets(text) {
  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    /\b(?:sk|xai|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{16,}\b/gi,
    /\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/g,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    /\bAIza[A-Za-z0-9_-]{20,}\b/g,
    /\b(?:vca|vcr)_[A-Za-z0-9_-]{16,}\b/gi,
    /https:\/\/(?:discord(?:app)?\.com\/api\/webhooks|hooks\.slack\.com\/services)\/[^\s"']+/gi,
    /((?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?)[^\s"']{8,}/gi,
  ];
  let output = text;
  let redactions = 0;
  for (const pattern of patterns) {
    output = output.replace(pattern, (match, prefix) => {
      redactions += 1;
      return prefix ? `${prefix}[REDACTED]` : "[REDACTED]";
    });
  }
  return { text: output, redactions };
}

function canonicalContainedSource(canonicalRoot, relativePath) {
  const source = path.resolve(canonicalRoot, ...relativePath.split("/"));
  const canonicalSource = fs.realpathSync.native(source);
  if (canonicalSource !== canonicalRoot && !canonicalSource.startsWith(`${canonicalRoot}${path.sep}`)) {
    fail("canonical path escapes workspace");
  }
  const canonicalRelative = path.relative(canonicalRoot, canonicalSource).replaceAll("\\", "/");
  normalizeRelative(canonicalRelative);
  ensureNoLinks(canonicalRoot, canonicalRelative);
  return { canonicalSource, canonicalRelative };
}

function toWslPath(windowsPath, distro) {
  const resolved = path.resolve(windowsPath);
  const match = resolved.match(/^([A-Za-z]):\\(.*)$/);
  if (!match) fail(`cannot map path into WSL: ${resolved}`);
  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll("\\", "/")}`;
}

export function sandboxDoctor({ distro = "Ubuntu" } = {}) {
  const probe = spawnSync("wsl.exe", ["-d", distro, "--", "sh", "-lc", "command -v bwrap && command -v python3"], {
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    ok: probe.status === 0,
    distro,
    details: (probe.stdout || probe.stderr || "").trim(),
  };
}

export function buildSnapshot({
  root,
  readPaths,
  stateDir = null,
  maxFiles = 50,
  maxFileBytes = 256 * 1024,
  maxTotalBytes = 1024 * 1024,
} = {}) {
  if (stateDir == null) {
    stateDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-agent-")), "state");
  }
  if (!Array.isArray(readPaths) || readPaths.length === 0) fail("readPaths must not be empty");
  if (readPaths.length > maxFiles) fail(`file count exceeds ${maxFiles}`);
  const canonicalRoot = fs.realpathSync.native(root);
  const resolvedStateDir = path.resolve(stateDir);
  if (/~\d+(?:\\|\/|\.|$)/i.test(resolvedStateDir)) fail("stateDir short-name aliases are forbidden");
  const stateParent = path.dirname(resolvedStateDir);
  if (!fs.existsSync(stateParent)) fail("stateDir parent must already exist");
  const canonicalStateParent = fs.realpathSync.native(stateParent);
  const canonicalTemp = fs.realpathSync.native(os.tmpdir());
  if (!canonicalStateParent.startsWith(`${canonicalTemp}${path.sep}`)
      || canonicalStateParent === canonicalRoot
      || canonicalStateParent.startsWith(`${canonicalRoot}${path.sep}`)) {
    fail("stateDir parent must be in temporary storage and outside the protected workspace");
  }
  fs.mkdirSync(resolvedStateDir, { recursive: false });
  const canonicalStateDir = fs.realpathSync.native(resolvedStateDir);
  if (!canonicalStateDir.startsWith(`${canonicalTemp}${path.sep}`)
      || canonicalStateDir === canonicalRoot
      || canonicalStateDir.startsWith(`${canonicalRoot}${path.sep}`)) {
    fail("stateDir must be inside the OS temporary directory");
  }
  const snapshotDir = path.join(canonicalStateDir, "snapshot");
  fs.mkdirSync(snapshotDir, { recursive: false });
  const manifest = [];
  let totalBytes = 0;

  for (const rawPath of [...new Set(readPaths)]) {
    const relativePath = normalizeRelative(rawPath);
    const { canonicalSource: source, canonicalRelative } = canonicalContainedSource(canonicalRoot, relativePath);
    if (canonicalRelative !== relativePath) fail("path aliases are forbidden");
    const stat = fs.statSync(source);
    if (!stat.isFile()) fail(`not a regular file: ${relativePath}`);
    if (stat.nlink > 1) fail("hard-linked files are forbidden");
    if (!TEXT_EXTENSIONS.has(path.extname(source).toLowerCase())) fail(`unsupported file type: ${relativePath}`);
    if (stat.size > maxFileBytes) fail(`file exceeds byte limit: ${relativePath}`);
    totalBytes += stat.size;
    if (totalBytes > maxTotalBytes) fail("snapshot exceeds total byte limit");
    const raw = fs.readFileSync(source);
    if (raw.includes(0)) fail(`binary content is forbidden: ${relativePath}`);
    const redacted = redactSecrets(raw.toString("utf8"));
    if (redacted.redactions > 0) fail("suspected secret content; file is not eligible for model egress");
    const destination = path.join(snapshotDir, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, redacted.text, { encoding: "utf8", mode: 0o444 });
    manifest.push({
      path: relativePath,
      sourceSha256: sha256(raw),
      snapshotSha256: sha256(redacted.text),
      bytes: Buffer.byteLength(redacted.text),
      redactions: redacted.redactions,
    });
  }

  const manifestPath = path.join(canonicalStateDir, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify({ version: 1, files: manifest }, null, 2)}\n`);
  return { stateDir: canonicalStateDir, snapshotDir, manifestPath, manifest };
}

export function runSandboxAction(snapshot, action, args = {}, { distro = "Ubuntu", timeoutMs = 10_000, internal = false } = {}) {
  if (!ALLOWED_ACTIONS.has(action) && !(internal && action === "boundary.probe")) {
    fail(`unknown or forbidden action: ${action}`);
  }
  const snapshotLinux = toWslPath(snapshot.snapshotDir, distro);
  const toolLinux = toWslPath(TOOL_PATH, distro);
  const request = JSON.stringify({ action, args });
  const bwrapArgs = [
    "-d", distro, "--", "bwrap", "--die-with-parent", "--unshare-all", "--new-session",
    "--cap-drop", "ALL", "--ro-bind", "/usr", "/usr", "--symlink", "usr/bin", "/bin",
    "--symlink", "usr/lib", "/lib", "--symlink", "usr/lib64", "/lib64",
    "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp", "--dir", "/home",
    "--dir", "/home/agent", "--ro-bind", snapshotLinux, "/workspace",
    "--ro-bind", toolLinux, "/runner/tool.py", "--chdir", "/workspace", "--clearenv",
    "--setenv", "PATH", "/usr/bin:/bin", "--setenv", "HOME", "/home/agent",
    "--setenv", "LANG", "C.UTF-8", "--setenv", "TZ", "UTC", "--setenv", "NO_COLOR", "1",
    "python3", "/runner/tool.py",
  ];
  const startedAt = new Date().toISOString();
  const result = spawnSync("wsl.exe", bwrapArgs, {
    input: request,
    encoding: "utf8",
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 2 * 1024 * 1024,
  });
  const finishedAt = new Date().toISOString();
  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    fail("sandbox returned invalid JSON");
  }
  const receipt = {
    version: 1,
    action,
    argsSha256: sha256(JSON.stringify(args)),
    manifestSha256: sha256(fs.readFileSync(snapshot.manifestPath)),
    startedAt,
    finishedAt,
    exitCode: result.status,
    stdoutSha256: sha256(result.stdout || ""),
    stderrSha256: sha256(result.stderr || ""),
  };
  const receiptPath = path.join(snapshot.stateDir, `receipt-${Date.now()}-${action.replaceAll(".", "-")}.json`);
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  if (result.error) fail(result.error.message);
  if (result.status !== 0 || !parsed.ok) fail(parsed.error || result.stderr || "sandbox action failed");
  return { ...parsed.result, receiptPath, receipt };
}

export function runBoundaryProbe(snapshot, options) {
  return runSandboxAction(snapshot, "boundary.probe", {}, { ...options, internal: true });
}

export function verifySnapshotSources(snapshot, { root }) {
  const canonicalRoot = fs.realpathSync.native(root);
  const changes = [];
  for (const item of snapshot.manifest) {
    try {
      ensureNoLinks(canonicalRoot, item.path);
      const source = path.resolve(canonicalRoot, ...item.path.split("/"));
      const currentSha256 = sha256(fs.readFileSync(source));
      if (currentSha256 !== item.sourceSha256) changes.push({ path: item.path, reason: "content-changed" });
    } catch {
      changes.push({ path: item.path, reason: "missing-or-replaced" });
    }
  }
  return { unchanged: changes.length === 0, changes };
}

export const sandboxPolicy = Object.freeze({
  allowedActions: [...ALLOWED_ACTIONS],
  deniedSegments: [...DENIED_SEGMENTS],
  network: "none",
  writes: "none",
  shell: "none",
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] ?? "doctor";
  if (command === "doctor") {
    console.log(JSON.stringify(sandboxDoctor(), null, 2));
  } else {
    console.error("Use this module through agent-team-cli.mjs; only doctor is public here.");
    process.exitCode = 2;
  }
}
