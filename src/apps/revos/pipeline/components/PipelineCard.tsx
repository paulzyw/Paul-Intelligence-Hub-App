import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, ArrowUpRight, X, Save, Building2, DollarSign, Layers, Target } from 'lucide-react';
import { PipelineOpportunity, PipelineAssessment } from '../../types/pipeline';
import { getScopedStorageItem, setScopedStorageItem } from '../../utils/userIsolation';

export const PIPELINE_STAGE_OPTIONS = [
  'Qualification',
  'Discovery',
  'Solution Development',
  'Proposal',
  'Evaluation',
  'Negotiation',
  'Commit',
  'Closed Won',
  'Closed Lost'
] as const;

export const OPPORTUNITY_STAGE_OPTIONS = [
  'Emerging Opportunity',
  'Defined Opportunity',
  'Validated Opportunity',
  'Active Buying Opportunity',
  'Decision Opportunity',
  'Contract Decision'
] as const;

export type PipelineStageOption = (typeof PIPELINE_STAGE_OPTIONS)[number];

export interface PipelineCardItem {
  id: string;
  lead_id?: string;
  company_name: string;
  opportunity_name: string;
  industry: string;
  business_segment?: string;
  revenue_motion: string;
  estimated_value: number;
  expected_close_date?: string;
  opportunity_owner?: string;
  pipeline_stage: string;
  opportunity_stage: string;
  source?: string;
  pipeline_opp?: PipelineOpportunity & { latest_assessment?: PipelineAssessment };
}

export interface IsolatedPipelineCardEdits {
  company_name?: string;
  opportunity_name?: string;
  estimated_value?: number;
  pipeline_stage?: string;
  opportunity_stage?: string;
}

const ISOLATED_STORAGE_PREFIX = 'pipeline_isolated_card_edits_';

export function getIsolatedPipelineCardEdits(
  itemId: string,
  explicitUserId?: string | null
): IsolatedPipelineCardEdits | null {
  if (typeof window === 'undefined' || !itemId) return null;
  try {
    const raw = getScopedStorageItem(`${ISOLATED_STORAGE_PREFIX}${itemId}`, explicitUserId);
    if (!raw) return null;
    return JSON.parse(raw) as IsolatedPipelineCardEdits;
  } catch {
    return null;
  }
}

export function saveIsolatedPipelineCardEdits(
  itemId: string,
  edits: IsolatedPipelineCardEdits,
  explicitUserId?: string | null
): void {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    setScopedStorageItem(`${ISOLATED_STORAGE_PREFIX}${itemId}`, JSON.stringify(edits), explicitUserId);
  } catch {
    // ignore storage quota failures cleanly
  }
}

function pipelineStageBadgeClass(stage: string): string {
  switch (stage) {
    case 'Closed Won':
      return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20';
    case 'Closed Lost':
      return 'bg-red-500 text-white border-red-600 shadow-red-500/20';
    case 'Negotiation':
    case 'Commit':
      return 'bg-amber-500 text-black border-amber-600 shadow-amber-500/20';
    case 'Proposal':
    case 'Evaluation':
      return 'bg-sky-500 text-white border-sky-600 shadow-sky-500/20';
    default:
      return 'bg-[#00a3ff] text-white border-[#00a3ff]/40 shadow-[#00a3ff]/20';
  }
}

export interface PipelineCardProps {
  item: PipelineCardItem;
  highlighted?: boolean;
  onSaveIsolatedEdits?: (item: PipelineCardItem, edits: IsolatedPipelineCardEdits) => Promise<void> | void;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  item,
  highlighted = false,
  onSaveIsolatedEdits
}) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState(item.company_name);
  const [opportunityName, setOpportunityName] = useState(item.opportunity_name);
  const [estimatedValueInput, setEstimatedValueInput] = useState(
    item.estimated_value > 0 ? String(item.estimated_value) : '0'
  );
  const [pipelineStage, setPipelineStage] = useState(item.pipeline_stage || 'Qualification');
  const [opportunityStage, setOpportunityStage] = useState(item.opportunity_stage || 'Emerging Opportunity');

  const targetUrl = `/product/revos/pipeline?opportunityId=${encodeURIComponent(
    item.id
  )}${item.lead_id ? `&leadId=${encodeURIComponent(item.lead_id)}` : ''}&source=pipeline_canvas`;

  const openEditor = () => {
    setCompanyName(item.company_name);
    setOpportunityName(item.opportunity_name);
    setEstimatedValueInput(item.estimated_value > 0 ? String(item.estimated_value) : '0');
    setPipelineStage(item.pipeline_stage || 'Qualification');
    setOpportunityStage(item.opportunity_stage || 'Emerging Opportunity');
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const parsedVal = parseFloat(estimatedValueInput.replace(/[^0-9.]/g, '')) || 0;
    const edits: IsolatedPipelineCardEdits = {
      company_name: companyName.trim() || item.company_name,
      opportunity_name: opportunityName.trim() || item.opportunity_name,
      estimated_value: parsedVal,
      pipeline_stage: pipelineStage,
      opportunity_stage: opportunityStage
    };

    try {
      saveIsolatedPipelineCardEdits(item.id, edits);
      if (onSaveIsolatedEdits) {
        await onSaveIsolatedEdits(item, edits);
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const rawSource = String(
    item.source ||
      item.pipeline_opp?.source ||
      (item.pipeline_opp?.metadata as any)?.source ||
      ''
  )
    .trim()
    .toLowerCase();
  const sourceBadge =
    rawSource === 'inherited'
      ? { marker: 'I', label: 'Inherited', bgColor: 'bg-[#00b67a]' }
      : rawSource === 'created'
        ? { marker: 'C', label: 'Created', bgColor: 'bg-[#00a3ff]' }
        : null;

  return (
    <>
      <div
        onClick={() => navigate(targetUrl)}
        className={`relative overflow-hidden bg-bg-surface border rounded-xl p-3 cursor-pointer hover:border-accent/50 hover:shadow-md transition-all group flex flex-col gap-1.5 ${
          highlighted ? 'border-accent ring-2 ring-accent/35 shadow-md' : 'border-border'
        }`}
      >
        {sourceBadge && (
          <div
            className={`absolute top-0 right-0 w-11 h-11 [clip-path:polygon(0_0,100%_0,100%_100%)] pointer-events-auto z-10 ${sourceBadge.bgColor}`}
            title={`Source: ${sourceBadge.label}`}
            aria-label={`Source: ${sourceBadge.label}`}
          >
            <span
              className="absolute top-[4.5px] right-[4.5px] w-[18px] h-[18px] rounded-full border-[1.5px] border-white flex items-center justify-center text-[10px] font-bold leading-none text-white select-none"
            >
              {sourceBadge.marker}
            </span>
          </div>
        )}

        {/* Top Row: Company + Isolated Edit Affordance */}
        <div className="flex justify-between items-start gap-2">
          <span
            className="px-2 py-0.5 rounded bg-bg-primary/50 text-text-secondary text-[10px] font-medium truncate max-w-[160px]"
            title={item.company_name}
          >
            {item.company_name || 'Unknown Co'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditor();
            }}
            className={`p-0.5 rounded text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer ${
              sourceBadge ? 'mr-7' : ''
            }`}
            title="Edit Pipeline Card Details"
            aria-label="Edit Pipeline Card Details"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Middle: Opportunity Name + Estimate Value */}
        <div className="mt-1">
          <h4
            className="text-sm font-bold text-text-primary font-sans leading-tight truncate"
            title={item.opportunity_name}
          >
            {item.opportunity_name}
          </h4>
          <p className="text-xs font-semibold text-text-primary mt-0.5 tabular-nums">
            {item.estimated_value > 0
              ? `$${item.estimated_value.toLocaleString('en-US')}`
              : '—'}
          </p>
        </div>

        {/* Tags Row: Opportunity Stage & Pipeline Stage */}
        <div className="flex justify-between items-end mt-1.5 gap-2">
          <div className="flex flex-wrap gap-1.5 items-center min-w-0">
            <span
              className="px-1.5 py-0.5 rounded border border-border text-text-secondary text-[9px] font-medium truncate max-w-[130px]"
              title={`Opportunity Stage: ${item.opportunity_stage}`}
            >
              {item.opportunity_stage}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider shadow-sm ${pipelineStageBadgeClass(
                item.pipeline_stage
              )}`}
              title={`Pipeline Stage: ${item.pipeline_stage}`}
            >
              {item.pipeline_stage}
            </span>
          </div>
        </div>

      </div>

      {/* Isolated Pipeline Card Editor Modal (never impacts Lead Qualification Engine cards) */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-md bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                  Isolated Pipeline Card
                </div>
                <h3 className="text-sm font-black text-text-primary">
                  Edit Pipeline Card Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-text-secondary flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-accent" />
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-text-secondary flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-accent" />
                  Opportunity Name
                </label>
                <input
                  type="text"
                  required
                  value={opportunityName}
                  onChange={(e) => setOpportunityName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-text-secondary flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-accent" />
                  Estimate Value (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={estimatedValueInput}
                  onChange={(e) => setEstimatedValueInput(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-secondary flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-accent" />
                    Pipeline Stage
                  </label>
                  <select
                    value={pipelineStage}
                    onChange={(e) => setPipelineStage(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {PIPELINE_STAGE_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-secondary">
                    Opportunity Stage
                  </label>
                  <select
                    value={opportunityStage}
                    onChange={(e) => setOpportunityStage(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {OPPORTUNITY_STAGE_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[10px] text-text-secondary leading-relaxed">
                Changes saved here apply strictly to this Pipeline Card and do not affect the Opportunity Card in Lead Qualification Engine.
              </p>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                <Link
                  to={targetUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  <span>Open Workspace</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-black text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Card'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PipelineCard;
