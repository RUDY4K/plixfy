"use client";

export const GAME_START_EVENT = "plixfy:game-start";

interface PlayNowButtonProps {
  slug: string;
  href: string;
  label: string;
  ariaLabel: string;
}

export default function PlayNowButton({
  slug,
  href,
  label,
  ariaLabel,
}: PlayNowButtonProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent(GAME_START_EVENT, { detail: { slug } }),
        );
      }}
      className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-[#090913] shadow-[0_14px_35px_rgba(255,255,255,.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2"
      aria-label={ariaLabel}
      data-game-slug={slug}
      data-placement="play-cta"
    >
      {label}
    </a>
  );
}
