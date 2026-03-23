"use client";

import { useEffect, useState, useRef } from "react";
import { Post } from "@/lib/types";
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
}

export default function PostCard({ post, votedChoice, onVote, onPostRemoved }: PostCardProps) {
  const isExpired =
    post.is_expired || new Date(post.expires_at).getTime() <= Date.now();
  const hasVoted = votedChoice != null;
  const total = post.vote_count_a + post.vote_count_b;

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

        // Tick down each second
        let current = remaining;
        const timer = setInterval(() => {
          current--;
          if (current > 0) {
            setCountdown(current);
          } else {
            setCountdown(0);
            clearInterval(timer);
            // Flash effect on reveal
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

  // After countdown, treat as expired locally
  const localExpired = isExpired || countdown === 0;
  const showResults = localExpired;
  const showWaiting = hasVoted && !localExpired && countdown === null;
  const showCountdown = hasVoted && countdown !== null && countdown > 0;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 pt-5 pb-3">
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
            />
            <ResultBar
              label={post.mode === "text" ? post.option_b_text! : "B"}
              imageUrl={post.option_b_image_url}
              count={post.vote_count_b}
              total={total}
              isWinner={post.vote_count_b >= post.vote_count_a}
              isSelected={votedChoice === "b"}
            />
          </>
        ) : showWaiting || showCountdown ? (
          <WaitingOverlay
            imageUrlA={post.option_a_image_url}
            imageUrlB={post.option_b_image_url}
            labelA={post.mode === "text" ? post.option_a_text! : "A"}
            labelB={post.mode === "text" ? post.option_b_text! : "B"}
            votedChoice={votedChoice!}
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

      {/* Waiting wave animation */}
      {(showWaiting || showCountdown) && (
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center justify-center gap-1.5 py-3">
            {showCountdown ? (
              <span className="text-xs text-primary font-semibold">まもなく開票...</span>
            ) : (
              <>
                <div className="flex items-center gap-[3px]">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-primary to-secondary animate-wave"
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

      {/* Footer: total votes + share (when expired) */}
      {localExpired && total > 0 && (
        <div className="px-5 pb-4 pt-1 space-y-3">
          <p className="text-xs text-muted">
            {total}人が回答
          </p>
          <ShareButton post={post} />
        </div>
      )}

      {/* Dev/test tools */}
      <DevTools post={post} isExpired={localExpired} onPostRemoved={onPostRemoved} />
    </div>
  );
}
