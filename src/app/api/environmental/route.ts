import { NextResponse } from "next/server";
import { EnvironmentalIndicators } from "@/types";
import { getCachedData, setCachedData, normalizeCoordinates } from "@/lib/cache/supabaseCache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const popStr = searchParams.get("pop");

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const population = popStr ? parseInt(popStr) : 50000;
  const cacheKey = `env:${normalizeCoordinates(lat, lon)}`;

  try {
    const { data: cached, stale } = await getCachedData<EnvironmentalIndicators>('environmental_cache', cacheKey);
    if (cached && !stale) {
      return NextResponse.json(cached);
    }

    // Fetch current + 30 days past for baseline calculation
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,soil_moisture_0_to_7cm&daily=temperature_2m_max,precipitation_sum&past_days=30&timezone=auto`
    );

    if (!res.ok) throw new Error("Environmental API failed");
    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const timestamp = new Date().toISOString();

    // Calculate Anomalies based on 30-day baseline
    const pastPrecip = daily.precipitation_sum || [];
    const avgPrecip = pastPrecip.length ? pastPrecip.reduce((a: number, b: number) => a + (b||0), 0) / pastPrecip.length : 0;
    const currentPrecip = current.precipitation || 0;
    
    // Rainfall Anomaly (% difference from 30-day avg)
    let rainfallAnomaly = 0;
    if (avgPrecip === 0 && currentPrecip === 0) rainfallAnomaly = -10; // Arid assumption
    else if (avgPrecip === 0) rainfallAnomaly = 100;
    else rainfallAnomaly = ((currentPrecip - avgPrecip) / avgPrecip) * 100;
    
    // Cap at sensible values for prototype
    rainfallAnomaly = Math.max(-100, Math.min(200, rainfallAnomaly));

    // Temperature Anomaly
    const pastTemp = daily.temperature_2m_max || [];
    const avgTemp = pastTemp.length ? pastTemp.reduce((a: number, b: number) => a + (b||0), 0) / pastTemp.length : current.temperature_2m;
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
        value: Math.round(population / 100), // Very rough density proxy
        source: "Geocoding Proxy",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: false
      }
    };

    await setCachedData('environmental_cache', cacheKey, indicators);
    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Environmental fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch environmental data" }, { status: 500 });
  }
}
