"use client";

import { Hand, MapPin } from "lucide-react";
import LocationSearch from "./LocationSearch";
import { SearchResult } from "@/types";

interface Props {
  pinMode: boolean;
  setPinMode: (mode: boolean) => void;
  onSearchSelect: (result: SearchResult) => void;
}

export default function MapToolbar({ pinMode, setPinMode, onSearchSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 w-[220px] pointer-events-none">
      
      {/* Search Bar - Make pointer events auto so it's clickable */}
      <div className="pointer-events-auto">
        <LocationSearch onSelect={onSearchSelect} />
      </div>

      {/* Mode Toggle Toolbar */}
      <div className="pointer-events-auto flex items-center bg-[#0a0f18]/90 backdrop-blur-md border border-slate-700/50 rounded shadow-lg p-0.5 gap-0.5">
        <button
          onClick={() => setPinMode(false)}
          className={`flex-1 flex items-center justify-center py-1.5 px-2 text-[10px] font-bold font-space uppercase tracking-widest rounded transition-colors ${
            !pinMode
              ? 'bg-slate-800 text-cyan-400 border border-slate-600 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Hand className="w-3 h-3 mr-1.5" /> HAND
        </button>
        <button
          onClick={() => setPinMode(true)}
          className={`flex-1 flex items-center justify-center py-1.5 px-2 text-[10px] font-bold font-space uppercase tracking-widest rounded transition-colors ${
            pinMode
              ? 'bg-cyan-500 text-slate-950 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <MapPin className="w-3 h-3 mr-1.5" /> PIN
        </button>
      </div>

      {/* Pin Mode Instructional Banner */}
      {pinMode && (
        <div className="pointer-events-auto mt-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-space tracking-widest uppercase p-2 rounded text-center animate-in fade-in slide-in-from-top-2">
          PIN MODE ACTIVE <br/> CLICK ANYWHERE ON MAP TO SELECT
        </div>
      )}

    </div>
  );
}
