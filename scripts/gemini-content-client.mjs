// Minimal Gemini Interactions API client for cloud content jobs.
// Usage: GEMINI_API_KEY=... node scripts/update-news.mjs

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemini-3.6-flash";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function responseText(body) {
  if (typeof body?.output_text === "string") return body.output_text.trim();

  const steps = Array.isArray(body?.steps) ? body.steps : [];
  const fromSteps = steps
    .filter((step) => step?.type === "model_output")
    .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (fromSteps) return fromSteps;

  const outputs = Array.isArray(body?.outputs) ? body.outputs : [];
  return outputs
    .flatMap((output) => (Array.isArray(output?.content) ? output.content : []))
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function runGeminiContent({
  prompt,
  system = "Return accurate, original content grounded only in the supplied material.",
  maxTokens = 5_000,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required in GitHub Actions secrets");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          system_instruction: system,
          input: prompt,
          store: false,
          generation_config: {
            max_output_tokens: maxTokens,
            thinking_level: "low",
          },
          response_format: [
            {
              type: "text",
              mime_type: "application/json",
            },
          ],
        }),
        signal: AbortSignal.timeout(180_000),
      });

      const body = await response.json().catch(() => ({}));
      const output = responseText(body);
      if (response.ok && output) {
        console.log(`Gemini content draft completed with ${model}.`);
        return output;
      }

      const description =
        body?.error?.message || body?.status?.message || `HTTP ${response.status}`;
      lastError = new Error(`Gemini API failed: ${description}`);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) break;
      if (attempt < 3) await sleep(attempt * 3_000);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 3_000);
    }
  }

  throw lastError || new Error("Gemini API returned no usable response");
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
