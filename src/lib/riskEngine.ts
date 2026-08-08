import { Region, RiskAssessment } from "../types";

// Transparent scoring model
// Risk Score (0-100)
// 0-30: LOW, 31-60: MODERATE, 61-80: HIGH, 81-100: CRITICAL
export function calculateRisk(region: Region): RiskAssessment {
  const { indicators } = region;
  
  // Normalizing factors to a 0-100 scale impact:
  // Rainfall Anomaly: Negative is worse. 0 to -50% mapped to 0 to 30 points.
  const rainfallPenalty = Math.max(0, Math.min(30, (indicators.rainfall_anomaly * -1) * 0.6));
  
  // Temperature Anomaly: Positive is worse. 0 to +5C mapped to 0 to 20 points.
  const tempPenalty = Math.max(0, Math.min(20, indicators.temperature_anomaly * 4));
  
  // Vegetation Stress: 0 to 1 mapped to 0 to 20 points.
  const vegPenalty = indicators.vegetation_stress * 20;
  
  // Water Availability: 0 to 1 where 0 is worst. 1 to 0 mapped to 0 to 30 points.
  const availabilityPenalty = (1 - indicators.water_availability) * 30;

  // Base score from environmental factors
  let score = Math.round(rainfallPenalty + tempPenalty + vegPenalty + availabilityPenalty);
  score = Math.max(0, Math.min(100, score));

  // Determine Level
  let level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (score > 80) level = "CRITICAL";
  else if (score > 60) level = "HIGH";
  else if (score > 30) level = "MODERATE";

  // Equity Priority Calculation
  // Considers population density and water stress severity
  // A region with high population and high water risk gets the highest equity priority.
  // Normalize population density (assuming 1000 is moderate, 10000+ is extreme)
  const popFactor = Math.min(1, indicators.population_density / 15000); 
  const equityPriority = Math.round((score * 0.5) + (popFactor * 50));

  return {
    score,
    level,
    equityPriority
  };
}
