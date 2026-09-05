import React, { useState, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
  Target,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Trash2,
  X,
  Loader2,
  ArrowRight,
  BookOpen,
  Code2,
  Briefcase,
  RotateCcw,
  AlertCircle,
  Layers,
  Check,
} from 'lucide-react';
import {
  LearningTracker,
  TrackerTopic,
  TrackerType,
  GenerateTrackerResponse,
} from '../types';

interface LearningHubViewProps {
  trackers: LearningTracker[];
  onAddTracker: (tracker: Omit<LearningTracker, 'id'>) => Promise<string | void>;
  onUpdateTracker: (id: string, updates: Partial<LearningTracker>) => Promise<void>;
  onDeleteTracker: (id: string) => Promise<void>;
}

// Preset color choices
const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { label: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { label: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { label: 'Purple', value: '#a855f7', bg: 'bg-purple-500', ring: 'ring-purple-500' },
];

// Quick templates for empty state & AI modal
const QUICK_TEMPLATES = [
  {
    title: 'Striver A2Z DSA Sheet',
    prompt: 'Striver A2Z DSA sheet with Arrays, Binary Search, Trees, Graphs, DP',
    days: 60,
    color: '#6366f1',
  },
  {
    title: 'NeetCode 150 Coding Interview',
    prompt: 'NeetCode 150 LeetCode patterns for FAANG technical interviews',
    days: 45,
    color: '#10b981',
  },
  {
    title: 'System Design for Senior Engineers',
    prompt: 'System Design interview mastery: Scalability, Caching, Sharding, Kafka, Microservices',
    days: 30,
    color: '#a855f7',
  },
  {
    title: 'React 19 & Next.js Full-Stack',
    prompt: 'Fullstack React 19, Server Components, Next.js App Router, Auth & Performance',
    days: 30,
    color: '#06b6d4',
  },
  {
    title: 'SQL & Database Internals',
    prompt: 'Database indexing, B-Trees, Query Optimization, Transactions & PostgreSQL Internals',
    days: 21,
    color: '#f59e0b',
  },
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export const LearningHubView: React.FC<LearningHubViewProps> = ({
  trackers,
  onAddTracker,
  onUpdateTracker,
  onDeleteTracker,
}) => {
  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | TrackerType>('all');

  // Overall statistics calculations
  const stats = useMemo(() => {
    const totalTrackers = trackers.length;
    let totalTopics = 0;
    let completedTopics = 0;
    let maxStreak = 0;

    trackers.forEach((t) => {
      const topicsCount = t.topics?.length || 0;
      const completed = t.topics?.filter((top) => top.completed).length || 0;
      totalTopics += topicsCount;
      completedTopics += completed;
      if ((t.streak || 0) > maxStreak) {
        maxStreak = t.streak || 0;
      }
    });

    const progressPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      totalTrackers,
      totalTopics,
      completedTopics,
      progressPercentage,
      maxStreak,
    };
  }, [trackers]);

  // Filtered trackers
  const filteredTrackers = useMemo(() => {
    return trackers.filter((t) => {
      if (selectedTypeFilter !== 'all' && t.type !== selectedTypeFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchTopics = t.topics?.some((top) =>
          top.title.toLowerCase().includes(q) || (top.pattern || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchTopics) return false;
      }
      return true;
    });
  }, [trackers, selectedTypeFilter, searchTerm]);

  // AI Modal Pre-fill trigger
  const handleOpenAiWithTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setIsAiModalOpen(true);
    // Let the modal pick up this initial value
    setAiModalInitialPrompt(template.prompt);
    setAiModalInitialDays(template.days);
    setAiModalInitialColor(template.color);
  };

  const [aiModalInitialPrompt, setAiModalInitialPrompt] = useState('Striver A2Z DSA sheet');
  const [aiModalInitialDays, setAiModalInitialDays] = useState(45);
  const [aiModalInitialColor, setAiModalInitialColor] = useState('#6366f1');

  return (
    <div id="learning-hub-view" className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Learning Hub</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI Powered
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Curate DSA sheets, engineering roadmaps, and course goals with AI-driven milestones.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="open-manual-create-btn"
            onClick={() => setIsManualModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Manual</span>
          </button>

          <button
            id="open-ai-generate-btn"
            onClick={() => {
              setAiModalInitialPrompt('NeetCode 150 Coding Interview');
              setAiModalInitialDays(45);
              setAiModalInitialColor('#6366f1');
              setIsAiModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Generate</span>
          </button>
        </div>
      </div>

      {/* Overall Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Tracks</p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{stats.totalTrackers}</h3>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Topics Done</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-2xl font-bold text-white">{stats.completedTopics}</h3>
              <span className="text-xs text-slate-500">/ {stats.totalTopics}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Progress</p>
              <span className="text-xs font-semibold text-purple-300">{stats.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Streaks</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-2xl font-bold text-white">{stats.maxStreak}</h3>
              <span className="text-xs text-slate-500">days max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {trackers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'dsa', 'course', 'skills', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedTypeFilter === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {type === 'all'
                  ? 'All Tracks'
                  : type === 'dsa'
                  ? 'DSA'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics, patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {trackers.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Build Your Targeted Learning Roadmap</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
            Stay accountable with daily goals, streak counters, and structured problem lists. Generate standard interview sheets like NeetCode 150 or build custom technology roadmaps in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={() => {
                setAiModalInitialPrompt('NeetCode 150 Coding Interview');
                setAiModalInitialDays(45);
                setAiModalInitialColor('#6366f1');
                setIsAiModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manually</span>
            </button>
          </div>

          <div className="border-t border-slate-800/80 pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Popular Starter Roadmaps
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.title}
                  onClick={() => handleOpenAiWithTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{tmpl.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Trackers Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredTrackers.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              tracker={tracker}
              onUpdateTracker={onUpdateTracker}
              onDeleteTracker={onDeleteTracker}
            />
          ))}
        </div>
      )}

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <AIGenerateModal
          initialPrompt={aiModalInitialPrompt}
          initialDays={aiModalInitialDays}
          initialColor={aiModalInitialColor}
          onClose={() => setIsAiModalOpen(false)}
          onConfirm={async (trackerData) => {
            await onAddTracker(trackerData);
            setIsAiModalOpen(false);
          }}
        />
      )}

      {/* Manual Create Modal */}
      {isManualModalOpen && (
        <ManualCreateModal
          onClose={() => setIsManualModalOpen(false)}
          onConfirm={async (trackerData) => {
            await onAddTracker(trackerData);
            setIsManualModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// TrackerCard Component
// ==========================================
interface TrackerCardProps {
  tracker: LearningTracker;
  onUpdateTracker: (id: string, updates: Partial<LearningTracker>) => Promise<void>;
  onDeleteTracker: (id: string) => Promise<void>;
}

const TrackerCard: React.FC<TrackerCardProps> = ({
  tracker,
  onUpdateTracker,
  onDeleteTracker,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeNotesTopicId, setActiveNotesTopicId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // New topic state
  const [newTitle, setNewTitle] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newLink, setNewLink] = useState('');

  // Statistics for this tracker
  const totalTopics = tracker.topics?.length || 0;
  const completedTopics = tracker.topics?.filter((t) => t.completed).length || 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Days left calculation
  const daysLeftText = useMemo(() => {
    if (!tracker.targetDate) return 'Self-paced';
    const target = new Date(tracker.targetDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} days left`;
    if (diffDays === 0) return 'Due today';
    return `${Math.abs(diffDays)}d overdue`;
  }, [tracker.targetDate]);

  // Toggle topic completion with streak management
  const handleToggleTopic = async (topicId: string, currentCompleted: boolean) => {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    const willBeCompleted = !currentCompleted;

    let newStreak = tracker.streak || 0;
    let newLastStudied = tracker.lastStudiedDate;

    if (willBeCompleted) {
      if (tracker.lastStudiedDate === today) {
        // Already logged today
      } else if (tracker.lastStudiedDate === yesterday) {
        newStreak += 1;
        newLastStudied = today;
      } else {
        newStreak = 1;
        newLastStudied = today;
      }
    }

    const updatedTopics = (tracker.topics || []).map((t) =>
      t.id === topicId ? { ...t, completed: willBeCompleted } : t
    );

    await onUpdateTracker(tracker.id, {
      topics: updatedTopics,
      streak: newStreak,
      lastStudiedDate: newLastStudied,
    });
  };

  // Save notes for a topic
  const handleSaveNotes = async (topicId: string) => {
    const updatedTopics = (tracker.topics || []).map((t) =>
      t.id === topicId ? { ...t, notes: tempNotes } : t
    );
    await onUpdateTracker(tracker.id, { topics: updatedTopics });
    setActiveNotesTopicId(null);
  };

  // Delete a topic
  const handleDeleteTopic = async (topicId: string) => {
    const updatedTopics = (tracker.topics || []).filter((t) => t.id !== topicId);
    await onUpdateTracker(tracker.id, { topics: updatedTopics });
  };

  // Add new topic manually
  const handleAddNewTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const topicItem: TrackerTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newTitle.trim(),
      pattern: newPattern.trim() || 'General Topics',
      difficulty: newDifficulty,
      link: newLink.trim() || undefined,
      completed: false,
      notes: '',
    };

    const updatedTopics = [...(tracker.topics || []), topicItem];
    await onUpdateTracker(tracker.id, { topics: updatedTopics });

    setNewTitle('');
    setNewPattern('');
    setNewLink('');
    setIsAddingTopic(false);
  };

  // Reset tracker progress
  const handleResetProgress = async () => {
    if (!window.confirm('Reset all progress and streak for this roadmap?')) return;
    const updatedTopics = (tracker.topics || []).map((t) => ({ ...t, completed: false }));
    await onUpdateTracker(tracker.id, {
      topics: updatedTopics,
      streak: 0,
      lastStudiedDate: '',
    });
  };

  // Filter topics
  const filteredTopics = useMemo(() => {
    return (tracker.topics || []).filter((t) => {
      if (statusFilter === 'completed' && !t.completed) return false;
      if (statusFilter === 'pending' && t.completed) return false;
      if (topicSearch.trim()) {
        const q = topicSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchPattern = (t.pattern || '').toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPattern && !matchNotes) return false;
      }
      return true;
    });
  }, [tracker.topics, statusFilter, topicSearch]);

  // Group topics by pattern
  const groupedTopics = useMemo(() => {
    const groups: Record<string, TrackerTopic[]> = {};
    filteredTopics.forEach((topic) => {
      const p = topic.pattern || 'Core Curriculum';
      if (!groups[p]) groups[p] = [];
      groups[p].push(topic);
    });
    return groups;
  }, [filteredTopics]);

  // Render type pill
  const renderTypeBadge = (type: TrackerType) => {
    switch (type) {
      case 'dsa':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Code2 className="w-3 h-3" /> DSA
          </span>
        );
      case 'course':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <BookOpen className="w-3 h-3" /> Course
          </span>
        );
      case 'skills':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Briefcase className="w-3 h-3" /> Skills
          </span>
        );
      case 'custom':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3 h-3" /> Custom
          </span>
        );
    }
  };

  const cardColor = tracker.color || '#6366f1';

  return (
    <div
      id={`tracker-card-${tracker.id}`}
      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700/80 transition-all flex flex-col"
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: cardColor }} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {renderTypeBadge(tracker.type)}
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {daysLeftText}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight truncate" title={tracker.name}>
                {tracker.name}
              </h3>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleResetProgress}
                title="Reset progress"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteTracker(tracker.id)}
                title="Delete tracker"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          {tracker.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
              {tracker.description}
            </p>
          )}

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">
                Progress: <strong className="text-white">{completedTopics}</strong> / {totalTopics} topics
              </span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: cardColor }}
              />
            </div>
          </div>

          {/* Metrics pills row */}
          <div className="grid grid-cols-3 gap-2.5 py-2.5 border-y border-slate-800/80 mb-4 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Streak
              </span>
              <span className="text-sm font-bold text-white mt-0.5">
                {tracker.streak || 0} <span className="text-[11px] font-normal text-slate-400">days</span>
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-slate-800/60">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-400" /> Daily Goal
              </span>
              <span className="text-sm font-bold text-white mt-0.5">
                {tracker.dailyGoal || 2} <span className="text-[11px] font-normal text-slate-400">/ day</span>
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> Target
              </span>
              <span className="text-xs font-bold text-slate-200 mt-1 truncate max-w-full">
                {tracker.targetDate ? new Date(tracker.targetDate).toLocaleDateString() : 'Continuous'}
              </span>
            </div>
          </div>
        </div>

        {/* Expand / Collapse Topics Toggle */}
        <div className="pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>
                {isExpanded ? 'Hide Topics Syllabus' : `View Topics Syllabus (${totalTopics})`}
              </span>
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Syllabus View */}
      {isExpanded && (
        <div className="bg-slate-950/60 border-t border-slate-800 p-5 space-y-4">
          {/* Sub-toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter topics..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                {(['all', 'pending', 'completed'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStatusFilter(mode)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      statusFilter === mode
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddingTopic(!isAddingTopic)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </button>
            </div>
          </div>

          {/* Inline Add Topic Form */}
          {isAddingTopic && (
            <form
              onSubmit={handleAddNewTopic}
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Custom Topic
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Topic or Problem Title (e.g., Trapping Rain Water)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Pattern / Module (e.g., Two Pointers, Dynamic Programming)"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="url"
                  placeholder="Resource / LeetCode URL (Optional)"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTopic(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Save Topic
                </button>
              </div>
            </form>
          )}

          {/* Grouped Topics List */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {Object.keys(groupedTopics).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No topics match your current filter.
              </p>
            ) : (
              (Object.entries(groupedTopics) as [string, TrackerTopic[]][]).map(([patternName, patternTopics]) => {
                const groupCompleted = patternTopics.filter((t) => t.completed).length;

                return (
                  <div key={patternName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                      <span>{patternName}</span>
                      <span className="text-slate-500">
                        {groupCompleted} / {patternTopics.length}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {patternTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className={`flex flex-col p-2.5 rounded-xl border transition-all ${
                            topic.completed
                              ? 'bg-slate-900/40 border-slate-800/50 opacity-80'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={() => handleToggleTopic(topic.id, topic.completed)}
                                className="shrink-0 text-slate-400 hover:text-indigo-400 transition-colors"
                              >
                                {topic.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-500" />
                                )}
                              </button>

                              <span
                                className={`text-xs font-medium truncate ${
                                  topic.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}
                                title={topic.title}
                              >
                                {topic.title}
                              </span>
                            </div>

                            {/* Tags & Action Icons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {topic.difficulty && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                    topic.difficulty === 'easy'
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : topic.difficulty === 'hard'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {topic.difficulty}
                                </span>
                              )}

                              {topic.link && (
                                <a
                                  href={topic.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open resource link"
                                  className="text-indigo-400 hover:text-indigo-300 p-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                onClick={() => {
                                  if (activeNotesTopicId === topic.id) {
                                    setActiveNotesTopicId(null);
                                  } else {
                                    setActiveNotesTopicId(topic.id);
                                    setTempNotes(topic.notes || '');
                                  }
                                }}
                                title="Add/view solution notes"
                                className={`p-1 rounded transition-colors ${
                                  topic.notes
                                    ? 'text-indigo-400 hover:text-indigo-300'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteTopic(topic.id)}
                                title="Remove topic"
                                className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Notes Drawer */}
                          {activeNotesTopicId === topic.id && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-400">
                                  Notes & Solution Keypoints
                                </span>
                                <span className="text-[10px] text-slate-500">Markdown supported</span>
                              </div>
                              <textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="Write key patterns, edge cases, time/space complexity takeaways..."
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setActiveNotesTopicId(null)}
                                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveNotes(topic.id)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                                >
                                  Save Notes
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// AI Generate Modal Component
// ==========================================
interface AIGenerateModalProps {
  initialPrompt: string;
  initialDays: number;
  initialColor: string;
  onClose: () => void;
  onConfirm: (trackerData: Omit<LearningTracker, 'id'>) => Promise<void>;
}

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  initialPrompt,
  initialDays,
  initialColor,
  onClose,
  onConfirm,
}) => {
  const [userPrompt, setUserPrompt] = useState(initialPrompt);
  const [targetDays, setTargetDays] = useState(initialDays);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<GenerateTrackerResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: userPrompt.trim(),
          targetDays: Number(targetDays) || 30,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate curriculum with Gemini.');
      }

      const data: GenerateTrackerResponse = await res.json();
      setPreviewResult(data);
    } catch (err: any) {
      console.error('Curriculum generation failed:', err);
      setErrorMessage(err.message || 'Error communicating with AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!previewResult) return;

    const now = new Date();
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + Number(targetDays || 30));

    const topics: TrackerTopic[] = previewResult.topics.map((t, idx) => ({
      id: `topic_${Date.now()}_${idx}`,
      title: t.title,
      pattern: t.pattern || 'Core Pattern',
      difficulty: t.difficulty || 'medium',
      link: t.link || undefined,
      completed: false,
      notes: '',
    }));

    const trackerData: Omit<LearningTracker, 'id'> = {
      userId: '',
      name: previewResult.name || userPrompt,
      type: previewResult.type || 'dsa',
      description: previewResult.description || '',
      dailyGoal: previewResult.suggestedDailyGoal || 2,
      targetDate: targetDateObj.toISOString().split('T')[0],
      streak: 0,
      lastStudiedDate: '',
      topics,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      color: selectedColor,
    };

    await onConfirm(trackerData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Learning Roadmap Generator</h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini — transforms goals into actionable syllabi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!previewResult ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  What do you want to master?
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g., Striver A2Z DSA Sheet, NeetCode 150 LeetCode patterns, Senior System Design Roadmap, React 19 Full-Stack..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Ideas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => {
                        setUserPrompt(tmpl.prompt);
                        setTargetDays(tmpl.days);
                        setSelectedColor(tmpl.color);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Days to Finish
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={7}
                      max={365}
                      value={targetDays}
                      onChange={(e) => setTargetDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Color Theme
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-7 h-7 rounded-full ${color.bg} transition-transform ${
                          selectedColor === color.value
                            ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isGenerating || !userPrompt.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini is architecting your roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Learning Syllabus</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Generated Preview */
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {previewResult.type.toUpperCase()} Track
                  </span>
                  <span className="text-xs text-slate-400">
                    Suggested Pace: <strong>{previewResult.suggestedDailyGoal} topics/day</strong>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{previewResult.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{previewResult.description}</p>
                <div className="text-xs text-emerald-400 font-semibold pt-1">
                  Generated {previewResult.topics.length} structured topics across logical patterns.
                </div>
              </div>

              {/* Topics Preview List */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Preview Syllabus Topics:
                </span>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-xl p-2 bg-slate-950/60">
                  {previewResult.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800/60"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-500 font-mono text-[10px] w-5">
                          {idx + 1}.
                        </span>
                        <span className="text-slate-200 font-medium truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.pattern && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {t.pattern}
                          </span>
                        )}
                        {t.difficulty && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              t.difficulty === 'easy'
                                ? 'text-emerald-300'
                                : t.difficulty === 'hard'
                                ? 'text-rose-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {t.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Regenerate / Edit Prompt
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Roadmap & Start Tracking</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Manual Create Modal Component
// ==========================================
interface ManualCreateModalProps {
  onClose: () => void;
  onConfirm: (trackerData: Omit<LearningTracker, 'id'>) => Promise<void>;
}

const ManualCreateModal: React.FC<ManualCreateModalProps> = ({ onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TrackerType>('dsa');
  const [description, setDescription] = useState('');
  const [dailyGoal, setDailyGoal] = useState(2);
  const [targetDays, setTargetDays] = useState(30);
  const [color, setColor] = useState('#6366f1');
  const [rawTopics, setRawTopics] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date();
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + Number(targetDays || 30));

    // Parse topics from textarea
    const lines = rawTopics
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const topics: TrackerTopic[] =
      lines.length > 0
        ? lines.map((line, idx) => {
            let pattern = 'General Topics';
            let title = line;
            const match = line.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              pattern = match[1];
              title = match[2];
            }
            return {
              id: `topic_${Date.now()}_${idx}`,
              title,
              pattern,
              difficulty: 'medium',
              completed: false,
              notes: '',
            };
          })
        : [
            {
              id: `topic_${Date.now()}_0`,
              title: 'Getting Started with ' + name,
              pattern: 'Foundation',
              difficulty: 'easy',
              completed: false,
              notes: '',
            },
          ];

    const trackerData: Omit<LearningTracker, 'id'> = {
      userId: '',
      name: name.trim(),
      type,
      description: description.trim(),
      dailyGoal: Number(dailyGoal) || 2,
      targetDate: targetDateObj.toISOString().split('T')[0],
      streak: 0,
      lastStudiedDate: '',
      topics,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      color,
    };

    await onConfirm(trackerData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Custom Roadmap</h2>
              <p className="text-xs text-slate-400">Configure your learning tracks and problem sets manually</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Roadmap Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Blind 75 LeetCode, AWS Solutions Architect, Docker Mastery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TrackerType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="dsa">DSA (Data Structures & Algorithms)</option>
                <option value="course">Course (Curriculum / Book)</option>
                <option value="skills">Skills (Engineering Concepts)</option>
                <option value="custom">Custom (Personal Goal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Color Theme
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                      color === c.value
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief target or milestone goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily Goal (topics/day)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Days
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Initial Topics / Problems (One per line)
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Tip: Use <code className="text-indigo-300">[Pattern Name] Topic Title</code> syntax to group topics!
            </p>
            <textarea
              rows={4}
              value={rawTopics}
              onChange={(e) => setRawTopics(e.target.value)}
              placeholder="[Arrays] Two Sum&#10;[Arrays] Best Time to Buy and Sell Stock&#10;[Two Pointers] Valid Palindrome"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              Create Roadmap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
