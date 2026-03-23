import Header from "@/components/ui/Header";
import Timeline from "@/components/post/Timeline";
import { createClient } from "@supabase/supabase-js";
import { TIMELINE_RETENTION_MS } from "@/lib/constants";

export const revalidate = 0;

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Show active posts + expired posts within retention window (30 min)
  const retentionCutoff = new Date(Date.now() - TIMELINE_RETENTION_MS).toISOString();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .gte("expires_at", retentionCutoff)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-xl mx-auto px-5 py-8">
        <Timeline initialPosts={(posts as any[]) ?? []} />
      </main>
    </div>
  );
}
