"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Post } from "@/lib/types";
import { getAnonymousName, getAnonymousEmoji } from "@/lib/anonymous-name";
import { getDeviceId } from "@/lib/device-id";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import WaitingOverlay from "@/components/post/WaitingOverlay";
import ShareButton from "@/components/post/ShareButton";
import ChallengeForm from "@/components/post/ChallengeForm";
import LiveComments from "@/components/post/LiveComments";
import BottomSheet from "@/components/ui/BottomSheet";

interface PostCardProps {
  post: Post;
  votedChoice?: "a" | "b" | null;
  onVote?: (postId: string, choice: "a" | "b", comment?: string) => void;
  onPostRemoved?: (postId: string) => void;
  isMyPost?: boolean;
}

export default function PostCard({ post, votedChoice, onVote, onPostRemoved, isMyPost }: PostCardProps) {
  const isOpen = post.status === "open";
  const isActive = post.status === "active";
  const isExpired =
    isActive && (post.is_expired || new Date(post.expires_at).getTime() <= Date.now());
  const hasVoted = votedChoice != null;
  const total = post.vote_count_a + post.vote_count_b;

  const deviceId = getDeviceId();
  const isChallenger = post.challenger_id === deviceId;

  const anonymousName = getAnonymousName(post.id);
  const anonymousEmoji = getAnonymousEmoji(post.id);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showRevealFlash, setShowRevealFlash] = useState(false);
  const countdownTriggered = useRef(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [pendingVoteChoice, setPendingVoteChoice] = useState<"a" | "b" | null>(null);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const hasReasons = !!post.option_a_reason || !!post.option_b_reason;

  // Audio state for music/media mode
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSide, setPlayingSide] = useState<"a" | "b" | null>(null);

  const hasPreview = post.mode === "music";

  const playPreview = useCallback((side: "a" | "b") => {
    const url = side === "a" ? post.option_a_preview_url : post.option_b_preview_url;
    if (!url) return;

    if (playingSide === side) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingSide(null);
      return;
    }

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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || isExpired || countdownTriggered.current) return;

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
  }, [isActive, isExpired, post.expires_at]);

  const localExpired = isExpired || countdown === 0;
  const showResults = isActive && localExpired;
  const showWaiting = isActive && (hasVoted || isMyPost || isChallenger) && !localExpired && countdown === null;
  const showCountdown = isActive && (hasVoted || isMyPost || isChallenger) && countdown !== null && countdown > 0;
  const [localPosterChoice, setLocalPosterChoice] = useState<"a" | "b" | null>(null);
  const effectivePosterChoice = post.poster_choice ?? localPosterChoice;
  const showPosterChoicePicker = isMyPost && localExpired && effectivePosterChoice === null;
  const isWaitingState = showWaiting || !!showCountdown;

  // Resolve display data based on mode
  const isMediaMode = post.mode === "music" || post.mode === "movie" || post.mode === "game";
  const imgA = isMediaMode ? post.option_a_artwork_url : post.option_a_image_url;
  const imgB = isMediaMode ? post.option_b_artwork_url : post.option_b_image_url;
  const labelA = post.mode === "image" ? "A" : post.option_a_text!;
  const labelB = post.mode === "image" ? "B" : (post.option_b_text || "?");

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

  const progressStartAt = post.matched_at ?? post.created_at;

  // Status label
  const statusLabel = isOpen
    ? "募集中"
    : isWaitingState
      ? "集計中"
      : isActive && !localExpired
        ? "投票中"
        : null;

  // Mode label
  const modeLabels: Record<string, string> = {
    music: "音楽",
    movie: "映画",
    game: "ゲーム",
    image: "画像",
    text: "テキスト",
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/5 text-base leading-none">
          {anonymousEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">{anonymousName}</span>
        </div>
        <span className="text-xs font-medium text-muted bg-neutral-100 px-2 py-0.5 rounded-full">
          {modeLabels[post.mode]}
        </span>
        {statusLabel && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isOpen
              ? "bg-emerald-500 text-white animate-pulse-subtle"
              : "bg-neutral-100 text-muted"
          }`}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Question + Progress */}
      {(post.question || (isActive && !localExpired)) && (
        <div className="px-4 pb-2">
          {post.question && (
            <p className="text-[15px] font-semibold text-foreground leading-snug">
              {post.question}
            </p>
          )}
          {isActive && !localExpired && (
            <div className="mt-2">
              <ProgressBar startAt={progressStartAt} />
            </div>
          )}
        </div>
      )}

      {/* Open post: show option A + challenge placeholder */}
      {isOpen && (
        <>
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-[2px]">
            {/* Option A */}
            <div className="relative aspect-square rounded-l-xl overflow-hidden bg-neutral-50">
              {imgA ? (
                <img src={imgA} alt={labelA} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3">
                  <span className="text-sm font-medium text-foreground text-center">{labelA}</span>
                </div>
              )}
              {hasPreview && post.option_a_preview_url && (
                <button
                  type="button"
                  onClick={() => playPreview("a")}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  {playingSide === "a" ? (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              )}
              {isMediaMode && (
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs font-medium text-white truncate">{labelA}</p>
                  {post.option_a_artist && (
                    <p className="text-[10px] text-white/70 truncate">{post.option_a_artist}</p>
                  )}
                </div>
              )}
            </div>

            {/* Challenge placeholder */}
            <div className="relative aspect-square rounded-r-xl overflow-hidden bg-neutral-50 border-2 border-dashed border-neutral-200">
              {isMyPost ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center animate-pulse">
                    <span className="text-lg text-muted">?</span>
                  </div>
                  <span className="text-xs text-muted">対戦相手を待機中</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowChallengeForm(true)}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-foreground">挑戦する</span>
                </button>
              )}
            </div>
          </div>

          {/* Poster's reason (always visible in open state) */}
          {post.option_a_reason && (
            <div className="mt-3 p-3 rounded-lg bg-neutral-50 border border-border">
              <p className="text-sm text-foreground leading-relaxed">{post.option_a_reason}</p>
            </div>
          )}

        </div>

        {/* Challenge form in BottomSheet */}
        <BottomSheet isOpen={showChallengeForm && !isMyPost} onClose={() => setShowChallengeForm(false)}>
          <ChallengeForm
            post={post}
            onSuccess={() => {
              setShowChallengeForm(false);
              window.location.reload();
            }}
            onCancel={() => setShowChallengeForm(false)}
          />
        </BottomSheet>
        </>
      )}

      {/* Active/Expired: standard voting/results view */}
      {isActive && (
        <>
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
                  previewUrl={hasPreview ? post.option_a_preview_url : undefined}
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
                  previewUrl={hasPreview ? post.option_b_preview_url : undefined}
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
                previewUrlA={hasPreview ? post.option_a_preview_url : undefined}
                previewUrlB={hasPreview ? post.option_b_preview_url : undefined}
                playingSide={playingSide}
                onPlayToggle={playPreview}
              />
            ) : (
              <>
                <VoteButton
                  label={post.mode !== "image" ? labelA : undefined}
                  imageUrl={imgA}
                  onClick={() => {
                    setPendingVoteChoice("a");
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}
                  previewUrl={hasPreview ? post.option_a_preview_url : undefined}
                  isPlaying={playingSide === "a"}
                  onPlayToggle={() => playPreview("a")}
                  isSelected={pendingVoteChoice === "a"}
                />
                <VoteButton
                  label={post.mode !== "image" ? labelB : undefined}
                  imageUrl={imgB}
                  onClick={() => {
                    setPendingVoteChoice("b");
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}
                  previewUrl={hasPreview ? post.option_b_preview_url : undefined}
                  isPlaying={playingSide === "b"}
                  onPlayToggle={() => playPreview("b")}
                  isSelected={pendingVoteChoice === "b"}
                />
              </>
            )}

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

            {showRevealFlash && (
              <div className="absolute inset-0 bg-white z-10 pointer-events-none animate-reveal-flash" />
            )}
          </div>

          {/* Reasons */}
          {hasReasons && (
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={() => setShowReasons(!showReasons)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {showReasons ? "理由を閉じる" : "理由を見る"}
              </button>
              {showReasons && (
                <div className="mt-2 space-y-2">
                  {post.option_a_reason && (
                    <div className="p-3 rounded-lg bg-neutral-50 border border-border">
                      <p className="text-[10px] text-muted mb-1">{labelA} を推す理由</p>
                      <p className="text-sm text-foreground leading-relaxed">{post.option_a_reason}</p>
                    </div>
                  )}
                  {post.option_b_reason && (
                    <div className="p-3 rounded-lg bg-neutral-50 border border-border">
                      <p className="text-[10px] text-muted mb-1">{labelB} を推す理由</p>
                      <p className="text-sm text-foreground leading-relaxed">{post.option_b_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comment input bar (after selecting a side) */}
          {pendingVoteChoice && !hasVoted && (
            <div className="px-4 pt-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder="一言コメント（任意）"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onVote?.(post.id, pendingVoteChoice, commentText.trim() || undefined);
                      setPendingVoteChoice(null);
                      setCommentText("");
                    }
                  }}
                  className="flex-1 rounded-full border border-border bg-white px-4 py-2.5 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    onVote?.(post.id, pendingVoteChoice, commentText.trim() || undefined);
                    setPendingVoteChoice(null);
                    setCommentText("");
                  }}
                  className="shrink-0 rounded-full bg-foreground text-white px-4 py-2.5 text-sm font-medium hover:bg-foreground/80 active:scale-95 transition-all"
                >
                  投票
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setPendingVoteChoice(null); setCommentText(""); }}
                className="mt-2 text-xs text-muted hover:text-foreground transition-colors"
              >
                選び直す
              </button>
            </div>
          )}

          {/* Live comments */}
          {isActive && (
            <LiveComments postId={post.id} labelA={labelA} labelB={labelB} />
          )}

          {/* Actions */}
          <div className="px-4 py-3 space-y-3">
            {!localExpired && !pendingVoteChoice && (
              <ShareButton post={post} mode="invite" />
            )}

            {showCountdown && (
              <p className="text-xs text-muted text-center">まもなく結果が出るよ...</p>
            )}

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

            {localExpired && total > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs text-muted">{total}人が投票</p>
                <ShareButton post={post} mode="result" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
