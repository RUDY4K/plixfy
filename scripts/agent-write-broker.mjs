import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DENIED_SEGMENTS = new Set([
  ".git", ".github", ".gitlab", ".circleci", ".claude", ".codex", ".agents",
  ".cursor", ".vscode", ".private", ".vercel", ".social", ".health", ".next",
  "node_modules",
]);
const TEXT_EXTENSIONS = new Set([
  ".css", ".csv", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".txt",
  ".ts", ".tsx", ".yaml", ".yml",
]);
const WINDOWS_DEVICES = /^(?:con|prn|aux|nul|clock\$|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const DENIED_EXACT_PATHS = new Set([
  "agents.md", "package.json", "package-lock.json", "npm-shrinkwrap.json",
  ".npmrc", ".yarnrc", ".yarnrc.yml", "pnpm-lock.yaml", "yarn.lock",
]);
const DENIED_BASENAMES = new Set([
  "agents.md", "claude.md", "codex.md", "gemini.md", "skill.md", ".mcp.json",
  "copilot-instructions.md",
  "package.json", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock",
  ".npmrc", ".yarnrc", ".yarnrc.yml",
  "vercel.json", "netlify.toml", "wrangler.toml", "wrangler.json", "firebase.json",
  "render.yaml", "render.yml", "docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml",
]);
const DENIED_PREFIXES = [
  ".github/workflows/",
  "ops/agent-team/",
  "scripts/agent-readonly-",
  "scripts/agent-sandbox-",
  "scripts/agent-team-",
  "scripts/agent-write-",
  "scripts/validate-agent-team",
];
const TASK_ID = /^[A-Za-z0-9-]{2,80}$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;
const DEFAULT_MAX_FILE_BYTES = 512 * 1024;
const DEFAULT_MAX_PATCH_BYTES = 2 * 1024 * 1024;
const runState = new WeakMap();
const sessionState = new WeakMap();

function fail(message) {
  throw new Error(`Agent write broker denied: ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableSha256(value) {
  return sha256(JSON.stringify(value));
}

function assertPlainKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${label} contains an unknown field`);
  }
}

function normalizeExactPath(input) {
  if (typeof input !== "string" || !input.trim()) fail("owned paths must be non-empty strings");
  if (input.includes("\0") || /[\x00-\x1f]/.test(input)) fail("control characters are forbidden in paths");
  const slash = input.replaceAll("\\", "/");
  if (path.posix.isAbsolute(slash) || /^[A-Za-z]:/.test(slash)) fail("absolute paths are forbidden");
  if (slash.includes(":")) fail("NTFS alternate data streams and colon paths are forbidden");
  const normalized = path.posix.normalize(slash);
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    fail("path traversal is forbidden");
  }
  const segments = normalized.split("/");
  for (const segment of segments) {
    const lower = segment.toLowerCase();
    if (!segment || segment.endsWith(".") || segment.endsWith(" ")) fail("ambiguous Windows paths are forbidden");
    if (/~\d+(?:\.|$)/i.test(segment)) fail("Windows 8.3 aliases are forbidden");
    if (WINDOWS_DEVICES.test(segment)) fail("Windows device paths are forbidden");
    if (DENIED_SEGMENTS.has(lower)) fail("path belongs to a denied directory");
    if (lower.startsWith(".env")) fail("environment files are forbidden");
    if (/(?:^|[-_.])(key|keys|secret|secrets|credential|credentials|token|tokens)(?:[-_.]|$)/i.test(segment)) {
      fail("credential-like paths are forbidden");
    }
  }
  if (!TEXT_EXTENSIONS.has(path.posix.extname(normalized).toLowerCase())) {
    fail("only allowlisted text file types may be written");
  }
  const policyPath = normalized.normalize("NFC").toLowerCase();
  const policyBasename = path.posix.basename(policyPath);
  if (DENIED_EXACT_PATHS.has(policyPath) || DENIED_BASENAMES.has(policyBasename)
      || DENIED_PREFIXES.some((prefix) => policyPath.startsWith(prefix))) {
    fail("agent policy, supply-chain, CI, and self-modification paths are forbidden");
  }
  return normalized;
}

function ownershipKey(relativePath) {
  return relativePath.normalize("NFC").toLocaleLowerCase("en-US");
}

function pathsConflict(left, right) {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function normalizeTask(task, index) {
  const label = `tasks[${index}]`;
  assertPlainKeys(task, ["taskId", "ownership"], label);
  if (!TASK_ID.test(task.taskId ?? "")) fail(`${label} has an invalid taskId`);
  assertPlainKeys(task.ownership, ["create", "replace"], `${label}.ownership`);
  if (!Array.isArray(task.ownership.create) || !Array.isArray(task.ownership.replace)) {
    fail(`${label} ownership.create and ownership.replace must be arrays`);
  }
  const create = [...new Set(task.ownership.create.map(normalizeExactPath))];
  const replace = [...new Set(task.ownership.replace.map(normalizeExactPath))];
  if (create.length + replace.length === 0) fail(`${label} must own at least one exact path`);
  const local = [];
  for (const relativePath of [...create, ...replace]) {
    const key = ownershipKey(relativePath);
    if (local.some((entry) => pathsConflict(entry, key))) fail(`${label} contains overlapping owned paths`);
    local.push(key);
  }
  return Object.freeze({
    taskId: task.taskId,
    ownership: Object.freeze({ create: Object.freeze(create), replace: Object.freeze(replace) }),
  });
}

export function validateWritePlan(plan) {
  assertPlainKeys(plan, ["runId", "tasks", "limits"], "plan");
  if (!/^RUN-[A-Za-z0-9-]{3,80}$/.test(plan.runId ?? "")) fail("plan has an invalid runId");
  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) fail("plan.tasks must not be empty");
  const limits = plan.limits ?? {};
  assertPlainKeys(limits, ["maxFileBytes", "maxPatchBytes"], "plan.limits");
  const maxFileBytes = limits.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  const maxPatchBytes = limits.maxPatchBytes ?? DEFAULT_MAX_PATCH_BYTES;
  if (!Number.isInteger(maxFileBytes) || maxFileBytes < 1) fail("maxFileBytes must be a positive integer");
  if (!Number.isInteger(maxPatchBytes) || maxPatchBytes < 1) fail("maxPatchBytes must be a positive integer");

  const tasks = plan.tasks.map(normalizeTask);
  const ids = new Set();
  const ownership = [];
  for (const task of tasks) {
    if (ids.has(task.taskId)) fail(`duplicate taskId: ${task.taskId}`);
    ids.add(task.taskId);
    for (const relativePath of [...task.ownership.create, ...task.ownership.replace]) {
      const key = ownershipKey(relativePath);
      const conflict = ownership.find((entry) => pathsConflict(entry.key, key));
      if (conflict) fail(`ownership overlap between ${conflict.taskId} and ${task.taskId}`);
      ownership.push({ taskId: task.taskId, key });
    }
  }
  return Object.freeze({
    runId: plan.runId,
    tasks: Object.freeze(tasks),
    limits: Object.freeze({ maxFileBytes, maxPatchBytes }),
  });
}

function isolatedGitEnvironment() {
  const allowed = new Set([
    "comspec", "lang", "lc_all", "localappdata", "path", "pathext",
    "systemroot", "temp", "tmp", "windir",
  ]);
  const environment = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (allowed.has(key.toLowerCase()) && value !== undefined) environment[key] = value;
  }
  return {
    ...environment,
    GIT_ATTR_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_OPTIONAL_LOCKS: "0",
    GIT_PAGER: "cat",
    GIT_TERMINAL_PROMPT: "0",
  };
}

function git(cwd, args, { accepted = [0] } = {}) {
  const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
  const result = spawnSync("git", [
    "-c", `core.hooksPath=${nullDevice}`,
    "-c", `core.attributesFile=${nullDevice}`,
    "-c", "core.fsmonitor=false",
    "-c", "core.pager=cat",
    "-c", "core.autocrlf=false",
    ...args,
  ], {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: isolatedGitEnvironment(),
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!accepted.includes(result.status)) fail("a fixed git operation failed");
  return result.stdout;
}

function canonicalRepository(repoPath) {
  const canonical = fs.realpathSync.native(repoPath);
  const top = git(canonical, ["rev-parse", "--show-toplevel"]).trim();
  const canonicalTop = fs.realpathSync.native(top);
  if (canonicalTop.toLowerCase() !== canonical.toLowerCase()) fail("repoPath must be the repository top level");
  return canonical;
}

function resolveBaseCommit(repoPath, baseCommit) {
  if (!COMMIT_SHA.test(baseCommit ?? "")) fail("baseCommit must be a full lowercase commit SHA");
  const resolved = git(repoPath, ["rev-parse", "--verify", "--end-of-options", `${baseCommit}^{commit}`]).trim();
  if (resolved !== baseCommit) fail("baseCommit did not resolve exactly");
  return resolved;
}

function assertSafeRepositoryCheckout(repoPath, baseCommit) {
  const unsafeLocalConfig = git(repoPath, [
    "config", "--local", "--no-includes", "--get-regexp",
    "^(filter\\.|diff\\..*\\.textconv$|include\\.|includeif\\.)",
  ], { accepted: [0, 1] });
  if (unsafeLocalConfig.trim()) {
    fail("repository-local Git filters, textconv drivers, and config includes are unsupported in isolated write v2.0");
  }
  const rawInfoAttributesPath = git(repoPath, ["rev-parse", "--git-path", "info/attributes"]).trim();
  const infoAttributesPath = path.isAbsolute(rawInfoAttributesPath)
    ? rawInfoAttributesPath
    : path.resolve(repoPath, rawInfoAttributesPath);
  if (fs.existsSync(infoAttributesPath) && fs.readFileSync(infoAttributesPath, "utf8").trim()) {
    fail("repository info attributes are unsupported in isolated write v2.0");
  }
  const staged = git(repoPath, ["ls-files", "--stage", "-z"]);
  if (staged.split("\0").some((entry) => entry.startsWith("160000 "))) {
    fail("Git submodules are unsupported in isolated write v2.0");
  }
  const treePaths = git(repoPath, ["ls-tree", "-r", "--name-only", "-z", baseCommit])
    .split("\0").filter(Boolean);
  for (const relativePath of treePaths.filter((item) => path.posix.basename(item).toLowerCase() === ".gitattributes")) {
    const attributes = git(repoPath, ["show", `${baseCommit}:${relativePath}`]);
    if (/(?:^|\s)filter\s*=/im.test(attributes)) {
      fail("checkout filters in .gitattributes are unsupported in isolated write v2.0");
    }
  }
}

function safeTemporaryStateDir(stateDir) {
  const tempRoot = fs.realpathSync.native(os.tmpdir());
  const chosen = stateDir
    ? path.resolve(stateDir)
    : fs.mkdtempSync(path.join(tempRoot, "plixfy-write-"));
  fs.mkdirSync(chosen, { recursive: true });
  const canonical = fs.realpathSync.native(chosen);
  if (!canonical.startsWith(`${tempRoot}${path.sep}`) || !path.basename(canonical).startsWith("plixfy-write-")) {
    fail("stateDir must be a plixfy-write directory under the OS temporary directory");
  }
  return canonical;
}

function listGitVisibleFiles(repoPath) {
  const output = git(repoPath, ["ls-files", "-co", "--exclude-standard", "-z"]);
  return [...new Set(output.split("\0").filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function fileRecord(root, relativePath) {
  const absolute = path.join(root, ...relativePath.replaceAll("\\", "/").split("/"));
  try {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return { path: relativePath, type: "link", target: fs.readlinkSync(absolute) };
    if (!stat.isFile()) return { path: relativePath, type: "other", size: stat.size, nlink: stat.nlink };
    return { path: relativePath, type: "file", size: stat.size, nlink: stat.nlink, sha256: sha256(fs.readFileSync(absolute)) };
  } catch (error) {
    if (error.code === "ENOENT") return { path: relativePath, type: "missing" };
    throw error;
  }
}

function checkoutFingerprint(repoPath) {
  const head = git(repoPath, ["rev-parse", "HEAD"]).trim();
  const status = git(repoPath, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const files = listGitVisibleFiles(repoPath).map((relativePath) => fileRecord(repoPath, relativePath));
  return stableSha256({ head, status, files });
}

function walkWorktree(root) {
  const records = [];
  function visit(directory, prefix = "") {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (relativePath === ".git") continue;
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        records.push({ path: relativePath, type: "link", target: fs.readlinkSync(absolute) });
      } else if (stat.isDirectory()) {
        records.push({ path: relativePath, type: "dir" });
        visit(absolute, relativePath);
      } else if (stat.isFile()) {
        records.push({ path: relativePath, type: "file", size: stat.size, nlink: stat.nlink, sha256: sha256(fs.readFileSync(absolute)) });
      } else {
        records.push({ path: relativePath, type: "other" });
      }
    }
  }
  visit(root);
  return stableSha256(records);
}

function assertNoLinks(root, relativePath, { allowMissingLeaf = false } = {}) {
  let current = root;
  const segments = relativePath.split("/");
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT" && allowMissingLeaf) return;
      throw error;
    }
    if (stat.isSymbolicLink()) fail("symbolic links and junctions are forbidden");
    if (stat.isFile() && stat.nlink > 1) fail("hard-linked files are forbidden");
    if (index < segments.length - 1 && !stat.isDirectory()) fail("a parent path is not a directory");
  }
}

function assertContained(root, relativePath) {
  const target = path.resolve(root, ...relativePath.split("/"));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) fail("resolved path escapes worktree");
  return target;
}

function containsSecret(text) {
  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\b(?:sk|xai|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{16,}\b/i,
    /\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    /\bAIza[A-Za-z0-9_-]{20,}\b/,
    /https:\/\/(?:discord(?:app)?\.com\/api\/webhooks|hooks\.slack\.com\/services)\/[^\s"']+/i,
    /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?[^\s"']{8,}/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  fs.renameSync(temporary, file);
}

function operationOwnership(task, type, relativePath) {
  const list = type === "create" ? task.ownership.create : task.ownership.replace;
  if (!list.some((owned) => ownershipKey(owned) === ownershipKey(relativePath))) {
    fail(`${type} path is outside the task's exact ownership`);
  }
}

function parseChangedPaths(worktreePath) {
  const entries = parseStatusEntries(worktreePath);
  const changes = [];
  for (const entry of entries) {
    if (entry.originalPath) fail("renames and copies are unsupported in v2.0");
    changes.push({ code: entry.code, path: entry.path });
  }
  return changes;
}

function parseStatusEntries(repoPath) {
  const fields = git(repoPath, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]).split("\0");
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const record = fields[index];
    if (!record) continue;
    const code = record.slice(0, 2);
    const relativePath = record.slice(3).replaceAll("\\", "/");
    let originalPath = null;
    if (/[RC]/.test(code)) originalPath = (fields[++index] ?? "").replaceAll("\\", "/");
    entries.push({ code, path: relativePath, originalPath });
  }
  return entries;
}

function assertOwnedTargetsClean(repoPath, plan) {
  const owned = new Set(plan.tasks.flatMap((task) => [
    ...task.ownership.create,
    ...task.ownership.replace,
  ]).map(ownershipKey));
  for (const entry of parseStatusEntries(repoPath)) {
    const statusPaths = [entry.path, entry.originalPath].filter(Boolean).map((item) => {
      try {
        return ownershipKey(normalizeExactPath(item));
      } catch {
        return null;
      }
    }).filter(Boolean);
    if (statusPaths.some((statusPath) => owned.has(statusPath))) {
      fail("an owned target is dirty in the main checkout");
    }
  }
}

export function preflightWriteScope({ repoPath, baseCommit, ownership } = {}) {
  const validatedPlan = validateWritePlan({
    runId: "RUN-PREFLIGHT-SCOPE",
    tasks: [{ taskId: "PREFLIGHT", ownership }],
    limits: {},
  });
  const canonicalRepo = canonicalRepository(repoPath);
  const resolvedCommit = resolveBaseCommit(canonicalRepo, baseCommit);
  assertSafeRepositoryCheckout(canonicalRepo, resolvedCommit);
  const currentHead = git(canonicalRepo, ["rev-parse", "HEAD"]).trim();
  if (currentHead !== resolvedCommit) fail("main checkout HEAD must equal baseCommit");
  assertOwnedTargetsClean(canonicalRepo, validatedPlan);
  return Object.freeze({ ok: true, baseCommit: resolvedCommit });
}

export function createWriteRun({ repoPath, baseCommit, plan, stateDir } = {}) {
  const validatedPlan = validateWritePlan(plan);
  const canonicalRepo = canonicalRepository(repoPath);
  const resolvedCommit = resolveBaseCommit(canonicalRepo, baseCommit);
  assertSafeRepositoryCheckout(canonicalRepo, resolvedCommit);
  const currentHead = git(canonicalRepo, ["rev-parse", "HEAD"]).trim();
  if (currentHead !== resolvedCommit) fail("main checkout HEAD must equal baseCommit");
  assertOwnedTargetsClean(canonicalRepo, validatedPlan);
  const runDir = safeTemporaryStateDir(stateDir);
  const initialMainFingerprint = checkoutFingerprint(canonicalRepo);
  const handle = Object.freeze({
    runId: validatedPlan.runId,
    stateDir: runDir,
    repoPath: canonicalRepo,
    baseCommit: resolvedCommit,
    taskIds: Object.freeze(validatedPlan.tasks.map((task) => task.taskId)),
  });
  runState.set(handle, {
    plan: validatedPlan,
    repoPath: canonicalRepo,
    baseCommit: resolvedCommit,
    stateDir: runDir,
    initialMainFingerprint,
    sessions: new Map(),
  });
  writeJsonAtomic(path.join(runDir, "write-plan.json"), validatedPlan);
  return handle;
}

export function verifyWriteRunSource(runHandle) {
  const run = runState.get(runHandle);
  if (!run) fail("unknown write run handle");
  return Object.freeze({
    unchanged: checkoutFingerprint(run.repoPath) === run.initialMainFingerprint,
  });
}

export function createTaskWorktree(runHandle, taskId) {
  const run = runState.get(runHandle);
  if (!run) fail("unknown write run handle");
  const task = run.plan.tasks.find((candidate) => candidate.taskId === taskId);
  if (!task) fail("taskId does not exist in the validated write plan");
  if (run.sessions.has(taskId)) fail("task already has a worktree");
  if (checkoutFingerprint(run.repoPath) !== run.initialMainFingerprint) {
    fail("main checkout changed after the write run was created");
  }
  const worktreesDir = path.join(run.stateDir, "worktrees");
  fs.mkdirSync(worktreesDir, { recursive: true });
  const worktreePath = path.join(worktreesDir, taskId);
  if (fs.existsSync(worktreePath)) fail("task worktree path already exists");
  git(run.repoPath, ["worktree", "add", "--detach", worktreePath, run.baseCommit]);
  const head = git(worktreePath, ["rev-parse", "HEAD"]).trim();
  if (head !== run.baseCommit) fail("detached worktree was created from the wrong commit");
  const status = git(worktreePath, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (status !== "") fail("new task worktree is unexpectedly dirty");

  for (const relativePath of task.ownership.replace) {
    const target = assertContained(worktreePath, relativePath);
    assertNoLinks(worktreePath, relativePath);
    const stat = fs.statSync(target);
    if (!stat.isFile() || stat.nlink > 1) fail("replace ownership must target one regular, non-hard-linked file");
  }
  for (const relativePath of task.ownership.create) {
    assertContained(worktreePath, relativePath);
    assertNoLinks(worktreePath, relativePath, { allowMissingLeaf: true });
    if (fs.existsSync(path.join(worktreePath, ...relativePath.split("/")))) {
      fail("create ownership must target an absent path at baseCommit");
    }
  }

  const handle = Object.freeze({ sessionId: randomUUID(), taskId, worktreePath });
  const state = {
    run,
    task,
    worktreePath,
    expectedFingerprint: walkWorktree(worktreePath),
    operations: [],
    finalized: false,
  };
  sessionState.set(handle, state);
  run.sessions.set(taskId, handle);
  writeJsonAtomic(path.join(run.stateDir, "sessions", `${taskId}.json`), {
    taskId,
    worktreePath,
    baseCommit: run.baseCommit,
    ownership: task.ownership,
    createdAt: new Date().toISOString(),
  });
  return handle;
}

export function applyStructuredWrite(sessionHandle, operation) {
  const session = sessionState.get(sessionHandle);
  if (!session) fail("unknown task session handle");
  if (session.finalized) fail("task session is already finalized");
  if (walkWorktree(session.worktreePath) !== session.expectedFingerprint) {
    fail("task worktree is dirty outside the broker's expected state");
  }
  assertPlainKeys(operation, ["type", "path", "content", "beforeSha256"], "operation");
  if (operation.type !== "create" && operation.type !== "replace") fail("only create and replace operations are supported");
  const relativePath = normalizeExactPath(operation.path);
  operationOwnership(session.task, operation.type, relativePath);
  if (typeof operation.content !== "string") fail("operation.content must be text");
  const bytes = Buffer.byteLength(operation.content);
  if (bytes > session.run.plan.limits.maxFileBytes) fail("operation exceeds maxFileBytes");
  if (operation.content.includes("\0")) fail("binary content is forbidden");
  if (containsSecret(operation.content)) fail("suspected secret content is forbidden");

  const target = assertContained(session.worktreePath, relativePath);
  let beforeSha256 = null;
  let mode = 0o644;
  if (operation.type === "create") {
    if (Object.hasOwn(operation, "beforeSha256") && operation.beforeSha256 != null) {
      fail("create must not provide beforeSha256");
    }
    assertNoLinks(session.worktreePath, relativePath, { allowMissingLeaf: true });
    if (fs.existsSync(target)) fail("create target already exists");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    assertNoLinks(session.worktreePath, path.posix.dirname(relativePath), { allowMissingLeaf: false });
  } else {
    if (!/^[0-9a-f]{64}$/.test(operation.beforeSha256 ?? "")) fail("replace requires a full beforeSha256");
    assertNoLinks(session.worktreePath, relativePath);
    const stat = fs.statSync(target);
    if (!stat.isFile() || stat.nlink > 1) fail("replace target is not a safe regular file");
    beforeSha256 = sha256(fs.readFileSync(target));
    if (beforeSha256 !== operation.beforeSha256) fail("replace beforeSha256 does not match the current worktree file");
    mode = stat.mode;
  }

  const afterSha256 = sha256(operation.content);
  if (beforeSha256 === afterSha256) fail("no-op replacements are forbidden");
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.broker-tmp`);
  try {
    fs.writeFileSync(temporary, operation.content, { encoding: "utf8", flag: "wx", mode });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
  assertNoLinks(session.worktreePath, relativePath);
  const writtenSha256 = sha256(fs.readFileSync(target));
  if (writtenSha256 !== afterSha256) fail("written content hash mismatch");
  const receipt = Object.freeze({
    sequence: session.operations.length + 1,
    type: operation.type,
    path: relativePath,
    beforeSha256,
    afterSha256,
    bytes,
    at: new Date().toISOString(),
  });
  session.operations.push(receipt);
  session.expectedFingerprint = walkWorktree(session.worktreePath);
  writeJsonAtomic(path.join(session.run.stateDir, "operations", session.task.taskId,
    `${String(receipt.sequence).padStart(4, "0")}.json`), receipt);
  return receipt;
}

function patchForSession(session) {
  const replacePaths = session.task.ownership.replace
    .filter((relativePath) => session.operations.some((operation) => operation.path === relativePath));
  const createPaths = session.task.ownership.create
    .filter((relativePath) => session.operations.some((operation) => operation.path === relativePath));
  const chunks = [];
  if (replacePaths.length) {
    chunks.push(git(session.worktreePath, [
      "diff", "--no-ext-diff", "--no-textconv", "--binary", "--full-index", "--no-color",
      session.run.baseCommit, "--", ...replacePaths,
    ]));
  }
  for (const relativePath of createPaths) {
    chunks.push(git(session.worktreePath, [
      "diff", "--no-ext-diff", "--no-textconv", "--no-index", "--binary", "--no-color", "--", "/dev/null", relativePath,
    ], { accepted: [0, 1] }));
  }
  return chunks.filter(Boolean).join("\n");
}

export function finalizeTaskWorktree(sessionHandle) {
  const session = sessionState.get(sessionHandle);
  if (!session) fail("unknown task session handle");
  if (session.finalized) fail("task session is already finalized");
  if (walkWorktree(session.worktreePath) !== session.expectedFingerprint) {
    fail("task worktree is dirty outside the broker's expected state");
  }
  if (session.operations.length === 0) fail("task produced no structured writes");
  const changes = parseChangedPaths(session.worktreePath);
  const operationMap = new Map(session.operations.map((operation) => [ownershipKey(operation.path), operation]));
  for (const change of changes) {
    const relativePath = normalizeExactPath(change.path);
    const operation = operationMap.get(ownershipKey(relativePath));
    if (!operation) fail("git detected a changed path outside broker operations");
    if (operation.type === "create" && change.code !== "??") fail("created files must remain untracked patch artifacts");
    if (operation.type === "replace" && /[ADRC]/.test(change.code)) fail("replace may not add, delete, rename, or copy");
  }
  if (changes.length !== operationMap.size) fail("a broker operation is missing from the final git diff");
  if (checkoutFingerprint(session.run.repoPath) !== session.run.initialMainFingerprint) {
    fail("main checkout changed during isolated task execution");
  }
  const patch = patchForSession(session);
  if (!patch.trim()) fail("generated patch is empty");
  const patchBytes = Buffer.byteLength(patch);
  if (patchBytes > session.run.plan.limits.maxPatchBytes) fail("generated patch exceeds maxPatchBytes");
  const artifactDir = path.join(session.run.stateDir, "artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });
  const patchPath = path.join(artifactDir, `${session.task.taskId}.patch`);
  fs.writeFileSync(patchPath, patch, { encoding: "utf8", flag: "wx" });
  git(session.worktreePath, ["apply", "--check", "--reverse", patchPath]);
  const receipt = {
    version: 1,
    status: "patch-ready",
    runId: session.run.plan.runId,
    taskId: session.task.taskId,
    baseCommit: session.run.baseCommit,
    worktreePath: session.worktreePath,
    ownership: session.task.ownership,
    operations: session.operations,
    changedPaths: changes,
    patchPath,
    patchBytes,
    patchSha256: sha256(patch),
    worktreeFingerprint: session.expectedFingerprint,
    mainCheckoutFingerprint: session.run.initialMainFingerprint,
    generatedAt: new Date().toISOString(),
    integrationPolicy: "patch-artifact-only; no commit, merge, cherry-pick, push, or deploy",
  };
  const receiptPath = path.join(artifactDir, `${session.task.taskId}.receipt.json`);
  writeJsonAtomic(receiptPath, receipt);
  session.patch = patch;
  session.artifact = Object.freeze({ ...receipt, receiptPath });
  session.finalized = true;
  return session.artifact;
}

export function readVerifiedPatchArtifact(sessionHandle) {
  const session = sessionState.get(sessionHandle);
  if (!session || !session.finalized || !session.artifact || typeof session.patch !== "string") {
    fail("task session has no finalized patch artifact");
  }
  const stat = fs.lstatSync(session.artifact.patchPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1) fail("patch artifact is not a safe regular file");
  const diskPatch = fs.readFileSync(session.artifact.patchPath, "utf8");
  if (sha256(diskPatch) !== session.artifact.patchSha256 || diskPatch !== session.patch) {
    fail("patch artifact changed after finalization");
  }
  return Object.freeze({
    taskId: session.task.taskId,
    patch: session.patch,
    patchSha256: session.artifact.patchSha256,
  });
}

export const writeBrokerPolicy = Object.freeze({
  operations: Object.freeze(["create", "replace"]),
  ownership: "exact-paths-only",
  worktree: "detached-temporary-per-task",
  modelTools: "none",
  shell: "none",
  network: "none",
  integration: "patch-artifact-only",
});
