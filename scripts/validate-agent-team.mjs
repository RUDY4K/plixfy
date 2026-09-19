import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  combineChangedPaths,
  extractGovernedRunPaths,
  fingerprintCheckoutSnapshot,
  parseEngineeringEvidence,
  validateGovernedRunIndex,
  validateEngineeringRun,
  validateEngineeringStandard,
} from "./engineering-standard-validation.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const teamDir = path.join(root, "ops", "agent-team");
const errors = [];
const warnings = [];
const notices = [];
const modeArg = process.argv.find((value) => value.startsWith("--mode="));
const validationMode = modeArg?.split("=")[1] ?? "read-only";

const requiredFiles = [
  "README.md", "PROJECT.md", "ENGINEERING-STANDARD.md", "MANAGER.md", "PERMISSIONS.md", "ROUTING.md",
  "INTAKE.md", "ROLE_TEMPLATE.md", "policy.json", "STATE.md", "DECISIONS.md",
  "RUNS.md", "TASK_TEMPLATE.md", "runs/README.md",
];

const baselineRoles = new Map([
  ["traffic-analytics", "read-only"],
  ["seo-discovery", "draft-write"],
  ["gaming-news", "draft-write"],
  ["social-video", "draft-write"],
  ["game-catalog", "workspace-write"],
  ["ux-conversion", "draft-write"],
  ["engineering", "workspace-write"],
  ["monetization", "read-only"],
  ["qa-compliance", "read-only"],
]);
const allowedTiers = new Set(["read-only", "draft-write", "workspace-write"]);
const roleContractFields = [
  "role_id", "reports_to", "access_tier", "can_delegate", "contract_version",
  "secrets_access", "network_policy", "default_write_scope",
];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function gitOutput(args, cwd = root) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function gitRaw(args, cwd = root) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function gitSucceeds(args, cwd = root) {
  return spawnSync("git", args, { cwd, encoding: "utf8" }).status === 0;
}

function normalizeRelativePath(filePath) {
  return String(filePath).replaceAll("\\", "/").toLowerCase();
}

function parseStatusEntries(repoPath) {
  const fields = gitRaw(["status", "--porcelain=v1", "-z", "--untracked-files=all"], repoPath).split("\0");
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const record = fields[index];
    if (!record) continue;
    const code = record.slice(0, 2);
    const filePath = record.slice(3).replaceAll("\\", "/");
    let originalPath = null;
    if (/[RC]/.test(code)) originalPath = (fields[++index] ?? "").replaceAll("\\", "/");
    entries.push({ code, path: filePath, originalPath });
  }
  return entries;
}

function fileRecord(repoPath, relativePath) {
  const absolutePath = path.join(repoPath, ...relativePath.split("/"));
  try {
    const stat = fs.lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      return { path: relativePath, type: "link", target: fs.readlinkSync(absolutePath) };
    }
    if (!stat.isFile()) {
      return { path: relativePath, type: "other", size: stat.size, nlink: stat.nlink };
    }
    return {
      path: relativePath,
      type: "file",
      size: stat.size,
      nlink: stat.nlink,
      sha256: createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex"),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { path: relativePath, type: "missing" };
    throw error;
  }
}

function gitStatusFingerprint(checkoutPath, ownedPaths) {
  const owned = new Set(ownedPaths.map(normalizeRelativePath));
  const includesUnowned = (relativePath) => !owned.has(normalizeRelativePath(relativePath));
  const statusEntries = parseStatusEntries(checkoutPath)
    .filter((entry) => includesUnowned(entry.path)
      || (entry.originalPath !== null && includesUnowned(entry.originalPath)));
  const files = [...new Set(gitRaw([
    "ls-files", "-co", "--exclude-standard", "-z",
  ], checkoutPath).split("\0").filter(Boolean))]
    .map((filePath) => filePath.replaceAll("\\", "/"))
    .filter(includesUnowned)
    .sort((a, b) => a.localeCompare(b))
    .map((filePath) => fileRecord(checkoutPath, filePath));
  return fingerprintCheckoutSnapshot({
    head: gitOutput(["rev-parse", "HEAD"], checkoutPath),
    statusEntries,
    files,
  });
}

function commonGitDirectory(repoPath) {
  const commonDirectory = gitOutput([
    "rev-parse", "--path-format=absolute", "--git-common-dir",
  ], repoPath);
  return fs.realpathSync.native(commonDirectory).toLowerCase();
}

function frontmatter(content, label) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`Missing frontmatter: ${label}`);
    return {};
  }
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (Object.hasOwn(data, key)) errors.push(`Duplicate frontmatter key ${key}: ${label}`);
    data[key] = value;
  }
  return data;
}

function requireText(relativePath, snippets) {
  const content = read(relativePath);
  if (content === null) {
    errors.push(`Missing required file: ${relativePath}`);
    return;
  }
  for (const snippet of snippets) {
    if (!content.includes(snippet)) errors.push(`Missing policy in ${relativePath}: ${snippet}`);
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(teamDir, file))) errors.push(`Missing required file: ${file}`);
}
for (const file of [
  "scripts/agent-readonly-runner.mjs",
  "scripts/agent-sandbox-tool.py",
  "scripts/agent-team-cli.mjs",
  "scripts/agent-team-cli.test.mjs",
  "scripts/agent-write-broker.mjs",
  "scripts/agent-write-broker.test.mjs",
  "ops/agent-team/examples/read-catalog.run.json",
  "ops/agent-team/examples/launch-request.json",
  "ops/agent-team/examples/code-request.json",
]) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing launcher file: ${file}`);
}
if (!["read-only", "isolated-write"].includes(validationMode)) {
  errors.push("Unknown validation mode; publish remains fail-closed");
}

let policy = {};
try {
  policy = JSON.parse(read("ops/agent-team/policy.json") ?? "{}");
} catch (error) {
  errors.push(`Invalid policy.json: ${error.message}`);
}
if (policy.version !== 2) errors.push("policy.json version must be 2");
if (policy.managerId !== "plixfy-manager") errors.push("policy.json managerId is invalid");
if (policy.defaultExecutionMode !== "read_only") errors.push("Default execution mode must be read_only");
if (policy.noFixedAgentCap !== true) errors.push("policy.json must not impose a fixed agent cap");
if (policy.dynamicRolesRequireValidatedContract !== true) {
  errors.push("Dynamic roles must require a validated contract");
}
const standardText = read("ops/agent-team/ENGINEERING-STANDARD.md") ?? "";
errors.push(...validateEngineeringStandard({ standardText, policy }));
const runsIndex = read("ops/agent-team/RUNS.md") ?? "";
const governedIndexErrors = validateGovernedRunIndex(runsIndex);
errors.push(...governedIndexErrors);
if (governedIndexErrors.length === 0) {
  const validatorWorktree = gitOutput(["rev-parse", "--show-toplevel"]);
  const candidateRequiredFiles = [
    "AGENTS.md", "package.json",
    ...requiredFiles.map((file) => `ops/agent-team/${file}`),
    "ops/agent-team/examples/code-request.json",
    "ops/agent-team/examples/launch-request.json",
    "ops/agent-team/examples/read-catalog.run.json",
    "ops/agent-team/roles/engineering.md",
    "ops/agent-team/roles/game-catalog.md",
    "ops/agent-team/roles/gaming-news.md",
    "ops/agent-team/roles/monetization.md",
    "ops/agent-team/roles/qa-compliance.md",
    "ops/agent-team/roles/seo-discovery.md",
    "ops/agent-team/roles/social-video.md",
    "ops/agent-team/roles/traffic-analytics.md",
    "ops/agent-team/roles/ux-conversion.md",
    "scripts/agent-readonly-runner.mjs",
    "scripts/agent-sandbox-tool.py",
    "scripts/agent-team-cli.mjs",
    "scripts/agent-team-cli.test.mjs",
    "scripts/agent-write-broker.mjs",
    "scripts/agent-write-broker.test.mjs",
    "scripts/engineering-standard-validation.mjs",
    "scripts/engineering-standard.test.mjs",
    "scripts/fixtures/fake-claude-cli.mjs",
    "scripts/validate-agent-team.mjs",
  ];
  for (const runPath of extractGovernedRunPaths(runsIndex)) {
    const runText = read(`ops/agent-team/${runPath}`);
    if (runText === null) {
      errors.push(`Missing governed engineering run: ${runPath}`);
      continue;
    }
    const parsed = parseEngineeringEvidence(runText);
    const evidence = parsed.value ?? {};
    const baseCommit = evidence.baseCommit ?? "";
    const candidateCommit = evidence.review?.candidateCommit ?? "";
    const sourceCheckoutPath = evidence.sourceCheckout?.path ?? "";
    const recordedWorktreePath = evidence.worktree ?? "";
    const recordedWorktreeUsable = fs.existsSync(recordedWorktreePath)
      && gitSucceeds(["rev-parse", "--is-inside-work-tree"], recordedWorktreePath);
    const currentWorktree = recordedWorktreeUsable
      ? gitOutput(["rev-parse", "--show-toplevel"], recordedWorktreePath)
      : "";
    const reviewRepository = recordedWorktreeUsable ? currentWorktree : validatorWorktree;
    const headCommit = recordedWorktreeUsable ? gitOutput(["rev-parse", "HEAD"], currentWorktree) : "";
    const baseCommitExists = gitSucceeds(["cat-file", "-e", `${baseCommit}^{commit}`], reviewRepository);
    const candidateCommitExists = gitSucceeds(["cat-file", "-e", `${candidateCommit}^{commit}`], reviewRepository);
    const repository = {
      currentWorktree,
      headCommit,
      baseCommitExists,
      candidateCommitExists,
      candidateContainsRequiredFiles: candidateCommitExists
        && candidateRequiredFiles.every((file) => gitSucceeds(
          ["cat-file", "-e", `${candidateCommit}:${file}`], reviewRepository,
        )),
      baseIsAncestorOfCandidate: baseCommitExists && candidateCommitExists
        && gitSucceeds(["merge-base", "--is-ancestor", baseCommit, candidateCommit], reviewRepository),
      candidateIsAncestorOfHead: candidateCommitExists && recordedWorktreeUsable
        && gitSucceeds(["merge-base", "--is-ancestor", candidateCommit, headCommit], reviewRepository),
      sameCommonGitDir: recordedWorktreeUsable && fs.existsSync(sourceCheckoutPath)
        && commonGitDirectory(sourceCheckoutPath) === commonGitDirectory(currentWorktree)
        && commonGitDirectory(validatorWorktree) === commonGitDirectory(currentWorktree),
      sourceFingerprint: fs.existsSync(sourceCheckoutPath)
        ? gitStatusFingerprint(sourceCheckoutPath, evidence.ownedPaths ?? [])
        : null,
      candidateChangedPaths: baseCommitExists && candidateCommitExists
        ? gitOutput(["diff", "--name-only", `${baseCommit}..${candidateCommit}`], reviewRepository)
          .split(/\r?\n/).filter(Boolean)
        : [],
      changedSinceCandidate: combineChangedPaths(
        candidateCommitExists && recordedWorktreeUsable
          ? gitOutput(["diff", "--name-only", `${candidateCommit}..${headCommit}`], reviewRepository)
            .split(/\r?\n/).filter(Boolean)
          : [],
        recordedWorktreeUsable ? parseStatusEntries(currentWorktree) : [],
      ),
    };
    for (const error of validateEngineeringRun({
      runText,
      requiredGates: policy.requiredDeliveryGates ?? [],
      repository,
      allowedPostReviewPaths: policy.managerOnlyPaths ?? [],
    })) {
      errors.push(`${runPath}: ${error}`);
    }
  }
}
if (JSON.stringify(policy.requiredRoleFields) !== JSON.stringify(roleContractFields)) {
  errors.push("policy.json requiredRoleFields does not match the validator contract");
}
for (const requiredAction of ["publish", "deploy", "push", "delete", "paid-external-call"]) {
  if (!policy.ownerApprovalRequiredFor?.includes(requiredAction)) {
    errors.push(`Missing owner approval action in policy.json: ${requiredAction}`);
  }
}
for (const runtimeControl of ["filesystem-read-only", "secret-path-deny", "environment-scrubbed"]) {
  if (!policy.readOnlyRuntimeRequires?.includes(runtimeControl)) {
    errors.push(`Missing read-only runtime control in policy.json: ${runtimeControl}`);
  }
}
for (const runtimeControl of [
  "exact-path-ownership", "detached-temporary-worktree-per-writer",
  "structured-create-replace-only", "secret-and-link-deny", "dirty-owned-path-deny",
  "source-checkout-fingerprint",
  "patch-artifact-only", "owner-review-required",
]) {
  if (!policy.isolatedWriteRuntimeRequires?.includes(runtimeControl)) {
    errors.push(`Missing isolated-write runtime control in policy.json: ${runtimeControl}`);
  }
}
if (policy.enforcement?.writeAgentMode !== "isolated-patch-v2"
    || policy.enforcement?.sourceCheckoutWrites !== "deny"
    || policy.enforcement?.writeIntegration !== "patch-artifact-only-review-required") {
  errors.push("policy.json isolated-write enforcement is incomplete");
}
if (policy.enforcement?.readModelTransport !== "anthropic-cli-public-data-only"
    || JSON.stringify(policy.enforcement?.writeModelAdapters) !== JSON.stringify({
      codex: "openai-signed-codex-chatgpt-public-data-only",
      claude: "anthropic-cli-public-data-only",
    })) {
  errors.push("policy.json model transport allowlist does not match launcher adapters");
}

const managerContent = read("ops/agent-team/MANAGER.md");
if (managerContent) {
  const manager = frontmatter(managerContent, "MANAGER.md");
  if (manager.role_id !== "plixfy-manager") errors.push("MANAGER.md role_id must be plixfy-manager");
  if (manager.can_delegate !== "true") errors.push("The manager must be able to delegate");
  if (manager.access_tier !== "orchestrator") errors.push("The manager must use orchestrator access");
}

const rolesDir = path.join(teamDir, "roles");
const roleFiles = fs.existsSync(rolesDir)
  ? fs.readdirSync(rolesDir).filter((file) => file.endsWith(".md"))
  : [];
const seenIds = new Set();

for (const file of roleFiles) {
  const content = fs.readFileSync(path.join(rolesDir, file), "utf8");
  const role = frontmatter(content, file);
  if (!role.role_id) errors.push(`Missing role_id: ${file}`);
  if (seenIds.has(role.role_id)) errors.push(`Duplicate role_id: ${role.role_id}`);
  seenIds.add(role.role_id);
  if (role.reports_to !== "plixfy-manager") errors.push(`Invalid reports_to: ${file}`);
  if (role.can_delegate !== "false") errors.push(`Specialist may not delegate: ${file}`);
  if (!allowedTiers.has(role.access_tier)) errors.push(`Unknown access_tier: ${file}`);
  for (const field of roleContractFields) {
    if (!role[field]) errors.push(`Missing ${field}: ${file}`);
  }
  if (role.contract_version !== "1") errors.push(`Invalid contract_version: ${file}`);
  if (role.secrets_access !== "denied") errors.push(`Role may not access secrets: ${file}`);
  if (role.network_policy !== "task-allowlist") errors.push(`Invalid network_policy: ${file}`);
  if (role.default_write_scope !== "none") errors.push(`Role has unsafe default write scope: ${file}`);
  const expectedTier = baselineRoles.get(role.role_id);
  if (expectedTier && role.access_tier !== expectedTier) {
    errors.push(`Access tier mismatch for ${role.role_id}: expected ${expectedTier}`);
  }
}

for (const roleId of baselineRoles.keys()) {
  if (!seenIds.has(roleId)) errors.push(`Missing baseline role: ${roleId}`);
}

requireText("AGENTS.md", [
  "لا يوجد سقف ثابت لعدد الوكلاء", "PERMISSIONS.md", "DECISIONS.md",
  "موافقة صريحة من المستخدم", ".env*", "المدير وحده يكتب",
]);
requireText("ops/agent-team/MANAGER.md", [
  "لا يوجد حد أدنى أو أعلى ثابت", "runs/<run-id>.md", "base_commit",
  "waiting_approval", "الميزانية الديناميكية", "no_workspace_writes: true",
  "INTAKE.md", "الاستدعاءات الخارجية المدفوعة",
]);
requireText("ops/agent-team/PERMISSIONS.md", [
  "read-only", "draft-write", "workspace-write", "موافقة المالك",
  ".env*", "base_commit", "connector_ids", "policy.json",
]);
requireText("ops/agent-team/TASK_TEMPLATE.md", [
  "run_id:", "wave:", "dependencies:", "base_commit:", "forbidden_paths:",
  "approval_id:", "output_path:", "execution_mode:", "no_workspace_writes:",
  "data_access_method:", "data_scope:", "pii_policy:", "connector_ids:",
  "tool_ids:", "assumptions:", "data_definition:", "confidence_scale:",
  "owner_approved_limit:",
]);
requireText("ops/agent-team/INTAKE.md", [
  "metric", "decline_start", "timezone", "comparison_windows", "known_releases",
]);
requireText("ops/agent-team/ROLE_TEMPLATE.md", roleContractFields.map((field) => `${field}:`));
requireText("ops/agent-team/roles/seo-discovery.md", ["موافقة المالك الصريحة"]);

const packageJson = JSON.parse(read("package.json") ?? "{}");
const scripts = packageJson.scripts ?? {};
if (scripts["social:cloud"] && !scripts["social:cloud"].includes("dry")) {
  errors.push("social:cloud must be dry-run by default");
}
for (const requiredScript of [
  "agents:check", "agents:doctor", "agents:codex:doctor", "agents:code:check", "agents:auto", "agents:example",
  "test:agent-team", "test:agent-write",
]) {
  if (!scripts[requiredScript]) errors.push(`Missing package script: ${requiredScript}`);
}
const launcher = read("scripts/agent-team-cli.mjs") ?? "";
const runner = read("scripts/agent-readonly-runner.mjs") ?? "";
const writeBroker = read("scripts/agent-write-broker.mjs") ?? "";
for (const snippet of ["--tools", '""', "--safe-mode", "noWorkspaceWrites", "workspace changed"] ) {
  if (!launcher.includes(snippet)) errors.push(`Launcher is missing fail-closed control: ${snippet}`);
}
for (const snippet of [
  "--unshare-all", "--clearenv", "--ro-bind", "unknown or forbidden action",
  "Windows short-name aliases are forbidden", "hard-linked files are forbidden",
]) {
  if (!runner.includes(snippet)) errors.push(`Sandbox runner is missing hard boundary: ${snippet}`);
}
for (const snippet of [
  "code-start", "auto-code-start", "--confirm-isolated-write", "runIsolatedWriteRequest",
  "hostDisposition: \"review_required\"", "verifyWriteRunSource",
]) {
  if (!launcher.includes(snippet)) errors.push(`Launcher is missing isolated-write control: ${snippet}`);
}
for (const snippet of [
  "exact-paths-only", "detached-temporary-per-task", "patch-artifact-only",
  "main checkout", "beforeSha256", "suspected secret content",
]) {
  if (!writeBroker.includes(snippet)) errors.push(`Write broker is missing fail-closed control: ${snippet}`);
}
for (const snippet of [
  "verifySnapshotSources", "--confirm-public-model-egress", "public-repository",
  "standalone real-model run is disabled", "child.stdin.end(input)",
  "manager-context-manifest.json", "execution-consent.json", "modelCallsUsed",
]) {
  if (!launcher.includes(snippet)) errors.push(`Launcher is missing model boundary: ${snippet}`);
}
if (scripts.indexnow) notices.push("indexnow remains outside the agent launcher and is unreachable because agent shell/network are denied");
if (fs.existsSync(path.join(root, ".env.local"))) {
  notices.push(".env.local exists and is excluded from exact-path snapshots; adversarial tests verify denial");
}

if (warnings.length) {
  console.warn("Plixfy agent-team safety warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (notices.length) {
  console.log("Plixfy agent-team isolation notices:");
  for (const notice of notices) console.log(`- ${notice}`);
}

if (errors.length) {
  console.error("Plixfy agent-team validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Plixfy agent-team structural validation passed.");
  console.log("Manager: 1");
  console.log(`Validated role files: ${roleFiles.length} (extensible, not a cap)`);
  console.log("Read-only runtime isolation: enforced by WSL2/bubblewrap and a no-tools model adapter.");
  console.log("Isolated write runtime: exact create/replace patches in per-writer temporary worktrees; owner review required.");
  console.log("Merge, push, deploy, and publish: fail-closed and unsupported.");
}
