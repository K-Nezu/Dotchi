"use client";

import Image from "next/image";

interface VoteButtonProps {
  label?: string;
  imageUrl?: string | null;
  onClick: () => void;
}

export default function VoteButton({
  label,
  imageUrl,
  onClick,
}: VoteButtonProps) {
  if (imageUrl) {
    return (
      <button
        onClick={onClick}
        className="relative aspect-square rounded-xl overflow-hidden border border-border hover:border-foreground/30 active:scale-[0.98] transition-all duration-200"
      >
        <Image
          src={imageUrl}
          alt="選択肢"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 256px"
        />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-xl bg-neutral-50 flex items-center justify-center p-5 text-center font-medium text-foreground border border-border hover:border-foreground/30 hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200"
    >
      <span className="line-clamp-3 text-sm leading-relaxed">{label}</span>
    </button>
  );
}
