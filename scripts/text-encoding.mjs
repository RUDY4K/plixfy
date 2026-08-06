const WINDOWS_1252_REVERSE = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

const MOJIBAKE_MARKERS = new Set([0x00c2, 0x00c3, 0x00d8, 0x00d9, 0x00e2, 0x00f0]);

function mojibakeScore(value) {
  let score = 0;
  for (const char of value) {
    if (MOJIBAKE_MARKERS.has(char.codePointAt(0))) score += 1;
  }
  return score;
}

export function repairUtf8Mojibake(value) {
  if (typeof value !== "string" || mojibakeScore(value) === 0) return value;

  const bytes = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else if (WINDOWS_1252_REVERSE.has(codePoint)) {
      bytes.push(WINDOWS_1252_REVERSE.get(codePoint));
    } else {
      return value;
    }
  }

  const decoded = Buffer.from(bytes).toString("utf8");
  if (decoded.includes("\ufffd") || mojibakeScore(decoded) >= mojibakeScore(value)) return value;
  return decoded;
}

export function repairObjectStrings(value) {
  if (typeof value === "string") return repairUtf8Mojibake(value);
  if (Array.isArray(value)) return value.map(repairObjectStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, repairObjectStrings(child)]),
    );
  }
  return value;
}

export function findRepairableMojibake(value, path = "root", found = []) {
  if (typeof value === "string") {
    if (repairUtf8Mojibake(value) !== value) found.push(path);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => findRepairableMojibake(child, `${path}[${index}]`, found));
    return found;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) =>
      findRepairableMojibake(child, `${path}.${key}`, found),
    );
  }
  return found;
}
