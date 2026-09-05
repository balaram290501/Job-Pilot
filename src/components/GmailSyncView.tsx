import React, { useState } from 'react';
import { Application, ClassifiedEmail } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Inbox,
  Plus,
  ShieldCheck,
  Key,
} from 'lucide-react';

interface GmailSyncViewProps {
  applications: Application[];
  onUpdateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  onAddApplication: (app: Omit<Application, 'id'>) => Promise<void>;
}

// Sample recent emails simulation for fallback or demonstration
const SAMPLE_MOCK_EMAILS = [
  {
    id: 'msg_001',
    subject: 'Interview Invitation: Senior Frontend Engineer at Stripe',
    from: 'recruiting@stripe.com',
    date: new Date().toLocaleDateString(),
    snippet: 'Hi! We reviewed your profile for Senior Frontend Engineer and would love to schedule a 45 min technical call with our engineering team.',
  },
  {
    id: 'msg_002',
    subject: 'Google Online Assessment Invitation',
    from: 'careers@google.com',
    date: new Date().toLocaleDateString(),
    snippet: 'Thank you for applying for Software Engineer. Please complete your 90-minute online coding challenge within 7 days.',
  },
  {
    id: 'msg_003',
    subject: 'Thank you for your application - Netflix',
    from: 'no-reply@netflix.com',
    date: new Date().toLocaleDateString(),
    snippet: 'We appreciate your interest in Netflix. After careful review, we have decided to move forward with other candidates whose qualifications more closely align.',
  },
  {
    id: 'msg_004',
    subject: 'Uber Job Application Received',
    from: 'jobs@uber.com',
    date: new Date().toLocaleDateString(),
    snippet: 'We have received your application for Full Stack Developer. Our recruiting team will review your resume shortly.',
  },
];

export const GmailSyncView: React.FC<GmailSyncViewProps> = ({
  applications,
  onUpdateApplication,
  onAddApplication,
}) => {
  const { googleAccessToken, signInWithGoogle } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [classifiedEmails, setClassifiedEmails] = useState<ClassifiedEmail[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter matched vs unmatched
  const matchedEmails = classifiedEmails.filter((e) => e.matchedApplicationId);
  const unmatchedEmails = classifiedEmails.filter((e) => !e.matchedApplicationId && e.category !== 'unrelated');

  const fetchLiveGmailMessages = async (token: string) => {
    try {
      // Query recent job-related messages
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=subject:(interview OR application OR offer OR status OR assessment OR reject OR invitation OR "thank you" OR job)',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!listRes.ok) {
        throw new Error(`Gmail API returned status ${listRes.status}`);
      }

      const listData = await listRes.json();
      const messages = listData.messages || [];

      if (messages.length === 0) {
        return [];
      }

      // Fetch message details in parallel
      const emailDetails = await Promise.all(
        messages.slice(0, 10).map(async (msg: { id: string }) => {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
          const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
          const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value || new Date().toLocaleDateString();

          return {
            id: detail.id,
            subject: subjectHeader,
            from: fromHeader,
            date: new Date(dateHeader).toLocaleDateString(),
            snippet: detail.snippet || '',
          };
        })
      );

      return emailDetails.filter(Boolean);
    } catch (err) {
      console.warn('Live Gmail fetch warning:', err);
      return null;
    }
  };

  const handleScanEmails = async () => {
    setIsScanning(true);
    setStatusMessage(null);

    let emailsToScan = SAMPLE_MOCK_EMAILS;
    let isLiveScan = false;

    try {
      let currentToken = googleAccessToken;

      // If no token cached yet, attempt to prompt Google sign-in to retrieve Gmail scope
      if (!currentToken) {
        currentToken = await signInWithGoogle();
      }

      if (currentToken) {
        const liveEmails = await fetchLiveGmailMessages(currentToken);
        if (liveEmails && liveEmails.length > 0) {
          emailsToScan = liveEmails;
          isLiveScan = true;
        }
      }

      const res = await fetch('/api/scan-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: emailsToScan,
          existingApps: applications.map((a) => ({
            id: a.id,
            company: a.company,
            role: a.role,
            status: a.status,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to scan emails');
      }

      const data = await res.json();
      setClassifiedEmails(data.classified || []);
      setStatusMessage(
        isLiveScan
          ? `Successfully scanned ${emailsToScan.length} live Gmail messages & classified with Gemini AI!`
          : `Successfully scanned sample inbox messages & classified with Gemini AI!`
      );
    } catch (err: any) {
      console.error('Email scan error:', err);
      setStatusMessage('Error scanning emails. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyAutoUpdate = async (email: ClassifiedEmail) => {
    if (!email.matchedApplicationId || !email.suggestedStatus) return;

    const existingApp = applications.find((a) => a.id === email.matchedApplicationId);
    if (!existingApp) return;

    const newNote = existingApp.notes
      ? `${existingApp.notes}\n\n[Auto Gmail Update ${email.date}]: ${email.subject} - ${email.snippet}`
      : `[Auto Gmail Update ${email.date}]: ${email.subject} - ${email.snippet}`;

    try {
      await onUpdateApplication(email.matchedApplicationId, {
        status: email.suggestedStatus,
        notes: newNote,
        lastUpdated: new Date().toISOString(),
      });

      // Remove from list or mark processed
      setClassifiedEmails((prev) => prev.filter((item) => item.id !== email.id));
    } catch (err) {
      console.error('Failed to auto update application:', err);
    }
  };

  const handleCreateFromUnmatched = async (email: ClassifiedEmail) => {
    try {
      await onAddApplication({
        userId: '',
        company: email.companyMatched || 'Extracted Company',
        role: email.roleMatched || 'Job Opportunity',
        jobDescriptionText: `Extracted from Email: "${email.subject}"\n\nSnippet:\n${email.snippet}`,
        status: email.suggestedStatus || 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        source: 'gmail_auto',
        tailoredResumeText: '',
        notes: `Original Email From: ${email.from}\nDate: ${email.date}`,
        lastUpdated: new Date().toISOString(),
      });

      setClassifiedEmails((prev) => prev.filter((item) => item.id !== email.id));
    } catch (err) {
      console.error('Failed to create application from unmatched email:', err);
    }
  };

  return (
    <div id="gmail-sync-view" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* View Header */}
      <div id="gmail-header" className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6 text-red-600" />
          Gmail Auto-Tracker
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Scans job-search emails (read-only) and uses Gemini AI to auto-update statuses or surface unmatched updates.
        </p>
      </div>

      {/* Connection & Scan Card */}
      <div id="gmail-scan-banner" className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Strictly Read-Only Gmail Scope & Privacy Guaranteed
          </div>
          <h2 className="text-lg font-bold">Automatic Job Application Email Categorization</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Gemini reads confirmation emails, OA links, interview invites, and rejection notices. It fuzzy-matches companies against your JobPilot tracker.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!googleAccessToken && (
            <button
              id="connect-gmail-oauth-btn"
              onClick={signInWithGoogle}
              className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition shadow flex items-center gap-2"
            >
              <Key className="w-4 h-4 text-amber-500" /> Connect Gmail Scope
            </button>
          )}

          <button
            id="scan-gmail-now-btn"
            onClick={handleScanEmails}
            disabled={isScanning}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Scanning & Classifying with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" /> Scan Inbox Now
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" /> {statusMessage}
        </div>
      )}

      {/* CLASSIFIED MATCHED EMAILS */}
      {matchedEmails.length > 0 && (
        <div id="matched-emails-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Matched Email Status Updates ({matchedEmails.length})
          </h2>

          <div className="space-y-3">
            {matchedEmails.map((email) => {
              const matchedApp = applications.find((a) => a.id === email.matchedApplicationId);
              return (
                <div key={email.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{email.subject}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {email.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{email.snippet}</p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-1">
                      Matched to: {matchedApp ? `${matchedApp.company} (${matchedApp.role})` : 'Existing Application'} &bull; Suggested New Status:{' '}
                      <span className="uppercase text-emerald-700">{email.suggestedStatus}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleApplyAutoUpdate(email)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                  >
                    Confirm & Update Tracker
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UNMATCHED EMAILS INBOX */}
      <div id="unmatched-emails-section" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-500" />
            Unmatched Application Emails ({unmatchedEmails.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Emails that didn't automatically match an existing record
          </span>
        </div>

        {unmatchedEmails.length > 0 ? (
          <div className="space-y-3">
            {unmatchedEmails.map((email) => (
              <div key={email.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{email.subject}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      {email.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{email.snippet}</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Extracted: <span className="font-bold">{email.companyMatched || 'Unknown'}</span> -{' '}
                    <span>{email.roleMatched || 'Position'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCreateFromUnmatched(email)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            {classifiedEmails.length > 0
              ? 'All scanned emails matched existing tracker applications!'
              : 'Click "Scan Inbox Now" above to analyze recent job-related emails.'}
          </div>
        )}
      </div>
    </div>
  );
};
