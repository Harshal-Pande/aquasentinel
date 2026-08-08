import { NextResponse } from "next/server";
import { generateDeterministicAnalysis } from "@/lib/aiFallback";
import { getCachedData, setCachedData } from "@/lib/cache/supabaseCache";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Very basic hash function for the cache key to avoid hitting AI multiple times for the exact same inputs
function hashString(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString();
}

export async function POST(request: Request) {
  try {
    const { region, riskAssessment } = await request.json();

    if (!region || !riskAssessment) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const payloadString = JSON.stringify({ r: region.indicators, risk: riskAssessment.score });
    const cacheKey = `ai:${region.id}:${hashString(payloadString)}`;

    const { data: cached, stale } = await getCachedData<any>('analysis_cache', cacheKey);
    if (cached && !stale) {
      return NextResponse.json(cached);
    }

    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key found, using deterministic fallback.");
      const fallback = generateDeterministicAnalysis(region);
      await setCachedData('analysis_cache', cacheKey, fallback);
      return NextResponse.json(fallback);
    }

    const prompt = `
      You are AquaSentinel's Environmental Intelligence AI.
      Analyze this location's data and output strict JSON. Do NOT invent data.
      
      Location: ${region.name || "Unknown Coordinates"}
      Population: ${region.population}
      Risk Score: ${riskAssessment.score}/100 (${riskAssessment.level})
      Equity Priority: ${riskAssessment.equityPriority}/100 (${riskAssessment.equityExplanation})
      
      Environmental Indicators:
      - Rainfall anomaly: ${region.indicators?.rainfall_anomaly?.value}%
      - Temperature anomaly: +${region.indicators?.temperature_anomaly?.value}C
      - Vegetation stress: ${region.indicators?.vegetation_stress?.value} (0-1)
      - Water availability proxy: ${region.indicators?.water_availability?.value} (0-1)
      
      Respond strictly in this JSON format:
      {
        "summary": "Brief 2-sentence summary of the environmental situation.",
        "primaryCauses": ["Cause 1", "Cause 2"],
        "recommendedInterventions": [
          {
            "name": "Intervention Name (e.g. Rainwater Harvesting)",
            "reason": "Brief reason why it works here",
            "expectedImpact": "LOW" | "MEDIUM" | "HIGH",
            "feasibility": "LOW" | "MEDIUM" | "HIGH"
          }
        ],
        "equityExplanation": "1-sentence explanation of equity priority.",
        "uncertainties": ["Uncertainty 1"],
        "dataCoverage": "HIGH" | "MEDIUM" | "LIMITED",
        "isFallback": false
      }
    `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      console.error("Gemini API error", await res.text());
      const fallback = generateDeterministicAnalysis(region);
      await setCachedData('analysis_cache', cacheKey, fallback);
      return NextResponse.json(fallback);
    }

    const aiResponse = await res.json();
    const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      const parsed = JSON.parse(text);
      // Ensure the correct types for UI
      const result = {
        summary: parsed.summary || "Analysis completed.",
        primaryCauses: parsed.primaryCauses || [],
        affectedPopulation: region.population || 50000,
        recommendedInterventions: parsed.recommendedInterventions?.map((i: any, idx: number) => ({
          id: `ai-int-${idx}`,
          name: i.name,
          description: i.reason,
          impact: i.expectedImpact || "MEDIUM",
          feasibility: i.feasibility || "MODERATE",
          expectedEffects: {
            riskReduction: 15, // Using fixed proxy values for simulator math
            waterRecovery: 300,
            peopleProtected: Math.round((region.population || 50000) * 0.1)
          }
        })) || [],
        equityExplanation: parsed.equityExplanation || riskAssessment.equityExplanation,
        uncertainties: parsed.uncertainties || [],
        dataCoverage: parsed.dataCoverage || "MEDIUM",
        isFallback: false
      };
      
      await setCachedData('analysis_cache', cacheKey, result);
      return NextResponse.json(result);
    }

    throw new Error("Failed to parse Gemini response");
  } catch (error: any) {
    console.error("AI Route error:", error);
    // Since region might not be defined if the error happens during JSON parsing, we need a safe fallback
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
