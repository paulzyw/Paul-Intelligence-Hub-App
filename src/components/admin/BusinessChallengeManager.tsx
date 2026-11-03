import React, { useState, useEffect } from 'react';
import { 
  fetchBusinessChallenges, 
  createBusinessChallenge, 
  updateBusinessChallenge, 
  toggleBusinessChallengeStatus, 
  deleteBusinessChallenge,
  type BusinessChallenge,
  PREDEFINED_CHALLENGES_SEED 
} from '../../lib/businessChallenges';
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2,
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  ArrowUpDown, 
  FileText, 
  AlertCircle, 
  Check, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const BusinessChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<BusinessChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<BusinessChallenge | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const loadChallenges = async () => {
    setLoading(true);
    const { data, error } = await fetchBusinessChallenges({ includeCounts: true });
    if (error) {
      console.warn('Error loading challenges:', error);
    }
    setChallenges(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const openCreateModal = () => {
    setEditingChallenge(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    // Auto-calculate next display order
    const maxOrder = challenges.length > 0 ? Math.max(...challenges.map(c => c.display_order)) : 0;
    setFormDisplayOrder(maxOrder + 10);
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (challenge: BusinessChallenge) => {
    setEditingChallenge(challenge);
    setFormName(challenge.name);
    setFormSlug(challenge.slug);
    setFormDescription(challenge.description || '');
    setFormDisplayOrder(challenge.display_order);
    setFormStatus(challenge.status);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingChallenge) {
      // Auto generate slug for new challenges
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('Challenge name is required', 'error');
      return;
    }

    setActionLoading(true);

    if (editingChallenge) {
      // Update
      const { data, error } = await updateBusinessChallenge(editingChallenge.id, {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim() || null,
        display_order: Number(formDisplayOrder),
        status: formStatus
      });

      if (error) {
        showNotification(`Error updating challenge: ${error.message}`, 'error');
      } else {
        showNotification(`Updated "${formName}" successfully`);
        setIsModalOpen(false);
        loadChallenges();
      }
    } else {
      // Create
      const { data, error } = await createBusinessChallenge({
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim() || undefined,
        display_order: Number(formDisplayOrder),
        status: formStatus
      });

      if (error) {
        showNotification(`Error creating challenge: ${error.message}`, 'error');
      } else {
        showNotification(`Created "${formName}" successfully`);
        setIsModalOpen(false);
        loadChallenges();
      }
    }

    setActionLoading(false);
  };

  const handleToggleStatus = async (challenge: BusinessChallenge) => {
    const newStatus = challenge.status === 'active' ? 'inactive' : 'active';
    const { success, error } = await toggleBusinessChallengeStatus(challenge.id, challenge.status);

    if (success) {
      showNotification(`Challenge "${challenge.name}" marked as ${newStatus}`);
      setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, status: newStatus } : c));
    } else {
      showNotification(`Failed to toggle status: ${error?.message || 'Database error'}`, 'error');
    }
  };

  const handleDeleteChallenge = async (challenge: BusinessChallenge) => {
    const promptMsg = challenge.article_count && challenge.article_count > 0
      ? `Are you sure you want to delete "${challenge.name}" from the database? It is currently associated with ${challenge.article_count} article${challenge.article_count > 1 ? 's' : ''}. Deleting it will remove the challenge and its article links.`
      : `Are you sure you want to delete "${challenge.name}" from the database? This action cannot be undone.`;

    if (!window.confirm(promptMsg)) {
      return;
    }

    setDeletingId(challenge.id);
    const { success, error } = await deleteBusinessChallenge(challenge.id);

    if (success) {
      showNotification(`Deleted "${challenge.name}" successfully`);
      setChallenges(prev => prev.filter(c => c.id !== challenge.id));
    } else {
      showNotification(`Failed to delete challenge: ${error?.message || 'Database error'}`, 'error');
    }
    setDeletingId(null);
  };

  const handleSeedPredefined = async () => {
    if (!window.confirm('This will seed any missing predefined Business Challenges (18 items) into your database without duplicating existing ones. Continue?')) {
      return;
    }

    setSyncLoading(true);
    let addedCount = 0;
    try {
      for (const item of PREDEFINED_CHALLENGES_SEED) {
        const { error } = await supabase
          .from('business_challenges')
          .upsert([item], { onConflict: 'slug', ignoreDuplicates: true });
        if (!error) addedCount++;
      }
      showNotification(`Idempotent sync complete. Checked 18 predefined challenges.`);
      loadChallenges();
    } catch (err: any) {
      showNotification(`Sync error: ${err.message}`, 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  // Filtered challenges
  const filteredChallenges = challenges.filter(ch => {
    const matchesSearch = 
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' ? true : ch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Target size={22} className="text-accent" /> Business Challenge Management
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Define and manage the centralized strategic challenges diagnosed or solved by Revenue Insight articles.
            Articles are organized into these discovery groups for enterprise audience SEO.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedPredefined}
            disabled={syncLoading}
            className="px-3 py-2 text-xs border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Idempotently seed the 18 standard RevOS Business Challenges"
          >
            <Sparkles size={14} className="text-accent" />
            {syncLoading ? 'Syncing...' : 'Seed Initial 18'}
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus size={16} /> New Challenge
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-3 rounded-lg mb-4 text-xs font-medium flex items-center justify-between transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {notification.message}
          </div>
          <button onClick={() => setNotification(null)} className="text-text-secondary hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search challenges by name, slug, or problem description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-lg bg-bg-primary text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex border border-border rounded-lg bg-bg-primary p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-accent text-white' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({challenges.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'active' 
                ? 'bg-accent text-white' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Active ({challenges.filter(c => c.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'inactive' 
                ? 'bg-accent text-white' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Inactive ({challenges.filter(c => c.status === 'inactive').length})
          </button>
        </div>

        <button
          type="button"
          onClick={loadChallenges}
          disabled={loading}
          className="p-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer"
          title="Refresh list"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-text-secondary text-xs flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-accent" />
          Loading business challenges...
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="p-8 text-center bg-bg-primary/40 border border-dashed border-border rounded-xl">
          <Target size={32} className="mx-auto text-text-secondary mb-2 opacity-40" />
          <p className="text-sm font-medium text-text-primary">No business challenges found</p>
          <p className="text-xs text-text-secondary mt-1">
            {searchQuery ? 'Try clearing your search query or filters.' : 'Click "Seed Initial 18" or "New Challenge" to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-bg-primary/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-bg-primary border-b border-border text-text-secondary uppercase tracking-wider text-[11px] font-semibold">
                <th className="p-3.5 w-16 text-center">Order</th>
                <th className="p-3.5">Challenge Name & Slug</th>
                <th className="p-3.5 hidden md:table-cell">Problem Description</th>
                <th className="p-3.5 text-center">Articles</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChallenges.map((challenge) => (
                <tr key={challenge.id} className="hover:bg-bg-primary/40 transition-colors">
                  <td className="p-3.5 text-center font-mono text-text-secondary font-semibold">
                    #{challenge.display_order}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-text-primary text-sm flex items-center gap-2">
                      {challenge.name}
                    </div>
                    <div className="font-mono text-[11px] text-accent mt-0.5">
                      /{challenge.slug}
                    </div>
                  </td>
                  <td className="p-3.5 hidden md:table-cell text-text-secondary max-w-xs truncate">
                    {challenge.description || <span className="italic text-text-secondary/50">No description</span>}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-bg-surface border border-border text-text-primary">
                      <FileText size={12} className="text-accent" />
                      {challenge.article_count ?? 0}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(challenge)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                        challenge.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20'
                      }`}
                      title={challenge.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {challenge.status === 'active' ? (
                        <><CheckCircle2 size={12} /> Active</>
                      ) : (
                        <><XCircle size={12} /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(challenge)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors cursor-pointer"
                        title="Edit challenge"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChallenge(challenge)}
                        disabled={deletingId === challenge.id}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete challenge from database"
                      >
                        <Trash2 size={15} className={deletingId === challenge.id ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg-primary/50">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-accent" />
                <h3 className="font-bold text-sm text-text-primary">
                  {editingChallenge ? 'Edit Business Challenge' : 'Create Business Challenge'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Challenge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inconsistent Revenue Performance"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. inconsistent-revenue-performance"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-bg-primary font-mono text-text-primary focus:outline-none focus:border-accent"
                />
                <span className="text-[10px] text-text-secondary mt-1 block">
                  Unique identifier used in URLs and article association routes.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Problem Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short explanation of what revenue problem this challenge addresses..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-text-secondary mt-1 block">
                    Lower numbers appear first.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="active">Active (Available for Insights)</option>
                    <option value="inactive">Inactive (Hidden from new articles)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingChallenge ? 'Save Changes' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
