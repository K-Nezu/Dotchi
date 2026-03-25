"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Post } from "@/lib/types";
import PostCard from "./PostCard";
import { createClient } from "@/lib/supabase/client";
import { TIMELINE_RETENTION_MS } from "@/lib/constants";
import { getDeviceId } from "@/lib/device-id";

interface TimelineProps {
  initialPosts: Post[];
}

export default function Timeline({ initialPosts }: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [votes, setVotes] = useState<Record<string, "a" | "b">>({});
  const supabase = createClient();
  const deviceId = useRef("");

  useEffect(() => {
    deviceId.current = getDeviceId();
  }, []);

  // Refresh posts periodically to update expiry states
  useEffect(() => {
    const interval = setInterval(async () => {
      const retentionCutoff = new Date(Date.now() - TIMELINE_RETENTION_MS).toISOString();
      const { data } = await supabase
        .from("posts")
        .select("*")
        .gte("expires_at", retentionCutoff)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setPosts(data as Post[]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === (payload.new as Post).id ? (payload.new as Post) : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleVote = useCallback(
    async (postId: string, choice: "a" | "b") => {
      if (votes[postId]) return;

      setVotes((prev) => ({ ...prev, [postId]: choice }));

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          choice,
          device_id: deviceId.current,
        }),
      });

      // Revert if server rejected
      if (!res.ok) {
        setVotes((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }
    },
    [votes]
  );

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-muted">
        <p className="text-base font-medium text-foreground/60">まだ投稿がありません</p>
        <p className="text-sm mt-2 text-muted">最初の迷いを投稿してみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          votedChoice={votes[post.id] ?? null}
          onVote={handleVote}
          isMyPost={post.poster_id === deviceId.current}
        />
      ))}
    </div>
  );
}
