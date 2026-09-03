"use client";

import Image, { type ImageProps } from "next/image";
import { Gamepad2 } from "lucide-react";
import { useEffect, useState } from "react";

type GameArtworkProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallbackSrc?: string;
};

interface ArtworkAttempt {
  src: string;
  direct: boolean;
}

function createAttempt(src: string): ArtworkAttempt {
  let direct = false;

  try {
    direct = new URL(src).hostname === "static.playgama.com";
  } catch {
    // Relative site assets can continue through the Next.js image optimizer.
  }

  return { src, direct };
}

export default function GameArtwork({ src, fallbackSrc, alt, className, ...props }: GameArtworkProps) {
  const [attempt, setAttempt] = useState<ArtworkAttempt>(() => createAttempt(src));

  useEffect(() => {
    setAttempt(createAttempt(src));
  }, [src]);

  if (!attempt.src) {
    return (
      <span
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
        className={`${props.fill ? "absolute inset-0" : ""} ${className ?? ""} grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(118,87,255,.25),transparent_44%),linear-gradient(145deg,#121225,#090913)] text-text-faint`}
      >
        <span className="flex flex-col items-center gap-2">
          <Gamepad2 className="h-7 w-7 text-accent-2/65" aria-hidden="true" />
          <span className="font-latin text-[10px] font-black uppercase tracking-[.16em]">Plixfy</span>
        </span>
      </span>
    );
  }

  return (
    <Image
      {...props}
      src={attempt.src}
      alt={alt}
      className={className}
      unoptimized={attempt.direct}
      onError={() => {
        if (!attempt.direct) {
          setAttempt({ src: attempt.src, direct: true });
          return;
        }
        if (fallbackSrc && attempt.src !== fallbackSrc) {
          setAttempt(createAttempt(fallbackSrc));
          return;
        }
        setAttempt({ src: "", direct: false });
      }}
    />
  );
}
