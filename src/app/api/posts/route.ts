import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { POST_DURATION_MS, MAX_OPTION_TEXT_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/constants";
import { PostMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const formData = await request.formData();

  const mode = formData.get("mode") as PostMode;
  if (!mode || !["text", "image"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const question = (formData.get("question") as string)?.trim() || null;
  if (question && question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Question too long" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + POST_DURATION_MS);

  let optionAText: string | null = null;
  let optionBText: string | null = null;
  let optionAImageUrl: string | null = null;
  let optionBImageUrl: string | null = null;

  if (mode === "text") {
    optionAText = (formData.get("option_a_text") as string)?.trim();
    optionBText = (formData.get("option_b_text") as string)?.trim();

    if (
      !optionAText ||
      !optionBText ||
      optionAText.length > MAX_OPTION_TEXT_LENGTH ||
      optionBText.length > MAX_OPTION_TEXT_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
  } else {
    const imageA = formData.get("option_a_image") as File | null;
    const imageB = formData.get("option_b_image") as File | null;

    if (!imageA || !imageB) {
      return NextResponse.json(
        { error: "Two images required" },
        { status: 400 }
      );
    }

    const postId = crypto.randomUUID();

    const [uploadA, uploadB] = await Promise.all([
      supabase.storage
        .from("post-images")
        .upload(`${postId}/a`, imageA, { contentType: imageA.type }),
      supabase.storage
        .from("post-images")
        .upload(`${postId}/b`, imageB, { contentType: imageB.type }),
    ]);

    if (uploadA.error || uploadB.error) {
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 500 }
      );
    }

    const { data: urlA } = supabase.storage
      .from("post-images")
      .getPublicUrl(`${postId}/a`);
    const { data: urlB } = supabase.storage
      .from("post-images")
      .getPublicUrl(`${postId}/b`);

    optionAImageUrl = urlA.publicUrl;
    optionBImageUrl = urlB.publicUrl;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      mode,
      question,
      option_a_text: optionAText,
      option_b_text: optionBText,
      option_a_image_url: optionAImageUrl,
      option_b_image_url: optionBImageUrl,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      vote_count_a: 0,
      vote_count_b: 0,
      is_expired: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
