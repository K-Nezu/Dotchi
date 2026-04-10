import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { post_id, choice, device_id, comment } = await request.json();

  if (!post_id || !["a", "b"].includes(choice) || !device_id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Check post exists, is active, and not expired
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, expires_at, poster_id, status, challenger_id")
    .eq("id", post_id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.status !== "active") {
    return NextResponse.json({ error: "Post is not active" }, { status: 400 });
  }

  if (new Date(post.expires_at) <= new Date()) {
    return NextResponse.json({ error: "Post has expired" }, { status: 400 });
  }

  // Block the poster from voting on their own post
  if (post.poster_id === device_id) {
    return NextResponse.json({ error: "Cannot vote on own post" }, { status: 403 });
  }

  // Block the challenger from voting
  if (post.challenger_id === device_id) {
    return NextResponse.json({ error: "Cannot vote on challenged post" }, { status: 403 });
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

  // Save comment if provided
  const commentText = typeof comment === "string" ? comment.trim() : "";
  if (commentText && commentText.length <= 100) {
    await supabase
      .from("comments")
      .insert({ post_id, device_id, choice, body: commentText });
  }

  return NextResponse.json({ success: true });
}
