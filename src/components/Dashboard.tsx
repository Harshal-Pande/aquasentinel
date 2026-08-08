"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { LocationTarget, Region, AIRecommendation, SimulationResult, SearchResult, EnvironmentalIndicators } from "@/types";
import { Droplets, ShieldAlert, TrendingDown, ArrowRight, Info, Loader2, Database, Settings, ChevronRight, Activity, BellRing } from "lucide-react";
import { calculateRisk } from "@/lib/riskEngine";
import { simulateInterventions } from "@/lib/simulationEngine";
import RiskVisualizer from "./RiskVisualizer";
import InterventionComparison from "./InterventionComparison";
import MethodologyModal from "./MethodologyModal";
import MapToolbar from "./MapToolbar";
import SystemModal from "./SystemModal";

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0a0f18] flex flex-col items-center justify-center text-slate-500 font-space text-[10px] tracking-widest uppercase">
      <Loader2 className="w-6 h-6 animate-spin mb-4 text-cyan-500" />
      Initializing Hydrological Neural Map...
    </div>
  ),
});

export type ModalType = "health" | "logs" | "notifications" | "settings" | null;

export default function Dashboard() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  const [pinMode, setPinMode] = useState(false);
  const [draftLocationTarget, setDraftLocationTarget] = useState<LocationTarget | null>(null);
  const [draftPinCoords, setDraftPinCoords] = useState<{lat: number; lon: number} | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingEnv, setIsLoadingEnv] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState<AIRecommendation | null>(null);
  const [selectedInterventions, setSelectedInterventions] = useState<Set<string>>(new Set());
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const [logs, setLogs] = useState<{time: string, message: string, status?: string}[]>([]);
  const [notifications, setNotifications] = useState<{message: string, read: boolean}[]>([]);
  
  const analysisIdRef = useRef(0);

  const addLog = (message: string, status: string = "INFO") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, message, status }, ...prev]); 
  };

  const analyzeTarget = async (target: LocationTarget) => {
    const currentAnalysisId = ++analysisIdRef.current;
    
    addLog(`LOCATION SEARCH - ${target.name || 'Unnamed Location'}`, "INIT");
    
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
    setDraftLocationTarget(null);
    setDraftPinCoords(null);
    setPinMode(false);
    
    setIsLoadingEnv(true);
    let indicators: EnvironmentalIndicators;
    
    try {
      addLog("ENVIRONMENTAL DATA", "PENDING");
      // 1. Try to fetch from cache first (GET request)
      let envRes = await fetch(`/api/environmental?lat=${target.latitude}&lon=${target.longitude}&pop=${target.population || 50000}`);
      
      if (currentAnalysisId !== analysisIdRef.current) return;
      
      // 2. If not cached, fetch from Open-Meteo client-side and POST to our backend
      if (envRes.status === 404) {
        addLog("FETCHING OPEN-METEO (CLIENT)", "INIT");
        const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&current=temperature_2m,precipitation,soil_moisture_0_to_7cm&daily=temperature_2m_max,precipitation_sum&past_days=30&timezone=auto`;
        const omRes = await fetch(omUrl);
        
        if (!omRes.ok) {
          console.error("Environmental client fetch failed:", {
            status: omRes.status,
            statusText: omRes.statusText
          });
          throw new Error(`Open-Meteo blocked request (HTTP ${omRes.status}). Please check network/IP.`);
        }
        
        const openMeteoData = await omRes.json();
        
        // POST to backend
        envRes = await fetch('/api/environmental', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: target.latitude,
            lon: target.longitude,
            pop: target.population || 50000,
            openMeteoData
          })
        });
      }
      
      if (!envRes.ok) throw new Error("Environmental data temporarily unavailable.");
      indicators = await envRes.json();
      
      addLog("ENVIRONMENTAL DATA", "SUCCESS");
      
      const updatedRegion = { ...newRegion, indicators };
      setSelectedRegion(updatedRegion);
      
      setRegions(prev => prev.map(r => r.id === updatedRegion.id ? updatedRegion : r));
      
      setIsAnalyzing(true);
      const riskAssessment = calculateRisk(updatedRegion);
      addLog("RISK ENGINE", `COMPLETE (SCORE: ${riskAssessment.score})`);
      
      addLog("GEMINI AI REASONING", "PENDING");
      const aiRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: updatedRegion, riskAssessment })
      });
      
      if (currentAnalysisId !== analysisIdRef.current) return;
      
      if (!aiRes.ok) throw new Error("AI analysis temporarily unavailable.");
      
      const aiData = await aiRes.json();
      setAnalysis(aiData);
      addLog("GEMINI AI REASONING", "SUCCESS");
      
      setNotifications(prev => [{ message: `Analysis complete for ${target.name || 'Selected Location'}`, read: false }, ...prev]);
      
    } catch (e) {
      if (currentAnalysisId !== analysisIdRef.current) return;
      console.error(e);
      const errMsg = e instanceof Error ? e.message : "An error occurred during analysis.";
      setAnalysisError(errMsg);
      addLog("ANALYSIS FAILURE", "ERROR");
      setNotifications(prev => [{ message: `Error analyzing ${target.name || 'Selected Location'}: ${errMsg}`, read: false }, ...prev]);
    } finally {
      if (currentAnalysisId === analysisIdRef.current) {
        setIsLoadingEnv(false);
        setIsAnalyzing(false);
      }
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

  const handleMapClick = async (lat: number, lon: number) => {
    setDraftPinCoords({ lat, lon });
    setDraftLocationTarget(null);
    setSelectedRegion(null);
    setPinMode(false); 
    
    setIsGeocoding(true);
    addLog(`[PIN] Geocoding started for ${lat.toFixed(4)}, ${lon.toFixed(4)}`, "INIT");

    try {
      const res = await fetch(`/api/geocode?reverse=true&lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      
      const target: LocationTarget = {
        id: data.id || `rev-${lat}-${lon}`,
        name: data.name || "Unnamed Location",
        admin1: data.admin1,
        country: data.country,
        latitude: lat,
        longitude: lon,
        population: data.population || 50000,
        selectionMethod: "map-click"
      };
      
      addLog(`[PIN] Location resolved: ${target.name}`, "SUCCESS");
      analyzeTarget(target);
    } catch (e) {
      addLog(`[PIN] Geocoding failed, proceeding with coordinates`, "WARN");
      const fallbackTarget: LocationTarget = {
        id: `rev-${lat}-${lon}`,
        name: "Unnamed Location",
        latitude: lat,
        longitude: lon,
        population: 50000,
        selectionMethod: "map-click"
      };
      analyzeTarget(fallbackTarget);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAnalyzeDraft = () => {
    if (draftLocationTarget) {
      analyzeTarget(draftLocationTarget);
    } else if (draftPinCoords) {
        analyzeTarget({
            id: `rev-${draftPinCoords.lat}-${draftPinCoords.lon}`,
            name: "Unnamed Location",
            latitude: draftPinCoords.lat,
            longitude: draftPinCoords.lon,
            population: 50000,
            selectionMethod: "map-click"
        });
    }
  };

  const handleMapSelect = (region: Region) => {
    setSelectedRegion(region);
    setDraftPinCoords(null);
    setDraftLocationTarget(null);
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
    <div className="h-screen w-full bg-[#05080c] text-slate-200 font-sans flex overflow-hidden selection:bg-cyan-500/30">
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
      
      {activeModal && (
        <SystemModal 
          activeModal={activeModal} 
          onClose={() => setActiveModal(null)} 
          logs={logs}
          notifications={notifications}
        />
      )}

      {/* 1. LEFT ZONE: COMPACT SIDEBAR */}
      <aside className="w-[220px] bg-[#0a0f18] border-r border-slate-800/60 flex flex-col z-50 shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-slate-800/40 shrink-0">
          <Droplets className="w-4 h-4 text-cyan-400 mr-2" />
          <h1 className="text-xs font-bold tracking-[0.2em] text-cyan-400 font-space whitespace-nowrap">
            AQUA SENTINEL
          </h1>
        </div>
        
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-3">
            <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Monitoring</h2>
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Active Stream
            </div>
          </div>
          
          <nav className="flex flex-col gap-0.5">
            <button className="flex items-center gap-2.5 px-4 py-2 bg-blue-600/10 text-cyan-100 border-l-[3px] border-cyan-400 transition-colors">
              <Droplets className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs font-medium">Watersheds</span>
            </button>
            <button disabled className="flex items-center gap-2.5 px-4 py-2 text-slate-500 hover:text-slate-300 transition-colors opacity-50 cursor-not-allowed group relative border-l-[3px] border-transparent">
              <Database className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs font-medium">Coastal Zones</span>
            </button>
            <button disabled className="flex items-center gap-2.5 px-4 py-2 text-slate-500 hover:text-slate-300 transition-colors opacity-50 cursor-not-allowed group relative border-l-[3px] border-transparent">
              <Database className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs font-medium">Aquifers</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800/40 p-3 flex flex-col gap-1 shrink-0">
          <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">System</h2>
          <button onClick={() => setActiveModal("health")} className="flex items-center gap-2.5 px-2 py-1.5 hover:text-slate-200 transition-colors text-left text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5" /> Health
          </button>
          <button onClick={() => setActiveModal("logs")} className="flex items-center gap-2.5 px-2 py-1.5 hover:text-slate-200 transition-colors text-left text-xs text-slate-400">
            <Database className="w-3.5 h-3.5" /> Logs
          </button>
          <button onClick={() => { setActiveModal("notifications"); setNotifications(prev => prev.map(n => ({...n, read: true}))); }} className="flex items-center gap-2.5 px-2 py-1.5 hover:text-slate-200 transition-colors text-left text-xs text-slate-400 relative">
            <BellRing className="w-3.5 h-3.5" /> Alerts
            {notifications.some(n => !n.read) && <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
          </button>
          <button onClick={() => setActiveModal("settings")} className="flex items-center gap-2.5 px-2 py-1.5 hover:text-slate-200 transition-colors text-left text-xs text-slate-400">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <button onClick={() => setIsMethodologyOpen(true)} className="flex items-center gap-2.5 px-2 py-1.5 text-cyan-500 hover:text-cyan-400 transition-colors mt-2 text-xs">
            <Info className="w-3.5 h-3.5" /> Methodology
          </button>
        </div>
      </aside>

      {/* 2. CENTER ZONE: MAP & SIMULATOR */}
      <main className="flex-1 flex flex-col h-full overflow-hidden p-3 gap-3 relative z-0">
        
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/60 bg-[#0a0f18] relative z-0 shadow-lg flex flex-col">
          {/* Map Overlay Header */}
          <div className="absolute top-4 left-4 right-4 z-[2000] flex items-start justify-between pointer-events-none">
            
            <div className="pointer-events-auto bg-[#0a0f18]/80 backdrop-blur-md border border-slate-700/50 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
              {selectedRegion ? (
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-space">
                  {selectedRegion.name}
                </p>
              ) : (
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-space">
                  Global Overview
                </p>
              )}
            </div>

            <MapToolbar 
              pinMode={pinMode} 
              setPinMode={setPinMode} 
              onSearchSelect={handleSearchSelect} 
            />
          </div>

          {/* Actual Map component */}
          <div className="flex-1 w-full h-full">
            <MapComponent 
              regions={regions} 
              selectedRegion={selectedRegion} 
              onSelectRegion={handleMapSelect} 
              pinMode={pinMode}
              onPinDrop={handleMapClick}
              draftLocationTarget={draftLocationTarget}
              draftPinCoords={draftPinCoords}
              onAnalyzeDraft={handleAnalyzeDraft}
            />
          </div>
        </div>
        
        {/* INTERVENTION SIMULATOR - Horizontal Layout */}
        {selectedRegion && analysis && riskAssessment && (
          <div className="h-[180px] bg-[#0a0f18] rounded-xl border border-slate-800/60 p-4 flex flex-col shadow-lg shrink-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] font-space font-bold uppercase tracking-widest text-cyan-400">Simulator</span>
              <span className="ml-auto text-[8px] text-slate-500 font-mono tracking-widest">v4.2</span>
            </div>
            
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Left: Params (Horizontal compact) */}
              <div className="w-[300px] flex flex-col justify-between border-r border-slate-800/50 pr-4 shrink-0 overflow-y-auto custom-scrollbar">
                <InterventionComparison 
                  interventions={analysis.recommendedInterventions}
                  selectedInterventions={selectedInterventions}
                  onToggle={toggleIntervention}
                />
                <button 
                  onClick={handleSimulate}
                  disabled={selectedInterventions.size === 0 || isSimulating}
                  className="w-full mt-2 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:bg-slate-800/30 disabled:text-slate-600 border border-cyan-500/30 disabled:border-transparent text-cyan-400 text-[10px] font-bold font-space uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {isSimulating ? 'Processing...' : 'Run Scenario'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              {/* Right: Results (Side by Side) */}
              <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="flex-1 h-full rounded border border-slate-800/50 bg-[#05080c] p-3 flex flex-col justify-center relative overflow-hidden group min-w-0">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-2">Baseline</span>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-red-400 font-mono leading-none">{riskAssessment.score}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-space tracking-widest mb-0.5">Risk Score</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />

                <div className={`flex-[1.5] h-full rounded border border-slate-800/50 bg-[#05080c] p-3 flex flex-col justify-center relative overflow-hidden transition-colors min-w-0 ${simulationResult ? 'border-cyan-500/30 bg-cyan-500/5' : ''}`}>
                  <span className="text-[9px] text-cyan-500/70 uppercase tracking-widest font-mono mb-2">Projected</span>
                  
                  {simulationResult ? (
                    <div className="flex gap-4">
                       <div>
                          <p className="text-xl font-bold text-cyan-400 font-mono leading-none">-{simulationResult.delta.riskReduction}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-space tracking-widest mt-1">Risk Reduced</p>
                       </div>
                       <div className="w-[1px] h-full bg-slate-800/50"></div>
                       <div>
                          <p className="text-xl font-bold text-emerald-400 font-mono leading-none">{simulationResult.delta.peopleProtected.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-space tracking-widest mt-1">Protected</p>
                       </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 text-[9px] font-space uppercase tracking-widest">
                      Awaiting Scenario
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. RIGHT ZONE: ANALYTICS PANEL */}
      <div className="w-[350px] bg-[#0a0f18] border-l border-slate-800/60 p-4 flex flex-col gap-0 overflow-y-auto custom-scrollbar shrink-0 z-10">
        {isGeocoding || isLoadingEnv || isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-space text-[10px] uppercase tracking-widest gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            {isGeocoding ? 'Resolving Location...' : isLoadingEnv ? 'Fetching Environmental Data...' : 'Processing Intelligence...'}
          </div>
        ) : !selectedRegion ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 font-space text-[9px] uppercase tracking-widest text-center px-6">
            Awaiting Data Stream
            <br/><br/>
            Search or click map to begin.
          </div>
        ) : analysisError ? (
           <div className="p-3 border border-red-500/20 bg-red-500/5 rounded text-red-400 text-[10px] font-mono">
             [ERR]: {analysisError}
           </div>
        ) : riskAssessment && analysis ? (
          <div className="flex flex-col gap-6 animate-in fade-in">
            
            {/* A. Current Risk */}
            <div className="pb-5 border-b border-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-space text-slate-500 uppercase tracking-widest">Risk Assessment</span>
                <div className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider
                  ${riskAssessment.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : ''}
                  ${riskAssessment.level === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' : ''}
                  ${riskAssessment.level === 'MODERATE' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : ''}
                  ${riskAssessment.level === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : ''}
                `}>
                  {riskAssessment.level}
                </div>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold font-mono leading-none tracking-tight text-slate-100">{riskAssessment.score}</span>
                <span className="text-[10px] text-slate-500 font-space tracking-widest uppercase mb-1">Index Score</span>
              </div>
            </div>

            {/* B. AI Reasoning */}
            <div className="pb-5 border-b border-slate-800/60">
              <span className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-2 block">AI Interpretation</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                {analysis.summary}
              </p>
              <p className="text-[11px] text-cyan-200/70 leading-relaxed font-sans border-l-2 border-cyan-500/30 pl-3">
                {analysis.equityExplanation}
              </p>
            </div>

            {/* C. Key Indicators */}
            <div className="pb-5 border-b border-slate-800/60">
              <span className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-3 block">Key Indicators</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#05080c] border border-slate-800/60 p-2.5 rounded">
                  <p className="text-[8px] text-slate-500 font-space uppercase tracking-widest mb-0.5">Pop. Exposed</p>
                  <p className="text-sm font-bold text-red-400 font-mono">{analysis.affectedPopulation.toLocaleString()}</p>
                </div>
                <div className="bg-[#05080c] border border-slate-800/60 p-2.5 rounded">
                  <p className="text-[8px] text-slate-500 font-space uppercase tracking-widest mb-0.5">Coverage</p>
                  <p className={`text-sm font-bold font-mono ${isFallback ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {analysis.dataCoverage}
                  </p>
                </div>
                <div className="bg-[#05080c] border border-slate-800/60 p-2.5 rounded">
                  <p className="text-[8px] text-slate-500 font-space uppercase tracking-widest mb-0.5">Rainfall Anomaly</p>
                  <p className="text-sm font-bold text-slate-300 font-mono">{selectedRegion.indicators?.rainfall_anomaly.value.toFixed(1)} mm</p>
                </div>
                <div className="bg-[#05080c] border border-slate-800/60 p-2.5 rounded">
                  <p className="text-[8px] text-slate-500 font-space uppercase tracking-widest mb-0.5">Scarcity Ratio</p>
                  <p className="text-sm font-bold text-slate-300 font-mono">{selectedRegion.indicators?.water_availability.value.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* D. Risk Visualization */}
            <div className="pt-1">
              <span className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-2 block">Multivariate Stress</span>
              <div className="w-full flex justify-center -ml-4">
                 <RiskVisualizer region={selectedRegion} />
              </div>
            </div>

          </div>
        ) : null}
      </div>

    </div>
  );
}
