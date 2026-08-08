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
    name: "Nagpur, India",
    coordinates: [21.1458, 79.0882],
    population: 3000000,
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
    name: "Bengaluru, India",
    coordinates: [12.9716, 77.5946],
    population: 8500000,
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
    coordinates: [0, 0],
    population: 500000,
    indicators: {
      rainfall_anomaly: makeMockMetric(-45),
      temperature_anomaly: makeMockMetric(4.2),
      vegetation_stress: makeMockMetric(0.95),
      water_availability: makeMockMetric(0.1),
      population_density: makeMockMetric(5000),
    },
  },
];
