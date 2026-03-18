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
        className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary active:scale-95 transition-all"
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
      className="aspect-square rounded-xl bg-gradient-to-br from-primary-light/40 to-secondary/40 flex items-center justify-center p-4 text-center font-medium text-foreground border-2 border-transparent hover:border-primary active:scale-95 transition-all"
    >
      <span className="line-clamp-3">{label}</span>
    </button>
  );
}
