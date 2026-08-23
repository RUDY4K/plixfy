import assert from "node:assert/strict";
import test from "node:test";
import {
  extractJsonObject,
  runGeminiJson,
} from "./gemini-content-client.mjs";

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
