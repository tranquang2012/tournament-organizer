import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DashboardStatCard = ({ icon, label, value, subtitle, accentColor = '#123836' }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 flex items-start gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-shadow duration-300">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accentColor}14` }}
      >
        <FontAwesomeIcon icon={icon} className="text-lg" style={{ color: accentColor }} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
        <span className="text-2xl font-bold text-slate-800 leading-tight">{value}</span>
        {subtitle && (
          <span className="text-xs font-medium text-slate-400 mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default DashboardStatCard;
