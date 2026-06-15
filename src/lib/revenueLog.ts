export interface RevenueEntry {
  date: string;
  playgamaPlays: number;
  playgamaRevenue: number;
  monetagPushes: number;
  monetagRevenue: number;
  pageViews: number;
  uniqueUsers: number;
}

const STORAGE_KEY = "plixfy-revenue-log-v1";

function readAll(): RevenueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

function writeAll(entries: RevenueEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // quota or disabled
  }
}

function isValidEntry(x: unknown): x is RevenueEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.date === "string" &&
    typeof e.playgamaPlays === "number" &&
    typeof e.playgamaRevenue === "number" &&
    typeof e.monetagPushes === "number" &&
    typeof e.monetagRevenue === "number" &&
    typeof e.pageViews === "number" &&
    typeof e.uniqueUsers === "number"
  );
}

export function listEntries(): RevenueEntry[] {
  return readAll();
}

export function upsertEntry(entry: RevenueEntry): RevenueEntry[] {
  const all = readAll();
  const idx = all.findIndex((e) => e.date === entry.date);
  const next = idx === -1 ? [...all, entry] : all.map((e, i) => (i === idx ? entry : e));
  writeAll(next);
  return next;
}

export function deleteEntry(date: string): RevenueEntry[] {
  const next = readAll().filter((e) => e.date !== date);
  writeAll(next);
  return next;
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface RevenueSummary {
  plays: number;
  revenue: number;
  pushes: number;
  pushRevenue: number;
  pageViews: number;
  uniqueUsers: number;
  totalRevenue: number;
  days: number;
}

export function summarize(entries: readonly RevenueEntry[]): RevenueSummary {
  let plays = 0;
  let revenue = 0;
  let pushes = 0;
  let pushRevenue = 0;
  let pageViews = 0;
  let uniqueUsers = 0;
  for (const e of entries) {
    plays += e.playgamaPlays;
    revenue += e.playgamaRevenue;
    pushes += e.monetagPushes;
    pushRevenue += e.monetagRevenue;
    pageViews += e.pageViews;
    uniqueUsers += e.uniqueUsers;
  }
  return {
    plays,
    revenue,
    pushes,
    pushRevenue,
    pageViews,
    uniqueUsers,
    totalRevenue: revenue + pushRevenue,
    days: entries.length,
  };
}

export function entriesInWindow(entries: readonly RevenueEntry[], days: number): RevenueEntry[] {
  const today = new Date();
  const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.date >= cutoffISO);
}

export function toCSV(entries: readonly RevenueEntry[]): string {
  const header =
    "date,playgama_plays,playgama_revenue,monetag_pushes,monetag_revenue,page_views,unique_users,total_revenue";
  const rows = entries.map((e) =>
    [
      e.date,
      e.playgamaPlays,
      e.playgamaRevenue.toFixed(2),
      e.monetagPushes,
      e.monetagRevenue.toFixed(2),
      e.pageViews,
      e.uniqueUsers,
      (e.playgamaRevenue + e.monetagRevenue).toFixed(2),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadCSV(entries: readonly RevenueEntry[]): void {
  if (typeof window === "undefined") return;
  const csv = toCSV(entries);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = "plixfy-revenue-" + stamp + ".csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
