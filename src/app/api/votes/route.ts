import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { post_id, choice, device_id } = await request.json();

  if (!post_id || !["a", "b"].includes(choice) || !device_id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Check post exists and is not expired
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, expires_at, poster_id")
    .eq("id", post_id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (new Date(post.expires_at) <= new Date()) {
    return NextResponse.json({ error: "Post has expired" }, { status: 400 });
  }

  // Block the poster from voting on their own post
  if (post.poster_id === device_id) {
    return NextResponse.json({ error: "Cannot vote on own post" }, { status: 403 });
  }

  // Insert vote (unique constraint prevents duplicates)
  const { error: voteError } = await supabase
    .from("votes")
    .insert({ post_id, device_id, choice });

  if (voteError) {
    if (voteError.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  // Increment vote count
  const column = choice === "a" ? "vote_count_a" : "vote_count_b";
  const { error } = await supabase.rpc("increment_vote", {
    p_post_id: post_id,
    p_column: column,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
