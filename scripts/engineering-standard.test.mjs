import assert from "node:assert/strict";
import test from "node:test";

let validation;
try {
  validation = await import("./engineering-standard-validation.mjs");
} catch {
  assert.fail("engineering standard validation module is required");
}

const gates = ["source-of-truth", "scope-and-acceptance", "isolated-worktree"];
const standardText = gates
  .map((gate, index) => `${index + 1}. <!-- delivery-gate:${gate} --> **${gate}**`)
  .join("\n");
const policy = {
  engineeringStandard: "ops/agent-team/ENGINEERING-STANDARD.md",
  requiredDeliveryGates: gates,
};

function runRecord(overrides = {}) {
  const evidence = {
    standardVersion: 1,
    runId: "engineering-standard-20260914",
    baseCommit: "e".repeat(40),
    executionPath: "isolated-worktree",
    worktree: "C:\\workspace\\isolated",
    ownedPaths: ["ops/agent-team/ENGINEERING-STANDARD.md"],
    sourceCheckout: {
      path: "C:\\workspace\\source",
      status: "dirty-preserved",
      fingerprintBefore: "b".repeat(64),
      fingerprintAfter: "b".repeat(64),
      unchangedOutsideOwnership: true,
    },
    review: {
      reviewer: "independent-reviewer",
      candidateCommit: "a".repeat(40),
      verdict: "PASS",
    },
    checks: [{ command: "node --test", exitCode: 0 }],
    gates: gates.map((id) => ({ id, status: "pass", evidence: `verified ${id}` })),
    ...overrides,
  };
  return `# Run\n\n\`\`\`engineering-evidence\n${JSON.stringify(evidence)}\n\`\`\``;
}

function repositoryEvidence(overrides = {}) {
  return {
    currentWorktree: "C:\\workspace\\isolated",
    headCommit: "c".repeat(40),
    baseCommitExists: true,
    candidateCommitExists: true,
    candidateContainsRequiredFiles: true,
    baseIsAncestorOfCandidate: true,
    candidateIsAncestorOfHead: true,
    sameCommonGitDir: true,
    sourceFingerprint: "b".repeat(64),
    candidateChangedPaths: ["ops/agent-team/ENGINEERING-STANDARD.md"],
    changedSinceCandidate: ["ops/agent-team/RUNS.md"],
    ...overrides,
  };
}

const allowedPostReviewPaths = [
  "ops/agent-team/STATE.md",
  "ops/agent-team/DECISIONS.md",
  "ops/agent-team/RUNS.md",
  "ops/agent-team/runs/engineering-standard-20260914.md",
];

test("the documented gate markers must exactly match policy", () => {
  assert.deepEqual(validation.validateEngineeringStandard({ standardText, policy }), []);
  const missingMarker = standardText.replace("<!-- delivery-gate:scope-and-acceptance --> ", "");
  assert.match(
    validation.validateEngineeringStandard({ standardText: missingMarker, policy }).join("\n"),
    /delivery gates do not match policy/,
  );
});

test("a governed engineering run must contain complete evidence for every gate", () => {
  assert.deepEqual(validation.validateEngineeringRun({
    runText: runRecord(),
    requiredGates: gates,
    repository: repositoryEvidence(),
    allowedPostReviewPaths,
  }), []);
  const incomplete = runRecord({
    gates: [{ id: "source-of-truth", status: "pass", evidence: "verified source" }],
  });
  assert.match(
    validation.validateEngineeringRun({
      runText: incomplete,
      requiredGates: gates,
      repository: repositoryEvidence(),
      allowedPostReviewPaths,
    }).join("\n"),
    /run gates do not match the required delivery gates/,
  );
});

test("native work must prove isolation, preservation, and an exact independent review", () => {
  const unsafe = runRecord({
    executionPath: "source-checkout",
    worktree: null,
    sourceCheckout: {
      path: "C:\\workspace\\source",
      status: "dirty",
      fingerprintBefore: "b".repeat(64),
      fingerprintAfter: "c".repeat(64),
      unchangedOutsideOwnership: false,
    },
    review: { reviewer: "", candidateCommit: "working-tree", verdict: "PASS" },
  });
  const errors = validation.validateEngineeringRun({ runText: unsafe, requiredGates: gates }).join("\n");
  assert.match(errors, /executionPath must be isolated-worktree/);
  assert.match(errors, /unchangedOutsideOwnership must be true/);
  assert.match(errors, /candidateCommit must be a full git SHA/);
});

test("run evidence records executable checks and their exit codes", () => {
  const errors = validation.validateEngineeringRun({
    runText: runRecord({ checks: [{ command: "node --test", exitCode: 1 }] }),
    requiredGates: gates,
    repository: repositoryEvidence(),
    allowedPostReviewPaths,
  }).join("\n");
  assert.match(errors, /check exitCode must be 0/);
});

test("run evidence must match the current git worktree and reviewed commit ancestry", () => {
  const errors = validation.validateEngineeringRun({
    runText: runRecord(),
    requiredGates: gates,
    repository: repositoryEvidence({
      currentWorktree: "C:\\workspace\\other",
      candidateCommitExists: false,
      candidateContainsRequiredFiles: false,
      sameCommonGitDir: false,
      sourceFingerprint: "c".repeat(64),
      candidateChangedPaths: ["src/app/page.tsx"],
      changedSinceCandidate: ["src/app/page.tsx"],
    }),
    allowedPostReviewPaths,
  }).join("\n");
  assert.match(errors, /worktree does not match git/);
  assert.match(errors, /reviewed candidate commit does not exist/);
  assert.match(errors, /reviewed candidate commit is not self-contained/);
  assert.match(errors, /source checkout is not a worktree of the current repository/);
  assert.match(errors, /source checkout fingerprint does not match git/);
  assert.match(errors, /candidate changes exceed exact ownership/);
  assert.match(errors, /non-manager files changed after independent review/);
});

test("checkout fingerprints change when dirty file bytes change without a status change", () => {
  const snapshot = {
    head: "e".repeat(40),
    statusEntries: [{ code: " M", path: "src/page.tsx", originalPath: null }],
    files: [{ path: "src/page.tsx", type: "file", size: 3, sha256: "a".repeat(64) }],
  };
  const before = validation.fingerprintCheckoutSnapshot(snapshot);
  const after = validation.fingerprintCheckoutSnapshot({
    ...snapshot,
    files: [{ ...snapshot.files[0], sha256: "b".repeat(64) }],
  });
  assert.notEqual(before, after);
});

test("post-review changes include committed, staged, unstaged, and untracked paths", () => {
  assert.deepEqual(validation.combineChangedPaths(
    ["committed.ts"],
    [
      { code: "M ", path: "staged.ts", originalPath: null },
      { code: " M", path: "unstaged.ts", originalPath: null },
      { code: "??", path: "untracked.ts", originalPath: null },
    ],
  ), ["committed.ts", "staged.ts", "unstaged.ts", "untracked.ts"]);
});

test("RUNS governance markers identify every record that must be validated", () => {
  const index = [
    "<!-- engineering-standard-v1-runs -->",
    "| 2026-09-14 | run-a | result | `runs/run-a.md` |",
    "| 2026-09-14 | run-b | result | `runs/run-b.md` |",
    "<!-- legacy-runs-below -->",
    "| 2026-09-13 | old | result | `runs/old.md` |",
  ].join("\n");
  assert.deepEqual(validation.extractGovernedRunPaths(index), ["runs/run-a.md", "runs/run-b.md"]);
  assert.deepEqual(validation.validateGovernedRunIndex(index), []);
  assert.match(
    validation.validateGovernedRunIndex([
      "<!-- engineering-standard-v1-runs -->",
      "<!-- legacy-runs-below -->",
    ].join("\n")).join("\n"),
    /at least one governed engineering run is required/,
  );
});
