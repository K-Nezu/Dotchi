"use client";

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
  const showResults = isExpired;
  const showWaiting = hasVoted && !isExpired;
  const total = post.vote_count_a + post.vote_count_b;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        {/* Question */}
        {post.question && (
          <p className="text-base font-semibold text-foreground mb-3">
            {post.question}
          </p>
        )}
        {!isExpired && <ProgressBar createdAt={post.created_at} />}
        {isExpired && (
          <div className="mb-1">
            <span className="text-xs text-muted">投票終了</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
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
        ) : showWaiting ? (
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
      </div>

      {/* Waiting wave animation */}
      {showWaiting && (
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center justify-center gap-1.5 py-3">
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
          </div>
        </div>
      )}

      {/* Footer: total votes + share (when expired) */}
      {isExpired && total > 0 && (
        <div className="px-5 pb-4 pt-1 space-y-3">
          <p className="text-xs text-muted">
            {total}人が回答
          </p>
          <ShareButton post={post} />
        </div>
      )}

      {/* Dev/test tools */}
      <DevTools post={post} isExpired={isExpired} onPostRemoved={onPostRemoved} />
    </div>
  );
}
