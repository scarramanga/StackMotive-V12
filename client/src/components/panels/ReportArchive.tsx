import React, { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '../../lib/initSupabase';
import { Download, FileText, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;
const BUCKET = 'reports'; // Supabase storage bucket for reports

interface ReportMeta {
  name: string;
  type: string;
  createdAt: string;
  url: string;
  status: 'generated' | 'viewed' | 'downloaded';
}

const typeLabels: Record<string, string> = {
  'strategy': 'Strategy',
  'rebalance': 'Rebalance',
  'log': 'Agent Log',
  'snapshot': 'Snapshot',
  'tax': 'Tax',
};

const ReportArchive: React.FC = () => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});

  // Fetch paginated report list from Supabase storage
  useEffect(() => {
    setLoading(true);
    (async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: PAGE_SIZE, offset: from });
      if (error) {
        setLoading(false);
        return;
      }
      if (!data) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      // Filter and map to ReportMeta
      const filtered = data
        .filter((f: any) => f.name.endsWith('.pdf') || f.name.endsWith('.csv'))
        .filter((f: any) => !filterType || f.name.includes(filterType))
        .filter((f: any) => !filterDate || f.name.includes(filterDate.replace(/-/g, '')))
        .map((f: any) => {
          const type = Object.keys(typeLabels).find(t => f.name.toLowerCase().includes(t)) || 'strategy';
          return {
            name: f.name,
            type,
            createdAt: f.created_at || '',
            url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
            status: downloaded[f.name]
              ? 'downloaded'
              : viewed[f.name]
              ? 'viewed'
              : 'generated',
          } as ReportMeta;
        });
      setReports(prev => page === 1 ? filtered : [...prev, ...filtered]);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    })();
    // eslint-disable-next-line
  }, [page, filterType, filterDate]);

  // Mark as viewed
  const handleView = (name: string) => {
    setViewed(v => ({ ...v, [name]: true }));
  };
  // Mark as downloaded
  const handleDownload = (name: string) => {
    setDownloaded(d => ({ ...d, [name]: true }));
  };

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (!loading && hasMore && scrollHeight - scrollTop - clientHeight < 100) {
      setPage(p => p + 1);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4" onScroll={handleScroll} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" /> Report Archive
      </h2>
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm">Type:</label>
        <select value={filterType} onChange={e => { setPage(1); setFilterType(e.target.value); }} className="border rounded px-2 py-1">
          <option value="">All</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="text-sm ml-4">Date:</label>
        <input type="date" value={filterDate} onChange={e => { setPage(1); setFilterDate(e.target.value); }} className="border rounded px-2 py-1" />
        <button className="ml-2 text-xs text-muted-foreground underline" onClick={() => { setPage(1); setFilterType(''); setFilterDate(''); }} disabled={!filterType && !filterDate}>Clear</button>
      </div>
      <div className="space-y-2">
        {reports.length === 0 && !loading && <div className="text-muted-foreground">No reports found.</div>}
        {reports.map(r => (
          <div key={r.name} className="flex items-center gap-4 bg-card rounded shadow p-3">
            <div className="flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{typeLabels[r.type] || r.type} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'downloaded' ? 'bg-green-100 text-green-700' : r.status === 'viewed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-1 px-3 py-1 rounded"
              onClick={() => handleDownload(r.name)}
              download
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        ))}
        {loading && <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin w-6 h-6 text-primary" /></div>}
        {!loading && hasMore && (
          <button className="w-full py-2 text-center text-primary underline" onClick={() => setPage(p => p + 1)}>Load more</button>
        )}
      </div>
    </div>
  );
};

export default ReportArchive; 