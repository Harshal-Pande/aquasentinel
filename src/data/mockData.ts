import { Region } from "../types";

export const mockRegions: Region[] = [
  {
    id: "region-nagpur",
    name: "Nagpur, India",
    coordinates: [21.1458, 79.0882],
    indicators: {
      rainfall_anomaly: -31,
      temperature_anomaly: 2.4,
      vegetation_stress: 0.68,
      water_availability: 0.31,
      population_density: 8240,
    },
  },
  {
    id: "region-bengaluru",
    name: "Bengaluru, India",
    coordinates: [12.9716, 77.5946],
    indicators: {
      rainfall_anomaly: -15,
      temperature_anomaly: 1.5,
      vegetation_stress: 0.45,
      water_availability: 0.55,
      population_density: 11200,
    },
  },
  {
    id: "region-mumbai",
    name: "Mumbai, India",
    coordinates: [19.0760, 72.8777],
    indicators: {
      rainfall_anomaly: 5,
      temperature_anomaly: 1.8,
      vegetation_stress: 0.3,
      water_availability: 0.8,
      population_density: 21000,
    },
  },
  {
    id: "region-delhi",
    name: "Delhi, India",
    coordinates: [28.7041, 77.1025],
    indicators: {
      rainfall_anomaly: -22,
      temperature_anomaly: 3.1,
      vegetation_stress: 0.72,
      water_availability: 0.25,
      population_density: 15400,
    },
  },
  {
    id: "region-fictional",
    name: "New Terra (Demo High-Risk Region)",
    coordinates: [0, 0],
    indicators: {
      rainfall_anomaly: -45,
      temperature_anomaly: 4.2,
      vegetation_stress: 0.95,
      water_availability: 0.1,
      population_density: 5000,
    },
  },
];
