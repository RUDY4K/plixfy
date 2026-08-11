"use client";

import { useEffect } from "react";
import { usePlayerData } from "@/components/PlayerDataProvider";

export default function TrackGamePlay({ slug }: { slug: string }) {
  const { recordGamePlay } = usePlayerData();
  useEffect(() => recordGamePlay(slug), [recordGamePlay, slug]);
  return null;
}
