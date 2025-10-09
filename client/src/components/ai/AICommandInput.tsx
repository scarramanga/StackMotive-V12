import React, { useState } from 'react';
import { api } from '@/lib/api';

export function AICommandInput() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      const result = await api.post('/api/ai/execute-command', { command });
      setResponse(result.data);
      if (result.data.success) {
        setCommand('');
      }
    } catch (error) {
      console.error('AI command failed:', error);
      setResponse({
        success: false,
        message: 'Failed to execute command'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={executeCommand} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">
            🤖 Ask Stack AI to do something
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={loading}
            placeholder="e.g., Add AAPL to my watchlist, Set alert for BTC at $50000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Executing...' : 'Execute Command'}
        </button>
      </form>

      {response && (
        <div className={`mt-4 p-3 rounded-lg ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={response.success ? 'text-green-800' : 'text-red-800'}>
            {response.message}
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p className="font-semibold mb-1">Examples:</p>
        <ul className="space-y-1">
          <li>• Add TSLA to my watchlist</li>
          <li>• Set alert for BTC at $45000</li>
          <li>• Export my portfolio report</li>
        </ul>
      </div>
    </div>
  );
}
