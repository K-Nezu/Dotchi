"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-xl mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          Dotchi
        </Link>
        <Link
          href="/create"
          className="rounded-lg bg-foreground text-white px-4 py-2 text-sm font-medium hover:bg-foreground/80 transition-colors"
        >
          投稿する
        </Link>
      </div>
    </header>
  );
}
