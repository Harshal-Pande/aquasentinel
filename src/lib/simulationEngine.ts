import { Intervention, Region, RiskAssessment, SimulationResult } from "../types";

export function simulateInterventions(
  region: Region,
  currentRisk: RiskAssessment,
  affectedPopulation: number,
  interventions: Intervention[]
): SimulationResult {
  let totalRiskReduction = 0;
  let totalWaterRecovered = 0;
  let totalPeopleProtected = 0;

  // Diminishing returns factor when combining multiple interventions of the same type.
  // We'll apply a simple scaling factor based on the number of interventions.
  interventions.forEach((int, index) => {
    // 1st intervention = 100% impact, 2nd = 85%, 3rd = 70%
    const scale = Math.max(0.5, 1 - (index * 0.15));
    
    totalRiskReduction += int.expectedEffects.riskReduction * scale;
    totalWaterRecovered += int.expectedEffects.waterRecovery * scale;
    totalPeopleProtected += int.expectedEffects.peopleProtected * scale;
  });

  totalRiskReduction = Math.round(totalRiskReduction);
  totalWaterRecovered = Math.round(totalWaterRecovered);
  totalPeopleProtected = Math.round(totalPeopleProtected);

  // Bounds checking
  // Risk cannot go below 0
  const afterRiskScore = Math.max(0, currentRisk.score - totalRiskReduction);
  
  // People protected cannot exceed affected population
  const actualPeopleProtected = Math.min(affectedPopulation, totalPeopleProtected);
  const afterPeopleAtRisk = Math.max(0, affectedPopulation - actualPeopleProtected);

  const waterAvailability = region.indicators?.water_availability?.value || 0;
  
  // Water availability cannot exceed 100% (1.0).
  // Assuming 1000 ML recovered roughly translates to a 0.1 increase in availability for this region's scale.
  const availabilityBoost = totalWaterRecovered / 10000;
  const afterWaterAvailability = Math.min(1.0, waterAvailability + availabilityBoost);

  return {
    before: {
      riskScore: currentRisk.score,
      waterAvailability: waterAvailability,
      peopleAtRisk: affectedPopulation
    },
    after: {
      riskScore: afterRiskScore,
      waterAvailability: afterWaterAvailability,
      peopleAtRisk: afterPeopleAtRisk
    },
    delta: {
      riskReduction: currentRisk.score - afterRiskScore,
      waterRecovered: totalWaterRecovered,
      peopleProtected: actualPeopleProtected
    }
  };
}
