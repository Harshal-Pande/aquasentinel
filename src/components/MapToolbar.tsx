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
    <div className="flex flex-col gap-4 w-[320px] pointer-events-none">
      
      {/* Search Bar - Make pointer events auto so it's clickable */}
      <div className="pointer-events-auto">
        <LocationSearch onSelect={onSearchSelect} />
      </div>

      {/* Mode Toggle Toolbar */}
      <div className="pointer-events-auto flex items-center bg-[#0a0f18]/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl p-1 gap-1">
        <button
          onClick={() => setPinMode(false)}
          className={`flex-1 flex items-center justify-center py-2.5 px-4 text-xs font-bold font-space uppercase tracking-widest rounded transition-colors ${
            !pinMode
              ? 'bg-slate-800 text-teal-400 border border-slate-600 shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Hand className="w-4 h-4 mr-2" /> HAND
        </button>
        <button
          onClick={() => setPinMode(true)}
          className={`flex-1 flex items-center justify-center py-2.5 px-4 text-xs font-bold font-space uppercase tracking-widest rounded transition-colors ${
            pinMode
              ? 'bg-teal-500 text-slate-950 border border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <MapPin className="w-4 h-4 mr-2" /> PIN
        </button>
      </div>

      {/* Pin Mode Instructional Banner */}
      {pinMode && (
        <div className="pointer-events-auto mt-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-space tracking-widest uppercase p-3 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
          PIN MODE ACTIVE <br/> CLICK ANYWHERE ON MAP TO SELECT
        </div>
      )}

    </div>
  );
}
