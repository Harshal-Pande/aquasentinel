import { Intervention } from "@/types";
import { Check } from "lucide-react";

interface Props {
  interventions: Intervention[];
  selectedInterventions: Set<string>;
  onToggle: (id: string) => void;
}

export default function InterventionComparison({ interventions, selectedInterventions, onToggle }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs uppercase bg-slate-900 border-b border-slate-700 text-slate-400">
          <tr>
            <th className="px-4 py-3">Select</th>
            <th className="px-4 py-3">Intervention</th>
            <th className="px-4 py-3">Impact</th>
            <th className="px-4 py-3">Feasibility</th>
            <th className="px-4 py-3 text-right">Water Recovered</th>
          </tr>
        </thead>
        <tbody>
          {interventions.map((int) => {
            const isSelected = selectedInterventions.has(int.id);
            return (
              <tr 
                key={int.id} 
                onClick={() => onToggle(int.id)}
                className={`border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800/50 ${isSelected ? 'bg-teal-900/20' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-600 bg-slate-900'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-200">
                  {int.name}
                  <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">{int.description}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${int.impact === 'VERY HIGH' || int.impact === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {int.impact}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${int.feasibility === 'EASY' ? 'text-emerald-400' : int.feasibility === 'HARD' ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {int.feasibility}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-blue-400 font-medium">
                  +{int.expectedEffects.waterRecovery} ML
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
