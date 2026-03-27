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

  const isUrgent = remaining <= 60;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted">のこり</span>
        <span className={`text-lg font-bold font-mono tabular-nums ${isUrgent ? "text-red-500" : "text-foreground"}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${isUrgent ? "bg-red-400" : "bg-foreground/50"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
