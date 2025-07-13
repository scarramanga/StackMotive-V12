import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const VoiceSummaryMode: React.FC = () => {
  // TODO: Replace with real summary and event data
  const [playing, setPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [enabled, setEnabled] = useState(true);
  const isLoading = false;
  const error = false;

  const handlePlay = () => {
    // TODO: Implement SpeechSynthesis logic with real summary
    setPlaying(true);
  };
  const handleStop = () => {
    // TODO: Stop playback
    setPlaying(false);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Voice Summary Mode</CardTitle>
        <CardDescription>
          Listen to a voice summary of your portfolio performance and changes. Uses real data only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 items-center">
          <Button variant="default" onClick={handlePlay} disabled={playing || !enabled}>Play</Button>
          <Button variant="outline" onClick={handleStop} disabled={!playing}>Stop</Button>
          <label className="ml-4 flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <span className="text-xs">Enable Voice</span>
          </label>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-sm">Transcript:</span>
          <div className="mt-2 text-muted-foreground min-h-[48px]">{transcript || 'No summary available'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceSummaryMode; 