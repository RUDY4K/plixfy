import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyStructuredWrite,
  createTaskWorktree,
  createWriteRun,
  finalizeTaskWorktree,
  readVerifiedPatchArtifact,
  validateWritePlan,
  verifyWriteRunSource,
  writeBrokerPolicy,
} from "./agent-write-broker.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(cwd, args, { accepted = [0] } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_PAGER: "cat" },
  });
  if (result.error) throw result.error;
  if (!accepted.includes(result.status)) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout;
}

function removeTemporaryTree(target) {
  const canonicalTemp = fs.realpathSync.native(os.tmpdir());
  const resolved = path.resolve(target);
  assert.ok(resolved.startsWith(`${canonicalTemp}${path.sep}`), `refusing to remove non-temp path: ${resolved}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}

function makeRepository(t) {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), "plixfy-write-test-"));
  const repo = path.join(container, "repo");
  fs.mkdirSync(repo);
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.name", "Agent Broker Test"]);
  git(repo, ["config", "user.email", "agent-broker@example.invalid"]);
  fs.mkdirSync(path.join(repo, "src"));
  fs.writeFileSync(path.join(repo, "src", "alpha.txt"), "alpha base\n", "utf8");
  fs.writeFileSync(path.join(repo, "src", "beta.txt"), "beta base\n", "utf8");
  fs.writeFileSync(path.join(repo, "notes.txt"), "clean note\n", "utf8");
  fs.writeFileSync(path.join(repo, ".gitignore"), ".env*\n.private/\n", "utf8");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "base"]);
  const baseCommit = git(repo, ["rev-parse", "HEAD"]).trim();
  t.after(() => removeTemporaryTree(container));
  return { container, repo, baseCommit };
}

function plan(tasks, limits = {}) {
  return {
    runId: `RUN-WRITE-${Math.random().toString(36).slice(2, 10)}`,
    tasks,
    limits,
  };
}

function task(taskId, { create = [], replace = [] } = {}) {
  return { taskId, ownership: { create, replace } };
}

test("plan validation rejects ownership overlap and dangerous Windows or secret paths", () => {
  assert.throws(() => validateWritePlan(plan([
    task("ONE", { replace: ["src/Alpha.txt"] }),
    task("TWO", { replace: ["SRC/alpha.txt"] }),
  ])), /ownership overlap/);
  assert.throws(() => validateWritePlan(plan([
    task("ONE", { create: ["src/new.txt"] }),
    task("TWO", { create: ["src/new.txt/child.txt"] }),
  ])), /ownership overlap/);
  for (const dangerous of [
    "../escape.txt", "C:/escape.txt", ".env.local", ".private/note.txt", ".git/config.txt",
    "src/file.txt:stream", "SRC~1/file.txt", "src/CON.txt", "src/com1.log", "src/trailing. ",
    "src/access-token.txt", "node_modules/pkg/readme.md",
    "AGENTS.md", "package.json", "package-lock.json", ".github/workflows/deploy.yml",
    "ops/agent-team/policy.json", "scripts/agent-team-cli.mjs", "src/AGENTS.md",
    "packages/app/CLAUDE.md", "packages/app/package.json", "infra/vercel.json",
    ".claude/settings.json", ".mcp.json", ".cursor/rules/policy.md", ".vscode/tasks.json",
    "skills/evil/SKILL.md", "src/CODEX.md",
  ]) {
    assert.throws(() => validateWritePlan(plan([task("BAD", { create: [dangerous] })])), /denied|forbidden/,
      `expected path rejection for ${dangerous}`);
  }
  assert.throws(() => validateWritePlan(plan([task("BAD", { create: ["src/image.png"] })])), /text file types/);
});

test("each task gets a detached worktree and produces a verifiable patch without changing a dirty main checkout", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  fs.writeFileSync(path.join(repo, "notes.txt"), "owner dirty note\n", "utf8");
  const mainStatusBefore = git(repo, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const mainContentBefore = fs.readFileSync(path.join(repo, "notes.txt"), "utf8");
  const branchesBefore = git(repo, ["branch", "--format=%(refname)"]);

  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([
      task("ALPHA", { replace: ["src/alpha.txt"], create: ["src/alpha-new.txt"] }),
      task("BETA", { replace: ["src/beta.txt"] }),
    ]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));
  const alpha = createTaskWorktree(run, "ALPHA");
  const beta = createTaskWorktree(run, "BETA");
  assert.notEqual(alpha.worktreePath, beta.worktreePath);
  assert.equal(git(alpha.worktreePath, ["rev-parse", "HEAD"]).trim(), baseCommit);
  assert.equal(git(beta.worktreePath, ["rev-parse", "HEAD"]).trim(), baseCommit);
  assert.equal(git(alpha.worktreePath, ["symbolic-ref", "-q", "HEAD"], { accepted: [1] }), "");

  const alphaBase = fs.readFileSync(path.join(alpha.worktreePath, "src", "alpha.txt"), "utf8");
  applyStructuredWrite(alpha, {
    type: "replace",
    path: "src/alpha.txt",
    content: "alpha changed\n",
    beforeSha256: sha256(alphaBase),
  });
  applyStructuredWrite(alpha, {
    type: "create",
    path: "src/alpha-new.txt",
    content: "new alpha file\n",
  });
  const betaBase = fs.readFileSync(path.join(beta.worktreePath, "src", "beta.txt"), "utf8");
  applyStructuredWrite(beta, {
    type: "replace",
    path: "src/beta.txt",
    content: "beta changed\n",
    beforeSha256: sha256(betaBase),
  });

  const alphaArtifact = finalizeTaskWorktree(alpha);
  const betaArtifact = finalizeTaskWorktree(beta);
  assert.equal(alphaArtifact.status, "patch-ready");
  assert.equal(betaArtifact.status, "patch-ready");
  assert.equal(alphaArtifact.patchSha256, sha256(fs.readFileSync(alphaArtifact.patchPath)));
  assert.match(fs.readFileSync(alphaArtifact.patchPath, "utf8"), /new file mode 100644/);
  assert.match(fs.readFileSync(alphaArtifact.patchPath, "utf8"), /alpha changed/);

  const verificationPath = path.join(run.stateDir, "verification-alpha");
  git(repo, ["-c", "core.autocrlf=false", "worktree", "add", "--detach", verificationPath, baseCommit]);
  git(verificationPath, ["-c", "core.autocrlf=false", "apply", alphaArtifact.patchPath]);
  assert.equal(fs.readFileSync(path.join(verificationPath, "src", "alpha.txt"), "utf8"), "alpha changed\n");
  assert.equal(fs.readFileSync(path.join(verificationPath, "src", "alpha-new.txt"), "utf8"), "new alpha file\n");

  assert.equal(git(repo, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]), mainStatusBefore);
  assert.equal(fs.readFileSync(path.join(repo, "notes.txt"), "utf8"), mainContentBefore);
  assert.equal(git(repo, ["branch", "--format=%(refname)"]), branchesBefore);
  assert.equal(git(repo, ["rev-parse", "HEAD"]).trim(), baseCommit);
});

test("write runs reject dirty owned targets while allowing unrelated dirty files", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  fs.writeFileSync(path.join(repo, "src", "alpha.txt"), "owner edit\n", "utf8");
  fs.writeFileSync(path.join(repo, "src", "new.txt"), "owner untracked\n", "utf8");
  assert.throws(() => createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([task("OWNED-DIRTY", {
      replace: ["src/alpha.txt"],
      create: ["src/new.txt"],
    })]),
  }), /owned target is dirty/);

  fs.writeFileSync(path.join(repo, "src", "alpha.txt"), "alpha base\n", "utf8");
  fs.rmSync(path.join(repo, "src", "new.txt"));
  fs.writeFileSync(path.join(repo, "notes.txt"), "unrelated owner edit\n", "utf8");
  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([task("UNRELATED-DIRTY", { replace: ["src/alpha.txt"] })]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));
  assert.equal(run.baseCommit, baseCommit);
});

test("write runs reject an old base commit when main HEAD has advanced", (t) => {
  const { repo, baseCommit: oldBase } = makeRepository(t);
  fs.writeFileSync(path.join(repo, "src", "beta.txt"), "beta second commit\n", "utf8");
  git(repo, ["add", "src/beta.txt"]);
  git(repo, ["commit", "-m", "advance main"]);
  assert.notEqual(git(repo, ["rev-parse", "HEAD"]).trim(), oldBase);
  assert.throws(() => createWriteRun({
    repoPath: repo,
    baseCommit: oldBase,
    plan: plan([task("OLD-BASE", { replace: ["src/alpha.txt"] })]),
  }), /HEAD must equal baseCommit/);
});

test("write runs reject repository checkout filters before creating a worktree", (t) => {
  const first = makeRepository(t);
  git(first.repo, ["config", "filter.evil.smudge", "whoami"]);
  assert.throws(() => createWriteRun({
    repoPath: first.repo,
    baseCommit: first.baseCommit,
    plan: plan([task("FILTER", { replace: ["src/alpha.txt"] })]),
  }), /Git filters/);

  const second = makeRepository(t);
  fs.writeFileSync(path.join(second.repo, ".gitattributes"), "*.txt filter=evil\n", "utf8");
  git(second.repo, ["add", ".gitattributes"]);
  git(second.repo, ["commit", "-m", "unsafe attributes"]);
  const unsafeBase = git(second.repo, ["rev-parse", "HEAD"]).trim();
  assert.throws(() => createWriteRun({
    repoPath: second.repo,
    baseCommit: unsafeBase,
    plan: plan([task("ATTR", { replace: ["src/alpha.txt"] })]),
  }), /checkout filters/);

  const third = makeRepository(t);
  git(third.repo, ["config", "diff.evil.textconv", "whoami"]);
  assert.throws(() => createWriteRun({
    repoPath: third.repo,
    baseCommit: third.baseCommit,
    plan: plan([task("TEXTCONV", { replace: ["src/alpha.txt"] })]),
  }), /textconv/);

  const fourth = makeRepository(t);
  const infoAttributes = path.join(fourth.repo, ".git", "info", "attributes");
  fs.writeFileSync(infoAttributes, "*.txt filter=evil\n", "utf8");
  assert.throws(() => createWriteRun({
    repoPath: fourth.repo,
    baseCommit: fourth.baseCommit,
    plan: plan([task("INFO-ATTR", { replace: ["src/alpha.txt"] })]),
  }), /info attributes/);
});

test("broker Git commands ignore injected environment config and external attributes", (t) => {
  const { container, repo, baseCommit } = makeRepository(t);
  const attributesPath = path.join(container, "external-attributes");
  const filterPath = path.join(container, "filter.mjs");
  const markerPath = path.join(container, "filter-executed.txt");
  fs.writeFileSync(attributesPath, "*.txt filter=evil\n", "utf8");
  fs.writeFileSync(filterPath, [
    'import fs from "node:fs";',
    'fs.writeFileSync(process.argv[2], "executed\\n");',
    "process.stdin.pipe(process.stdout);",
    "",
  ].join("\n"), "utf8");
  const shellPath = (value) => value.replaceAll("\\", "/").replaceAll('"', '\\"');
  const injectedCommand = `"${shellPath(process.execPath)}" "${shellPath(filterPath)}" "${shellPath(markerPath)}"`;
  const injected = {
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "core.attributesFile",
    GIT_CONFIG_VALUE_0: attributesPath,
    GIT_CONFIG_KEY_1: "filter.evil.smudge",
    GIT_CONFIG_VALUE_1: injectedCommand,
  };
  const previous = Object.fromEntries(Object.keys(injected).map((key) => [key, process.env[key]]));
  Object.assign(process.env, injected);
  try {
    assert.equal(git(repo, ["config", "--get", "filter.evil.smudge"]).trim(), injectedCommand);
    const run = createWriteRun({
      repoPath: repo,
      baseCommit,
      plan: plan([task("ENV-FILTER", { replace: ["src/alpha.txt"] })]),
    });
    t.after(() => removeTemporaryTree(run.stateDir));
    createTaskWorktree(run, "ENV-FILTER");
    assert.equal(fs.existsSync(markerPath), false);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("write run source verification detects main checkout changes after finalize", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([task("VERIFY-SOURCE", { replace: ["src/alpha.txt"] })]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));
  const session = createTaskWorktree(run, "VERIFY-SOURCE");
  applyStructuredWrite(session, {
    type: "replace",
    path: "src/alpha.txt",
    content: "alpha isolated change\n",
    beforeSha256: sha256("alpha base\n"),
  });
  finalizeTaskWorktree(session);

  assert.deepEqual(verifyWriteRunSource(run), { unchanged: true });
  fs.writeFileSync(path.join(repo, "notes.txt"), "main changed after finalize\n", "utf8");
  assert.deepEqual(verifyWriteRunSource(run), { unchanged: false });
  assert.deepEqual(Object.keys(verifyWriteRunSource(run)), ["unchanged"]);
});

test("structured writes fail closed on scope, hashes, secrets, and unknown operation fields", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([task("STRICT", { replace: ["src/alpha.txt"], create: ["src/new.txt"] })]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));
  const session = createTaskWorktree(run, "STRICT");
  const alphaPath = path.join(session.worktreePath, "src", "alpha.txt");
  const alpha = fs.readFileSync(alphaPath, "utf8");
  assert.throws(() => applyStructuredWrite(session, {
    type: "replace", path: "src/beta.txt", content: "no\n", beforeSha256: sha256("beta base\n"),
  }), /outside the task's exact ownership/);
  assert.throws(() => applyStructuredWrite(session, {
    type: "replace", path: "src/alpha.txt", content: "no\n", beforeSha256: "0".repeat(64),
  }), /does not match/);
  assert.throws(() => applyStructuredWrite(session, {
    type: "create", path: "src/new.txt", content: "api_key=abcdefghijklmnop\n",
  }), /suspected secret/);
  assert.throws(() => applyStructuredWrite(session, {
    type: "create", path: "src/new.txt", content: "safe\n", command: "whoami",
  }), /unknown field/);
  assert.equal(fs.readFileSync(alphaPath, "utf8"), alpha);
  assert.equal(fs.existsSync(path.join(session.worktreePath, "src", "new.txt")), false);
});

test("out-of-band edits, links, and hardlinks dirty the isolated target and are rejected", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([
      task("DIRTY", { replace: ["src/alpha.txt"] }),
      task("HARDLINK", { replace: ["src/beta.txt"] }),
      task("LINK", { create: ["linked/escape.txt"] }),
    ]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));

  const dirty = createTaskWorktree(run, "DIRTY");
  fs.writeFileSync(path.join(dirty.worktreePath, "src", "alpha.txt"), "outside broker\n", "utf8");
  assert.throws(() => applyStructuredWrite(dirty, {
    type: "replace", path: "src/alpha.txt", content: "broker\n", beforeSha256: sha256("outside broker\n"),
  }), /dirty outside the broker/);

  const hardlink = createTaskWorktree(run, "HARDLINK");
  fs.linkSync(path.join(hardlink.worktreePath, "src", "beta.txt"), path.join(hardlink.worktreePath, "src", "beta-hard.txt"));
  assert.throws(() => applyStructuredWrite(hardlink, {
    type: "replace", path: "src/beta.txt", content: "broker\n", beforeSha256: sha256("beta base\n"),
  }), /dirty outside the broker/);

  const linked = createTaskWorktree(run, "LINK");
  const real = path.join(linked.worktreePath, "real-target");
  fs.mkdirSync(real);
  try {
    fs.symlinkSync(real, path.join(linked.worktreePath, "linked"), process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => applyStructuredWrite(linked, {
      type: "create", path: "linked/escape.txt", content: "escape\n",
    }), /dirty outside the broker/);
  } catch (error) {
    if (!["EPERM", "EACCES", "UNKNOWN"].includes(error.code)) throw error;
  }
});

test("the broker exposes no model, shell, network, merge, or automatic integration surface", () => {
  assert.deepEqual(writeBrokerPolicy.operations, ["create", "replace"]);
  assert.equal(writeBrokerPolicy.modelTools, "none");
  assert.equal(writeBrokerPolicy.shell, "none");
  assert.equal(writeBrokerPolicy.network, "none");
  assert.equal(writeBrokerPolicy.integration, "patch-artifact-only");
});

test("finalized patch bytes are frozen in memory and disk tampering is rejected", (t) => {
  const { repo, baseCommit } = makeRepository(t);
  const run = createWriteRun({
    repoPath: repo,
    baseCommit,
    plan: plan([task("TAMPER", { replace: ["src/alpha.txt"] })]),
  });
  t.after(() => removeTemporaryTree(run.stateDir));
  const session = createTaskWorktree(run, "TAMPER");
  applyStructuredWrite(session, {
    type: "replace",
    path: "src/alpha.txt",
    content: "reviewed bytes\n",
    beforeSha256: sha256("alpha base\n"),
  });
  const artifact = finalizeTaskWorktree(session);
  assert.equal(readVerifiedPatchArtifact(session).patchSha256, artifact.patchSha256);
  fs.appendFileSync(artifact.patchPath, "tampered\n");
  assert.throws(() => readVerifiedPatchArtifact(session), /changed after finalization/);
});
