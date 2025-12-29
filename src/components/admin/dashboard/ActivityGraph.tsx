import React from "react";
import { Users } from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { name: "Lun", contratos: 4, usuarios: 2 },
  { name: "Mar", contratos: 8, usuarios: 5 },
  { name: "Mie", contratos: 12, usuarios: 8 },
  { name: "Jue", contratos: 9, usuarios: 12 },
  { name: "Vie", contratos: 15, usuarios: 18 },
  { name: "Sab", contratos: 5, usuarios: 10 },
  { name: "Dom", contratos: 2, usuarios: 5 },
];

export const ActivityGraph = () => {
  return (
    <div className="col-span-12 lg:col-span-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Users className="w-4 h-4 text-slate-500" /> Actividad Semanal
        </h3>
      </div>

      <div className="h-64 px-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="contratos" stroke="#0891b2" fillOpacity={1} fill="url(#colorContratos)" strokeWidth={2} />
            <Area type="monotone" dataKey="usuarios" stroke="#2563eb" fillOpacity={1} fill="url(#colorUsuarios)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};