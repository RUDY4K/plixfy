// Minimal Gemini Interactions API client for cloud content jobs.
// Usage: GEMINI_API_KEY=... node scripts/update-news.mjs

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemini-3.6-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash";

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

function isMissingModel(response, body) {
  if (response.status !== 404) return false;
  const code = String(body?.error?.code || body?.error?.status || "").toLowerCase();
  const message = String(body?.error?.message || body?.status?.message || "").toLowerCase();
  return code === "model_not_found"
    || (code === "not_found" && message.includes("model"))
    || message.includes("model not found")
    || message.includes("requested model was not found");
}

function exhaustedModelsError(failures) {
  const summary = failures
    .map(({ model, error }) => `${model}: ${error.message}`)
    .join("; ");
  return new AggregateError(
    failures.map(({ error }) => error),
    `Gemini API failed across model chain: ${summary}`,
  );
}

export async function runGeminiContent({
  prompt,
  system = "Return accurate, original content grounded only in the supplied material.",
  maxTokens = 5_000,
  apiKey = process.env.GEMINI_API_KEY,
  models,
  attemptsPerModel = 2,
  baseRetryDelayMs = 5_000,
  requestTimeoutMs = 90_000,
  fetchImpl = fetch,
  sleepFn = sleep,
}) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is required in GitHub Actions secrets");

  const configuredModels = models || [
    process.env.GEMINI_MODEL || DEFAULT_MODEL,
    process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL,
  ];
  const modelChain = [...new Set(configuredModels.filter(Boolean))];
  if (modelChain.length === 0) throw new Error("At least one Gemini model is required");

  const failures = [];

  for (const [modelIndex, model] of modelChain.entries()) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt += 1) {
      let failure;
      let skipRemainingModelAttempts = false;

      try {
        const response = await fetchImpl(ENDPOINT, {
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
          signal: AbortSignal.timeout(requestTimeoutMs),
        });

        const body = await response.json().catch(() => ({}));
        const output = responseText(body);
        if (response.ok && output) {
          console.log(`Gemini content draft completed with ${model}.`);
          return output;
        }

        const description =
          body?.error?.message || body?.status?.message || `HTTP ${response.status}`;
        failure = new Error(`Gemini API failed with ${model}: ${description}`);
        skipRemainingModelAttempts = isMissingModel(response, body);
        const retryable = response.ok
          || response.status === 408
          || response.status === 429
          || response.status >= 500;
        if (!retryable && !skipRemainingModelAttempts) throw failure;
      } catch (error) {
        if (error === failure) throw error;
        failure = error;
      }

      failures.push({ model, error: failure });
      const hasSameModelRetry = attempt < attemptsPerModel;
      const hasFallback = modelIndex < modelChain.length - 1;
      if (skipRemainingModelAttempts) {
        if (hasFallback) {
          console.warn(
            `Gemini ${model} is unavailable (${failure.message}); trying ${modelChain[modelIndex + 1]}.`,
          );
        }
        break;
      } else if (hasSameModelRetry) {
        const delay = baseRetryDelayMs * (2 ** (attempt - 1));
        console.warn(
          `Gemini ${model} attempt ${attempt}/${attemptsPerModel} failed (${failure.message}); retrying in ${delay}ms.`,
        );
        if (delay > 0) await sleepFn(delay);
      } else if (hasFallback) {
        console.warn(
          `Gemini ${model} remained unavailable (${failure.message}); trying ${modelChain[modelIndex + 1]}.`,
        );
      }
    }
  }

  if (failures.length > 0) throw exhaustedModelsError(failures);
  throw new Error("Gemini API returned no usable response");
}

export async function runGeminiJson({
  prompt,
  system,
  maxTokens,
  maxAttempts = 2,
  retryDelayMs = 1_000,
  validate,
  generate = runGeminiContent,
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const retryInstruction = attempt === 1
      ? ""
      : "\n\nYour previous response could not be parsed or validated. Return one complete JSON object only. Do not use Markdown, comments, trailing commas, or text outside the JSON object.";

    const raw = await generate({
      prompt: prompt + retryInstruction,
      system,
      maxTokens,
    });

    try {
      const parsed = extractJsonObject(raw);
      if (validate) validate(parsed);
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(
        `Gemini JSON attempt ${attempt}/${maxAttempts} was invalid: ${error.message}`,
      );
      if (attempt < maxAttempts && retryDelayMs > 0) await sleep(retryDelayMs);
    }
  }

  throw new Error(
    `Gemini returned invalid JSON after ${maxAttempts} attempts: ${lastError?.message || "unknown parse error"}`,
  );
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
