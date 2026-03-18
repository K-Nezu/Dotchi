"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-primary-light/30">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary">
          Dotchi
        </Link>
        <Link
          href="/create"
          className="rounded-full bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
        >
          投稿する
        </Link>
      </div>
    </header>
  );
}
