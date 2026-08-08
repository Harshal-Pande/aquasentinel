export interface ProvenanceMetric {
  value: number;
  source: string;
  fetchedAt: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  isEstimated: boolean;
  isLive: boolean;
}

export interface EnvironmentalIndicators {
  rainfall_anomaly: ProvenanceMetric; 
  temperature_anomaly: ProvenanceMetric; 
  vegetation_stress: ProvenanceMetric; 
  water_availability: ProvenanceMetric; 
  population_density: ProvenanceMetric; 
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

export interface LocationTarget {
  id: string;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population: number;
  selectionMethod: "search" | "map-click";
}

export interface Region extends LocationTarget {
  indicators?: EnvironmentalIndicators;
}

export interface RiskAssessment {
  score: number; // 0 to 100
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  equityPriority: number; // 0 to 100
  equityExplanation: string;
  factors?: {
    precipitationStress: number;
    heatStress: number;
    vegetationStress: number;
    waterAvailabilityStress: number;
    populationExposure: number;
  };
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
  summary: string;
  primaryCauses: string[];
  affectedPopulation: number;
  recommendedInterventions: Intervention[];
  equityExplanation: string;
  uncertainties: string[];
  dataCoverage: "HIGH" | "MEDIUM" | "LIMITED";
  isFallback: boolean;
}
