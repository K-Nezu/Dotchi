"use client";

import { useEffect, useState } from "react";

interface ResultBarProps {
  label: string;
  imageUrl?: string | null;
  count: number;
  total: number;
  isWinner: boolean;
  isSelected: boolean;
  isPosterChoice?: boolean;
  previewUrl?: string | null;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

export default function ResultBar({
  label,
  imageUrl,
  count,
  total,
  isWinner,
  isSelected,
  isPosterChoice,
  previewUrl,
  isPlaying,
  onPlayToggle,
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

  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 ${
        isWinner ? "" : "opacity-50 grayscale-[30%]"
      }`}
    >
      {imageUrl ? (
        <div className="relative aspect-square">
          <img
            src={imageUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
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
              className="absolute bottom-0 left-0 right-0 bg-white/15 transition-all duration-1000 ease-out"
              style={{ height: `${displayPercentage}%` }}
            />
          )}
        </div>
      ) : (
        <div className="aspect-square bg-neutral-50 flex flex-col items-center justify-center p-4 relative">
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

      {/* Play button for music */}
      {previewUrl && (
        <button
          type="button"
          onClick={onPlayToggle}
          className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-90 transition-all z-10"
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground animate-fade-in" />
      )}

      {/* Winner badge */}
      {isWinner && total > 0 && (
        <div
          className={`absolute top-2.5 right-2.5 bg-white/90 text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm transition-all duration-500 ${
            showBadge ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          多数派
        </div>
      )}

      {/* Poster's choice */}
      {isPosterChoice && showBadge && (
        <div className="absolute bottom-3 right-2.5 bg-white/70 text-foreground/70 text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm animate-fade-in">
          本人
        </div>
      )}

      {/* User's choice */}
      {isSelected && showBadge && (
        <div className="absolute bottom-3 left-2.5 bg-white/90 text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm animate-fade-in">
          あなた
        </div>
      )}
    </div>
  );
}
