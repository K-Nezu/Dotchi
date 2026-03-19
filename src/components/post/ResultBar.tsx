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
}

export default function ResultBar({
  label,
  imageUrl,
  count,
  total,
  isWinner,
  isSelected,
}: ResultBarProps) {
  const targetPercentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    // Animate percentage from 0 to target
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercentage(Math.round(targetPercentage * eased));

      if (current >= steps) {
        setDisplayPercentage(targetPercentage);
        clearInterval(timer);
        // Show badge after gauge animation completes
        setShowBadge(true);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetPercentage]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isSelected ? "border-primary" : "border-transparent"
      }`}
    >
      {imageUrl ? (
        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 256px"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
            <span className="text-3xl font-bold tabular-nums">
              {displayPercentage}%
            </span>
            <span className="text-xs mt-1">{count}票</span>
          </div>
          {/* Gauge overlay from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all duration-1000 ease-out"
            style={{ height: `${displayPercentage}%` }}
          />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-primary-light/40 to-secondary/40 flex flex-col items-center justify-center p-4 relative">
          <p className="text-sm font-medium text-foreground mb-2 line-clamp-2 text-center relative z-10">
            {label}
          </p>
          <span className="text-2xl font-bold text-foreground tabular-nums relative z-10">
            {displayPercentage}%
          </span>
          <span className="text-xs text-muted mt-1 relative z-10">
            {count}票
          </span>
          {/* Gauge fill from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all duration-1000 ease-out"
            style={{ height: `${displayPercentage}%` }}
          />
        </div>
      )}
      {/* Winner badge with fade-in */}
      {isWinner && total > 0 && (
        <div
          className={`absolute top-2 right-2 bg-accent text-foreground text-xs font-bold px-2 py-0.5 rounded-full transition-all duration-500 ${
            showBadge
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
          }`}
        >
          多数派
        </div>
      )}
      {/* User's choice indicator */}
      {isSelected && showBadge && (
        <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full animate-fade-in">
          あなた
        </div>
      )}
    </div>
  );
}
