"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Post } from "@/lib/types";
import Header from "@/components/ui/Header";
import PostCard from "@/components/post/PostCard";
import ShareButton from "@/components/post/ShareButton";
import { createClient } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/device-id";

interface Props {
  post: Post;
}

export default function PostDetailClient({ post: initialPost }: Props) {
  const [post, setPost] = useState<Post>(initialPost);
  const deviceId = useRef("");

  useEffect(() => {
    deviceId.current = getDeviceId();
  }, []);

  const [votedChoice, setVotedChoice] = useState<"a" | "b" | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("dotchi_votes");
      if (saved) {
        const votes = JSON.parse(saved);
        return votes[initialPost.id] ?? null;
      }
    } catch {}
    return null;
  });
  const supabase = createClient();

  const isExpired =
    post.status === "active" && (post.is_expired || new Date(post.expires_at).getTime() <= Date.now());

  // Subscribe to realtime updates for this post
  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          setPost(payload.new as Post);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, post.id]);

  const handleVote = useCallback(
    async (postId: string, choice: "a" | "b", comment?: string) => {
      if (votedChoice) return;
      setVotedChoice(choice);
      try {
        const saved = localStorage.getItem("dotchi_votes");
        const votes = saved ? JSON.parse(saved) : {};
        votes[postId] = choice;
        localStorage.setItem("dotchi_votes", JSON.stringify(votes));
      } catch {}

      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, choice, device_id: deviceId.current, comment: comment || undefined }),
      });
    },
    [votedChoice]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <PostCard
          post={post}
          votedChoice={votedChoice}
          onVote={handleVote}
        />
        {isExpired && (
          <div className="mt-3">
            <ShareButton post={post} />
          </div>
        )}
      </main>
    </div>
  );
}
