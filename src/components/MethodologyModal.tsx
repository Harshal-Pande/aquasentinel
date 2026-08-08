import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodologyModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-200">Risk & Equity Methodology</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-sm text-slate-300 space-y-4">
          <p>
            <strong className="text-teal-400">Prototype Disclaimer:</strong> AquaSentinel uses a transparent heuristic model designed for the OurPlanet.Rocks hackathon demonstration. Data used is a mix of realistic seeded parameters and public proxy data.
          </p>
          
          <h3 className="font-semibold text-slate-200 uppercase tracking-wide mt-4">Water Risk Score Weights</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Rainfall Deficit: <span className="text-slate-400">25%</span></li>
            <li>Temperature Stress: <span className="text-slate-400">15%</span></li>
            <li>Vegetation/Ecological Stress: <span className="text-slate-400">15%</span></li>
            <li>Water Availability Scarcity: <span className="text-slate-400">30%</span></li>
            <li>Population Pressure: <span className="text-slate-400">15%</span></li>
          </ul>

          <h3 className="font-semibold text-slate-200 uppercase tracking-wide mt-4">Equity Priority</h3>
          <p>
            The Equity Priority score identifies where interventions are most urgently needed from a human-impact perspective. It calculates the overlap between <strong className="text-indigo-400">Environmental Risk Severity (40%)</strong> and direct <strong className="text-indigo-400">Human Population Exposure (60%)</strong>.
          </p>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
