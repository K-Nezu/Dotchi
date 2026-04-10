"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostMode, MediaItem } from "@/lib/types";
import { MAX_CAPTION_LENGTH, MAX_REASON_LENGTH, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";
import { getDeviceId } from "@/lib/device-id";
import { resizeImage } from "@/lib/resize-image";

interface CreatePostFormProps {
  onSuccess?: () => void;
  themeId?: string;
  defaultMode?: PostMode;
}

const MODES: { key: PostMode; label: string }[] = [
  { key: "music", label: "音楽" },
  { key: "movie", label: "映画" },
  { key: "game", label: "ゲーム" },
  { key: "image", label: "画像" },
  { key: "text", label: "テキスト" },
];

const SEARCH_ENDPOINTS: Record<string, string> = {
  music: "/api/music/search",
  movie: "/api/movie/search",
  game: "/api/game/search",
};

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  music: "曲名やアーティスト名で検索",
  movie: "映画タイトルで検索",
  game: "英語でゲームタイトルを検索",
};

const PICK_LABELS: Record<string, string> = {
  music: "曲を選ぶ",
  movie: "映画を選ぶ",
  game: "ゲームを選ぶ",
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

export default function CreatePostForm({ onSuccess, themeId, defaultMode }: CreatePostFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PostMode>(defaultMode ?? "music");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state (option A only)
  const [imageA, setImageA] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);

  // Text state (option A only)
  const [textA, setTextA] = useState("");

  // Reason state
  const [reason, setReason] = useState("");

  // Media state (music/movie/game - option A only)
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [isSelectingMedia, setIsSelectingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop audio when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [mode]);

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
        if (previewA) URL.revokeObjectURL(previewA);
        setImageA(resized);
        setPreviewA(url);
      } catch {
        setError("画像の処理に失敗しました");
      } finally {
        setIsResizing(false);
      }
    },
    [previewA]
  );

  const searchMedia = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const endpoint = SEARCH_ENDPOINTS[mode];
    if (!endpoint) return;

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSearchResults(
          (data.results || []).map((r: Record<string, unknown>) => normalizeMediaItem(mode, r))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectMedia = (item: MediaItem) => {
    setMediaItem(item);
    setIsSelectingMedia(false);
    setSearchQuery("");
    setSearchResults([]);
    stopPreview();
  };

  const playPreview = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
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

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("poster_id", getDeviceId());
      if (caption.trim()) formData.append("caption", caption.trim());
      if (reason.trim()) formData.append("option_a_reason", reason.trim());
      if (themeId) formData.append("theme_id", themeId);

      if (mode === "image") {
        formData.append("image_a", imageA!);
      } else if (mode === "text") {
        formData.append("option_a_text", textA.trim());
      } else if (mediaItem) {
        formData.append("option_a_track_id", mediaItem.id);
        formData.append("option_a_text", mediaItem.title);
        formData.append("option_a_artist", mediaItem.subtitle);
        formData.append("option_a_artwork_url", mediaItem.imageUrl);
        if (mediaItem.previewUrl) formData.append("option_a_preview_url", mediaItem.previewUrl);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "投稿に失敗しました");
        return;
      }

      if (onSuccess) {
        resetForm();
        onSuccess();
      } else {
        router.push("/");
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setReason("");
    setImageA(null);
    if (previewA) URL.revokeObjectURL(previewA);
    setPreviewA(null);
    setTextA("");
    setMediaItem(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsSelectingMedia(false);
    stopPreview();
  };

  const isMediaMode = mode === "music" || mode === "movie" || mode === "game";

  const isValid =
    mode === "image"
      ? imageA !== null
      : mode === "text"
        ? textA.trim().length > 0
        : isMediaMode
          ? mediaItem !== null
          : false;

  const submitLabel = isSubmitting ? "投稿中..." : isResizing ? "画像を処理中..." : "マッチ相手を募集";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode selector */}
      <div className="flex bg-neutral-100 rounded-xl p-1 mt-4 overflow-x-auto">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setMode(key);
              setError(null);
              setIsSelectingMedia(false);
              stopPreview();
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              mode === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted hover:text-foreground/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={MAX_CAPTION_LENGTH}
          placeholder="ひとこと（任意）"
          className="w-full rounded-lg border border-border bg-white px-4 py-3.5 text-base placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <p className="text-xs text-muted text-right mt-1.5">
          {caption.length}/{MAX_CAPTION_LENGTH}
        </p>
      </div>

      {/* Option A input - single side */}
      <div>
        <p className="text-xs text-muted mb-2">あなたの一番を選ぶ</p>

        {mode === "image" && (
          <div className="max-w-[200px]">
            <input
              ref={inputARef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-a"
            />
            {previewA ? (
              <label
                htmlFor="image-a"
                className="block relative aspect-square rounded-xl overflow-hidden border border-border cursor-pointer"
              >
                <img
                  src={previewA}
                  alt="選択肢A"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 active:bg-black/20 transition-colors">
                  <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                    変更
                  </span>
                </div>
              </label>
            ) : (
              <label
                htmlFor="image-a"
                className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-neutral-50 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 hover:bg-neutral-100 transition-all"
              >
                <svg className="w-8 h-8 text-muted/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                <span className="text-xs text-muted/60">画像を選ぶ</span>
              </label>
            )}
          </div>
        )}

        {mode === "text" && (
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            maxLength={50}
            placeholder="あなたの一番"
            className="w-full h-24 rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
          />
        )}

        {isMediaMode && !isSelectingMedia && (
          <div className="max-w-[200px]">
            {mediaItem ? (
              <div className="aspect-square rounded-xl border border-border bg-white overflow-hidden flex flex-col">
                <div className="relative flex-1 min-h-0">
                  <img
                    src={mediaItem.imageUrl}
                    alt={mediaItem.title}
                    className="w-full h-full object-cover"
                  />
                  {mediaItem.previewUrl && (
                    <button
                      type="button"
                      onClick={() => playPreview(mediaItem.previewUrl!)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                        {playingPreview === mediaItem.previewUrl ? (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-xs font-medium text-foreground truncate">{mediaItem.title}</p>
                  <p className="text-[10px] text-muted truncate">{mediaItem.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setMediaItem(null); stopPreview(); }}
                  className="px-2.5 pb-2 text-[10px] text-muted hover:text-foreground transition-colors text-left"
                >
                  変更
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setIsSelectingMedia(true); setSearchQuery(""); setSearchResults([]); }}
                className="relative w-full aspect-square rounded-xl border-2 border-dashed border-border bg-neutral-50 flex flex-col items-center justify-center hover:border-foreground/30 hover:bg-neutral-100 transition-all"
              >
                <svg className="w-8 h-8 text-muted/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span className="text-xs text-muted/60">{PICK_LABELS[mode]}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media search overlay */}
      {isMediaMode && isSelectingMedia && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsSelectingMedia(false); setSearchQuery(""); setSearchResults([]); stopPreview(); }}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              戻る
            </button>
            <span className="text-sm font-medium text-foreground">
              あなたの一番を検索
            </span>
          </div>
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            value={searchQuery}
            onChange={(e) => searchMedia(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[mode] || "検索"}
            autoFocus
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          {isSearching && (
            <p className="text-xs text-muted text-center py-2">検索中...</p>
          )}
          <div className="max-h-[280px] overflow-y-auto space-y-1">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectMedia(item)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
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
        </div>
      )}

      {/* Reason (optional) */}
      {!isSelectingMedia && (
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
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting || isResizing}
        className="w-full py-3.5 rounded-lg bg-foreground text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/80 active:animate-button-press transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
