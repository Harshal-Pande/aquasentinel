export interface EnvironmentalIndicators {
  rainfall_anomaly: number; // e.g. -30 for 30% below average
  temperature_anomaly: number; // e.g. +2.4 celsius
  vegetation_stress: number; // 0 to 1 scale
  water_availability: number; // 0 to 1 scale
  population_density: number; // people per sq km
}

export interface Region {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  indicators: EnvironmentalIndicators;
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  equityPriority: number; // 0 to 100
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  expectedEffects: {
    riskReduction: number;
    waterRecovery: number; // in Millions of Liters per year
    peopleProtected: number;
  };
}

export interface SimulationResult {
  before: {
    riskScore: number;
    waterAvailability: number;
    peopleAtRisk: number;
  };
  after: {
    riskScore: number;
    waterAvailability: number;
    peopleAtRisk: number;
  };
  delta: {
    riskReduction: number;
    waterRecovered: number;
    peopleProtected: number;
  };
}

export interface AIRecommendation {
  situationSummary: string;
  primaryCauses: string[];
  affectedPopulation: number;
  recommendedInterventions: Intervention[];
  reasoning: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}
