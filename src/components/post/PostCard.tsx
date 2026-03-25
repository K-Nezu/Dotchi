"use client";

import { useEffect, useState, useRef } from "react";
import { Post } from "@/lib/types";
import { getAnonymousName, getAvatarColor } from "@/lib/anonymous-name";
import { getDeviceId } from "@/lib/device-id";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import WaitingOverlay from "@/components/post/WaitingOverlay";
import ShareButton from "@/components/post/ShareButton";
import DevTools from "@/components/post/DevTools";

interface PostCardProps {
  post: Post;
  votedChoice?: "a" | "b" | null;
  onVote?: (postId: string, choice: "a" | "b") => void;
  onPostRemoved?: (postId: string) => void;
  isMyPost?: boolean;
}

export default function PostCard({ post, votedChoice, onVote, onPostRemoved, isMyPost }: PostCardProps) {
  const isExpired =
    post.is_expired || new Date(post.expires_at).getTime() <= Date.now();
  const hasVoted = votedChoice != null;
  const total = post.vote_count_a + post.vote_count_b;

  const anonymousName = getAnonymousName(post.id);
  const avatarColor = getAvatarColor(post.id);

  // Countdown state: null = not counting, 3/2/1 = counting, 0 = reveal
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showRevealFlash, setShowRevealFlash] = useState(false);
  const countdownTriggered = useRef(false);

  useEffect(() => {
    if (isExpired || countdownTriggered.current) return;

    const expiresAt = new Date(post.expires_at).getTime();

    const check = () => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

      if (remaining <= 3 && remaining > 0 && !countdownTriggered.current) {
        countdownTriggered.current = true;
        setCountdown(remaining);

        let current = remaining;
        const timer = setInterval(() => {
          current--;
          if (current > 0) {
            setCountdown(current);
          } else {
            setCountdown(0);
            clearInterval(timer);
            setShowRevealFlash(true);
            setTimeout(() => setShowRevealFlash(false), 400);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    };

    check();
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, [isExpired, post.expires_at]);

  const localExpired = isExpired || countdown === 0;
  const showResults = localExpired;
  const showWaiting = (hasVoted || isMyPost) && !localExpired && countdown === null;
  const showCountdown = (hasVoted || isMyPost) && countdown !== null && countdown > 0;
  const showPosterChoicePicker = isMyPost && localExpired && post.poster_choice === null;

  const handlePosterChoice = async (choice: "a" | "b") => {
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: post.id,
        poster_choice: choice,
        device_id: getDeviceId(),
      }),
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Anonymous poster info */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/10"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-foreground/40">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground">{anonymousName}</span>
        {!localExpired && (
          <span className="text-sm font-semibold text-foreground/70 ml-auto">
            迷い中<span className="animate-dot-1">.</span><span className="animate-dot-2">.</span><span className="animate-dot-3">.</span>
          </span>
        )}
      </div>

      <div className="px-5 pb-3">
        {/* Question */}
        {post.question && (
          <p className="text-base font-semibold text-foreground mb-3">
            {post.question}
          </p>
        )}
        {!localExpired && <ProgressBar createdAt={post.created_at} />}
        {localExpired && (
          <div className="mb-1">
            <span className="text-xs text-muted">投票終了</span>
          </div>
        )}
      </div>

      <div className="relative grid grid-cols-2 gap-2.5 px-5 pb-3">
        {showResults ? (
          <>
            <ResultBar
              label={post.mode === "text" ? post.option_a_text! : "A"}
              imageUrl={post.option_a_image_url}
              count={post.vote_count_a}
              total={total}
              isWinner={post.vote_count_a >= post.vote_count_b}
              isSelected={votedChoice === "a"}
              isPosterChoice={post.poster_choice === "a"}
            />
            <ResultBar
              label={post.mode === "text" ? post.option_b_text! : "B"}
              imageUrl={post.option_b_image_url}
              count={post.vote_count_b}
              total={total}
              isWinner={post.vote_count_b >= post.vote_count_a}
              isSelected={votedChoice === "b"}
              isPosterChoice={post.poster_choice === "b"}
            />
          </>
        ) : showWaiting || showCountdown ? (
          <WaitingOverlay
            imageUrlA={post.option_a_image_url}
            imageUrlB={post.option_b_image_url}
            labelA={post.mode === "text" ? post.option_a_text! : "A"}
            labelB={post.mode === "text" ? post.option_b_text! : "B"}
            votedChoice={votedChoice ?? undefined}
          />
        ) : (
          <>
            <VoteButton
              label={post.mode === "text" ? post.option_a_text! : undefined}
              imageUrl={post.option_a_image_url}
              onClick={() => onVote?.(post.id, "a")}
            />
            <VoteButton
              label={post.mode === "text" ? post.option_b_text! : undefined}
              imageUrl={post.option_b_image_url}
              onClick={() => onVote?.(post.id, "b")}
            />
          </>
        )}

        {/* Countdown overlay */}
        {showCountdown && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-foreground/90 flex items-center justify-center">
              <span
                key={countdown}
                className="text-4xl font-bold text-white animate-countdown-pop"
              >
                {countdown}
              </span>
            </div>
          </div>
        )}

        {/* Reveal flash */}
        {showRevealFlash && (
          <div className="absolute inset-0 bg-white rounded-xl z-10 pointer-events-none animate-reveal-flash" />
        )}
      </div>

      {/* LINE invite button (shown during active voting) */}
      {!localExpired && (
        <div className="px-5 pb-3">
          <ShareButton post={post} mode="invite" />
        </div>
      )}

      {/* Waiting wave animation */}
      {(showWaiting || showCountdown) && (
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center justify-center gap-1.5 py-3">
            {showCountdown ? (
              <span className="text-xs text-foreground font-semibold">まもなく開票...</span>
            ) : (
              <>
                <div className="flex items-center gap-[3px]">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-foreground/30 animate-wave"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        height: "4px",
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted ml-2">開票を待っています...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Poster choice picker (after results revealed) */}
      {showPosterChoicePicker && (
        <div className="px-5 pb-3 animate-fade-in">
          <p className="text-sm font-medium text-foreground mb-2">あなたはどっちを選んだ？</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handlePosterChoice("a")}
              className="py-2.5 rounded-lg text-sm font-medium border-2 border-border bg-white text-foreground hover:border-foreground hover:bg-neutral-50 active:animate-button-press transition-all"
            >
              {post.option_a_text || "A"}
            </button>
            <button
              type="button"
              onClick={() => handlePosterChoice("b")}
              className="py-2.5 rounded-lg text-sm font-medium border-2 border-border bg-white text-foreground hover:border-foreground hover:bg-neutral-50 active:animate-button-press transition-all"
            >
              {post.option_b_text || "B"}
            </button>
          </div>
        </div>
      )}

      {/* Footer: total votes + share (when expired) */}
      {localExpired && total > 0 && (
        <div className="px-5 pb-4 pt-1 space-y-3">
          <p className="text-xs text-muted">
            {total}人が回答
          </p>
          <ShareButton post={post} mode="result" />
        </div>
      )}

      {/* Dev/test tools */}
      <DevTools post={post} isExpired={localExpired} onPostRemoved={onPostRemoved} />
    </div>
  );
}
