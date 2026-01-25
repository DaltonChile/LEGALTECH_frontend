import React from 'react';
import { Download, Upload, FileText } from 'lucide-react';
import type { NotaryContract } from '../../services/api';

interface NotaryContractRowProps {
  contract: NotaryContract;
  onDownload: (contractId: string, trackingCode: string) => void;
  onUpload: (contractId: string, file: File) => void;
  uploading: boolean;
}

export const NotaryContractRow: React.FC<NotaryContractRowProps> = ({
  contract,
  onDownload,
  onUpload,
  uploading
}) => {
  const notarySigner = contract.signers.find(s => s.role === 'notary');
  const isPending = contract.status === 'waiting_notary';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{contract.templateVersion.template.title}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{contract.tracking_code}</p>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{contract.buyer_rut}</span>
          <span className="text-xs text-slate-500">RUT Comprador</span>
        </div>
      </td>

      <td className="px-6 py-4">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pendiente
          </span>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Firmado
            </span>
            {notarySigner?.signed_at && (
              <span className="text-[10px] text-slate-400">
                {new Date(notarySigner.signed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="text-sm text-slate-700 font-medium">{contract.buyer_email}</div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">${contract.total_amount.toLocaleString()}</span>
          <span className="text-xs text-slate-400">Created: {new Date(contract.created_at).toLocaleDateString()}</span>
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onDownload(contract.id, contract.tracking_code)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {isPending && (
            <label className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" title="Subir documento firmado">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && confirm('¿Estás seguro de subir este documento firmado?')) {
                    onUpload(contract.id, file);
                  }
                }}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </td>
    </tr>
  );
};
