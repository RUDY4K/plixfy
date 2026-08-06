import fs from "node:fs";
import path from "node:path";
import { findRepairableMojibake, repairObjectStrings } from "./text-encoding.mjs";

const NEWS_FILE = path.join(process.cwd(), "src", "data", "news.json");
const checkOnly = process.argv.includes("--check");

const original = JSON.parse(fs.readFileSync(NEWS_FILE, "utf8"));
if (!Array.isArray(original)) throw new Error("news.json must contain an array");

const repairable = findRepairableMojibake(original);
if (checkOnly && repairable.length > 0) {
  throw new Error(`Found ${repairable.length} repairable mojibake strings: ${repairable.slice(0, 5).join(", ")}`);
}

const repaired = repairObjectStrings(original);
for (const item of repaired) {
  for (const key of ["title", "summary"]) {
    if (typeof item[key] !== "string" || !/[\u0600-\u06ff]/u.test(item[key])) {
      throw new Error(`Missing readable Arabic in ${item.slug || "unknown"}.${key}`);
    }
  }
}

if (!checkOnly && repairable.length > 0) {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(repaired, null, 2) + "\n", "utf8");
}

console.log(
  checkOnly
    ? `Encoding check passed for ${repaired.length} news items.`
    : `Repaired ${repairable.length} strings across ${repaired.length} news items.`,
);
