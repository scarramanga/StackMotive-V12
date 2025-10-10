import { apiRequest } from './queryClient';
import type { AdvisorHistoryEntry } from '../types/advisor';
import type { SignalLogFilters, SignalLogEntry } from '../store/signalLog';

export async function auditAdvisorAction(entry: AdvisorHistoryEntry) {
  return apiRequest('POST', '/api/advisor/history', entry);
}

export async function fetchSignalLog(filters: SignalLogFilters, offset = 0): Promise<SignalLogEntry[]> {
  const params = new URLSearchParams();
  if (filters.assets.length) params.append('asset', filters.assets.join(','));
  if (filters.overlays.length) params.append('overlay', filters.overlays.join(','));
  if (filters.triggers.length) params.append('trigger', filters.triggers.join(','));
  if (filters.dateRange.from) params.append('from', filters.dateRange.from.toISOString());
  if (filters.dateRange.to) params.append('to', filters.dateRange.to.toISOString());
  params.append('limit', '50');
  params.append('offset', offset.toString());
  const res = await apiRequest('GET', `/api/signal-log?${params.toString()}`);
  return res as SignalLogEntry[];
}

export async function exportSignalLogCSV(filters: SignalLogFilters): Promise<{ csv: string, auditFooter: string }> {
  const params = new URLSearchParams();
  if (filters.assets.length) params.append('asset', filters.assets.join(','));
  if (filters.overlays.length) params.append('overlay', filters.overlays.join(','));
  if (filters.triggers.length) params.append('trigger', filters.triggers.join(','));
  if (filters.dateRange.from) params.append('from', filters.dateRange.from.toISOString());
  if (filters.dateRange.to) params.append('to', filters.dateRange.to.toISOString());
  const url = `/api/signal-log/export?${params.toString()}`;
  const token = localStorage.getItem('access_token');
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'text/csv',
    },
    credentials: 'include',
  });
  const csv = await response.text();
  const auditFooter = `Exported: ${new Date().toISOString()} | Filters: ${JSON.stringify(filters)}`;
  return { csv, auditFooter };
}  