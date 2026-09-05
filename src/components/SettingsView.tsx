import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CandidateProfile, UserPreferences } from '../types';
import {
  Settings as SettingsIcon,
  BookmarkPlus,
  Key,
  RefreshCw,
  Copy,
  Check,
  FileText,
  User,
  Save,
  Info,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { userDoc, updateUserProfile, regenerateToken } = useAuth();

  const [resumeText, setResumeText] = useState(userDoc?.resumeMasterText || '');
  const [profile, setProfile] = useState<CandidateProfile>(
    userDoc?.candidateProfile || {
      phone: '+1 555-0199',
      noticePeriod: '30 Days',
      currentCtc: '150,000 USD',
      expectedCtc: '180,000 USD',
      portfolioUrl: 'https://github.com',
      linkedInUrl: 'https://linkedin.com/in/user',
      yearsOfExperience: '4 Years',
    }
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Bookmarklet scripts generated dynamically
  const [saveJobHref, setSaveJobHref] = useState('#');
  const [autofillHref, setAutofillHref] = useState('#');

  useEffect(() => {
    if (userDoc?.apiToken) {
      fetchBookmarklets(userDoc.apiToken);
    }
  }, [userDoc?.apiToken]);

  const fetchBookmarklets = async (token: string) => {
    try {
      const res = await fetch(`/api/bookmarklet/generate?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setSaveJobHref(data.saveJobBookmarklet || '#');
        setAutofillHref(data.autofillBookmarklet || '#');
      }
    } catch (err) {
      console.error('Failed to generate bookmarklets:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        resumeMasterText: resumeText,
        candidateProfile: profile,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleRegenerateToken = async () => {
    if (!window.confirm('Regenerating your token will invalidate any existing bookmarklets in your browser. Continue?')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const newToken = await regenerateToken();
      await fetchBookmarklets(newToken);
    } catch (err) {
      console.error('Failed to regenerate token:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToken = () => {
    if (!userDoc?.apiToken) return;
    navigator.clipboard.writeText(userDoc.apiToken);
    setIsTokenCopied(true);
    setTimeout(() => setIsTokenCopied(false), 2000);
  };

  return (
    <div id="settings-view" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div id="settings-header" className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
          Settings & Browser Bookmarklets
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure your personal API token, candidate profile for Easy Apply autofill, master resume, and install draggable browser bookmarklets.
        </p>
      </div>

      {/* FEATURE 5: BOOKMARKLETS SECTION */}
      <div id="bookmarklets-section" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <BookmarkPlus className="w-4 h-4" /> Feature 5 — Browser Bookmarklets
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Draggable Job Pilot Browser Shortcuts</h2>
            <p className="text-xs text-slate-300 mt-1">
              Drag these buttons to your Browser Bookmarks Bar. Embedded directly with your personal token.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700 text-xs">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Personal API Token</p>
              <p className="font-mono text-cyan-300 text-xs truncate max-w-[160px]">
                {userDoc?.apiToken || 'Generating...'}
              </p>
            </div>
            <button
              onClick={copyToken}
              title="Copy Token"
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700"
            >
              {isTokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleRegenerateToken}
              disabled={isRegenerating}
              title="Revoke & Regenerate Token"
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* DRAGGABLE BOOKMARKLET BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bookmarklet A */}
          <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-cyan-400" />
                Bookmarklet A: Save Job to JobPilot
              </h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                LinkedIn & Naukri
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When clicked on a LinkedIn/Naukri job posting page, it scrapes job details and creates a "saved" application in your JobPilot database.
            </p>

            <div className="pt-2">
              <a
                id="bookmarklet-save-job-link"
                href={saveJobHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:brightness-110 transition border border-cyan-300/40"
              >
                <BookmarkPlus className="w-4 h-4" /> 📌 Drag Me: Save Job to JobPilot
              </a>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              👉 Click & drag this button directly onto your browser's Bookmarks bar.
            </p>
          </div>

          {/* Bookmarklet B */}
          <div className="p-5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Bookmarklet B: Autofill from JobPilot
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                Easy Apply Forms
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scans open Easy Apply forms for fields (phone, notice period, expected CTC, LinkedIn, portfolio) and autofills them native value setter. Never submits.
            </p>

            <div className="pt-2">
              <a
                id="bookmarklet-autofill-link"
                href={autofillHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:brightness-110 transition border border-emerald-300/40"
              >
                <Zap className="w-4 h-4" /> ⚡ Drag Me: Autofill Easy Apply
              </a>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              👉 Click & drag this button directly onto your browser's Bookmarks bar.
            </p>
          </div>
        </div>
      </div>

      {/* CANDIDATE PROFILE & MASTER RESUME FORM */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Candidate Profile Fields */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Candidate Profile Fields (Used for Bookmarklet Autofill)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These values are pulled by Bookmarklet B when filling application forms on external job sites.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notice Period / Availability</label>
              <input
                type="text"
                placeholder="e.g. Immediate, 15 Days, 30 Days"
                value={profile.noticePeriod}
                onChange={(e) => setProfile({ ...profile, noticePeriod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current CTC / Salary</label>
              <input
                type="text"
                placeholder="e.g. $140,000 / 18 LPA"
                value={profile.currentCtc}
                onChange={(e) => setProfile({ ...profile, currentCtc: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected CTC / Target Salary</label>
              <input
                type="text"
                placeholder="e.g. $180,000 / 24 LPA"
                value={profile.expectedCtc}
                onChange={(e) => setProfile({ ...profile, expectedCtc: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Portfolio / Website URL</label>
              <input
                type="url"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={profile.linkedInUrl}
                onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Years of Experience</label>
              <input
                type="text"
                placeholder="e.g. 5 Years"
                value={profile.yearsOfExperience}
                onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Master Resume Text */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Master Resume Base Text
          </h2>
          <p className="text-xs text-slate-500">
            This base resume text will automatically load whenever you open the AI Resume Tailor tool.
          </p>

          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {isSaved && <span className="text-xs font-bold text-emerald-600">✅ Profile saved successfully!</span>}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Candidate Profile
          </button>
        </div>
      </form>
    </div>
  );
};
