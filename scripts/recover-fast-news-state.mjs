import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function findStateFiles(root) {
  const matches = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name === "fast-news-state.json") matches.push(candidate);
    }
  };
  visit(root);
  return matches;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function recoverFastNewsState(artifactDirectory, destinationFile) {
  const artifactRoot = path.resolve(artifactDirectory);
  const destination = path.resolve(destinationFile);
  const matches = findStateFiles(artifactRoot);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one fast-news-state.json in the artifact, found ${matches.length}`);
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(matches[0], "utf8"));
  } catch {
    throw new Error("Recovered fast-news state is not valid JSON");
  }
  if (!isRecord(state) || (state.published !== undefined && !isRecord(state.published))
    || (state.queued !== undefined && !isRecord(state.queued))
    || (state.attempts !== undefined && !isRecord(state.attempts))) {
    throw new Error("Recovered fast-news state is not a valid state object");
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(temporary, destination);
  return destination;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const artifactDirectory = process.argv[2];
  const destinationFile = process.argv[3];
  if (!artifactDirectory || !destinationFile) {
    console.error("Usage: node scripts/recover-fast-news-state.mjs <artifact-directory> <destination-file>");
    process.exit(1);
  }
  try {
    console.log(`Recovered fast-news state to ${recoverFastNewsState(artifactDirectory, destinationFile)}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
