import { NextResponse } from "next/server";
import { ALL_INTERVENTIONS, generateDeterministicAnalysis } from "@/lib/aiFallback";

export async function POST(req: Request) {
  try {
    const { region, riskAssessment } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key, fall back to deterministic logic
    if (!apiKey) {
      console.log("No Gemini API key found, falling back to deterministic analysis.");
      return NextResponse.json(generateDeterministicAnalysis(region));
    }

    const prompt = `
      You are an expert environmental AI agent for AquaSentinel.
      Analyze this region's water risk and provide a JSON response.
      
      Region: ${region.name}
      Water Risk Score: ${riskAssessment.score}/100 (Level: ${riskAssessment.level})
      Equity Priority: ${riskAssessment.equityPriority}/100 (${riskAssessment.equityExplanation})
      
      Environmental Indicators:
      - Rainfall anomaly: ${region.indicators?.rainfall_anomaly?.value}%
      - Temperature anomaly: +${region.indicators?.temperature_anomaly?.value}C
      - Vegetation stress: ${region.indicators?.vegetation_stress?.value} (0-1)
      - Water availability: ${region.indicators?.water_availability?.value} (0-1)
      - Population density: ${region.indicators?.population_density?.value} per sq km

      Available Interventions:
      ${JSON.stringify(ALL_INTERVENTIONS, null, 2)}

      Task: Return a JSON object exactly matching this schema:
      {
        "situationSummary": "A 2-3 sentence professional summary of the water crisis.",
        "primaryCauses": ["Cause 1", "Cause 2"],
        "affectedPopulation": number (estimate based on density and crisis level),
        "recommendedInterventions": [/* Include 2 to 3 full intervention objects from the available list that best solve the causes */],
        "reasoning": "Brief explanation of why these interventions were chosen.",
        "confidence": "HIGH" | "MEDIUM" | "LOW"
      }
      
      Do not include any markdown formatting, only pure JSON.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        }
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error", await response.text());
      return NextResponse.json(generateDeterministicAnalysis(region));
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return NextResponse.json(generateDeterministicAnalysis(region));
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Analysis API failed:", error);
    // Always fall back on error
    return NextResponse.json({ error: "Analysis failed", fallback: true }, { status: 500 });
  }
}
