export const formatDuration = (ms) => {
  if (ms == null || ms === '' || !Number.isFinite(Number(ms))) return '—';
  const totalCs = Math.round(Number(ms) / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hr}:${String(remMin).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${min}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

export const msToFields = (ms) => {
  if (ms == null || ms === '' || !Number.isFinite(Number(ms))) {
    return { min: '', sec: '', cs: '' };
  }
  const totalCs = Math.round(Number(ms) / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return {
    min: String(min),
    sec: String(sec),
    cs: String(cs).padStart(2, '0'),
  };
};

export const fieldsToMs = (min, sec, cs) => {
  const m = min === '' || min == null ? 0 : Number(min);
  const s = sec === '' || sec == null ? 0 : Number(sec);
  const c = cs === '' || cs == null ? 0 : Number(cs);
  if (!Number.isFinite(m) || m < 0) throw new Error('Minutes must be a non-negative number.');
  if (!Number.isFinite(s) || s < 0 || s > 59) throw new Error('Seconds must be between 0 and 59.');
  if (!Number.isFinite(c) || c < 0 || c > 99) throw new Error('Hundredths must be between 0 and 99.');
  return ((m * 60 + s) * 100 + c) * 10;
};

export const formatScore = (value, scoreMode = 'points') => (
  scoreMode === 'time' ? formatDuration(value) : String(value ?? '—')
);
