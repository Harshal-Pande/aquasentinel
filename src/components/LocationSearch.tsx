"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { SearchResult } from "@/types";

interface Props {
  onSelect: (result: SearchResult) => void;
}

export default function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full z-50">
      <div className="relative flex items-center bg-[#0a0f18]/90 backdrop-blur-md border border-slate-700 rounded transition-colors focus-within:border-cyan-500 shadow-lg">
        <Search className="absolute left-3 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="SEARCH LOCATION..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border-none py-3 pl-10 pr-10 text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none font-space uppercase tracking-widest"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 w-4 h-4 text-cyan-500 animate-spin" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-[#0d1421] border border-slate-700 rounded shadow-2xl overflow-hidden">
          {results.map((res) => (
            <button
              key={res.id}
              onClick={() => {
                onSelect(res);
                setShowDropdown(false);
                setQuery("");
              }}
              className="w-full flex flex-col items-start px-4 py-3 hover:bg-slate-800 border-b last:border-0 border-slate-800 transition-colors text-left"
            >
              <div className="flex items-center text-sm font-bold text-slate-200 font-space tracking-wide">
                <MapPin className="w-3.5 h-3.5 mr-2 text-cyan-500" />
                {res.name}
              </div>
              <div className="text-[10px] text-slate-500 font-space tracking-widest ml-5 mt-1 uppercase">
                {res.admin1 ? `${res.admin1}, ` : ""}
                {res.country}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
