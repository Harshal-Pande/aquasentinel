"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, Tooltip, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Region } from "@/types";

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function ClickHandler({ 
  pinMode, 
  onMapClick 
}: { 
  pinMode: boolean; 
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (pinMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface MapProps {
  regions: Region[];
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
  pinMode: boolean;
  onPinDrop: (lat: number, lon: number) => void;
  draftPin: { lat: number; lon: number } | null;
  onAnalyzeDraft: () => void;
}

export default function MapComponent({ 
  regions, 
  selectedRegion, 
  onSelectRegion,
  pinMode,
  onPinDrop,
  draftPin,
  onAnalyzeDraft
}: MapProps) {
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState(3);

  useEffect(() => {
    if (selectedRegion) {
      setCenter([selectedRegion.latitude, selectedRegion.longitude]);
      setZoom(10);
    } else if (draftPin) {
      setCenter([draftPin.lat, draftPin.lon]);
      setZoom(10);
    }
  }, [selectedRegion, draftPin]);

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "CRITICAL": return "#ef4444"; // red-500
      case "HIGH": return "#f97316"; // orange-500
      case "MODERATE": return "#eab308"; // yellow-500
      case "LOW": return "#10b981"; // emerald-500
      default: return "#0ea5e9"; // sky-500 (unanalyzed)
    }
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className={`w-full h-full bg-slate-900 ${pinMode ? 'cursor-crosshair' : ''}`}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <ChangeView center={center} zoom={zoom} />
      <ClickHandler pinMode={pinMode} onMapClick={onPinDrop} />

      {/* Render analyzed regions */}
      {regions.map((region) => {
        // Just dummy level logic here since Map doesn't compute risk anymore
        // Actually, we should pass riskLevel to Map or just rely on a default color
        // The dashboard knows the risk level, but Map only gets Region.
        // I will color it based on whether it has indicators
        const hasData = !!region.indicators;
        const color = hasData ? (
          region.indicators!.rainfall_anomaly.value < -20 ? "#ef4444" : "#10b981"
        ) : "#0ea5e9";

        return (
          <CircleMarker
            key={region.id}
            center={[region.latitude, region.longitude]}
            radius={selectedRegion?.id === region.id ? 12 : 8}
            fillColor={selectedRegion?.id === region.id ? "#2dd4bf" : color} // teal-400 for selected
            color={selectedRegion?.id === region.id ? "#fff" : color}
            weight={selectedRegion?.id === region.id ? 3 : 1}
            fillOpacity={0.7}
            eventHandlers={{
              click: () => onSelectRegion(region),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="bg-slate-900 text-slate-200 border-slate-700">
              <div className="text-center font-space">
                <strong>{region.name}</strong><br/>
                {region.country && <span className="text-xs text-slate-400">{region.country}</span>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Render Draft Pin */}
      {draftPin && !selectedRegion && (
        <CircleMarker
          center={[draftPin.lat, draftPin.lon]}
          radius={12}
          fillColor="#facc15" // yellow-400
          color="#fff"
          weight={3}
          fillOpacity={0.9}
        >
          <Popup closeButton={false} autoPan={false}>
            <div className="flex flex-col items-center gap-2 p-1 font-space bg-slate-900 text-slate-200 min-w-[150px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Location</span>
              <span className="text-sm">{draftPin.lat.toFixed(4)}° N, {draftPin.lon.toFixed(4)}° E</span>
              <button 
                onClick={onAnalyzeDraft}
                className="mt-2 w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded uppercase tracking-wider transition-colors"
              >
                Analyze Location
              </button>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
