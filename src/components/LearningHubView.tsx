import React, { useState, useMemo } from 'react';
import {
  LearningTracker,
  TrackerType,
  TrackerTopic,
  GenerateTrackerResponse,
} from '../types';
import {
  GraduationCap,
  Sparkles,
  Flame,
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Search,
  BookOpen,
  Code2,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  CheckCheck,
  Award,
  Layers,
  Calendar,
  X,
  FileText,
} from 'lucide-react';

interface LearningHubViewProps {
  trackers: LearningTracker[];
  onAddTracker: (tracker: Omit<LearningTracker, 'id'>) => Promise<string | void>;
  onUpdateTracker: (id: string, updates: Partial<LearningTracker>) => Promise<void>;
  onDeleteTracker: (id: string) => Promise<void>;
}

const SAMPLE_TEMPLATES = [
  {
    title: 'Striver A2Z DSA sheet',
    type: 'DSA' as TrackerType,
    goal: 2,
    desc: 'Complete SDE sheet covering Arrays, Binary Search, Trees, DP, Graphs & more.',
  },
  {
    title: 'NeetCode 150 Coding Interview',
    type: 'DSA' as TrackerType,
    goal: 2,
    desc: 'The most popular 150 LeetCode patterns for FAANG/top tech interviews.',
  },
  {
    title: 'System Design for Senior Engineers',
    type: 'Skills' as TrackerType,
    goal: 1,
    desc: 'Scalability, Load Balancing, Caching, Sharding, Message Queues & Microservices.',
  },
  {
    title: 'Fullstack React 19 & Next.js Roadmap',
    type: 'Course' as TrackerType,
    goal: 2,
    desc: 'Server Components, Actions, Routing, Auth, Optimization & Deployment.',
  },
  {
    title: 'SQL & Database Indexing Mastery',
    type: 'Skills' as TrackerType,
    goal: 1,
    desc: 'Query execution plans, B-trees, indexing, ACID transactions & PostgreSQL tuning.',
  },
];

export const LearningHubView: React.FC<LearningHubViewProps> = ({
  trackers,
  onAddTracker,
  onUpdateTracker,
  onDeleteTracker,
}) => {
  // Selected tracker for detailed view
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(
    trackers.length > 0 ? trackers[0].id : ''
  );

  // Sync selected tracker if list changes or tracker deleted
  const activeTracker = useMemo(() => {
    return trackers.find((t) => t.id === selectedTrackerId) || trackers[0] || null;
  }, [trackers, selectedTrackerId]);

  // View mode inside tracker
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Note expansion
  const [editingNotesTopicId, setEditingNotesTopicId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditTrackerModalOpen, setIsEditTrackerModalOpen] = useState(false);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);

  // AI Modal Form State
  const [aiPrompt, setAiPrompt] = useState('Striver A2Z DSA sheet');
  const [aiType, setAiType] = useState<TrackerType>('DSA');
  const [aiDailyGoal, setAiDailyGoal] = useState<number>(2);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPreviewResult, setAiPreviewResult] = useState<GenerateTrackerResponse | null>(null);

  // Manual Tracker Form State
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState<TrackerType>('DSA');
  const [manualDescription, setManualDescription] = useState('');
  const [manualDailyGoal, setManualDailyGoal] = useState(2);
  const [manualTopicsText, setManualTopicsText] = useState('');

  // Single Topic Add Form State
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState('Medium');
  const [newTopicLink, setNewTopicLink] = useState('');

  // Edit Tracker Form State
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TrackerType>('DSA');
  const [editDailyGoal, setEditDailyGoal] = useState(2);
  const [editStreak, setEditStreak] = useState(0);

  // Helper date strings
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // Check how many completed today for active tracker
  const todayStr = getTodayStr();
  const todayCompletedCount = useMemo(() => {
    if (!activeTracker) return 0;
    return activeTracker.topics.filter(
      (t) => t.completed && t.completedAt && t.completedAt.startsWith(todayStr)
    ).length;
  }, [activeTracker, todayStr]);

  // Overall workspace stats across all trackers
  const totalTrackersCount = trackers.length;
  const totalTopicsCount = trackers.reduce((sum, t) => sum + t.topics.length, 0);
  const totalCompletedCount = trackers.reduce(
    (sum, t) => sum + t.topics.filter((top) => top.completed).length,
    0
  );
  const overallPercentage =
    totalTopicsCount > 0 ? Math.round((totalCompletedCount / totalTopicsCount) * 100) : 0;
  const highestStreak = trackers.reduce((max, t) => Math.max(max, t.streak || 0), 0);

  // Categories in active tracker
  const categories = useMemo(() => {
    if (!activeTracker) return [];
    const set = new Set<string>();
    activeTracker.topics.forEach((t) => {
      set.add(t.category || 'General Topics');
    });
    return Array.from(set);
  }, [activeTracker]);

  // Filtered topics in active tracker
  const filteredTopics = useMemo(() => {
    if (!activeTracker) return [];
    return activeTracker.topics.filter((topic) => {
      if (activeFilter === 'pending' && topic.completed) return false;
      if (activeFilter === 'completed' && !topic.completed) return false;
      if (selectedCategory !== 'all' && (topic.category || 'General Topics') !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = topic.title.toLowerCase().includes(query);
        const matchesCat = (topic.category || '').toLowerCase().includes(query);
        const matchesDiff = (topic.difficulty || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesCat && !matchesDiff) return false;
      }
      return true;
    });
  }, [activeTracker, activeFilter, selectedCategory, searchQuery]);

  // Group filtered topics by category
  const groupedTopics = useMemo(() => {
    const groups: Record<string, TrackerTopic[]> = {};
    filteredTopics.forEach((t) => {
      const cat = t.category || 'General Topics';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [filteredTopics]);

  // Topic Completion Toggle with intelligent streak update
  const handleToggleTopic = async (topicId: string) => {
    if (!activeTracker) return;

    const topic = activeTracker.topics.find((t) => t.id === topicId);
    if (!topic) return;

    const newCompleted = !topic.completed;
    const now = new Date().toISOString();
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    let newStreak = activeTracker.streak || 0;
    let newLastCompletedDate = activeTracker.lastCompletedDate;

    if (newCompleted) {
      // User is completing a topic
      if (activeTracker.lastCompletedDate === today) {
        // Already logged activity today, streak stays intact
      } else if (activeTracker.lastCompletedDate === yesterday) {
        // Logged yesterday, streak increases
        newStreak += 1;
        newLastCompletedDate = today;
      } else {
        // First activity or streak reset
        newStreak = 1;
        newLastCompletedDate = today;
      }
    }

    const updatedTopics = activeTracker.topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          completed: newCompleted,
          completedAt: newCompleted ? now : undefined,
        };
      }
      return t;
    });

    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      streak: newStreak,
      lastCompletedDate: newLastCompletedDate,
      lastUpdated: now,
    });
  };

  // Mark all topics in a category completed/uncompleted
  const handleToggleCategoryAll = async (categoryName: string, markCompleted: boolean) => {
    if (!activeTracker) return;

    const now = new Date().toISOString();
    const today = getTodayStr();
    let newStreak = activeTracker.streak || 0;
    let newLastCompletedDate = activeTracker.lastCompletedDate;

    if (markCompleted && activeTracker.lastCompletedDate !== today) {
      if (activeTracker.lastCompletedDate === getYesterdayStr()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      newLastCompletedDate = today;
    }

    const updatedTopics = activeTracker.topics.map((t) => {
      if ((t.category || 'General Topics') === categoryName) {
        return {
          ...t,
          completed: markCompleted,
          completedAt: markCompleted ? now : undefined,
        };
      }
      return t;
    });

    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      streak: newStreak,
      lastCompletedDate: newLastCompletedDate,
      lastUpdated: now,
    });
  };

  // Delete a topic
  const handleDeleteTopic = async (topicId: string) => {
    if (!activeTracker) return;
    const updatedTopics = activeTracker.topics.filter((t) => t.id !== topicId);
    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Save notes on a topic
  const handleSaveTopicNote = async (topicId: string) => {
    if (!activeTracker) return;
    const updatedTopics = activeTracker.topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          notes: tempNoteText.trim(),
        };
      }
      return t;
    });
    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      lastUpdated: new Date().toISOString(),
    });
    setEditingNotesTopicId(null);
    setTempNoteText('');
  };

  // Reset Progress in active tracker
  const handleResetTrackerProgress = async () => {
    if (!activeTracker) return;
    if (
      !window.confirm(
        `Are you sure you want to reset all progress for "${activeTracker.name}"? This will uncheck all topics.`
      )
    ) {
      return;
    }

    const updatedTopics = activeTracker.topics.map((t) => ({
      ...t,
      completed: false,
      completedAt: undefined,
    }));

    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      streak: 0,
      lastCompletedDate: undefined,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Add single topic to active tracker
  const handleAddSingleTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTracker || !newTopicTitle.trim()) return;

    const newTopic: TrackerTopic = {
      id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: newTopicTitle.trim(),
      category: newTopicCategory.trim() || 'General Topics',
      difficulty: newTopicDifficulty || 'Medium',
      resourceLink: newTopicLink.trim() || undefined,
      completed: false,
    };

    const updatedTopics = [...activeTracker.topics, newTopic];
    await onUpdateTracker(activeTracker.id, {
      topics: updatedTopics,
      lastUpdated: new Date().toISOString(),
    });

    setNewTopicTitle('');
    setNewTopicCategory('');
    setNewTopicLink('');
    setIsAddTopicModalOpen(false);
  };

  // Open Edit Tracker Modal
  const handleOpenEditTracker = () => {
    if (!activeTracker) return;
    setEditName(activeTracker.name);
    setEditType(activeTracker.type);
    setEditDailyGoal(activeTracker.dailyGoal || 2);
    setEditStreak(activeTracker.streak || 0);
    setIsEditTrackerModalOpen(true);
  };

  // Save Edit Tracker
  const handleSaveEditTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTracker || !editName.trim()) return;

    await onUpdateTracker(activeTracker.id, {
      name: editName.trim(),
      type: editType,
      dailyGoal: Number(editDailyGoal) || 1,
      streak: Number(editStreak) || 0,
      lastUpdated: new Date().toISOString(),
    });

    setIsEditTrackerModalOpen(false);
  };

  // Delete active tracker
  const handleDeleteActiveTracker = async () => {
    if (!activeTracker) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${activeTracker.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const trackerToDelete = activeTracker.id;
    await onDeleteTracker(trackerToDelete);

    // Switch to another tracker
    const remaining = trackers.filter((t) => t.id !== trackerToDelete);
    if (remaining.length > 0) {
      setSelectedTrackerId(remaining[0].id);
    } else {
      setSelectedTrackerId('');
    }
  };

  // Call Gemini API to generate tracker topics
  const handleGenerateAiTracker = async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-tracker-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiPrompt.trim(),
          preferredType: aiType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate curriculum with Gemini.');
      }

      const data: GenerateTrackerResponse = await res.json();
      setAiPreviewResult(data);
      if (data.type) setAiType(data.type);
      if (data.recommendedDailyGoal) setAiDailyGoal(data.recommendedDailyGoal);
    } catch (err: any) {
      console.error('AI Tracker generation error:', err);
      setAiError(err.message || 'Error communicating with Gemini AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save AI Generated Tracker to Firestore
  const handleSaveAiTrackerToFirestore = async () => {
    if (!aiPreviewResult) return;

    const topics: TrackerTopic[] = aiPreviewResult.topics.map((t, idx) => ({
      id: `topic_${Date.now()}_${idx}`,
      title: t.title,
      category: t.category || 'Core Curriculum',
      difficulty: t.difficulty || (aiType === 'DSA' ? 'Medium' : undefined),
      resourceLink: t.resourceLink || undefined,
      completed: false,
    }));

    const now = new Date().toISOString();
    const newTrackerData: Omit<LearningTracker, 'id'> = {
      userId: '', // set in App.tsx
      name: aiPreviewResult.name || aiPrompt,
      type: aiPreviewResult.type || aiType,
      description: aiPreviewResult.description || '',
      dailyGoal: aiDailyGoal || aiPreviewResult.recommendedDailyGoal || 2,
      streak: 0,
      topics,
      createdAt: now,
      lastUpdated: now,
    };

    const newId = await onAddTracker(newTrackerData);
    if (newId) {
      setSelectedTrackerId(newId);
    }

    setIsAiModalOpen(false);
    setAiPreviewResult(null);
  };

  // Save Manual Tracker to Firestore
  const handleSaveManualTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    // Parse topics from textarea lines
    const lines = manualTopicsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const topics: TrackerTopic[] =
      lines.length > 0
        ? lines.map((line, idx) => {
            // Check for category tag syntax like "[Arrays] Two Sum"
            let category = 'General Topics';
            let title = line;
            const match = line.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              category = match[1];
              title = match[2];
            }
            return {
              id: `topic_${Date.now()}_${idx}`,
              title,
              category,
              completed: false,
            };
          })
        : [
            {
              id: `topic_${Date.now()}_0`,
              title: 'Welcome to your new tracker! Click + to add topics.',
              category: 'Getting Started',
              completed: false,
            },
          ];

    const now = new Date().toISOString();
    const newTrackerData: Omit<LearningTracker, 'id'> = {
      userId: '',
      name: manualName.trim(),
      type: manualType,
      description: manualDescription.trim() || undefined,
      dailyGoal: Number(manualDailyGoal) || 2,
      streak: 0,
      topics,
      createdAt: now,
      lastUpdated: now,
    };

    const newId = await onAddTracker(newTrackerData);
    if (newId) {
      setSelectedTrackerId(newId);
    }

    setManualName('');
    setManualDescription('');
    setManualTopicsText('');
    setIsManualModalOpen(false);
  };

  // Type Badge Renderer
  const renderTypeBadge = (type: TrackerType) => {
    switch (type) {
      case 'DSA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Code2 className="w-3 h-3" /> DSA
          </span>
        );
      case 'Course':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <BookOpen className="w-3 h-3" /> Course
          </span>
        );
      case 'Skills':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Briefcase className="w-3 h-3" /> Skills
          </span>
        );
      default:
        return null;
    }
  };

  // Difficulty Badge
  const renderDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null;
    const diff = difficulty.toLowerCase();
    if (diff.includes('easy')) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Easy
        </span>
      );
    }
    if (diff.includes('hard')) {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Hard
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Medium
      </span>
    );
  };

  return (
    <div
      id="learning-hub-view"
      className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6 select-none font-sans"
    >
      {/* Header Banner */}
      <div
        id="learning-hub-header"
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Learning Hub
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-300" /> AI Powered
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Master DSA sheets, technical courses, and interview skill roadmaps with daily streak accountability.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            id="open-ai-tracker-btn"
            onClick={() => {
              setAiPreviewResult(null);
              setAiError(null);
              setIsAiModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>AI Generate Tracker</span>
          </button>

          <button
            id="open-manual-tracker-btn"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>Custom Tracker</span>
          </button>
        </div>
      </div>

      {/* Top Workspace Stats Grid */}
      <div id="learning-stats-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1: Total Trackers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium truncate">Active Trackers</p>
            <p className="text-xl font-bold text-white tracking-tight">{totalTrackersCount}</p>
          </div>
        </div>

        {/* Stat 2: Topics Completed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium truncate">Topics Mastered</p>
            <p className="text-xl font-bold text-white tracking-tight">
              {totalCompletedCount} <span className="text-xs font-medium text-slate-500">/ {totalTopicsCount}</span>
            </p>
          </div>
        </div>

        {/* Stat 3: Best Streak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium truncate">Best Active Streak</p>
            <p className="text-xl font-bold text-amber-400 tracking-tight flex items-center gap-1">
              {highestStreak} <span className="text-xs font-semibold text-slate-400">days 🔥</span>
            </p>
          </div>
        </div>

        {/* Stat 4: Overall Progress */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">Overall Progress</p>
              <span className="text-xs font-bold text-cyan-400">{overallPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tracker Selector Pills Bar */}
      <div id="tracker-selector-bar" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {trackers.map((t) => {
          const isSelected = activeTracker?.id === t.id;
          const completedInThis = t.topics.filter((top) => top.completed).length;
          const pct = t.topics.length > 0 ? Math.round((completedInThis / t.topics.length) * 100) : 0;

          return (
            <button
              key={t.id}
              id={`tracker-pill-${t.id}`}
              onClick={() => setSelectedTrackerId(t.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold shrink-0 transition-all border ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {renderTypeBadge(t.type)}
                <span className="font-bold text-slate-200">{t.name}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-2 border-l border-slate-700/60">
                <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                  <Flame className="w-3 h-3 fill-amber-400/20" /> {t.streak || 0}d
                </span>
                <span className="font-bold text-cyan-400">{pct}%</span>
              </div>
            </button>
          );
        })}

        {trackers.length === 0 && (
          <div className="text-xs text-slate-500 italic py-2">
            No trackers created yet. Click "AI Generate Tracker" to create your first learning plan!
          </div>
        )}
      </div>

      {/* Empty State when no trackers exist */}
      {trackers.length === 0 && (
        <div
          id="empty-trackers-banner"
          className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Start Your Learning Journey</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Build your technical interview foundation. Ask Gemini to generate popular coding sheets like Striver A2Z or NeetCode 150, or track system design roadmaps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            {SAMPLE_TEMPLATES.slice(0, 4).map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(tmpl.title);
                  setAiType(tmpl.type);
                  setAiDailyGoal(tmpl.goal);
                  setIsAiModalOpen(true);
                }}
                className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition">
                    {tmpl.title}
                  </span>
                  {renderTypeBadge(tmpl.type)}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.desc}</p>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              Generate with Gemini AI
            </button>
          </div>
        </div>
      )}

      {/* Active Tracker Main Details */}
      {activeTracker && (
        <div id="active-tracker-card" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-2xl">
          {/* Top Info Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {renderTypeBadge(activeTracker.type)}
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {activeTracker.name}
                </h2>
              </div>
              {activeTracker.description && (
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {activeTracker.description}
                </p>
              )}
            </div>

            {/* Streak & Daily Goal Callouts */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {/* Streak Badge */}
              <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 shadow-sm">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20 animate-pulse" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Streak</p>
                  <p className="text-sm font-extrabold text-amber-400">
                    {activeTracker.streak || 0} Day{activeTracker.streak === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {/* Daily Goal Badge */}
              <div className="px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2.5">
                <Target className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Daily Goal</p>
                  <p className="text-sm font-extrabold text-cyan-400">
                    {todayCompletedCount} / {activeTracker.dailyGoal || 2} <span className="text-[11px] font-normal text-slate-400">today</span>
                  </p>
                </div>
              </div>

              {/* Actions Dropdown / Buttons */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <button
                  id="add-topic-btn"
                  onClick={() => setIsAddTopicModalOpen(true)}
                  title="Add Single Topic"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  id="edit-tracker-btn"
                  onClick={handleOpenEditTracker}
                  title="Edit Tracker Details"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  id="reset-tracker-btn"
                  onClick={handleResetTrackerProgress}
                  title="Reset Progress"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  id="delete-tracker-btn"
                  onClick={handleDeleteActiveTracker}
                  title="Delete Tracker"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar & Goal Status Message */}
          <div className="space-y-2">
            {todayCompletedCount >= (activeTracker.dailyGoal || 2) && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Daily Goal Accomplished! Keep the fire burning 🔥
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {todayCompletedCount} topics completed today
                </span>
              </div>
            )}

            {/* Overall Tracker Progress Bar */}
            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-[200px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Curriculum Progress</span>
                  <span className="font-bold text-white">
                    {activeTracker.topics.filter((t) => t.completed).length} / {activeTracker.topics.length} (
                    {activeTracker.topics.length > 0
                      ? Math.round(
                          (activeTracker.topics.filter((t) => t.completed).length /
                            activeTracker.topics.length) *
                            100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        activeTracker.topics.length > 0
                          ? Math.round(
                              (activeTracker.topics.filter((t) => t.completed).length /
                                activeTracker.topics.length) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="search-topics-input"
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  />
                </div>

                {/* Category Selector */}
                <select
                  id="category-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Modules ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700/80">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({activeTracker.topics.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeFilter === 'pending'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pending ({activeTracker.topics.filter((t) => !t.completed).length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeFilter === 'completed'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Completed ({activeTracker.topics.filter((t) => t.completed).length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Topics List Grouped by Category */}
          <div id="tracker-topics-container" className="space-y-4">
            {Object.keys(groupedTopics).length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No topics found matching current filter or search criteria.</p>
                <button
                  onClick={() => {
                    setActiveFilter('all');
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              (Object.entries(groupedTopics) as [string, TrackerTopic[]][]).map(([categoryName, topicsList]) => {
                const isCollapsed = collapsedCategories[categoryName];
                const catCompletedCount = topicsList.filter((t) => t.completed).length;
                const catTotalCount = topicsList.length;
                const isCatAllDone = catCompletedCount === catTotalCount && catTotalCount > 0;

                return (
                  <div
                    key={categoryName}
                    id={`category-group-${categoryName.replace(/\s+/g, '-').toLowerCase()}`}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition"
                  >
                    {/* Category Header */}
                    <div className="p-3.5 px-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between gap-3">
                      <button
                        onClick={() =>
                          setCollapsedCategories((prev) => ({
                            ...prev,
                            [categoryName]: !prev[categoryName],
                          }))
                        }
                        className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white text-left transition"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{categoryName}</span>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                          {catCompletedCount} / {catTotalCount} completed
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCategoryAll(categoryName, !isCatAllDone)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                            isCatAllDone
                              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                          }`}
                        >
                          {isCatAllDone ? 'Unmark All' : 'Mark All Done'}
                        </button>
                      </div>
                    </div>

                    {/* Topics under this category */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-800/80">
                        {topicsList.map((topic) => {
                          const isEditingNotes = editingNotesTopicId === topic.id;

                          return (
                            <div
                              key={topic.id}
                              id={`topic-row-${topic.id}`}
                              className={`p-3 px-4 flex flex-col transition ${
                                topic.completed
                                  ? 'bg-slate-900/40 opacity-80'
                                  : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Custom Checkbox */}
                                  <button
                                    onClick={() => handleToggleTopic(topic.id)}
                                    className="shrink-0 text-slate-500 hover:text-emerald-400 transition"
                                    title={topic.completed ? 'Mark pending' : 'Mark completed'}
                                  >
                                    {topic.completed ? (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                                    )}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        onClick={() => handleToggleTopic(topic.id)}
                                        className={`text-xs font-semibold cursor-pointer select-text ${
                                          topic.completed
                                            ? 'line-through text-slate-500'
                                            : 'text-slate-200 hover:text-white'
                                        }`}
                                      >
                                        {topic.title}
                                      </span>

                                      {renderDifficultyBadge(topic.difficulty)}

                                      {topic.resourceLink && (
                                        <a
                                          href={topic.resourceLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5 text-[10px]"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>

                                    {topic.completed && topic.completedAt && (
                                      <p className="text-[10px] text-emerald-500/80 mt-0.5">
                                        Done on {new Date(topic.completedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right Topic Action Icons */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Notes Button */}
                                  <button
                                    onClick={() => {
                                      if (isEditingNotes) {
                                        setEditingNotesTopicId(null);
                                      } else {
                                        setEditingNotesTopicId(topic.id);
                                        setTempNoteText(topic.notes || '');
                                      }
                                    }}
                                    title={topic.notes ? 'View/edit notes' : 'Add notes'}
                                    className={`p-1.5 rounded-lg text-xs transition ${
                                      topic.notes
                                        ? 'text-cyan-400 bg-cyan-500/10'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Topic */}
                                  <button
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    title="Delete topic"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Topic Notes Editor / View */}
                              {isEditingNotes && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
                                  <textarea
                                    value={tempNoteText}
                                    onChange={(e) => setTempNoteText(e.target.value)}
                                    placeholder="Add key takeaways, algorithmic patterns, LeetCode submission links, or revision notes..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setEditingNotesTopicId(null)}
                                      className="px-3 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveTopicNote(topic.id)}
                                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                                    >
                                      Save Note
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!isEditingNotes && topic.notes && (
                                <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                                  <span className="font-semibold text-cyan-400">Note:</span> {topic.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: AI GENERATE TRACKER WITH GEMINI */}
      {/* ============================================================ */}
      {isAiModalOpen && (
        <div
          id="ai-generator-modal"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Learning Curriculum Generator</h3>
                <p className="text-xs text-slate-400">
                  Type any sheet or topic, and Gemini will generate a full structured curriculum.
                </p>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Popular Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(tmpl.title);
                      setAiType(tmpl.type);
                      setAiDailyGoal(tmpl.goal);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  What do you want to master?
                </label>
                <input
                  id="ai-prompt-input"
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Striver A2Z DSA sheet, NeetCode 150, System Design, React 19..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Tracker Category
                  </label>
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value as TrackerType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="DSA">DSA (Data Structures & Algorithms)</option>
                    <option value="Course">Course (Curriculum / Book)</option>
                    <option value="Skills">Skills (Industry Frameworks & Systems)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Daily Goal
                  </label>
                  <select
                    value={aiDailyGoal}
                    onChange={(e) => setAiDailyGoal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value={1}>1 topic / problem per day</option>
                    <option value={2}>2 topics / problems per day (Recommended)</option>
                    <option value={3}>3 topics / problems per day</option>
                    <option value={5}>5 topics / problems per day (Intensive)</option>
                  </select>
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {aiError}
                </div>
              )}

              {/* Generate Button */}
              {!aiPreviewResult && (
                <button
                  id="submit-ai-generate-btn"
                  onClick={handleGenerateAiTracker}
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gemini is designing your curriculum roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      Generate Syllabus with Gemini AI
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Generated Preview Results */}
            {aiPreviewResult && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {aiPreviewResult.name}
                      {renderTypeBadge(aiPreviewResult.type || aiType)}
                    </h4>
                    <span className="text-xs font-semibold text-cyan-400">
                      {aiPreviewResult.topics.length} topics generated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{aiPreviewResult.description}</p>
                </div>

                {/* Topics Preview List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-950/60 rounded-2xl border border-slate-800 divide-y divide-slate-850">
                  {aiPreviewResult.topics.map((t, idx) => (
                    <div key={idx} className="pt-1.5 pb-1 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-500 font-mono text-[10px] w-5">#{idx + 1}</span>
                        <span className="text-slate-200 font-medium truncate">{t.title}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                      {renderDifficultyBadge(t.difficulty)}
                    </div>
                  ))}
                </div>

                {/* Final Save Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setAiPreviewResult(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                  >
                    Regenerate / Adjust
                  </button>
                  <button
                    id="save-ai-tracker-btn"
                    onClick={handleSaveAiTrackerToFirestore}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save & Add to Trackers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CUSTOM MANUAL TRACKER */}
      {/* ============================================================ */}
      {isManualModalOpen && (
        <div
          id="manual-tracker-modal"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Custom Tracker</h3>
                <p className="text-xs text-slate-400">Add a custom curriculum and set your daily goal.</p>
              </div>
            </div>

            <form onSubmit={handleSaveManualTracker} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tracker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blind 75 LeetCode, CS50x Harvard..."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Type</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as TrackerType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DSA">DSA</option>
                    <option value="Course">Course</option>
                    <option value="Skills">Skills</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Daily Goal</label>
                  <select
                    value={manualDailyGoal}
                    onChange={(e) => setManualDailyGoal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>1 topic / day</option>
                    <option value={2}>2 topics / day</option>
                    <option value={3}>3 topics / day</option>
                    <option value={5}>5 topics / day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief objective..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Topics List (Paste one topic per line)
                </label>
                <p className="text-[10px] text-slate-500 mb-1">
                  Tip: Prefix with category in brackets, e.g. <span className="font-mono text-slate-400">[Arrays] Two Sum</span>
                </p>
                <textarea
                  rows={6}
                  placeholder={`[Arrays] Two Sum\n[Arrays] Best Time to Buy and Sell Stock\n[Two Pointers] Valid Palindrome\n[Sliding Window] Longest Substring Without Repeating Characters`}
                  value={manualTopicsText}
                  onChange={(e) => setManualTopicsText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  Create Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDIT TRACKER METADATA */}
      {/* ============================================================ */}
      {isEditTrackerModalOpen && activeTracker && (
        <div
          id="edit-tracker-modal"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsEditTrackerModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Tracker Details
            </h3>

            <form onSubmit={handleSaveEditTracker} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tracker Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as TrackerType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DSA">DSA</option>
                    <option value="Course">Course</option>
                    <option value="Skills">Skills</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Daily Goal</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editDailyGoal}
                    onChange={(e) => setEditDailyGoal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Current Streak (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={editStreak}
                  onChange={(e) => setEditStreak(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditTrackerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ADD SINGLE TOPIC */}
      {/* ============================================================ */}
      {isAddTopicModalOpen && activeTracker && (
        <div
          id="add-topic-modal"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddTopicModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Add Topic to {activeTracker.name}
            </h3>

            <form onSubmit={handleAddSingleTopic} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trapping Rain Water, Redux Thunk Middleware..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category / Module</label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamic Programming"
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={newTopicDifficulty}
                    onChange={(e) => setNewTopicDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Resource Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/problems/..."
                  value={newTopicLink}
                  onChange={(e) => setNewTopicLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTopicModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
