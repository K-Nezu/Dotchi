import Header from "@/components/ui/Header";
import Timeline from "@/components/post/Timeline";
import DailyThemeBanner from "@/components/post/DailyThemeBanner";
import SplashScreen from "@/components/ui/SplashScreen";
import { createClient } from "@supabase/supabase-js";
import { TIMELINE_RETENTION_MS } from "@/lib/constants";
import { DailyTheme } from "@/lib/types";

export const revalidate = 0;

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get today's date in JST (UTC+9)
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = jstDate.toISOString().split("T")[0];

  // Fetch today's theme and posts in parallel
  const [{ data: theme }, { data: posts }] = await Promise.all([
    supabase
      .from("daily_themes")
      .select("*")
      .eq("date", today)
      .single(),
    supabase
      .from("posts")
      .select("*")
      .gte("expires_at", new Date(Date.now() - TIMELINE_RETENTION_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <SplashScreen />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-xl mx-auto">
          {theme && <DailyThemeBanner theme={theme as DailyTheme} />}
          <Timeline initialPosts={(posts as any[]) ?? []} />
        </main>
      </div>
    </>
  );
}
