import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q");
  if (!term || term.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RAWG API key not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    search: term.trim(),
    key: apiKey,
    page_size: "10",
  });

  const res = await fetch(
    `https://api.rawg.io/api/games?${params.toString()}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "RAWG API error" }, { status: 502 });
  }

  const data = await res.json();

  const results = (data.results || [])
    .filter((g: { background_image: string | null }) => g.background_image)
    .slice(0, 10)
    .map(
      (g: {
        id: number;
        name: string;
        genres?: { name: string }[];
        background_image: string;
      }) => ({
        id: String(g.id),
        title: g.name,
        subtitle: g.genres?.[0]?.name || "",
        imageUrl: g.background_image,
        previewUrl: null,
      })
    );

  return NextResponse.json({ results });
}
