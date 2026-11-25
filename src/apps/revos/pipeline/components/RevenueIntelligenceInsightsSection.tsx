import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileWarning,
  Info,
  Layers,
  Lightbulb,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import { PipelineAssessmentSnapshot } from '../../types/pipeline';
import { PipelineCardItem } from './PipelineCard';
import {
  buildPortfolioIntelligenceContext,
  buildScopeDescription,
  computePortfolioScopeHash,
  REVENUE_INTELLIGENCE_MODEL_ID,
  RevenueIntelligenceActionRow,
  RevenueIntelligenceAssessmentRecord,
  RevenueIntelligenceFilterSummary,
  RevenueIntelligenceReportPayload,
  RevenueIntelligenceRiskRow,
  RevenueIntelligenceService,
  validateRevenueIntelligencePayload
} from '../services/revenueIntelligenceService';

interface RevenueIntelligenceInsightsSectionProps {
  userId: string;
  scopedItems: PipelineCardItem[];
  riskRows: RevenueIntelligenceRiskRow[];
  actionRows: RevenueIntelligenceActionRow[];
  historicalAssessments: RevenueIntelligenceAssessmentRecord[];
  historicalSnapshots: PipelineAssessmentSnapshot[];
  filters: RevenueIntelligenceFilterSummary;
  dashboardLoading: boolean;
}

type InsightTabKey =
  | 'ALL'
  | 'FINDINGS'
  | 'WEAKNESSES'
  | 'RISKS'
  | 'IMPROVEMENTS'
  | 'RECOMMENDATIONS';

const formatTimestampLabel = (iso?: string | null): string => {
  if (!iso) return 'Not yet generated';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCompactMoney = (val: number | null | undefined, currency = 'USD'): string => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '—';
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (val >= 1_000_000) return `${symbol}${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${symbol}${Math.round(val / 1_000)}K`;
  return `${symbol}${Math.round(val).toLocaleString()}`;
};

export const RevenueIntelligenceInsightsSection: React.FC<
  RevenueIntelligenceInsightsSectionProps
> = ({
  userId,
  scopedItems,
  riskRows,
  actionRows,
  historicalAssessments,
  historicalSnapshots,
  filters,
  dashboardLoading
}) => {
  const [activeTab, setActiveTab] = useState<InsightTabKey>('FINDINGS');
  const [report, setReport] = useState<RevenueIntelligenceReportPayload | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(null);
  const [reportScopeHash, setReportScopeHash] = useState<string | null>(null);
  const [reportSavedAt, setReportSavedAt] = useState<string | null>(null);
  const [isSavedReport, setIsSavedReport] = useState<boolean>(false);
  const [modelIdentifier, setModelIdentifier] = useState<string>(REVENUE_INTELLIGENCE_MODEL_ID);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState<boolean>(true);
  const [showLimitations, setShowLimitations] = useState<boolean>(false);

  const effectiveUserId = userId ? String(userId).trim() : '';

  const portfolioContext = useMemo(
    () =>
      buildPortfolioIntelligenceContext({
        scopedItems,
        riskRows,
        actionRows,
        assessments: historicalAssessments,
        snapshots: historicalSnapshots,
        filters
      }),
    [scopedItems, riskRows, actionRows, historicalAssessments, historicalSnapshots, filters]
  );

  const currentScopeHash = useMemo(
    () =>
      computePortfolioScopeHash({
        userId: effectiveUserId,
        filters,
        scopedItems,
        riskRows,
        actionRows,
        snapshots: historicalSnapshots
      }),
    [effectiveUserId, filters, scopedItems, riskRows, actionRows, historicalSnapshots]
  );

  const scopeDescription = useMemo(() => buildScopeDescription(filters), [filters]);

  const primaryCurrency =
    portfolioContext.portfolio_context.currency_context.currencies[0] || 'USD';

  const isEmptyPortfolio = portfolioContext.portfolio_context.included_opportunity_count === 0;
  const isZeroAssessed =
    !isEmptyPortfolio && portfolioContext.portfolio_context.assessed_opportunity_count === 0;

  const isStale = Boolean(
    report && reportScopeHash && reportScopeHash !== currentScopeHash
  );

  // Merge live opportunity lookup map with validated_reference_ids saved inside report
  const oppRefLookup = useMemo(() => {
    const idToItem = {
      ...portfolioContext.reference_index.opportunity_id_to_item_id,
      ...(report?.validated_reference_ids?.opportunity_id_to_item_id || {})
    };
    const idToLabel = {
      ...portfolioContext.reference_index.opportunity_id_to_label,
      ...(report?.validated_reference_ids?.opportunity_id_to_label || {})
    };
    return { idToItem, idToLabel };
  }, [portfolioContext.reference_index, report]);

  // Retrieve saved Revenue Intelligence report from Supabase on mount / scope ready without invoking Gemini
  useEffect(() => {
    if (dashboardLoading) return;
    let cancelled = false;

    const loadSaved = async () => {
      if (!effectiveUserId) {
        if (!cancelled) {
          setReport(null);
          setLoadingSaved(false);
        }
        return;
      }
      setLoadingSaved(true);
      try {
        const res = await RevenueIntelligenceService.getSavedReport({
          userId: effectiveUserId,
          scopeHash: currentScopeHash
        });
        if (cancelled) return;
        setStorageReady(res.storageReady);

        const targetRecord = res.exactMatch || res.latestSaved;
        if (targetRecord?.report_payload) {
          const validIds = new Set(portfolioContext.reference_index.valid_opportunity_ids);
          const validated = validateRevenueIntelligencePayload(
            targetRecord.report_payload,
            validIds
          );
          setReport(validated);
          setReportGeneratedAt(targetRecord.generated_at);
          setReportScopeHash(targetRecord.scope_hash);
          setReportSavedAt(targetRecord.saved_at || targetRecord.generated_at);
          setModelIdentifier(targetRecord.model_identifier || REVENUE_INTELLIGENCE_MODEL_ID);
          setIsSavedReport(true);
        }
      } catch (_err) {
        // Non-fatal: dashboard continues cleanly
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    };

    loadSaved();
    return () => {
      cancelled = true;
    };
    // Only auto-load saved state on initial load completion or userId change so user-generated drafts aren't overwritten mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardLoading, effectiveUserId]);

  const handleGenerate = async (forceRefresh = true) => {
    setErrorMsg(null);
    setSaveFeedback(null);
    setGenerating(true);
    try {
      const res = await RevenueIntelligenceService.generateInsights({
        userId: effectiveUserId,
        scopeHash: currentScopeHash,
        portfolioContext,
        forceRefresh
      });
      setReport(res.report);
      setReportGeneratedAt(res.generatedAt);
      setReportScopeHash(res.scopeHash);
      setModelIdentifier(res.modelIdentifier);
      setIsSavedReport(res.fromCache);
      if (res.fromCache) {
        setReportSavedAt(res.generatedAt);
      } else {
        setReportSavedAt(null);
      }
    } catch (err: any) {
      const message =
        err?.message ||
        'Unable to generate Revenue Intelligence Insights. Ensure the pipeline-assessment Edge Function is deployed and GEMINI_API_KEY is configured.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!report || !reportGeneratedAt) return;
    setErrorMsg(null);
    setSaveFeedback(null);
    setSaving(true);
    try {
      const saved = await RevenueIntelligenceService.saveReport({
        userId: effectiveUserId,
        scopeHash: reportScopeHash || currentScopeHash,
        scopeLabel: scopeDescription,
        appliedFilters: filters,
        portfolioMetrics: {
          included_opportunity_count:
            portfolioContext.portfolio_context.included_opportunity_count,
          assessed_opportunity_count:
            portfolioContext.portfolio_context.assessed_opportunity_count,
          totals_by_currency: portfolioContext.portfolio_performance.totals_by_currency
        },
        reportPayload: report,
        generatedAt: reportGeneratedAt,
        modelIdentifier
      });
      setIsSavedReport(true);
      setStorageReady(true);
      setReportSavedAt(saved.saved_at || new Date().toISOString());
      setSaveFeedback('Saved to Supabase');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err: any) {
      const msg = err?.message || 'Failed to save report to Supabase.';
      if (msg.includes('does not exist') || msg.includes('schema cache')) {
        setStorageReady(false);
        setErrorMsg(
          'Table pipeline_revenue_intelligence_reports is not created yet. Run the SQL migration in Supabase SQL Editor, then click Save again.'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const renderOpportunityLinks = (oppIds: string[]) => {
    const unique = Array.from(new Set(oppIds.filter(Boolean)));
    if (unique.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary mr-1">
          Deals:
        </span>
        {unique.map((oid) => {
          const itemId = oppRefLookup.idToItem[oid];
          const label = oppRefLookup.idToLabel[oid] || oid;
          if (itemId) {
            return (
              <Link
                key={oid}
                to={`/product/revos/pipeline?opportunityId=${encodeURIComponent(
                  itemId
                )}&source=revenue_intelligence`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-bg-primary/80 hover:border-accent/60 hover:text-accent text-[11px] text-text-primary transition-colors"
                title={`Open Pipeline Assessment for ${label}`}
              >
                <span className="truncate max-w-[200px]">{label}</span>
                <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-70" />
              </Link>
            );
          }
          return (
            <span
              key={oid}
              className="inline-flex items-center px-2 py-0.5 rounded-md border border-border/60 bg-bg-primary/50 text-[11px] font-mono text-text-secondary"
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const renderCodeReferences = (label: string, codes: string[]) => {
    const clean = Array.from(new Set(codes.filter(Boolean)));
    if (clean.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-text-secondary">
        <span className="uppercase tracking-wider">{label}:</span>
        {clean.map((code, idx) => (
          <span
            key={`${code}-${idx}`}
            className="px-1.5 py-0.5 rounded bg-bg-primary border border-border/70 text-text-primary"
          >
            {code}
          </span>
        ))}
      </div>
    );
  };

  const tabCounts = useMemo(() => {
    if (!report) {
      return { ALL: 0, FINDINGS: 0, WEAKNESSES: 0, RISKS: 0, IMPROVEMENTS: 0, RECOMMENDATIONS: 0 };
    }
    const findings = report.key_pipeline_findings.length;
    const weaknesses = report.recurring_pipeline_weaknesses.length;
    const risks = report.emerging_pipeline_risks.length;
    const improvements = report.pipeline_improvement_opportunities.length;
    const recommendations = report.strategic_management_recommendations.length;
    return {
      ALL: findings + weaknesses + risks + improvements + recommendations,
      FINDINGS: findings,
      WEAKNESSES: weaknesses,
      RISKS: risks,
      IMPROVEMENTS: improvements,
      RECOMMENDATIONS: recommendations
    };
  }, [report]);

  const showSection = (key: Exclude<InsightTabKey, 'ALL'>) =>
    activeTab === 'ALL' || activeTab === key;

  return (
    <section
      aria-label="Revenue Intelligence Insights"
      className="p-5 sm:p-6 rounded-2xl border border-border bg-bg-surface shadow-sm space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Revenue Intelligence Insights
            </h3>
            {report && (
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  report.analysis_status === 'ready'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                    : report.analysis_status === 'partial'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                      : 'border-border bg-bg-primary text-text-secondary'
                }`}
              >
                {report.analysis_status === 'ready'
                  ? 'Portfolio Verified'
                  : report.analysis_status === 'partial'
                    ? 'Partial Coverage'
                    : 'Insufficient Data'}
              </span>
            )}
            {report && isSavedReport && !isStale && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-500">
                <BookmarkCheck className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">
            Portfolio-level strategic reasoning across completed Pipeline Assessments ·{' '}
            <span className="font-mono text-text-primary">
              {portfolioContext.portfolio_context.assessed_opportunity_count}/
              {portfolioContext.portfolio_context.included_opportunity_count} assessed
            </span>
          </p>
        </div>

        {/* Timestamp + Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-primary/60 text-[11px] font-mono text-text-secondary"
            title={reportSavedAt ? `Last saved: ${formatTimestampLabel(reportSavedAt)}` : undefined}
          >
            <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>
              {reportGeneratedAt
                ? `Generated ${formatTimestampLabel(reportGeneratedAt)}`
                : 'Not yet generated'}
            </span>
          </div>

          {report && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || generating}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSavedReport
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15'
                  : 'border-accent/60 bg-accent/15 text-accent hover:bg-accent/25'
              }`}
              title="Save this Revenue Intelligence report to Supabase so it loads directly on future visits"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveFeedback || isSavedReport ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{saveFeedback || 'Saved'}</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleGenerate(Boolean(report))}
            disabled={generating || dashboardLoading || isEmptyPortfolio}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-black text-xs font-black hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing Portfolio...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{report ? 'Regenerate Insights' : 'Generate Insights'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Setup / Non-blocking Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Revenue Intelligence Request Error</div>
              <p className="text-[11px] text-text-secondary mt-0.5">{errorMsg}</p>
              {errorMsg.includes('Unknown action:') && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Your live Supabase <code className="font-mono">pipeline-assessment</code> Edge Function is still running an older deployed copy. Download or copy the updated{' '}
                  <code className="font-mono">supabase/functions/pipeline-assessment/index.ts</code> from this workspace and redeploy it to the active Supabase project.
                </p>
              )}
              {(errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Gemini reported temporary high demand (503). Wait a few seconds and click Retry Analysis — if your Edge Function has the latest update deployed, it automatically fails over across fallback Gemini models.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-bg-surface text-text-primary text-[11px] font-bold hover:border-red-400 transition-colors shrink-0 cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {!storageReady && !errorMsg && (
        <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 flex items-start gap-2.5 text-[11px] text-text-secondary">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Supabase persistence table <code className="font-mono text-text-primary">pipeline_revenue_intelligence_reports</code> is pending SQL migration. You can still generate insights now; run the migration script to enable saving across sessions.
          </span>
        </div>
      )}

      {/* Stale Result Banner */}
      {isStale && !generating && (
        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <FileWarning className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-text-primary">
                Stale Portfolio Intelligence — Scope or Assessments Changed
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                This saved report was generated on{' '}
                <strong className="text-text-primary">{formatTimestampLabel(reportGeneratedAt)}</strong>{' '}
                under a different filter scope or earlier assessment state. Regenerate to analyze the current{' '}
                {portfolioContext.portfolio_context.included_opportunity_count} opportunities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-[11px] font-bold shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate for Current Scope
          </button>
        </div>
      )}

      {/* Main Body State Machine */}
      {generating ? (
        <div className="space-y-4 py-2" aria-busy="true">
          <div className="p-5 rounded-xl border border-border/70 bg-bg-primary/50 animate-pulse space-y-3">
            <div className="h-4 w-48 bg-border/60 rounded" />
            <div className="h-3 w-full bg-border/40 rounded" />
            <div className="h-3 w-5/6 bg-border/40 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-border/30" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 rounded-xl border border-border/60 bg-bg-primary/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : loadingSaved ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs font-mono text-text-secondary">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          <span>Checking saved Revenue Intelligence reports...</span>
        </div>
      ) : isEmptyPortfolio && !report ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-border rounded-xl bg-bg-primary/40">
          <Layers className="h-6 w-6 text-text-secondary/60 mx-auto" />
          <div className="text-xs font-bold text-text-primary">
            No Opportunities in Current Filter Scope
          </div>
          <p className="text-[11px] text-text-secondary max-w-md mx-auto">
            Adjust or clear your global filters above to include opportunities, then generate portfolio Revenue Intelligence.
          </p>
        </div>
      ) : isZeroAssessed && !report ? (
        <div className="py-10 px-4 text-center space-y-2 border border-dashed border-amber-500/40 rounded-xl bg-amber-500/5">
          <FileWarning className="h-6 w-6 text-amber-400 mx-auto" />
          <div className="text-xs font-bold text-text-primary">
            Insufficient Assessed Opportunities in Scope
          </div>
          <p className="text-[11px] text-text-secondary max-w-lg mx-auto">
            {portfolioContext.portfolio_context.included_opportunity_count} opportunity record(s) match your active scope, but none have completed PADF assessments yet. Complete at least one assessment to generate cross-opportunity Revenue Intelligence.
          </p>
        </div>
      ) : !report ? (
        <div className="p-6 rounded-xl border border-dashed border-border bg-bg-primary/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-accent" />
              Ready to Synthesize Portfolio Revenue Intelligence
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Analyze collective PADF patterns, recurring weaknesses, formal risk exposure, and strategic priorities across{' '}
              <strong className="text-text-primary">
                {portfolioContext.portfolio_context.assessed_opportunity_count} assessed
              </strong>{' '}
              opportunities ({scopeDescription}). Generated insights can be saved to Supabase for instant review on subsequent visits.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-black text-xs font-black hover:bg-accent-hover transition-colors shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate Revenue Intelligence</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Partial Coverage Advisory */}
          {report.analysis_status === 'partial' && (
            <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 flex items-start gap-2.5 text-[11px] text-text-secondary">
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-primary">Partial Portfolio Coverage:</strong>{' '}
                {report.analysis_context.assessment_coverage_note ||
                  'Some analytical domains or opportunities have incomplete data. Expand Data Quality Notes below for scope caveats.'}
              </div>
            </div>
          )}

          {/* A. Executive Summary Prominence Block */}
          <div className="p-5 rounded-xl border border-accent/30 bg-bg-primary/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-border/60 pb-3">
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                  Executive Summary · {report.analysis_context.portfolio_scope}
                </div>
                <h4 className="text-base font-black text-text-primary tracking-tight leading-snug">
                  {report.executive_summary.headline}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-text-secondary shrink-0 tabular-nums">
                {report.analysis_context.assessed_opportunity_count ?? 0}/
                {report.analysis_context.included_opportunity_count ?? 0} assessed
              </span>
            </div>

            <p className="text-xs text-text-primary leading-relaxed">
              {report.executive_summary.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-border/70 bg-bg-surface space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Most Important Finding
                </div>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {report.executive_summary.most_important_finding || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-bg-surface space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Main Vulnerability
                </div>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {report.executive_summary.main_vulnerability || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-bg-surface space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Improvement Opportunity
                </div>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {report.executive_summary.improvement_opportunity || '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-bg-surface space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Management Focus
                </div>
                <p className="text-[11px] text-text-primary leading-relaxed">
                  {report.executive_summary.management_focus || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          {report.analysis_status !== 'insufficient_data' && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
              {(
                [
                  { key: 'FINDINGS', label: `Key Findings (${tabCounts.FINDINGS})` },
                  { key: 'WEAKNESSES', label: `Recurring Weaknesses (${tabCounts.WEAKNESSES})` },
                  { key: 'RISKS', label: `Emerging Risks (${tabCounts.RISKS})` },
                  { key: 'IMPROVEMENTS', label: `Improvements (${tabCounts.IMPROVEMENTS})` },
                  { key: 'RECOMMENDATIONS', label: `Recommendations (${tabCounts.RECOMMENDATIONS})` },
                  { key: 'ALL', label: `All Insights (${tabCounts.ALL})` }
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-accent text-black'
                        : 'bg-bg-primary/60 border border-border/70 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 5 Analytical Categories */}
          {report.analysis_status !== 'insufficient_data' && (
            <div className="space-y-6">
              {/* 1. Key Pipeline Findings */}
              {showSection('FINDINGS') && report.key_pipeline_findings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                    Key Pipeline Findings ({report.key_pipeline_findings.length})
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {report.key_pipeline_findings.map((item) => (
                      <div
                        key={item.insight_id}
                        className="p-4 rounded-xl border border-border/70 border-l-4 border-l-sky-400 bg-bg-primary/40 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-xs text-text-primary leading-snug">
                              {item.title}
                            </div>
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                                item.support_level === 'strong'
                                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                  : item.support_level === 'limited'
                                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                    : 'border-sky-500/40 text-sky-400 bg-sky-500/10'
                              }`}
                            >
                              {item.support_level} support
                            </span>
                          </div>
                          <p className="text-[11px] text-text-primary leading-relaxed">
                            {item.finding}
                          </p>
                          <div className="text-[11px] text-text-secondary leading-relaxed border-t border-border/50 pt-2">
                            <strong className="text-text-primary">Implication:</strong>{' '}
                            {item.business_implication}
                          </div>
                          {item.limitations && (
                            <p className="text-[10px] font-mono text-amber-400/90">
                              Caveat: {item.limitations}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-border/40">
                          {renderOpportunityLinks(item.affected_opportunity_ids)}
                          {renderCodeReferences('PADF', item.padf_dimensions)}
                          {renderCodeReferences('Risks', item.risk_ids)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Recurring Pipeline Weaknesses */}
              {showSection('WEAKNESSES') && report.recurring_pipeline_weaknesses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Recurring Pipeline Weaknesses ({report.recurring_pipeline_weaknesses.length})
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {report.recurring_pipeline_weaknesses.map((item) => (
                      <div
                        key={item.insight_id}
                        className="p-4 rounded-xl border border-border/70 border-l-4 border-l-amber-400 bg-bg-primary/40 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-xs text-text-primary leading-snug">
                              {item.title}
                            </div>
                            {item.affected_opportunity_count !== null && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0 tabular-nums">
                                {item.affected_opportunity_count} deals affected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-primary leading-relaxed">
                            {item.weakness_description}
                          </p>
                          <div className="text-[11px] text-text-secondary leading-relaxed border-t border-border/50 pt-2">
                            <strong className="text-text-primary">Business Implication:</strong>{' '}
                            {item.business_implication}
                          </div>
                          <div className="text-[11px] text-text-secondary leading-relaxed">
                            <strong className="text-accent">Management Attention:</strong>{' '}
                            {item.management_attention}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-border/40">
                          {renderOpportunityLinks(item.affected_opportunity_ids)}
                          {renderCodeReferences('PADF', item.padf_dimensions)}
                          {renderCodeReferences('Evidence', item.evidence_ids)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Emerging Pipeline Risks */}
              {showSection('RISKS') && report.emerging_pipeline_risks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                    Emerging Pipeline Risks ({report.emerging_pipeline_risks.length})
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {report.emerging_pipeline_risks.map((item) => (
                      <div
                        key={item.insight_id}
                        className="p-4 rounded-xl border border-border/70 border-l-4 border-l-red-400 bg-bg-primary/40 space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-xs text-text-primary leading-snug">
                              {item.title}
                            </div>
                            {item.revenue_exposure !== null && (
                              <span className="text-[10px] font-mono font-bold text-red-400 shrink-0 tabular-nums">
                                Exposure: {formatCompactMoney(item.revenue_exposure, primaryCurrency)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-primary leading-relaxed">
                            {item.risk_pattern}
                          </p>
                          <div className="text-[11px] text-text-secondary leading-relaxed border-t border-border/50 pt-2">
                            <strong className="text-text-primary">Implication:</strong>{' '}
                            {item.business_implication}
                          </div>
                          {item.existing_mitigation_references.length > 0 && (
                            <div className="text-[10px] text-text-secondary">
                              <strong className="text-text-primary">Existing Mitigations:</strong>{' '}
                              {item.existing_mitigation_references.join(' · ')}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-border/40">
                          {renderOpportunityLinks(item.affected_opportunity_ids)}
                          {renderCodeReferences('Risk IDs', item.existing_risk_ids)}
                          {renderCodeReferences('PADF', item.padf_dimensions)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Pipeline Improvement Opportunities */}
              {showSection('IMPROVEMENTS') &&
                report.pipeline_improvement_opportunities.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                      Pipeline Improvement Opportunities (
                      {report.pipeline_improvement_opportunities.length})
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                      {report.pipeline_improvement_opportunities.map((item) => (
                        <div
                          key={item.insight_id}
                          className="p-4 rounded-xl border border-border/70 border-l-4 border-l-emerald-400 bg-bg-primary/40 space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="font-bold text-xs text-text-primary leading-snug">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-text-primary leading-relaxed">
                              {item.improvement_description}
                            </p>
                            <div className="text-[11px] text-text-secondary leading-relaxed border-t border-border/50 pt-2">
                              <strong className="text-emerald-400">Expected Benefit:</strong>{' '}
                              {item.expected_business_benefit}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-border/40">
                            {renderOpportunityLinks(item.affected_opportunity_ids)}
                            {renderCodeReferences('Strategies', item.existing_strategy_ids)}
                            {renderCodeReferences('Actions', item.existing_action_ids)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* 5. Strategic Management Recommendations */}
              {showSection('RECOMMENDATIONS') &&
                report.strategic_management_recommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-accent" />
                      Strategic Management Recommendations (
                      {report.strategic_management_recommendations.length})
                    </h4>
                    <div className="space-y-3">
                      {report.strategic_management_recommendations.map((item, idx) => (
                        <div
                          key={item.insight_id}
                          className="p-4 rounded-xl border border-border/70 border-l-4 border-l-accent bg-bg-primary/40 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-bold text-xs text-text-primary leading-snug">
                              {idx + 1}. {item.recommendation}
                            </div>
                          </div>
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            <strong className="text-text-primary">Rationale:</strong>{' '}
                            {item.strategic_rationale}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                            <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60">
                              <span className="text-[10px] font-mono uppercase text-accent font-bold block mb-0.5">
                                Suggested Management Focus
                              </span>
                              <span className="text-text-primary">{item.suggested_management_focus}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60">
                              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-0.5">
                                Expected Business Implication
                              </span>
                              <span className="text-text-primary">
                                {item.expected_business_implication}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-border/40">
                            {renderOpportunityLinks(item.affected_opportunity_ids)}
                            {renderCodeReferences('Strategies', item.existing_strategy_ids)}
                            {renderCodeReferences('Actions', item.existing_action_ids)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Data Quality Notes & Analysis Limitations Collapsible */}
          <div className="border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={() => setShowLimitations((prev) => !prev)}
              className="flex items-center justify-between w-full text-left text-[11px] font-mono font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                {showLimitations ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Data Quality Notes &amp; Analysis Limitations (
                {report.data_quality_and_limitations.length +
                  report.overall_analysis_limitations.length}
                )
              </span>
            </button>

            {showLimitations && (
              <div className="mt-3 p-4 rounded-xl border border-border/70 bg-bg-primary/50 space-y-3 text-[11px]">
                {report.analysis_context.assessment_coverage_note && (
                  <p className="text-text-secondary">
                    <strong className="text-text-primary">Coverage:</strong>{' '}
                    {report.analysis_context.assessment_coverage_note}
                  </p>
                )}

                {report.data_quality_and_limitations.length > 0 && (
                  <div className="space-y-2">
                    {report.data_quality_and_limitations.map((lim, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-border/60 bg-bg-surface space-y-0.5"
                      >
                        <div className="font-bold text-text-primary">
                          {lim.issue}{' '}
                          {lim.affected_analysis_area && (
                            <span className="text-[10px] font-mono font-normal text-text-secondary">
                              ({lim.affected_analysis_area})
                            </span>
                          )}
                        </div>
                        <div className="text-text-secondary">{lim.implication}</div>
                      </div>
                    ))}
                  </div>
                )}

                {report.overall_analysis_limitations.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 text-text-secondary">
                    {report.overall_analysis_limitations.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
