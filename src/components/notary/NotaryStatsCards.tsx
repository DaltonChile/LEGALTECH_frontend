import React from 'react';
import { Clock, CheckCircle, FileText } from 'lucide-react';
import { Box } from '../ui/primitives/Box';
import { Text } from '../ui/primitives/Text';

interface NotaryStatsCardsProps {
  pending: number;
  completed: number;
  total: number;
}

export const NotaryStatsCards: React.FC<NotaryStatsCardsProps> = ({ 
  pending, 
  completed, 
  total 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Box variant="document" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="caption" color="muted" className="block mb-1">PENDIENTES</Text>
            <Text variant="h3" className="text-2xl font-sans text-amber-600">{pending}</Text>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </Box>

      <Box variant="document" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="caption" color="muted" className="block mb-1">FIRMADOS</Text>
            <Text variant="h3" className="text-2xl font-sans text-legal-emerald-700">{completed}</Text>
          </div>
          <div className="w-10 h-10 bg-legal-emerald-50 rounded-lg flex items-center justify-center border border-legal-emerald-200">
            <CheckCircle className="w-5 h-5 text-legal-emerald-700" />
          </div>
        </div>
      </Box>

      <Box variant="document" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="caption" color="muted" className="block mb-1">TOTAL</Text>
            <Text variant="h3" className="text-2xl font-sans">{total}</Text>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </Box>
    </div>
  );
};
