import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  POST_DURATION_MS,
  MAX_CAPTION_LENGTH,
  MAX_IMAGE_SIZE,
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
  posterId: string,
  side: "a" | "b"
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${posterId}/${Date.now()}_${side}.${ext}`;

  // Convert File to Buffer for server-side Supabase upload
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("post-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const formData = await request.formData();

  const mode = (formData.get("mode") as string) || "image";
  const posterId = (formData.get("poster_id") as string)?.trim();
  if (!posterId) {
    return NextResponse.json({ error: "Missing poster_id" }, { status: 400 });
  }

  const caption = (formData.get("caption") as string)?.trim() || null;
  if (caption && caption.length > MAX_CAPTION_LENGTH) {
    return NextResponse.json({ error: "キャプションが長すぎます" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + POST_DURATION_MS);

  const base = {
    mode,
    question: caption,
    option_a_text: null as string | null,
    option_b_text: null as string | null,
    option_a_image_url: null as string | null,
    option_b_image_url: null as string | null,
    option_a_track_id: null as string | null,
    option_b_track_id: null as string | null,
    option_a_artist: null as string | null,
    option_b_artist: null as string | null,
    option_a_preview_url: null as string | null,
    option_b_preview_url: null as string | null,
    option_a_artwork_url: null as string | null,
    option_b_artwork_url: null as string | null,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    vote_count_a: 0,
    vote_count_b: 0,
    is_expired: false,
    poster_choice: null,
    poster_id: posterId,
  };

  if (mode === "image") {
    const imageA = formData.get("image_a") as File | null;
    const imageB = formData.get("image_b") as File | null;

    if (!imageA || !imageB) {
      return NextResponse.json({ error: "画像を2枚選んでください" }, { status: 400 });
    }

    for (const img of [imageA, imageB]) {
      if (!ACCEPTED_IMAGE_TYPES.includes(img.type)) {
        return NextResponse.json(
          { error: "JPEG、PNG、WebP、GIFのみ対応しています" },
          { status: 400 }
        );
      }
      if (img.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "画像は2MB以下にしてください" },
          { status: 400 }
        );
      }
    }

    try {
      [base.option_a_image_url, base.option_b_image_url] = await Promise.all([
        uploadImage(supabase, imageA, posterId, "a"),
        uploadImage(supabase, imageB, posterId, "b"),
      ]);
    } catch (err) {
      console.error("Image upload failed:", err);
      return NextResponse.json(
        { error: "画像のアップロードに失敗しました" },
        { status: 500 }
      );
    }
  } else if (mode === "text") {
    const textA = (formData.get("option_a_text") as string)?.trim();
    const textB = (formData.get("option_b_text") as string)?.trim();
    if (!textA || !textB) {
      return NextResponse.json({ error: "選択肢を2つ入力してください" }, { status: 400 });
    }
    base.option_a_text = textA;
    base.option_b_text = textB;
  } else if (mode === "music") {
    const trackAId = (formData.get("option_a_track_id") as string)?.trim();
    const trackBId = (formData.get("option_b_track_id") as string)?.trim();
    const trackAName = (formData.get("option_a_text") as string)?.trim();
    const trackBName = (formData.get("option_b_text") as string)?.trim();
    const artistA = (formData.get("option_a_artist") as string)?.trim();
    const artistB = (formData.get("option_b_artist") as string)?.trim();
    const previewA = (formData.get("option_a_preview_url") as string)?.trim();
    const previewB = (formData.get("option_b_preview_url") as string)?.trim();
    const artworkA = (formData.get("option_a_artwork_url") as string)?.trim();
    const artworkB = (formData.get("option_b_artwork_url") as string)?.trim();

    if (!trackAId || !trackBId) {
      return NextResponse.json({ error: "曲を2つ選んでください" }, { status: 400 });
    }

    base.option_a_track_id = trackAId;
    base.option_b_track_id = trackBId;
    base.option_a_text = trackAName || null;
    base.option_b_text = trackBName || null;
    base.option_a_artist = artistA || null;
    base.option_b_artist = artistB || null;
    base.option_a_preview_url = previewA || null;
    base.option_b_preview_url = previewB || null;
    base.option_a_artwork_url = artworkA || null;
    base.option_b_artwork_url = artworkB || null;
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(base)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabase();
  const { post_id, poster_choice, device_id } = await request.json();

  if (!post_id || !["a", "b"].includes(poster_choice) || !device_id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

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
