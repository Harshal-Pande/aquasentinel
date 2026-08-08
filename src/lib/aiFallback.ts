import { AIRecommendation, Intervention, Region } from "../types";
import { calculateRisk } from "./riskEngine";

// Static interventions database
export const ALL_INTERVENTIONS: Intervention[] = [
  {
    id: "int-rainwater",
    name: "Rainwater Harvesting Infrastructure",
    description: "Install community-scale rainwater catchment and storage systems to buffer dry seasons.",
    impact: "MEDIUM",
    feasibility: "EASY",
    expectedEffects: {
      riskReduction: 15,
      waterRecovery: 240, // ML/year
      peopleProtected: 1500,
    }
  },
  {
    id: "int-groundwater",
    name: "Groundwater Recharge Wells",
    description: "Construct recharge shafts to direct surface runoff into depleted aquifers.",
    impact: "HIGH",
    feasibility: "MODERATE",
    expectedEffects: {
      riskReduction: 20,
      waterRecovery: 450,
      peopleProtected: 3200,
    }
  },
  {
    id: "int-demand",
    name: "Agricultural Demand Reduction",
    description: "Subsidize drip irrigation and drought-resistant crops to lower overall water stress.",
    impact: "VERY HIGH",
    feasibility: "HARD",
    expectedEffects: {
      riskReduction: 25,
      waterRecovery: 800,
      peopleProtected: 5000,
    }
  },
  {
    id: "int-wetland",
    name: "Wetland & Ecosystem Restoration",
    description: "Restore local wetlands to improve natural water retention and ecosystem resilience.",
    impact: "MEDIUM",
    feasibility: "MODERATE",
    expectedEffects: {
      riskReduction: 10,
      waterRecovery: 120,
      peopleProtected: 800,
    }
  }
];

export function generateDeterministicAnalysis(region: Region): AIRecommendation {
  const risk = calculateRisk(region);
  const ind = region.indicators;
  
  let summary = "";
  const primaryCauses: string[] = [];
  const recommendedInterventions: Intervention[] = [];

  if (ind.rainfall_anomaly < -20) {
    primaryCauses.push("Severe historical rainfall deficit");
    recommendedInterventions.push(ALL_INTERVENTIONS[0]); // Rainwater
  }
  if (ind.temperature_anomaly > 2) {
    primaryCauses.push("Elevated evaporation rates due to temperature anomalies");
  }
  if (ind.water_availability < 0.4) {
    primaryCauses.push("Critical scarcity of surface water resources");
    recommendedInterventions.push(ALL_INTERVENTIONS[2]); // Demand reduction
  }
  if (ind.vegetation_stress > 0.6) {
    primaryCauses.push("High ecological stress limiting natural retention");
    recommendedInterventions.push(ALL_INTERVENTIONS[3]); // Wetland
  }
  if (ind.population_density > 10000) {
    primaryCauses.push("Extreme population density stressing limited infrastructure");
    recommendedInterventions.push(ALL_INTERVENTIONS[1]); // Groundwater
  }

  // Ensure we always have at least a couple interventions
  if (recommendedInterventions.length === 0) {
    recommendedInterventions.push(ALL_INTERVENTIONS[0], ALL_INTERVENTIONS[1]);
  }

  // Generate dynamic summary
  summary = `The region of ${region.name} is currently facing a ${risk.level.toLowerCase()} water risk scenario, with an overall risk score of ${risk.score}/100. `;
  
  if (risk.level === "CRITICAL" || risk.level === "HIGH") {
    summary += "Immediate intervention is required to secure water access for vulnerable populations.";
  } else {
    summary += "Preventative measures are recommended to maintain water security.";
  }

  // Deduplicate interventions just in case
  const uniqueInterventions = Array.from(new Set(recommendedInterventions.map(i => i.id)))
    .map(id => recommendedInterventions.find(i => i.id === id)!);

  return {
    situationSummary: summary,
    primaryCauses: primaryCauses.length > 0 ? primaryCauses : ["General baseline water stress"],
    affectedPopulation: Math.round(ind.population_density * 3.5), // Arbitrary scaling for "affected" demo metric
    recommendedInterventions: uniqueInterventions.slice(0, 3), // Max 3 recommendations
    reasoning: "Analysis generated via heuristic decision engine based on environmental anomaly data and population pressure.",
    confidence: "MEDIUM"
  };
}
