"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostMode } from "@/lib/types";
import { MAX_CAPTION_LENGTH, MAX_OPTION_TEXT_LENGTH, ACCEPTED_IMAGE_TYPES } from "@/lib/constants";
import { getDeviceId } from "@/lib/device-id";
import { resizeImage } from "@/lib/resize-image";

interface CreatePostFormProps {
  onSuccess?: () => void;
}

interface MusicTrack {
  trackId: string;
  trackName: string;
  artistName: string;
  artworkUrl: string;
  previewUrl: string | null;
}

const MODES: { key: PostMode; label: string }[] = [
  { key: "music", label: "音楽" },
  { key: "image", label: "画像" },
  { key: "text", label: "テキスト" },
];

export default function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<PostMode>("image");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [imageA, setImageA] = useState<File | null>(null);
  const [imageB, setImageB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  // Text state
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");

  // Music state
  const [trackA, setTrackA] = useState<MusicTrack | null>(null);
  const [trackB, setTrackB] = useState<MusicTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectingSide, setSelectingSide] = useState<"a" | "b" | null>(null);
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
    (side: "a" | "b") => async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (side === "a") {
          if (previewA) URL.revokeObjectURL(previewA);
          setImageA(resized);
          setPreviewA(url);
        } else {
          if (previewB) URL.revokeObjectURL(previewB);
          setImageB(resized);
          setPreviewB(url);
        }
      } catch {
        setError("画像の処理に失敗しました");
      } finally {
        setIsResizing(false);
      }
    },
    [previewA, previewB]
  );

  const searchMusic = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectTrack = (track: MusicTrack) => {
    if (selectingSide === "a") setTrackA(track);
    else setTrackB(track);
    setSelectingSide(null);
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

      if (mode === "image") {
        formData.append("image_a", imageA!);
        formData.append("image_b", imageB!);
      } else if (mode === "text") {
        formData.append("option_a_text", textA.trim());
        formData.append("option_b_text", textB.trim());
      } else if (mode === "music" && trackA && trackB) {
        formData.append("option_a_track_id", trackA.trackId);
        formData.append("option_b_track_id", trackB.trackId);
        formData.append("option_a_text", trackA.trackName);
        formData.append("option_b_text", trackB.trackName);
        formData.append("option_a_artist", trackA.artistName);
        formData.append("option_b_artist", trackB.artistName);
        if (trackA.previewUrl) formData.append("option_a_preview_url", trackA.previewUrl);
        if (trackB.previewUrl) formData.append("option_b_preview_url", trackB.previewUrl);
        formData.append("option_a_artwork_url", trackA.artworkUrl);
        formData.append("option_b_artwork_url", trackB.artworkUrl);
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
    setImageA(null);
    setImageB(null);
    if (previewA) URL.revokeObjectURL(previewA);
    if (previewB) URL.revokeObjectURL(previewB);
    setPreviewA(null);
    setPreviewB(null);
    setTextA("");
    setTextB("");
    setTrackA(null);
    setTrackB(null);
    setSearchQuery("");
    setSearchResults([]);
    stopPreview();
  };

  const isValid =
    mode === "image"
      ? imageA !== null && imageB !== null
      : mode === "text"
        ? textA.trim().length > 0 && textB.trim().length > 0
        : mode === "music"
          ? trackA !== null && trackB !== null
          : false;

  const submitLabel = isSubmitting ? "投稿中..." : isResizing ? "画像を処理中..." : "世界に聞く";

  const imagePickerContent = (hasPreview: boolean, previewUrl: string | null, side: "a" | "b") => {
    if (hasPreview && previewUrl) {
      return (
        <label
          htmlFor={`image-${side}`}
          className="block relative aspect-square rounded-xl overflow-hidden border border-border cursor-pointer"
        >
          <img
            src={previewUrl}
            alt={`選択肢${side.toUpperCase()}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute top-2.5 left-2.5 z-10 text-xs font-semibold text-white/70">
            {side.toUpperCase()}
          </span>
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 active:bg-black/20 transition-colors">
            <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              変更
            </span>
          </div>
        </label>
      );
    }

    return (
      <label
        htmlFor={`image-${side}`}
        className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-neutral-50 flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 hover:bg-neutral-100 transition-all"
      >
        <span className="absolute top-2.5 left-2.5 text-xs font-semibold text-muted/60">{side.toUpperCase()}</span>
        <svg className="w-8 h-8 text-muted/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
      </label>
    );
  };

  const trackCard = (track: MusicTrack | null, side: "a" | "b") => {
    if (track) {
      return (
        <div className="aspect-square rounded-xl border border-border bg-white overflow-hidden flex flex-col">
          <div className="relative flex-1 min-h-0">
            <img
              src={track.artworkUrl}
              alt={track.trackName}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2.5 left-2.5 z-10 text-xs font-semibold text-white/70">
              {side.toUpperCase()}
            </span>
            {track.previewUrl && (
              <button
                type="button"
                onClick={() => playPreview(track.previewUrl!)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                  {playingPreview === track.previewUrl ? (
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
            <p className="text-xs font-medium text-foreground truncate">{track.trackName}</p>
            <p className="text-[10px] text-muted truncate">{track.artistName}</p>
          </div>
          <button
            type="button"
            onClick={() => { if (side === "a") setTrackA(null); else setTrackB(null); stopPreview(); }}
            className="px-2.5 pb-2 text-[10px] text-muted hover:text-foreground transition-colors text-left"
          >
            変更
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => { setSelectingSide(side); setSearchQuery(""); setSearchResults([]); }}
        className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-neutral-50 flex flex-col items-center justify-center hover:border-foreground/30 hover:bg-neutral-100 transition-all"
      >
        <span className="absolute top-2.5 left-2.5 text-xs font-semibold text-muted/60">{side.toUpperCase()}</span>
        <svg className="w-8 h-8 text-muted/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V4.5l-10.5 3v6.553m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 13.053Z" />
        </svg>
        <span className="text-xs text-muted/60">曲を選ぶ</span>
      </button>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode selector */}
      <div className="flex bg-neutral-100 rounded-xl p-1 mt-4">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setError(null); setSelectingSide(null); stopPreview(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted hover:text-foreground/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Caption (common) */}
      <div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={MAX_CAPTION_LENGTH}
          placeholder="何に迷ってる？（任意）"
          className="w-full rounded-lg border border-border bg-white px-4 py-3.5 text-base placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <p className="text-xs text-muted text-right mt-1.5">
          {caption.length}/{MAX_CAPTION_LENGTH}
        </p>
      </div>

      {/* Option inputs */}
      <div className="grid grid-cols-2 gap-3">
        {mode === "image" && (
          <>
            <div>
              <input
                ref={inputARef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect("a")}
                className="hidden"
                id="image-a"
              />
              {imagePickerContent(!!previewA, previewA, "a")}
            </div>
            <div>
              <input
                ref={inputBRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect("b")}
                className="hidden"
                id="image-b"
              />
              {imagePickerContent(!!previewB, previewB, "b")}
            </div>
          </>
        )}

        {mode === "text" && (
          <>
            <textarea
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              maxLength={MAX_OPTION_TEXT_LENGTH}
              placeholder="選択肢 A"
              className="aspect-square rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
            />
            <textarea
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              maxLength={MAX_OPTION_TEXT_LENGTH}
              placeholder="選択肢 B"
              className="aspect-square rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
            />
          </>
        )}

        {mode === "music" && !selectingSide && (
          <>
            {trackCard(trackA, "a")}
            {trackCard(trackB, "b")}
          </>
        )}
      </div>

      {/* Music search overlay */}
      {mode === "music" && selectingSide && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setSelectingSide(null); setSearchQuery(""); setSearchResults([]); stopPreview(); }}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              戻る
            </button>
            <span className="text-sm font-medium text-foreground">
              曲{selectingSide === "a" ? " A" : " B"}を検索
            </span>
          </div>
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            value={searchQuery}
            onChange={(e) => searchMusic(e.target.value)}
            placeholder="曲名やアーティスト名で検索"
            autoFocus
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          {isSearching && (
            <p className="text-xs text-muted text-center py-2">検索中...</p>
          )}
          <div className="max-h-[280px] overflow-y-auto space-y-1">
            {searchResults.map((track) => (
              <button
                key={track.trackId}
                type="button"
                onClick={() => selectTrack(track)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left"
              >
                <img
                  src={track.artworkUrl}
                  alt={track.trackName}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{track.trackName}</p>
                  <p className="text-xs text-muted truncate">{track.artistName}</p>
                </div>
                {track.previewUrl && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); playPreview(track.previewUrl!); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); playPreview(track.previewUrl!); } }}
                    className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    {playingPreview === track.previewUrl ? (
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
