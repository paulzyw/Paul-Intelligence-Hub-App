import { useState } from 'react';
import { supabase, type ReportType } from '../lib/supabase';
import { Plus, Trash2, FolderPlus, Leaf, Gauge, Network, FlaskConical, BarChart3, HelpCircle } from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Leaf', icon: Leaf },
  { name: 'Gauge', icon: Gauge },
  { name: 'Network', icon: Network },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'BarChart3', icon: BarChart3 },
];

export const ReportTypeManager = ({ reportTypes, fetchReportTypes }: { reportTypes: ReportType[], fetchReportTypes: () => void }) => {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('BarChart3');
  const [loading, setLoading] = useState(false);

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    
    const { error } = await supabase.from('report_types').insert([{ name: newName, icon_name: newIcon }]);
    
    if (error) alert('Error adding report type: ' + error.message);
    else {
      setNewName('');
      setNewIcon('BarChart3');
      fetchReportTypes();
    }
    setLoading(false);
  };

  const handleDeleteType = async (id: string) => {
    // Check if reports are using this type
    const { count, error: countError } = await supabase
      .from('research_reports')
      .select('*', { count: 'exact', head: true })
      .eq('report_type_id', id);
      
    if (countError) {
      alert('Error checking report usage: ' + countError.message);
      return;
    }
    
    if (count && count > 0) {
      alert(`Cannot delete this type. It is currently linked to ${count} report(s). Please reassign them first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this report type?')) return;
    
    const { error } = await supabase.from('report_types').delete().eq('id', id);
    if (error) alert('Error deleting report type: ' + error.message);
    else fetchReportTypes();
  };

  return (
    <div className="bg-bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <FolderPlus size={20} className="text-accent" /> Research Type Manager
      </h2>
      
      <form onSubmit={handleAddType} className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Type Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Sustainability"
            className="w-full px-3 py-2 border border-border rounded-md bg-transparent text-text-primary focus:outline-none focus:border-accent"
            required
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Icon</label>
          <select
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
          >
            {ICON_OPTIONS.map(opt => (
              <option key={opt.name} value={opt.name}>{opt.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2 h-[42px]"
        >
          <Plus size={18} /> Add Type
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {reportTypes.length === 0 ? (
          <p className="text-sm text-text-secondary col-span-full">No report types found.</p>
        ) : (
          reportTypes.map(type => {
            const IconComp = ICON_OPTIONS.find(o => o.name === type.icon_name)?.icon || HelpCircle;
            return (
              <div key={type.id} className="flex justify-between items-center p-3 bg-bg-primary rounded-md border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bg-surface rounded border border-border">
                    <IconComp size={16} className="text-accent" />
                  </div>
                  <span className="font-medium text-text-primary">{type.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteType(type.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  title="Delete Type"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
