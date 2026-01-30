import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../admin/dashboard/Sidebar';
import { Menu, Calendar, HelpCircle, RefreshCw, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DateRangeProvider, useDateRange, DATE_PRESETS, getPresetDates } from '../../context/DateRangeContext';
import type { DatePreset } from '../../context/DateRangeContext';
import { Text } from '../ui/primitives/Text';
import { Button } from '../ui/primitives/Button';

// ============================================
// Date Range Filter Component (for header)
// ============================================
function HeaderDateFilter() {
  const { dateRange, setDateRange, triggerRefresh } = useDateRange();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const location = useLocation();

  // Only show on dashboard page
  const showFilter = location.pathname === '/admin';

  if (!showFilter) return null;

  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDateRange({ preset, startDate: dateRange.startDate, endDate: dateRange.endDate });
    } else {
      const dates = getPresetDates(preset);
      setDateRange({ preset, ...dates });
    }
    setShowDatePicker(false);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange({ ...dateRange, preset: 'custom', [field]: value });
  };

  const isFiltered = dateRange.preset !== 'all';
  const currentPresetLabel = DATE_PRESETS.find(p => p.value === dateRange.preset)?.label || 'Todo el período';

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Date Filter Button */}
      <div className="relative">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isFiltered
            ? 'bg-legal-emerald-50 text-legal-emerald-700 border border-legal-emerald-200'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden md:inline">
            {dateRange.preset === 'custom' && dateRange.startDate
              ? `${formatDisplayDate(dateRange.startDate)} - ${formatDisplayDate(dateRange.endDate)}`
              : currentPresetLabel}
          </span>
          {isFiltered && <Filter className="w-3 h-3" />}
        </button>

        {/* Dropdown */}
        {showDatePicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-document border border-slate-200 p-4 z-50 w-80">
              <div className="flex items-center justify-between mb-3">
                <Text variant="body-sm" weight="semibold">Período de datos</Text>
                <button onClick={() => setShowDatePicker(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DATE_PRESETS.filter(p => p.value !== 'custom').map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetChange(preset.value)}
                    className={`px-3 py-2 text-xs font-medium font-sans rounded-md transition-all ${dateRange.preset === preset.value
                      ? 'bg-navy-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <Text variant="caption" color="muted">Rango personalizado</Text>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm font-sans border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm font-sans border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerRefresh}
        className="p-2"
        title="Actualizar datos"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ============================================
// Help Button Component
// ============================================
function HelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="p-2 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-full transition-all"
        title="Ayuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {showHelp && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-document border border-slate-200 p-4 z-50 w-72">
            <div className="flex items-center justify-between mb-3">
              <Text variant="body-sm" weight="semibold">Centro de Ayuda</Text>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <a href="#" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Text variant="body-sm" weight="medium" color="primary">📖 Documentación</Text>
                <Text variant="caption" color="muted" className="mt-0.5">Guías y tutoriales</Text>
              </a>
              <a href="#" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Text variant="body-sm" weight="medium" color="primary">💬 Soporte</Text>
                <Text variant="caption" color="muted" className="mt-0.5">Contactar al equipo</Text>
              </a>
              <a href="#" className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Text variant="body-sm" weight="medium" color="primary">🎯 Atajos de teclado</Text>
                <Text variant="caption" color="muted" className="mt-0.5">Navega más rápido</Text>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Main Layout Component
// ============================================
function AdminLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-200">

        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg md:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>

            {/* Welcome Text */}
            <div className="hidden md:block">
              <h1 className="text-sm font-medium text-slate-500">
                Bienvenido de vuelta, <span className="text-slate-900 font-bold">{firstName}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Date Range Filter (only on dashboard) */}
            <HeaderDateFilter />

            {/* Help Button */}
            <HelpButton />

            {/* Mobile Avatar */}
            <div className="w-8 h-8 rounded-full bg-navy-900 p-[2px] cursor-pointer md:hidden">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-navy-900">{firstName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <DateRangeProvider>
      <AdminLayoutContent />
    </DateRangeProvider>
  );
}