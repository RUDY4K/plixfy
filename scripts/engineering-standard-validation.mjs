import { createHash } from "node:crypto";

const GATE_PATTERN = /<!--\s*delivery-gate:([a-z0-9-]+)\s*-->/g;
const EVIDENCE_PATTERN = /```engineering-evidence\s*([\s\S]*?)```/;
const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function extractDeliveryGates(standardText) {
  return [...String(standardText).matchAll(GATE_PATTERN)].map((match) => match[1]);
}

export function validateEngineeringStandard({ standardText, policy }) {
  const errors = [];
  if (policy?.engineeringStandard !== "ops/agent-team/ENGINEERING-STANDARD.md") {
    errors.push("policy must point to ops/agent-team/ENGINEERING-STANDARD.md");
  }
  const documentedGates = extractDeliveryGates(standardText);
  const requiredGates = Array.isArray(policy?.requiredDeliveryGates)
    ? policy.requiredDeliveryGates
    : [];
  if (JSON.stringify(documentedGates) !== JSON.stringify(requiredGates)) {
    errors.push("documented delivery gates do not match policy");
  }
  if (new Set(documentedGates).size !== documentedGates.length) {
    errors.push("documented delivery gates must be unique");
  }
  return errors;
}

export function parseEngineeringEvidence(runText) {
  const match = String(runText).match(EVIDENCE_PATTERN);
  if (!match) return { value: null, error: "missing engineering-evidence block" };
  try {
    return { value: JSON.parse(match[1]), error: null };
  } catch {
    return { value: null, error: "engineering-evidence block must contain valid JSON" };
  }
}

function normalizePath(value) {
  return String(value ?? "").replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
}

function pathIsAllowed(filePath, allowedPaths) {
  const normalized = normalizePath(filePath);
  return allowedPaths.some((allowedPath) => {
    const allowed = normalizePath(allowedPath);
    return allowed.endsWith("/**")
      ? normalized.startsWith(allowed.slice(0, -2))
      : normalized === allowed;
  });
}

export function fingerprintCheckoutSnapshot(snapshot) {
  return createHash("sha256")
    .update(JSON.stringify(snapshot), "utf8")
    .digest("hex");
}

export function combineChangedPaths(committedPaths, statusEntries) {
  return [...new Set([
    ...(committedPaths ?? []),
    ...(statusEntries ?? []).flatMap((entry) => [entry.path, entry.originalPath].filter(Boolean)),
  ])].sort();
}

export function validateEngineeringRun({
  runText,
  requiredGates,
  repository,
  allowedPostReviewPaths = [],
}) {
  const errors = [];
  const parsed = parseEngineeringEvidence(runText);
  if (parsed.error) return [parsed.error];
  const evidence = parsed.value;

  if (evidence.standardVersion !== 1) errors.push("standardVersion must be 1");
  if (typeof evidence.runId !== "string" || !evidence.runId.trim()) {
    errors.push("runId is required");
  }
  if (!FULL_SHA_PATTERN.test(evidence.baseCommit ?? "")) {
    errors.push("baseCommit must be a full git SHA");
  }
  if (evidence.executionPath !== "isolated-worktree") {
    errors.push("executionPath must be isolated-worktree");
  }
  if (typeof evidence.worktree !== "string" || !evidence.worktree.trim()) {
    errors.push("worktree is required");
  }
  if (!Array.isArray(evidence.ownedPaths) || evidence.ownedPaths.length === 0
      || evidence.ownedPaths.some((ownedPath) => typeof ownedPath !== "string" || !ownedPath.trim())) {
    errors.push("ownedPaths must contain at least one exact path");
  }

  const sourceCheckout = evidence.sourceCheckout ?? {};
  if (typeof sourceCheckout.path !== "string" || !sourceCheckout.path.trim()) {
    errors.push("sourceCheckout.path is required");
  }
  if (typeof sourceCheckout.status !== "string" || !sourceCheckout.status.trim()) {
    errors.push("sourceCheckout.status is required");
  }
  if (!SHA256_PATTERN.test(sourceCheckout.fingerprintBefore ?? "")
      || !SHA256_PATTERN.test(sourceCheckout.fingerprintAfter ?? "")) {
    errors.push("source checkout fingerprints must be SHA-256 values");
  }
  if (sourceCheckout.fingerprintBefore !== sourceCheckout.fingerprintAfter) {
    errors.push("source checkout fingerprints must match");
  }
  if (sourceCheckout.unchangedOutsideOwnership !== true) {
    errors.push("sourceCheckout.unchangedOutsideOwnership must be true");
  }

  const review = evidence.review ?? {};
  if (typeof review.reviewer !== "string" || !review.reviewer.trim()) {
    errors.push("review.reviewer is required");
  }
  if (!FULL_SHA_PATTERN.test(review.candidateCommit ?? "")) {
    errors.push("review.candidateCommit must be a full git SHA");
  }
  if (review.verdict !== "PASS") errors.push("review.verdict must be PASS");
  if (review.reviewer === "plixfy-manager") {
    errors.push("reviewer must be independent from plixfy-manager");
  }

  if (!repository) {
    errors.push("repository evidence is required");
  } else {
    if (normalizePath(repository.currentWorktree) !== normalizePath(evidence.worktree)) {
      errors.push("recorded worktree does not match git");
    }
    if (repository.baseCommitExists !== true) {
      errors.push("base commit does not exist");
    }
    if (repository.candidateCommitExists !== true) {
      errors.push("reviewed candidate commit does not exist");
    }
    if (repository.candidateContainsRequiredFiles !== true) {
      errors.push("reviewed candidate commit is not self-contained");
    }
    if (repository.sameCommonGitDir !== true) {
      errors.push("source checkout is not a worktree of the current repository");
    }
    if (repository.baseIsAncestorOfCandidate !== true) {
      errors.push("base commit is not an ancestor of the reviewed candidate");
    }
    if (repository.candidateIsAncestorOfHead !== true) {
      errors.push("reviewed candidate is not an ancestor of HEAD");
    }
    if (repository.sourceFingerprint !== sourceCheckout.fingerprintAfter) {
      errors.push("source checkout fingerprint does not match git");
    }
    const ownedPathSet = new Set((evidence.ownedPaths ?? []).map(normalizePath));
    const candidateChangedPaths = Array.isArray(repository.candidateChangedPaths)
      ? repository.candidateChangedPaths
      : null;
    if (candidateChangedPaths === null) {
      errors.push("candidate changed paths are required");
    } else if (candidateChangedPaths.some((filePath) => !ownedPathSet.has(normalizePath(filePath)))) {
      errors.push("candidate changes exceed exact ownership");
    }
    const changedSinceCandidate = Array.isArray(repository.changedSinceCandidate)
      ? repository.changedSinceCandidate
      : [];
    if (changedSinceCandidate.some((filePath) => !pathIsAllowed(filePath, allowedPostReviewPaths))) {
      errors.push("non-manager files changed after independent review");
    }
  }

  const gates = Array.isArray(evidence.gates) ? evidence.gates : [];
  const gateIds = gates.map((gate) => gate?.id);
  if (JSON.stringify(gateIds) !== JSON.stringify(requiredGates)) {
    errors.push("run gates do not match the required delivery gates");
  }
  for (const gate of gates) {
    if (!["pass", "not-applicable"].includes(gate?.status)) {
      errors.push(`invalid gate status: ${gate?.id ?? "unknown"}`);
    }
    if (typeof gate?.evidence !== "string" || !gate.evidence.trim()) {
      errors.push(`gate evidence is required: ${gate?.id ?? "unknown"}`);
    }
  }

  if (!Array.isArray(evidence.checks) || evidence.checks.length === 0) {
    errors.push("at least one executable check is required");
  } else {
    for (const check of evidence.checks) {
      if (typeof check?.command !== "string" || !check.command.trim()) {
        errors.push("check command is required");
      }
      if (check?.exitCode !== 0) {
        errors.push("check exitCode must be 0");
      }
    }
  }
  return errors;
}

export function extractGovernedRunPaths(runsIndexText) {
  const text = String(runsIndexText);
  const startMarker = "<!-- engineering-standard-v1-runs -->";
  const endMarker = "<!-- legacy-runs-below -->";
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return [];
  const governed = text.slice(start + startMarker.length, end);
  return [...governed.matchAll(/`(runs\/[a-zA-Z0-9._-]+\.md)`/g)].map((match) => match[1]);
}

export function validateGovernedRunIndex(runsIndexText) {
  const text = String(runsIndexText);
  const errors = [];
  const startMarker = "<!-- engineering-standard-v1-runs -->";
  const endMarker = "<!-- legacy-runs-below -->";
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    return ["RUNS.md must contain ordered engineering governance boundaries"];
  }
  if (extractGovernedRunPaths(text).length === 0) {
    errors.push("at least one governed engineering run is required");
  }
  return errors;
}
