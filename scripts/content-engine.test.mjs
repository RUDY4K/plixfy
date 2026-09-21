import assert from "node:assert/strict";
import test from "node:test";
import {
  extractJsonObject,
  runGeminiContent,
  runGeminiJson,
} from "./gemini-content-client.mjs";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

test("runGeminiContent retries an overloaded primary model before using the fallback", async () => {
  const requestedModels = [];
  const delays = [];
  const responses = [
    jsonResponse(503, { error: { message: "Model is experiencing high demand" } }),
    jsonResponse(503, { error: { message: "Model is still experiencing high demand" } }),
    jsonResponse(503, { error: { message: "Model remains overloaded" } }),
    jsonResponse(200, { output_text: '{"items":[]}' }),
  ];

  const output = await runGeminiContent({
    prompt: "Return news JSON.",
    apiKey: "test-key",
    models: ["primary-model", "fallback-model"],
    attemptsPerModel: 3,
    baseRetryDelayMs: 100,
    fetchImpl: async (_url, options) => {
      requestedModels.push(JSON.parse(options.body).model);
      return responses.shift();
    },
    sleepFn: async (delay) => delays.push(delay),
  });

  assert.equal(output, '{"items":[]}');
  assert.deepEqual(requestedModels, [
    "primary-model",
    "primary-model",
    "primary-model",
    "fallback-model",
  ]);
  assert.deepEqual(delays, [100, 200]);
});

test("runGeminiContent does not hide a non-retryable client error with fallback", async () => {
  const requestedModels = [];

  await assert.rejects(
    runGeminiContent({
      prompt: "Return news JSON.",
      apiKey: "test-key",
      models: ["primary-model", "fallback-model"],
      attemptsPerModel: 1,
      fetchImpl: async (_url, options) => {
        requestedModels.push(JSON.parse(options.body).model);
        return jsonResponse(400, { error: { message: "Invalid request" } });
      },
      sleepFn: async () => {},
    }),
    /Invalid request/,
  );

  assert.deepEqual(requestedModels, ["primary-model"]);
});

test("runGeminiContent retries an HTTP 408 response", async () => {
  const requestedModels = [];
  const responses = [
    jsonResponse(408, { error: { message: "Request timed out" } }),
    jsonResponse(200, { output_text: '{"items":[]}' }),
  ];

  const output = await runGeminiContent({
    prompt: "Return news JSON.",
    apiKey: "test-key",
    models: ["primary-model"],
    attemptsPerModel: 2,
    baseRetryDelayMs: 0,
    fetchImpl: async (_url, options) => {
      requestedModels.push(JSON.parse(options.body).model);
      return responses.shift();
    },
    sleepFn: async () => {},
  });

  assert.equal(output, '{"items":[]}');
  assert.deepEqual(requestedModels, ["primary-model", "primary-model"]);
});

test("runGeminiContent switches immediately when the primary model is unavailable", async () => {
  const requestedModels = [];
  const delays = [];
  const responses = [
    jsonResponse(404, {
      error: {
        code: "model_not_found",
        message: "The requested model was not found",
      },
    }),
    jsonResponse(200, { output_text: '{"items":[]}' }),
  ];

  const output = await runGeminiContent({
    prompt: "Return news JSON.",
    apiKey: "test-key",
    models: ["missing-model", "fallback-model"],
    attemptsPerModel: 2,
    baseRetryDelayMs: 100,
    fetchImpl: async (_url, options) => {
      requestedModels.push(JSON.parse(options.body).model);
      return responses.shift();
    },
    sleepFn: async (delay) => delays.push(delay),
  });

  assert.equal(output, '{"items":[]}');
  assert.deepEqual(requestedModels, ["missing-model", "fallback-model"]);
  assert.deepEqual(delays, []);
});

test("runGeminiContent reports failures from every exhausted model", async () => {
  const responses = [
    jsonResponse(503, { error: { message: "Primary overloaded" } }),
    jsonResponse(429, { error: { message: "Fallback rate limited" } }),
  ];

  await assert.rejects(
    runGeminiContent({
      prompt: "Return news JSON.",
      apiKey: "test-key",
      models: ["primary-model", "fallback-model"],
      attemptsPerModel: 1,
      fetchImpl: async () => responses.shift(),
      sleepFn: async () => {},
    }),
    (error) => {
      assert.match(error.message, /primary-model:.*Primary overloaded/i);
      assert.match(error.message, /fallback-model:.*Fallback rate limited/i);
      assert.equal(error.errors.length, 2);
      return true;
    },
  );
});

test("extractJsonObject accepts fenced JSON and surrounding text", () => {
  const parsed = extractJsonObject('Result:\n```json\n{"items":[{"slug":"valid"}]}\n```');
  assert.deepEqual(parsed, { items: [{ slug: "valid" }] });
});

test("runGeminiJson retries malformed JSON and validates the replacement", async () => {
  const prompts = [];
  const outputs = [
    '{"items":[{"slug":"broken"} {"slug":"missing-comma"}]}',
    '{"items":[{"slug":"valid"}]}',
  ];

  const parsed = await runGeminiJson({
    prompt: "Return news JSON.",
    system: "Return JSON only.",
    maxTokens: 500,
    retryDelayMs: 0,
    generate: async ({ prompt }) => {
      prompts.push(prompt);
      return outputs[prompts.length - 1];
    },
    validate: (value) => {
      if (!Array.isArray(value.items)) throw new Error("items must be an array");
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /previous response could not be parsed or validated/i);
  assert.deepEqual(parsed, { items: [{ slug: "valid" }] });
});

test("runGeminiJson retries a valid object that fails schema validation", async () => {
  let calls = 0;
  const parsed = await runGeminiJson({
    prompt: "Return news JSON.",
    retryDelayMs: 0,
    generate: async () => {
      calls += 1;
      return calls === 1 ? '{"message":"wrong shape"}' : '{"items":[]}';
    },
    validate: (value) => {
      if (!Array.isArray(value.items)) throw new Error("items must be an array");
    },
  });

  assert.equal(calls, 2);
  assert.deepEqual(parsed, { items: [] });
});

test("runGeminiJson stops after the bounded number of invalid responses", async () => {
  let calls = 0;
  await assert.rejects(
    runGeminiJson({
      prompt: "Return news JSON.",
      maxAttempts: 2,
      retryDelayMs: 0,
      generate: async () => {
        calls += 1;
        return "not json";
      },
    }),
    /invalid JSON after 2 attempts/i,
  );
  assert.equal(calls, 2);
});
