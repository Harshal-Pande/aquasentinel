"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Tooltip, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Region, LocationTarget } from "@/types";

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

function MapModeController({ pinMode }: { pinMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (pinMode) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [pinMode, map]);
  return null;
}

// Custom Leaflet icon for the dropped pin
const pulseIcon = L.divIcon({
  className: "custom-pulse-icon",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background-color: #22d3ee;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(34,211,238,0.8);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -3px; left: -3px; right: -3px; bottom: -3px;
        border-radius: 50%;
        border: 2px solid #22d3ee;
        animation: pulse 1.5s infinite;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface MapProps {
  regions: Region[];
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
  pinMode: boolean;
  onPinDrop: (lat: number, lon: number) => void;
  draftLocationTarget?: LocationTarget | null;
  draftPinCoords?: { lat: number; lon: number } | null;
  onAnalyzeDraft: () => void;
}

export default function MapComponent({ 
  regions, 
  selectedRegion, 
  onSelectRegion,
  pinMode,
  onPinDrop,
  draftLocationTarget,
  draftPinCoords,
  onAnalyzeDraft
}: MapProps) {
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState(3);

  useEffect(() => {
    if (selectedRegion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCenter([selectedRegion.latitude, selectedRegion.longitude]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoom(10);
    } else if (draftLocationTarget) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCenter([draftLocationTarget.latitude, draftLocationTarget.longitude]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoom(10);
    } else if (draftPinCoords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCenter([draftPinCoords.lat, draftPinCoords.lon]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoom(10);
    }
  }, [selectedRegion, draftLocationTarget, draftPinCoords]);

  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        /* Custom Popup styling to match AquaSentinel */
        .leaflet-popup-content-wrapper {
          background-color: #0f172a !important;
          border: 1px solid #334155 !important;
          border-radius: 0.5rem !important;
        }
        .leaflet-popup-tip {
          background-color: #0f172a !important;
          border: 1px solid #334155 !important;
        }
      `}</style>
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className={`w-full h-full bg-slate-900 ${pinMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
        zoomControl={false}
      >
        <MapModeController pinMode={pinMode} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          attribution=""
          opacity={0.65}
          pane="overlayPane"
        />
        
        <ChangeView center={center} zoom={zoom} />
        <ClickHandler pinMode={pinMode} onMapClick={onPinDrop} />

        {/* Render analyzed regions */}
        {regions.map((region) => {
          if (selectedRegion?.id === region.id) {
            return (
              <Marker key={region.id} position={[region.latitude, region.longitude]} icon={pulseIcon}>
                <Popup closeButton={false} autoPan={true}>
                  <div className="flex flex-col items-center gap-1 p-1 font-space bg-slate-900 text-slate-200 min-w-[120px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 w-full text-center">Selected</span>
                    <strong className="text-xs text-cyan-400 mt-1">{region.name}</strong>
                    {region.country && <span className="text-[9px] text-slate-400">{region.country}</span>}
                  </div>
                </Popup>
              </Marker>
            );
          }

          const hasData = !!region.indicators;
          const color = hasData ? (
            region.indicators!.rainfall_anomaly.value < -20 ? "#ef4444" : "#10b981"
          ) : "#0ea5e9";

          return (
            <CircleMarker
              key={region.id}
              center={[region.latitude, region.longitude]}
              radius={8}
              fillColor={color}
              color={color}
              weight={1}
              fillOpacity={0.7}
              eventHandlers={{
                click: () => onSelectRegion(region),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="bg-slate-900 text-slate-200 border-slate-700">
                <div className="text-center font-space text-[10px] tracking-widest uppercase p-1">
                  <strong className="text-cyan-400">{region.name}</strong><br/>
                  {region.country && <span className="text-slate-400">{region.country}</span>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Render Draft Pin (when Geocoding/Resolving) */}
        {draftPinCoords && !selectedRegion && (
          <Marker position={[draftPinCoords.lat, draftPinCoords.lon]} icon={pulseIcon}>
            <Popup closeButton={false} autoPan={true}>
              <div className="flex flex-col items-center gap-2 p-1 font-space bg-slate-900 text-slate-200 min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1 w-full text-center">Location Selected</span>
                
                <span className="text-xs font-mono text-cyan-400 mt-1">{draftPinCoords.lat.toFixed(4)}° N, {draftPinCoords.lon.toFixed(4)}° E</span>
                <div className="flex items-center gap-2 text-slate-500 text-[9px] uppercase tracking-widest mt-2 mb-1">
                  <div className="w-3 h-3 rounded-full border-2 border-t-cyan-500 animate-spin"></div>
                  Resolving location...
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
