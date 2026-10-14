import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  ShieldAlert, 
  ArrowRight, 
  HelpCircle, 
  Compass, 
  Info,
  Calendar,
  Filter,
  BarChart3,
  Lightbulb,
  ExternalLink,
  Save,
  Database
} from 'lucide-react';
import { MQLLead, MQLQualificationResult, MQLCampaign } from '../../types/mql';
import { 
  QualificationIntelligenceService, 
  SavedQualificationInsightsRecord,
  AnalysisScope,
  DashboardMetricsProps
} from '../services/qualificationIntelligenceService';
import { SQLDataService } from '../services/sqlDataService';
import { OpportunityDataService } from '../services/opportunityDataService';

interface QualificationIntelligenceSectionProps {
  campaigns: MQLCampaign[];
  selectedCampaignId: string;
  campaign?: MQLCampaign | null;
  leads: MQLLead[];
  qualResults: MQLQualificationResult[];
  mqlPromotions: any[];
  oppPromotions: any[];
  dashboardMetrics?: DashboardMetricsProps;
}

export const QualificationIntelligenceSection: React.FC<QualificationIntelligenceSectionProps> = ({
  campaigns,
  selectedCampaignId,
  campaign,
  leads,
  qualResults,
  mqlPromotions,
  oppPromotions,
  dashboardMetrics
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRecord, setSavedRecord] = useState<SavedQualificationInsightsRecord | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Active Scope definition based on Master Filter
  const currentScope: AnalysisScope = {
    campaign_id: selectedCampaignId || 'all',
    campaign_name: selectedCampaignId === 'all' || !campaign 
      ? 'All Campaigns (Account-Wide)' 
      : campaign.name,
    industry: campaign?.industry || (selectedCampaignId === 'all' ? 'All Target Industries' : 'Cross-Industry'),
    revenue_motion: campaign?.revenue_motion || (selectedCampaignId === 'all' ? 'All Revenue Motions' : 'Standard Motion')
  };

  // Load existing saved insights on mount or when campaign filter changes
  useEffect(() => {
    let isMounted = true;

    const loadSaved = async () => {
      try {
        setError(null);
        setSaveError(null);
        const record = await QualificationIntelligenceService.getSavedInsights(currentScope.campaign_id);
        if (isMounted) {
          setSavedRecord(record);
          setInitialLoaded(true);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Failed to load saved executive insights:', err);
          setInitialLoaded(true);
        }
      }
    };

    loadSaved();

    return () => {
      isMounted = false;
    };
  }, [currentScope.campaign_id]);

  // Handle Manual Save to Database
  const handleSaveToDatabase = async () => {
    if (!savedRecord) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await QualificationIntelligenceService.saveInsights(savedRecord);
      if (res.success) {
        setSaveSuccess(true);
        setSavedRecord(prev => prev ? {
          ...prev,
          id: res.id || prev.id,
          persisted_to_db: true,
          db_error: undefined
        } : null);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(res.error || 'Failed to save into Supabase database. Please ensure table RLS policy is enabled.');
      }
    } catch (err: any) {
      console.error('Error saving insights to database:', err);
      setSaveError(err?.message || 'Failed to save insights to database.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Generate Insights Click
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Fetch additional context data (SQL assessments & Opportunity sessions)
      const [sqlOpportunities, allOppSessions] = await Promise.all([
        SQLDataService.getOpportunities().catch(() => []),
        OpportunityDataService.getAllSessions ? OpportunityDataService.getAllSessions().catch(() => []) : Promise.resolve([])
      ]);

      // 2. Calculate authoritative metrics strictly from filter-scoped data and dashboard metrics
      const { 
        authoritativeMetrics, 
        supportingEvidence, 
        qualificationResultsSummary, 
        dataCoverage 
      } = QualificationIntelligenceService.calculateAuthoritativeMetrics(
        currentScope,
        leads,
        qualResults,
        mqlPromotions,
        oppPromotions,
        sqlOpportunities,
        allOppSessions,
        dashboardMetrics
      );

      // 3. Invoke Gemini reasoning engine via Edge Function & Persist
      const newRecord = await QualificationIntelligenceService.generateInsights(
        currentScope,
        authoritativeMetrics,
        qualificationResultsSummary,
        supportingEvidence,
        dataCoverage
      );

      setSavedRecord(newRecord);
      if (!newRecord.persisted_to_db && newRecord.db_error) {
        setSaveError(newRecord.db_error);
      }
    } catch (err: any) {
      console.error('Error generating qualification executive insights:', err);
      setError(err?.message || 'Failed to generate qualification executive insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Detect Scope Mismatch:
  // If the currently displayed insights belong to a different campaign scope than the active master filter
  const isScopeMismatched = savedRecord && savedRecord.scope_campaign_id !== currentScope.campaign_id;

  const insights = savedRecord?.insights_data;

  // Format timestamp nicely
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Never generated';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-surface shadow-sm overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-bg-surface via-bg-surface to-accent/[0.03]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/25 text-accent shadow-sm">
                <BrainCircuit className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-wider font-sans flex items-center gap-2">
                Qualification Intelligence — Executive Insights
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-accent/15 text-accent border border-accent/20">
                AI CRO Synthesis
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              Cross-module strategic intelligence analyzing MQL, SQL, and Opportunity qualification outcomes, progression yield, and dimensional risk patterns.
            </p>
          </div>

          {/* Action button & Last generated badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            {savedRecord && (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-primary/60 border border-border/80 text-[11px] font-mono text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-secondary/70" />
                  <span>Generated: <strong className="text-text-primary">{formatTimestamp(savedRecord.generated_at)}</strong></span>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono border ${
                  savedRecord.persisted_to_db 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                }`}>
                  <Database className="h-3.5 w-3.5" />
                  <span>{savedRecord.persisted_to_db ? 'Supabase Synced' : 'Local Cache'}</span>
                </div>

                {/* Dedicated Manual Save Button */}
                <button
                  onClick={handleSaveToDatabase}
                  disabled={saving || loading}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all duration-200 flex items-center gap-1.5 shadow-sm select-none font-sans ${
                    saveSuccess
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : saving
                      ? 'bg-bg-primary/80 border border-border text-text-secondary cursor-wait'
                      : 'bg-bg-primary hover:bg-bg-surface border border-border text-text-primary hover:border-accent/40 active:scale-[0.98] cursor-pointer'
                  }`}
                  title="Manually save generated intelligence to dedicated Supabase database table"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />
                      <span>Saving to DB...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Saved to Supabase</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 text-accent" />
                      <span>Save to Database</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer select-none font-sans ${
                loading
                  ? 'bg-accent/40 text-white cursor-wait'
                  : 'bg-accent hover:bg-accent/90 active:scale-[0.98] text-white hover:shadow-md hover:shadow-accent/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{savedRecord ? 'Regenerate Insights' : 'Generate Insights'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Scope Ribbon */}
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2.5 text-[11px] font-mono">
          <span className="text-text-secondary flex items-center gap-1 font-bold">
            <Filter className="h-3 w-3 text-accent" />
            Active Scope:
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-bg-primary border border-border font-bold text-text-primary">
            {currentScope.campaign_name}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-bg-primary border border-border text-text-secondary">
            Industry: <strong className="text-text-primary">{currentScope.industry}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-bg-primary border border-border text-text-secondary">
            Motion: <strong className="text-text-primary">{currentScope.revenue_motion}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-bg-primary border border-border text-text-secondary">
            Scoped Leads: <strong className="text-text-primary">{leads.length}</strong>
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-bg-primary border border-border text-text-secondary">
            MQL Assessed: <strong className="text-text-primary">{qualResults.length}</strong>
          </span>
        </div>
      </div>

      {/* Save Error / RLS Notice Banner */}
      {saveError && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-5 py-3 flex items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-sans">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Supabase Storage Notice:</strong> {saveError} (Run the updated <code>20261014_qualification_executive_insights.sql</code> script in Supabase SQL Editor to grant table permissions).
            </span>
          </div>
          <button
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-colors shrink-0 cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Scope Mismatch Notification Banner */}
      {isScopeMismatched && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-5 py-3 flex items-start sm:items-center justify-between gap-3 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2 text-xs font-sans">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Scope Mismatch Detected:</strong> Current filters target <strong>"{currentScope.campaign_name}"</strong>, but the insights below reflect <strong>"{savedRecord.scope_campaign_name}"</strong> ({formatTimestamp(savedRecord.generated_at)}). Regeneration is recommended.
            </span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-colors shrink-0 cursor-pointer"
          >
            Update Insights
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-5 bg-red-500/10 border-b border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-sans">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button 
            onClick={handleGenerate} 
            className="font-bold underline cursor-pointer text-xs hover:text-red-700"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Content Body */}
      <div className="p-5 space-y-6">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 py-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 border border-accent/25 animate-pulse mb-3">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wide">
              Analyzing Qualification Records with Gemini...
            </h4>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Aggregating MQL, SQL, and Opportunity dimensional evidence, testing cross-module progression rates, and identifying pipeline bottlenecks.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !insights && initialLoaded && (
          <div className="py-10 px-4 text-center rounded-xl bg-bg-primary/30 border border-dashed border-border">
            <Compass className="h-10 w-10 mx-auto text-accent/50 mb-3" />
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wide">
              Executive Insights Ready for Synthesis
            </h4>
            <p className="text-xs text-text-secondary mt-1.5 max-w-lg mx-auto leading-relaxed">
              Click <strong>"Generate Insights"</strong> to trigger the Gemini reasoning engine. The analysis will synthesize all assessed records across MQL, SQL, and Opportunity Qualification modules under scope <strong>"{currentScope.campaign_name}"</strong>.
            </p>
            <button
              onClick={handleGenerate}
              className="mt-4 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-sm hover:shadow-accent/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Executive Insights</span>
            </button>
          </div>
        )}

        {/* Display Insights */}
        {!loading && insights && (
          <div className="space-y-6">
            {/* 1. Executive Summary Box */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-accent/[0.06] to-accent/[0.02] border border-accent/30 shadow-inner">
              <div className="flex items-center gap-2 text-[10px] font-mono font-black text-accent uppercase tracking-widest mb-2">
                <Lightbulb className="h-3.5 w-3.5" />
                Strategic Synthesis
              </div>
              <p className="text-sm font-sans font-medium text-text-primary leading-relaxed">
                {insights.executive_summary}
              </p>
            </div>

            {/* 2. Key Findings Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-accent" />
                  Key Qualification Findings ({insights.key_findings?.length || 0})
                </h4>
                <span className="text-[10px] font-mono text-text-secondary">
                  Evidence-Grounded Observations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.key_findings?.map((finding, idx) => {
                  const isHypothesis = finding.finding_type === 'hypothesis';
                  const mod = (finding.module || '').toLowerCase();
                  const moduleColor = mod.includes('mql')
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                    : mod.includes('sql')
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';

                  return (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-bg-primary/50 border border-border/80 hover:border-accent/40 transition-all flex flex-col justify-between shadow-sm space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Header badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {finding.module && (
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase tracking-wider border ${moduleColor}`}>
                                {finding.module}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider ${
                              isHypothesis 
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20' 
                                : 'bg-accent/10 text-accent border border-accent/20'
                            }`}>
                              {isHypothesis ? 'Hypothesis' : 'Observed Pattern'}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase shrink-0 ${
                            finding.confidence === 'high' 
                              ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                              : finding.confidence === 'medium'
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                              : 'text-text-secondary bg-border/40'
                          }`}>
                            {finding.confidence} Confidence
                          </span>
                        </div>

                        <h5 className="text-xs font-black text-text-primary leading-snug font-sans">
                          {finding.title}
                        </h5>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {finding.observation}
                        </p>
                      </div>

                      {/* Business Implication */}
                      <div className="p-2.5 rounded-lg bg-bg-surface border border-border/60 text-[11px] font-sans">
                        <span className="font-bold text-text-primary block mb-0.5 text-[10px] uppercase tracking-wider font-mono">
                          Business Implication:
                        </span>
                        <span className="text-text-secondary leading-relaxed">
                          {finding.business_implication}
                        </span>
                      </div>

                      {/* Supporting Metrics */}
                      {finding.supporting_metrics && finding.supporting_metrics.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-border/40">
                          <span className="text-[9px] font-mono font-bold text-text-secondary uppercase">
                            Supporting Metrics:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {finding.supporting_metrics.map((m, mIdx) => (
                              <span 
                                key={mIdx} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-surface border border-border text-[10px] font-mono"
                              >
                                <span className="text-text-secondary">{m.metric_name}:</span>
                                <strong className="text-text-primary">{m.value}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence References */}
                      {finding.evidence_references && finding.evidence_references.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {finding.evidence_references.map((ref, rIdx) => (
                            <span 
                              key={rIdx} 
                              className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-accent/5 text-accent border border-accent/15"
                            >
                              [{ref}]
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Qualification Risks & Recommended Executive Actions (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Col: Qualification Risks */}
              <div className="p-4 rounded-xl bg-red-500/[0.02] border border-red-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-red-500/15">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wide font-sans">
                    Identified Qualification Risks ({insights.qualification_risks?.length || 0})
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {insights.qualification_risks?.map((risk, idx) => {
                    const rMod = (risk.module || risk.target_area || '').toLowerCase();
                    const riskModLabel = risk.module || risk.target_area;
                    return (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg bg-bg-surface border border-red-500/15 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 font-sans">
                            {risk.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {riskModLabel && (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20">
                                {riskModLabel}
                              </span>
                            )}
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                              {risk.confidence} Confidence
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          {risk.description}
                        </p>
                        {risk.evidence_references && risk.evidence_references.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {risk.evidence_references.map((ref, rIdx) => (
                              <span key={rIdx} className="text-[8px] font-mono px-1 py-0.2 rounded bg-border/40 text-text-secondary">
                                [{ref}]
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Recommended Executive Actions */}
              <div className="p-4 rounded-xl bg-green-500/[0.02] border border-green-500/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-green-500/15">
                  <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                  <h4 className="text-xs font-black text-text-primary uppercase tracking-wide font-sans">
                    Recommended Executive Actions ({insights.recommended_actions?.length || 0})
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {insights.recommended_actions?.map((action, idx) => {
                    const isHigh = action.priority === 'high';
                    return (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg bg-bg-surface border border-border shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase ${
                            isHigh 
                              ? 'bg-red-500/15 text-red-600 dark:text-red-300' 
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                          }`}>
                            {action.priority} Priority
                          </span>
                          <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold bg-accent/10 text-accent">
                            {action.target_area}
                          </span>
                        </div>
                        <h6 className="text-xs font-bold text-text-primary font-sans leading-snug">
                          {action.action}
                        </h6>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          <strong>Rationale:</strong> {action.rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Analysis Limitations Footnote */}
            {insights.limitations && insights.limitations.length > 0 && (
              <div className="p-3 rounded-xl bg-bg-primary/40 border border-border/60 flex items-start gap-2.5 text-[11px] text-text-secondary">
                <Info className="h-4 w-4 text-text-secondary/70 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-text-primary block">
                    Data Coverage & Analysis Governance:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-text-secondary">
                    {insights.limitations.map((lim, lIdx) => (
                      <li key={lIdx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
