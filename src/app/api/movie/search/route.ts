import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q");
  if (!term || term.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query: term.trim(),
    language: "ja-JP",
    region: "JP",
    page: "1",
  });

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?${params.toString()}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "TMDB API error" }, { status: 502 });
  }

  const data = await res.json();

  const results = data.results
    .filter((m: { poster_path: string | null }) => m.poster_path)
    .slice(0, 10)
    .map(
      (m: {
        id: number;
        title: string;
        release_date?: string;
        poster_path: string;
      }) => ({
        id: String(m.id),
        title: m.title,
        subtitle: m.release_date?.slice(0, 4) || "",
        imageUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
        previewUrl: null,
      })
    );

  return NextResponse.json({ results });
}
