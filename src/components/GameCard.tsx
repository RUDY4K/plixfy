import Image from "next/image";
import Link from "next/link";
import { Crown, Flame, Sparkles } from "lucide-react";

export type GameBadge = "hot" | "new" | "top" | null;

export interface GameCardProps {
  title: string;
  thumbnail: string;
  slug: string;
  badge?: GameBadge;
  category?: string;
}

export default function GameCard(props: GameCardProps) {
  const { title, thumbnail, slug, badge, category } = props;

  const ariaLabel = category ? title + ", " + category : title;

  return (
    <Link
      href={"/play/" + slug}
      className="group relative block transition-transform duration-200 hover:-translate-y-1 active:scale-[0.94]"
      aria-label={ariaLabel}
    >
      <div
        className="game-card-glow absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-200 -z-10"
        style={{ background: "var(--gradient-card-hover)" }}
        aria-hidden="true"
      />
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_-30px_60px_rgba(0,0,0,0.35)]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 33vw, 180px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          unoptimized
        />
        {badge ? <Badge type={badge} /> : null}
      </div>

      <div className="mt-2 px-1">
        <h3
          dir="ltr"
          className="block text-[15px] font-semibold text-text-primary truncate font-latin tracking-tight text-right group-hover:text-primary transition-colors"
        >
          {title}
        </h3>
        {category ? (
          <p dir="rtl" className="text-xs text-text-faint truncate mt-0.5 text-right">
            {category}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function Badge(props: { type: "hot" | "new" | "top" }) {
  const baseClass =
    "absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-[0_2px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]";

  if (props.type === "hot") {
    return (
      <div
        className={
          baseClass +
          " bg-gradient-to-br from-[#F87171] to-[#FB923C] text-white badge-pulse"
        }
      >
        <Flame className="w-3 h-3" aria-hidden="true" />
        <span>HOT</span>
      </div>
    );
  }

  if (props.type === "new") {
    return (
      <div
        className={
          baseClass + " bg-gradient-to-br from-[#34D399] to-[#10B981] text-bg"
        }
      >
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        <span>جديد</span>
      </div>
    );
  }

  return (
    <div
      className={
        baseClass + " bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-bg"
      }
    >
      <Crown className="w-3 h-3" aria-hidden="true" />
      <span>TOP</span>
    </div>
  );
}
