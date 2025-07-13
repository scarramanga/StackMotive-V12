import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

interface MarketClockIndicatorProps {
  market: string;
  timezone: string;
  openTime: string; // e.g., '09:30'
  closeTime: string; // e.g., '16:00'
}

export const MarketClockIndicator: React.FC<MarketClockIndicatorProps> = ({ market, timezone, openTime, closeTime }) => {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);
  const today = now.tz(timezone).format('YYYY-MM-DD');
  const open = dayjs.tz(`${today} ${openTime}`, timezone);
  const close = dayjs.tz(`${today} ${closeTime}`, timezone);
  const isOpen = now.isAfter(open) && now.isBefore(close);
  const timeToEvent = isOpen ? close.diff(now, 'minute') : open.diff(now, 'minute');
  const eventLabel = isOpen ? 'Closes in' : 'Opens in';
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded ${isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'} dark:${isOpen ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-200'}`}
      aria-live="polite"
      title={`${market} is ${isOpen ? 'OPEN' : 'CLOSED'} (${openTime}–${closeTime} ${timezone})`}
    >
      <span className="font-bold">{market}</span>
      <span className="font-mono">{now.tz(timezone).format('HH:mm:ss')}</span>
      <span className="text-xs">{isOpen ? 'OPEN' : 'CLOSED'}</span>
      <span className="text-xs">{eventLabel} {Math.abs(timeToEvent)} min</span>
    </div>
  );
}; 