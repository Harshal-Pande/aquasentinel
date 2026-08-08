import { NextResponse } from "next/server";
import { getCachedData, setCachedData, normalizeCoordinates } from "@/lib/cache/supabaseCache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const reverse = searchParams.get("reverse") === "true";

  try {
    if (reverse && latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const cacheKey = `rev:${normalizeCoordinates(lat, lon)}`;

      const { data: cached, stale } = await getCachedData<unknown>('locations', cacheKey);
      if (cached && !stale) {
        return NextResponse.json(cached);
      }

      // OpenStreetMap Nominatim for Reverse Geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,
        { headers: { 'User-Agent': 'AquaSentinel-Hackathon-Prototype' } }
      );

      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || "Unnamed Location";
      const region = data.address?.state || data.address?.region || "";
      const country = data.address?.country || "";

      const result = {
        id: `rev-${lat}-${lon}`,
        name: city,
        admin1: region,
        country: country,
        latitude: lat,
        longitude: lon,
        population: 50000 // Default proxy for arbitrary coordinates
      };

      await setCachedData('locations', cacheKey, result);
      return NextResponse.json(result);
    } 
    
    if (query && query.length >= 2) {
      const cacheKey = `search:${query.toLowerCase()}`;
      const { data: cached, stale } = await getCachedData<unknown>('locations', cacheKey);
      
      if (cached && !stale) {
        return NextResponse.json({ results: cached });
      }

      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );

      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();
      const results = data.results || [];

      const formatted = results.map((r: { id: number, name: string, admin1?: string, country?: string, latitude: number, longitude: number, population?: number }) => ({
        id: r.id.toString(),
        name: r.name,
        admin1: r.admin1 || "",
        country: r.country || "",
        latitude: r.latitude,
        longitude: r.longitude,
        population: r.population || 50000
      }));

      await setCachedData('locations', cacheKey, formatted);
      return NextResponse.json({ results: formatted });
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json({ error: "Location lookup failed" }, { status: 500 });
  }
}
