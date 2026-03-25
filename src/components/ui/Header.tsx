"use client";

import { useState } from "react";
import Link from "next/link";
import BottomSheet from "@/components/ui/BottomSheet";
import CreatePostForm from "@/components/post/CreatePostForm";

export default function Header() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-xl mx-auto flex items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Dotchi
          </Link>
          <button
            onClick={() => setSheetOpen(true)}
            className="rounded-lg bg-foreground text-white px-4 py-2 text-sm font-medium hover:bg-foreground/80 active:animate-button-press transition-colors"
          >
            投稿する
          </button>
        </div>
      </header>

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        <CreatePostForm onSuccess={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}
