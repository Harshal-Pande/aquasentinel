export interface ProvenanceMetric {
  value: number;
  source: string;
  fetchedAt: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  isEstimated: boolean;
  isLive: boolean;
}

export interface EnvironmentalIndicators {
  rainfall_anomaly: ProvenanceMetric; // e.g. -30 for 30% below average
  temperature_anomaly: ProvenanceMetric; // e.g. +2.4 celsius
  vegetation_stress: ProvenanceMetric; // 0 to 1 scale
  water_availability: ProvenanceMetric; // 0 to 1 scale
  population_density: ProvenanceMetric; // people per sq km
}

export interface SearchResult {
  id: string;
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
}

export interface Region {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  population: number;
  indicators?: EnvironmentalIndicators; // Optional because we load it progressively
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  equityPriority: number; // 0 to 100
  equityExplanation: string;
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
  feasibility: "EASY" | "MODERATE" | "HARD";
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
