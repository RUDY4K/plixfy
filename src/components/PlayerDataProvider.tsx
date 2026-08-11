"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const FAVORITES_KEY = "plixfy_favorites_v1";
const RECENT_KEY = "plixfy_recent_v1";
const MAX_RECENT = 12;

export interface RecentGame {
  slug: string;
  playedAt: string;
}

interface PlayerDataContextValue {
  user: User | null;
  authLoading: boolean;
  authConfigured: boolean;
  favorites: readonly string[];
  recentGames: readonly RecentGame[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  recordGamePlay: (slug: string) => void;
  signOut: () => Promise<void>;
}

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null);

function readFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").slice(0, 100)
      : [];
  } catch {
    return [];
  }
}

function readRecent(): RecentGame[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (item): item is RecentGame =>
              typeof item?.slug === "string" && typeof item?.playedAt === "string",
          )
          .slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function mergeRecent(...lists: readonly RecentGame[][]): RecentGame[] {
  const latest = new Map<string, RecentGame>();
  for (const list of lists) {
    for (const item of list) {
      const previous = latest.get(item.slug);
      if (!previous || item.playedAt > previous.playedAt) latest.set(item.slug, item);
    }
  }
  return [...latest.values()]
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .slice(0, MAX_RECENT);
}

export default function PlayerDataProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  const syncCloudData = useCallback(
    async (activeUser: User, localFavorites: string[], localRecent: RecentGame[]) => {
      if (!supabase) return;

      const [favoriteResult, recentResult] = await Promise.all([
        supabase
          .from("user_favorites")
          .select("game_slug")
          .eq("user_id", activeUser.id),
        supabase
          .from("recently_played")
          .select("game_slug, played_at")
          .eq("user_id", activeUser.id)
          .order("played_at", { ascending: false })
          .limit(MAX_RECENT),
      ]);

      const cloudFavorites = (favoriteResult.data ?? []).map((row) => row.game_slug);
      const mergedFavorites = [...new Set([...localFavorites, ...cloudFavorites])].slice(0, 100);
      const cloudRecent = (recentResult.data ?? []).map((row) => ({
        slug: row.game_slug,
        playedAt: row.played_at,
      }));
      const mergedRecent = mergeRecent(localRecent, cloudRecent);

      setFavorites(mergedFavorites);
      setRecentGames(mergedRecent);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavorites));
      localStorage.setItem(RECENT_KEY, JSON.stringify(mergedRecent));

      if (localFavorites.length > 0) {
        await supabase.from("user_favorites").upsert(
          localFavorites.map((slug) => ({ user_id: activeUser.id, game_slug: slug })),
          { onConflict: "user_id,game_slug" },
        );
      }
      if (localRecent.length > 0) {
        await supabase.from("recently_played").upsert(
          localRecent.map((item) => ({
            user_id: activeUser.id,
            game_slug: item.slug,
            played_at: item.playedAt,
          })),
          { onConflict: "user_id,game_slug" },
        );
      }
    },
    [supabase],
  );

  useEffect(() => {
    const localFavorites = readFavorites();
    const localRecent = readRecent();
    setFavorites(localFavorites);
    setRecentGames(localRecent);

    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setAuthLoading(false);
      if (data.user) void syncCloudData(data.user, localFavorites, localRecent);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) void syncCloudData(nextUser, readFavorites(), readRecent());
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncCloudData]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      setFavorites((current) => {
        const exists = current.includes(slug);
        const next = exists ? current.filter((item) => item !== slug) : [slug, ...current];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));

        if (supabase && user) {
          if (exists) {
            void supabase
              .from("user_favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("game_slug", slug);
          } else {
            void supabase
              .from("user_favorites")
              .upsert({ user_id: user.id, game_slug: slug }, { onConflict: "user_id,game_slug" });
          }
        }
        return next;
      });
    },
    [supabase, user],
  );

  const recordGamePlay = useCallback(
    (slug: string) => {
      const item = { slug, playedAt: new Date().toISOString() };
      setRecentGames((current) => {
        const next = mergeRecent([item], current);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
      if (supabase && user) {
        void supabase.from("recently_played").upsert(
          { user_id: user.id, game_slug: slug, played_at: item.playedAt },
          { onConflict: "user_id,game_slug" },
        );
      }
    },
    [supabase, user],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo<PlayerDataContextValue>(
    () => ({
      user,
      authLoading,
      authConfigured: Boolean(supabase),
      favorites,
      recentGames,
      isFavorite: (slug) => favorites.includes(slug),
      toggleFavorite,
      recordGamePlay,
      signOut,
    }),
    [user, authLoading, supabase, favorites, recentGames, toggleFavorite, recordGamePlay, signOut],
  );

  return <PlayerDataContext.Provider value={value}>{children}</PlayerDataContext.Provider>;
}

export function usePlayerData(): PlayerDataContextValue {
  const value = useContext(PlayerDataContext);
  if (!value) throw new Error("usePlayerData must be used inside PlayerDataProvider");
  return value;
}
