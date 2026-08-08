"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Region } from "@/types";
import { calculateRisk } from "@/lib/riskEngine";

// Component to handle map re-centering when region changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

interface MapProps {
  regions: Region[];
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
}

export default function Map({ regions, selectedRegion, onSelectRegion }: MapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 4;

  const center = selectedRegion ? selectedRegion.coordinates : defaultCenter;
  const zoom = selectedRegion ? 6 : defaultZoom;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "#ef4444"; // red-500
      case "HIGH": return "#f97316"; // orange-500
      case "MODERATE": return "#eab308"; // yellow-500
      default: return "#10b981"; // emerald-500
    }
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} zoom={zoom} />
        
        {regions.map((region) => {
          const risk = calculateRisk(region);
          const isSelected = selectedRegion?.id === region.id;
          const color = getRiskColor(risk.level);
          
          return (
            <CircleMarker 
              key={region.id} 
              center={region.coordinates}
              pathOptions={{ 
                color: isSelected ? "#fff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.6,
                weight: isSelected ? 3 : 1
              }}
              radius={isSelected ? 14 : 10}
              eventHandlers={{
                click: () => onSelectRegion(region),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="font-bold text-slate-800">{region.name}</div>
                <div className="text-xs text-slate-600">Risk Level: {risk.level}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
