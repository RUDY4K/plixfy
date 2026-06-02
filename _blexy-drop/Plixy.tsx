"use client";

// src/components/Plixy.tsx
// Floating Blexy mascot launcher + AI chat concierge for plixfy.com
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Send } from "lucide-react";
import { buildBlexy, type BlexyExpr } from "@/lib/blexy";

type Msg = { role: "user" | "assistant"; content: string };
type GameChip = { slug: string; title: string };

const GREETING =
  "هلا والله! أنا بلكسي، مساعدك للألعاب في بليكسفاي. قول لي مزاجك أو وش تحب تلعب اليوم وأرشّح لك على طول.";

function Blexy({ expr, head, className }: { expr: BlexyExpr; head?: boolean; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: "block", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: buildBlexy(expr, { head }) }}
    />
  );
}

export default function Plixy() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Record<number, GameChip[]>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expr, setExpr] = useState<BlexyExpr>("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const talkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seed greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: GREETING }]);
      setExpr("greeting");
      const t = setTimeout(() => setExpr("idle"), 2200);
      return () => clearTimeout(t);
    }
  }, [open, messages.length]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setExpr("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply: string = data?.reply || "صار خطأ بسيط، جرّب مرة ثانية.";
      const idx = next.length; // index of the new assistant message
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (Array.isArray(data?.games) && data.games.length) {
        setChips((c) => ({ ...c, [idx]: data.games }));
      }
      setExpr("talking");
      if (talkTimer.current) clearTimeout(talkTimer.current);
      talkTimer.current = setTimeout(() => setExpr("idle"), 2600);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "ما قدرت أوصل للسيرفر الحين. جرّب بعد شوي." }]);
      setExpr("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          aria-label="افتح بلكسي"
          onClick={() => setOpen(true)}
          className="fixed left-4 bottom-24 md:bottom-6 z-50 h-16 w-16 rounded-full overflow-visible"
        >
          <span className="absolute inset-0 rounded-full bx-launch-pulse" />
          <span className="absolute inset-0 rounded-full border border-cyan-400/45 bg-[radial-gradient(circle_at_35%_30%,rgba(34,211,238,0.25),rgba(129,140,248,0.10)_60%,rgba(26,29,40,0.72))] shadow-[0_8px_30px_rgba(34,211,238,0.30),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm" />
          <Blexy expr="idle" head className="absolute inset-[7px]" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#12141C]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]
                     left-3 right-3 top-16 bottom-24
                     md:left-6 md:right-auto md:top-auto md:bottom-6 md:h-[560px] md:w-[380px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-b from-cyan-400/10 to-transparent">
            <div className="relative h-11 w-11 flex-none rounded-full border border-cyan-400/40 bg-[radial-gradient(circle_at_40%_35%,rgba(34,211,238,0.20),rgba(26,29,40,0.9))] overflow-visible">
              <Blexy expr={expr} head className="absolute inset-[4px]" />
              <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#12141C]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[15px] text-[#F4F5FA]">بلكسي</span>
              <span className="text-xs text-cyan-300 flex items-center gap-1.5 min-h-[16px]">
                {loading ? (
                  <span className="bx-typing inline-flex gap-1">
                    <i /> <i /> <i />
                  </span>
                ) : (
                  "مساعدك للألعاب"
                )}
              </span>
            </div>
            <button
              aria-label="إغلاق"
              onClick={() => setOpen(false)}
              className="ms-auto text-white/50 hover:text-white/90 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div
                  className={
                    m.role === "user"
                      ? "self-end max-w-[80%] rounded-2xl rounded-ee-md bg-cyan-500/90 text-[#06222b] px-3.5 py-2.5 text-[14px]"
                      : "self-start max-w-[82%] rounded-2xl rounded-es-md bg-white/5 border border-white/10 text-[#E6E8F0] px-3.5 py-2.5 text-[14px] whitespace-pre-wrap"
                  }
                >
                  {m.content}
                </div>
                {chips[i]?.length ? (
                  <div className="self-start flex flex-wrap gap-2 max-w-[90%]">
                    {chips[i].map((g) => (
                      <Link
                        key={g.slug}
                        href={"/play/" + g.slug}
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-[12.5px] text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                      >
                        ▶ {g.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="self-start rounded-2xl rounded-es-md bg-white/5 border border-white/10 px-4 py-3">
                <span className="bx-typing inline-flex gap-1">
                  <i /> <i /> <i />
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="اكتب لبلكسي..."
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-[14px] text-[#F4F5FA] placeholder:text-white/35 outline-none focus:border-cyan-400/50 focus:bg-white/[0.07] transition-colors"
            />
            <button
              aria-label="إرسال"
              onClick={send}
              disabled={loading || !input.trim()}
              className="h-10 w-10 flex-none rounded-full bg-cyan-500 text-[#06222b] grid place-items-center disabled:opacity-40 transition-opacity"
            >
              <Send size={18} className="-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
