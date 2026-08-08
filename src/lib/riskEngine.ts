import { Region, RiskAssessment } from "../types";

export function calculateRisk(region: Region): RiskAssessment {
  const { indicators } = region;
  
  if (!indicators) {
    return { 
      score: 0, 
      level: "LOW", 
      equityPriority: 0, 
      equityExplanation: "No environmental data available.",
      factors: {
        precipitationStress: 0,
        heatStress: 0,
        vegetationStress: 0,
        waterAvailabilityStress: 0,
        populationExposure: 0
      }
    };
  }
  
  // 1. Rainfall deficit (0-100 score). Anomaly is e.g. -30 for 30% below average.
  const rainfallPenalty = Math.max(0, Math.min(100, (indicators.rainfall_anomaly.value * -2)));
  const weightedRainfall = rainfallPenalty * 0.25;
  
  // 2. Temperature stress (0-100). +4C is considered max penalty.
  const tempPenalty = Math.max(0, Math.min(100, indicators.temperature_anomaly.value * 25));
  const weightedTemp = tempPenalty * 0.15;
  
  // 3. Vegetation stress (0-100 scale directly from 0-1)
  const vegPenalty = indicators.vegetation_stress.value * 100;
  const weightedVeg = vegPenalty * 0.15;
  
  // 4. Water availability proxy stress (0-100). Inverted.
  const availabilityPenalty = (1 - indicators.water_availability.value) * 100;
  const weightedAvailability = availabilityPenalty * 0.30;

  // 5. Population pressure proxy (0-100). Cap at 20,000 density.
  const popPenalty = Math.min(100, (indicators.population_density.value / 20000) * 100);
  const weightedPop = popPenalty * 0.15;

  let score = Math.round(weightedRainfall + weightedTemp + weightedVeg + weightedAvailability + weightedPop);
  score = Math.max(0, Math.min(100, score));

  let level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 81) level = "CRITICAL";
  else if (score >= 61) level = "HIGH";
  else if (score >= 31) level = "MODERATE";

  const exposureVulnerability = popPenalty; 
  const equityPriority = Math.round((score * 0.4) + (exposureVulnerability * 0.6));

  let equityExplanation = "Low intervention priority due to stable water resources and lower population exposure.";
  if (equityPriority >= 80) {
    equityExplanation = "CRITICAL priority: Severe environmental water stress overlaps with massive population exposure.";
  } else if (equityPriority >= 60) {
    equityExplanation = "HIGH priority: Significant water scarcity affecting a vulnerable, dense population.";
  } else if (equityPriority >= 40) {
    equityExplanation = "MODERATE priority: Growing resource strain in populated areas requiring preventative action.";
  } else if (score > 60 && equityPriority < 60) {
    equityExplanation = "Moderate priority: High environmental stress, but lower direct human population exposure compared to urban centers.";
  }

  return {
    score,
    level,
    equityPriority,
    equityExplanation,
    factors: {
      precipitationStress: Math.round(weightedRainfall),
      heatStress: Math.round(weightedTemp),
      vegetationStress: Math.round(weightedVeg),
      waterAvailabilityStress: Math.round(weightedAvailability),
      populationExposure: Math.round(weightedPop)
    }
  };
}
