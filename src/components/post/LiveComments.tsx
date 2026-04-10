"use client";

import { useEffect, useState, useRef } from "react";
import { Comment } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface LiveCommentsProps {
  postId: string;
  labelA: string;
  labelB: string;
}

export default function LiveComments({ postId, labelA, labelB }: LiveCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch existing comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setComments(data as Comment[]);
    };
    fetchComments();
  }, [postId, supabase]);

  // Subscribe to new comments in realtime
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase]);

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  if (comments.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-1">
      <div
        ref={scrollRef}
        className="max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-hide"
      >
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-2 animate-comment-in"
          >
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                comment.choice === "a"
                  ? "bg-foreground/10 text-foreground"
                  : "bg-foreground/5 text-muted"
              }`}
            >
              {comment.choice === "a" ? labelA : labelB}
            </span>
            <p className="text-sm text-foreground leading-snug">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
