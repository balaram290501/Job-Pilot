import React from 'react';
import { Application, ApplicationStatus } from '../types';
import {
  Briefcase,
  Send,
  MessageSquare,
  Award,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  Sparkles,
  ArrowRight,
  Sparkle,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  applications: Application[];
  onOpenAddModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  onOpenAddModal,
  onNavigateTab,
}) => {
  // Metric Calculations
  const totalApps = applications.length;

  const countByStatus = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status).length;

  const savedCount = countByStatus('saved');
  const appliedCount = countByStatus('applied');
  const oaCount = countByStatus('oa');
  const interviewingCount = countByStatus('interviewing');
  const offerCount = countByStatus('offer');
  const rejectedCount = countByStatus('rejected');
  const ghostedCount = countByStatus('ghosted');

  // Response Rate Calculation = (OA + Interviewing + Offer + Rejected) / Total Applied * 100
  const responsesReceived = oaCount + interviewingCount + offerCount + rejectedCount;
  const nonSavedCount = totalApps - savedCount;
  const responseRate = nonSavedCount > 0 ? Math.round((responsesReceived / nonSavedCount) * 100) : 0;

  // Average days to response calculation
  const calculateAvgDaysToResponse = (): number => {
    const respondedApps = applications.filter((a) =>
      ['oa', 'interviewing', 'offer', 'rejected'].includes(a.status)
    );
    if (respondedApps.length === 0) return 0;

    let totalDays = 0;
    let count = 0;

    respondedApps.forEach((app) => {
      if (app.appliedDate && app.lastUpdated) {
        const start = new Date(app.appliedDate).getTime();
        const end = new Date(app.lastUpdated).getTime();
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        if (!isNaN(diffDays)) {
          totalDays += diffDays;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(totalDays / count) : 7;
  };

  const avgDaysToResponse = calculateAvgDaysToResponse();

  const statusConfigs: Array<{ status: ApplicationStatus; label: string; color: string; count: number }> = [
    { status: 'saved', label: 'Saved', color: 'bg-slate-500', count: savedCount },
    { status: 'applied', label: 'Applied', color: 'bg-blue-500', count: appliedCount },
    { status: 'oa', label: 'Online Assessment', color: 'bg-amber-500', count: oaCount },
    { status: 'interviewing', label: 'Interviewing', color: 'bg-indigo-500', count: interviewingCount },
    { status: 'offer', label: 'Offers', color: 'bg-emerald-500', count: offerCount },
    { status: 'rejected', label: 'Rejected', count: rejectedCount, color: 'bg-rose-500' },
    { status: 'ghosted', label: 'Ghosted', count: ghostedCount, color: 'bg-zinc-400' },
  ];

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime())
    .slice(0, 5);

  return (
    <div id="dashboard-view" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner Header */}
      <div id="dashboard-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Job Search Dashboard
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Live Sync
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your target applications, pipeline velocity, and AI prep readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="dashboard-tailor-btn"
            onClick={() => onNavigateTab('resume-tailor')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Tailor Resume
          </button>
          <button
            id="dashboard-add-app-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Application
          </button>
        </div>
      </div>

      {/* Top KPI Metric Grid */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Applications */}
        <div id="kpi-total-apps" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tracked</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalApps}</p>
            <p className="text-xs text-slate-500 mt-1">{nonSavedCount} active in pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Response Rate */}
        <div id="kpi-response-rate" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Response Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{responseRate}%</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {responsesReceived} total replies
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Days to Response */}
        <div id="kpi-avg-days" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {avgDaysToResponse > 0 ? `${avgDaysToResponse} days` : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-1">From application to reply</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Interviewing / Offers */}
        <div id="kpi-active-interviews" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Interviews</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{interviewingCount + oaCount}</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              {offerCount} Offer{offerCount === 1 ? '' : 's'} secured!
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Section: Status Pipeline + Quick Tools */}
      <div id="dashboard-middle-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <div id="status-distribution-card" className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Pipeline Status</h2>
              <p className="text-xs text-slate-500">Breakdown of job applications by stage</p>
            </div>
            <button
              id="goto-tracker-btn"
              onClick={() => onNavigateTab('tracker')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              Open Tracker &rarr;
            </button>
          </div>

          {/* Visual Stacked Progress Bar */}
          {totalApps > 0 ? (
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex">
              {statusConfigs.map((cfg) => {
                const pct = (cfg.count / totalApps) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={cfg.status}
                    style={{ width: `${pct}%` }}
                    className={`${cfg.color} h-full transition-all duration-300`}
                    title={`${cfg.label}: ${cfg.count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-4 rounded-full bg-slate-100" />
          )}

          {/* Grid of status items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {statusConfigs.map((cfg) => (
              <div
                key={cfg.status}
                onClick={() => onNavigateTab('tracker')}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  <span className="text-xs font-medium text-slate-600 truncate">{cfg.label}</span>
                </div>
                <p className="text-lg font-bold text-slate-900 mt-1">{cfg.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Shortcuts Banner */}
        <div id="ai-shortcuts-card" className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">AI Job Search Copilot</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use Gemini AI to craft ATS-optimized resumes, generate grounded company prep briefs, and auto-sync application emails.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <button
              onClick={() => onNavigateTab('resume-tailor')}
              className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium border border-white/10 transition"
            >
              <span>Tailor Resume for a Job</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => onNavigateTab('interview-prep')}
              className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium border border-white/10 transition"
            >
              <span>Get Grounded Interview Brief</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => onNavigateTab('gmail-sync')}
              className="w-full flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium border border-white/10 transition"
            >
              <span>Scan Gmail Updates</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={() => onNavigateTab('learning-hub')}
              className="w-full flex items-center justify-between p-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl text-xs font-semibold border border-indigo-400/30 text-cyan-200 transition"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                Learning Hub (DSA & Skills)
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Applications List */}
      <div id="recent-applications-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Applications Activity</h2>
          <button
            onClick={() => onNavigateTab('tracker')}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            View All ({totalApps})
          </button>
        </div>

        {recentApps.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No applications tracked yet</p>
            <p className="text-xs text-slate-500 mb-4">
              Add your first application manually or drag our bookmarklet on LinkedIn/Naukri.
            </p>
            <button
              onClick={onOpenAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Add Application
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentApps.map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg transition">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{app.role}</p>
                  <p className="text-xs text-slate-500 truncate">{app.company} &bull; {app.source || 'Other'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    app.status === 'offer'
                      ? 'bg-emerald-100 text-emerald-800'
                      : app.status === 'interviewing'
                      ? 'bg-indigo-100 text-indigo-800'
                      : app.status === 'oa'
                      ? 'bg-amber-100 text-amber-800'
                      : app.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-400 min-w-[70px] text-right">
                    {app.appliedDate || 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
