"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Post } from "@/lib/types";
import { getAnonymousName, getAnonymousEmoji } from "@/lib/anonymous-name";
import { getDeviceId } from "@/lib/device-id";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import WaitingOverlay from "@/components/post/WaitingOverlay";
import ShareButton from "@/components/post/ShareButton";

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
  const anonymousEmoji = getAnonymousEmoji(post.id);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showRevealFlash, setShowRevealFlash] = useState(false);
  const countdownTriggered = useRef(false);

  // Audio state for music mode
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSide, setPlayingSide] = useState<"a" | "b" | null>(null);

  const playPreview = useCallback((side: "a" | "b") => {
    const url = side === "a" ? post.option_a_preview_url : post.option_b_preview_url;
    if (!url) return;

    // Toggle off if same side
    if (playingSide === side) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingSide(null);
      return;
    }

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audio.play();
    audio.onended = () => { audioRef.current = null; setPlayingSide(null); };
    audioRef.current = audio;
    setPlayingSide(side);
  }, [playingSide, post.option_a_preview_url, post.option_b_preview_url]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
  const [localPosterChoice, setLocalPosterChoice] = useState<"a" | "b" | null>(null);
  const effectivePosterChoice = post.poster_choice ?? localPosterChoice;
  const showPosterChoicePicker = isMyPost && localExpired && effectivePosterChoice === null;
  const isWaitingState = showWaiting || !!showCountdown;

  const imgA = post.mode === "music" ? post.option_a_artwork_url : post.option_a_image_url;
  const imgB = post.mode === "music" ? post.option_b_artwork_url : post.option_b_image_url;
  const labelA = post.mode === "image" ? "A" : post.option_a_text!;
  const labelB = post.mode === "image" ? "B" : post.option_b_text!;
  const isMusic = post.mode === "music";

  const handlePosterChoice = async (choice: "a" | "b") => {
    setLocalPosterChoice(choice);
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
    <div>
      {/* Header: avatar + name + status */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-base leading-none">
          {anonymousEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">{anonymousName}</span>
        </div>
        {!localExpired && (
          <span className="text-xs font-medium text-muted">
            {isWaitingState ? "集計中" : "迷い中"}
          </span>
        )}
      </div>

      {/* Question + Progress */}
      {(post.question || !localExpired) && (
        <div className="px-4 pb-2">
          {post.question && (
            <p className="text-[15px] font-semibold text-foreground leading-snug">
              {post.question}
            </p>
          )}
          {!localExpired && (
            <div className="mt-2">
              <ProgressBar createdAt={post.created_at} />
            </div>
          )}
        </div>
      )}

      {/* Choices */}
      <div className="relative grid grid-cols-2 gap-[2px]">
        {showResults ? (
          <>
            <ResultBar
              label={labelA}
              imageUrl={imgA}
              count={post.vote_count_a}
              total={total}
              isWinner={post.vote_count_a >= post.vote_count_b}
              isSelected={votedChoice === "a"}
              isPosterChoice={effectivePosterChoice === "a"}
              previewUrl={isMusic ? post.option_a_preview_url : undefined}
              isPlaying={playingSide === "a"}
              onPlayToggle={() => playPreview("a")}
            />
            <ResultBar
              label={labelB}
              imageUrl={imgB}
              count={post.vote_count_b}
              total={total}
              isWinner={post.vote_count_b >= post.vote_count_a}
              isSelected={votedChoice === "b"}
              isPosterChoice={effectivePosterChoice === "b"}
              previewUrl={isMusic ? post.option_b_preview_url : undefined}
              isPlaying={playingSide === "b"}
              onPlayToggle={() => playPreview("b")}
            />
          </>
        ) : showWaiting || showCountdown ? (
          <WaitingOverlay
            imageUrlA={imgA}
            imageUrlB={imgB}
            labelA={labelA}
            labelB={labelB}
            votedChoice={votedChoice ?? undefined}
            previewUrlA={isMusic ? post.option_a_preview_url : undefined}
            previewUrlB={isMusic ? post.option_b_preview_url : undefined}
            playingSide={playingSide}
            onPlayToggle={playPreview}
          />
        ) : (
          <>
            <VoteButton
              label={post.mode !== "image" ? labelA : undefined}
              imageUrl={imgA}
              onClick={() => onVote?.(post.id, "a")}
              previewUrl={isMusic ? post.option_a_preview_url : undefined}
              isPlaying={playingSide === "a"}
              onPlayToggle={() => playPreview("a")}
            />
            <VoteButton
              label={post.mode !== "image" ? labelB : undefined}
              imageUrl={imgB}
              onClick={() => onVote?.(post.id, "b")}
              previewUrl={isMusic ? post.option_b_preview_url : undefined}
              isPlaying={playingSide === "b"}
              onPlayToggle={() => playPreview("b")}
            />
          </>
        )}

        {/* Countdown overlay */}
        {showCountdown && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <span
                key={countdown}
                className="text-3xl font-bold text-white animate-countdown-pop"
              >
                {countdown}
              </span>
            </div>
          </div>
        )}

        {/* Reveal flash */}
        {showRevealFlash && (
          <div className="absolute inset-0 bg-white z-10 pointer-events-none animate-reveal-flash" />
        )}
      </div>

      {/* Actions area */}
      <div className="px-4 py-3 space-y-3">
        {/* Invite (active voting) */}
        {!localExpired && (
          <ShareButton post={post} mode="invite" />
        )}

        {/* Countdown hint */}
        {showCountdown && (
          <p className="text-xs text-muted text-center">まもなく結果が出るよ...</p>
        )}

        {/* Poster choice picker */}
        {showPosterChoicePicker && (
          <div className="animate-fade-in">
            <p className="text-sm font-medium text-foreground text-center mb-3">で、あなたはどっちにした？</p>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => handlePosterChoice("a")}
                className="w-12 h-12 rounded-full overflow-hidden border border-border hover:border-foreground active:scale-90 transition-all flex items-center justify-center bg-neutral-50"
              >
                {imgA ? (
                  <img src={imgA} alt="A" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-foreground">{labelA || "A"}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handlePosterChoice("b")}
                className="w-12 h-12 rounded-full overflow-hidden border border-border hover:border-foreground active:scale-90 transition-all flex items-center justify-center bg-neutral-50"
              >
                {imgB ? (
                  <img src={imgB} alt="B" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-foreground">{labelB || "B"}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer: vote count + share */}
        {localExpired && total > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted">{total}人が投票</p>
            <ShareButton post={post} mode="result" />
          </div>
        )}
      </div>
    </div>
  );
}
