"use client";

import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts";
import { Region } from "@/types";

export default function RiskVisualizer({ region }: { region: Region }) {
  if (!region.indicators) return null;
  const ind = region.indicators;

  // Normalize data for the radar chart (0-100 scale for visual balance)
  const data = [
    {
      subject: "Rainfall Deficit",
      A: Math.min(100, Math.max(0, ind.rainfall_anomaly.value * -2)),
      fullMark: 100,
    },
    {
      subject: "Temp Heat",
      A: Math.min(100, ind.temperature_anomaly.value * 20),
      fullMark: 100,
    },
    {
      subject: "Veg Stress",
      A: ind.vegetation_stress.value * 100,
      fullMark: 100,
    },
    {
      subject: "Scarcity",
      A: (1 - ind.water_availability.value) * 100,
      fullMark: 100,
    },
    {
      subject: "Population",
      A: Math.min(100, (ind.population_density.value / 20000) * 100),
      fullMark: 100,
    },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#2dd4bf' }}
          />
          <Radar name="Risk Factor" dataKey="A" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
