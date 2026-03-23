import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { post_id, choice } = await request.json();

  if (!post_id || !["a", "b"].includes(choice)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Check post exists and is not expired
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, expires_at")
    .eq("id", post_id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (new Date(post.expires_at) <= new Date()) {
    return NextResponse.json({ error: "Post has expired" }, { status: 400 });
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
