import { useState } from 'react';

// Block 45: Feedback & Help Modal — GPT Response Hook
export function useGPTResponse(): [string, (prompt: string) => void, boolean] {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendPrompt(prompt: string) {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('/api/gpt-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      setResponse(data.response || 'No response.');
    } catch (e: any) {
      setResponse(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return [response, sendPrompt, loading];
} 