import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();

  // Get today's date in JST (UTC+9)
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  const today = jstDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_themes")
    .select("*")
    .eq("date", today)
    .single();

  if (error || !data) {
    return NextResponse.json({ theme: null });
  }

  return NextResponse.json({ theme: data });
}
