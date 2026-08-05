export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOW_RUNS_URL =
  "https://api.github.com/repos/RUDY4K/plixfy/actions/workflows/cloud-social.yml/runs?per_page=10&status=completed";
const MAX_SUCCESS_AGE_MS = 18 * 60 * 60 * 1000;

interface WorkflowRun {
  conclusion: string | null;
  created_at: string;
  html_url: string;
}

interface WorkflowRunsResponse {
  workflow_runs?: WorkflowRun[];
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(12_000),
      });
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

async function sendTelegramAlert(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram watchdog environment is incomplete");

  const response = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { ok?: boolean };
  if (!response.ok || !body.ok) throw new Error(`Telegram watchdog alert failed: HTTP ${response.status}`);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetchWithRetry(WORKFLOW_RUNS_URL, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "PlixfySocialWatchdog/1.0",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GitHub Actions status failed: HTTP ${response.status}`);

    const data = (await response.json()) as WorkflowRunsResponse;
    const latestSuccess = data.workflow_runs?.find((run) => run.conclusion === "success");
    const latestSuccessAt = latestSuccess ? Date.parse(latestSuccess.created_at) : Number.NaN;
    const ageMs = Number.isFinite(latestSuccessAt) ? Date.now() - latestSuccessAt : Number.POSITIVE_INFINITY;
    const healthy = ageMs <= MAX_SUCCESS_AGE_MS;

    if (!healthy) {
      const latestRun = data.workflow_runs?.[0];
      await sendTelegramAlert(
        [
          "🚨 مراقب Plixfy: لم ينجح ناشر السوشيال السحابي خلال آخر 18 ساعة.",
          latestRun?.html_url || "https://github.com/RUDY4K/plixfy/actions/workflows/cloud-social.yml",
        ].join("\n"),
      );
    }

    return Response.json({
      ok: true,
      healthy,
      latestSuccessAt: latestSuccess?.created_at || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown watchdog error";
    try {
      await sendTelegramAlert(`🚨 فشل مراقب Plixfy في فحص GitHub Actions: ${message}`);
    } catch {
      // The HTTP response remains observable in Vercel logs if Telegram is also unavailable.
    }
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}
