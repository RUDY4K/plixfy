// تشغيل Claude Code بوضع headless (claude -p) — الفوترة على اشتراك المستخدم
// المحلي، وليس مفتاح API (الرصيد منتهي منذ 2026-07-08).
//
// نستدعي bin\claude.exe مباشرة لأن تشغيل ملفات .cmd من Node بدون shell
// محظور على ويندوز. النمط منقول من proptechpilot/agent/claude-cli.mjs المجرّب.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CLI = path.join(
  process.env.APPDATA ?? "",
  "npm",
  "node_modules",
  "@anthropic-ai",
  "claude-code",
  "bin",
  "claude.exe",
);

export function runClaude({ prompt, model = "haiku", timeoutMs = 10 * 60 * 1000 }) {
  if (!fs.existsSync(CLI)) {
    throw new Error(`Claude Code CLI not found at ${CLI} — is it installed via npm?`);
  }

  // ANTHROPIC_API_KEY يجب ألا يتسرب للعملية الابنة: وجوده يجعل claude -p
  // يفوتر المفتاح (بدون رصيد) بدلاً من الاشتراك.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;

  return execFileSync(CLI, ["-p", "--model", model], {
    input: prompt,
    env,
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
  });
}

// النموذج أحياناً يغلّف الناتج بسياج ```json أو يسبقه بتعليق رغم التعليمات.
// نستخرج أول كائن JSON متوازن الأقواس من النص.
export function extractJson(raw) {
  const fence = raw.match(/```(?:json)?\r?\n([\s\S]*?)\r?\n```/);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(body.slice(start, i + 1));
    }
  }
  throw new Error("Unbalanced JSON object in model output");
}

// يقرأ .env.local (gitignored) لتزويد السكربتات المحلية بالأسرار
// (TELEGRAM_BOT_TOKEN وغيرها) بدون الاعتماد على بيئة Task Scheduler.
export function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
