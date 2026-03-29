import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q");
  if (!term || term.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const params = new URLSearchParams({
    term: term.trim(),
    media: "music",
    entity: "song",
    limit: "10",
    country: "jp",
  });

  const res = await fetch(
    `https://itunes.apple.com/search?${params.toString()}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "iTunes API error" },
      { status: 502 }
    );
  }

  const data = await res.json();

  const results = data.results.map(
    (t: {
      trackId: number;
      trackName: string;
      artistName: string;
      artworkUrl100: string;
      previewUrl?: string;
    }) => ({
      trackId: String(t.trackId),
      trackName: t.trackName,
      artistName: t.artistName,
      artworkUrl: t.artworkUrl100.replace("100x100bb", "600x600bb"),
      previewUrl: t.previewUrl || null,
    })
  );

  return NextResponse.json({ results });
}
