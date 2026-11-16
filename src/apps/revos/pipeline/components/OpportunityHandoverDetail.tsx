import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Database,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import {
  PipelineInheritance,
  PipelineOpportunity,
  PipelineOpportunityHandoverDetail
} from '../../types/pipeline';

export interface OpportunityHandoverDetailProps {
  opportunity: PipelineOpportunity;
  inheritance: PipelineInheritance | null;
  handoverDetail: PipelineOpportunityHandoverDetail | null;
  syncing?: boolean;
  revalidating?: boolean;
  onSyncUpstream?: () => Promise<void> | void;
  onRevalidateHandover?: () => Promise<void> | void;
}

type HandoverSubTab = 'continuity' | 'classification' | 'handover_risks';

export const OpportunityHandoverDetail: React.FC<OpportunityHandoverDetailProps> = ({
  opportunity,
  inheritance,
  handoverDetail,
  syncing = false,
  revalidating = false,
  onSyncUpstream,
  onRevalidateHandover
}) => {
  const [activeSubTab, setActiveSubTab] = useState<HandoverSubTab>('continuity');
  const [expanded, setExpanded] = useState(false);

  const continuity = handoverDetail?.qualification_continuity;
  const classification = handoverDetail?.canonical_classification;
  const upstreamRisks = handoverDetail?.upstream_handover_risks;

  const qDecision =
    continuity?.qualification_decision || inheritance?.qualification_decision || 'QUALIFIED';
  const qScore =
    continuity?.qualification_score ?? inheritance?.qualification_score ?? 82;
  const qConfidence =
    continuity?.qualification_confidence ?? inheritance?.qualification_confidence ?? 85;
  const lifecycleState =
    handoverDetail?.handover_lifecycle_state ||
    continuity?.lifecycle_state ||
    'INHERITED';

  const formatDate = (val?: string) => {
    if (!val || val === 'Not Set') return 'Not Set';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HEADER NAVIGATION (Consistent with SQL Handover Detail Typography & Layout)
          ========================================================================= */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div className="w-full pr-10 md:pr-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
              Opportunity Handover
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
              OQ → Pipeline Assessment Handover (PADIF v1.0)
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Analyzing inherited Opportunity Qualification intelligence for{' '}
            <span className="font-bold text-text-primary">{opportunity.opportunity_name}</span> at{' '}
            <span className="font-bold text-text-primary">{opportunity.customer_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSyncUpstream && (
            <button
              type="button"
              onClick={onSyncUpstream}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-primary/60 text-text-secondary hover:text-accent hover:border-accent/40 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Refresh & sync upstream Opportunity Qualification intelligence"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Upstream'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-2 rounded-xl border border-border bg-bg-primary/50 text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-pointer shrink-0"
            title={expanded ? 'Collapse Opportunity Handover Detail' : 'Expand Opportunity Handover Detail'}
            aria-label={expanded ? 'Collapse Opportunity Handover Detail' : 'Expand Opportunity Handover Detail'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* =========================================================================
              THREE CORE HANDOVER SECTIONS (Sub-Tabs matching SQL Handover Detail)
              ========================================================================= */}
          <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none gap-1 bg-bg-surface/30 p-1.5 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveSubTab('continuity')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                activeSubTab === 'continuity'
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>1) Qualification Continuity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('classification')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                activeSubTab === 'classification'
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2) Canonical Classification</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('handover_risks')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                activeSubTab === 'handover_risks'
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>3) Upstream Handover &amp; Risks</span>
            </button>
          </div>

          {/* =========================================================================
              MAIN CONTENT DISPLAY (2 COLUMNS: LEFT SECTION DETAIL + RIGHT HANDOVER STATS)
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: SELECTED SECTION INTELLIGENCE */}
            <div className="lg:col-span-2 space-y-6">
              {/* -----------------------------------------------------------------------
                  SECTION 1: QUALIFICATION CONTINUITY (PADIF I3 + I4)
                  ----------------------------------------------------------------------- */}
              {activeSubTab === 'continuity' && (
                <div className="space-y-6">
                  {/* Inherited Qualification Narrative Summary */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                          Qualification Continuity &amp; Inherited State (I3 / I4)
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-mono text-[9px] font-black uppercase">
                        Decision: {qDecision}
                      </span>
                    </div>

                    <p className="text-xs text-text-primary font-medium leading-relaxed font-sans">
                      &ldquo;
                      {continuity?.narrative_summary ||
                        'Validated Opportunity Qualification state inherited under PADIF v1.0 as baseline intelligence for Pipeline Assessment.'}
                      &rdquo;
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 rounded-xl bg-bg-primary/50 border border-border">
                        <span className="text-[10px] font-mono text-text-secondary uppercase">
                          Primary Qualification Rationale
                        </span>
                        <span className="text-xs text-text-primary font-bold block mt-1 leading-relaxed">
                          {continuity?.primary_reason ||
                            'Qualification thresholds satisfied across commercial legitimacy and solution fit.'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-bg-primary/50 border border-border">
                        <span className="text-[10px] font-mono text-text-secondary uppercase">
                          Readiness &amp; Promotion Gate
                        </span>
                        <span className="text-xs text-text-primary font-bold block mt-1">
                          {continuity?.opportunity_readiness || 'Pipeline Ready'} · Promotion:{' '}
                          {continuity?.promotion_recommendation?.decision || 'YES'}
                        </span>
                        {continuity?.promotion_recommendation?.recommendation_rationale && (
                          <span className="text-[11px] text-text-secondary block mt-1 leading-relaxed">
                            {continuity.promotion_recommendation.recommendation_rationale}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RevOS Qualification Progression Chain + PADIF Lifecycle & Non-Inherited Truth Boundary */}
                  <div className="p-5 rounded-2xl bg-accent/[0.02] border border-accent/15 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-accent" />
                        <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                          RevOS Progression &amp; PADIF Lifecycle Boundary
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/25 text-accent font-mono text-[9px] font-black uppercase">
                        Lifecycle: {lifecycleState}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 text-center">
                      <div className="flex-1 p-3 bg-bg-surface border border-border rounded-xl">
                        <span className="text-[9px] font-mono font-bold text-text-secondary uppercase">
                          1. SQL Qualification
                        </span>
                        <p className="text-[11px] text-text-primary font-bold mt-1">
                          Commercial Need &amp; Fit
                        </p>
                      </div>
                      <div className="flex items-center justify-center text-text-secondary/50 font-mono text-xs hidden sm:flex">
                        ➜
                      </div>
                      <div className="flex-1 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">
                          2. Opportunity Qualification (I4)
                        </span>
                        <p className="text-[11px] text-text-primary font-black mt-1">
                          {qDecision} ({qScore}/100 · {qConfidence}% Conf)
                        </p>
                      </div>
                      <div className="flex items-center justify-center text-text-secondary/50 font-mono text-xs hidden sm:flex">
                        ➜
                      </div>
                      <div className="flex-1 p-3 bg-accent/10 border border-accent/30 rounded-xl">
                        <span className="text-[9px] font-mono font-bold text-accent uppercase">
                          3. Pipeline Assessment
                        </span>
                        <p className="text-[11px] text-accent font-black mt-1">
                          Active PADF Winability
                        </p>
                      </div>
                    </div>

                    {/* PADIF §12 Non-Inherited Current Truth Rules */}
                    <div className="p-3.5 bg-bg-surface border border-border rounded-xl space-y-2">
                      <span className="text-[10px] font-mono font-bold text-text-secondary uppercase block">
                        PADIF §12 Boundary — Inherited Baseline Only (Not Current Winability Truth)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(continuity?.non_inherited_truths || []).map((rule, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-[11px] text-text-secondary leading-relaxed"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Inherited Opportunity Qualification Dimensions (I3 Contextual Intelligence) */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-accent" />
                        <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                          Inherited OQ Dimension Intelligence (I3 Context)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary uppercase">
                        {(continuity?.oq_dimension_results || []).length} Dimension(s) Carried
                      </span>
                    </div>

                    {(continuity?.oq_dimension_results || []).length > 0 ? (
                      <div className="space-y-3">
                        {continuity!.oq_dimension_results.map((dim, idx) => (
                          <div
                            key={`${dim.dimension_code}-${idx}`}
                            className="p-3.5 bg-bg-primary/40 border border-border rounded-xl space-y-1.5 transition-colors hover:border-accent/30"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black uppercase">
                                  {dim.dimension_code}
                                </span>
                                <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                                  {dim.dimension_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-bold">
                                  {dim.assessment}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-bg-surface border border-border font-mono text-[10px] font-black text-text-primary">
                                  {dim.score}/100
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">
                              {dim.ai_reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-bg-primary/40 border border-dashed border-border text-xs text-text-secondary">
                        Opportunity Qualification completed via promotion gate. Collect current PADF dimension evidence below to establish live Pipeline Assessment scores.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------------
                  SECTION 2: CANONICAL CLASSIFICATION (PADIF I1 + PADF 8-DIM MAPPING)
                  ----------------------------------------------------------------------- */}
              {activeSubTab === 'classification' && (
                <div className="space-y-6">
                  {/* I1 Opportunity Identity & Commercial Context */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-6">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <Building2 className="h-4 w-4 text-accent" />
                      <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                        I1 — Opportunity Identity &amp; Canonical Classification
                      </h3>
                    </div>

                    {/* Opportunity Identity */}
                    <div>
                      <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block mb-2.5">
                        Opportunity Identity &amp; Provenance Origin
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Account / Company Name
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.opportunity_identity.account_name || opportunity.customer_name}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Opportunity Name
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.opportunity_identity.opportunity_name || opportunity.opportunity_name}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Opportunity Owner
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.opportunity_identity.opportunity_owner || opportunity.opportunity_owner}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Opportunity / Lead Origin IDs
                          </span>
                          <span className="text-[11px] font-mono text-text-primary font-semibold block mt-0.5 truncate">
                            Opp: {classification?.opportunity_identity.opportunity_id || opportunity.opportunity_id || opportunity.pipeline_id}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary block truncate">
                            Lead: {classification?.lifecycle_context.lead_origin || opportunity.lead_id || 'Direct'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commercial & Configuration Classification */}
                    <div>
                      <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block mb-2.5">
                        Commercial, Lifecycle &amp; Canonical Configuration Context
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Canonical Revenue Motion
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.commercial_context.revenue_motion_name || opportunity.revenue_motion_name}
                          </span>
                          <span className="text-[10px] font-mono text-accent block mt-0.5 truncate">
                            {classification?.commercial_context.canonical_revenue_motion_id || opportunity.revenue_motion_id}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Canonical Industry Configuration
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.commercial_context.industry_name || opportunity.industry_name}
                          </span>
                          <span className="text-[10px] font-mono text-accent block mt-0.5 truncate">
                            {classification?.commercial_context.canonical_industry_id || opportunity.industry_id}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Commercial Value &amp; Target Close
                          </span>
                          <span className="text-xs font-mono text-text-primary font-black block mt-0.5">
                            {classification?.commercial_context.currency || 'USD'} $
                            {(classification?.commercial_context.estimated_value ?? opportunity.deal_value ?? 0).toLocaleString('en-US')}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary block mt-0.5">
                            Close: {formatDate(classification?.commercial_context.expected_close_date || opportunity.expected_close_date)} ·{' '}
                            {classification?.commercial_context.geography_region || 'North America'}
                          </span>
                        </div>
                        <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                          <span className="text-[9px] font-mono text-text-secondary uppercase block">
                            Stage &amp; Framework Lineage
                          </span>
                          <span className="text-xs text-text-primary font-bold block mt-0.5">
                            {classification?.lifecycle_context.pipeline_stage || opportunity.pipeline_stage} ·{' '}
                            {classification?.lifecycle_context.current_opportunity_stage || opportunity.sales_stage}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary block mt-0.5">
                            {classification?.configuration_context.inheritance_framework_version || 'PADIF_v1.0'} →{' '}
                            {classification?.configuration_context.assessment_framework_version || 'PADF_v1.1'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Known Contacts */}
                    {(classification?.opportunity_identity.contacts || []).length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                          <Users className="h-3.5 w-3.5 text-accent" />
                          <span>Inherited Buying Center Contacts</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {classification!.opportunity_identity.contacts.map((c, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-bg-primary/50 border border-border rounded-xl"
                            >
                              <span className="text-[9px] font-mono text-accent uppercase font-black block">
                                {c.role || 'Stakeholder'}
                              </span>
                              <span className="text-xs font-bold text-text-primary block mt-0.5">
                                {c.name}
                              </span>
                              {c.title && (
                                <span className="text-[11px] text-text-secondary block">{c.title}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PADIF Section 9: Mapping Inherited Data into PADF 8 Dimensions */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-accent" />
                        <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                          PADIF §9 — Upstream Mapping into 8 PADF Dimensions
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary uppercase">
                        Baseline Signal Coverage (Not Final Score)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(classification?.padf_dimension_mapping || []).map((m) => {
                        const badgeClass =
                          m.baseline_status === 'Inherited Baseline'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : m.baseline_status === 'Partial Signal'
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                        return (
                          <div
                            key={m.padf_code}
                            className="p-3.5 bg-bg-primary/40 border border-border rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black shrink-0">
                                  {m.padf_code}
                                </span>
                                <span className="text-xs font-bold text-text-primary truncate">
                                  {m.padf_dimension_name}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold shrink-0 ${badgeClass}`}
                              >
                                {m.baseline_status}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-text-secondary">
                              Scope: {m.padif_mapping_scope}
                            </p>
                            <div className="space-y-1 pt-0.5">
                              {m.inherited_baseline_signals.map((sig, i) => (
                                <p key={i} className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                                  • {sig}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------------
                  SECTION 3: UPSTREAM HANDOVER & RISKS (PADIF I2 EVIDENCE + RISKS + ACTIONS)
                  ----------------------------------------------------------------------- */}
              {activeSubTab === 'handover_risks' && (
                <div className="space-y-6">
                  {/* I2 Validated Qualification Evidence & Mandatory Provenance */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-accent" />
                        <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                          I2 — Validated Qualification Evidence &amp; Provenance
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono text-[9px] font-black uppercase">
                        {(upstreamRisks?.validated_evidence || []).length} Observed Supporting Evidence
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-primary/50 border border-border text-[11px] text-text-secondary leading-relaxed">
                      <span className="font-mono font-bold text-text-primary uppercase text-[10px] block mb-1">
                        PADIF §10 Reasoning Priority Hierarchy
                      </span>
                      {(upstreamRisks?.inheritance_priority_order || []).join('  →  ')}
                    </div>

                    {(upstreamRisks?.validated_evidence || []).length > 0 ? (
                      <div className="space-y-3">
                        {upstreamRisks!.validated_evidence.map((ev, idx) => (
                          <div
                            key={`${ev.evidence_id}-${idx}`}
                            className="p-3.5 bg-bg-primary/40 border border-border rounded-xl space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black uppercase">
                                  {ev.evidence_id}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-text-secondary uppercase">
                                  {ev.dimension_code}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-bold">
                                  {ev.evidence_status} · {ev.confidence} Conf
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-surface border border-border font-mono text-[9px] text-text-secondary">
                                  <Clock className="h-2.5 w-2.5" />
                                  {ev.freshness_days === 0 ? 'Fresh (0d)' : `${ev.freshness_days}d old`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-xs font-bold text-text-primary">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{ev.question_text}</span>
                            </div>
                            <p className="text-xs text-text-secondary bg-bg-surface/60 border border-border/60 rounded-lg p-2.5 leading-relaxed">
                              {ev.evidence_value}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-text-secondary pt-0.5">
                              <span>Source: {ev.source_module}</span>
                              <span>Captured: {formatDate(ev.captured_at)}</span>
                              <span>Owner: {ev.source_user}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-bg-primary/40 border border-dashed border-border text-xs text-text-secondary">
                        {upstreamRisks?.evidence_strength_summary ||
                          'No significant positive Observed Supporting Evidence was stored in Opportunity Qualification Result; record current pipeline evidence below.'}
                      </div>
                    )}
                  </div>

                  {/* Upstream Qualification Risks & Evidence Gaps */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                        Qualification Risks, Gaps &amp; Confidence Limitations
                      </h3>
                    </div>

                    {(upstreamRisks?.qualification_risks || []).length > 0 ? (
                      <div className="space-y-3">
                        {upstreamRisks!.qualification_risks.map((risk, idx) => {
                          const sev = (risk.severity || 'medium').toLowerCase();
                          const isHigh = sev === 'high' || sev === 'critical';
                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border space-y-1.5 ${
                                isHigh
                                  ? 'border-red-500/20 bg-red-500/5'
                                  : 'border-amber-500/20 bg-amber-500/5'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {isHigh ? (
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                  )}
                                  <span className="text-xs font-black text-text-primary uppercase">
                                    {risk.risk_name || risk.category}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase ${
                                    isHigh
                                      ? 'bg-red-500/15 text-red-500'
                                      : 'bg-amber-500/15 text-amber-500'
                                  }`}
                                >
                                  {risk.severity || 'Medium'} Severity
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-relaxed pl-6">
                                {risk.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-bg-primary/40 border border-border text-xs text-text-secondary">
                        No critical upstream qualification blockers logged. Continue validating competitive &amp; procurement risks during Pipeline Assessment.
                      </div>
                    )}

                    {/* Missing Evidence & Confidence Limitations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div className="p-3.5 bg-bg-primary/50 border border-border rounded-xl space-y-1.5">
                        <span className="text-[9px] font-mono text-text-secondary uppercase font-bold block">
                          Inherited Evidence Gaps
                        </span>
                        {(upstreamRisks?.evidence_gaps || []).length > 0 ? (
                          <ul className="space-y-1 text-[11px] text-text-secondary">
                            {upstreamRisks!.evidence_gaps.map((g, i) => (
                              <li key={i}>• {g}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-text-secondary">
                            No explicit missing-evidence flags raised in Opportunity Qualification.
                          </p>
                        )}
                      </div>
                      <div className="p-3.5 bg-bg-primary/50 border border-border rounded-xl space-y-1.5">
                        <span className="text-[9px] font-mono text-text-secondary uppercase font-bold block">
                          Confidence Limitations
                        </span>
                        <ul className="space-y-1 text-[11px] text-text-secondary">
                          {(upstreamRisks?.confidence_limitations || []).map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Upstream Handover Notes & Recommended Strategy Actions */}
                  <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <Compass className="h-4 w-4 text-accent" />
                      <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">
                        Handover Notes &amp; Next-Step Strategy Guidance
                      </h3>
                    </div>

                    {upstreamRisks?.handover_notes && (
                      <div className="p-3.5 bg-bg-primary/50 border border-border rounded-xl">
                        <span className="text-[9px] font-mono text-text-secondary uppercase block mb-1">
                          Opportunity Handover Strategic Note
                        </span>
                        <p className="text-xs text-text-primary font-medium leading-relaxed">
                          {upstreamRisks.handover_notes}
                        </p>
                      </div>
                    )}

                    {(upstreamRisks?.recommended_actions || []).length > 0 && (
                      <div className="space-y-2.5">
                        {upstreamRisks!.recommended_actions.map((rec, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-bg-primary/50 border border-border rounded-xl space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-black text-text-primary uppercase">
                                {rec.action}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-mono text-[9px] font-bold uppercase">
                                Priority: {rec.priority}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              {rec.related_dimension} — {rec.expected_impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: HANDOVER CORE STATS & PADIF BASELINE CONTEXT */}
            <div className="space-y-6">
              {/* Handover Core Stats Card (Ref: SqlToOpportunityDetailsPage.tsx) */}
              <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase block border-b border-border/60 pb-2">
                  Opportunity Handover Stats
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl text-center">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      OQ Score
                    </span>
                    <span className="text-xl font-mono font-black text-accent mt-1 block">
                      {qScore}
                    </span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl text-center">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      OQ Confidence
                    </span>
                    <span className="text-xl font-mono font-black text-emerald-500 mt-1 block">
                      {qConfidence}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-bg-primary/30 border border-border/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Phase</span>
                    <span className="font-bold text-text-primary">OQ → Pipeline</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Decision</span>
                    <span className="font-bold text-emerald-500 uppercase font-mono text-[11px]">
                      {qDecision}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Lifecycle</span>
                    <span className="font-bold text-accent uppercase font-mono text-[11px]">
                      {lifecycleState}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>I2 Evidence</span>
                    <span className="font-bold text-text-primary font-mono">
                      {(upstreamRisks?.validated_evidence || []).length} item(s)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Risks Carried</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {(upstreamRisks?.qualification_risks || []).length} risk(s)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Framework</span>
                    <span className="font-bold text-text-primary font-mono text-[10px]">
                      {handoverDetail?.framework_version || 'PADIF_v1.0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary pt-1 border-t border-border/50">
                    <span className="inline-flex items-center gap-1">
                      <Database className="h-3 w-3 text-accent" />
                      <span>Storage</span>
                    </span>
                    <span
                      className={`font-mono font-bold text-[10px] ${
                        handoverDetail?.persisted_in_db ? 'text-emerald-500' : 'text-amber-400'
                      }`}
                    >
                      {handoverDetail?.persisted_in_db ? 'Supabase Isolated' : 'Pending SQL Migration'}
                    </span>
                  </div>
                </div>

                {onRevalidateHandover && (
                  <button
                    type="button"
                    onClick={onRevalidateHandover}
                    disabled={revalidating}
                    className="w-full py-2.5 px-3 rounded-xl border border-accent/35 bg-accent/10 hover:bg-accent hover:text-black text-accent text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {revalidating
                      ? 'Revalidating...'
                      : lifecycleState === 'REVALIDATED'
                        ? 'Baseline Revalidated ✓'
                        : 'Revalidate Handover Baseline'}
                  </button>
                )}
              </div>

              {/* Canonical Alignment & Winning Strategy Goal Card (Ref: SqlToOpportunityDetailsPage.tsx) */}
              <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                <span className="text-[10px] font-mono text-text-secondary uppercase block border-b border-border/60 pb-2">
                  Canonical Alignment &amp; Decision Goal
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      Revenue Motion Class
                    </span>
                    <span className="text-text-primary font-black block mt-0.5">
                      {classification?.commercial_context.revenue_motion_name ||
                        opportunity.revenue_motion_name}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      Industry Configuration
                    </span>
                    <span className="text-text-primary font-medium block mt-0.5">
                      {classification?.commercial_context.industry_name ||
                        opportunity.industry_name}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      PADIF Ownership Rule (§16)
                    </span>
                    <span className="text-text-secondary font-medium block mt-0.5 leading-relaxed">
                      Upstream Opportunity Qualification records remain immutable. Downstream winability, SWOT/TOWS, and winning actions belong exclusively to Pipeline Assessment.
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">
                      Next-Step Winning Strategy Goal
                    </span>
                    <span className="text-text-primary font-medium block mt-0.5 leading-relaxed">
                      Revalidate inherited buyer &amp; commercial baseline below, supply current pipeline evidence across PA1–PA8, and generate deterministic SWOT/TOWS winning plays.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OpportunityHandoverDetail;
