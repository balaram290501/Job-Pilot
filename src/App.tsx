import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TrackerView } from './components/TrackerView';
import { ResumeTailorView } from './components/ResumeTailorView';
import { InterviewPrepView } from './components/InterviewPrepView';
import { GmailSyncView } from './components/GmailSyncView';
import { SettingsView } from './components/SettingsView';
import { LearningHubView } from './components/LearningHubView';
import { JobSuggestionsView } from './components/JobSuggestionsView';
import { Application, InterviewLog, LearningTracker } from './types';
import { db } from './lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { PlaneTakeoff, Sparkles, Lock, ShieldCheck } from 'lucide-react';

function MainAppContent() {
  const { user, userDoc, loading, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewLogs, setInterviewLogs] = useState<InterviewLog[]>([]);
  const [trackers, setTrackers] = useState<LearningTracker[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppForTailor, setSelectedAppForTailor] = useState<Application | null>(null);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<Application | null>(null);

  // Firestore Realtime Listener for Applications
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }

    const q = query(
      collection(db, 'applications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Application[];

      // Sort by lastUpdated desc
      apps.sort(
        (a, b) =>
          new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
      );

      setApplications(apps);
    }, (err) => {
      console.error('Applications firestore error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Realtime Listener for Interview Logs
  useEffect(() => {
    if (!user) {
      setInterviewLogs([]);
      return;
    }

    const q = query(
      collection(db, 'interviewLogs'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InterviewLog[];

      logs.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setInterviewLogs(logs);
    }, (err) => {
      console.error('Interview logs firestore error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Realtime Listener for Learning Trackers
  useEffect(() => {
    if (!user) {
      setTrackers([]);
      return;
    }

    const q = query(
      collection(db, 'trackers'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LearningTracker[];

        list.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
        setTrackers(list);
      },
      (err) => {
        console.error('Trackers firestore error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Firestore Handlers
  const handleAddApplication = async (appData: Omit<Application, 'id'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, 'applications'), {
      ...appData,
      userId: user.uid,
      lastUpdated: now,
    });
  };

  const handleUpdateApplication = async (id: string, updates: Partial<Application>) => {
    if (!user) return;
    const ref = doc(db, 'applications', id);
    await updateDoc(ref, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleDeleteApplication = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Delete this application record?')) return;
    await deleteDoc(doc(db, 'applications', id));
  };

  const handleAddInterviewLog = async (logData: Omit<InterviewLog, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'interviewLogs'), {
      ...logData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const handleDeleteInterviewLog = async (logId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'interviewLogs', logId));
  };

  const handleSaveTailoredResume = async (appId: string, tailoredText: string) => {
    if (!user) return;
    await handleUpdateApplication(appId, { tailoredResumeText: tailoredText });
  };

  // Learning Trackers Firestore Handlers
  const handleAddTracker = async (trackerData: Omit<LearningTracker, 'id'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'trackers'), {
      ...trackerData,
      userId: user.uid,
      createdAt: trackerData.createdAt || now,
      updatedAt: now,
    });
    return docRef.id;
  };

  const handleUpdateTracker = async (id: string, updates: Partial<LearningTracker>) => {
    if (!user) return;
    const ref = doc(db, 'trackers', id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTracker = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'trackers', id));
  };

  // Nav actions
  const handleSelectForTailor = (app: Application) => {
    setSelectedAppForTailor(app);
    setActiveTab('resume-tailor');
  };

  const handleSelectForInterview = (app: Application) => {
    setSelectedAppForInterview(app);
    setActiveTab('interview-prep');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce mb-4">
          <PlaneTakeoff className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading JobPilot workspace...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div id="login-container" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div id="login-card" className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center space-y-6 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <PlaneTakeoff className="w-8 h-8 transform -rotate-12" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to JobPilot</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Collaborative, AI-powered job search workspace for friends. Track applications, tailor resumes, and prep interviews together.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="google-signin-btn"
              onClick={signInWithGoogle}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Isolated User Data Firestore Security Rules</span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED APP LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen">
        {activeTab === 'dashboard' && (
          <DashboardView
            applications={applications}
            interviewLogs={interviewLogs}
            trackers={trackers}
            onOpenAddModal={() => {
              setActiveTab('tracker');
              setIsAddModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerView
            applications={applications}
            onAddApplication={handleAddApplication}
            onUpdateApplication={handleUpdateApplication}
            onDeleteApplication={handleDeleteApplication}
            onSelectApplicationForTailor={handleSelectForTailor}
            onSelectApplicationForInterview={handleSelectForInterview}
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
        )}

        {activeTab === 'job-suggestions' && (
          <JobSuggestionsView
            userDoc={userDoc}
            onAddApplication={handleAddApplication}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'resume-tailor' && (
          <ResumeTailorView
            applications={applications}
            selectedApplication={selectedAppForTailor}
            onSaveTailoredResume={handleSaveTailoredResume}
          />
        )}

        {activeTab === 'interview-prep' && (
          <InterviewPrepView
            applications={applications}
            interviewLogs={interviewLogs}
            selectedApplication={selectedAppForInterview}
            onAddInterviewLog={handleAddInterviewLog}
            onDeleteInterviewLog={handleDeleteInterviewLog}
          />
        )}

        {activeTab === 'gmail-sync' && (
          <GmailSyncView
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
            onAddApplication={handleAddApplication}
          />
        )}

        {activeTab === 'learning-hub' && (
          <LearningHubView
            trackers={trackers}
            onAddTracker={handleAddTracker}
            onUpdateTracker={handleUpdateTracker}
            onDeleteTracker={handleDeleteTracker}
          />
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
