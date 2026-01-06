
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCards = () => {
  return (
    <>
      <Card
        title="Ingresos Totales"
        value="$2.5M"
        pillText="+2.75%"
        trend="up"
        period="Último mes"
      />
      <Card
        title="Contratos Generados"
        value="1,234"
        pillText="+12.5%"
        trend="up"
        period="Último mes"
      />
      <Card
        title="Usuarios Activos"
        value="89"
        pillText="-1.01%"
        trend="down"
        period="Últimos 7 días"
      />
    </>
  );
};

const Card = ({
  title,
  value,
  pillText,
  trend,
  period,
}: {
  title: string;
  value: string;
  pillText: string;
  trend: "up" | "down";
  period: string;
}) => {
  return (
    <div className="col-span-12 md:col-span-4 p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex mb-4 items-start justify-between">
        <div>
          <h3 className="text-slate-500 mb-1 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <span
          className={`text-xs flex items-center gap-1 font-semibold px-2 py-1 rounded-full ${
            trend === "up"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} 
          {pillText}
        </span>
      </div>

      <p className="text-xs text-slate-400">{period}</p>
    </div>
  );
};