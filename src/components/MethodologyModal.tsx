import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodologyModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f18]/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="text-sm font-bold text-slate-200 font-space tracking-widest uppercase">Methodology & Data Provenance</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-xs text-slate-300 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <div className="p-3 border border-teal-500/30 bg-teal-500/10 rounded-lg">
            <p className="text-teal-400 font-bold mb-1">PROTOTYPE DISCLAIMER</p>
            <p className="leading-relaxed">
              Aqua Sentinel is an environmental decision-support prototype built for the OurPlanet.Rocks hackathon. 
              It is not an officially validated hydrological model. All environmental indicators are derived from public meteorological datasets and reanalysis proxies. 
              The resulting scores should be interpreted as generalized &quot;Environmental Water Stress Proxies&quot; rather than precise measurements of physical water scarcity.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-widest font-space text-[10px] mb-2">1. Data Sources & Architecture</h3>
            <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
              <li><strong>Location & Population:</strong> Open-Meteo Geocoding / OpenStreetMap Nominatim</li>
              <li><strong>Meteorology & Climate:</strong> Open-Meteo Historical & Current Weather APIs</li>
              <li><strong>Caching:</strong> Supabase (PostgreSQL) edge caching for API protection (30-day geocoding, 24h environmental)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-widest font-space text-[10px] mb-2">2. Baseline & Anomalies</h3>
            <p className="leading-relaxed text-slate-400">
              Where practical, recent precipitation and temperature values are calculated as anomalies against a 30-day historical baseline for the exact coordinates selected. 
              Vegetation stress is derived as a heuristic proxy from 0-7cm soil moisture.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-widest font-space text-[10px] mb-2">3. Risk & Equity Priority</h3>
            <p className="leading-relaxed text-slate-400">
              The <strong>Risk Score (0-100)</strong> is a deterministic composite index of normalized anomalies (precipitation, heat, soil moisture). 
              The <strong>Equity Priority</strong> overlays this environmental stress with a population exposure proxy. It highlights regions where severe scarcity overlaps with high human density.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-widest font-space text-[10px] mb-2">4. AI Interpretation (Gemini)</h3>
            <p className="leading-relaxed text-slate-400">
              Google Gemini 2.5 Flash is used exclusively as an interpretation and reasoning layer. It receives the deterministic risk assessment in a strict JSON schema and generates narrative summaries and intervention reasoning. It does not invent measurements or alter the mathematical risk score.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 uppercase tracking-widest font-space text-[10px] mb-2">5. Intervention Simulator</h3>
            <p className="leading-relaxed text-slate-400">
              The Intervention Simulator projects potential scenario outcomes based on modeled effectiveness assumptions. It guarantees bounded results (risk cannot drop below 0, protected populations cannot exceed exposure) but represents theoretical scenarios rather than precise predictive futures.
            </p>
          </div>

        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
