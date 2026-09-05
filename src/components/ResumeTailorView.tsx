import React, { useState, useEffect } from 'react';
import { Application, TailorResumeResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Save,
  ArrowRight,
  Copy,
  Check,
  Building,
  RefreshCw,
  Gauge,
  Layers,
} from 'lucide-react';

interface ResumeTailorViewProps {
  applications: Application[];
  selectedApplication?: Application | null;
  onSaveTailoredResume: (appId: string, tailoredText: string) => Promise<void>;
}

export const ResumeTailorView: React.FC<ResumeTailorViewProps> = ({
  applications,
  selectedApplication,
  onSaveTailoredResume,
}) => {
  const { userDoc } = useAuth();

  const [targetAppId, setTargetAppId] = useState<string>(selectedApplication?.id || '');
  const [company, setCompany] = useState<string>(selectedApplication?.company || '');
  const [role, setRole] = useState<string>(selectedApplication?.role || '');
  const [jobDescription, setJobDescription] = useState<string>(
    selectedApplication?.jobDescriptionText || ''
  );
  const [resumeText, setResumeText] = useState<string>(userDoc?.resumeMasterText || '');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TailorResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Sync when selectedApplication changes
  useEffect(() => {
    if (selectedApplication) {
      setTargetAppId(selectedApplication.id);
      setCompany(selectedApplication.company);
      setRole(selectedApplication.role);
      setJobDescription(selectedApplication.jobDescriptionText || '');
    }
  }, [selectedApplication]);

  // Handle application dropdown selection change
  const handleAppDropdownChange = (appId: string) => {
    setTargetAppId(appId);
    if (appId === 'custom') {
      setCompany('');
      setRole('');
      setJobDescription('');
    } else {
      const app = applications.find((a) => a.id === appId);
      if (app) {
        setCompany(app.company);
        setRole(app.role);
        setJobDescription(app.jobDescriptionText || '');
      }
    }
  };

  const handleRunTailoring = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }
    if (!resumeText.trim()) {
      setError('Please provide a master resume.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          resumeText,
          company,
          role,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to tailor resume.');
      }

      const data: TailorResumeResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during resume tailoring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTailoredText = () => {
    if (!result?.tailoredResumeText) return;
    navigator.clipboard.writeText(result.tailoredResumeText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToApplication = async () => {
    if (!targetAppId || targetAppId === 'custom' || !result?.tailoredResumeText) return;
    try {
      await onSaveTailoredResume(targetAppId, result.tailoredResumeText);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save tailored resume:', err);
    }
  };

  return (
    <div id="resume-tailor-view" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* View Header */}
      <div id="tailor-header" className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          AI Resume Tailor
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Paste a target job description and customize your bullet points with Gemini AI for max ATS score while preserving truthfulness.
        </p>
      </div>

      {/* Input Section Grid */}
      <div id="tailor-input-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Target Application & Job Description */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">1. Target Job Description</h2>
            <select
              id="tailor-app-dropdown"
              value={targetAppId}
              onChange={(e) => handleAppDropdownChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700"
            >
              <option value="custom">+ Custom / New JD</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} - {app.role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Job Description Text *</label>
            <textarea
              rows={8}
              placeholder="Paste full job description requirements and qualifications here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Right Column: Base / Master Resume */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">2. Master Resume</h2>
              <span className="text-xs text-slate-500 font-medium">Default loaded from settings</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Resume Text *</label>
              <textarea
                rows={11}
                placeholder="Paste your base resume text or experience bullet points..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          <button
            id="run-tailor-btn"
            onClick={handleRunTailoring}
            disabled={isLoading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Tailoring Bullet Points with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Generate Tailored Resume
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* RESULTS SECTION */}
      {result && (
        <div id="tailor-results-container" className="space-y-6 pt-4 border-t border-slate-200">
          {/* ATS Score & Overview Banner */}
          <div id="ats-score-card" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Gauge */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-slate-800 border-4 border-indigo-500 flex items-center justify-center shadow-inner">
                <span className="text-2xl font-bold text-cyan-300">{result.atsScore}%</span>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">ATS Match Score</p>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {result.atsScore >= 80 ? 'High Match' : result.atsScore >= 60 ? 'Moderate Match' : 'Gaps Detected'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">Based on keyword frequency & formatting</p>
              </div>
            </div>

            {/* Summary */}
            <div className="md:col-span-2 space-y-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Strategy Summary</h4>
              <p className="text-xs text-slate-200 leading-relaxed">{result.summary}</p>
              {targetAppId && targetAppId !== 'custom' && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    id="save-tailored-resume-btn"
                    onClick={handleSaveToApplication}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {isSaved ? 'Saved to Application!' : 'Save Tailored Resume to Job Record'}
                  </button>
                  <button
                    onClick={handleCopyTailoredText}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy Full Text'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skills Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Extracted Skills */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matched & Extracted JD Skills ({result.extractedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.extractedSkills.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Skills in JD Not in Resume ({result.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.length > 0 ? (
                  result.missingSkills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Great job! All core JD skills are present in your experience.</p>
                )}
              </div>
            </div>
          </div>

          {/* Side-by-Side Bullet Comparison (Diff View) */}
          <div id="bullet-comparison-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Side-by-Side Bullet Points Comparison (Diff View)
            </h3>

            <div className="space-y-4">
              {result.bulletsComparison.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="p-3 bg-white rounded-lg border border-rose-200/80 text-xs text-slate-700">
                      <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block mb-1">
                        Original Bullet
                      </span>
                      {item.original}
                    </div>

                    {/* Tailored */}
                    <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs text-slate-900 font-medium">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">
                        Tailored Bullet (JD Mirrored)
                      </span>
                      {item.tailored}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 italic bg-slate-100 p-2 rounded-lg">
                    💡 <span className="font-semibold text-slate-700">Why changed:</span> {item.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Tailored Resume Text output */}
          <div id="full-tailored-text-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Complete Rewritten Tailored Resume</h3>
              <button
                onClick={handleCopyTailoredText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied!' : 'Copy Resume'}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result.tailoredResumeText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
