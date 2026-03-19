"use client";

import { Post } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";
import ShareButton from "@/components/post/ShareButton";

interface PostCardProps {
  post: Post;
  votedChoice?: "a" | "b" | null;
  onVote?: (postId: string, choice: "a" | "b") => void;
}

function getResultReaction(countA: number, countB: number): string | null {
  const total = countA + countB;
  if (total === 0) return null;

  const winnerPct = Math.round((Math.max(countA, countB) / total) * 100);

  if (winnerPct >= 80) return "圧倒的！";
  if (winnerPct >= 65) return "はっきり決まった！";
  if (winnerPct <= 55) return "接戦！";
  return null;
}

export default function PostCard({ post, votedChoice, onVote }: PostCardProps) {
  const isExpired =
    post.is_expired || new Date(post.expires_at).getTime() <= Date.now();
  const showResults = isExpired || votedChoice != null;
  const total = post.vote_count_a + post.vote_count_b;
  const reaction = isExpired ? getResultReaction(post.vote_count_a, post.vote_count_b) : null;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-primary-light/20 overflow-hidden">
      <div className="p-4">
        {!isExpired && <ProgressBar createdAt={post.created_at} />}
        {isExpired && (
          <div className="text-center mb-2">
            <p className="text-xs text-muted">投票終了</p>
            {reaction && (
              <p className="text-sm font-bold text-primary mt-0.5">{reaction}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-2">
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

      {/* Footer: total votes + share (when expired) */}
      {isExpired && total > 0 && (
        <div className="px-4 pb-3 pt-1 space-y-2">
          <p className="text-xs text-muted text-center">
            {total}人が答えました
          </p>
          <ShareButton post={post} />
        </div>
      )}
    </div>
  );
}
