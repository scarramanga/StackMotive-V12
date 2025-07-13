import create from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchSignalLog, exportSignalLogCSV } from '../lib/advisorAudit';
import { detectAnomalies } from '../utils/anomalyDetection';

export interface SignalLogFilters {
  assets: string[];
  overlays: string[];
  triggers: string[];
  dateRange: { from?: Date; to?: Date };
  assetOptions: string[];
  overlayOptions: string[];
  triggerOptions: string[];
}

export interface SignalLogEntry {
  id: string;
  symbol: string;
  action: string;
  signalStrength: number | null;
  technicalIndicators: any;
  status: string;
  generatedAt: string;
  executedAt: string | null;
  notes: string;
  rebalance: any;
  tags?: string[];
  annotation?: string;
}

interface SignalLogState {
  filters: SignalLogFilters;
  setFilters: (filters: Partial<SignalLogFilters>) => void;
  logEntries: SignalLogEntry[];
  fetchMore: () => void;
  hasMore: boolean;
  loading: boolean;
  exportCSV: () => Promise<void>;
  setAnnotation: (id: string, note: string) => void;
  setTag: (id: string, tag: string) => void;
  timelineMode: boolean;
  setTimelineMode: (mode: boolean) => void;
  anomalyMap: Record<string, boolean>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const useSignalLogStore = create<SignalLogState>()(
  persist(
    (set, get) => ({
      filters: {
        assets: [],
        overlays: [],
        triggers: [],
        dateRange: {},
        assetOptions: [],
        overlayOptions: [],
        triggerOptions: [],
      },
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        logEntries: [],
        hasMore: true,
      })),
      logEntries: [],
      fetchMore: async () => {
        const { filters, logEntries } = get();
        set({ loading: true });
        const newEntries = await fetchSignalLog(filters, logEntries.length);
        set({
          logEntries: [...logEntries, ...newEntries],
          hasMore: newEntries.length > 0,
          loading: false,
          anomalyMap: detectAnomalies([...logEntries, ...newEntries]),
        });
      },
      hasMore: true,
      loading: false,
      exportCSV: async () => {
        const { filters } = get();
        await exportSignalLogCSV(filters);
      },
      setAnnotation: (id, note) => set((state) => ({
        logEntries: state.logEntries.map(e => e.id === id ? { ...e, annotation: note } : e)
      })),
      setTag: (id, tag) => set((state) => ({
        logEntries: state.logEntries.map(e => e.id === id ? { ...e, tags: [...(e.tags || []), tag] } : e)
      })),
      timelineMode: true,
      setTimelineMode: (mode) => set({ timelineMode: mode }),
      anomalyMap: {},
      subscribeRealtime: () => {
        // Poll every 30s for new entries
        const interval = setInterval(() => get().fetchMore(), 30000);
        set({ _realtimeInterval: interval });
      },
      unsubscribeRealtime: () => {
        const interval = (get() as any)._realtimeInterval;
        if (interval) clearInterval(interval);
      },
    }),
    { name: 'signal-log-store' }
  )
); 