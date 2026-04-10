"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Post, PostMode, MediaItem } from "@/lib/types";
import { ACCEPTED_IMAGE_TYPES, MAX_REASON_LENGTH } from "@/lib/constants";
import { getDeviceId } from "@/lib/device-id";
import { resizeImage } from "@/lib/resize-image";

interface ChallengeFormProps {
  post: Post;
  onSuccess: () => void;
  onCancel: () => void;
}

const SEARCH_ENDPOINTS: Record<string, string> = {
  music: "/api/music/search",
  movie: "/api/movie/search",
  game: "/api/game/search",
};

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  music: "曲名やアーティスト名で検索",
  movie: "映画タイトルで検索",
  game: "ゲームタイトルで検索",
};

function normalizeMediaItem(mode: PostMode, raw: Record<string, unknown>): MediaItem {
  if (mode === "music") {
    return {
      id: raw.trackId as string,
      title: raw.trackName as string,
      subtitle: raw.artistName as string,
      imageUrl: raw.artworkUrl as string,
      previewUrl: (raw.previewUrl as string) || null,
    };
  }
  return raw as unknown as MediaItem;
}

export default function ChallengeForm({ post, onSuccess, onCancel }: ChallengeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [imageB, setImageB] = useState<File | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Text state
  const [textB, setTextB] = useState("");

  // Reason state
  const [reason, setReason] = useState("");

  // Media state
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMediaMode = post.mode === "music" || post.mode === "movie" || post.mode === "game";

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("JPEG、PNG、WebP、GIFのみ対応しています");
        return;
      }

      setError(null);
      setIsResizing(true);

      try {
        const resized = await resizeImage(file);
        const url = URL.createObjectURL(resized);
        if (previewB) URL.revokeObjectURL(previewB);
        setImageB(resized);
        setPreviewB(url);
      } catch {
        setError("画像の処理に失敗しました");
      } finally {
        setIsResizing(false);
      }
    },
    [previewB]
  );

  const searchMedia = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const endpoint = SEARCH_ENDPOINTS[post.mode];
    if (!endpoint) return;

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSearchResults(
          (data.results || []).map((r: Record<string, unknown>) => normalizeMediaItem(post.mode, r))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const playPreview = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    if (playingPreview === url) {
      setPlayingPreview(null);
      return;
    }
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingPreview(null);
    audioRef.current = audio;
    setPlayingPreview(url);
  };

  const isValid =
    post.mode === "image"
      ? imageB !== null
      : post.mode === "text"
        ? textB.trim().length > 0
        : isMediaMode
          ? mediaItem !== null
          : false;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("device_id", getDeviceId());
      if (reason.trim()) formData.append("option_b_reason", reason.trim());

      if (post.mode === "image") {
        formData.append("image_b", imageB!);
      } else if (post.mode === "text") {
        formData.append("option_b_text", textB.trim());
      } else if (mediaItem) {
        formData.append("option_b_track_id", mediaItem.id);
        formData.append("option_b_text", mediaItem.title);
        formData.append("option_b_artist", mediaItem.subtitle);
        formData.append("option_b_artwork_url", mediaItem.imageUrl);
        if (mediaItem.previewUrl) formData.append("option_b_preview_url", mediaItem.previewUrl);
      }

      const res = await fetch(`/api/posts/${post.id}/challenge`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "チャレンジに失敗しました");
        return;
      }

      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">対抗を選ぶ</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          キャンセル
        </button>
      </div>

      {post.mode === "image" && (
        <div className="max-w-[160px]">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="challenge-image"
          />
          {previewB ? (
            <label
              htmlFor="challenge-image"
              className="block relative aspect-square rounded-xl overflow-hidden border border-border cursor-pointer"
            >
              <img src={previewB} alt="対抗" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center active:bg-black/20 transition-colors">
                <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">変更</span>
              </div>
            </label>
          ) : (
            <label
              htmlFor="challenge-image"
              className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-neutral-50 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 transition-all"
            >
              <svg className="w-8 h-8 text-muted/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </label>
          )}
        </div>
      )}

      {post.mode === "text" && (
        <textarea
          value={textB}
          onChange={(e) => setTextB(e.target.value)}
          maxLength={50}
          placeholder="あなたの一番"
          className="w-full h-20 rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
        />
      )}

      {isMediaMode && (
        <div className="space-y-3">
          {mediaItem ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50">
              <img src={mediaItem.imageUrl} alt={mediaItem.title} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{mediaItem.title}</p>
                <p className="text-xs text-muted truncate">{mediaItem.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaItem(null)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                変更
              </button>
            </div>
          ) : (
            <>
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                value={searchQuery}
                onChange={(e) => searchMedia(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[post.mode] || "検索"}
                autoFocus
                className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              {isSearching && <p className="text-xs text-muted text-center py-1">検索中...</p>}
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMediaItem(item)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left"
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted truncate">{item.subtitle}</p>
                    </div>
                    {item.previewUrl && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); playPreview(item.previewUrl!); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); playPreview(item.previewUrl!); } }}
                        className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        {playingPreview === item.previewUrl ? (
                          <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reason (optional) */}
      <div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={MAX_REASON_LENGTH}
          placeholder="なぜこれが一番？（任意）"
          className="w-full h-20 rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
        />
        {reason.length > 0 && (
          <p className="text-xs text-muted text-right mt-1">
            {reason.length}/{MAX_REASON_LENGTH}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting || isResizing}
        className="w-full py-3 rounded-lg bg-foreground text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/80 transition-colors"
      >
        {isSubmitting ? "送信中..." : "マッチを挑む"}
      </button>
    </div>
  );
}
