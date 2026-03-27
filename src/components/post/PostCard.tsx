"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Post } from "@/lib/types";
import { getAnonymousName, getAvatarColor, getAnonymousEmoji } from "@/lib/anonymous-name";
import { getDeviceId } from "@/lib/device-id";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import WaitingOverlay from "@/components/post/WaitingOverlay";
import ShareButton from "@/components/post/ShareButton";
import DevTools from "@/components/post/DevTools";

function useNeonBorder(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !ref.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ref.current) {
        ref.current.style.borderColor = "";
        ref.current.style.borderWidth = "";
        ref.current.style.borderStyle = "";
        ref.current.style.backgroundImage = "";
        ref.current.style.backgroundOrigin = "";
        ref.current.style.backgroundClip = "";
      }
      return;
    }
    const el = ref.current;
    const tick = () => {
      angleRef.current = (angleRef.current + 1.2) % 360;
      const a = angleRef.current;
      el.style.borderColor = "transparent";
      el.style.borderWidth = "3px";
      el.style.borderStyle = "solid";
      el.style.backgroundImage = `linear-gradient(white, white), conic-gradient(from ${a}deg, #e5e5e5 0%, #e5e5e5 30%, #d4d0f0 50%, #c4b5fd 62%, #b09ae0 74%, #dba8c8 84%, #e5c4d6 92%, #e5e5e5 100%)`;
      el.style.backgroundOrigin = "border-box";
      el.style.backgroundClip = "padding-box, border-box";
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return ref;
}

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
  const anonymousEmoji = getAnonymousEmoji(post.id);

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
  const isWaitingState = showWaiting || !!showCountdown;
  const neonRef = useNeonBorder(isWaitingState);

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
    <div
      ref={neonRef}
      className={`bg-card rounded-2xl overflow-hidden ${isWaitingState ? '' : 'border border-border'}`}
    >
      {/* Anonymous poster info */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-lg leading-none">
          {anonymousEmoji}
        </div>
        <span className="text-sm font-medium text-foreground">{anonymousName}</span>
        {!localExpired && (
          <span className="flex items-center gap-1.5 text-base font-bold text-foreground/70 ml-auto">
            {isWaitingState && (
              <span className="flex items-center gap-[2px]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[2.5px] rounded-full bg-foreground/30 animate-wave-sm block"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </span>
            )}
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

      {/* Countdown label */}
      {showCountdown && (
        <div className="px-5 pb-3 pt-1">
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-foreground font-semibold">まもなく結果が出るよ...</span>
          </div>
        </div>
      )}

      {/* Poster choice picker (after results revealed) */}
      {showPosterChoicePicker && (
        <div className="px-5 pb-3 animate-fade-in">
          <p className="text-sm font-medium text-foreground mb-2">で、あなたはどっちにした？</p>
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
            {total}人が選んだよ
          </p>
          <ShareButton post={post} mode="result" />
        </div>
      )}

      {/* Dev/test tools */}
      <DevTools post={post} isExpired={localExpired} onPostRemoved={onPostRemoved} />
    </div>
  );
}
