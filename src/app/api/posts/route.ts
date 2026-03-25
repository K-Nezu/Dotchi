import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { POST_DURATION_MS, MAX_OPTION_TEXT_LENGTH, MAX_QUESTION_LENGTH } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const formData = await request.formData();

  const question = (formData.get("question") as string)?.trim() || null;
  if (question && question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Question too long" }, { status: 400 });
  }

  const posterId = (formData.get("poster_id") as string)?.trim();
  if (!posterId) {
    return NextResponse.json({ error: "Missing poster_id" }, { status: 400 });
  }

  const optionAText = (formData.get("option_a_text") as string)?.trim();
  const optionBText = (formData.get("option_b_text") as string)?.trim();

  if (
    !optionAText ||
    !optionBText ||
    optionAText.length > MAX_OPTION_TEXT_LENGTH ||
    optionBText.length > MAX_OPTION_TEXT_LENGTH
  ) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + POST_DURATION_MS);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      mode: "text",
      question,
      option_a_text: optionAText,
      option_b_text: optionBText,
      option_a_image_url: null,
      option_b_image_url: null,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      vote_count_a: 0,
      vote_count_b: 0,
      is_expired: false,
      poster_choice: null,
      poster_id: posterId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { post_id, poster_choice, device_id } = await request.json();

  if (!post_id || !["a", "b"].includes(poster_choice) || !device_id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Only allow the poster to set their choice
  const { data: post } = await supabase
    .from("posts")
    .select("poster_choice, poster_id")
    .eq("id", post_id)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.poster_id !== device_id) {
    return NextResponse.json({ error: "Not the poster" }, { status: 403 });
  }

  if (post.poster_choice !== null) {
    return NextResponse.json({ error: "Already chosen" }, { status: 400 });
  }

  const { error } = await supabase
    .from("posts")
    .update({ poster_choice })
    .eq("id", post_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
