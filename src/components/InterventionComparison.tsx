import { Intervention } from "@/types";

interface Props {
  interventions: Intervention[];
  selectedInterventions: Set<string>;
  onToggle: (id: string) => void;
}

export default function InterventionComparison({ interventions, selectedInterventions, onToggle }: Props) {
  if (!interventions || interventions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
      {interventions.map((int) => {
        const isSelected = selectedInterventions.has(int.id);
        return (
          <div 
            key={int.id}
            onClick={() => onToggle(int.id)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex flex-col">
              <span className={`text-[10px] font-space tracking-widest uppercase transition-colors ${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {int.name}
              </span>
            </div>
            
            {/* Custom Toggle Switch */}
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isSelected ? 'bg-cyan-500' : 'bg-slate-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isSelected ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        );
      })}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
