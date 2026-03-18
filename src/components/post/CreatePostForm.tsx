"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostMode } from "@/lib/types";
import { MAX_OPTION_TEXT_LENGTH } from "@/lib/constants";

export default function CreatePostForm() {
  const router = useRouter();
  const [mode, setMode] = useState<PostMode>("text");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [imageA, setImageA] = useState<File | null>(null);
  const [imageB, setImageB] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("mode", mode);

      if (mode === "text") {
        formData.append("option_a_text", optionA);
        formData.append("option_b_text", optionB);
      } else {
        if (imageA) formData.append("option_a_image", imageA);
        if (imageB) formData.append("option_b_image", imageB);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    mode === "text"
      ? optionA.trim().length > 0 && optionB.trim().length > 0
      : imageA != null && imageB != null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 bg-primary-light/20 rounded-full p-1">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "text"
              ? "bg-primary text-white"
              : "text-foreground hover:bg-primary-light/30"
          }`}
        >
          テキスト
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === "image"
              ? "bg-primary text-white"
              : "text-foreground hover:bg-primary-light/30"
          }`}
        >
          画像
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {mode === "text" ? (
          <>
            <div>
              <label className="block text-sm text-muted mb-1">選択肢 A</label>
              <textarea
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                maxLength={MAX_OPTION_TEXT_LENGTH}
                placeholder="こっち？"
                className="w-full rounded-xl border border-primary-light/30 bg-card p-3 text-sm resize-none h-24 focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-muted text-right">
                {optionA.length}/{MAX_OPTION_TEXT_LENGTH}
              </p>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">選択肢 B</label>
              <textarea
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                maxLength={MAX_OPTION_TEXT_LENGTH}
                placeholder="あっち？"
                className="w-full rounded-xl border border-primary-light/30 bg-card p-3 text-sm resize-none h-24 focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-muted text-right">
                {optionB.length}/{MAX_OPTION_TEXT_LENGTH}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm text-muted mb-1">画像 A</label>
              <label className="block aspect-square rounded-xl border-2 border-dashed border-primary-light/50 bg-card hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden">
                {imageA ? (
                  <img
                    src={URL.createObjectURL(imageA)}
                    alt="A"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-muted">+</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageA(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">画像 B</label>
              <label className="block aspect-square rounded-xl border-2 border-dashed border-primary-light/50 bg-card hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden">
                {imageB ? (
                  <img
                    src={URL.createObjectURL(imageB)}
                    alt="B"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-muted">+</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageB(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full py-3 rounded-full bg-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
      >
        {isSubmitting ? "投稿中..." : "5分間だけ世界に聞く"}
      </button>
    </form>
  );
}
