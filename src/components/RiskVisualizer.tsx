"use client";

import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip } from "recharts";
import { Region } from "@/types";

export default function RiskVisualizer({ region }: { region: Region }) {
  if (!region.indicators) return null;
  const ind = region.indicators;

  const data = [
    { subject: "Rainfall", A: Math.min(100, Math.max(0, ind.rainfall_anomaly.value * -2)) },
    { subject: "Heat", A: Math.min(100, ind.temperature_anomaly.value * 20) },
    { subject: "Veg Stress", A: ind.vegetation_stress.value * 100 },
    { subject: "Scarcity", A: (1 - ind.water_availability.value) * 100 },
    { subject: "Pop Density", A: Math.min(100, (ind.population_density.value / 20000) * 100) },
  ];

  return (
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "var(--font-space)" }} />
          <Radar
            name="Risk Level"
            dataKey="A"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", fontSize: "10px", fontFamily: "var(--font-space)" }}
            itemStyle={{ color: "#0ea5e9" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
