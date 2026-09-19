import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildSnapshot,
  runBoundaryProbe,
  runSandboxAction,
  sandboxDoctor,
  verifySnapshotSources,
} from "./agent-readonly-runner.mjs";
import {
  buildAutomaticRepositoryManifest,
  createLauncherStateDir,
  findCodexInstallCandidates,
  planRequest,
  preparePublicContext,
  runIsolatedWriteRequest,
  runContract,
  validateRunContract,
  validateAutomaticScope,
  validateWriteProposal,
  validateWorkerResult,
} from "./agent-team-cli.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const examplePath = path.join(root, "ops", "agent-team", "examples", "read-catalog.run.json");

test("Codex desktop discovery does not depend on PATH and stays one level below the install root", () => {
  const installRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-codex-install-test-"));
  const current = path.join(installRoot, "current");
  const nested = path.join(current, "nested");
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(installRoot, "codex.exe"), "direct fixture");
  fs.writeFileSync(path.join(current, "codex.exe"), "versioned fixture");
  fs.writeFileSync(path.join(nested, "codex.exe"), "too deep");
  fs.writeFileSync(path.join(installRoot, "other.exe"), "not codex");

  const candidates = findCodexInstallCandidates(installRoot);
  assert.deepEqual(candidates.map((candidate) => path.relative(installRoot, candidate)).sort(), [
    "codex.exe", path.join("current", "codex.exe"),
  ].sort());
});

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
}

function exampleContract() {
  const contract = JSON.parse(fs.readFileSync(examplePath, "utf8"));
  contract.workspace.baseCommit = currentCommit();
  return contract;
}

function temporarySource() {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-agent-test-source-"));
  fs.mkdirSync(path.join(source, "docs"));
  fs.writeFileSync(path.join(source, "docs", "safe.md"), "public line\n");
  fs.writeFileSync(path.join(source, "docs", "secretlike.md"), "api_key=abcdefghijklmnop\n");
  fs.writeFileSync(path.join(source, ".env.local"), "TOP_SECRET=do-not-read\n");
  fs.mkdirSync(path.join(source, ".private"));
  fs.writeFileSync(path.join(source, ".private", "token.txt"), "do-not-read\n");
  return source;
}

test("sandbox prerequisites and hard boundaries are active", () => {
  assert.equal(sandboxDoctor().ok, true);
  const source = temporarySource();
  const snapshot = buildSnapshot({ root: source, readPaths: ["docs/safe.md"] });
  const probe = runBoundaryProbe(snapshot);
  assert.equal(probe.workspaceWriteBlocked, true);
  assert.equal(probe.windowsDriveHidden, true);
  assert.equal(probe.networkBlocked, true);
  assert.deepEqual(probe.environmentKeys, ["HOME", "LANG", "NO_COLOR", "PATH", "PWD", "TZ"]);
});

test("broker denies secret paths, traversal, and unknown actions", () => {
  const source = temporarySource();
  assert.throws(() => buildSnapshot({ root: source, readPaths: [".env.local"] }), /environment files are forbidden/);
  assert.throws(() => buildSnapshot({ root: source, readPaths: [".private/token.txt"] }), /denied directory/);
  assert.throws(() => buildSnapshot({ root: source, readPaths: ["../outside.txt"] }), /path traversal/);
  const snapshot = buildSnapshot({ root: source, readPaths: ["docs/safe.md"] });
  assert.throws(() => runSandboxAction(snapshot, "shell.exec", { command: "whoami" }), /unknown or forbidden action/);
});

test("broker fails closed on suspected secrets, short names, hardlinks, and source changes", () => {
  const source = temporarySource();
  assert.throws(() => buildSnapshot({ root: source, readPaths: ["docs/secretlike.md"] }), /suspected secret content/);
  assert.throws(() => buildSnapshot({ root, readPaths: ["PRIVAT~1/fake.md"] }), /short-name aliases/);
  fs.writeFileSync(path.join(source, "docs", "plain.md"), "safe\n");
  fs.linkSync(path.join(source, "docs", "plain.md"), path.join(source, "docs", "hardlink.md"));
  assert.throws(() => buildSnapshot({ root: source, readPaths: ["docs/hardlink.md"] }), /hard-linked files/);
  fs.unlinkSync(path.join(source, "docs", "hardlink.md"));
  const snapshot = buildSnapshot({ root: source, readPaths: ["docs/plain.md"] });
  fs.writeFileSync(path.join(source, "docs", "plain.md"), "changed\n");
  assert.equal(verifySnapshotSources(snapshot, { root: source }).unchanged, false);
  assert.throws(() => buildSnapshot({
    root: source,
    readPaths: ["docs/plain.md"],
    stateDir: path.join(source, "forbidden-state"),
  }), /outside the protected workspace/);
});

test("manager context uses the same fail-closed public snapshot broker", () => {
  const source = temporarySource();
  const safeState = createLauncherStateDir("manager-context-safe");
  const prepared = preparePublicContext({
    workspaceRoot: source,
    readPaths: ["docs/safe.md"],
    stateDir: path.join(safeState, "context"),
  });
  assert.equal(prepared.context[0].text, "public line");
  assert.match(prepared.manifestSha256, /^[0-9a-f]{64}$/);
  const deniedState = createLauncherStateDir("manager-context-denied");
  assert.throws(() => preparePublicContext({
    workspaceRoot: source,
    readPaths: ["docs/secretlike.md"],
    stateDir: path.join(deniedState, "context"),
  }), /suspected secret content/);
});

test("contract compiler rejects privilege escalation and total agent caps", () => {
  const safe = exampleContract();
  assert.equal(validateRunContract(safe).tasks.length, 3);
  const network = structuredClone(safe);
  network.tasks[0].security.network = "allow";
  assert.throws(() => validateRunContract(network), /security contract was weakened/);
  const secret = structuredClone(safe);
  secret.tasks[0].roleContract.secretsAccess = "allowed";
  assert.throws(() => validateRunContract(secret), /may not access secrets/);
  const capped = structuredClone(safe);
  capped.scheduler.maxAgents = 4;
  assert.throws(() => validateRunContract(capped), /unknown field|maxAgents/);
  const writable = structuredClone(safe);
  writable.executionMode = "workspace_write";
  writable.noWorkspaceWrites = false;
  assert.throws(() => validateRunContract(writable), /fail-closed/);
});

test("mock team runs a dependency DAG without changing the workspace", async () => {
  const result = await runContract(exampleContract(), { adapter: "mock" });
  assert.equal(result.taskCount, 3);
  assert.equal(result.schedulerWaves, 2);
  assert.equal(result.executionBatches, 2);
  assert.equal(result.workspaceUnchanged, true);
  assert.equal(result.final.roleId, "qa-compliance");
  assert.equal(result.hostDisposition, "review_required");
  const receipt = JSON.parse(fs.readFileSync(path.join(result.stateDir, "final-receipt.json"), "utf8"));
  assert.equal(receipt.status, "review_required");
});

test("runtime concurrency limits batches, not the manager's total agent count", async () => {
  const contract = exampleContract();
  const roleContract = contract.tasks[0].roleContract;
  const security = contract.tasks[0].security;
  contract.runId = "RUN-DYNAMIC-SIX-001";
  contract.scheduler.maxConcurrency = 2;
  contract.budget.modelCalls = 7;
  contract.tasks = Array.from({ length: 6 }, (_, index) => ({
    taskId: `READER-${index + 1}`,
    roleId: `focused-reader-${index + 1}`,
    roleContract,
    objective: `نفذ تحققًا مستقلًا ضيقًا رقم ${index + 1}`,
    wave: 1,
    dependsOn: [],
    accessTier: "read-only",
    inputs: { pathAllowlist: ["data/catalog-summary.md"], dataScope: "public catalog summary" },
    capabilities: ["repo.read"],
    security,
    acceptanceChecks: ["أعد دليلًا واحدًا على الأقل"],
  }));
  contract.tasks.push({
    taskId: "QA-FINAL",
    roleId: "qa-compliance",
    roleContract,
    objective: "راجع جميع نتائج القراء الستة",
    wave: 2,
    dependsOn: contract.tasks.map((task) => task.taskId),
    accessTier: "read-only",
    inputs: { pathAllowlist: [], dataScope: "dependency outputs only" },
    capabilities: ["repo.read"],
    security,
    acceptanceChecks: ["غط جميع القراء"],
  });
  contract.finalReviewTaskId = "QA-FINAL";
  const result = await runContract(contract, { adapter: "mock" });
  assert.equal(result.taskCount, 7);
  assert.equal(result.executionBatches, 4);
  assert.equal(result.schedulerWaves, 2);
});

test("final QA receives every transitive ancestor result", async () => {
  const contract = exampleContract();
  const roleContract = contract.tasks[0].roleContract;
  const security = contract.tasks[0].security;
  contract.runId = "RUN-TRANSITIVE-QA-001";
  contract.budget.modelCalls = 4;
  contract.tasks[2] = {
    taskId: "AGGREGATE",
    roleId: "evidence-aggregator",
    roleContract,
    objective: "اجمع نتيجتي القارئين دون إسقاط الأدلة",
    wave: 2,
    dependsOn: ["CATALOG-MD", "CATALOG-JSON"],
    accessTier: "read-only",
    inputs: { pathAllowlist: [], dataScope: "dependency outputs only" },
    capabilities: ["repo.read"],
    security,
    acceptanceChecks: ["غط النتيجتين"],
  };
  contract.tasks.push({
    taskId: "QA-FINAL",
    roleId: "qa-compliance",
    roleContract,
    objective: "راجع السلسلة كاملة بما فيها الأدلة الأصلية",
    wave: 3,
    dependsOn: ["AGGREGATE"],
    accessTier: "read-only",
    inputs: { pathAllowlist: [], dataScope: "all transitive dependency outputs" },
    capabilities: ["repo.read"],
    security,
    acceptanceChecks: ["شاهد جميع الأسلاف"],
  });
  contract.finalReviewTaskId = "QA-FINAL";
  const result = await runContract(contract, { adapter: "mock" });
  const sources = result.final.result.evidence.map((item) => item.source);
  assert.deepEqual(new Set(sources), new Set([
    "dependency:AGGREGATE", "dependency:CATALOG-MD", "dependency:CATALOG-JSON",
  ]));
});

test("QA cannot accept missing checks or invented evidence", () => {
  const task = exampleContract().tasks[0];
  const base = {
    summary: "checked",
    evidence: [{
      id: "E1",
      source: "data/catalog-summary.md",
      sourceSha256: "abc",
      locator: "lines:1-1",
      quote: "catalog line",
      finding: "found",
    }],
    assumptions: [],
    risks: [],
    confidence: "high",
    verdict: "accepted",
    checkResults: [{
      check: task.acceptanceChecks[0], status: "passed", evidenceIds: ["E1"],
    }],
  };
  const catalog = new Map([["data/catalog-summary.md", {
    type: "document", sha256: "abc", text: "catalog line\nsecond line",
  }]]);
  const validated = validateWorkerResult(base, task, catalog);
  assert.equal(validated.modelVerdict, "accepted");
  assert.equal(validated.provenanceStatus, "verified");
  assert.equal(validated.hostDisposition, "review_required");
  assert.equal("verdict" in validated, false);
  assert.throws(() => validateWorkerResult({ ...base, verdict: "needs_fix" }, task,
    catalog), /did not pass/);
  const invented = structuredClone(base);
  invented.evidence[0].source = "https://invented.example";
  assert.throws(() => validateWorkerResult(invented, task, catalog), /unavailable evidence source/);
  const alteredQuote = structuredClone(base);
  alteredQuote.evidence[0].quote = "invented quote";
  assert.throws(() => validateWorkerResult(alteredQuote, task, catalog), /does not match the immutable snapshot/);
  const semanticallyUnverified = structuredClone(base);
  semanticallyUnverified.evidence[0].finding = "An unrelated claim that the host cannot verify semantically";
  const advisory = validateWorkerResult(semanticallyUnverified, task, catalog);
  assert.equal(advisory.hostDisposition, "review_required");
  assert.equal("verdict" in advisory, false);
});

test("declared waves are enforced even without a dependency edge", async () => {
  const contract = exampleContract();
  contract.runId = "RUN-WAVE-ORDER-001";
  contract.tasks[1].wave = 9;
  contract.tasks[2].wave = 10;
  const result = await runContract(contract, { adapter: "mock" });
  assert.equal(result.schedulerWaves, 3);
  assert.equal(result.executionBatches, 3);
});

test("unsafe manager JSON paths fail generically without echoing content", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-json-loader-test-"));
  const unsafe = path.join(temp, ".env.local");
  fs.writeFileSync(unsafe, "TOP_SECRET=fixture-value\n");
  const result = spawnSync(process.execPath, [path.join(scriptDir, "agent-team-cli.mjs"), "validate", "--contract", unsafe], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, /TOP_SECRET|fixture-value/);
  assert.match(result.stderr, /manager input must be a \.json file/);
});

test("fake real-model adapter proves no-tools flags, clean env, temp cwd, and stdin transport", async () => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-request-test-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    objective: `Large public planning input ${"x".repeat(64 * 1024)}`,
    allowedInputs: ["data/catalog-summary.md", "src/data/playgama-catalog-meta.json"],
    dataClassification: "public-repository",
    model: "haiku",
    budget: { wallMinutes: 10, modelCalls: 4, paidExternalCalls: 0 },
    maxConcurrency: 2,
    constraints: ["read only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "start", "--request", requestPath,
    "--adapter", "claude", "--confirm-public-model-egress",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, PLIXFY_CLAUDE_CLI: fixture },
  });
  assert.equal(execution.status, 0, execution.stderr);
  const started = JSON.parse(execution.stdout);
  const stateDir = started.output.stateDir;
  const logs = fs.readdirSync(stateDir).filter((file) => file.startsWith("fake-claude-log-"));
  assert.ok(logs.length >= 4);
  for (const file of logs) {
      const log = JSON.parse(fs.readFileSync(path.join(stateDir, file), "utf8"));
      const toolsIndex = log.args.indexOf("--tools");
      assert.ok(toolsIndex >= 0);
      assert.equal(log.args[toolsIndex + 1], "");
      assert.ok(log.args.includes("--safe-mode"));
      assert.ok(log.args.includes("--strict-mcp-config"));
      assert.equal(log.promptInArgv, false);
      assert.ok(log.stdinLength > 0);
      assert.equal(log.cwd, stateDir);
      assert.equal(log.envKeys.some((key) => /TOKEN|SECRET|KEY|CODEX|PLIXFY/i.test(key)), false);
  }
  assert.ok(logs.map((file) => JSON.parse(fs.readFileSync(path.join(stateDir, file), "utf8")).stdinLength)
    .some((length) => length > 64 * 1024));
  const executionConsent = JSON.parse(fs.readFileSync(path.join(stateDir, "execution-consent.json"), "utf8"));
  const planningConsent = JSON.parse(fs.readFileSync(path.join(stateDir, "planning-consent.json"), "utf8"));
  const runConsent = JSON.parse(fs.readFileSync(path.join(stateDir, "model-consent.json"), "utf8"));
  const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.ok(planningConsent.consumedAt);
  assert.ok(runConsent.consumedAt);
  assert.notEqual(planningConsent.nonce, runConsent.nonce);
  assert.equal(runConsent.parentConsentHash, hash(planningConsent));
  assert.equal(executionConsent.parentConsentHash, hash(runConsent));
  assert.equal(executionConsent.model, "haiku");
  assert.match(executionConsent.scopeHash, /^[0-9a-f]{64}$/);
});

test("guarded code-start creates reviewed patch artifacts without changing the source checkout", (t) => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-code-request-test-")), "request.json");
  const ownedPath = "data/catalog-summary.md";
  const sourceBefore = fs.readFileSync(path.join(root, ownedPath));
  const statusBefore = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "Apply one isolated fixture edit and produce a reviewable patch",
    executionMode: "isolated_write",
    allowedInputs: [ownedPath],
    writeScope: { create: [], replace: [ownedPath] },
    dataClassification: "public-repository",
    model: "haiku",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: "auto",
    constraints: ["patch artifact only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "claude", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLIXFY_CLAUDE_CLI: fixture },
  });
  assert.equal(execution.status, 0, execution.stderr);
  const output = JSON.parse(execution.stdout);
  t.after(() => {
    for (const artifact of output.artifacts) {
      execFileSync("git", ["worktree", "remove", "--force", artifact.worktreePath], { cwd: root });
    }
    fs.rmSync(output.brokerStateDir, { recursive: true, force: true });
    fs.rmSync(output.sourceGuardStateDir, { recursive: true, force: true });
    fs.rmSync(output.stateDir, { recursive: true, force: true });
  });
  assert.equal(output.writerCount, 1);
  assert.equal(output.modelCallsUsed, 3);
  assert.equal(output.hostDisposition, "review_required");
  assert.equal(output.integrationPolicy, "patch-artifact-only");
  assert.equal(output.sourceCheckoutChanged, false);
  assert.equal(output.artifacts[0].status, "patch-ready");
  assert.ok(fs.existsSync(output.artifacts[0].patchPath));
  assert.match(fs.readFileSync(output.artifacts[0].patchPath, "utf8"), /Fixture isolated edit/);
  const receipt = JSON.parse(fs.readFileSync(path.join(output.stateDir, "final-receipt.json"), "utf8"));
  assert.equal(receipt.status, "review_required");
  assert.equal(receipt.qaModelVerdict, "accepted");
  const logs = fs.readdirSync(output.stateDir).filter((file) => file.startsWith("fake-claude-log-"));
  const modelLogs = logs.map((file) => JSON.parse(fs.readFileSync(path.join(output.stateDir, file), "utf8")));
  assert.ok(modelLogs.some((log) => log.writeReviewHasConstraints
    && log.writeReviewHasWriteScope && log.writeReviewHasBaseCommit));
  assert.equal(fs.readFileSync(path.join(root, ownedPath)).equals(sourceBefore), true);
  const statusAfter = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  assert.equal(statusAfter, statusBefore);
});

test("automatic repository manifest excludes agent infrastructure and marks only safe clean writes", () => {
  const manifest = buildAutomaticRepositoryManifest();
  const byPath = new Map(manifest.map((entry) => [entry.path, entry]));
  assert.equal(manifest.some((entry) => entry.path.startsWith("ops/agent-team/")), false);
  assert.equal(manifest.some((entry) => entry.path.startsWith(".github/")), false);
  assert.equal(manifest.some((entry) => entry.path === "scripts/agent-team-cli.mjs"), false);
  assert.equal(byPath.get("package.json")?.writable, false);
  assert.equal(byPath.get("data/catalog-summary.md")?.writable, true);
  const scope = validateAutomaticScope({
    allowedInputs: ["data/catalog-summary.md"],
    writeScope: { create: [], replace: ["data/catalog-summary.md"] },
    rationale: "One narrow safe file is enough for this fixture.",
  }, manifest);
  assert.deepEqual(scope.writeScope.replace, ["data/catalog-summary.md"]);
  assert.throws(() => validateAutomaticScope({
    allowedInputs: ["package.json"],
    writeScope: { create: [], replace: ["package.json"] },
    rationale: "Unsafe dependency mutation must be rejected.",
  }, manifest), /unsafe or unreadable replacement/);
});

test("automatic Codex flow needs only an objective and audits scope manager, writer manager, writer, and QA", (t) => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const ownedPath = "data/catalog-summary.md";
  const sourceBefore = fs.readFileSync(path.join(root, ownedPath));
  const statusBefore = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "auto-code-start",
    "--objective", "Improve the public catalog summary automatically",
    "--adapter", "codex-fixture", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLIXFY_CODEX_CLI: fixture },
  });
  assert.equal(execution.status, 0, execution.stderr);
  const output = JSON.parse(execution.stdout);
  t.after(() => {
    for (const artifact of output.artifacts) {
      execFileSync("git", ["worktree", "remove", "--force", artifact.worktreePath], { cwd: root });
    }
    fs.rmSync(output.brokerStateDir, { recursive: true, force: true });
    fs.rmSync(output.sourceGuardStateDir, { recursive: true, force: true });
    fs.rmSync(output.stateDir, { recursive: true, force: true });
  });
  assert.equal(output.hostDisposition, "review_required");
  assert.equal(output.modelCallsUsed, 4);
  assert.deepEqual(output.automaticRequest.allowedInputs, [ownedPath]);
  const receipt = JSON.parse(fs.readFileSync(path.join(output.stateDir, "final-receipt.json"), "utf8"));
  assert.deepEqual(receipt.modelTransportAudit.calls.map((call) => call.callId).sort(), [
    "manager", "qa-QA-FINAL", "scope-discovery", "writer-WRITER-1",
  ]);
  assert.equal(receipt.modelTransportAudit.integrity, "verified");
  const logs = fs.readdirSync(output.stateDir).filter((file) => file.startsWith("fake-codex-log-"));
  assert.ok(logs.map((file) => JSON.parse(fs.readFileSync(path.join(output.stateDir, file), "utf8")))
    .some((log) => log.writeReviewHasVerifiedInputs));
  assert.equal(fs.readFileSync(path.join(root, ownedPath)).equals(sourceBefore), true);
  const statusAfter = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  assert.equal(statusAfter, statusBefore);
});

test("Codex-shaped fixture transport is isolated and never attributed to OpenAI", (t) => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-codex-request-test-")), "request.json");
  const ownedPath = "data/catalog-summary.md";
  const sourceBefore = fs.readFileSync(path.join(root, ownedPath));
  const statusBefore = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "Apply one isolated Codex fixture edit and produce a reviewable patch",
    executionMode: "isolated_write",
    allowedInputs: [ownedPath],
    writeScope: { create: [], replace: [ownedPath] },
    dataClassification: "public-repository",
    model: "gpt-5.6-luna",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: "auto",
    constraints: ["patch artifact only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "codex-fixture", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLIXFY_CODEX_CLI: fixture },
  });
  assert.equal(execution.status, 0, execution.stderr);
  const output = JSON.parse(execution.stdout);
  t.after(() => {
    for (const artifact of output.artifacts) {
      execFileSync("git", ["worktree", "remove", "--force", artifact.worktreePath], { cwd: root });
    }
    fs.rmSync(output.brokerStateDir, { recursive: true, force: true });
    fs.rmSync(output.sourceGuardStateDir, { recursive: true, force: true });
    fs.rmSync(output.stateDir, { recursive: true, force: true });
  });
  assert.equal(output.hostDisposition, "review_required");
  assert.equal(output.modelCallsUsed, 3);
  const receipt = JSON.parse(fs.readFileSync(path.join(output.stateDir, "final-receipt.json"), "utf8"));
  assert.equal(receipt.adapter, "codex-fixture");
  assert.equal(receipt.provider, "test-fixture");
  assert.equal(receipt.modelTransportAudit.provenance.signer, "test-fixture");
  assert.deepEqual(receipt.modelTransportAudit.calls.map((call) => call.callId).sort(), [
    "manager", "qa-QA-FINAL", "writer-WRITER-1",
  ]);
  assert.ok(receipt.modelTransportAudit.calls.every((call) => /^[0-9a-f]{64}$/.test(call.schemaSha256)));
  assert.ok(receipt.modelTransportAudit.calls.every((call) => /^[0-9a-f]{64}$/.test(call.streamSha256)));
  assert.ok(receipt.modelTransportAudit.calls.every((call) => call.validation === "accepted"));
  assert.equal(receipt.modelTransportAudit.integrity, "verified");
  const logs = fs.readdirSync(output.stateDir).filter((file) => file.startsWith("fake-codex-log-"));
  assert.equal(logs.length, 3);
  for (const file of logs) {
    const log = JSON.parse(fs.readFileSync(path.join(output.stateDir, file), "utf8"));
    assert.ok(log.args.includes("--ignore-user-config"));
    assert.ok(log.args.includes("--ignore-rules"));
    assert.ok(log.args.includes("--ephemeral"));
    assert.ok(log.args.includes("--output-schema"));
    assert.ok(log.args.includes("shell_tool"));
    assert.ok(log.args.includes("shell_snapshot"));
    assert.ok(log.args.includes("shell_snapshot"));
    assert.ok(log.args.includes("multi_agent"));
    assert.ok(log.args.includes("browser_use"));
    assert.equal(log.promptInArgv, false);
    assert.equal(log.cwd, output.stateDir);
    assert.equal(log.envKeys.some((key) => /TOKEN|SECRET|KEY|CODEX|PLIXFY/i.test(key)), false);
  }
  assert.equal(fs.readFileSync(path.join(root, ownedPath)).equals(sourceBefore), true);
  const statusAfter = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
    cwd: root, encoding: "utf8",
  });
  assert.equal(statusAfter, statusBefore);
});

test("Codex-shaped fixture fails closed if its event stream exposes any tool", () => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-codex-tool-event-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "CODEX_TOOL_EVENT_FIXTURE must be rejected before isolated execution",
    executionMode: "isolated_write",
    allowedInputs: ["data/catalog-summary.md"],
    writeScope: { create: [], replace: ["data/catalog-summary.md"] },
    dataClassification: "public-repository",
    model: "gpt-5.6-luna",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: 1,
    constraints: ["no tools"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "codex-fixture", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PLIXFY_CODEX_CLI: fixture },
  });
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /disabled tool event/);
  const stateMatch = execution.stderr.match(/^State: (.+)$/m);
  assert.ok(stateMatch, execution.stderr);
  const receipt = JSON.parse(fs.readFileSync(path.join(stateMatch[1].trim(), "final-receipt.json"), "utf8"));
  assert.equal(receipt.stage, "write-planning-model-call");
  assert.equal(receipt.sourceUnchanged, true);
  assert.deepEqual(receipt.completedTaskIds, []);
  assert.equal(receipt.modelTransportAudit.calls[0].validation, "rejected");
  assert.equal(receipt.modelTransportAudit.integrity, "verified");
});

function runCodexFixtureFailure(marker) {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-codex-adversarial-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: `${marker} must fail closed`,
    executionMode: "isolated_write",
    allowedInputs: ["data/catalog-summary.md"],
    writeScope: { create: [], replace: ["data/catalog-summary.md"] },
    dataClassification: "public-repository",
    model: "gpt-5.6-luna",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: 1,
    constraints: ["fail closed"],
  }));
  return spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "codex-fixture", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PLIXFY_CODEX_CLI: fixture },
  });
}

test("Codex-shaped fixture rejects unknown top-level runtime events", () => {
  const execution = runCodexFixtureFailure("CODEX_UNKNOWN_EVENT_FIXTURE");
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /unknown event type/);
});

test("Codex-shaped fixture audits a failed transport even when stdout is empty", () => {
  const execution = runCodexFixtureFailure("FAIL_FIXTURE");
  assert.equal(execution.status, 1);
  const stateMatch = execution.stderr.match(/^State: (.+)$/m);
  assert.ok(stateMatch, execution.stderr);
  const receipt = JSON.parse(fs.readFileSync(path.join(stateMatch[1].trim(), "final-receipt.json"), "utf8"));
  assert.equal(receipt.modelCallsUsed, 1);
  assert.equal(receipt.modelTransportAuditValid, true);
  assert.equal(receipt.modelTransportAudit.integrity, "verified");
  assert.equal(receipt.modelTransportAudit.calls[0].outcome, "failed");
  assert.equal(receipt.modelTransportAudit.calls[0].validation, "not-run");
});

test("write manager plans reject duplicate acceptance checks before writer calls", () => {
  const execution = runCodexFixtureFailure("DUPLICATE_ACCEPTANCE_FIXTURE");
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /acceptanceChecks must be nonblank and unique/);
  const stateMatch = execution.stderr.match(/^State: (.+)$/m);
  assert.ok(stateMatch, execution.stderr);
  const receipt = JSON.parse(fs.readFileSync(path.join(stateMatch[1].trim(), "final-receipt.json"), "utf8"));
  assert.equal(receipt.stage, "write-plan-validation");
  assert.equal(receipt.modelCallsUsed, 1);
});

test("Codex fixture adapter is unavailable outside the Node test runner", () => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-codex-production-guard-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "Reject fixture transport outside tests",
    executionMode: "isolated_write",
    allowedInputs: ["data/catalog-summary.md"],
    writeScope: { create: [], replace: ["data/catalog-summary.md"] },
    dataClassification: "public-repository",
    model: "gpt-5.6-luna",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: 1,
    constraints: ["production guard"],
  }));
  const env = { ...process.env, PLIXFY_CODEX_CLI: fixture };
  delete env.NODE_TEST_CONTEXT;
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "codex-fixture", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], { cwd: root, encoding: "utf8", env });
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /available only under the Node test runner/);
});

test("write proposals must cover exact ownership and acceptance checks", () => {
  const task = {
    taskId: "WRITER-STRICT",
    ownership: { create: ["src/new.txt"], replace: ["src/existing.txt"] },
    acceptanceChecks: ["check-one", "check-two"],
  };
  const complete = {
    summary: "complete",
    operations: [
      { type: "create", path: "src/new.txt", content: "new\n", beforeSha256: null },
      { type: "replace", path: "src/existing.txt", content: "changed\n", beforeSha256: "0".repeat(64) },
    ],
    assumptions: [], risks: [], modelVerdict: "accepted",
    checkResults: ["check-one", "check-two"],
  };
  assert.equal(validateWriteProposal(complete, task).operations.length, 2);
  assert.throws(() => validateWriteProposal({ ...complete, operations: complete.operations.slice(0, 1) }, task),
    /exactly one operation/);
  assert.throws(() => validateWriteProposal({ ...complete, checkResults: ["check-one"] }, task),
    /acceptance check/);
});

test("write QA failures are represented in the final failure receipt", (t) => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-code-qa-failure-")), "request.json");
  const ownedPath = "data/catalog-summary.md";
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "FAIL_QA_FIXTURE after producing one isolated patch",
    executionMode: "isolated_write",
    allowedInputs: [ownedPath],
    writeScope: { create: [], replace: [ownedPath] },
    dataClassification: "public-repository",
    model: "haiku",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: 1,
    constraints: ["patch artifact only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "claude", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PLIXFY_CLAUDE_CLI: fixture },
  });
  assert.equal(execution.status, 1);
  const stateMatch = execution.stderr.match(/^State: (.+)$/m);
  assert.ok(stateMatch, execution.stderr);
  const stateDir = stateMatch[1].trim();
  const receipt = JSON.parse(fs.readFileSync(path.join(stateDir, "final-receipt.json"), "utf8"));
  t.after(() => {
    const artifactDir = path.join(receipt.brokerStateDir, "artifacts");
    for (const file of fs.readdirSync(artifactDir).filter((name) => name.endsWith(".receipt.json"))) {
      const artifact = JSON.parse(fs.readFileSync(path.join(artifactDir, file), "utf8"));
      execFileSync("git", ["worktree", "remove", "--force", artifact.worktreePath], { cwd: root });
    }
    fs.rmSync(receipt.brokerStateDir, { recursive: true, force: true });
    fs.rmSync(receipt.sourceGuardStateDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  assert.deepEqual(receipt.completedTaskIds, ["WRITER-1"]);
  assert.deepEqual(receipt.failedTaskIds, ["QA-FINAL"]);
  assert.deepEqual(receipt.pendingTaskIds, []);
  assert.equal(receipt.artifactHashes.length, 1);
  assert.equal(receipt.sourceUnchanged, true);
});

test("write requests reject secret-like objective text before model or worktree execution", () => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-code-secret-request-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    schemaVersion: "plixfy.write-request/v2",
    objective: "Document password=abcdefgh without exposing it",
    executionMode: "isolated_write",
    allowedInputs: ["README.md"],
    writeScope: { create: [], replace: ["README.md"] },
    dataClassification: "public-repository",
    model: "haiku",
    budget: {
      wallMinutes: 10, modelCalls: 3, paidExternalCalls: 0,
      maxChangedFiles: 1, maxPatchBytes: 262144,
    },
    maxConcurrency: 1,
    constraints: ["patch only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "code-start", "--request", requestPath,
    "--adapter", "claude", "--confirm-public-model-egress", "--confirm-isolated-write",
  ], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PLIXFY_CLAUDE_CLI: fixture },
  });
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /secret-like material/);
  assert.doesNotMatch(execution.stderr, /abcdefgh/);
});

test("failed concurrent batch preserves sibling results and writes a final failed receipt", async () => {
    const contract = exampleContract();
    contract.runId = "RUN-FAILURE-RECEIPT-001";
    contract.tasks[1].objective = "FAIL_MOCK";
    const stateDir = createLauncherStateDir("failure");
    await assert.rejects(runContract(contract, { adapter: "mock", stateDir }), /mock task failure/);
    const receipt = JSON.parse(fs.readFileSync(path.join(stateDir, "final-receipt.json"), "utf8"));
    assert.equal(receipt.status, "failed");
    assert.equal(receipt.reason, "task-failed");
    assert.equal(receipt.model, "haiku");
    assert.equal(receipt.modelCallsUsed, 0);
    assert.ok(receipt.completedTaskIds.includes("CATALOG-MD"));
    assert.ok(receipt.failedTaskIds.includes("CATALOG-JSON"));
});

test("preflight failures write a final failed receipt", async () => {
  const contract = exampleContract();
  contract.workspace.baseCommit = "0".repeat(40);
  const stateDir = createLauncherStateDir("preflight-failure");
  await assert.rejects(runContract(contract, {
    adapter: "mock", stateDir, priorModelCallsUsed: 1,
  }), /baseCommit no longer matches HEAD/);
  const receipt = JSON.parse(fs.readFileSync(path.join(stateDir, "final-receipt.json"), "utf8"));
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.stage, "workspace-preflight");
  assert.equal(receipt.modelCallsUsed, 1);
  assert.deepEqual(new Set(receipt.pendingTaskIds), new Set(contract.tasks.map((task) => task.taskId)));
});

test("planning model failures write a final failed receipt", () => {
  const fixture = path.join(scriptDir, "fixtures", "fake-claude-cli.mjs");
  const requestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-plan-failure-")), "request.json");
  fs.writeFileSync(requestPath, JSON.stringify({
    objective: "FAIL_FIXTURE while planning a public read-only review",
    allowedInputs: ["data/catalog-summary.md"],
    dataClassification: "public-repository",
    model: "haiku",
    budget: { wallMinutes: 10, modelCalls: 2, paidExternalCalls: 0 },
    maxConcurrency: "auto",
    constraints: ["read only"],
  }));
  const execution = spawnSync(process.execPath, [
    path.join(scriptDir, "agent-team-cli.mjs"), "start", "--request", requestPath,
    "--adapter", "claude", "--confirm-public-model-egress",
  ], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PLIXFY_CLAUDE_CLI: fixture },
  });
  assert.equal(execution.status, 1);
  const stateMatch = execution.stderr.match(/^State: (.+)$/m);
  assert.ok(stateMatch, execution.stderr);
  const receipt = JSON.parse(fs.readFileSync(path.join(stateMatch[1].trim(), "final-receipt.json"), "utf8"));
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.stage, "planning-model-call");
  assert.equal(receipt.modelCallsUsed, 1);
});

test("imported APIs cannot authorize real model planning or execution", async () => {
  const contract = exampleContract();
  await assert.rejects(runContract(contract, { adapter: "claude" }), /guarded CLI start flow/);
  const request = JSON.parse(fs.readFileSync(path.join(root, "ops", "agent-team", "examples", "launch-request.json")));
  await assert.rejects(planRequest(request, { adapter: "claude" }), /guarded CLI start flow/);
  const writeRequest = JSON.parse(fs.readFileSync(path.join(root, "ops", "agent-team", "examples", "code-request.json")));
  await assert.rejects(runIsolatedWriteRequest(writeRequest, { adapter: "claude" }), /guarded CLI code-start flow/);
  await assert.rejects(runIsolatedWriteRequest({ ...writeRequest, model: "gpt-5.6-luna" }, { adapter: "codex" }),
    /guarded CLI code-start flow/);
  await assert.rejects(runIsolatedWriteRequest(writeRequest, { adapter: "mock" }), /guarded CLI code-start flow/);
  const arbitraryState = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-team-unissued-"));
  await assert.rejects(runContract(contract, { adapter: "mock", stateDir: arbitraryState }), /not issued/);
});
