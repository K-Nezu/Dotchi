import Header from "@/components/ui/Header";
import Timeline from "@/components/post/Timeline";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <Timeline initialPosts={(posts as any[]) ?? []} />
      </main>
    </div>
  );
}
