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

  const handleSelect = (r: SearchResult) => {
    setQuery("");
    setShowDropdown(false);
    onSelect(r);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any city or region..."
          className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors shadow-inner"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 w-4 h-4 text-teal-500 animate-spin" />
        )}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{r.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[r.admin1, r.country].filter(Boolean).join(", ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
