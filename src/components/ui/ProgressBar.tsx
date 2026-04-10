"use client";

import { useEffect, useState } from "react";
import { POST_DURATION_MS } from "@/lib/constants";

interface ProgressBarProps {
  startAt: string;
}

export default function ProgressBar({ startAt }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = new Date(startAt).getTime();

    const update = () => {
      const now = Date.now();
      const elapsed = now - start;
      const pct = Math.min((elapsed / POST_DURATION_MS) * 100, 100);
      setProgress(pct);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startAt]);

  const remaining = Math.max(
    0,
    Math.ceil(
      (new Date(startAt).getTime() + POST_DURATION_MS - Date.now()) / 1000
    )
  );
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isUrgent = remaining <= 60;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-[3px] bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${isUrgent ? "bg-red-400" : "bg-foreground/30"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`text-xs font-mono tabular-nums ${isUrgent ? "text-red-500" : "text-muted"}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
