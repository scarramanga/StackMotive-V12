import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PreviewStatus {
  active: boolean;
  preview_tier?: string;
  current_tier: string;
  remaining_seconds?: number;
}

export function TierPreviewBanner() {
  const [status, setStatus] = useState<PreviewStatus | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!status?.active || !status.remaining_seconds) return;
    
    setTimeLeft(status.remaining_seconds);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status?.remaining_seconds]);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/tier-preview/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch preview status:', error);
    }
  };

  const endPreview = async () => {
    try {
      await api.post('/api/tier-preview/end');
      fetchStatus();
    } catch (error) {
      console.error('Failed to end preview:', error);
    }
  };

  if (!status?.active) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">🚀 Preview Mode</span>
        <span className="text-sm">
          Previewing <span className="font-semibold uppercase">{status.preview_tier}</span> features
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white/20 px-4 py-2 rounded-lg font-mono text-lg">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <button
          onClick={endPreview}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition"
        >
          End Preview
        </button>
      </div>
    </div>
  );
}
