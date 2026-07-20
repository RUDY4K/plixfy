"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { trackEvent, trackEventOnce } from "@/components/GoogleAnalytics";
import type { Locale } from "@/lib/i18n";

type PrototypeId = "lane-rush" | "target-pop" | "color-clash";
type GameStatus = "idle" | "playing" | "over";

const text = {
  ar: {
    eyebrow: "مختبر Plixfy",
    title: "ساعدنا نختار لعبتنا الأولى",
    intro: "جرّب الألعاب الثلاث. نحن نقيس اللعب والإعادة فقط لمعرفة أي فكرة تحبها أكثر.",
    play: "جرّب الآن",
    back: "اختيار لعبة أخرى",
    start: "ابدأ اللعب",
    replay: "العب مرة أخرى",
    score: "النتيجة",
    time: "الوقت",
    gameOver: "انتهت الجولة!",
    laneTitle: "هروب النيون",
    laneDescription: "بدّل المسار وتفادى الحواجز القادمة.",
    laneHelp: "استخدم السهمين أو اضغط جانبي الملعب.",
    targetTitle: "صيد البرق",
    targetDescription: "المس الهدف المتحرك بأسرع ما تستطيع.",
    targetHelp: "لديك 20 ثانية. كل لمسة صحيحة بنقطة.",
    colorTitle: "صراع الألوان",
    colorDescription: "اختر لون الكلمة، وليس معنى الكلمة.",
    colorHelp: "ركز على لون الحروف واضغط اللون المطابق.",
  },
  en: {
    eyebrow: "Plixfy Lab",
    title: "Help choose our first original game",
    intro: "Try all three. We only measure play and replay signals to learn which idea you enjoy most.",
    play: "Play now",
    back: "Choose another game",
    start: "Start game",
    replay: "Play again",
    score: "Score",
    time: "Time",
    gameOver: "Round over!",
    laneTitle: "Neon Escape",
    laneDescription: "Switch lanes and dodge incoming barriers.",
    laneHelp: "Use the arrows or tap either side of the arena.",
    targetTitle: "Lightning Hunt",
    targetDescription: "Catch the moving target as fast as you can.",
    targetHelp: "You have 20 seconds. Every hit scores one point.",
    colorTitle: "Color Clash",
    colorDescription: "Pick the word's color, not what the word says.",
    colorHelp: "Focus on the letter color and tap its match.",
  },
} as const;

function useRoundMetrics(gameId: PrototypeId) {
  const attempt = useRef(0);
  const startedAt = useRef(0);

  const startRound = useCallback(() => {
    attempt.current += 1;
    startedAt.current = Date.now();
    trackEvent(attempt.current === 1 ? "game_lab_start" : "game_lab_replay", {
      prototype_id: gameId,
      attempt: attempt.current,
    });
  }, [gameId]);

  const endRound = useCallback(
    (score: number) => {
      trackEvent("game_lab_round_end", {
        prototype_id: gameId,
        attempt: attempt.current,
        score,
        duration_seconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      });
    },
    [gameId],
  );

  return { startRound, endRound };
}

function RoundOverlay({
  status,
  score,
  onStart,
  locale,
}: {
  status: GameStatus;
  score: number;
  onStart: () => void;
  locale: Locale;
}) {
  const t = text[locale];
  if (status === "playing") return null;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-bg/85 p-6 text-center backdrop-blur-sm">
      <div>
        {status === "over" && (
          <>
            <p className="mb-2 text-xl font-bold">{t.gameOver}</p>
            <p className="mb-5 text-text-secondary">{t.score}: {score}</p>
          </>
        )}
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-primary px-7 py-3 font-bold text-white shadow-lg shadow-primary/30 active:scale-95"
        >
          {status === "over" ? t.replay : t.start}
        </button>
      </div>
    </div>
  );
}

type Obstacle = { id: number; lane: number; y: number };

function LaneRush({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [status, setStatus] = useState<GameStatus>("idle");
  const [lane, setLane] = useState(1);
  const laneRef = useRef(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const tick = useRef(0);
  const nextId = useRef(0);
  const { startRound, endRound } = useRoundMetrics("lane-rush");

  const move = (direction: -1 | 1) => {
    if (status !== "playing") return;
    setLane((current) => {
      const next = Math.max(0, Math.min(2, current + direction));
      laneRef.current = next;
      return next;
    });
  };

  const start = () => {
    laneRef.current = 1;
    scoreRef.current = 0;
    tick.current = 0;
    setLane(1);
    setScore(0);
    setObstacles([]);
    setStatus("playing");
    startRound();
  };

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => {
      tick.current += 1;
      setObstacles((current) => {
        const advanced = current.map((item) => ({ ...item, y: item.y + 5.5 }));
        const crashed = advanced.some(
          (item) => item.lane === laneRef.current && item.y >= 78 && item.y <= 94,
        );
        if (crashed) {
          window.clearInterval(timer);
          setStatus("over");
          endRound(scoreRef.current);
          return advanced;
        }
        const passed = advanced.filter((item) => item.y > 100).length;
        if (passed) {
          scoreRef.current += passed;
          setScore(scoreRef.current);
        }
        const visible = advanced.filter((item) => item.y <= 100);
        if (tick.current % 10 === 0) {
          visible.push({ id: nextId.current++, lane: Math.floor(Math.random() * 3), y: -12 });
        }
        return visible;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [status, endRound]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>{t.score}: {score}</span><span>{t.laneHelp}</span>
      </div>
      <div className="relative mx-auto h-[430px] max-w-sm overflow-hidden rounded-3xl border border-accent-2/30 bg-[linear-gradient(180deg,#110324,#250847)] touch-none">
        <RoundOverlay status={status} score={score} onStart={start} locale={locale} />
        {[1, 2].map((divider) => (
          <span key={divider} className="absolute inset-y-0 border-l border-dashed border-white/15" style={{ left: `${divider * 33.333}%` }} />
        ))}
        <button type="button" aria-label={locale === "ar" ? "تحرك يسارًا" : "Move left"} className="absolute inset-y-0 left-0 z-10 w-1/2" onClick={() => move(-1)} />
        <button type="button" aria-label={locale === "ar" ? "تحرك يمينًا" : "Move right"} className="absolute inset-y-0 right-0 z-10 w-1/2" onClick={() => move(1)} />
        {obstacles.map((item) => (
          <span
            key={item.id}
            className="absolute h-6 w-[24%] -translate-x-1/2 rounded-lg bg-danger shadow-[0_0_18px_rgba(255,61,127,.8)]"
            style={{ left: `${16.667 + item.lane * 33.333}%`, top: `${item.y}%` }}
          />
        ))}
        <span
          className="absolute bottom-7 h-12 w-[22%] -translate-x-1/2 rounded-t-2xl rounded-b-lg bg-accent-2 shadow-[0_0_24px_rgba(0,240,255,.75)] transition-[left] duration-100"
          style={{ left: `${16.667 + lane * 33.333}%` }}
        >
          <span className="absolute left-1/2 top-2 h-5 w-2/3 -translate-x-1/2 rounded-full bg-white/70" />
        </span>
      </div>
      <div className="mx-auto mt-3 flex max-w-sm gap-3" dir="ltr">
        <button type="button" onClick={() => move(-1)} className="grid min-h-14 flex-1 place-items-center rounded-2xl bg-surface-elevated active:scale-95" aria-label="Left"><ArrowLeft /></button>
        <button type="button" onClick={() => move(1)} className="grid min-h-14 flex-1 place-items-center rounded-2xl bg-surface-elevated active:scale-95" aria-label="Right"><ArrowRight /></button>
      </div>
    </div>
  );
}

function TargetPop({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const scoreRef = useRef(0);
  const { startRound, endRound } = useRoundMetrics("target-pop");

  const reposition = () => setTarget({ x: 12 + Math.random() * 76, y: 12 + Math.random() * 76 });
  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setTime(20);
    reposition();
    setStatus("playing");
    startRound();
  };

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setStatus("over");
          endRound(scoreRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, endRound]);

  const hit = () => {
    if (status !== "playing") return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    reposition();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>{t.score}: {score}</span><span>{t.time}: {time}</span>
      </div>
      <div className="relative mx-auto h-[430px] max-w-sm overflow-hidden rounded-3xl border border-secondary/30 bg-[radial-gradient(circle_at_center,rgba(212,255,0,.12),transparent_60%),#130527] touch-none">
        <RoundOverlay status={status} score={score} onStart={start} locale={locale} />
        {status === "playing" && (
          <button
            type="button"
            onClick={hit}
            aria-label={locale === "ar" ? "اضغط الهدف" : "Tap target"}
            className="absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-secondary text-2xl text-bg shadow-[0_0_30px_rgba(212,255,0,.8)] active:scale-75"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
          >
            ⚡
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-text-secondary">{t.targetHelp}</p>
    </div>
  );
}

const COLORS = [
  { id: "pink", ar: "وردي", en: "Pink", className: "bg-primary", text: "#FF006E" },
  { id: "cyan", ar: "سماوي", en: "Cyan", className: "bg-accent-2", text: "#00F0FF" },
  { id: "lime", ar: "أخضر", en: "Green", className: "bg-secondary", text: "#D4FF00" },
  { id: "purple", ar: "بنفسجي", en: "Purple", className: "bg-accent-3", text: "#A100F2" },
] as const;

function ColorClash({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [wordIndex, setWordIndex] = useState(0);
  const [inkIndex, setInkIndex] = useState(1);
  const scoreRef = useRef(0);
  const { startRound, endRound } = useRoundMetrics("color-clash");

  const nextPrompt = () => {
    const word = Math.floor(Math.random() * COLORS.length);
    let ink = Math.floor(Math.random() * COLORS.length);
    if (ink === word) ink = (ink + 1) % COLORS.length;
    setWordIndex(word);
    setInkIndex(ink);
  };
  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setTime(20);
    nextPrompt();
    setStatus("playing");
    startRound();
  };

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setStatus("over");
          endRound(scoreRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, endRound]);

  const answer = (index: number) => {
    if (status !== "playing") return;
    scoreRef.current = Math.max(0, scoreRef.current + (index === inkIndex ? 1 : -1));
    setScore(scoreRef.current);
    nextPrompt();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>{t.score}: {score}</span><span>{t.time}: {time}</span>
      </div>
      <div className="relative mx-auto flex h-[430px] max-w-sm flex-col items-center justify-center overflow-hidden rounded-3xl border border-primary/30 bg-[linear-gradient(145deg,#1b0935,#0c0319)] p-6">
        <RoundOverlay status={status} score={score} onStart={start} locale={locale} />
        <p className="mb-3 text-center text-sm text-text-secondary">{t.colorHelp}</p>
        <p className="mb-10 text-5xl font-black" style={{ color: COLORS[inkIndex].text }}>
          {COLORS[wordIndex][locale]}
        </p>
        <div className="grid w-full grid-cols-2 gap-3">
          {COLORS.map((color, index) => (
            <button
              key={color.id}
              type="button"
              onClick={() => answer(index)}
              className={`${color.className} min-h-16 rounded-2xl font-bold text-bg shadow-lg active:scale-95`}
            >
              {color[locale]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GameLab({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [active, setActive] = useState<PrototypeId | null>(null);
  const games = [
    { id: "lane-rush" as const, icon: "🚀", title: t.laneTitle, description: t.laneDescription, accent: "from-accent-2/25 to-accent-3/15" },
    { id: "target-pop" as const, icon: "⚡", title: t.targetTitle, description: t.targetDescription, accent: "from-secondary/20 to-accent-2/10" },
    { id: "color-clash" as const, icon: "🎨", title: t.colorTitle, description: t.colorDescription, accent: "from-primary/25 to-accent-3/15" },
  ];

  useEffect(() => {
    trackEventOnce("game-lab-view", "game_lab_view", { experiment: "original-game-v1" });
  }, []);

  const choose = (id: PrototypeId, position: number) => {
    trackEvent("game_lab_select", { prototype_id: id, card_position: position + 1 });
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (active) {
    const selected = games.find((game) => game.id === active)!;
    return (
      <section className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <button type="button" onClick={() => setActive(null)} className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white">
          <X size={18} /> {t.back}
        </button>
        <header className="mb-5 text-center">
          <span className="text-4xl" aria-hidden="true">{selected.icon}</span>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">{selected.title}</h1>
          <p className="mt-2 text-sm text-text-secondary">{selected.description}</p>
        </header>
        {active === "lane-rush" && <LaneRush locale={locale} />}
        {active === "target-pop" && <TargetPop locale={locale} />}
        {active === "color-clash" && <ColorClash locale={locale} />}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-14">
      <header className="mx-auto mb-8 max-w-2xl text-center">
        <p className="mb-2 text-sm font-bold text-accent-2">{t.eyebrow}</p>
        <h1 className="text-3xl font-black md:text-5xl">{t.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">{t.intro}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-3">
        {games.map((game, index) => (
          <article key={game.id} className={`flex min-h-64 flex-col rounded-3xl border border-white/10 bg-gradient-to-br ${game.accent} p-6`}>
            <span className="text-5xl" aria-hidden="true">{game.icon}</span>
            <h2 className="mt-5 text-xl font-black">{game.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{game.description}</p>
            <button type="button" onClick={() => choose(game.id, index)} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white font-bold text-bg active:scale-95">
              {t.play} <RotateCcw size={17} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
