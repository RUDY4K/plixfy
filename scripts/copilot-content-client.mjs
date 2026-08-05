// Deterministic wrapper around GitHub Copilot CLI for content generation in Actions.
// Authentication is provided by the workflow GITHUB_TOKEN with copilot-requests: write.
import { spawnSync } from "node:child_process";
import os from "node:os";

export function runCopilotContent({
  prompt,
  system = "Return accurate, original content grounded only in the supplied material.",
  timeoutMs = 180_000,
}) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required for Copilot CLI in GitHub Actions");
  }

  const executable = process.platform === "win32" ? "copilot.cmd" : "copilot";
  const fullPrompt = [
    system,
    "Do not use tools, browse, or read files. Work only from the material in this prompt.",
    "Return the requested JSON only, without Markdown fences or commentary.",
    "",
    prompt,
  ].join("\n");

  const result = spawnSync(
    executable,
    ["-p", fullPrompt, "--silent", "--stream", "off", "--no-ask-user", "--disable-builtin-mcps"],
    {
      cwd: os.tmpdir(),
      encoding: "utf8",
      maxBuffer: 12 * 1024 * 1024,
      timeout: timeoutMs,
      env: {
        ...process.env,
        NO_COLOR: "1",
        COPILOT_PROMPT_FRAME: "0",
      },
    },
  );

  if (result.error) {
    throw new Error(`Copilot CLI could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "unknown error").trim();
    throw new Error(`Copilot CLI failed with exit ${result.status}: ${details.slice(0, 1_500)}`);
  }

  const output = result.stdout?.trim();
  if (!output) throw new Error("Copilot CLI returned an empty response");
  console.log("Copilot CLI returned a content draft.");
  return output;
}

export function extractJsonObject(raw) {
  const fence = raw.match(/```(?:json)?\r?\n([\s\S]*?)\r?\n```/i);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("{");
  if (start < 0) throw new Error("No JSON object found in model output");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < body.length; index += 1) {
    const char = body[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(body.slice(start, index + 1));
    }
  }
  throw new Error("Unbalanced JSON object in model output");
}
