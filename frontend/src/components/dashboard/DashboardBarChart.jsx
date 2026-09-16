import React from 'react';

const DashboardBarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-700 mb-5">{title}</h3>
      <div className="flex flex-col gap-3.5 flex-1">
        {data.map((item) => {
          const pct = Math.round((item.value / maxValue) * 100);
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 w-28 shrink-0 truncate text-right">
                {item.label}
              </span>
              <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                    minWidth: pct > 0 ? '24px' : '0',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-6 text-right shrink-0">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardBarChart;
