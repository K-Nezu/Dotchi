"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ResultBarProps {
  label: string;
  imageUrl?: string | null;
  count: number;
  total: number;
  isWinner: boolean;
  isSelected: boolean;
  isPosterChoice?: boolean;
}

export default function ResultBar({
  label,
  imageUrl,
  count,
  total,
  isWinner,
  isSelected,
  isPosterChoice,
}: ResultBarProps) {
  const targetPercentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercentage(Math.round(targetPercentage * eased));

      if (current >= steps) {
        setDisplayPercentage(targetPercentage);
        clearInterval(timer);
        setShowBadge(true);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetPercentage]);

  const winnerClass = isWinner ? "" : "opacity-50 grayscale-[30%]";

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all duration-500 ${
        isSelected ? "border-foreground" : "border-transparent"
      } ${winnerClass}`}
    >
      {imageUrl ? (
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 256px"
          />
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-white ${
            isWinner ? "bg-black/30" : "bg-black/50"
          }`}>
            <span className={`font-bold tabular-nums ${
              isWinner ? "text-4xl" : "text-2xl text-white/70"
            }`}>
              {displayPercentage}%
            </span>
          </div>
          {isWinner && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-foreground/15 transition-all duration-1000 ease-out"
              style={{ height: `${displayPercentage}%` }}
            />
          )}
        </div>
      ) : (
        <div className="aspect-[4/3] bg-neutral-50 flex flex-col items-center justify-center p-4 relative">
          <p className={`text-sm font-medium mb-2 line-clamp-2 text-center relative z-10 ${
            isWinner ? "text-foreground" : "text-muted"
          }`}>
            {label}
          </p>
          <span className={`font-bold tabular-nums relative z-10 ${
            isWinner ? "text-3xl text-foreground" : "text-xl text-muted"
          }`}>
            {displayPercentage}%
          </span>
          {isWinner && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-foreground/5 transition-all duration-1000 ease-out"
              style={{ height: `${displayPercentage}%` }}
            />
          )}
        </div>
      )}
      {/* Winner badge */}
      {isWinner && total > 0 && (
        <div
          className={`absolute top-2 right-2 bg-foreground text-white text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-500 ${
            showBadge
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
          }`}
        >
          多数派
        </div>
      )}
      {/* Poster's choice indicator */}
      {isPosterChoice && showBadge && (
        <div className="absolute bottom-2 right-2 bg-foreground/50 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-fade-in">
          本人選択
        </div>
      )}
      {/* User's choice */}
      {isSelected && showBadge && (
        <div className="absolute bottom-2 left-2 bg-foreground text-white text-xs px-2 py-0.5 rounded-full animate-fade-in">
          あなた
        </div>
      )}
    </div>
  );
}
