"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { mockRegions } from "@/data/mockData";
import { Region } from "@/types";
import { Activity, Droplets, MapPin, Users, AlertTriangle, ShieldAlert, Sparkles, TrendingDown, ArrowRight } from "lucide-react";
import { calculateRisk } from "@/lib/riskEngine";
import { generateDeterministicAnalysis } from "@/lib/aiFallback";
import RiskVisualizer from "./RiskVisualizer";

// Dynamically import the map component since Leaflet requires window
const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
      Loading map...
    </div>
  ),
});

export default function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Default selection for demo purposes
  useEffect(() => {
    handleRegionSelect(mockRegions[0]);
  }, []);

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedInterventions(new Set());
    setSimulationResult(null);
  };

  const toggleIntervention = (id: string) => {
    const next = new Set(selectedInterventions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInterventions(next);
  };

  const riskAssessment = selectedRegion ? calculateRisk(selectedRegion) : null;
  const analysis = selectedRegion ? generateDeterministicAnalysis(selectedRegion) : null;

  const handleSimulate = () => {
    if (!selectedRegion || !analysis || !riskAssessment) return;
    setIsSimulating(true);
    
    setTimeout(() => {
      let totalRiskRed = 0;
      let totalWaterRec = 0;
      let totalPeopleProt = 0;

      analysis.recommendedInterventions.forEach(int => {
        if (selectedInterventions.has(int.id)) {
          totalRiskRed += int.expectedEffects.riskReduction;
          totalWaterRec += int.expectedEffects.waterRecovery;
          totalPeopleProt += int.expectedEffects.peopleProtected;
        }
      });

      setSimulationResult({
        before: {
          riskScore: riskAssessment.score,
          waterAvailability: selectedRegion.indicators.water_availability,
          peopleAtRisk: analysis.affectedPopulation
        },
        after: {
          riskScore: Math.max(0, riskAssessment.score - totalRiskRed),
          waterAvailability: Math.min(1, selectedRegion.indicators.water_availability + (totalWaterRec / 10000)), // rough heuristic
          peopleAtRisk: Math.max(0, analysis.affectedPopulation - totalPeopleProt)
        },
        delta: {
          riskReduction: totalRiskRed,
          waterRecovered: totalWaterRec,
          peopleProtected: totalPeopleProt
        }
      });
      setIsSimulating(false);
    }, 800); // Fake delay for UX
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-teal-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight">AquaSentinel</h1>
            <span className="hidden md:inline-block ml-4 text-sm text-slate-400 border-l border-slate-700 pl-4">
              Water Intelligence for a Resilient Planet
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
              Prototype Mode
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Map & Regions */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              Global Risk Map
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-800 h-[500px]">
              <MapComponent 
                regions={mockRegions} 
                selectedRegion={selectedRegion} 
                onSelectRegion={handleRegionSelect} 
              />
            </div>
          </section>
        </div>

        {/* Right Column: Dashboard Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {selectedRegion ? (
            <>
              {/* Region Overview Card */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedRegion.name}</h2>
                    <p className="text-slate-400 text-sm">Selected Region Analysis</p>
                  </div>
                  {riskAssessment && (
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide border 
                      ${riskAssessment.level === 'CRITICAL' ? 'bg-red-400/10 text-red-400 border-red-400/20' : ''}
                      ${riskAssessment.level === 'HIGH' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' : ''}
                      ${riskAssessment.level === 'MODERATE' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : ''}
                      ${riskAssessment.level === 'LOW' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : ''}
                    `}>
                      {riskAssessment.level} RISK
                    </div>
                  )}
                </div>

                {riskAssessment && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                      <p className="text-sm text-slate-400 mb-1">Water Risk Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tighter">{riskAssessment.score}</span>
                        <span className="text-slate-500 text-sm">/ 100</span>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5"></div>
                      <p className="text-sm text-indigo-300 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Equity Priority
                      </p>
                      <div className="flex items-baseline gap-1 relative z-10">
                        <span className="text-4xl font-bold text-indigo-400 tracking-tighter">{riskAssessment.equityPriority}</span>
                        <span className="text-slate-500 text-sm">/ 100</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Risk Factor Breakdown
                  </h3>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-2">
                    <RiskVisualizer region={selectedRegion} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Key Indicators
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1">Rainfall Anomaly</p>
                      <p className="font-medium text-red-400">{selectedRegion.indicators.rainfall_anomaly}%</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1">Temp Anomaly</p>
                      <p className="font-medium text-orange-400">+{selectedRegion.indicators.temperature_anomaly}°C</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1">Water Availability</p>
                      <p className="font-medium text-blue-400">{Math.round(selectedRegion.indicators.water_availability * 100)}%</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Population
                      </p>
                      <p className="font-medium">{selectedRegion.indicators.population_density.toLocaleString()} /km²</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Analysis Section */}
              {analysis && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI Intelligence Report
                  </h3>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {analysis.situationSummary}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-2">Primary Causes:</p>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {analysis.primaryCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    Recommended Interventions
                  </h3>

                  <div className="space-y-3 mb-6">
                    {analysis.recommendedInterventions.map((intervention) => {
                      const isSelected = selectedInterventions.has(intervention.id);
                      return (
                        <div 
                          key={intervention.id}
                          onClick={() => toggleIntervention(intervention.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-teal-500/10 border-teal-500/50 ring-1 ring-teal-500/50' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm text-slate-200">{intervention.name}</h4>
                              <p className="text-xs text-slate-400 mt-1">{intervention.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ml-4 ${
                              isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-600'
                            }`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleSimulate}
                    disabled={selectedInterventions.size === 0 || isSimulating}
                    className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSimulating ? 'Simulating Impact...' : 'Simulate Intervention'}
                    {!isSimulating && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {/* Simulation Result */}
                  {simulationResult && (
                    <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                      <h3 className="text-lg font-bold mb-4 text-slate-200">Projected Impact</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20">
                          <p className="text-xs text-slate-500 mb-1">Risk Reduction</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-400">-{simulationResult.delta.riskReduction}</span>
                            <span className="text-xs text-slate-500">pts</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            New Score: <strong className="text-slate-300">{simulationResult.after.riskScore}</strong>
                          </p>
                        </div>
                        
                        <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/20">
                          <p className="text-xs text-slate-500 mb-1">Water Recovered</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-blue-400">+{simulationResult.delta.waterRecovered}</span>
                            <span className="text-xs text-slate-500">ML/yr</span>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 col-span-2">
                          <p className="text-xs text-slate-500 mb-1">People Protected</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-purple-400">+{simulationResult.delta.peopleProtected.toLocaleString()}</span>
                            <span className="text-xs text-slate-500">individuals</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.min(100, (simulationResult.delta.peopleProtected / simulationResult.before.peopleAtRisk) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <MapPin className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Region Selected</h3>
              <p className="text-sm text-slate-500 mt-2">Click on a marker on the map to view the water risk analysis.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
