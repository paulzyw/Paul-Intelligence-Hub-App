import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Lock,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  InitialOpportunityContextSummaryHistoryEntry,
  InitialOpportunityContextSummaryPayload,
  InitialOpportunityContextSummarySections,
  InitialSummaryStatus
} from '../../types/pipeline';
import { CanvasColumnKey, resolveCanvasColumn } from '../services/pipelinePortfolioLoader';

export interface InitialOpportunityContextSummaryProps {
  pipelineId: string | null;
  opportunityName: string;
  companyName: string;
  pipelineStage: string;
  industry?: string;
  revenueMotion?: string;
  summaryStatus: InitialSummaryStatus;
  summaryPayload: InitialOpportunityContextSummaryPayload | null;
  summaryVersion: number;
  summaryGeneratedAt?: string | null;
  summaryHistory?: InitialOpportunityContextSummaryHistoryEntry[];
  isStale: boolean;
  summaryError: string | null;
  hasUnsavedChanges: boolean;
  submittingSummary: boolean;
  savingSummary?: boolean;
  savedSummaryMessage?: string | null;
  saveSummaryError?: string | null;
  onSaveSummary?: (
    summaryToSave: InitialOpportunityContextSummaryPayload,
    version: number
  ) => void;
  isAssessmentLocked?: boolean;
  onEditOpportunity?: () => void;
  onRetry: () => void;
  onOpenPipelineCanvas: (targetColumn: CanvasColumnKey, pipelineId?: string | null) => void;
}

const SUMMARY_CATEGORY_ORDER: ReadonlyArray<{
  key: keyof InitialOpportunityContextSummarySections;
  number: string;
  label: string;
}> = [
  { key: 'opportunity_overview', number: '01', label: 'Opportunity Overview' },
  { key: 'customer_context', number: '02', label: 'Customer Context' },
  {
    key: 'business_problem_and_customer_needs',
    number: '03',
    label: 'Business Problem & Customer Needs'
  },
  {
    key: 'proposed_solution_and_value_proposition',
    number: '04',
    label: 'Proposed Solution & Value Proposition'
  },
  { key: 'expected_business_outcomes', number: '05', label: 'Expected Business Outcomes' },
  { key: 'commercial_context', number: '06', label: 'Commercial Context' },
  {
    key: 'customer_engagement_and_stakeholder_context',
    number: '07',
    label: 'Customer Engagement & Stakeholders'
  },
  { key: 'competitive_context', number: '08', label: 'Competitive Context' },
  {
    key: 'known_constraints_and_challenges',
    number: '09',
    label: 'Known Constraints & Challenges'
  },
  {
    key: 'missing_or_unconfirmed_information',
    number: '10',
    label: 'Missing or Unconfirmed Information'
  }
];

function formatSummaryTimestamp(iso?: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export const InitialOpportunityContextSummary: React.FC<
  InitialOpportunityContextSummaryProps
> = ({
  pipelineId,
  opportunityName,
  companyName,
  pipelineStage,
  industry = '',
  revenueMotion = '',
  summaryStatus,
  summaryPayload,
  summaryVersion,
  summaryGeneratedAt,
  isStale,
  summaryError,
  hasUnsavedChanges,
  submittingSummary,
  savingSummary = false,
  savedSummaryMessage = null,
  saveSummaryError = null,
  onSaveSummary,
  isAssessmentLocked = false,
  onEditOpportunity,
  onRetry,
  onOpenPipelineCanvas
}) => {
  const [expanded, setExpanded] = useState(true);

  const targetCanvasColumn: CanvasColumnKey = useMemo(
    () => resolveCanvasColumn({ pipeline_stage: pipelineStage || 'Qualification' }),
    [pipelineStage]
  );

  const activeSummary: InitialOpportunityContextSummaryPayload | null = summaryPayload;

  const activeVersionNumber =
    activeSummary?.summary_metadata?.version ?? (summaryVersion || 1);

  const formattedGeneratedAt = formatSummaryTimestamp(
    activeSummary?.summary_metadata?.generated_at || summaryGeneratedAt
  );

  const statusTone =
    summaryStatus === 'GENERATING'
      ? 'text-accent'
      : summaryStatus === 'FAILED'
        ? 'text-red-500'
        : summaryStatus === 'NOT_GENERATED'
          ? 'text-amber-500'
          : isStale
            ? 'text-amber-500'
            : 'text-emerald-500';

  const statusText =
    summaryStatus === 'GENERATING'
      ? 'Generating via Gemini reasoning'
      : summaryStatus === 'FAILED'
        ? 'Generation failed'
        : summaryStatus === 'NOT_GENERATED'
          ? 'Not generated'
          : isStale
            ? `Outdated · v${activeVersionNumber}`
            : `Ready · v${activeVersionNumber}`;

  const displayTitle =
    opportunityName.trim() || companyName.trim() || 'Created Opportunity Context Summary';

  const lockedIndustry =
    industry.trim() || activeSummary?.summary_metadata?.industry || 'Not specified';
  const lockedRevenueMotion =
    revenueMotion.trim() || activeSummary?.summary_metadata?.revenue_motion || 'Not specified';

  return (
    <section
      aria-label="Initial Opportunity Context Summary"
      className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/70 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Initial Opportunity Context Summary</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight truncate">
            {displayTitle}
          </h2>

          {/* Unboxed typographic metadata line with tabular numbers */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary tabular-nums">
            <span className={`font-semibold ${statusTone}`}>{statusText}</span>
            <span aria-hidden="true">·</span>
            <span>Source: Created (User-provided context)</span>
            {formattedGeneratedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>Generated {formattedGeneratedAt}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              Pipeline Canvas Column:{' '}
              <strong className="font-semibold text-text-primary">{targetCanvasColumn}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeSummary?.summary_sections && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-primary border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer whitespace-nowrap"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Hide Summary</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Show Summary</span>
                </>
              )}
            </button>
          )}

          {(summaryStatus === 'FAILED' || summaryStatus === 'NOT_GENERATED') &&
            pipelineId &&
            !hasUnsavedChanges && (
              <button
                type="button"
                disabled={submittingSummary}
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 hover:bg-amber-500/25 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${submittingSummary ? 'animate-spin' : ''}`} />
                <span>{summaryStatus === 'FAILED' ? 'Retry Summary' : 'Generate Summary'}</span>
              </button>
            )}

          {onEditOpportunity && pipelineId && (
            <button
              type="button"
              onClick={onEditOpportunity}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bg-primary border border-border hover:border-accent/60 text-text-primary text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              title={
                isAssessmentLocked
                  ? 'Open Opportunity Creation Form in read-only review mode'
                  : 'Edit Created Opportunity in Opportunity Creation Form'
              }
            >
              {isAssessmentLocked ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-[#00a3ff]" />
                  <span>Review</span>
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5 text-accent" />
                  <span>Edit</span>
                </>
              )}
            </button>
          )}

          {summaryStatus === 'READY' &&
            activeSummary?.summary_sections &&
            pipelineId &&
            onSaveSummary &&
            !isAssessmentLocked && (
            <button
              type="button"
              disabled={savingSummary || submittingSummary}
              onClick={() => onSaveSummary(activeSummary, activeVersionNumber)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
            >
              {savingSummary ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}

          {pipelineId && summaryStatus === 'READY' && (
            <button
              type="button"
              onClick={() => onOpenPipelineCanvas(targetCanvasColumn, pipelineId)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-black text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-accent/15"
            >
              <span>View in Pipeline Canvas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Placement Confirmation when READY */}
        {summaryStatus === 'READY' && pipelineId && (
          <div className="px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-start sm:items-center gap-2.5 text-text-primary">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Initial Opportunity Context Summary saved. Opportunity card placed on{' '}
                <strong className="font-semibold">Pipeline Canvas</strong> in column{' '}
                <strong className="font-semibold text-emerald-500">{targetCanvasColumn}</strong>{' '}
                <span className="text-text-secondary">
                  (Pipeline Stage: {pipelineStage || 'Qualification'}).
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary shrink-0">
              <Layers className="h-3.5 w-3.5 text-accent" />
              <span>{pipelineId}</span>
            </div>
          </div>
        )}

        {savedSummaryMessage && (
          <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedSummaryMessage}</span>
          </div>
        )}

        {saveSummaryError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs font-medium text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveSummaryError}</span>
          </div>
        )}

        {/* Locked Classification Inputs retrieved from Opportunity Creation Form (Critical for Assessment Gemini Reasoning) */}
        <div
          aria-label="Locked Assessment Classification Context"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-[#00a3ff]" />
                <span>Industry</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#00a3ff] bg-[#00a3ff]/10 px-2 py-0.5 rounded-md border border-[#00a3ff]/25">
                <Lock className="h-2.5 w-2.5" />
                <span>Locked</span>
              </span>
            </div>
            <input
              type="text"
              readOnly
              disabled
              aria-label="Locked Industry"
              value={lockedIndustry}
              className="w-full px-3.5 py-2.5 bg-bg-primary/35 border border-border/70 rounded-xl text-xs font-sans font-semibold text-text-primary cursor-not-allowed select-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-[#00a3ff]" />
                <span>Revenue Motion</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#00a3ff] bg-[#00a3ff]/10 px-2 py-0.5 rounded-md border border-[#00a3ff]/25">
                <Lock className="h-2.5 w-2.5" />
                <span>Locked</span>
              </span>
            </div>
            <input
              type="text"
              readOnly
              disabled
              aria-label="Locked Revenue Motion"
              value={lockedRevenueMotion}
              className="w-full px-3.5 py-2.5 bg-bg-primary/35 border border-border/70 rounded-xl text-xs font-sans font-semibold text-text-primary cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Generating State */}
        {summaryStatus === 'GENERATING' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/8 border border-accent/25 flex items-center gap-3 text-xs text-text-primary">
              <RefreshCw className="h-4 w-4 text-accent animate-spin shrink-0" />
              <span>
                Synthesizing structured 10-category Initial Opportunity Context Summary via Gemini
                reasoning. Once ready, this opportunity will appear in the{' '}
                <strong>{targetCanvasColumn}</strong> column on the Pipeline Canvas.
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-hidden="true">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-bg-primary/50 border border-border/60 space-y-2 animate-pulse"
                >
                  <div className="h-3 w-40 rounded bg-border/60" />
                  <div className="h-3 w-full rounded bg-border/40" />
                  <div className="h-3 w-4/5 rounded bg-border/40" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failure State */}
        {summaryError && (
          <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/25 text-xs text-red-500 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Initial Opportunity Context Summary generation did not complete
              </p>
              <p className="text-[11px] opacity-90">{summaryError}</p>
            </div>
          </div>
        )}

        {/* Not Generated State */}
        {summaryStatus === 'NOT_GENERATED' && !activeSummary?.summary_sections && !summaryError && (
          <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/25 text-xs text-text-secondary flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              The Initial Opportunity Context Summary has not been generated yet for this Created
              opportunity. Click <strong className="text-text-primary">Generate Summary</strong>{' '}
              above to synthesize it via Gemini reasoning.
            </span>
          </div>
        )}

        {/* Stale Notice */}
        {isStale && summaryStatus === 'READY' && !summaryError && (
          <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/25 text-xs text-amber-500 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Opportunity inputs changed after version {summaryVersion || 1} was generated. Save any
              pending changes and click <strong>Re-Submit</strong> on Section E in the Opportunity
              Creation Form to update the summary.
            </span>
          </div>
        )}

        {/* Structured 10-Category Context Reading Grid */}
        {activeSummary?.summary_sections && expanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUMMARY_CATEGORY_ORDER.map(({ key, number, label }) => {
                const isMissingSection = key === 'missing_or_unconfirmed_information';
                const sectionText =
                  activeSummary.summary_sections[key] || 'Not provided in initial submission.';
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border space-y-1.5 ${
                      isMissingSection
                        ? 'md:col-span-2 bg-amber-500/5 border-amber-500/30'
                        : 'bg-bg-primary/45 border-border/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                      <span className="font-mono text-text-secondary tabular-nums">{number}</span>
                      <span className={isMissingSection ? 'text-amber-500' : 'text-accent'}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-text-primary leading-relaxed whitespace-pre-line">
                      {sectionText}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quiet Provenance Footer */}
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-text-secondary">
              <span>
                Evidence Classification: Initial user-submitted context (not independently verified
                customer evidence)
              </span>
              {/*{activeSummary.summary_metadata && (
                <span className="tabular-nums">
                  {activeSummary.summary_metadata.model_identifier} ·{' '}
                  {activeSummary.summary_metadata.prompt_version} · v
                  {activeSummary.summary_metadata.version}
                </span>
              )}*/}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InitialOpportunityContextSummary;
