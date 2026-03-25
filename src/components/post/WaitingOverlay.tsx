"use client";

import Image from "next/image";

interface WaitingOverlayProps {
  imageUrlA?: string | null;
  imageUrlB?: string | null;
  labelA?: string;
  labelB?: string;
  votedChoice?: "a" | "b";
}

export default function WaitingOverlay({
  imageUrlA,
  imageUrlB,
  labelA,
  labelB,
  votedChoice,
}: WaitingOverlayProps) {
  return (
    <>
      {/* Option A */}
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
          votedChoice === "a" ? "border-foreground" : "border-transparent"
        }`}
      >
        {imageUrlA ? (
          <div className="relative aspect-square">
            <Image
              src={imageUrlA}
              alt={labelA || "A"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 256px"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-lg font-bold">?</span>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-neutral-50 flex items-center justify-center p-4">
            <p className="text-sm font-medium text-foreground line-clamp-2 text-center">
              {labelA}
            </p>
          </div>
        )}
        {votedChoice === "a" && (
          <div className="absolute bottom-2 left-2 bg-foreground text-white text-xs px-2 py-0.5 rounded-full">
            あなた
          </div>
        )}
      </div>

      {/* Option B */}
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
          votedChoice === "b" ? "border-foreground" : "border-transparent"
        }`}
      >
        {imageUrlB ? (
          <div className="relative aspect-square">
            <Image
              src={imageUrlB}
              alt={labelB || "B"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 256px"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-lg font-bold">?</span>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-neutral-50 flex items-center justify-center p-4">
            <p className="text-sm font-medium text-foreground line-clamp-2 text-center">
              {labelB}
            </p>
          </div>
        )}
        {votedChoice === "b" && (
          <div className="absolute bottom-2 left-2 bg-foreground text-white text-xs px-2 py-0.5 rounded-full">
            あなた
          </div>
        )}
      </div>
    </>
  );
}
