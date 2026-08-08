"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LocationTarget, Region, AIRecommendation, SimulationResult, SearchResult, EnvironmentalIndicators } from "@/types";
import { Droplets, MapPin, ShieldAlert, Sparkles, TrendingDown, ArrowRight, Info, Server, Loader2, Search, Target, Database, Settings, Bell, ChevronRight } from "lucide-react";
import { calculateRisk } from "@/lib/riskEngine";
import { simulateInterventions } from "@/lib/simulationEngine";
import RiskVisualizer from "./RiskVisualizer";
import InterventionComparison from "./InterventionComparison";
import MethodologyModal from "./MethodologyModal";
import LocationSearch from "./LocationSearch";

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 font-space text-sm tracking-widest uppercase">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-teal-500" />
      Initializing Hydrological Neural Map...
    </div>
  ),
});

export default function Dashboard() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  const [pinMode, setPinMode] = useState(false);
  const [draftPin, setDraftPin] = useState<{lat: number; lon: number} | null>(null);

  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState<AIRecommendation | null>(null);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const analyzeTarget = async (target: LocationTarget) => {
    // Stage 1: Reset state
    const newRegion: Region = { ...target };
    
    setRegions(prev => {
      if (!prev.find(r => r.id === newRegion.id)) return [...prev, newRegion];
      return prev;
    });
    
    setSelectedRegion(newRegion);
    setAnalysis(null);
    setAnalysisError(null);
    setSimulationResult(null);
    setSelectedInterventions(new Set());
    setDraftPin(null);
    setPinMode(false);
    
    // Stage 2: Environmental Data loading
    setIsLoadingEnv(true);
    let indicators: EnvironmentalIndicators;
    
    try {
      const envRes = await fetch(`/api/environmental?lat=${target.latitude}&lon=${target.longitude}&pop=${target.population || 50000}`);
      if (!envRes.ok) throw new Error("Environmental data temporarily unavailable.");
      indicators = await envRes.json();
      
      const updatedRegion = { ...newRegion, indicators };
      setSelectedRegion(updatedRegion);
      
      setRegions(prev => prev.map(r => r.id === updatedRegion.id ? updatedRegion : r));
      
      // Stage 3 & 4: Risk Engine & AI Analysis
      setIsAnalyzing(true);
      const riskAssessment = calculateRisk(updatedRegion);
      
      const aiRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: updatedRegion, riskAssessment })
      });
      if (!aiRes.ok) throw new Error("AI analysis temporarily unavailable.");
      
      const aiData = await aiRes.json();
      setAnalysis(aiData);
      
    } catch (e) {
      console.error(e);
      setAnalysisError(e instanceof Error ? e.message : "An error occurred during analysis.");
    } finally {
      setIsLoadingEnv(false);
      setIsAnalyzing(false);
    }
  };

  const handleSearchSelect = (result: SearchResult) => {
    const target: LocationTarget = {
      id: result.id,
      name: result.name,
      admin1: result.admin1,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      population: result.population,
      selectionMethod: "search"
    };
    analyzeTarget(target);
  };

  const handleMapClick = (lat: number, lon: number) => {
    setDraftPin({ lat, lon });
    setSelectedRegion(null); // Clear selection to show draft pin
  };

  const handleAnalyzeDraft = async () => {
    if (!draftPin) return;
    
    setIsLoadingEnv(true);
    try {
      // Reverse geocode
      const res = await fetch(`/api/geocode?reverse=true&lat=${draftPin.lat}&lon=${draftPin.lon}`);
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      
      const target: LocationTarget = {
        id: data.id,
        name: data.name,
        admin1: data.admin1,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        population: data.population,
        selectionMethod: "map-click"
      };
      
      analyzeTarget(target);
    } catch (e) {
      console.error("Reverse geocode err", e);
      // Fallback if reverse geocode fails entirely
      const fallbackTarget: LocationTarget = {
        id: `rev-${draftPin.lat}-${draftPin.lon}`,
        name: "Unnamed Location",
        latitude: draftPin.lat,
        longitude: draftPin.lon,
        population: 50000,
        selectionMethod: "map-click"
      };
      analyzeTarget(fallbackTarget);
    }
  };

  const handleMapSelect = (region: Region) => {
    setSelectedRegion(region);
    setDraftPin(null);
  };

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
    }, 1200);
  };

  const riskAssessment = selectedRegion?.indicators ? calculateRisk(selectedRegion) : null;
  const isFallback = analysis?.isFallback;

  return (
    <div className="h-screen w-full bg-[#0a0f18] text-slate-200 font-sans flex overflow-hidden selection:bg-teal-500/30">
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />

      {/* LEFT SIDEBAR (Stitch UI) */}
      <aside className="w-64 bg-[#0d1421] border-r border-slate-800 flex flex-col z-50 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Droplets className="w-5 h-5 text-teal-400 mr-3" />
          <h1 className="text-lg font-bold tracking-widest text-teal-400 font-space">AQUASENTINEL</h1>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto">
          <div className="px-6 mb-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Regional Analysis</h2>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-mono mb-4">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Active Monitoring
            </div>
          </div>
          
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white border-l-2 border-teal-400 transition-colors">
              <Droplets className="w-4 h-4 opacity-70" />
              <span className="text-sm font-medium">Watersheds</span>
            </button>
            <button disabled className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-slate-300 transition-colors opacity-50 cursor-not-allowed group relative">
              <Database className="w-4 h-4 opacity-70" />
              <span className="text-sm font-medium">Coastal Zones</span>
              <span className="absolute right-4 text-[9px] uppercase tracking-wider text-slate-600 group-hover:text-slate-400">Coming Soon</span>
            </button>
            <button disabled className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-slate-300 transition-colors opacity-50 cursor-not-allowed group relative">
              <Database className="w-4 h-4 opacity-70" />
              <span className="text-sm font-medium">Aquifers</span>
              <span className="absolute right-4 text-[9px] uppercase tracking-wider text-slate-600 group-hover:text-slate-400">Coming Soon</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 p-4 flex flex-col gap-2 text-sm text-slate-400">
          <button className="flex items-center gap-3 px-2 py-2 hover:text-slate-200 transition-colors">
            <Server className="w-4 h-4" /> System Health
          </button>
          <button className="flex items-center gap-3 px-2 py-2 hover:text-slate-200 transition-colors">
            <Database className="w-4 h-4" /> Data Logs
          </button>
          <button onClick={() => setIsMethodologyOpen(true)} className="flex items-center gap-3 px-2 py-2 text-teal-500 hover:text-teal-400 transition-colors mt-2 border border-teal-500/20 rounded-md justify-center bg-teal-500/5">
            <Info className="w-4 h-4" /> Methodology
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-[#0a0f18] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-8 text-xs font-space tracking-widest text-slate-400">
            <div className="border border-slate-700 px-3 py-1.5 rounded bg-slate-900">
              v4.2 HIGH-FIDELITY
            </div>
            <div className="flex items-center gap-6">
              <span className="text-teal-400 border-b-2 border-teal-400 pb-5 pt-5 uppercase">Global Overview</span>
              <span className="hover:text-slate-200 cursor-pointer uppercase transition-colors">Risk Analysis</span>
              <span className="hover:text-slate-200 cursor-pointer uppercase transition-colors">Intervention Simulator</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-slate-700 px-3 py-1.5 rounded bg-slate-900 text-[10px] uppercase tracking-widest text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              DATA: OPEN-METEO / NASA
            </div>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE - MAP + RIGHT PANELS + BOTTOM SIMULATOR */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* MAP AREA */}
          <div className="flex-1 flex flex-col h-full border-r border-slate-800 relative bg-[#0a0f18] p-4">
            <div className="absolute top-8 left-8 right-8 z-10 flex items-start justify-between pointer-events-none">
              
              <div className="pointer-events-auto bg-[#0a0f18]/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-2xl">
                <h3 className="text-[10px] text-slate-500 font-space tracking-widest uppercase mb-1">Hydrological Neural Map</h3>
                {selectedRegion ? (
                  <p className="text-sm font-bold text-teal-400 uppercase tracking-widest">
                    {selectedRegion.name} - ENVIRONMENTAL INTELLIGENCE
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                    GLOBAL OVERVIEW - SELECT A LOCATION
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 pointer-events-auto w-[320px]">
                <LocationSearch onSelect={handleSearchSelect} />
                
                <button 
                  onClick={() => setPinMode(!pinMode)}
                  className={`flex items-center justify-between px-4 py-2 text-xs font-bold font-space uppercase tracking-widest border rounded transition-colors ${
                    pinMode 
                    ? 'bg-teal-500 text-slate-950 border-teal-500' 
                    : 'bg-[#0a0f18]/90 backdrop-blur-md text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2"><Target className="w-4 h-4" /> {pinMode ? 'PIN MODE: ON' : 'PIN MODE: OFF'}</span>
                </button>
              </div>

            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 mt-0 bg-slate-900">
              <MapComponent 
                regions={regions} 
                selectedRegion={selectedRegion} 
                onSelectRegion={handleMapSelect} 
                pinMode={pinMode}
                onPinDrop={handleMapClick}
                draftPin={draftPin}
                onAnalyzeDraft={handleAnalyzeDraft}
              />
            </div>
            
            {/* BOTTOM SIMULATOR 2.0 (Only if analyzed) */}
            {selectedRegion && analysis && riskAssessment && (
              <div className="h-[280px] mt-4 border border-slate-800 bg-[#0d1421] rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2 shrink-0">
                  <TrendingDown className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-space font-bold uppercase tracking-widest text-cyan-400">Intervention Simulator 2.0</span>
                  <span className="ml-auto text-[9px] text-slate-500 font-mono tracking-widest">SIMULATION ENGINE: V4.2</span>
                </div>
                
                <div className="flex-1 flex p-4 gap-6">
                  {/* Left: Params */}
                  <div className="w-1/3 flex flex-col justify-between border-r border-slate-800 pr-6">
                    <div>
                      <h4 className="text-[10px] font-space text-slate-500 uppercase tracking-widest mb-4">Parameters</h4>
                      <InterventionComparison 
                        interventions={analysis.recommendedInterventions}
                        selectedInterventions={selectedInterventions}
                        onToggle={toggleIntervention}
                      />
                    </div>
                    <button 
                      onClick={handleSimulate}
                      disabled={selectedInterventions.size === 0 || isSimulating}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold font-space uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
                    >
                      {isSimulating ? 'Processing...' : 'Run Scenario'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Right: Results Dashboard style */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1 h-full border border-slate-800 bg-slate-950/50 rounded-lg p-4 flex flex-col justify-center items-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                      <span className="absolute top-3 left-3 bg-slate-900 px-2 py-1 border border-slate-700 text-[9px] text-slate-400 uppercase tracking-widest font-mono">Baseline (Current)</span>
                      
                      <div className="z-10 mt-4 border border-red-500/30 bg-red-500/5 p-4 text-center">
                        <p className="text-[10px] text-red-400 uppercase font-space tracking-widest mb-1">Current Risk Score</p>
                        <p className="text-3xl font-bold text-red-500 font-mono">{riskAssessment.score}</p>
                      </div>
                    </div>

                    <ChevronRight className="w-6 h-6 text-slate-600 shrink-0" />

                    <div className={`flex-1 h-full border border-slate-800 bg-slate-950/50 rounded-lg p-4 flex flex-col justify-center relative overflow-hidden transition-all ${simulationResult ? 'border-cyan-500/30 bg-cyan-500/5 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' : ''}`}>
                      <span className="absolute top-3 left-3 bg-slate-900 px-2 py-1 border border-slate-700 text-[9px] text-cyan-400 uppercase tracking-widest font-mono">Projected Outcome</span>
                      
                      {simulationResult ? (
                        <div className="z-10 flex flex-col gap-3 mt-4 w-full">
                           <div className="border border-cyan-500/30 bg-cyan-500/10 p-3 flex justify-between items-center">
                             <div>
                                <p className="text-[10px] text-cyan-400 uppercase font-space tracking-widest">Risk Reduced</p>
                                <p className="text-2xl font-bold text-cyan-300 font-mono">-{simulationResult.delta.riskReduction}</p>
                             </div>
                             <Droplets className="w-5 h-5 text-cyan-500 opacity-50" />
                           </div>
                           <div className="border border-emerald-500/30 bg-emerald-500/10 p-3 flex justify-between items-center">
                             <div>
                                <p className="text-[10px] text-emerald-400 uppercase font-space tracking-widest">Pop. Protected</p>
                                <p className="text-xl font-bold text-emerald-300 font-mono">{simulationResult.delta.peopleProtected.toLocaleString()}</p>
                             </div>
                             <ShieldAlert className="w-5 h-5 text-emerald-500 opacity-50" />
                           </div>
                        </div>
                      ) : (
                        <div className="z-10 text-center text-slate-600 text-[10px] font-space uppercase tracking-widest">
                          Awaiting Simulation Run
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANELS */}
          <div className="w-[400px] bg-[#0d1421] p-4 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
            {isLoadingEnv || isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-space text-[10px] uppercase tracking-widest">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mb-4" />
                Processing Location Intelligence...
              </div>
            ) : !selectedRegion ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 font-space text-[10px] uppercase tracking-widest text-center px-8 border border-dashed border-slate-800 rounded-xl">
                Awaiting Data Stream
                <br/><br/>
                Search or click map to begin.
              </div>
            ) : analysisError ? (
               <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono">
                 [ERR]: {analysisError}
               </div>
            ) : riskAssessment && analysis ? (
              <>
                {/* Equity Narrative Panel */}
                <div className="border border-slate-800 bg-[#0a0f18] rounded-xl flex flex-col overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-slate-300 text-[10px] font-space uppercase tracking-widest">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      The Equity Narrative
                    </div>
                    <div className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider
                      ${riskAssessment.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/30' : ''}
                      ${riskAssessment.level === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : ''}
                      ${riskAssessment.level === 'MODERATE' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : ''}
                      ${riskAssessment.level === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : ''}
                    `}>
                      {riskAssessment.level} RISK
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {analysis.summary}
                    </p>
                    
                    <div className="p-3 bg-indigo-900/10 border border-indigo-500/20 rounded text-xs text-indigo-300">
                      <strong className="text-[10px] uppercase tracking-widest font-space text-indigo-400 block mb-1">AI Reasoning (Gemini)</strong>
                      {analysis.equityExplanation}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="border border-slate-800 p-3 rounded bg-slate-900/50">
                        <p className="text-[9px] text-slate-500 font-space uppercase tracking-widest mb-1">Pop. Exposed Proxy</p>
                        <p className="text-lg text-red-400 font-mono">{analysis.affectedPopulation.toLocaleString()}</p>
                      </div>
                      <div className="border border-slate-800 p-3 rounded bg-slate-900/50">
                        <p className="text-[9px] text-slate-500 font-space uppercase tracking-widest mb-1">Data Coverage</p>
                        <p className={`text-lg font-mono ${isFallback ? 'text-yellow-500' : 'text-cyan-400'}`}>
                          {analysis.dataCoverage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compounding Risk Factors Panel */}
                <div className="border border-slate-800 bg-[#0a0f18] rounded-xl flex flex-col overflow-hidden shadow-xl flex-1">
                  <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2 text-slate-300 text-[10px] font-space uppercase tracking-widest">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Compounding Risk Factors
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col items-center">
                     <RiskVisualizer region={selectedRegion} />
                     
                     <div className="w-full mt-auto">
                        <div className="w-24 h-24 mx-auto mt-4 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                           <span className="text-[9px] text-slate-500 font-space uppercase tracking-widest absolute top-2">Score</span>
                           <span className="text-3xl font-bold text-slate-200 font-mono">{riskAssessment.score}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

        </div>
      </main>
    </div>
  );
}
