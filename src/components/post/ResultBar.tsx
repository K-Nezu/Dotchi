"use client";

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
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 ${
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
            <span className="text-3xl font-bold">{percentage}%</span>
            <span className="text-xs mt-1">{count}票</span>
          </div>
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-primary-light/40 to-secondary/40 flex flex-col items-center justify-center p-4">
          <p className="text-sm font-medium text-foreground mb-2 line-clamp-2 text-center">
            {label}
          </p>
          <span className="text-2xl font-bold text-foreground">
            {percentage}%
          </span>
          <span className="text-xs text-muted mt-1">{count}票</span>
        </div>
      )}
      {isWinner && (
        <div className="absolute top-2 right-2 bg-accent text-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          多数派
        </div>
      )}
    </div>
  );
}
