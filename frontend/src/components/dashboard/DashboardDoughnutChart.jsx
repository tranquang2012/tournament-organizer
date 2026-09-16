import React from 'react';

const DashboardDoughnutChart = ({ data, title }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build segments
  let cumulativeOffset = 0;
  const segments = data.map((item) => {
    const pct = total > 0 ? item.value / total : 0;
    const dashLength = pct * circumference;
    const gap = circumference - dashLength;
    const offset = -cumulativeOffset;
    cumulativeOffset += dashLength;

    return {
      ...item,
      dashArray: `${dashLength} ${gap}`,
      dashOffset: offset,
      pct,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-700 mb-5">{title}</h3>

      <div className="flex items-center gap-8 flex-1">
        {/* SVG ring */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {/* Data segments */}
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-out"
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 min-w-0">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs font-medium text-slate-600 truncate">{item.label}</span>
                <span className="text-xs font-bold text-slate-400 ml-auto shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardDoughnutChart;
