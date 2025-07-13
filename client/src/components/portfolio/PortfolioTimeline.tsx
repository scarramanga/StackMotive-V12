import React, { useState, useRef } from 'react';
import { usePortfolioTimeline, PortfolioState } from '../../hooks/usePortfolioTimeline';

const SPEEDS = [
  { label: '×1', value: 1000 },
  { label: '×2', value: 500 },
  { label: '×5', value: 200 },
];

const PortfolioTimeline: React.FC = () => {
  const { getTimeline, playback } = usePortfolioTimeline();
  const timeline = getTimeline();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const stopRef = useRef<() => void>();

  const current = timeline[idx];

  const handlePlay = () => {
    setPlaying(true);
    stopRef.current = playback(speed, (state, i) => {
      setIdx(i);
      if (i === timeline.length - 1) setPlaying(false);
    });
  };
  const handlePause = () => {
    setPlaying(false);
    if (stopRef.current) stopRef.current();
  };
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdx(Number(e.target.value));
    setPlaying(false);
    if (stopRef.current) stopRef.current();
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Portfolio Timeline & Playback</h2>
      <div className="mb-4 flex items-center gap-4">
        <button
          className={`px-4 py-2 rounded ${playing ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold`}
          onClick={playing ? handlePause : handlePlay}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={idx}
          onChange={handleSlider}
          className="flex-1 mx-4"
        />
        <span className="text-xs text-gray-500">{current ? new Date(current.timestamp).toLocaleString() : ''}</span>
        <div className="flex gap-1 ml-4">
          {SPEEDS.map(s => (
            <button
              key={s.value}
              className={`px-2 py-1 rounded text-xs font-semibold ${speed === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              onClick={() => setSpeed(s.value)}
              disabled={playing}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 p-4 rounded bg-gray-50 dark:bg-gray-800 shadow-inner">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">Snapshot</span>
          {current?.event && (
            <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs" title={current.event}>
              {current.event}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Holdings</div>
            <ul className="text-sm">
              {current?.holdings.map(h => (
                <li key={h.symbol} className="mb-1 flex gap-2 items-center">
                  <span className="font-mono font-bold">{h.symbol}</span>
                  <span className="text-xs text-gray-500">{h.shares} shares</span>
                  <span className="text-xs text-blue-700 dark:text-blue-300">${h.valueUSD.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-200">Cash Balance</div>
            <div className="text-lg font-mono">${current?.cashBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Step {idx + 1} of {timeline.length}</span>
        {current?.event && <span>Event: {current.event}</span>}
      </div>
    </div>
  );
};

export default PortfolioTimeline; 