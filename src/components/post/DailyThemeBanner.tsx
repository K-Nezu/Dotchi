"use client";

import { useState } from "react";
import { DailyTheme } from "@/lib/types";
import BottomSheet from "@/components/ui/BottomSheet";
import CreatePostForm from "@/components/post/CreatePostForm";

interface DailyThemeBannerProps {
  theme: DailyTheme;
}

export default function DailyThemeBanner({ theme }: DailyThemeBannerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="border-b border-border bg-white px-5 py-5">
        <p className="text-[10px] font-medium text-muted uppercase tracking-widest mb-1.5">
          TODAY&apos;S THEME
        </p>
        <h2 className="text-lg font-bold text-foreground leading-tight">
          {theme.title}
        </h2>
        {theme.description && (
          <p className="text-sm text-muted mt-1">{theme.description}</p>
        )}
        {theme.examples && theme.examples.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {theme.examples.map((example, i) => (
              <span
                key={i}
                className="text-xs text-muted bg-neutral-100 px-2.5 py-1 rounded-full"
              >
                {example}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => setSheetOpen(true)}
          className="mt-4 w-full py-3 rounded-lg border border-foreground text-foreground text-sm font-medium hover:bg-foreground hover:text-white active:animate-button-press transition-colors"
        >
          このお題で投稿する
        </button>
      </div>

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="mb-3 px-1">
          <p className="text-[10px] font-medium text-muted uppercase tracking-widest">
            TODAY&apos;S THEME
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">{theme.title}</p>
        </div>
        <CreatePostForm
          onSuccess={() => setSheetOpen(false)}
          themeId={theme.id}
          defaultMode={theme.mode ?? undefined}
        />
      </BottomSheet>
    </>
  );
}
