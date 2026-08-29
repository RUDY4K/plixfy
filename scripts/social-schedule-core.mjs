import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SOCIAL_SCHEDULE_WINDOW_MINUTES = 60;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const TIME_ZONE = "Asia/Riyadh";
const SLOT_TARGETS = Object.freeze({
  morning: 9 * 60 + 30,
  evening: 19 * 60 + 30,
});

function riyadhParts(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function dateFromPseudoLocalTime(value) {
  const date = new Date(value);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function normalizeContentDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new Error("--date must be a valid calendar date in YYYY-MM-DD format");
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error("--date must be a valid calendar date in YYYY-MM-DD format");
  }
  return value;
}

export function latestSlotTarget(now, slot) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error("now must be a valid Date");
  }
  if (!Object.hasOwn(SLOT_TARGETS, slot)) {
    throw new Error(`Unknown social slot: ${slot}`);
  }

  const local = riyadhParts(now);
  const localNow = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  const targetMinutes = SLOT_TARGETS[slot];
  let target = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    Math.floor(targetMinutes / 60),
    targetMinutes % 60,
  );
  if (target > localNow) target -= DAY_MS;

  return {
    slot,
    date: dateFromPseudoLocalTime(target),
    ageMinutes: (localNow - target) / MINUTE_MS,
  };
}

export function planSocialSchedule({
  now = new Date(),
  state = {},
  windowMinutes = SOCIAL_SCHEDULE_WINDOW_MINUTES,
} = {}) {
  if (!Number.isFinite(windowMinutes) || windowMinutes < 0) {
    throw new Error("windowMinutes must be a non-negative number");
  }

  const candidate = Object.keys(SLOT_TARGETS)
    .map((slot) => latestSlotTarget(now, slot))
    .filter((target) => target.ageMinutes >= 0 && target.ageMinutes <= windowMinutes)
    .sort((a, b) => a.ageMinutes - b.ageMinutes)[0];

  if (!candidate) {
    return {
      shouldRun: false,
      reason: "outside_window",
      slot: null,
      date: null,
      runKey: null,
      ageMinutes: null,
    };
  }

  const runKey = `${candidate.date}:${candidate.slot}`;
  if (state?.runs?.[runKey]?.status === "delivered") {
    return {
      shouldRun: false,
      reason: "already_delivered",
      ...candidate,
      runKey,
    };
  }

  return {
    shouldRun: true,
    reason: "due",
    ...candidate,
    runKey,
  };
}

function readState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeOutput(name, value) {
  const line = `${name}=${value}\n`;
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, line);
  } else {
    process.stdout.write(line);
  }
}

function runCli() {
  const nowArg = process.argv.find((arg) => arg.startsWith("--now="))?.slice(6);
  const now = nowArg ? new Date(nowArg) : new Date();
  if (!Number.isFinite(now.getTime())) throw new Error("--now must be a valid ISO date-time");
  const stateFile = path.resolve(process.env.SOCIAL_STATE_FILE || ".social/cloud-state.json");
  const plan = planSocialSchedule({ now, state: readState(stateFile) });

  writeOutput("should_run", String(plan.shouldRun));
  writeOutput("reason", plan.reason);
  writeOutput("slot", plan.slot || "");
  writeOutput("date", plan.date || "");
  writeOutput("dry_run", "false");
  writeOutput("force", "false");
  writeOutput("platforms", "telegram,discord,x,facebook,instagram");
  process.stdout.write(`[SocialSchedule] ${JSON.stringify(plan)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
