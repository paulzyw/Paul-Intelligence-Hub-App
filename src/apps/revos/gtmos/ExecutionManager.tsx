import React, { useState } from 'react';
import { GTMOSActionTask } from './types';
import { Plus, Trash2, Calendar, Users, CheckCircle, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExecutionManagerProps {
  tasks: GTMOSActionTask[];
  onSaveTasks: (updatedTasks: GTMOSActionTask[]) => void;
  subMode: 'refine' | 'board'; // refine is step 15; board is step 16
  projectName: string;
}

export const ExecutionManager: React.FC<ExecutionManagerProps> = ({
  tasks,
  onSaveTasks,
  subMode,
  projectName
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState<GTMOSActionTask | null>(null);

  // Form states for creating a new task
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProgram, setNewProgram] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const startEditCell = (task: GTMOSActionTask) => {
    setEditingTaskId(task.id);
    setDraftTask({ ...task });
  };

  const handleCellChange = (field: keyof GTMOSActionTask, val: any) => {
    if (!draftTask) return;
    setDraftTask({
      ...draftTask,
      [field]: val
    });
  };

  const saveCell = () => {
    if (!draftTask || !editingTaskId) return;
    const nextTasks = tasks.map(t => (t.id === editingTaskId ? draftTask : t));
    onSaveTasks(nextTasks);
    setEditingTaskId(null);
    setDraftTask(null);
  };

  const deleteTask = (id: string) => {
    const nextTasks = tasks.filter(t => t.id !== id);
    onSaveTasks(nextTasks);
  };

  const toggleTaskStatus = (id: string, dir: 'prev' | 'next') => {
    const statusSequence: ('todo' | 'in_progress' | 'completed')[] = ['todo', 'in_progress', 'completed'];
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const currentIdx = statusSequence.indexOf(task.status);
    let nextIdx = currentIdx;

    if (dir === 'next' && currentIdx < 2) nextIdx++;
    if (dir === 'prev' && currentIdx > 0) nextIdx--;

    if (nextIdx !== currentIdx) {
      const updated = tasks.map(t => (t.id === id ? { ...t, status: statusSequence[nextIdx] } : t));
      onSaveTasks(updated);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProgram.trim()) return;

    const added: GTMOSActionTask = {
      id: `task-${Date.now()}`,
      program: newProgram,
      title: newTitle,
      description: newDesc,
      owner: newOwner || 'Unassigned',
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      status: 'todo',
      priority: newPriority
    };

    onSaveTasks([...tasks, added]);
    
    // reset form
    setNewProgram('');
    setNewTitle('');
    setNewDesc('');
    setNewOwner('');
    setNewDueDate('');
    setNewPriority('medium');
    setShowAddForm(false);
  };

  if (subMode === 'refine') {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5">
          <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-primary">
            <span className="font-bold text-accent">Active Operational Refinement (Step 15): </span> 
            Double-click or interact with any task field row to edit program paths, adjust owners, change target deadlines, delete rows, or append customized action items to the GTM launch catalog.
          </p>
        </div>

        {/* Task lists table */}
        <div className="rounded-2xl border border-border bg-bg-surface/50 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg-primary/50 text-text-secondary font-bold border-b border-border text-[10px] uppercase tracking-wider">
                  <th className="p-4 pl-6 min-w-[120px]">Program Category</th>
                  <th className="p-4 min-w-[200px]">Initiative Title & Description</th>
                  <th className="p-4 min-w-[120px]">Owner Assigned</th>
                  <th className="p-4 min-w-[100px]">Target Date</th>
                  <th className="p-4 min-w-[100px]">Priority Level</th>
                  <th className="p-4 min-w-[100px]">Status</th>
                  <th className="p-4 pr-6 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/65">
                {tasks.map(t => {
                  const isEditing = editingTaskId === t.id && draftTask;
                  return (
                    <tr key={t.id} className="hover:bg-bg-primary/30 transition-colors group">
                      {/* Program Cell */}
                      <td className="p-4 pl-6">
                        {isEditing ? (
                          <input
                            type="text"
                            value={draftTask.program}
                            onChange={(e) => handleCellChange('program', e.target.value)}
                            className="bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary font-sans w-full"
                          />
                        ) : (
                          <span
                            onClick={() => startEditCell(t)}
                            className="font-bold text-accent cursor-pointer border-b border-dotted border-accent/40 hover:border-accent"
                          >
                            {t.program}
                          </span>
                        )}
                      </td>

                      {/* Title & Desc Cell */}
                      <td className="p-4">
                        {isEditing ? (
                          <div className="space-y-1 w-full">
                            <input
                              type="text"
                              value={draftTask.title}
                              onChange={(e) => handleCellChange('title', e.target.value)}
                              className="bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary font-sans w-full font-bold"
                            />
                            <textarea
                              value={draftTask.description}
                              onChange={(e) => handleCellChange('description', e.target.value)}
                              rows={2}
                              className="bg-bg-primary border border-border rounded px-2 py-1 text-[11px] text-text-secondary font-sans w-full resize-none"
                            />
                          </div>
                        ) : (
                          <div onClick={() => startEditCell(t)} className="cursor-pointer">
                            <div className="font-bold text-text-primary">{t.title}</div>
                            <div className="text-[11px] text-text-secondary mt-0.5 leading-normal line-clamp-1">{t.description}</div>
                          </div>
                        )}
                      </td>

                      {/* Owner Cell */}
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={draftTask.owner}
                            onChange={(e) => handleCellChange('owner', e.target.value)}
                            className="bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary font-sans w-full"
                          />
                        ) : (
                          <span onClick={() => startEditCell(t)} className="text-text-secondary cursor-pointer">
                            {t.owner}
                          </span>
                        )}
                      </td>

                      {/* Date Cell */}
                      <td className="p-4 font-mono">
                        {isEditing ? (
                          <input
                            type="date"
                            value={draftTask.dueDate}
                            onChange={(e) => handleCellChange('dueDate', e.target.value)}
                            className="bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary font-sans w-full"
                          />
                        ) : (
                          <span onClick={() => startEditCell(t)} className="text-text-secondary cursor-pointer">
                            {t.dueDate}
                          </span>
                        )}
                      </td>

                      {/* Priority Cell */}
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={draftTask.priority}
                            onChange={(e) => handleCellChange('priority', e.target.value)}
                            className="bg-bg-primary border border-border rounded px-1.5 py-1 text-xs text-text-primary font-sans w-full"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        ) : (
                          <span
                            onClick={() => startEditCell(t)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.priority === 'high' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 
                              t.priority === 'medium' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' : 
                              'bg-green-400/10 text-green-400/80 border border-green-400/20'
                            }`}
                          >
                            {t.priority}
                          </span>
                        )}
                      </td>

                      {/* Status Cell */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                          t.status === 'completed' ? 'text-accent' : 
                          t.status === 'in_progress' ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions / Delete */}
                      <td className="p-4 text-right pr-6">
                        {isEditing ? (
                          <button
                            onClick={saveCell}
                            className="px-2.5 py-1 bg-accent text-black text-[10px] font-bold rounded hover:scale-105 active:scale-95 transition-all mr-2"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="p-1 px-1.5 rounded-lg hover:border-red-500/20 text-text-secondary hover:text-red-400 opacity-40 group-hover:opacity-100 transition-all border border-transparent"
                            title="Delete operational task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary italic">
                      No active operational tasks cataloged. Create a task using the action below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Append Launcher */}
        <div className="flex justify-end">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 py-2.5 bg-accent text-black font-bold rounded-xl hover:scale-[1.03] active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-accent/15"
            >
              <Plus className="h-4 w-4 text-black" />
              Append New Action Task
            </button>
          ) : (
            <form onSubmit={handleCreateTask} className="w-full p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4 text-left">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Initialize Custom Operational Deal Point</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Program Category</label>
                  <input
                    type="text"
                    required
                    value={newProgram}
                    onChange={(e) => setNewProgram(e.target.value)}
                    placeholder="e.g., SDR Training, ABM Campaign"
                    className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Initiative Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Establish Outreach cadence triggers"
                    className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Responsible Owner</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g., Sarah Jenkins"
                    className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase">Objective Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide precise details, target systems, or training objectives..."
                  rows={2}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none mt-1"
                  >
                    <option value="high">High Execution Weight</option>
                    <option value="medium">Medium Execution Weight</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-black font-bold rounded-xl text-xs transition-all hover:scale-[1.02]"
                >
                  Create Custom Task
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Kanban Board Mode: Step 16
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const progTasks = tasks.filter(t => t.status === 'in_progress');
  const compTasks = tasks.filter(t => t.status === 'completed');

  const renderColumn = (colTitle: string, list: GTMOSActionTask[], colorClass: string) => {
    return (
      <div className="flex flex-col p-4 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">{colTitle}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-bg-primary text-[10px] font-mono font-bold text-text-secondary">
            {list.length} tasks
          </span>
        </div>

        <div className="space-y-3.5 h-[50vh] overflow-y-auto scrollbar-none pr-1">
          {list.map(t => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-bg-primary/95 border border-border/90 hover:border-accent/25 transition-all shadow p-4 space-y-3"
            >
              <div>
                <span className="text-[9px] font-mono font-bold text-accent tracking-wider uppercase">
                  {t.program}
                </span>
                <h5 className="text-xs font-bold text-text-primary leading-snug mt-0.5">
                  {t.title}
                </h5>
                <p className="text-[10px] text-text-secondary leading-normal mt-1 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Extra details line */}
              <div className="flex justify-between items-center pt-2 border-t border-border/40 text-[9px] text-text-secondary/60">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-text-secondary/40" />
                  <span className="truncate max-w-[80px]">{t.owner}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3 text-text-secondary/40" />
                  <span>{t.dueDate}</span>
                </div>
              </div>

              {/* Movement Controls inside Kanban Card */}
              <div className="flex justify-between items-center pt-2 border-t border-border/20 text-[9px]">
                <button
                  onClick={() => toggleTaskStatus(t.id, 'prev')}
                  disabled={t.status === 'todo'}
                  className="p-1 rounded bg-bg-surface/40 hover:bg-bg-surface border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${
                  t.priority === 'high' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-500'
                }`}>
                  {t.priority}
                </span>

                <button
                  onClick={() => toggleTaskStatus(t.id, 'next')}
                  disabled={t.status === 'completed'}
                  className="p-1 rounded bg-bg-surface/40 hover:bg-bg-surface border border-border text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/30 rounded-xl h-36 opacity-30 text-center p-4">
              <CheckCircle className="h-6 w-6 text-text-secondary mb-1" />
              <div className="text-[10px] font-medium text-text-secondary font-sans uppercase">Column Cleared</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5">
        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs">
          <span className="font-bold text-accent">Active Operational Kanban (Step 16): </span> 
          Manage live GTM sprint execution directly inside standard pipeline lanes. Use the left/right arrow controls to transition tasks from To-Do to Completed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {renderColumn('Backlog & To-Do', todoTasks, 'bg-gray-400')}
        {renderColumn('Active In Progress', progTasks, 'bg-blue-400')}
        {renderColumn('Completed Wins', compTasks, 'bg-[#00F090]')}
      </div>
    </div>
  );
};
