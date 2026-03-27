"use client";

import { useCallback, useRef } from "react";
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect from tap position
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ripple = document.createElement("span");
        ripple.className = "vote-ripple";
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        button.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      }

      // Haptic feedback (Android/supported browsers)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      onClick();
    },
    [onClick]
  );

  if (imageUrl) {
    return (
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="vote-button relative aspect-[4/3] rounded-xl overflow-hidden border border-border hover:border-foreground/30 active:animate-button-press transition-all duration-200"
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
      ref={buttonRef}
      onClick={handleClick}
      className="vote-button aspect-[4/3] rounded-xl bg-neutral-50 flex items-center justify-center p-4 text-center font-medium text-foreground border border-border hover:border-foreground/30 hover:bg-neutral-100 active:animate-button-press transition-all duration-200"
    >
      <span className="line-clamp-3 text-sm leading-relaxed">{label}</span>
    </button>
  );
}
