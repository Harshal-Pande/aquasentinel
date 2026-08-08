import { NextResponse } from "next/server";
import { EnvironmentalIndicators } from "@/types";
import { getCachedData, setCachedData, normalizeCoordinates } from "@/lib/cache/supabaseCache";

// GET is now strictly for CACHE LOOKUPS to save client bandwidth/API calls.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const cacheKey = `env:${normalizeCoordinates(lat, lon)}`;

  try {
    const { data: cached, stale } = await getCachedData<EnvironmentalIndicators>('environmental_cache', cacheKey);
    if (cached && !stale) {
      return NextResponse.json(cached);
    }
    // Not cached or stale, return 404 so client knows to fetch from Open-Meteo
    return NextResponse.json({ error: "Not cached" }, { status: 404 });
  } catch (error) {
    console.error("Cache lookup failed:", error);
    return NextResponse.json({ error: "Cache lookup failed" }, { status: 500 });
  }
}

// POST receives raw Open-Meteo data from the client, validates it, calculates anomalies, and caches it.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon, pop, openMeteoData } = body;

    // 1. Validation
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (!openMeteoData || typeof openMeteoData !== 'object') {
      return NextResponse.json({ error: "Missing openMeteoData" }, { status: 400 });
    }

    const current = openMeteoData.current || {};
    const daily = openMeteoData.daily || {};

    // Validate expected numeric fields
    if (typeof current.temperature_2m !== 'number') {
      return NextResponse.json({ error: "Invalid environmental payload" }, { status: 400 });
    }

    const population = pop ? parseInt(pop.toString()) : 50000;
    const cacheKey = `env:${normalizeCoordinates(lat, lon)}`;
    const timestamp = new Date().toISOString();

    // 2. Anomaly Calculations (Existing Server-Side Logic)
    const pastPrecip = daily.precipitation_sum || [];
    const avgPrecip = pastPrecip.length ? pastPrecip.reduce((a: number, b: number) => a + (b || 0), 0) / pastPrecip.length : 0;
    const currentPrecip = current.precipitation || 0;

    // Rainfall Anomaly (% difference from 30-day avg)
    let rainfallAnomaly = 0;
    if (avgPrecip === 0 && currentPrecip === 0) rainfallAnomaly = -10; // Arid assumption
    else if (avgPrecip === 0) rainfallAnomaly = 100;
    else rainfallAnomaly = ((currentPrecip - avgPrecip) / avgPrecip) * 100;

    // Cap at sensible values
    rainfallAnomaly = Math.max(-100, Math.min(200, rainfallAnomaly));

    // Temperature Anomaly
    const pastTemp = daily.temperature_2m_max || [];
    const avgTemp = pastTemp.length ? pastTemp.reduce((a: number, b: number) => a + (b || 0), 0) / pastTemp.length : current.temperature_2m;
    const tempAnomaly = current.temperature_2m - avgTemp;

    // Vegetation/Soil Moisture Stress (0 to 1)
    const soilMoisture = current.soil_moisture_0_to_7cm !== null ? current.soil_moisture_0_to_7cm : 0.2;
    const vegStress = Math.max(0, Math.min(1, 1 - (soilMoisture / 0.4)));

    // Water Availability Proxy
    const waterAvail = Math.max(0.1, Math.min(1, (currentPrecip > 0 ? 0.4 : 0.1) + (1 - vegStress) * 0.5));

    const indicators: EnvironmentalIndicators = {
      rainfall_anomaly: {
        value: Math.round(rainfallAnomaly * 10) / 10,
        source: "Open-Meteo (30-day Baseline)",
        fetchedAt: timestamp,
        confidence: "MEDIUM",
        isEstimated: true,
        isLive: true
      },
      temperature_anomaly: {
        value: Math.round(tempAnomaly * 10) / 10,
        source: "Open-Meteo (30-day Baseline)",
        fetchedAt: timestamp,
        confidence: "MEDIUM",
        isEstimated: true,
        isLive: true
      },
      vegetation_stress: {
        value: Math.round(vegStress * 100) / 100,
        source: "Open-Meteo Soil Moisture",
        fetchedAt: timestamp,
        confidence: "MEDIUM",
        isEstimated: true,
        isLive: true
      },
      water_availability: {
        value: Math.round(waterAvail * 100) / 100,
        source: "AquaSentinel Heuristic",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: false
      },
      population_density: {
        value: Math.round(population / 100),
        source: "Geocoding Proxy",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: false
      }
    };

    // 3. Cache and Return
    await setCachedData('environmental_cache', cacheKey, indicators);
    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Environmental POST failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process environmental data" },
      { status: 500 }
    );
  }
}
