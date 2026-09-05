import React, { useState, useEffect } from 'react';
import { Application, InterviewLog, PrepBriefResponse, RejectionAnalysisResponse, OutcomeType } from '../types';
import {
  MessageSquareCode,
  Globe,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen,
  TrendingDown,
  AlertCircle,
  Building,
  Calendar,
  Layers,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface InterviewPrepViewProps {
  applications: Application[];
  interviewLogs: InterviewLog[];
  selectedApplication?: Application | null;
  onAddInterviewLog: (log: Omit<InterviewLog, 'id'>) => Promise<void>;
  onDeleteInterviewLog: (logId: string) => Promise<void>;
}

export const InterviewPrepView: React.FC<InterviewPrepViewProps> = ({
  applications,
  interviewLogs,
  selectedApplication,
  onAddInterviewLog,
  onDeleteInterviewLog,
}) => {
  const [targetAppId, setTargetAppId] = useState<string>(
    selectedApplication?.id || (applications.length > 0 ? applications[0].id : '')
  );

  const activeApp = applications.find((a) => a.id === targetAppId) || selectedApplication || applications[0];

  const [activeTab, setActiveTab] = useState<'prep-brief' | 'logs' | 'rejection-analysis'>('prep-brief');

  // Add Round Modal State
  const [isAddRoundOpen, setIsAddRoundOpen] = useState(false);
  const [roundName, setRoundName] = useState('Technical 1');
  const [questionsAsked, setQuestionsAsked] = useState('');
  const [outcome, setOutcome] = useState<OutcomeType>('pending');
  const [reflection, setReflection] = useState('');
  const [roundDate, setRoundDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSavingRound, setIsSavingRound] = useState(false);

  // AI Prep Brief State
  const [prepBrief, setPrepBrief] = useState<PrepBriefResponse | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  // Rejection Pattern State
  const [rejectionAnalysis, setRejectionAnalysis] = useState<RejectionAnalysisResponse | null>(null);
  const [isLoadingRejection, setIsLoadingRejection] = useState(false);

  useEffect(() => {
    if (selectedApplication) {
      setTargetAppId(selectedApplication.id);
    }
  }, [selectedApplication]);

  const appLogs = interviewLogs.filter((l) => l.applicationId === targetAppId);

  // Fetch AI Prep Brief with Search Grounding
  const handleFetchPrepBrief = async () => {
    if (!activeApp) return;

    setIsLoadingBrief(true);
    setBriefError(null);

    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: activeApp.company,
          role: activeApp.role,
          userLogs: interviewLogs,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate interview prep brief.');
      }

      const data: PrepBriefResponse = await res.json();
      setPrepBrief(data);
    } catch (err: any) {
      setBriefError(err.message || 'Error running AI prep brief.');
    } finally {
      setIsLoadingBrief(false);
    }
  };

  // Run Rejection Analysis across user's past logs
  const handleRunRejectionAnalysis = async () => {
    setIsLoadingRejection(true);
    try {
      const res = await fetch('/api/rejection-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLogs: interviewLogs }),
      });

      if (res.ok) {
        const data: RejectionAnalysisResponse = await res.json();
        setRejectionAnalysis(data);
      }
    } catch (err) {
      console.error('Failed rejection analysis:', err);
    } finally {
      setIsLoadingRejection(false);
    }
  };

  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAppId || !roundName) return;

    setIsSavingRound(true);
    try {
      await onAddInterviewLog({
        applicationId: targetAppId,
        userId: '',
        round: roundName,
        questionsAsked,
        outcome,
        reflection,
        date: roundDate,
      });

      setIsAddRoundOpen(false);
      setQuestionsAsked('');
      setReflection('');
      setOutcome('pending');

      // Automatically generate prep brief if added round
      handleFetchPrepBrief();
    } catch (err) {
      console.error('Failed to add interview log:', err);
    } finally {
      setIsSavingRound(false);
    }
  };

  return (
    <div id="interview-prep-view" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div id="prep-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareCode className="w-6 h-6 text-indigo-600" />
            Interview Experience & AI Prep
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Log your interview questions and get grounded company research briefs powered by Google Search.
          </p>
        </div>

        {/* Application Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Application:</label>
          <select
            id="prep-app-selector"
            value={targetAppId}
            onChange={(e) => setTargetAppId(e.target.value)}
            className="bg-white border border-slate-300 font-bold text-sm text-slate-900 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company} - {app.role} ({app.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('prep-brief')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'prep-brief'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-500" />
          AI Prep Brief (Google Search Grounded)
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Logged Interview Rounds ({appLogs.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('rejection-analysis');
            if (!rejectionAnalysis) handleRunRejectionAnalysis();
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'rejection-analysis'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-500" />
          Rejection Pattern Insights
        </button>
      </div>

      {/* TAB 1: AI PREP BRIEF */}
      {activeTab === 'prep-brief' && (
        <div id="prep-brief-tab" className="space-y-6">
          {!activeApp ? (
            <div className="text-center py-12 text-slate-500">Please select an application to generate interview prep.</div>
          ) : (
            <>
              {/* Trigger Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Google Search Grounding Enabled
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Interview Prep Brief for {activeApp.company}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Searches public interview patterns for "{activeApp.company} {activeApp.role} interview questions" and merges with your logged experience.
                  </p>
                </div>
                <button
                  id="generate-brief-btn"
                  onClick={handleFetchPrepBrief}
                  disabled={isLoadingBrief}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0"
                >
                  {isLoadingBrief ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Grounded Search in Progress...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Fetch Fresh Prep Brief
                    </>
                  )}
                </button>
              </div>

              {briefError && (
                <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-sm">{briefError}</div>
              )}

              {/* Prep Brief Results */}
              {prepBrief && (
                <div className="space-y-6">
                  {/* Likely Rounds & Common Topics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Likely Round Types
                      </h3>
                      <div className="space-y-2">
                        {prepBrief.likelyRoundTypes.map((round, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            {round}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-600" />
                        Commonly Asked Topics & Questions
                      </h3>
                      <div className="space-y-2">
                        {prepBrief.commonTopics.map((topic, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium">
                            &bull; {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3-5 Specific Review Items */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Key Prep Action Items
                    </h3>
                    <div className="space-y-2">
                      {prepBrief.keyReviewItems.map((item, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs font-medium text-slate-800 flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">&check;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cited Web Sources */}
                  {prepBrief.citedSources && prepBrief.citedSources.length > 0 && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citing What It Found (Web Search Sources)</h4>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {prepBrief.citedSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-white border border-slate-300 text-blue-600 hover:underline px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            {src.title || src.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: LOGGED INTERVIEW ROUNDS */}
      {activeTab === 'logs' && (
        <div id="prep-logs-tab" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Rounds for {activeApp?.company} ({appLogs.length})
            </h2>
            <button
              id="add-round-btn"
              onClick={() => setIsAddRoundOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log Interview Round
            </button>
          </div>

          <div className="space-y-4">
            {appLogs.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">{log.round}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        log.outcome === 'pass'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.outcome === 'fail'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> {log.date}
                    <button
                      onClick={() => onDeleteInterviewLog(log.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {log.questionsAsked && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Questions Asked</p>
                    <p className="text-xs text-slate-800 mt-0.5 whitespace-pre-wrap">{log.questionsAsked}</p>
                  </div>
                )}

                {log.reflection && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reflection & Notes</p>
                    <p className="text-xs text-slate-600 mt-0.5 italic">{log.reflection}</p>
                  </div>
                )}
              </div>
            ))}

            {appLogs.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm">
                No interview rounds logged yet for this application. Click "Log Interview Round" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REJECTION PATTERN ANALYSIS */}
      {activeTab === 'rejection-analysis' && (
        <div id="rejection-analysis-tab" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Cross-Interview Rejection Pattern Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gemini analyzes ONLY your actual logged interview failures across all applications to identify real weakness trends. Never fabricates.
              </p>
            </div>
            <button
              onClick={handleRunRejectionAnalysis}
              disabled={isLoadingRejection}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              {isLoadingRejection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
              Re-Analyze
            </button>
          </div>

          {rejectionAnalysis ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                {rejectionAnalysis.patternSummary}
              </div>

              {rejectionAnalysis.hasSufficientData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weaknesses */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                      Identified Weaknesses in Failed Rounds
                    </h3>
                    <div className="space-y-2">
                      {rejectionAnalysis.recurringWeaknesses.map((w, idx) => (
                        <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-900">
                          &bull; {w}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Targeted Actionable Fixes
                    </h3>
                    <div className="space-y-2">
                      {rejectionAnalysis.actionableRecommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900">
                          &check; {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              Click Re-Analyze to run pattern recognition across your logged failures.
            </div>
          )}
        </div>
      )}

      {/* LOG ROUND MODAL */}
      {isAddRoundOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Log Interview Round for {activeApp?.company}
            </h3>

            <form onSubmit={handleSaveRound} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Round Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OA, Technical 1, System Design, HM Round"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Outcome</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as OutcomeType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-semibold"
                >
                  <option value="pending">Pending Result</option>
                  <option value="pass">Passed Round</option>
                  <option value="fail">Failed / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Questions Asked</label>
                <textarea
                  rows={3}
                  placeholder="Coding questions, system design prompt, behavioral topics..."
                  value={questionsAsked}
                  onChange={(e) => setQuestionsAsked(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reflection & Notes</label>
                <textarea
                  rows={2}
                  placeholder="How it felt, what went well, what was missed..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRoundOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRound}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {isSavingRound ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
