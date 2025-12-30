import React from "react";
import { Eye } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { feature: "Arriendo", A: 120, B: 110, fullMark: 150 },
  { feature: "Servicios", A: 98, B: 130, fullMark: 150 },
  { feature: "Trabajo", A: 86, B: 130, fullMark: 150 },
  { feature: "NDA", A: 99, B: 100, fullMark: 150 },
  { feature: "Venta", A: 85, B: 90, fullMark: 150 },
];

export const UsageRadar = () => {
  return (
    <div className="col-span-12 lg:col-span-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Eye className="w-4 h-4 text-slate-500" /> Uso por Tipo
        </h3>
      </div>

      <div className="h-64 px-4 pt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="feature" tick={{ fontSize: 10, fill: '#64748b' }} />
            <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="transparent" />
            <Radar
              name="Este Mes"
              dataKey="A"
              stroke="#0891b2"
              fill="#0891b2"
              fillOpacity={0.3}
            />
            <Radar
              name="Mes Pasado"
              dataKey="B"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.3}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};