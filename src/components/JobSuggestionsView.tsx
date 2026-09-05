import React, { useState } from 'react';
import { JobSuggestion, UserDoc, Application } from '../types';
import { ActiveTab } from './Sidebar';
import {
  Briefcase,
  Sparkles,
  MapPin,
  Building2,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  BookmarkCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface JobSuggestionsViewProps {
  userDoc: UserDoc | null;
  onAddApplication: (appData: Omit<Application, 'id'>) => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;
}

export const JobSuggestionsView: React.FC<JobSuggestionsViewProps> = ({
  userDoc,
  onAddApplication,
  setActiveTab,
}) => {
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const hasResume = Boolean(userDoc?.resumeMasterText?.trim());
  const targetRoles = userDoc?.preferences?.targetRoles || [];
  const locations = userDoc?.preferences?.locations || [];
  const seniority = userDoc?.preferences?.seniority || '';

  const handleGenerate = async () => {
    if (!hasResume) {
      setError('Please set up your Master Resume in Settings first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeMasterText: userDoc?.resumeMasterText || '',
          targetRoles,
          locations,
          seniority,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate suggestions (${response.status})`);
      }

      const data = await response.json();
      const list: JobSuggestion[] = Array.isArray(data)
        ? data
        : Array.isArray(data.suggestions)
        ? data.suggestions
        : [];

      setSuggestions(list);
      if (list.length === 0) {
        setError('No suggestions could be generated. Please try again.');
      }
    } catch (err: any) {
      console.error('Job suggestions error:', err);
      setError(err.message || 'An error occurred while generating suggestions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToTracker = async (suggestion: JobSuggestion) => {
    const key = `${suggestion.company}-${suggestion.title}`;
    if (savedKeys[key] || savingKey === key) return;

    setSavingKey(key);
    try {
      const now = new Date().toISOString();
      await onAddApplication({
        company: suggestion.company,
        role: suggestion.title,
        jobDescriptionText: `${suggestion.whyItFits}\n\nRequired Skills: ${suggestion.requiredSkills.join(', ')}`,
        status: 'saved',
        appliedDate: now.split('T')[0],
        source: 'Job Suggestions',
        tailoredResumeText: '',
        notes: `AI Match Fit: ${suggestion.whyItFits}`,
        lastUpdated: now,
        location: suggestion.location,
      });

      setSavedKeys((prev) => ({ ...prev, [key]: true }));
    } catch (err: any) {
      console.error('Failed to save to tracker:', err);
      alert('Could not save application to tracker. Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div id="job-suggestions-view" className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div
        id="job-suggestions-header"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  AI Job Suggestions
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Curated job opportunities personalized to your master resume, target roles, and seniority level.
              </p>
            </div>
          </div>

          {/* Active preferences pill summary */}
          {(targetRoles.length > 0 || locations.length > 0 || seniority) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" /> Target Criteria:
              </span>
              {seniority && (
                <span className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] px-2 py-0.5 rounded-md">
                  {seniority} Level
                </span>
              )}
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] px-2 py-0.5 rounded-md"
                >
                  {role}
                </span>
              ))}
              {locations.map((loc) => (
                <span
                  key={loc}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded-md"
                >
                  {loc}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="generate-suggestions-btn"
            onClick={handleGenerate}
            disabled={isLoading || !hasResume}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-md ${
              isLoading || !hasResume
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                <span>Generating Suggestions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Generate Suggestions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          id="suggestions-error-alert"
          className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State: No Master Resume Configured */}
      {!hasResume && (
        <div
          id="no-resume-empty-state"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center text-white space-y-4 max-w-xl mx-auto shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Master Resume Required</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              To curate high-relevance job suggestions tailored to your career trajectory, please paste your
              Master Resume in Settings.
            </p>
          </div>
          <div>
            <button
              id="goto-settings-btn"
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <span>Go to Settings & Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div id="suggestions-loading-state" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-28 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-800/60 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-4 bg-slate-800 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-800/80 rounded w-full" />
                  <div className="h-3.5 bg-slate-800/80 rounded w-4/5" />
                </div>
                <div className="flex gap-1.5 pt-2">
                  <div className="h-5 w-16 bg-slate-800 rounded-md" />
                  <div className="h-5 w-20 bg-slate-800 rounded-md" />
                  <div className="h-5 w-14 bg-slate-800 rounded-md" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <div className="h-8 bg-slate-800 rounded-lg flex-1" />
                  <div className="h-8 bg-slate-800 rounded-lg flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State: Resume is set, but no suggestions generated yet */}
      {hasResume && !isLoading && suggestions.length === 0 && (
        <div
          id="ready-to-generate-state"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-10 sm:p-14 text-center text-white space-y-5 max-w-xl mx-auto shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">Ready to Discover Tailored Roles?</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Click the button below to generate 8–10 tailored job opportunities matched against your resume and
              target preferences.
            </p>
          </div>
          <button
            id="start-generating-btn"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Generate Job Suggestions</span>
          </button>
        </div>
      )}

      {/* Suggestions Cards Grid */}
      {!isLoading && suggestions.length > 0 && (
        <div id="job-suggestions-container" className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Showing {suggestions.length} Curated Suggestions
            </span>
            <span>Click "Apply" to search open listings or "Save to Tracker"</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {suggestions.map((suggestion, index) => {
              const cardKey = `${suggestion.company}-${suggestion.title}`;
              const isSaved = Boolean(savedKeys[cardKey]);
              const isSaving = savingKey === cardKey;

              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                suggestion.searchQuery || `${suggestion.title} ${suggestion.company} jobs ${suggestion.location}`
              )}`;

              return (
                <div
                  key={`${cardKey}-${index}`}
                  id={`job-suggestion-card-${index}`}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-lg shadow-sm group"
                >
                  {/* Top: Title, Company, Location */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug truncate">
                          {suggestion.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {suggestion.company}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {suggestion.location}
                          </span>
                        </div>
                      </div>

                      {/* Match Badge */}
                      <span className="shrink-0 text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> High Match
                      </span>
                    </div>

                    {/* Why It Fits (1-2 sentences) */}
                    <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-indigo-300 mr-1">Why it fits:</span>
                      {suggestion.whyItFits}
                    </div>

                    {/* Required Skills Badges */}
                    {suggestion.requiredSkills && suggestion.requiredSkills.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-medium text-slate-400 mr-1">Skills:</span>
                        {suggestion.requiredSkills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Save to Tracker & Apply */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
                    <button
                      id={`save-suggestion-${index}`}
                      onClick={() => handleSaveToTracker(suggestion)}
                      disabled={isSaved || isSaving}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isSaved
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-default'
                          : isSaving
                          ? 'bg-slate-800 text-slate-400 cursor-wait border border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-[0.98]'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved to Tracker</span>
                        </>
                      ) : isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-slate-300" />
                          <span>Save to Tracker</span>
                        </>
                      )}
                    </button>

                    <a
                      id={`apply-suggestion-${index}`}
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
