import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const prompt = await new Promise((resolve, reject) => {
  let value = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { value += chunk; });
  process.stdin.on("end", () => resolve(value));
  process.stdin.on("error", reject);
});

const args = process.argv.slice(2);
const isCodex = args.includes("exec");
function emitStructured(value) {
  if (isCodex) {
    process.stdout.write([
      JSON.stringify({ type: "thread.started", thread_id: "fixture-thread" }),
      JSON.stringify({ type: "turn.started" }),
      JSON.stringify({ type: "item.completed", item: {
        id: "fixture-result", type: "agent_message", text: JSON.stringify(value),
      } }),
      JSON.stringify({ type: "turn.completed", usage: {
        input_tokens: 1, cached_input_tokens: 0, output_tokens: 1,
      } }),
      "",
    ].join("\n"));
  } else {
    process.stdout.write(JSON.stringify({ structured_output: value }));
  }
}
if (prompt.includes("FAIL_FIXTURE")) {
  process.stderr.write("fixture failure");
  process.exit(2);
}
if (prompt.includes("FAIL_QA_FIXTURE") && prompt.includes('"artifacts"')) {
  process.stderr.write("fixture QA failure");
  process.exit(2);
}
const acceptanceMatch = prompt.match(/Acceptance checks: (\[[^\r\n]*\])/);
const checks = acceptanceMatch ? JSON.parse(acceptanceMatch[1]) : ["fixture-check"];
const evidenceMarker = "\nEvidence:\n";
const evidenceText = prompt.includes(evidenceMarker) ? prompt.slice(prompt.indexOf(evidenceMarker) + evidenceMarker.length) : "[]";
let documents = [];
try { documents = JSON.parse(evidenceText); } catch {}
const dependencyMatch = prompt.match(/Dependency results:\n([\s\S]*?)\nEvidence:\n/);
let dependencies = {};
try { dependencies = dependencyMatch ? JSON.parse(dependencyMatch[1]) : {}; } catch {}
const sources = [
  ...documents.map((document) => document.path),
  ...Object.keys(dependencies).map((taskId) => `dependency:${taskId}`),
];
if (!sources.length) sources.push("launcher:fixture");

fs.writeFileSync(path.join(process.cwd(), `fake-${isCodex ? "codex" : "claude"}-log-${process.pid}.json`), JSON.stringify({
  args,
  envKeys: Object.keys(process.env).sort(),
  cwd: process.cwd(),
  stdinLength: prompt.length,
  promptInArgv: args.some((arg) => arg.includes("Acceptance checks:")),
  writeReviewHasConstraints: prompt.includes('"constraints"') && prompt.includes('"artifacts"'),
  writeReviewHasWriteScope: prompt.includes('"writeScope"') && prompt.includes('"artifacts"'),
  writeReviewHasBaseCommit: prompt.includes('"baseCommit"') && prompt.includes('"artifacts"'),
  writeReviewHasVerifiedInputs: /"verifiedPublicInputs":\[\{"path":"[^"]+"/.test(prompt),
}, null, 2));

if (isCodex && prompt.includes("CODEX_TOOL_EVENT_FIXTURE")) {
  process.stdout.write([
    JSON.stringify({ type: "thread.started", thread_id: "fixture-thread" }),
    JSON.stringify({ type: "turn.started" }),
    JSON.stringify({ type: "item.completed", item: {
      id: "no-code-mode", type: "error",
      message: "Code Mode is unavailable because code-mode host is disabled.",
    } }),
    JSON.stringify({ type: "item.completed", item: {
      id: "forbidden-tool", type: "command_execution", command: "whoami", status: "completed",
    } }),
    JSON.stringify({ type: "item.completed", item: {
      id: "fixture-result", type: "agent_message", text: JSON.stringify({}),
    } }),
    JSON.stringify({ type: "turn.completed", usage: {
      input_tokens: 1, cached_input_tokens: 0, output_tokens: 1,
    } }),
    "",
  ].join("\n"));
  process.exit(0);
}

if (isCodex && prompt.includes("CODEX_UNKNOWN_EVENT_FIXTURE")) {
  process.stdout.write([
    JSON.stringify({ type: "thread.started", thread_id: "fixture-thread" }),
    JSON.stringify({ type: "turn.started" }),
    JSON.stringify({ type: "future.tool.started", tool: "unexpected" }),
    JSON.stringify({ type: "item.completed", item: {
      id: "no-code-mode", type: "error",
      message: "Code Mode is unavailable because code-mode host is disabled.",
    } }),
    JSON.stringify({ type: "item.completed", item: {
      id: "fixture-result", type: "agent_message", text: JSON.stringify({}),
    } }),
    JSON.stringify({ type: "turn.completed", usage: {
      input_tokens: 1, cached_input_tokens: 0, output_tokens: 1,
    } }),
    "",
  ].join("\n"));
  process.exit(0);
}

if (isCodex && prompt.includes('"repositoryManifest"') && prompt.includes('"ownerObjective"')) {
  const payload = JSON.parse(prompt);
  const preferred = payload.repositoryManifest.find((entry) => entry.path === "data/catalog-summary.md" && entry.writable)
    ?? payload.repositoryManifest.find((entry) => entry.writable);
  emitStructured({
    allowedInputs: [preferred.path],
    writeScope: { create: [], replace: [preferred.path] },
    rationale: "Fixture selected one narrow, eligible repository file.",
  });
  process.exit(0);
}

if (prompt.includes('"trustedManagerContext"') && prompt.includes('"executionMode":"isolated_write"')) {
  const payload = JSON.parse(prompt);
  const request = payload.ownerRequest;
  const tasks = [];
  let index = 0;
  for (const type of ["replace", "create"]) {
    for (const relativePath of request.writeScope[type]) {
      index += 1;
      tasks.push({
        taskId: `WRITER-${index}`,
        roleId: "engineering",
        objective: `Edit ${relativePath}`,
        wave: 1,
        dependsOn: [],
        readPaths: type === "replace" ? [relativePath] : [request.allowedInputs[0]],
        ownership: {
          create: type === "create" ? [relativePath] : [],
          replace: type === "replace" ? [relativePath] : [],
        },
        acceptanceChecks: request.objective.includes("DUPLICATE_ACCEPTANCE_FIXTURE")
          ? [`Review ${relativePath}`, `Review ${relativePath}`]
          : [`Review ${relativePath}`],
      });
    }
  }
  tasks.push({
    taskId: "QA-FINAL",
    roleId: "qa-compliance",
    objective: "Review every isolated patch",
    wave: 2,
    dependsOn: tasks.map((task) => task.taskId),
    readPaths: [],
    ownership: { create: [], replace: [] },
    acceptanceChecks: ["Review all patches"],
  });
  emitStructured({ tasks, finalReviewTaskId: "QA-FINAL" });
  process.exit(0);
}

if (prompt.includes('"artifacts"') && prompt.includes('"patchSha256"')) {
  const payload = JSON.parse(prompt);
  emitStructured({
    summary: "fixture write review",
    reviewedTaskIds: payload.artifacts.map((artifact) => artifact.taskId),
    issues: [],
    risks: [],
    modelVerdict: "accepted",
    checkResults: payload.finalReviewTask.acceptanceChecks,
  });
  process.exit(0);
}

if (prompt.includes('"ownership"') && prompt.includes('"documents"')) {
  const payload = JSON.parse(prompt);
  const byPath = new Map(payload.documents.map((document) => [document.path.toLowerCase(), document]));
  const operations = [
    ...payload.task.ownership.replace.map((relativePath) => {
      const document = byPath.get(relativePath.toLowerCase());
      return {
        type: "replace",
        path: relativePath,
        content: `${document.text}\nFixture isolated edit.\n`,
        beforeSha256: document.sha256,
      };
    }),
    ...payload.task.ownership.create.map((relativePath) => ({
      type: "create",
      path: relativePath,
      content: "Fixture isolated file.\n",
      beforeSha256: null,
    })),
  ];
  emitStructured({
    summary: "fixture write proposal",
    operations,
    assumptions: [],
    risks: [],
    modelVerdict: "accepted",
    checkResults: payload.task.acceptanceChecks,
  });
  process.exit(0);
}

if (prompt.includes('"trustedManagerContext"')) {
  const payload = JSON.parse(prompt);
  const request = payload.ownerRequest;
  const tasks = request.allowedInputs.map((inputPath, index) => ({
    taskId: `READER-${index + 1}`,
    roleId: `focused-reader-${index + 1}`,
    objective: request.objective.includes("FAIL_WORKER") && index === 0 ? "FAIL_FIXTURE" : `Read ${inputPath}`,
    wave: 1,
    dependsOn: [],
    pathAllowlist: [inputPath],
    dataScope: "owner-allowed public input",
    acceptanceChecks: [`Verify ${inputPath}`],
  }));
  tasks.push({
    taskId: "QA-FINAL",
    roleId: "qa-compliance",
    objective: "Review every specialist result",
    wave: 2,
    dependsOn: tasks.map((task) => task.taskId),
    pathAllowlist: [],
    dataScope: "verified dependency outputs",
    acceptanceChecks: ["Verify all specialist results"],
  });
  emitStructured({ tasks, finalReviewTaskId: "QA-FINAL" });
  process.exit(0);
}

const hash = (value) => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const evidence = [
  ...documents.map((document, index) => ({
    id: `DOC-${index + 1}`,
    source: document.path,
    sourceSha256: document.sha256,
    locator: "lines:1-1",
    quote: document.text.split(/\r?\n/)[0] ?? "",
    finding: "fixture document evidence",
  })),
  ...Object.entries(dependencies).map(([taskId, dependency], index) => ({
    id: `DEP-${index + 1}`,
    source: `dependency:${taskId}`,
    sourceSha256: hash(dependency),
    locator: "result",
    quote: dependency.result.summary,
    finding: "fixture dependency evidence",
  })),
];

const structured_output = {
  summary: "fixture accepted",
  evidence,
  assumptions: [],
  risks: [],
  confidence: "high",
  verdict: "accepted",
  checkResults: checks.map((check) => ({ check, status: "passed", evidenceIds: evidence.map((item) => item.id) })),
};
emitStructured(structured_output);
