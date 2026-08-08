import { NextResponse } from "next/server";
import { EnvironmentalIndicators } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const popStr = searchParams.get("pop");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const population = popStr ? parseInt(popStr) : 50000;

  try {
    // Open-Meteo Weather API (using current data as proxies for our environmental indicators)
    // We cache this for 24 hours (86400 seconds)
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,soil_moisture_0_to_7cm&timezone=auto`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      throw new Error(`Weather API responded with status: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const timestamp = new Date().toISOString();

    // Data Normalization & Proxy logic
    
    // 1. Rainfall Anomaly Proxy: 
    // We use current precipitation as a rough proxy. If precipitation is 0, we treat it as a -25% deficit for the hackathon prototype.
    const precip = current.precipitation || 0;
    const rainfallAnomaly = precip === 0 ? -25 : Math.min(20, precip * 5); // Rough heuristic

    // 2. Temperature Anomaly Proxy:
    // If temp is above 30C, we treat it as a +2C anomaly.
    const temp = current.temperature_2m || 20;
    const tempAnomaly = temp > 30 ? 2.5 : (temp < 10 ? -1 : 0.5);

    // 3. Vegetation Stress Proxy:
    // Inversely related to soil moisture (0 to 1 scale). If moisture is high, stress is low.
    const soilMoisture = current.soil_moisture_0_to_7cm || 0.2;
    // Assume max moisture is ~0.4 m³/m³. Stress = 1 - (moisture / 0.4)
    const vegStress = Math.max(0, Math.min(1, 1 - (soilMoisture / 0.4)));

    // 4. Water Availability Proxy:
    // Simple heuristic combining rainfall presence and low veg stress.
    const waterAvail = Math.max(0.1, Math.min(1, (precip > 0 ? 0.4 : 0) + (1 - vegStress) * 0.6));

    const indicators: EnvironmentalIndicators = {
      rainfall_anomaly: {
        value: rainfallAnomaly,
        source: "Open-Meteo (Proxy)",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: true
      },
      temperature_anomaly: {
        value: tempAnomaly,
        source: "Open-Meteo (Proxy)",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: true
      },
      vegetation_stress: {
        value: vegStress,
        source: "Open-Meteo Soil Moisture",
        fetchedAt: timestamp,
        confidence: "MEDIUM",
        isEstimated: true,
        isLive: true
      },
      water_availability: {
        value: waterAvail,
        source: "Heuristic Derivation",
        fetchedAt: timestamp,
        confidence: "LOW",
        isEstimated: true,
        isLive: false
      },
      population_density: {
        value: population / 100, // Very rough density proxy from city pop
        source: "Open-Meteo Geocoding",
        fetchedAt: timestamp,
        confidence: "MEDIUM",
        isEstimated: true,
        isLive: false
      }
    };

    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Environmental fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch environmental data" }, { status: 500 });
  }
}
