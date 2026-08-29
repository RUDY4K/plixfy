"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  clearAll,
  deleteEntry,
  downloadCSV,
  entriesInWindow,
  listEntries,
  summarize,
  todayISO,
  upsertEntry,
  type RevenueEntry,
} from "@/lib/revenueLog";

const EMPTY_FORM: RevenueEntry = {
  date: "",
  playgamaPlays: 0,
  playgamaRevenue: 0,
  monetagPushes: 0,
  monetagRevenue: 0,
  pageViews: 0,
  uniqueUsers: 0,
};

export default function RevenueDashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [form, setForm] = useState<RevenueEntry>({ ...EMPTY_FORM, date: "" });

  useEffect(() => {
    setEntries(listEntries());
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setHydrated(true);
  }, []);

  const day1 = useMemo(() => summarize(entriesInWindow(entries, 1)), [entries]);
  const day7 = useMemo(() => summarize(entriesInWindow(entries, 7)), [entries]);
  const day30 = useMemo(() => summarize(entriesInWindow(entries, 30)), [entries]);

  const recent = useMemo(() => entries.slice(-30).reverse(), [entries]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    const next = upsertEntry(form);
    setEntries(next);
    setForm({ ...EMPTY_FORM, date: todayISO() });
  }

  function onDelete(date: string) {
    const next = deleteEntry(date);
    setEntries(next);
  }

  function onClearAll() {
    if (!window.confirm("امسح كل السجل؟ لا يمكن التراجع.")) return;
    clearAll();
    setEntries([]);
  }

  if (!hydrated) {
    return (
      <div className="text-text-secondary text-center py-12">
        ...جار التحميل
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-accent-2/20 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-accent-2 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-text-secondary leading-relaxed">
          ده manual log — الأرقام بتسجّل في الـ browser محلياً فقط. مفيش auto-sync مع Playgama
          أو Monetag (مفيش publisher APIs). للأرقام الحقيقية، ارجع لـ dashboards:{" "}
          <a className="text-primary underline" href="https://app.playgama.com" target="_blank" rel="noreferrer noopener">
            Playgama
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="https://app.monetag.com" target="_blank" rel="noreferrer noopener">
            Monetag
          </a>{" "}
          /{" "}
          <a className="text-primary underline" href="https://analytics.google.com" target="_blank" rel="noreferrer noopener">
            GA4
          </a>
          . احفظ نسخة CSV احتياطية.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="آخر 24 ساعة" summary={day1} />
        <SummaryCard label="آخر 7 أيام" summary={day7} />
        <SummaryCard label="آخر 30 يوم" summary={day30} />
      </div>

      <section className="bg-surface rounded-2xl p-5 md:p-6 border border-surface-elevated">
        <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4 inline-flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" aria-hidden="true" />
          إضافة / تحديث يوم
        </h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="التاريخ" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Field label="Playgama Plays" type="number" value={form.playgamaPlays} onChange={(v) => setForm({ ...form, playgamaPlays: Number(v) || 0 })} />
          <Field label="Playgama Revenue ($)" type="number" step="0.01" value={form.playgamaRevenue} onChange={(v) => setForm({ ...form, playgamaRevenue: Number(v) || 0 })} />
          <Field label="Monetag Pushes" type="number" value={form.monetagPushes} onChange={(v) => setForm({ ...form, monetagPushes: Number(v) || 0 })} />
          <Field label="Monetag Revenue ($)" type="number" step="0.01" value={form.monetagRevenue} onChange={(v) => setForm({ ...form, monetagRevenue: Number(v) || 0 })} />
          <Field label="Page Views (GA4)" type="number" value={form.pageViews} onChange={(v) => setForm({ ...form, pageViews: Number(v) || 0 })} />
          <Field label="Unique Users (GA4)" type="number" value={form.uniqueUsers} onChange={(v) => setForm({ ...form, uniqueUsers: Number(v) || 0 })} />
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-primary text-[#090913] font-bold py-3 rounded-xl min-h-12 hover:brightness-110 transition-all duration-200 neon-glow-pink hover:scale-[1.02]"
            >
              حفظ
            </button>
          </div>
        </form>
      </section>

      <section className="bg-surface rounded-2xl p-5 md:p-6 border border-surface-elevated">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-bold text-text-primary">
            السجل ({entries.length} يوم)
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadCSV(entries)}
              disabled={entries.length === 0}
              className="bg-accent-2 text-bg font-semibold px-4 py-2 rounded-xl min-h-12 inline-flex items-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 neon-glow-cyan"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">CSV</span>
            </button>
            <button
              type="button"
              onClick={onClearAll}
              disabled={entries.length === 0}
              className="bg-surface-elevated text-danger font-semibold px-4 py-2 rounded-xl min-h-12 inline-flex items-center gap-2 hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">امسح الكل</span>
            </button>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="text-text-secondary text-center py-8">مفيش سجل بعد. ابدأ بإضافة أول يوم في فورم فوق.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="text-text-secondary text-xs uppercase tracking-wider">
                <tr className="border-b border-surface-elevated">
                  <th className="text-start py-2 px-2 font-semibold">التاريخ</th>
                  <th className="text-end py-2 px-2 font-semibold">Plays</th>
                  <th className="text-end py-2 px-2 font-semibold">PG $</th>
                  <th className="text-end py-2 px-2 font-semibold">Pushes</th>
                  <th className="text-end py-2 px-2 font-semibold">MT $</th>
                  <th className="text-end py-2 px-2 font-semibold">Views</th>
                  <th className="text-end py-2 px-2 font-semibold">Users</th>
                  <th className="text-end py-2 px-2 font-semibold">Total $</th>
                  <th className="text-end py-2 px-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((e) => {
                  const total = e.playgamaRevenue + e.monetagRevenue;
                  return (
                    <tr key={e.date} className="border-b border-surface-elevated/50 hover:bg-surface-elevated/30 transition-colors">
                      <td className="py-2.5 px-2 font-medium text-text-primary font-latin">{e.date}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.playgamaPlays.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.playgamaRevenue.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.monetagPushes.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.monetagRevenue.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.pageViews.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-end text-text-secondary font-latin">{e.uniqueUsers.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-end text-primary font-bold font-latin">${total.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-end">
                        <button
                          type="button"
                          onClick={() => onDelete(e.date)}
                          className="text-text-faint hover:text-danger transition-colors p-1"
                          aria-label={"احذف " + e.date}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {entries.length >= 2 ? (
        <section className="bg-surface rounded-2xl p-5 md:p-6 border border-surface-elevated">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">Trend (30 يوم)</h2>
          <Sparkline
            label="Total Revenue ($)"
            values={entriesInWindow(entries, 30).map((e) => e.playgamaRevenue + e.monetagRevenue)}
          />
          <Sparkline
            label="Playgama Plays"
            values={entriesInWindow(entries, 30).map((e) => e.playgamaPlays)}
          />
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, summary }: { label: string; summary: ReturnType<typeof summarize> }) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-surface-elevated">
      <p className="text-xs text-text-faint uppercase tracking-wider mb-3">{label}</p>
      <p className="text-3xl font-extrabold text-primary font-latin neon-text-pink mb-1">
        ${summary.totalRevenue.toFixed(2)}
      </p>
      <p className="text-xs text-text-secondary mb-4">{summary.days} يوم مسجّل</p>
      <dl className="space-y-1.5 text-xs">
        <Row label="Playgama" value={`${summary.plays.toLocaleString()} plays · $${summary.revenue.toFixed(2)}`} />
        <Row label="Monetag" value={`${summary.pushes.toLocaleString()} pushes · $${summary.pushRevenue.toFixed(2)}`} />
        <Row label="GA4" value={`${summary.pageViews.toLocaleString()} views · ${summary.uniqueUsers.toLocaleString()} users`} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-text-faint">{label}</dt>
      <dd className="text-text-secondary font-latin text-end">{value}</dd>
    </div>
  );
}

interface FieldProps {
  label: string;
  type: string;
  value: string | number;
  step?: string;
  onChange: (v: string) => void;
}

function Field({ label, type, value, step, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs text-text-secondary mb-1.5 font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg text-text-primary rounded-xl px-3 py-2.5 min-h-12 outline-none border border-surface-elevated focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,0,110,0.15)] transition-all duration-200 font-latin"
        required={type === "date"}
      />
    </label>
  );
}

function Sparkline({ label, values }: { label: string; values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 600;
  const height = 60;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return x.toFixed(1) + "," + y.toFixed(1);
  });
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
        <span>{label}</span>
        <span className="font-latin text-text-faint">
          {min.toFixed(0)} → {max.toFixed(0)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-12"
        role="img"
        aria-label={label}
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="sparkGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#FF006E" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
