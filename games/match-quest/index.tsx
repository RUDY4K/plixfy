'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Board from './components/Board';
import Stats from './components/Stats';
import DifficultyPicker from './components/DifficultyPicker';
import ResultsModal from './components/ResultsModal';
import Confetti from './components/Confetti';
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  MISMATCH_HIDE_MS,
  calcScore,
  calcStars,
  type Difficulty,
} from './lib/constants';
import { buildDeck, type Card } from './lib/deck';
import { sounds } from './lib/audio';
import { loadBest, recordBest } from './lib/highscore';
import {
  trackGameStart,
  trackGameEnd,
  trackHighScore,
  trackShare,
} from '@/lib/analytics';
import { showInterstitial } from '@/lib/ads';

type Phase = 'idle' | 'playing' | 'won';

interface State {
  phase: Phase;
  difficulty: Difficulty;
  cards: Card[];
  moves: number;
  flippedIds: number[];
  shakeIds: Set<number>;
  inputLocked: boolean;
  startedAt: number;
  finishedAt: number | null;
}

type Action =
  | { type: 'START'; difficulty: Difficulty; startedAt: number }
  | { type: 'FLIP'; id: number }
  | { type: 'LOCK' }
  | { type: 'RESOLVE_MATCH' }
  | { type: 'RESOLVE_MISMATCH' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'COMPLETE'; finishedAt: number };

function initialState(difficulty: Difficulty): State {
  return {
    phase: 'idle',
    difficulty,
    cards: [],
    moves: 0,
    flippedIds: [],
    shakeIds: new Set<number>(),
    inputLocked: false,
    startedAt: 0,
    finishedAt: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        cards: buildDeck(action.difficulty),
        moves: 0,
        flippedIds: [],
        shakeIds: new Set<number>(),
        inputLocked: false,
        startedAt: action.startedAt,
        finishedAt: null,
      };
    case 'FLIP': {
      if (state.inputLocked) return state;
      const target = state.cards.find((c) => c.id === action.id);
      if (!target || target.flipped || target.matched) return state;
      const nextCards = state.cards.map((c) =>
        c.id === action.id ? { ...c, flipped: true } : c
      );
      const nextFlipped = [...state.flippedIds, action.id];
      const isSecond = nextFlipped.length === 2;
      return {
        ...state,
        cards: nextCards,
        flippedIds: nextFlipped,
        moves: isSecond ? state.moves + 1 : state.moves,
      };
    }
    case 'LOCK':
      return { ...state, inputLocked: true };
    case 'RESOLVE_MATCH': {
      const ids = new Set(state.flippedIds);
      return {
        ...state,
        cards: state.cards.map((c) => (ids.has(c.id) ? { ...c, matched: true } : c)),
        flippedIds: [],
        inputLocked: false,
      };
    }
    case 'RESOLVE_MISMATCH': {
      const ids = new Set(state.flippedIds);
      return {
        ...state,
        cards: state.cards.map((c) => (ids.has(c.id) ? { ...c, flipped: false } : c)),
        flippedIds: [],
        shakeIds: new Set<number>(),
        inputLocked: false,
      };
    }
    case 'CLEAR_SHAKE':
      return { ...state, shakeIds: new Set<number>() };
    case 'COMPLETE':
      return { ...state, phase: 'won', finishedAt: action.finishedAt };
    default:
      return state;
  }
}

export default function MatchQuest() {
  const [pickedDifficulty, setPickedDifficulty] = useState<Difficulty>('easy');
  const [state, dispatch] = useReducer(reducer, 'easy', initialState);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>(() => ({
    easy: 0,
    medium: 0,
    hard: 0,
  }));
  const [completionInfo, setCompletionInfo] = useState<{
    score: number;
    best: number;
    isNewBest: boolean;
    stars: 1 | 2 | 3;
  } | null>(null);
  const adFiredRef = useRef(false);

  // Hydrate best scores after mount (avoids SSR mismatch)
  useEffect(() => {
    setBestScores({
      easy: loadBest('easy'),
      medium: loadBest('medium'),
      hard: loadBest('hard'),
    });
  }, []);

  // Timer
  useEffect(() => {
    if (state.phase !== 'playing') return;
    setElapsedSec(Math.floor((Date.now() - state.startedAt) / 1000));
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - state.startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [state.phase, state.startedAt]);

  // Match / mismatch resolution
  useEffect(() => {
    if (state.flippedIds.length !== 2) return;
    const [aId, bId] = state.flippedIds;
    const a = state.cards.find((c) => c.id === aId);
    const b = state.cards.find((c) => c.id === bId);
    if (!a || !b) return;

    dispatch({ type: 'LOCK' });

    if (a.emoji === b.emoji) {
      sounds.match();
      const t = window.setTimeout(() => dispatch({ type: 'RESOLVE_MATCH' }), 350);
      return () => window.clearTimeout(t);
    }
    sounds.mismatch();
    // Tag both as shaking briefly
    state.shakeIds.add(aId);
    state.shakeIds.add(bId);
    const t = window.setTimeout(() => dispatch({ type: 'RESOLVE_MISMATCH' }), MISMATCH_HIDE_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.flippedIds.length]);

  // Win detection
  useEffect(() => {
    if (state.phase !== 'playing') return;
    if (state.cards.length === 0) return;
    if (!state.cards.every((c) => c.matched)) return;

    const finishedAt = Date.now();
    dispatch({ type: 'COMPLETE', finishedAt });

    const duration = Math.max(1, Math.floor((finishedAt - state.startedAt) / 1000));
    const pairs = DIFFICULTIES[state.difficulty].pairs;
    const score = Math.max(0, calcScore(pairs, state.moves, duration));
    const stars = calcStars(pairs, score);
    const previousBest = loadBest(state.difficulty);
    const newBest = recordBest(state.difficulty, score);
    const isNewBest = score > previousBest && score === newBest;

    setBestScores((prev) => ({ ...prev, [state.difficulty]: newBest }));
    setCompletionInfo({ score, best: newBest, isNewBest, stars });

    sounds.win();
    trackGameEnd('match-quest', score, duration, 'complete');
    if (isNewBest) trackHighScore('match-quest', score);

    // *** AD BREAK POINT ***
    // Stub today; swaps to real provider in Prompt 8.
    if (!adFiredRef.current) {
      adFiredRef.current = true;
      void showInterstitial('next', 'match-quest');
    }
  }, [state.cards, state.phase, state.difficulty, state.moves, state.startedAt]);

  const startGame = useCallback(
    (difficulty: Difficulty) => {
      adFiredRef.current = false;
      setCompletionInfo(null);
      setElapsedSec(0);
      dispatch({ type: 'START', difficulty, startedAt: Date.now() });
      trackGameStart('match-quest', difficulty);
    },
    []
  );

  const handleFlip = useCallback(
    (id: number) => {
      if (state.inputLocked) return;
      sounds.flip();
      dispatch({ type: 'FLIP', id });
    },
    [state.inputLocked]
  );

  const liveScore = useMemo(() => {
    if (state.phase !== 'playing') return 0;
    const pairs = DIFFICULTIES[state.difficulty].pairs;
    return Math.max(0, calcScore(pairs, state.moves, elapsedSec));
  }, [state.phase, state.difficulty, state.moves, elapsedSec]);

  const handleShare = useCallback(async () => {
    if (!completionInfo) return;
    trackShare('match-quest', 'clipboard');
    const msg = `I scored ${completionInfo.score} on Match Quest (${DIFFICULTIES[state.difficulty].label}). Can you beat it?`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Match Quest', text: msg });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
    } catch {
      /* dismissed */
    }
  }, [completionInfo, state.difficulty]);

  const handleNextDifficulty = useCallback(() => {
    const idx = DIFFICULTY_ORDER.indexOf(state.difficulty);
    const next = DIFFICULTY_ORDER[idx + 1] ?? state.difficulty;
    startGame(next);
  }, [state.difficulty, startGame]);

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {state.phase === 'idle' && (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-400">Match Quest</p>
            <h2 className="mt-1 text-3xl font-extrabold text-white">Memory Match</h2>
            <p className="mt-2 max-w-md text-sm text-neutral-400">
              Flip pairs. Match them all. Fewer moves and faster times earn more stars.
            </p>
          </div>

          <div className="w-full max-w-md">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
              Pick a difficulty
            </p>
            <DifficultyPicker
              selected={pickedDifficulty}
              onSelect={setPickedDifficulty}
              size="large"
            />
            <p className="mt-3 text-xs text-neutral-500">
              Best:{' '}
              <span className="font-semibold text-yellow-400">
                {bestScores[pickedDifficulty]}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => startGame(pickedDifficulty)}
            className="rounded-lg bg-violet-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
          >
            Start game →
          </button>
        </div>
      )}

      {(state.phase === 'playing' || state.phase === 'won') && (
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <DifficultyPicker
              selected={state.difficulty}
              onSelect={(d) => startGame(d)}
            />
          </div>
          <div className="mb-3">
            <Stats moves={state.moves} seconds={elapsedSec} score={liveScore} />
          </div>
          <Board
            cards={state.cards}
            cols={DIFFICULTIES[state.difficulty].cols}
            onFlip={handleFlip}
            shakeIds={state.shakeIds}
            inputDisabled={state.inputLocked || state.phase === 'won'}
          />

          <Confetti active={state.phase === 'won'} />

          {state.phase === 'won' && completionInfo && (
            <ResultsModal
              difficulty={state.difficulty}
              score={completionInfo.score}
              best={completionInfo.best}
              isNewBest={completionInfo.isNewBest}
              stars={completionInfo.stars}
              moves={state.moves}
              seconds={Math.max(
                1,
                Math.floor((state.finishedAt! - state.startedAt) / 1000)
              )}
              onPlayAgain={() => startGame(state.difficulty)}
              onNextDifficulty={handleNextDifficulty}
              onShare={handleShare}
            />
          )}
        </div>
      )}
    </div>
  );
}
