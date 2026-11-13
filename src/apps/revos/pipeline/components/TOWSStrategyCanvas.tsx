import React, { useMemo, useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import {
  PipelineStrategy,
  PipelineAction,
  TOWSType
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';

export interface TOWSStrategyCanvasProps {
  strategies: PipelineStrategy[];
  actions: PipelineAction[];
  onStrategyUpdated?: (updated: PipelineStrategy) => void;
  onActionUpdated?: (updated: PipelineAction) => void;
}

const TOWS_QUADRANTS: Array<{
  type: TOWSType;
  label: string;
  subtitle: string;
  accentText: string;
}> = [
  {
    type: 'SO',
    label: 'SO · Strengths × Opportunities',
    subtitle: 'Offensive growth plays leveraging verified strengths to accelerate close',
    accentText: 'text-emerald-400'
  },
  {
    type: 'WO',
    label: 'WO · Weaknesses × Opportunities',
    subtitle: 'Turnaround plays closing critical gaps to unlock urgent business drivers',
    accentText: 'text-sky-400'
  },
  {
    type: 'ST',
    label: 'ST · Strengths × Threats',
    subtitle: 'Defensive differentiation neutralizing competitors and procurement resistance',
    accentText: 'text-amber-400'
  },
  {
    type: 'WT',
    label: 'WT · Weaknesses × Threats',
    subtitle: 'Contingency & de-risking plays preventing stall or deal loss',
    accentText: 'text-red-400'
  }
];

export const TOWSStrategyCanvas: React.FC<TOWSStrategyCanvasProps> = ({
  strategies,
  actions,
  onStrategyUpdated,
  onActionUpdated
}) => {
  const [savingStrategyId, setSavingStrategyId] = useState<string | null>(null);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [actionStatusFilter, setActionStatusFilter] = useState<'ALL' | PipelineAction['action_status']>('ALL');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStrategyStatus = async (
    strat: PipelineStrategy,
    status: PipelineStrategy['strategy_status']
  ) => {
    setSavingStrategyId(strat.strategy_instance_id);
    setFeedback(null);
    const ok = await PipelineDataService.updateStrategyStatus(strat.strategy_instance_id, status);
    setSavingStrategyId(null);
    if (ok && onStrategyUpdated) {
      onStrategyUpdated({ ...strat, strategy_status: status });
      setFeedback(`Strategy ${strat.strategy_id} marked as ${status}.`);
    }
  };

  const handleActionStatus = async (
    action: PipelineAction,
    status: PipelineAction['action_status']
  ) => {
    setSavingActionId(action.action_id);
    setFeedback(null);
    const notes = noteDrafts[action.action_id] ?? action.completion_notes ?? '';
    const ok = await PipelineDataService.updateActionStatus(action.action_id, status, notes);
    setSavingActionId(null);
    if (ok && onActionUpdated) {
      onActionUpdated({ ...action, action_status: status, completion_notes: notes });
      setFeedback(`Action "${action.action_description.slice(0, 40)}..." updated to ${status}.`);
    }
  };

  const filteredActions = useMemo(() => {
    if (actionStatusFilter === 'ALL') return actions;
    return actions.filter((a) => a.action_status === actionStatusFilter);
  }, [actions, actionStatusFilter]);

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="px-4 py-2.5 bg-bg-surface border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 2x2 TOWS Strategic Combination Canvas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Compass className="h-4 w-4 text-accent" />
              <span>TOWS Winning Strategy Matrix ({strategies.length} Strategies)</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Grounded combinations of active 16 SWOT factors with directional winability impact and owner commitment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TOWS_QUADRANTS.map((quad) => {
            const quadStrategies = strategies.filter(
              (s) => s.strategy_type === quad.type || s.tows_category === quad.type
            );
            return (
              <div
                key={quad.type}
                className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5"
              >
                <div className="pb-3 border-b border-border/60">
                  <div className={`text-sm font-bold ${quad.accentText}`}>
                    {quad.label} ({quadStrategies.length})
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{quad.subtitle}</p>
                </div>

                {quadStrategies.length === 0 ? (
                  <div className="py-6 text-center text-xs text-text-secondary">
                    No {quad.type} strategies generated for the current evidence profile.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quadStrategies.map((strat) => {
                      const isSaving = savingStrategyId === strat.strategy_instance_id;
                      return (
                        <div
                          key={strat.strategy_instance_id}
                          className="p-4 bg-bg-primary border border-border/70 rounded-xl space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px] font-mono text-text-secondary">
                                <span className="text-accent font-semibold">{strat.strategy_id}</span>
                                <span aria-hidden="true">·</span>
                                <span>Priority: {strat.priority}</span>
                                <span aria-hidden="true">·</span>
                                <span>Feasibility: {strat.feasibility}</span>
                              </div>
                              <h4 className="text-sm font-bold text-text-primary leading-snug">
                                {strat.strategic_objective}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <select
                                value={strat.strategy_status}
                                disabled={isSaving}
                                onChange={(e) =>
                                  handleStrategyStatus(
                                    strat,
                                    e.target.value as PipelineStrategy['strategy_status']
                                  )
                                }
                                className="px-2.5 py-1 bg-bg-surface border border-border rounded-lg text-[11px] font-mono font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                              >
                                <option value="PROPOSED">PROPOSED</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="SUPERSEDED">SUPERSEDED</option>
                              </select>
                              {isSaving && <RefreshCw className="h-3 w-3 text-accent animate-spin" />}
                            </div>
                          </div>

                          <p className="text-xs text-text-secondary leading-relaxed">
                            {strat.strategic_rationale}
                          </p>

                          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary">
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <TrendingUp className="h-3 w-3" />
                              Impact: {strat.expected_impact}
                            </span>
                            {(strat.supporting_swot_factor_ids || []).length > 0 && (
                              <span className="font-mono truncate max-w-[220px]">
                                SWOT: {(strat.supporting_swot_factor_ids || []).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Action Execution Tracker */}
      <div className="bg-bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-accent" />
              <span>Priority Action Execution Plan ({actions.length})</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Track tactical deal execution milestones and completion notes before triggering reassessment.
            </p>
          </div>

          <select
            value={actionStatusFilter}
            onChange={(e) => setActionStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent self-start sm:self-auto"
          >
            <option value="ALL">All Actions ({actions.length})</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {filteredActions.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-secondary">
            No execution actions match the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((act) => {
              const isSaving = savingActionId === act.action_id;
              const noteVal = noteDrafts[act.action_id] ?? act.completion_notes ?? '';
              return (
                <div
                  key={act.action_id}
                  className="p-4 bg-bg-primary border border-border/70 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-text-secondary">
                      <span className="text-accent font-semibold">{act.priority}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {act.action_owner}
                      </span>
                      {act.target_date && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Calendar className="h-3 w-3" />
                            Due {act.target_date}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-text-primary">
                      {act.action_description}
                    </div>
                    {act.strategic_objective && (
                      <div className="text-[11px] text-text-secondary">
                        Objective: {act.strategic_objective}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={noteVal}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [act.action_id]: e.target.value
                        }))
                      }
                      placeholder="Execution notes..."
                      className="px-3 py-1.5 bg-bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent sm:w-48"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={act.action_status}
                        disabled={isSaving}
                        onChange={(e) =>
                          handleActionStatus(act, e.target.value as PipelineAction['action_status'])
                        }
                        className="px-3 py-1.5 bg-bg-surface border border-border rounded-xl text-xs font-mono font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="NOT_STARTED">NOT_STARTED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                      {isSaving && <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TOWSStrategyCanvas;
