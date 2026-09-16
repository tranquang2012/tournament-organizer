import { useEffect, useState } from 'react';

const formatPlayClock = (totalMs) => {
  const totalSeconds = Math.max(0, Math.floor((Number(totalMs) || 0) / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}'`;
};

export const useMatchPlayClock = ({ status, elapsedMs, runningSince } = {}) => {
  const isRunning = status === 'ongoing' || status === 'running';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const base = Math.max(0, Number(elapsedMs) || 0);
  if (!isRunning) return formatPlayClock(base);

  const since = runningSince ? new Date(runningSince).getTime() : NaN;
  const extra = Number.isFinite(since) ? Math.max(0, now - since) : 0;
  return formatPlayClock(base + extra);
};
