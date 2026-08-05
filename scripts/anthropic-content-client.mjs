// Minimal Anthropic Messages API client for cloud content jobs.
// The API key is supplied only by GitHub Actions secrets.

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAnthropicContent({
  prompt,
  system = "Return accurate, original content grounded only in the supplied material.",
  maxTokens = 5_000,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required in GitHub Actions secrets");

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          temperature: 0.2,
          system,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(180_000),
      });

      const body = await response.json().catch(() => ({}));
      const output = Array.isArray(body?.content)
        ? body.content.filter((block) => block?.type === "text").map((block) => block.text).join("\n").trim()
        : "";
      if (response.ok && output) {
        console.log(`Anthropic content draft completed with ${MODEL}.`);
        return output;
      }

      const description = body?.error?.message || `HTTP ${response.status}`;
      lastError = new Error(`Anthropic API failed: ${description}`);
      const retryable = response.status === 429 || response.status === 529 || response.status >= 500;
      if (!retryable) break;
      if (attempt < 3) await sleep(attempt * 3_000);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 3_000);
    }
  }

  throw lastError || new Error("Anthropic API returned no usable response");
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
