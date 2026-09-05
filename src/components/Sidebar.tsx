import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  MessageSquareCode,
  Mail,
  Settings,
  LogOut,
  PlaneTakeoff,
  BookmarkPlus,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'tracker'
  | 'learning-hub'
  | 'resume-tailor'
  | 'interview-prep'
  | 'gmail-sync'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, userDoc, signOutUser } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracker', label: 'Applications Tracker', icon: Kanban },
    { id: 'learning-hub', label: 'Learning Hub', icon: GraduationCap, hasAi: true },
    { id: 'resume-tailor', label: 'AI Resume Tailor', icon: FileText, hasAi: true },
    { id: 'interview-prep', label: 'Interview Prep & Logs', icon: MessageSquareCode },
    { id: 'gmail-sync', label: 'Gmail Auto-Track', icon: Mail },
    { id: 'settings', label: 'Settings & Bookmarklets', icon: Settings },
  ];

  return (
    <aside id="sidebar-container" className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div id="sidebar-header" className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <PlaneTakeoff className="w-5 h-5 transform -rotate-12" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              JobPilot
              <span className="text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Collaborative Job Search</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav id="sidebar-nav" className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.hasAi && (
                <span className="ml-auto flex items-center gap-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bookmarklet Quick Callout */}
      <div id="sidebar-bookmarklet-banner" className="m-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-slate-100 mb-1">
          <BookmarkPlus className="w-4 h-4 text-cyan-400" />
          <span>Browser Bookmarklets</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2">
          Save jobs & autofill Easy Apply forms directly on LinkedIn & Naukri.
        </p>
        <button
          id="sidebar-goto-bookmarklets"
          onClick={() => setActiveTab('settings')}
          className="w-full text-center text-cyan-400 hover:text-cyan-300 text-[11px] font-medium hover:underline flex items-center justify-center gap-1"
        >
          Setup Bookmarklets &rarr;
        </button>
      </div>

      {/* User Footer Profile */}
      <div id="sidebar-user-footer" className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center">
              {userDoc?.name ? userDoc.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {userDoc?.name || user?.displayName || 'Job Hunter'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {userDoc?.email || user?.email}
            </p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={signOutUser}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
