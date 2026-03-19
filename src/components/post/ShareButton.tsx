"use client";

import { Post } from "@/lib/types";

interface ShareButtonProps {
  post: Post;
}

export default function ShareButton({ post }: ShareButtonProps) {
  const total = post.vote_count_a + post.vote_count_b;
  if (total === 0) return null;

  const pctA = Math.round((post.vote_count_a / total) * 100);
  const pctB = 100 - pctA;
  const postUrl = `${window.location.origin}/posts/${post.id}`;

  let shareText: string;
  if (post.mode === "text") {
    shareText = `「${post.option_a_text}」${pctA}% vs 「${post.option_b_text}」${pctB}%（${total}票）\nあなたはどっち派？`;
  } else {
    shareText = `A ${pctA}% vs B ${pctB}%（${total}票）\nあなたはどっち派？`;
  }

  const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Dotchi - 5分で解決する2択投票",
          text: shareText,
          url: postUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to X
      }
    }
    window.open(xShareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex-1 bg-foreground text-card text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity"
      >
        結果をシェア
      </button>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-11 h-11 bg-foreground text-card rounded-xl hover:opacity-90 transition-opacity"
        aria-label="Xでシェア"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  );
}
