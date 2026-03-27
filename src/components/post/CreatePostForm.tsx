"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_OPTION_TEXT_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/constants";
import { getDeviceId } from "@/lib/device-id";

interface CreatePostFormProps {
  onSuccess?: () => void;
}

export default function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("mode", "text");
      formData.append("poster_id", getDeviceId());
      if (question.trim()) formData.append("question", question.trim());
      formData.append("option_a_text", optionA);
      formData.append("option_b_text", optionB);

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        if (onSuccess) {
          setQuestion("");
          setOptionA("");
          setOptionB("");
          onSuccess();
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    optionA.trim().length > 0 &&
    optionB.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question */}
      <div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="何に迷ってる？"
          autoFocus
          className="w-full rounded-lg border border-border bg-white px-4 py-3.5 text-base placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        <p className="text-xs text-muted text-right mt-1.5">
          {question.length}/{MAX_QUESTION_LENGTH}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
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
          <textarea
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            maxLength={MAX_OPTION_TEXT_LENGTH}
            placeholder="こっち？"
            className="w-full rounded-lg border border-border bg-white p-3.5 text-sm resize-none h-28 placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          <p className="text-xs text-muted text-right mt-1">
            {optionB.length}/{MAX_OPTION_TEXT_LENGTH}
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full py-3.5 rounded-lg bg-foreground text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/80 active:animate-button-press transition-colors"
      >
        {isSubmitting ? "投稿中..." : "5分間、聞いてみる"}
      </button>
    </form>
  );
}
