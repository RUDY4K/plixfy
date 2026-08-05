// Small GitHub Models client for content jobs running in GitHub Actions.
// Requires GITHUB_TOKEN and workflow permission: models: read.

const ENDPOINT = "https://models.github.ai/inference/chat/completions";
const DEFAULT_MODELS = ["openai/gpt-4.1-mini", "openai/gpt-4o-mini"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function modelCandidates() {
  const configured = process.env.GITHUB_MODELS_MODEL?.trim();
  return configured ? [configured, ...DEFAULT_MODELS.filter((model) => model !== configured)] : DEFAULT_MODELS;
}

export async function runGitHubModel({
  prompt,
  system = "Return accurate, original content grounded only in the supplied material.",
  maxTokens = 5_000,
  temperature = 0.2,
}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required for GitHub Models");

  let lastError;
  for (const model of modelCandidates()) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            accept: "application/vnd.github+json",
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "x-github-api-version": "2022-11-28",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: prompt },
            ],
            max_tokens: maxTokens,
            temperature,
          }),
          signal: AbortSignal.timeout(90_000),
        });

        const body = await response.json().catch(() => ({}));
        const content = body?.choices?.[0]?.message?.content;
        if (response.ok && typeof content === "string" && content.trim()) {
          console.log(`GitHub Models completed with ${model}.`);
          return content;
        }

        const description = body?.error?.message || body?.message || `HTTP ${response.status}`;
        lastError = new Error(`GitHub Models ${model} failed: ${description}`);
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable) break;
        if (attempt < 3) await sleep(attempt * 2_000);
      } catch (error) {
        lastError = error;
        if (attempt < 3) await sleep(attempt * 2_000);
      }
    }
  }

  throw lastError || new Error("GitHub Models returned no usable response");
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
