"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { mockRegions } from "@/data/mockData";
import { Region, AIRecommendation, SimulationResult } from "@/types";
import { Droplets, MapPin, ShieldAlert, Sparkles, TrendingDown, ArrowRight, Info, Database } from "lucide-react";
import { calculateRisk } from "@/lib/riskEngine";
import { simulateInterventions } from "@/lib/simulationEngine";
import RiskVisualizer from "./RiskVisualizer";
import InterventionComparison from "./InterventionComparison";
import MethodologyModal from "./MethodologyModal";

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
      Loading global intelligence map...
    </div>
  ),
});

export default function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIRecommendation | null>(null);
  
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const handleRegionSelect = async (region: Region) => {
    setSelectedRegion(region);
    setSelectedInterventions(new Set());
    setSimulationResult(null);
    setAnalysis(null);
    setIsAnalyzing(true);

    const riskAssessment = calculateRisk(region);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, riskAssessment })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-select first region on mount
  useEffect(() => {
    handleRegionSelect(mockRegions[0]);
  }, []);

  const toggleIntervention = (id: string) => {
    const next = new Set(selectedInterventions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInterventions(next);
  };

  const handleSimulate = () => {
    if (!selectedRegion || !analysis) return;
    setIsSimulating(true);
    
    setTimeout(() => {
      const activeInterventions = analysis.recommendedInterventions.filter(i => selectedInterventions.has(i.id));
      const risk = calculateRisk(selectedRegion);
      
      const result = simulateInterventions(
        selectedRegion, 
        risk, 
        analysis.affectedPopulation, 
        activeInterventions
      );
      
      setSimulationResult(result);
      setIsSimulating(false);
    }, 1200); // 1.2s delay for UX drama
  };

  const riskAssessment = selectedRegion ? calculateRisk(selectedRegion) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-teal-500/30">
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight">AquaSentinel</h1>
            <span className="hidden md:inline-block ml-4 text-sm text-slate-400 border-l border-slate-700 pl-4">
              Water Intelligence for a Resilient Planet
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMethodologyOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700"
            >
              <Info className="w-3.5 h-3.5" /> Methodology
            </button>
            <div className="text-xs font-medium px-3 py-1.5 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Prototype Data
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Map & Regions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                Step 1: Identify At-Risk Region
              </h2>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 h-[600px] relative">
              <MapComponent 
                regions={mockRegions} 
                selectedRegion={selectedRegion} 
                onSelectRegion={handleRegionSelect} 
              />
            </div>
          </section>
        </div>

        {/* Right Column: Dashboard Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {selectedRegion && riskAssessment ? (
            <>
              {/* Region Overview Card */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-right-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedRegion.name}</h2>
                    <p className="text-slate-400 text-sm">Step 2: Explain Risk Factors</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide border 
                    ${riskAssessment.level === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                    ${riskAssessment.level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                    ${riskAssessment.level === 'MODERATE' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                    ${riskAssessment.level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                  `}>
                    {riskAssessment.level} RISK
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-400 mb-1">Water Risk Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tighter">{riskAssessment.score}</span>
                      <span className="text-slate-600 text-sm">/ 100</span>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
                    <p className="text-xs text-indigo-300 mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Equity Priority
                    </p>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <span className="text-4xl font-bold text-indigo-400 tracking-tighter">{riskAssessment.equityPriority}</span>
                      <span className="text-slate-600 text-sm">/ 100</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-sm text-indigo-200">
                  <strong className="block mb-1 text-indigo-300">Step 3: Prioritize Intervention</strong>
                  {riskAssessment.equityExplanation}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Risk Factor Breakdown
                  </h3>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-2">
                    <RiskVisualizer region={selectedRegion} />
                  </div>
                </div>
              </section>

              {/* AI Analysis Section */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-right-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Intelligence Report
                </h3>
                
                {isAnalyzing ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400 animate-pulse">Generating AI insights...</p>
                  </div>
                ) : analysis ? (
                  <>
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
                      Step 4: Simulate Solutions
                    </h3>

                    <div className="mb-6">
                      <InterventionComparison 
                        interventions={analysis.recommendedInterventions}
                        selectedInterventions={selectedInterventions}
                        onToggle={toggleIntervention}
                      />
                    </div>

                    {!simulationResult ? (
                      <button 
                        onClick={handleSimulate}
                        disabled={selectedInterventions.size === 0 || isSimulating}
                        className="w-full py-4 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2"
                      >
                        {isSimulating ? 'Simulating Impact...' : 'Simulate Intervention Impact'}
                        {!isSimulating && <ArrowRight className="w-5 h-5" />}
                      </button>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-950 border-2 border-teal-500/30 rounded-2xl p-1 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2">
                            <button 
                              onClick={() => setSimulationResult(null)}
                              className="text-xs text-slate-400 hover:text-white bg-slate-900 px-2 py-1 rounded"
                            >
                              Reset
                            </button>
                          </div>
                          
                          <div className="p-4 bg-slate-900/50 rounded-xl mb-1">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 text-center">Projected State</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase">Risk Score</p>
                                <p className="text-xl font-bold text-white">{simulationResult.after.riskScore}</p>
                                <p className="text-xs text-emerald-400 font-medium mt-1">-{simulationResult.delta.riskReduction}</p>
                              </div>
                              <div className="border-x border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase">Availability</p>
                                <p className="text-xl font-bold text-white">{Math.round(simulationResult.after.waterAvailability * 100)}%</p>
                                <p className="text-xs text-blue-400 font-medium mt-1">+{simulationResult.delta.waterRecovered} ML</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase">At Risk</p>
                                <p className="text-xl font-bold text-white">{simulationResult.after.peopleAtRisk.toLocaleString()}</p>
                                <p className="text-xs text-purple-400 font-medium mt-1">-{simulationResult.delta.peopleProtected.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-center text-sm text-emerald-300">
                            <strong>Success:</strong>&nbsp;{simulationResult.delta.peopleProtected.toLocaleString()} people secured.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No intelligence report available.
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center h-[500px]">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-medium text-slate-300">Awaiting Region Selection</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
                Select a region on the global risk map to begin the analysis and simulation workflow.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
