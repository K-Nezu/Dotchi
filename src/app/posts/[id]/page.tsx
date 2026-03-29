import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import PostDetailClient from "./PostDetailClient";
import { POST_TTL_MS } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPost(id: string) {
  const { data } = await getSupabase()
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

function isPostExpiredFromDB(post: { created_at: string }) {
  return Date.now() - new Date(post.created_at).getTime() > POST_TTL_MS;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return {};

  const total = post.vote_count_a + post.vote_count_b;
  const isExpired =
    post.is_expired || new Date(post.expires_at).getTime() <= Date.now();

  let title: string;
  let description: string;

  if (post.question) {
    title = `${post.question} - Dotchi`;
  } else {
    title = "どっちがいい？ - Dotchi";
  }

  if (isExpired && total > 0) {
    const pctA = Math.round((post.vote_count_a / total) * 100);
    const pctB = 100 - pctA;
    description = post.question
      ? `「${post.question}」の結果: A ${pctA}% vs B ${pctB}%（${total}票）`
      : `結果: A ${pctA}% vs B ${pctB}%（${total}票）`;
  } else {
    description = "写真2枚で世界に聞く。5分間限定の匿名2択投票。";
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://dotchi.app"}/posts/${id}`;

  const ogImages = post.option_a_image_url
    ? [{ url: post.option_a_image_url, width: 800, height: 600 }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Dotchi",
      type: "website",
      ...(ogImages && { images: ogImages }),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImages && { images: ogImages.map((i) => i.url) }),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || isPostExpiredFromDB(post)) redirect("/");

  return <PostDetailClient post={post} />;
}
