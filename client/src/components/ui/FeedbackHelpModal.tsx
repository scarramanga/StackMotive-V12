import React, { useState } from 'react';
import { useGPTResponse } from '../../hooks/useGPTResponse';

interface FeedbackHelpModalProps {
  docLinks: { label: string; url: string }[];
  slackWebhookUrl: string;
}

// Block 45: Feedback & Help Modal
export const FeedbackHelpModal: React.FC<FeedbackHelpModalProps> = ({ docLinks, slackWebhookUrl }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'gpt' | 'docs' | 'bug'>('gpt');
  const [gptPrompt, setGptPrompt] = useState('');
  const [gptResponse, sendGptPrompt, loadingGpt] = useGPTResponse();
  const [bugText, setBugText] = useState('');
  const [bugStatus, setBugStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBugStatus('sending');
    try {
      const res = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bugText }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setBugStatus('sent');
      setBugText('');
    } catch {
      setBugStatus('error');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-white shadow-lg w-14 h-14 flex items-center justify-center text-2xl hover:bg-primary/90 focus:outline-none"
        aria-label="Open help and feedback"
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="bg-card dark:bg-card/90 rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-lg text-muted-foreground hover:text-foreground"
              aria-label="Close help modal"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <div className="flex gap-2 mb-4">
              <button className={`px-3 py-1 rounded ${tab === 'gpt' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setTab('gpt')}>AI Assistant</button>
              <button className={`px-3 py-1 rounded ${tab === 'docs' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setTab('docs')}>Docs</button>
              <button className={`px-3 py-1 rounded ${tab === 'bug' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setTab('bug')}>Feedback</button>
            </div>
            {tab === 'gpt' && (
              <div>
                <form onSubmit={e => { e.preventDefault(); sendGptPrompt(gptPrompt); }}>
                  <label className="block mb-2 text-sm font-medium">Ask the AI Assistant</label>
                  <textarea
                    className="w-full rounded border px-3 py-2 mb-2 text-sm"
                    value={gptPrompt}
                    onChange={e => setGptPrompt(e.target.value)}
                    rows={3}
                    placeholder="Type your question..."
                  />
                  <button type="submit" className="btn btn-primary w-full" disabled={loadingGpt || !gptPrompt.trim()}>
                    {loadingGpt ? 'Thinking…' : 'Ask'}
                  </button>
                </form>
                {gptResponse && (
                  <div className="mt-3 p-3 bg-muted rounded text-sm whitespace-pre-line">{gptResponse}</div>
                )}
              </div>
            )}
            {tab === 'docs' && (
              <div>
                <div className="mb-2 text-sm font-medium">Documentation Links</div>
                <ul className="list-disc list-inside space-y-1">
                  {docLinks.map(link => (
                    <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {tab === 'bug' && (
              <form onSubmit={handleBugSubmit}>
                <label className="block mb-2 text-sm font-medium">Describe the bug or feedback</label>
                <textarea
                  className="w-full rounded border px-3 py-2 mb-2 text-sm"
                  value={bugText}
                  onChange={e => setBugText(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue or suggestion..."
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={bugStatus === 'sending' || !bugText.trim()}>
                  {bugStatus === 'sending' ? 'Sending…' : 'Submit'}
                </button>
                {bugStatus === 'sent' && <div className="mt-2 text-green-600 text-xs">Feedback sent! Thank you.</div>}
                {bugStatus === 'error' && <div className="mt-2 text-red-600 text-xs">Failed to send. Please try again.</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 