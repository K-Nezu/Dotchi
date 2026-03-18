"use client";

import { Post } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import VoteButton from "@/components/post/VoteButton";
import ResultBar from "@/components/post/ResultBar";

interface PostCardProps {
  post: Post;
  votedChoice?: "a" | "b" | null;
  onVote?: (postId: string, choice: "a" | "b") => void;
}

export default function PostCard({ post, votedChoice, onVote }: PostCardProps) {
  const isExpired =
    post.is_expired || new Date(post.expires_at).getTime() <= Date.now();
  const showResults = isExpired || votedChoice != null;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-primary-light/20 overflow-hidden">
      <div className="p-4">
        {!isExpired && <ProgressBar createdAt={post.created_at} />}
        {isExpired && (
          <p className="text-xs text-muted text-center mb-2">投票終了</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {showResults ? (
          <>
            <ResultBar
              label={post.mode === "text" ? post.option_a_text! : "A"}
              imageUrl={post.option_a_image_url}
              count={post.vote_count_a}
              total={post.vote_count_a + post.vote_count_b}
              isWinner={post.vote_count_a >= post.vote_count_b}
              isSelected={votedChoice === "a"}
            />
            <ResultBar
              label={post.mode === "text" ? post.option_b_text! : "B"}
              imageUrl={post.option_b_image_url}
              count={post.vote_count_b}
              total={post.vote_count_a + post.vote_count_b}
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
    </div>
  );
}
