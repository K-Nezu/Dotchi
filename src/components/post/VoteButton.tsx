"use client";

import { useCallback, useRef } from "react";

interface VoteButtonProps {
  label?: string;
  imageUrl?: string | null;
  onClick: () => void;
  previewUrl?: string | null;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  isSelected?: boolean;
}

export default function VoteButton({
  label,
  imageUrl,
  onClick,
  previewUrl,
  isPlaying,
  onPlayToggle,
  isSelected,
}: VoteButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
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

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      onClick();
    },
    [onClick]
  );

  if (imageUrl) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleClick}
          className={`vote-button relative aspect-square w-full overflow-hidden active:animate-button-press transition-all duration-200 ${isSelected ? "ring-2 ring-inset ring-foreground" : ""}`}
        >
          <img
            src={imageUrl}
            alt="選択肢"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {label && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
              <p className="text-white text-sm font-medium line-clamp-1">{label}</p>
            </div>
          )}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPlayToggle?.(); }}
            className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-90 transition-all"
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
      </div>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`vote-button aspect-square bg-neutral-50 flex items-center justify-center p-4 text-center font-medium text-foreground hover:bg-neutral-100 active:animate-button-press transition-all duration-200 ${isSelected ? "ring-2 ring-inset ring-foreground" : ""}`}
    >
      <span className="line-clamp-3 text-sm leading-relaxed">{label}</span>
    </button>
  );
}
