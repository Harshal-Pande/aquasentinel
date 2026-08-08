import { Region, ProvenanceMetric } from "../types";

const makeMockMetric = (val: number): ProvenanceMetric => ({
  value: val,
  source: "Seed Data",
  fetchedAt: new Date().toISOString(),
  confidence: "MEDIUM",
  isEstimated: true,
  isLive: false,
});

export const mockRegions: Region[] = [
  {
    id: "region-nagpur",
    name: "Nagpur",
    country: "India",
    latitude: 21.1458,
    longitude: 79.0882,
    population: 3000000,
    selectionMethod: "search",
    indicators: {
      rainfall_anomaly: makeMockMetric(-31),
      temperature_anomaly: makeMockMetric(2.4),
      vegetation_stress: makeMockMetric(0.68),
      water_availability: makeMockMetric(0.31),
      population_density: makeMockMetric(8240),
    },
  },
  {
    id: "region-bengaluru",
    name: "Bengaluru",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
    population: 8500000,
    selectionMethod: "search",
    indicators: {
      rainfall_anomaly: makeMockMetric(-15),
      temperature_anomaly: makeMockMetric(1.5),
      vegetation_stress: makeMockMetric(0.45),
      water_availability: makeMockMetric(0.55),
      population_density: makeMockMetric(11200),
    },
  },
  {
    id: "region-fictional",
    name: "New Terra (Demo High-Risk Region)",
    latitude: 0,
    longitude: 0,
    population: 500000,
    selectionMethod: "search",
    indicators: {
      rainfall_anomaly: makeMockMetric(-45),
      temperature_anomaly: makeMockMetric(4.2),
      vegetation_stress: makeMockMetric(0.95),
      water_availability: makeMockMetric(0.1),
      population_density: makeMockMetric(5000),
    },
  },
];
