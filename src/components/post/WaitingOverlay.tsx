"use client";

interface WaitingOverlayProps {
  imageUrlA?: string | null;
  imageUrlB?: string | null;
  labelA?: string;
  labelB?: string;
  votedChoice?: "a" | "b";
  previewUrlA?: string | null;
  previewUrlB?: string | null;
  playingSide?: "a" | "b" | null;
  onPlayToggle?: (side: "a" | "b") => void;
}

export default function WaitingOverlay({
  imageUrlA,
  imageUrlB,
  labelA,
  labelB,
  votedChoice,
  previewUrlA,
  previewUrlB,
  playingSide,
  onPlayToggle,
}: WaitingOverlayProps) {
  const playButton = (side: "a" | "b", url?: string | null) => {
    if (!url) return null;
    const playing = playingSide === side;
    return (
      <button
        type="button"
        onClick={() => onPlayToggle?.(side)}
        className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-90 transition-all z-10"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Option A */}
      <div className="relative overflow-hidden">
        {imageUrlA ? (
          <div className="relative aspect-square">
            <img
              src={imageUrlA}
              alt={labelA || "A"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 animate-breathe flex items-center justify-center">
              <span className="text-white/50 text-lg font-bold">?</span>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-neutral-50 flex items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-foreground/[0.03] animate-breathe" />
            <p className="text-sm font-medium text-foreground line-clamp-2 text-center relative z-10">
              {labelA}
            </p>
          </div>
        )}
        {playButton("a", previewUrlA)}
        {votedChoice === "a" && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground" />
        )}
        {votedChoice === "a" && (
          <div className="absolute bottom-3 left-2.5 bg-white/90 text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            あなた
          </div>
        )}
      </div>

      {/* Option B */}
      <div className="relative overflow-hidden">
        {imageUrlB ? (
          <div className="relative aspect-square">
            <img
              src={imageUrlB}
              alt={labelB || "B"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 animate-breathe flex items-center justify-center">
              <span className="text-white/50 text-lg font-bold">?</span>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-neutral-50 flex items-center justify-center p-4 relative">
            <div className="absolute inset-0 bg-foreground/[0.03] animate-breathe" />
            <p className="text-sm font-medium text-foreground line-clamp-2 text-center relative z-10">
              {labelB}
            </p>
          </div>
        )}
        {playButton("b", previewUrlB)}
        {votedChoice === "b" && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground" />
        )}
        {votedChoice === "b" && (
          <div className="absolute bottom-3 left-2.5 bg-white/90 text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            あなた
          </div>
        )}
      </div>
    </>
  );
}
