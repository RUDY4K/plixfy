/**
 * Hand-maintained schema types mirroring supabase/migrations/0001_initial.sql.
 *
 * When you've actually pointed Supabase at a real project, regenerate with:
 *   npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.gen.ts
 *
 * The `Relationships: []` on every table and the bottom-level `CompositeTypes`
 * are required by @supabase/supabase-js v2.x for `.insert()` / `.upsert()`
 * type-checking to function — without them the inferred row type collapses
 * to `never[]`.
 */

export type UserRow = {
  id: string;
  clerk_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};
export type ScoreRow = {
  id: number;
  user_id: string;
  game_slug: string;
  score: number;
  created_at: string;
};
export type CommentRow = {
  id: number;
  user_id: string;
  game_slug: string;
  text: string;
  reports: number;
  hidden: boolean;
  created_at: string;
};
export type CommentVoteRow = {
  comment_id: number;
  user_id: string;
  vote: 'up' | 'down';
  created_at: string;
};
export type LikeRow = {
  user_id: string;
  game_slug: string;
  vote: 'up' | 'down';
  created_at: string;
};
export type FavoriteRow = {
  user_id: string;
  game_slug: string;
  created_at: string;
};
export type FriendshipRow = {
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};
export type ActivityRow = {
  id: number;
  user_id: string;
  verb: 'scored' | 'commented' | 'liked' | 'favorited';
  game_slug: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type WithOptional<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  { [K in Optional]?: Row[K] };

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: WithOptional<UserRow, 'id' | 'created_at'>;
        Update: Partial<UserRow>;
        Relationships: [];
      };
      scores: {
        Row: ScoreRow;
        Insert: WithOptional<ScoreRow, 'id' | 'created_at'>;
        Update: Partial<ScoreRow>;
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: WithOptional<CommentRow, 'id' | 'reports' | 'hidden' | 'created_at'>;
        Update: Partial<CommentRow>;
        Relationships: [];
      };
      comment_votes: {
        Row: CommentVoteRow;
        Insert: WithOptional<CommentVoteRow, 'created_at'>;
        Update: Partial<CommentVoteRow>;
        Relationships: [];
      };
      likes: {
        Row: LikeRow;
        Insert: WithOptional<LikeRow, 'created_at'>;
        Update: Partial<LikeRow>;
        Relationships: [];
      };
      favorites: {
        Row: FavoriteRow;
        Insert: WithOptional<FavoriteRow, 'created_at'>;
        Update: Partial<FavoriteRow>;
        Relationships: [];
      };
      friendships: {
        Row: FriendshipRow;
        Insert: WithOptional<FriendshipRow, 'status' | 'created_at'>;
        Update: Partial<FriendshipRow>;
        Relationships: [];
      };
      activity: {
        Row: ActivityRow;
        Insert: WithOptional<ActivityRow, 'id' | 'payload' | 'created_at'>;
        Update: Partial<ActivityRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
