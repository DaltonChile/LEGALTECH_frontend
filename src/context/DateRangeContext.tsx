// LEGALTECH_frontend/src/context/DateRangeContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ============================================
// Types
// ============================================
export type DatePreset = 'all' | 'today' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export interface DateRangeState {
    preset: DatePreset;
    startDate: string;
    endDate: string;
}

export interface DateRangeParams {
    startDate?: string;
    endDate?: string;
}

interface DateRangeContextType {
    dateRange: DateRangeState;
    setDateRange: (dateRange: DateRangeState) => void;
    getApiParams: () => DateRangeParams;
    refreshKey: number;
    triggerRefresh: () => void;
}

// ============================================
// Constants
// ============================================
export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: 'all', label: 'Todo el período' },
    { value: 'today', label: 'Hoy' },
    { value: 'last7days', label: 'Últimos 7 días' },
    { value: 'thisMonth', label: 'Este mes' },
    { value: 'lastMonth', label: 'Último mes' },
    { value: 'thisYear', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' },
];

const STORAGE_KEY = 'admin_dashboard_date_range';

// ============================================
// Helpers
// ============================================
export const getPresetDates = (preset: DatePreset): { startDate: string; endDate: string } => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
        case 'today':
            return { startDate: formatDate(today), endDate: formatDate(today) };
        case 'last7days': {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
        case 'thisMonth': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
        case 'lastMonth': {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
        case 'thisYear': {
            const start = new Date(today.getFullYear(), 0, 1);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
        case 'all':
        default:
            return { startDate: '', endDate: '' };
    }
};

const loadStoredDateRange = (): DateRangeState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // If it's a dynamic preset, recalculate dates
            if (parsed.preset && parsed.preset !== 'custom' && parsed.preset !== 'all') {
                const dates = getPresetDates(parsed.preset);
                return { preset: parsed.preset, ...dates };
            }
            return parsed;
        }
    } catch (e) {
        console.warn('Error loading date range from localStorage', e);
    }
    return { preset: 'all', startDate: '', endDate: '' };
};

const saveDateRange = (dateRange: DateRangeState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dateRange));
    } catch (e) {
        console.warn('Error saving date range to localStorage', e);
    }
};

// ============================================
// Context
// ============================================
const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
    const [dateRange, setDateRangeState] = useState<DateRangeState>(loadStoredDateRange);
    const [refreshKey, setRefreshKey] = useState(0);

    const setDateRange = useCallback((newDateRange: DateRangeState) => {
        setDateRangeState(newDateRange);
        saveDateRange(newDateRange);
    }, []);

    const getApiParams = useCallback((): DateRangeParams => {
        const params: DateRangeParams = {};
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        return params;
    }, [dateRange]);

    const triggerRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <DateRangeContext.Provider value={{ dateRange, setDateRange, getApiParams, refreshKey, triggerRefresh }}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (context === undefined) {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
}
