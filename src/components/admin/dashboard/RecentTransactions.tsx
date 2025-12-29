import React from "react";
import { ArrowUpRight, FileText, MoreHorizontal } from "lucide-react";

export const RecentTransactions = () => {
  return (
    <div className="col-span-12 p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <FileText className="w-4 h-4 text-slate-500" /> Contratos Recientes
        </h3>
        <button className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline font-medium">
          Ver todos
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="pb-3 pl-2">Contrato</th>
              <th className="pb-3">Usuario</th>
              <th className="pb-3">Fecha</th>
              <th className="pb-3">Estado</th>
              <th className="pb-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <TableRow
              id="CTR-2024-001"
              type="Contrato de Arriendo"
              user="María González"
              date="Hoy, 14:30"
              status="Firmado"
              statusColor="green"
            />
            <TableRow
              id="CTR-2024-002"
              type="Acuerdo NDA"
              user="Tech SpA"
              date="Hoy, 11:15"
              status="Pendiente"
              statusColor="amber"
            />
            <TableRow
              id="CTR-2024-003"
              type="Contrato Servicios"
              user="Juan Pérez"
              date="Ayer"
              status="Borrador"
              statusColor="slate"
            />
            <TableRow
              id="CTR-2024-004"
              type="Contrato Trabajo"
              user="Consultora X"
              date="28 Dic"
              status="Firmado"
              statusColor="green"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableRow = ({
  id,
  type,
  user,
  date,
  status,
  statusColor,
}: {
  id: string;
  type: string;
  user: string;
  date: string;
  status: string;
  statusColor: 'green' | 'amber' | 'slate';
}) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-3 pl-2">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{type}</span>
          <span className="text-xs text-slate-400 font-mono">{id}</span>
        </div>
      </td>
      <td className="py-3 text-slate-600">{user}</td>
      <td className="py-3 text-slate-500">{date}</td>
      <td className="py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[statusColor]}`}>
          {status}
        </span>
      </td>
      <td className="py-3 text-right">
        <button className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};