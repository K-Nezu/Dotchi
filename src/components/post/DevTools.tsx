"use client";

import { useState } from "react";
import { Post } from "@/lib/types";

interface DevToolsProps {
  post: Post;
  isExpired: boolean;
  onPostRemoved?: (postId: string) => void;
}

export default function DevTools({ post, isExpired, onPostRemoved }: DevToolsProps) {
  const [loading, setLoading] = useState(false);

  // Temporarily hidden for UI review
  return null;
  const showDevTools =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEV_TOOLS === "true";
  if (!showDevTools) return null;

  const handleForceExpire = async () => {
    setLoading(true);
    await fetch(`/api/posts/${post.id}`, { method: "PATCH" });
    setLoading(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    setLoading(false);
    onPostRemoved?.(post.id);
    window.location.reload();
  };

  return (
    <div className="px-4 pb-3 pt-1 flex gap-2 border-t border-dashed border-muted/30 mt-1">
      <span className="text-xs text-muted self-center">DEV</span>
      {!isExpired && (
        <button
          onClick={handleForceExpire}
          disabled={loading}
          className="text-xs px-2 py-1 rounded-lg bg-secondary/20 text-foreground hover:bg-secondary/40 disabled:opacity-50"
        >
          強制終了
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
      >
        削除
      </button>
    </div>
  );
}
