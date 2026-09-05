import React, { useState } from 'react';
import { Application, ApplicationStatus, JobSource } from '../types';
import {
  Kanban,
  Table as TableIcon,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
  MessageSquareCode,
  Calendar,
  Building,
  Briefcase,
  X,
  Check,
} from 'lucide-react';

interface TrackerViewProps {
  applications: Application[];
  onAddApplication: (app: Omit<Application, 'id'>) => Promise<void>;
  onUpdateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  onDeleteApplication: (id: string) => Promise<void>;
  onSelectApplicationForTailor?: (app: Application) => void;
  onSelectApplicationForInterview?: (app: Application) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

const ALL_STATUSES: Array<{ id: ApplicationStatus; label: string; badgeColor: string; columnHeaderBg: string }> = [
  { id: 'saved', label: 'Saved', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200', columnHeaderBg: 'bg-slate-100 text-slate-800' },
  { id: 'applied', label: 'Applied', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200', columnHeaderBg: 'bg-blue-50 text-blue-900 border-blue-200' },
  { id: 'oa', label: 'OA Invites', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', columnHeaderBg: 'bg-amber-50 text-amber-900 border-amber-200' },
  { id: 'interviewing', label: 'Interviewing', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', columnHeaderBg: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  { id: 'offer', label: 'Offers', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', columnHeaderBg: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  { id: 'rejected', label: 'Rejected', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200', columnHeaderBg: 'bg-rose-50 text-rose-900 border-rose-200' },
  { id: 'ghosted', label: 'Ghosted', badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200', columnHeaderBg: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
];

export const TrackerView: React.FC<TrackerViewProps> = ({
  applications,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onSelectApplicationForTailor,
  onSelectApplicationForInterview,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [viewingApp, setViewingApp] = useState<Application | null>(null);

  // Modal Form State
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formStatus, setFormStatus] = useState<ApplicationStatus>('applied');
  const [formAppliedDate, setFormAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSource, setFormSource] = useState<JobSource>('linkedin');
  const [formJd, setFormJd] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormCompany('');
    setFormRole('');
    setFormStatus('applied');
    setFormAppliedDate(new Date().toISOString().split('T')[0]);
    setFormSource('linkedin');
    setFormJd('');
    setFormNotes('');
    setFormSalary('');
    setFormLocation('');
    setEditingApp(null);
  };

  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormStatus(app.status);
    setFormAppliedDate(app.appliedDate || new Date().toISOString().split('T')[0]);
    setFormSource(app.source || 'linkedin');
    setFormJd(app.jobDescriptionText || '');
    setFormNotes(app.notes || '');
    setFormSalary(app.salaryRange || '');
    setFormLocation(app.location || '');
    setIsAddModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formRole.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      if (editingApp) {
        await onUpdateApplication(editingApp.id, {
          company: formCompany,
          role: formRole,
          status: formStatus,
          appliedDate: formAppliedDate,
          source: formSource,
          jobDescriptionText: formJd,
          notes: formNotes,
          salaryRange: formSalary,
          location: formLocation,
          lastUpdated: now,
        });
      } else {
        await onAddApplication({
          userId: '', // populated in Firestore function
          company: formCompany,
          role: formRole,
          status: formStatus,
          appliedDate: formAppliedDate,
          source: formSource,
          jobDescriptionText: formJd,
          tailoredResumeText: '',
          notes: formNotes,
          salaryRange: formSalary,
          location: formLocation,
          lastUpdated: now,
        });
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="tracker-view" className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div id="tracker-action-bar" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage job applications across all stages in Kanban board or list view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              id="view-kanban-btn"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
            <button
              id="view-table-btn"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <button
            id="add-app-main-btn"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div id="tracker-toolbar" className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="tracker-search-input"
            type="text"
            placeholder="Search company, role, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            id="tracker-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 ml-2 font-medium">
            Showing {filteredApps.length} of {applications.length}
          </span>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div id="kanban-board-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-6">
          {ALL_STATUSES.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);
            return (
              <div
                key={col.id}
                id={`kanban-col-${col.id}`}
                className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-w-[220px]"
              >
                {/* Column Header */}
                <div className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-between border ${col.columnHeaderBg} mb-3`}>
                  <span>{col.label}</span>
                  <span className="bg-white/80 text-slate-800 px-2 py-0.5 rounded-full text-[11px]">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      id={`kanban-card-${app.id}`}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition group space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition">
                            {app.role}
                          </h4>
                          <p className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            {app.company}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewingApp(app)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Source & Date info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="capitalize font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {app.source || 'Direct'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.appliedDate || 'No date'}
                        </span>
                      </div>

                      {/* Quick Status Shift Selector */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            onUpdateApplication(app.id, {
                              status: e.target.value as ApplicationStatus,
                              lastUpdated: new Date().toISOString(),
                            })
                          }
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 font-semibold focus:outline-none"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move to: {s.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          {onSelectApplicationForTailor && (
                            <button
                              onClick={() => onSelectApplicationForTailor(app)}
                              title="Tailor Resume"
                              className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(app)}
                            title="Edit"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No jobs
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div id="table-view-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Company & Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Source</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4">Notes Snippet</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => {
                const statusMeta = ALL_STATUSES.find((s) => s.id === app.status);
                return (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-900">{app.role}</div>
                      <div className="text-xs text-slate-500">{app.company}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          onUpdateApplication(app.id, {
                            status: e.target.value as ApplicationStatus,
                            lastUpdated: new Date().toISOString(),
                          })
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusMeta?.badgeColor || 'bg-slate-100'}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 capitalize text-xs text-slate-600">{app.source || 'Direct'}</td>
                    <td className="p-4 text-xs text-slate-500">{app.appliedDate || '-'}</td>
                    <td className="p-4 text-xs text-slate-500 max-w-xs truncate">{app.notes || 'No notes added'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingApp(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(app)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-sm text-slate-500">No matching applications found.</div>
          )}
        </div>
      )}

      {/* ADD / EDIT APPLICATION MODAL */}
      {isAddModalOpen && (
        <div id="add-edit-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div id="add-edit-modal-content" className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingApp ? 'Edit Application' : 'Add Application'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Stripe"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applied Date</label>
                  <input
                    type="date"
                    value={formAppliedDate}
                    onChange={(e) => setFormAppliedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source</label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as JobSource)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="naukri">Naukri</option>
                    <option value="indeed">Indeed</option>
                    <option value="referral">Referral</option>
                    <option value="company_site">Company Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Description (JD)</label>
                <textarea
                  rows={4}
                  placeholder="Paste the full job description text here..."
                  value={formJd}
                  onChange={(e) => setFormJd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personal Notes</label>
                <input
                  type="text"
                  placeholder="Referral contacts, recruiters, follow-up dates..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : editingApp ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW APPLICATION DETAIL DRAWER */}
      {viewingApp && (
        <div id="view-app-drawer-backdrop" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div id="view-app-drawer-content" className="bg-white w-full max-w-2xl h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{viewingApp.company}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{viewingApp.role}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full">
                    Status: {viewingApp.status}
                  </span>
                  <span className="text-xs text-slate-500">Applied: {viewingApp.appliedDate}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {onSelectApplicationForTailor && (
                <button
                  onClick={() => {
                    onSelectApplicationForTailor(viewingApp);
                    setViewingApp(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Tailor Resume
                </button>
              )}
              {onSelectApplicationForInterview && (
                <button
                  onClick={() => {
                    onSelectApplicationForInterview(viewingApp);
                    setViewingApp(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  <MessageSquareCode className="w-3.5 h-3.5" /> Prep Interview Brief
                </button>
              )}
              <button
                onClick={() => {
                  openEditModal(viewingApp);
                  setViewingApp(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Details
              </button>
            </div>

            {/* Notes */}
            {viewingApp.notes && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes & History</h3>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                  {viewingApp.notes}
                </div>
              </div>
            )}

            {/* Tailored Resume Text */}
            {viewingApp.tailoredResumeText && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saved Tailored Resume</h3>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {viewingApp.tailoredResumeText}
                </div>
              </div>
            )}

            {/* Job Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Job Description</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 max-h-80 overflow-y-auto whitespace-pre-wrap">
                {viewingApp.jobDescriptionText || 'No job description text pasted.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
