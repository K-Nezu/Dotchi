"use client";

import { useEffect, useState } from "react";
import { POST_DURATION_MS } from "@/lib/constants";

interface ProgressBarProps {
  createdAt: string;
}

export default function ProgressBar({ createdAt }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();

    const update = () => {
      const now = Date.now();
      const elapsed = now - start;
      const pct = Math.min((elapsed / POST_DURATION_MS) * 100, 100);
      setProgress(pct);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const remaining = Math.max(
    0,
    Math.ceil(
      (new Date(createdAt).getTime() + POST_DURATION_MS - Date.now()) / 1000
    )
  );
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-muted font-medium">残り時間</span>
        <span className="text-xs font-mono text-foreground font-semibold">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground/70 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
