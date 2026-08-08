import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Open-Meteo geocoding API
    // Using Next.js fetch cache with 30-day revalidation (2592000 seconds)
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
      { next: { revalidate: 2592000 } }
    );

    if (!res.ok) {
      throw new Error(`Geocoding API responded with status: ${res.status}`);
    }

    const data = await res.json();
    const results = data.results || [];

    const formatted = results.map((r: { id: number, name: string, admin1?: string, country?: string, latitude: number, longitude: number, population?: number }) => ({
      id: r.id.toString(),
      name: r.name,
      admin1: r.admin1 || "",
      country: r.country || "",
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population || 50000 // fallback if unknown
    }));

    return NextResponse.json({ results: formatted });
  } catch (error) {
    console.error("Geocoding failed:", error);
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 });
  }
}
