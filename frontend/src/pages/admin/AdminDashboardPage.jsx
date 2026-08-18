import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faUsers,
  faUserShield,
  faGamepad,
  faGauge,
} from '@fortawesome/free-solid-svg-icons';

import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import DashboardBarChart from '../../components/dashboard/DashboardBarChart';
import DashboardDoughnutChart from '../../components/dashboard/DashboardDoughnutChart';

import {
  mockDashboardStats,
  mockTournamentsBySport,
  mockTournamentsByFormat,
  mockRecentTournaments,
} from '../../components/dashboard/mockDashboardData';

const STATUS_COLORS = {
  Active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100', bar: '#22c55e' },
  Upcoming: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200', bar: '#94a3b8' },
  Completed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-100', bar: '#3b82f6' },
};

const AdminDashboardPage = () => {
  const stats = mockDashboardStats;

  const statusBreakdown = [
    { label: 'Active', value: stats.activeTournaments, color: STATUS_COLORS.Active.bar },
    { label: 'Upcoming', value: stats.upcomingTournaments, color: STATUS_COLORS.Upcoming.bar },
    { label: 'Completed', value: stats.completedTournaments, color: STATUS_COLORS.Completed.bar },
  ];
  const totalForBar = statusBreakdown.reduce((s, b) => s + b.value, 0);

  return (
    <div className="flex flex-col font-['Inter',_'Segoe_UI',_system-ui,_sans-serif] pb-16">
      <div className="max-w-[1200px] mx-auto w-full px-2">

        {/* Page Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#123836] flex items-center justify-center">
            <FontAwesomeIcon icon={faGauge} className="text-white text-base" />
          </div>
          <div>
            <h1 className="text-2xl md:text-[28px] font-bold text-slate-800 m-0 leading-tight">
              Dashboard
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5 m-0">
              Platform overview at a glance
            </p>
          </div>
        </div>

        {/* ───────── Stat Cards ───────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardStatCard
            icon={faTrophy}
            label="Total Tournaments"
            value={stats.totalTournaments}
            subtitle={`${stats.activeTournaments} active · ${stats.upcomingTournaments} upcoming`}
            accentColor="#f59e0b"
          />
          <DashboardStatCard
            icon={faUsers}
            label="Total Participants"
            value={stats.totalParticipants}
            subtitle="Across all tournaments"
            accentColor="#22c55e"
          />
          <DashboardStatCard
            icon={faUserShield}
            label="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.adminUsers} admins · ${stats.regularUsers} users`}
            accentColor="#3b82f6"
          />
          <DashboardStatCard
            icon={faGamepad}
            label="Matches Played"
            value={stats.matchesPlayed}
            subtitle={`${stats.matchesInProgress} in progress`}
            accentColor="#8b5cf6"
          />
        </div>

        {/* ───────── Charts Row ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <DashboardBarChart
            title="Tournaments by Sport"
            data={mockTournamentsBySport}
          />
          <DashboardDoughnutChart
            title="Tournaments by Format"
            data={mockTournamentsByFormat}
          />
        </div>

        {/* ───────── Tournament Status Breakdown ───────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Tournament Status Breakdown</h3>

          {/* Stacked bar */}
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            {statusBreakdown.map((seg) => {
              const pct = totalForBar > 0 ? (seg.value / totalForBar) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={seg.label}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: seg.color }}
                  title={`${seg.label}: ${seg.value}`}
                />
              );
            })}
          </div>

          {/* Legend row */}
          <div className="flex items-center gap-6 flex-wrap">
            {statusBreakdown.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-xs font-semibold text-slate-600">{seg.label}</span>
                <span className="text-xs font-bold text-slate-400">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───────── Recent Tournaments Table ───────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-sm font-bold text-slate-700">Recent Tournaments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Sport</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Format</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentTournaments.map((t, idx) => {
                  const sc = STATUS_COLORS[t.status] || STATUS_COLORS.Upcoming;
                  const formatDate = (dateStr) => {
                    const d = new Date(dateStr);
                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  };

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-50 transition-colors duration-150 hover:bg-[#123836]/[0.02] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-700 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">{t.sport}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">{t.format}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${sc.bg} ${sc.text} border ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
