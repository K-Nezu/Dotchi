"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostMode } from "@/lib/types";
import { MAX_OPTION_TEXT_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/constants";

export default function CreatePostForm() {
  const router = useRouter();
  const [mode, setMode] = useState<PostMode>("text");
  const [question, setQuestion] = useState("");
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
      if (question.trim()) formData.append("question", question.trim());

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === "text"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          テキスト
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === "image"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          画像
        </button>
      </div>

      {/* Question */}
      <div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="質問を添える（任意）例: 今日のデートどっち？"
          className="w-full rounded-lg border border-border bg-white px-4 py-3.5 text-sm placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <p className="text-xs text-muted text-right mt-1.5">
          {question.length}/{MAX_QUESTION_LENGTH}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {mode === "text" ? (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">選択肢 A</label>
              <textarea
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                maxLength={MAX_OPTION_TEXT_LENGTH}
                placeholder="こっち？"
                className="w-full rounded-lg border border-border bg-white p-3.5 text-sm resize-none h-28 placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <p className="text-xs text-muted text-right mt-1">
                {optionA.length}/{MAX_OPTION_TEXT_LENGTH}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">選択肢 B</label>
              <textarea
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                maxLength={MAX_OPTION_TEXT_LENGTH}
                placeholder="あっち？"
                className="w-full rounded-lg border border-border bg-white p-3.5 text-sm resize-none h-28 placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <p className="text-xs text-muted text-right mt-1">
                {optionB.length}/{MAX_OPTION_TEXT_LENGTH}
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">画像 A</label>
              <label className="block aspect-square rounded-lg border-2 border-dashed border-border bg-neutral-50 hover:border-foreground/30 cursor-pointer flex items-center justify-center overflow-hidden transition-colors">
                {imageA ? (
                  <img
                    src={URL.createObjectURL(imageA)}
                    alt="A"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-muted/40">+</span>
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
              <label className="block text-sm font-medium text-foreground mb-2">画像 B</label>
              <label className="block aspect-square rounded-lg border-2 border-dashed border-border bg-neutral-50 hover:border-foreground/30 cursor-pointer flex items-center justify-center overflow-hidden transition-colors">
                {imageB ? (
                  <img
                    src={URL.createObjectURL(imageB)}
                    alt="B"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-muted/40">+</span>
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
        className="w-full py-3.5 rounded-lg bg-foreground text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/80 transition-colors"
      >
        {isSubmitting ? "投稿中..." : "5分間だけ世界に聞く"}
      </button>
    </form>
  );
}
