import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  POST_DURATION_MS,
  MAX_IMAGE_SIZE,
  MAX_REASON_LENGTH,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/constants";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function uploadImage(
  supabase: ReturnType<typeof getSupabase>,
  file: File,
  challengerId: string,
  side: "b"
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${challengerId}/${Date.now()}_${side}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const formData = await request.formData();

  const challengerId = (formData.get("device_id") as string)?.trim();
  if (!challengerId) {
    return NextResponse.json({ error: "Missing device_id" }, { status: 400 });
  }

  // Fetch the open post
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.status !== "open") {
    return NextResponse.json({ error: "Already matched" }, { status: 409 });
  }

  if (post.poster_id === challengerId) {
    return NextResponse.json({ error: "Cannot challenge own post" }, { status: 403 });
  }

  const optionBReason = (formData.get("option_b_reason") as string)?.trim() || null;
  if (optionBReason && optionBReason.length > MAX_REASON_LENGTH) {
    return NextResponse.json({ error: "理由は200文字以内にしてください" }, { status: 400 });
  }

  // Build option B fields based on mode
  const update: Record<string, unknown> = {
    status: "active",
    challenger_id: challengerId,
    matched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + POST_DURATION_MS).toISOString(),
    option_b_reason: optionBReason,
  };

  if (post.mode === "image") {
    const imageB = formData.get("image_b") as File | null;
    if (!imageB) {
      return NextResponse.json({ error: "画像を選んでください" }, { status: 400 });
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(imageB.type)) {
      return NextResponse.json(
        { error: "JPEG、PNG、WebP、GIFのみ対応しています" },
        { status: 400 }
      );
    }
    if (imageB.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "画像は2MB以下にしてください" },
        { status: 400 }
      );
    }

    try {
      update.option_b_image_url = await uploadImage(supabase, imageB, challengerId, "b");
    } catch (err) {
      console.error("Image upload failed:", err);
      return NextResponse.json(
        { error: "画像のアップロードに失敗しました" },
        { status: 500 }
      );
    }
  } else if (post.mode === "text") {
    const textB = (formData.get("option_b_text") as string)?.trim();
    if (!textB) {
      return NextResponse.json({ error: "選択肢を入力してください" }, { status: 400 });
    }
    update.option_b_text = textB;
  } else if (post.mode === "music" || post.mode === "movie" || post.mode === "game") {
    const trackBId = (formData.get("option_b_track_id") as string)?.trim();
    if (!trackBId) {
      return NextResponse.json({ error: "コンテンツを選んでください" }, { status: 400 });
    }
    update.option_b_track_id = trackBId;
    update.option_b_text = (formData.get("option_b_text") as string)?.trim() || null;
    update.option_b_artist = (formData.get("option_b_artist") as string)?.trim() || null;
    update.option_b_artwork_url = (formData.get("option_b_artwork_url") as string)?.trim() || null;
    update.option_b_preview_url = (formData.get("option_b_preview_url") as string)?.trim() || null;
  }

  // Optimistic lock: only update if still open
  const { data: updated, error: updateError } = await supabase
    .from("posts")
    .update(update)
    .eq("id", id)
    .eq("status", "open")
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Already matched" }, { status: 409 });
  }

  return NextResponse.json(updated);
}
