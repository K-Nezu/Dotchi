"use client";

import { Post } from "@/lib/types";

interface ShareButtonProps {
  post: Post;
  mode?: "result" | "invite";
}

export default function ShareButton({ post, mode = "result" }: ShareButtonProps) {
  const total = post.vote_count_a + post.vote_count_b;

  const getPostUrl = () => `${window.location.origin}/posts/${post.id}`;

  if (mode === "invite") {
    const handleLineInvite = () => {
      const postUrl = getPostUrl();
      const text = post.question
        ? `「${post.question}」\n5分だけ答えて！\n${postUrl}`
        : `どっちがいい？5分だけ答えて！\n${postUrl}`;
      const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
      window.open(lineUrl, "_blank", "noopener,noreferrer");
    };

    return (
      <button
        onClick={handleLineInvite}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-foreground text-white text-sm font-medium hover:bg-foreground/80 active:animate-button-press transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        友達に聞いてみる
      </button>
    );
  }

  // Result mode
  if (total === 0) return null;

  const pctA = Math.round((post.vote_count_a / total) * 100);
  const pctB = 100 - pctA;

  const shareText = `「${post.option_a_text}」${pctA}% vs 「${post.option_b_text}」${pctB}%（${total}票）\nあなたはどっち派？`;

  const getXShareUrl = () =>
    `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getPostUrl())}`;

  const getLineShareUrl = () => {
    const text = `${shareText}\n${getPostUrl()}`;
    return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  };

  const handleShare = async () => {
    const postUrl = getPostUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Dotchi - 5分で解決する2択投票",
          text: shareText,
          url: postUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through
      }
    }
    window.open(getXShareUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        className="flex-1 bg-foreground text-white text-sm font-medium py-2.5 rounded-lg hover:bg-foreground/80 active:animate-button-press transition-colors"
      >
        結果をシェア
      </button>
      <button
        onClick={() => window.open(getXShareUrl(), "_blank", "noopener,noreferrer")}
        className="flex items-center justify-center w-11 h-11 border border-border text-foreground rounded-lg hover:bg-neutral-50 active:animate-button-press transition-colors"
        aria-label="Xでシェア"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={() => window.open(getLineShareUrl(), "_blank", "noopener,noreferrer")}
        className="flex items-center justify-center w-11 h-11 border border-border rounded-lg hover:bg-neutral-50 active:animate-button-press transition-colors"
        aria-label="LINEでシェア"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      </button>
    </div>
  );
}
