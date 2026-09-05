import React, { useState, useMemo } from 'react';
import { Application, ApplicationStatus, InterviewLog, LearningTracker, RejectionAnalysisResponse } from '../types';
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
  TrendingDown,
  Loader2,
  AlertCircle,
  Lightbulb,
  Activity,
} from 'lucide-react';

interface DashboardViewProps {
  applications: Application[];
  interviewLogs?: InterviewLog[];
  trackers?: LearningTracker[];
  onOpenAddModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  interviewLogs = [],
  trackers = [],
  onOpenAddModal,
  onNavigateTab,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rejectionAnalysis, setRejectionAnalysis] = useState<RejectionAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyzeRejections = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/rejection-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLogs: interviewLogs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to analyze rejection patterns.');
      }
      const data: RejectionAnalysisResponse = await res.json();
      setRejectionAnalysis(data);
    } catch (err: any) {
      console.error('Error analyzing rejections:', err);
      setAnalysisError(err.message || 'Error occurred while analyzing rejection patterns.');
    } finally {
      setIsAnalyzing(false);
    }
  };
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

  // 14-day date window calculation for Daily Progress trend charts
  const last14DaysData = useMemo(() => {
    const days: {
      dateKey: string;
      dayLabel: string;
      displayDate: string;
      appsCount: number;
    }[] = [];

    const now = new Date();
    // Build array from 13 days ago to today (14 days total)
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Count applications with appliedDate matching this dateKey
      const appsCount = applications.filter((app) => {
        if (!app.appliedDate) return false;
        if (app.appliedDate.startsWith(dateKey)) return true;
        try {
          const appDate = new Date(app.appliedDate);
          if (!isNaN(appDate.getTime())) {
            const aY = appDate.getFullYear();
            const aM = String(appDate.getMonth() + 1).padStart(2, '0');
            const aD = String(appDate.getDate()).padStart(2, '0');
            return `${aY}-${aM}-${aD}` === dateKey;
          }
        } catch {
          return false;
        }
        return false;
      }).length;

      days.push({ dateKey, dayLabel, displayDate, appsCount });
    }

    return days;
  }, [applications]);

  const maxAppsIn14Days = useMemo(() => {
    const maxVal = Math.max(...last14DaysData.map((d) => d.appsCount), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [last14DaysData]);

  const totalAppliedIn14Days = useMemo(() => {
    return last14DaysData.reduce((sum, d) => sum + d.appsCount, 0);
  }, [last14DaysData]);

  // Derive total completed topics across all trackers (rendered as a flat line across the 14 days)
  const totalCompletedTopics = useMemo(() => {
    return trackers.reduce((sum, tracker) => {
      const completedCount = (tracker.topics || []).filter((t) => t.completed).length;
      return sum + completedCount;
    }, 0);
  }, [trackers]);

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

      {/* Daily Progress Section */}
      <div id="daily-progress-section" className="bg-slate-900 border border-slate-800 text-white p-6 sm:p-7 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Daily Progress</h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  14-Day Activity Trends
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Track your job application velocity alongside learning curriculum completion progress.
              </p>
            </div>
          </div>
        </div>

        {/* 2 Trend Charts Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Applications per Day */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Applications per Day</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Jobs submitted in the last 14 days</p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block shrink-0" />
                <span className="text-[11px] font-medium text-slate-300">Jobs Applied</span>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded ml-1">
                  {totalAppliedIn14Days}
                </span>
              </div>
            </div>

            {/* Pure CSS Bar Chart */}
            <div className="space-y-2">
              <div className="h-44 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-1 border-b border-slate-700 relative">
                {/* Horizontal Guide lines */}
                <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-800 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-800 pointer-events-none" />

                {last14DaysData.map((day) => {
                  const barHeightPct = day.appsCount > 0
                    ? Math.max(Math.round((day.appsCount / maxAppsIn14Days) * 100), 12)
                    : 0;

                  return (
                    <div
                      key={day.dateKey}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-950 text-white text-[10px] py-1 px-2 rounded border border-slate-700 whitespace-nowrap shadow-xl transition-opacity z-20">
                        <span className="font-bold text-indigo-300">{day.appsCount}</span> applied • {day.dayLabel}, {day.displayDate}
                      </div>

                      {/* Bar Value on top if > 0 */}
                      {day.appsCount > 0 && (
                        <span className="text-[9px] font-bold text-indigo-300 mb-1 leading-none transition group-hover:scale-110">
                          {day.appsCount}
                        </span>
                      )}

                      {/* Pure CSS Bar */}
                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          className={`w-full max-w-[20px] rounded-t-sm transition-all duration-300 ${
                            day.appsCount > 0
                              ? 'bg-indigo-500 hover:bg-indigo-400 shadow-sm shadow-indigo-500/30'
                              : 'bg-slate-800/80 hover:bg-slate-700/60'
                          }`}
                          style={{ height: day.appsCount > 0 ? `${barHeightPct}%` : '2px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between gap-1 sm:gap-1.5 pt-1">
                {last14DaysData.map((day, idx) => (
                  <div
                    key={day.dateKey}
                    className="flex-1 text-center"
                  >
                    <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${
                      idx === 13 ? 'text-indigo-400 font-bold' : 'text-slate-400'
                    }`}>
                      {day.dayLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Topics Completed per Day */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Topics Completed per Day</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Active curriculum completion across trackers</p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/80 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shrink-0" />
                <span className="text-[11px] font-medium text-slate-300">Completed Topics</span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded ml-1">
                  {totalCompletedTopics}
                </span>
              </div>
            </div>

            {/* Pure CSS Bar Chart (Flat line across 14 days) */}
            <div className="space-y-2">
              <div className="h-44 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-1 border-b border-slate-700 relative">
                {/* Horizontal Guide lines */}
                <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-800 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-800 pointer-events-none" />

                {/* Flat Baseline Reference Line */}
                {totalCompletedTopics > 0 && (
                  <div
                    className="absolute inset-x-0 border-t-2 border-dashed border-emerald-400/50 pointer-events-none z-10 flex items-center justify-end pr-2"
                    style={{ bottom: '65%' }}
                  >
                    <span className="bg-slate-900 text-[9px] font-semibold text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 -mt-3 shadow">
                      Flat Baseline: {totalCompletedTopics} completed
                    </span>
                  </div>
                )}

                {last14DaysData.map((day) => {
                  return (
                    <div
                      key={day.dateKey}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-950 text-white text-[10px] py-1 px-2 rounded border border-slate-700 whitespace-nowrap shadow-xl transition-opacity z-20">
                        <span className="font-bold text-emerald-300">{totalCompletedTopics}</span> completed • {day.dayLabel}, {day.displayDate}
                      </div>

                      {/* Pure CSS Bar */}
                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          className={`w-full max-w-[20px] rounded-t-sm transition-all duration-300 ${
                            totalCompletedTopics > 0
                              ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-emerald-500/30'
                              : 'bg-slate-800/80 hover:bg-slate-700/60'
                          }`}
                          style={{ height: totalCompletedTopics > 0 ? '65%' : '2px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between gap-1 sm:gap-1.5 pt-1">
                {last14DaysData.map((day, idx) => (
                  <div
                    key={day.dateKey}
                    className="flex-1 text-center"
                  >
                    <span className={`text-[10px] sm:text-[11px] font-medium block truncate ${
                      idx === 13 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                    }`}>
                      {day.dayLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Pattern Analysis Section */}
      <div id="rejection-pattern-analysis-section" className="bg-slate-900 border border-slate-800 text-white p-6 sm:p-7 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Rejection Pattern Analysis</h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  AI Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Pinpoint recurring interview bottlenecks, failed round themes, and actionable recovery steps based on your logged history.
              </p>
            </div>
          </div>

          <button
            id="analyze-rejections-btn"
            onClick={handleAnalyzeRejections}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition shadow-sm shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Logs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span>Analyze My Rejections</span>
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="p-8 bg-slate-800/50 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="text-sm font-medium text-slate-200">Analyzing your interview rounds & feedback...</p>
            <p className="text-xs text-slate-400">Gemini is evaluating your logged interview rounds to pinpoint recurring failure patterns.</p>
          </div>
        )}

        {/* Error State */}
        {analysisError && !isAnalyzing && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-200">Analysis Request Failed</p>
              <p className="text-xs text-rose-300/90">{analysisError}</p>
            </div>
          </div>
        )}

        {/* Results State */}
        {rejectionAnalysis && !isAnalyzing && (
          <div className="space-y-5">
            {/* If hasSufficientData is false, show a friendly message saying "Log more interview rounds to see patterns" */}
            {!rejectionAnalysis.hasSufficientData ? (
              <div className="p-5 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Log more interview rounds to see patterns
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rejectionAnalysis.patternSummary || 'Record your interview questions, reflection notes, and outcomes in Interview Prep to reveal recurring themes.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('interview-prep')}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition shrink-0"
                >
                  Log Interview Round
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Summary card with patternSummary text */}
                <div className="p-4 sm:p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Pattern Summary</h3>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {rejectionAnalysis.patternSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 2. List of recurringWeaknesses as red badge pills */}
                  <div className="p-4 sm:p-5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Recurring Weaknesses</h3>
                    </div>
                    {rejectionAnalysis.recurringWeaknesses && rejectionAnalysis.recurringWeaknesses.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {rejectionAnalysis.recurringWeaknesses.map((weakness, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2" />
                            {weakness}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No recurring weaknesses identified in logs.</p>
                    )}
                  </div>

                  {/* 3. List of actionableRecommendations as green bullet points */}
                  <div className="p-4 sm:p-5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Actionable Recommendations</h3>
                    </div>
                    {rejectionAnalysis.actionableRecommendations && rejectionAnalysis.actionableRecommendations.length > 0 ? (
                      <ul className="space-y-2.5 pt-1">
                        {rejectionAnalysis.actionableRecommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No specific recommendations generated.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial helper note when not analyzed yet */}
        {!rejectionAnalysis && !isAnalyzing && !analysisError && (
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              {interviewLogs.length > 0
                ? `${interviewLogs.length} interview round log(s) loaded and ready for diagnostic pattern analysis.`
                : 'Zero interview rounds logged yet. You can click above to check status or log your first round in Interview Prep.'}
            </span>
            <span className="text-[11px] text-slate-500">Analysis runs securely using server-side Gemini</span>
          </div>
        )}
      </div>
    </div>
  );
};
