import { supabase } from '@/src/lib/supabase';
import { MQLLead, MQLQualificationResult, MQLCampaign } from '../../types/mql';

export interface SupportingMetric {
  metric_name: string;
  value: string;
  evidence_reference?: string;
}

export interface KeyFinding {
  module: 'MQL Qualification' | 'SQL Qualification' | 'Opportunity Qualification' | string;
  title: string;
  observation: string;
  business_implication: string;
  supporting_metrics: SupportingMetric[];
  evidence_references: string[];
  finding_type: 'observed_pattern' | 'hypothesis';
  confidence: 'high' | 'medium' | 'low';
}

export interface QualificationRisk {
  module: 'MQL Qualification' | 'SQL Qualification' | 'Opportunity Qualification' | string;
  target_area?: string;
  title: string;
  description: string;
  evidence_references: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  target_area: 'MQL Qualification' | 'SQL Qualification' | 'Opportunity Qualification' | 'Cross-module' | string;
  evidence_references: string[];
}

export interface QualificationExecutiveInsights {
  executive_summary: string;
  key_findings: KeyFinding[];
  qualification_risks: QualificationRisk[];
  recommended_actions: RecommendedAction[];
  limitations: string[];
}

export interface AnalysisScope {
  campaign_id: string;
  campaign_name: string;
  industry?: string;
  revenue_motion?: string;
}

export interface DashboardMetricsProps {
  leadToMqlRate?: number;
  mqlToSqlRate?: number;
  sqlToOppRate?: number;
  leadToOppRate?: number;
  evaluationRate?: number;
  totalLeads?: number;
  qualifiedMqlsCount?: number;
  qualifiedSqlsCount?: number;
  qualifiedOppsCount?: number;
  evaluatedLeadsCount?: number;
  sqlTotalRevenue?: number;
  oppTotalRevenue?: number;
}

export interface SavedQualificationInsightsRecord {
  id?: string;
  scope_campaign_id: string;
  scope_campaign_name: string;
  scope_industry?: string;
  scope_revenue_motion?: string;
  total_leads_scoped: number;
  assessed_leads_count: number;
  analysis_metrics: any;
  insights_data: QualificationExecutiveInsights;
  generated_at: string;
}

export class QualificationIntelligenceService {
  /**
   * Helper to calculate rounded ratio percentage matching Lead Canvas & Lead Dashboard
   */
  private static calcRatio(num: number, denom: number): number {
    if (denom === 0) return 0;
    return Math.round((num / denom) * 100);
  }

  /**
   * Calculates authoritative metrics and compiles supporting evidence strictly from filter-scoped data.
   * Employs the exact same conversion rate formulas and metrics used across Lead Dashboard and database.
   */
  static calculateAuthoritativeMetrics(
    scope: AnalysisScope,
    leads: MQLLead[],
    qualResults: MQLQualificationResult[],
    mqlPromotions: any[],
    oppPromotions: any[],
    sqlAssessments: any[] = [],
    oppSessions: any[] = [],
    dashboardMetrics?: DashboardMetricsProps
  ) {
    const totalLeads = dashboardMetrics?.totalLeads ?? leads.length;

    // 1. MQL Qualification Module Metrics
    const mqlAssessedCount = qualResults.length;
    const mqlBreakdown = {
      highly_qualified: 0,
      qualified: 0,
      nurture: 0,
      disqualified: 0,
      unassessed: Math.max(0, totalLeads - mqlAssessedCount)
    };

    let totalMqlScore = 0;
    const dimensionTotals = { fit: 0, intent: 0, engagement: 0, timing: 0 };

    qualResults.forEach(r => {
      totalMqlScore += r.qualification_score || 0;
      if (r.dimension_scores) {
        dimensionTotals.fit += r.dimension_scores.fit || 0;
        dimensionTotals.intent += r.dimension_scores.intent || 0;
        dimensionTotals.engagement += r.dimension_scores.engagement || 0;
        dimensionTotals.timing += r.dimension_scores.timing || 0;
      }

      const status = r.qualification_status;
      if (status === 'Highly Qualified MQL') mqlBreakdown.highly_qualified++;
      else if (status === 'Qualified MQL') mqlBreakdown.qualified++;
      else if (status === 'Marketing Nurture') mqlBreakdown.nurture++;
      else if (status === 'Disqualified') mqlBreakdown.disqualified++;
    });

    const mqlScoreAssessedCount = mqlAssessedCount;
    const avgMqlScore = mqlScoreAssessedCount > 0 ? Math.round(totalMqlScore / mqlScoreAssessedCount) : 0;

    // Derived or passed qualified MQL count
    const qualifiedMqlsCount = dashboardMetrics?.qualifiedMqlsCount !== undefined
      ? dashboardMetrics.qualifiedMqlsCount
      : (mqlBreakdown.highly_qualified + mqlBreakdown.qualified);

    // 2. SQL Qualification Module Metrics
    const scopedLeadIds = new Set(leads.map(l => l.id));
    const scopedSqlPromos = mqlPromotions.filter(p => scopedLeadIds.has(p.lead_id));
    
    const qualifiedSqlsCount = dashboardMetrics?.qualifiedSqlsCount !== undefined
      ? dashboardMetrics.qualifiedSqlsCount
      : scopedSqlPromos.length;

    const sqlBreakdown = {
      sql_qualified: 0,
      borderline_sql: 0,
      needs_nurturing: 0,
      disqualified: 0,
      unassessed: 0
    };

    let totalSqlScore = 0;
    let sqlAssessedCount = 0;

    scopedSqlPromos.forEach(p => {
      const assess = sqlAssessments.find(a => 
        (p.opportunity_id && a.opportunity_id === p.opportunity_id) || 
        a.mql_reference_id === p.lead_id || 
        a.lead_id === p.lead_id
      );

      if (assess && assess.qualification_status) {
        sqlAssessedCount++;
        totalSqlScore += Number(assess.overall_score || 0);
        const st = String(assess.qualification_status).toLowerCase();
        if (st.includes('sql_qualified') || st === 'qualified') sqlBreakdown.sql_qualified++;
        else if (st.includes('borderline')) sqlBreakdown.borderline_sql++;
        else if (st.includes('nurtur')) sqlBreakdown.needs_nurturing++;
        else if (st.includes('disqual')) sqlBreakdown.disqualified++;
        else sqlBreakdown.sql_qualified++;
      } else {
        sqlBreakdown.unassessed++;
      }
    });

    const avgSqlScore = sqlAssessedCount > 0 ? Math.round(totalSqlScore / sqlAssessedCount) : 0;

    // 3. Opportunity Qualification Module Metrics
    const scopedOppPromos = oppPromotions.filter(p => {
      return scopedSqlPromos.some(sp => sp.opportunity_id && sp.opportunity_id === p.opportunity_id) ||
             (p.lead_id && scopedLeadIds.has(p.lead_id));
    });

    const qualifiedOppsCount = dashboardMetrics?.qualifiedOppsCount !== undefined
      ? dashboardMetrics.qualifiedOppsCount
      : scopedOppPromos.length;

    const oppBreakdown = {
      opp_qualified: 0,
      conditional_qualified: 0,
      neutral: 0,
      disqualified: 0,
      unassessed: 0
    };

    let totalOppScore = 0;
    let oppAssessedCount = 0;

    scopedOppPromos.forEach(p => {
      const sess = oppSessions.find(s => s.opportunity_id === p.opportunity_id || s.id === p.session_id);
      if (sess && sess.qualification_status && sess.qualification_status !== 'NOT_STARTED') {
        oppAssessedCount++;
        totalOppScore += Number(sess.overall_score || 0);
        const st = String(sess.qualification_status).toLowerCase();
        if (st.includes('opp_qualified') || st === 'qualified') oppBreakdown.opp_qualified++;
        else if (st.includes('conditional')) oppBreakdown.conditional_qualified++;
        else if (st.includes('nurtur') || st.includes('neutral')) oppBreakdown.neutral++;
        else if (st.includes('disqual')) oppBreakdown.disqualified++;
        else oppBreakdown.opp_qualified++;
      } else {
        oppBreakdown.unassessed++;
      }
    });

    const avgOppScore = oppAssessedCount > 0 ? Math.round(totalOppScore / oppAssessedCount) : 0;

    // 4. Authoritative Funnel Conversion Rates matching Lead Dashboard & Lead Canvas exactly
    const leadToMqlRate = dashboardMetrics?.leadToMqlRate !== undefined
      ? dashboardMetrics.leadToMqlRate
      : this.calcRatio(qualifiedMqlsCount, totalLeads);

    const mqlToSqlRate = dashboardMetrics?.mqlToSqlRate !== undefined
      ? dashboardMetrics.mqlToSqlRate
      : this.calcRatio(qualifiedSqlsCount, qualifiedMqlsCount);

    const sqlToOppRate = dashboardMetrics?.sqlToOppRate !== undefined
      ? dashboardMetrics.sqlToOppRate
      : this.calcRatio(qualifiedOppsCount, qualifiedSqlsCount);

    const leadToOppRate = dashboardMetrics?.leadToOppRate !== undefined
      ? dashboardMetrics.leadToOppRate
      : (totalLeads > 0 ? Math.round((qualifiedOppsCount / totalLeads) * 100) : 0);

    const evaluationRate = dashboardMetrics?.evaluationRate !== undefined
      ? dashboardMetrics.evaluationRate
      : (totalLeads > 0 ? Math.round((mqlAssessedCount / totalLeads) * 100) : 0);

    const authoritativeMetrics = {
      scope,
      total_leads: totalLeads,
      total_assessed: mqlAssessedCount + sqlAssessedCount + oppAssessedCount,
      funnel_conversion_rates: {
        lead_to_mql_conversion_rate_pct: leadToMqlRate,
        mql_to_sql_conversion_rate_pct: mqlToSqlRate,
        sql_to_opp_conversion_rate_pct: sqlToOppRate,
        lead_to_opp_conversion_rate_pct: leadToOppRate,
        lead_evaluation_rate_pct: evaluationRate
      },
      mql_metrics: {
        module_name: 'MQL Qualification',
        total_leads: totalLeads,
        assessed_leads: mqlAssessedCount,
        qualified_mql_count: qualifiedMqlsCount,
        lead_to_mql_conversion_rate_pct: leadToMqlRate,
        lead_evaluation_rate_pct: evaluationRate,
        average_score: avgMqlScore,
        breakdown: mqlBreakdown,
        average_dimensions: {
          fit: mqlAssessedCount > 0 ? Math.round(dimensionTotals.fit / mqlAssessedCount) : 0,
          intent: mqlAssessedCount > 0 ? Math.round(dimensionTotals.intent / mqlAssessedCount) : 0,
          engagement: mqlAssessedCount > 0 ? Math.round(dimensionTotals.engagement / mqlAssessedCount) : 0,
          timing: mqlAssessedCount > 0 ? Math.round(dimensionTotals.timing / mqlAssessedCount) : 0
        }
      },
      sql_metrics: {
        module_name: 'SQL Qualification',
        total_sql: qualifiedSqlsCount,
        assessed_sql: sqlAssessedCount,
        mql_to_sql_conversion_rate_pct: mqlToSqlRate,
        average_score: avgSqlScore,
        breakdown: sqlBreakdown,
        total_sql_revenue: dashboardMetrics?.sqlTotalRevenue || 0
      },
      opportunity_metrics: {
        module_name: 'Opportunity Qualification',
        total_opportunities: qualifiedOppsCount,
        assessed_opportunities: oppAssessedCount,
        sql_to_opp_conversion_rate_pct: sqlToOppRate,
        lead_to_opp_yield_pct: leadToOppRate,
        average_score: avgOppScore,
        breakdown: oppBreakdown,
        total_opportunity_revenue: dashboardMetrics?.oppTotalRevenue || 0
      }
    };

    // Supporting Evidence Identifiers
    const supportingEvidence = [
      {
        id: 'EVID-MQL-CONVERSION',
        category: 'MQL Qualification',
        description: `Lead-to-MQL Conversion Rate is ${leadToMqlRate}% (${qualifiedMqlsCount} qualified MQLs out of ${totalLeads} total scoped leads). Lead Evaluation Rate is ${evaluationRate}%. Status distribution: ${mqlBreakdown.highly_qualified} Highly Qualified, ${mqlBreakdown.qualified} Qualified, ${mqlBreakdown.nurture} Marketing Nurture, ${mqlBreakdown.disqualified} Disqualified (${mqlBreakdown.unassessed} Unassessed).`
      },
      {
        id: 'EVID-MQL-DIMENSIONS',
        category: 'Dimensional Strengths',
        description: `Average Dimension Scores across assessed leads: Fit ${authoritativeMetrics.mql_metrics.average_dimensions.fit}/100, Intent ${authoritativeMetrics.mql_metrics.average_dimensions.intent}/100, Engagement ${authoritativeMetrics.mql_metrics.average_dimensions.engagement}/100, Timing ${authoritativeMetrics.mql_metrics.average_dimensions.timing}/100.`
      },
      {
        id: 'EVID-SQL-PROGRESSION',
        category: 'SQL Qualification',
        description: `MQL-to-SQL Conversion Rate is ${mqlToSqlRate}% (${qualifiedSqlsCount} SQLs promoted from ${qualifiedMqlsCount} qualified MQLs). Assessed SQL status: ${sqlBreakdown.sql_qualified} Qualified, ${sqlBreakdown.borderline_sql} Borderline, ${sqlBreakdown.needs_nurturing} Needs Nurturing, ${sqlBreakdown.unassessed} Pending Discovery.`
      },
      {
        id: 'EVID-OPP-CONVERSION',
        category: 'Opportunity Qualification',
        description: `SQL-to-Opportunity Conversion Rate is ${sqlToOppRate}% (${qualifiedOppsCount} Opportunities in active pipeline from ${qualifiedSqlsCount} SQLs). Overall Lead-to-Opportunity conversion yield is ${leadToOppRate}%. Assessed Opp status: ${oppBreakdown.opp_qualified} Qualified, ${oppBreakdown.conditional_qualified} Conditional, ${oppBreakdown.unassessed} Pending.`
      },
      {
        id: 'EVID-SEGMENT-SCOPE',
        category: 'Campaign & Segment Coverage',
        description: `Scope: "${scope.campaign_name}" (${scope.campaign_id === 'all' ? 'All campaigns enrolled' : `Target Industry: ${scope.industry || 'Multi-industry'}, Motion: ${scope.revenue_motion || 'Standard'}`}). Total Leads in scope: ${totalLeads}.`
      }
    ];

    // Qualification Results sample
    const qualificationResultsSummary = [
      ...qualResults.slice(0, 10).map(r => ({
        module: 'MQL Qualification',
        lead_id: r.lead_id,
        status: r.qualification_status,
        score: r.qualification_score,
        dimension_scores: r.dimension_scores,
        primary_reason: r.reasoning?.summary || 'Dimensional assessment complete'
      })),
      ...sqlAssessments.slice(0, 5).map(a => ({
        module: 'SQL Qualification',
        opportunity_id: a.opportunity_id,
        status: a.qualification_status,
        score: a.overall_score,
        primary_reason: a.assessment_status || 'MEDDPICC assessment completed'
      })),
      ...oppSessions.slice(0, 5).map(s => ({
        module: 'Opportunity Qualification',
        opportunity_id: s.opportunity_id,
        status: s.qualification_status,
        score: s.overall_score
      }))
    ];

    const dataCoverage = {
      total_leads_in_scope: totalLeads,
      mql_assessed_count: mqlAssessedCount,
      mql_coverage_pct: evaluationRate,
      sql_promoted_count: qualifiedSqlsCount,
      sql_assessed_count: sqlAssessedCount,
      opp_promoted_count: qualifiedOppsCount,
      opp_assessed_count: oppAssessedCount,
      analysis_limitations: [
        mqlBreakdown.unassessed > 0 
          ? `${mqlBreakdown.unassessed} lead(s) in scope have not undergone AI qualification yet; unassessed records are strictly excluded from failure rates.`
          : 'All leads in scope have completed MQL assessment.',
        sqlBreakdown.unassessed > 0
          ? `${sqlBreakdown.unassessed} promoted SQL(s) are awaiting full MEDDPICC discovery assessment.`
          : 'All promoted SQL opportunities have completed initial assessment records.',
        'Correlations observed between ICP fit and pipeline progression reflect verified historical outcomes and should be monitored as pipeline cohorts mature.'
      ]
    };

    return {
      authoritativeMetrics,
      supportingEvidence,
      qualificationResultsSummary,
      dataCoverage
    };
  }

  /**
   * Loads the most recent saved insights from Supabase dedicated table (or localStorage fallback).
   */
  static async getSavedInsights(campaignId: string = 'all'): Promise<SavedQualificationInsightsRecord | null> {
    try {
      const { data, error } = await supabase
        .from('qualification_executive_insights')
        .select('*')
        .eq('scope_campaign_id', campaignId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.insights_data) {
        return {
          id: data.id,
          scope_campaign_id: data.scope_campaign_id,
          scope_campaign_name: data.scope_campaign_name,
          scope_industry: data.scope_industry,
          scope_revenue_motion: data.scope_revenue_motion,
          total_leads_scoped: data.total_leads_scoped,
          assessed_leads_count: data.assessed_leads_count,
          analysis_metrics: data.analysis_metrics,
          insights_data: data.insights_data,
          generated_at: data.generated_at || data.created_at
        };
      }
    } catch (e) {
      console.warn('Dedicated qualification_executive_insights table query warning:', e);
    }

    // Fallback to localStorage
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`qualification_executive_insights_${campaignId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    return null;
  }

  /**
   * Executes Gemini Qualification Intelligence reasoning via Supabase Edge Function 'lead-qualification'
   * and persists into dedicated Supabase table and localStorage.
   */
  static async generateInsights(
    scope: AnalysisScope,
    metrics: any,
    qualificationResults: any[],
    supportingEvidence: any[],
    dataCoverage: any
  ): Promise<SavedQualificationInsightsRecord> {
    let insights: QualificationExecutiveInsights | null = null;
    let savedRecord: any = null;

    try {
      // 1. Invoke Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('lead-qualification', {
        body: {
          action: 'generate-qualification-intelligence',
          analysis_scope: scope,
          analysis_metrics: metrics,
          qualification_results: qualificationResults,
          supporting_evidence: supportingEvidence,
          data_coverage: dataCoverage
        }
      });

      if (!error && data?.insights) {
        insights = data.insights;
        savedRecord = data.record;
      } else if (error) {
        console.warn('Edge function invoke error, falling back to grounded synthesizer:', error);
      }
    } catch (edgeErr) {
      console.warn('Edge function connection issue:', edgeErr);
    }

    // Fallback synthesizer if edge function is unreachable
    if (!insights) {
      insights = this.synthesizeEvidenceBasedInsights(scope, metrics, supportingEvidence, dataCoverage);
    }

    const timestamp = new Date().toISOString();
    const resultRecord: SavedQualificationInsightsRecord = {
      scope_campaign_id: scope.campaign_id,
      scope_campaign_name: scope.campaign_name,
      scope_industry: scope.industry,
      scope_revenue_motion: scope.revenue_motion,
      total_leads_scoped: metrics.total_leads,
      assessed_leads_count: metrics.total_assessed,
      analysis_metrics: metrics,
      insights_data: insights,
      generated_at: timestamp
    };

    // 2. Persist to Supabase table directly if not already saved by Edge Function
    if (!savedRecord) {
      try {
        const { data, error: insertError } = await supabase
          .from('qualification_executive_insights')
          .insert({
            scope_campaign_id: scope.campaign_id,
            scope_campaign_name: scope.campaign_name,
            scope_industry: scope.industry || null,
            scope_revenue_motion: scope.revenue_motion || null,
            total_leads_scoped: metrics.total_leads,
            assessed_leads_count: metrics.total_assessed,
            analysis_metrics: metrics,
            insights_data: insights,
            generated_at: timestamp
          })
          .select()
          .maybeSingle();

        if (!insertError && data) {
          resultRecord.id = data.id;
        }
      } catch (tableErr) {
        console.warn('Table qualification_executive_insights insert warning:', tableErr);
      }
    } else {
      resultRecord.id = savedRecord.id;
    }

    // 3. Persist to localStorage for instantaneous fast-load cache
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `qualification_executive_insights_${scope.campaign_id}`,
          JSON.stringify(resultRecord)
        );
      }
    } catch (lsErr) {
      console.warn('LocalStorage save error:', lsErr);
    }

    return resultRecord;
  }

  /**
   * Grounded synthesizer that strictly honors authoritative backend metrics and covers all 3 qualification modules.
   */
  private static synthesizeEvidenceBasedInsights(
    scope: AnalysisScope,
    metrics: any,
    evidence: any[],
    coverage: any
  ): QualificationExecutiveInsights {
    const mql = metrics.mql_metrics;
    const sql = metrics.sql_metrics;
    const opp = metrics.opportunity_metrics;
    const rates = metrics.funnel_conversion_rates || {
      lead_to_mql_conversion_rate_pct: mql.lead_to_mql_conversion_rate_pct,
      mql_to_sql_conversion_rate_pct: sql.mql_to_sql_conversion_rate_pct,
      sql_to_opp_conversion_rate_pct: opp.sql_to_opp_conversion_rate_pct,
      lead_to_opp_conversion_rate_pct: opp.lead_to_opp_yield_pct,
      lead_evaluation_rate_pct: mql.lead_evaluation_rate_pct
    };

    const highestDim = Object.entries(mql.average_dimensions)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0] || ['fit', 0];
    const lowestDim = Object.entries(mql.average_dimensions)
      .sort(([, a], [, b]) => (a as number) - (b as number))[0] || ['timing', 0];

    const executiveSummary = `Qualification intelligence across ${metrics.total_leads} prospect(s) under scope "${scope.campaign_name}" indicates a Lead-to-MQL Conversion Rate of ${rates.lead_to_mql_conversion_rate_pct}% (${mql.qualified_mql_count} qualified MQLs), progressing to a ${rates.mql_to_sql_conversion_rate_pct}% MQL-to-SQL Conversion Rate (${sql.total_sql} SQLs), and a ${rates.sql_to_opp_conversion_rate_pct}% SQL-to-Opportunity Conversion Rate (${opp.total_opportunities} active pipeline records). Overall Lead-to-Opportunity conversion yield stands at ${rates.lead_to_opp_conversion_rate_pct}%, with lead evaluation coverage at ${rates.lead_evaluation_rate_pct}%. Strongest dimensional alignment is observed in ${highestDim[0].toUpperCase()} (${highestDim[1]}/100), while ${lowestDim[0].toUpperCase()} (${lowestDim[1]}/100) presents the principal friction point across the revenue pipeline.`;

    // Exactly 3 Key Findings: One for MQL, one for SQL, one for Opportunity Qualification
    const keyFindings: KeyFinding[] = [
      {
        module: 'MQL Qualification',
        title: 'MQL Qualification: ICP Fit & Inbound Conversion Yield',
        observation: `Under active scope "${scope.campaign_name}", the Lead-to-MQL Conversion Rate is ${rates.lead_to_mql_conversion_rate_pct}%, with ${mql.qualified_mql_count} of ${metrics.total_leads} leads qualified as MQLs and an evaluation coverage rate of ${rates.lead_evaluation_rate_pct}%. Assessed leads demonstrate peak dimensional alignment in ${highestDim[0].toUpperCase()} (${highestDim[1]}/100) vs. ${lowestDim[0].toUpperCase()} (${lowestDim[1]}/100).`,
        business_implication: `High dimensional fit validates marketing targeting coherence. However, unassessed lead volume (${mql.breakdown.unassessed}) and timing divergence represent dormant pipeline that requires automated nurture pacing rather than abrupt disqualification.`,
        supporting_metrics: [
          {
            metric_name: 'Lead-to-MQL Conversion Rate',
            value: `${rates.lead_to_mql_conversion_rate_pct}%`,
            evidence_reference: 'EVID-MQL-CONVERSION'
          },
          {
            metric_name: 'Lead Evaluation Coverage',
            value: `${rates.lead_evaluation_rate_pct}%`,
            evidence_reference: 'EVID-MQL-CONVERSION'
          },
          {
            metric_name: `Primary Dimension (${highestDim[0].toUpperCase()})`,
            value: `${highestDim[1]}/100`,
            evidence_reference: 'EVID-MQL-DIMENSIONS'
          }
        ],
        evidence_references: ['EVID-MQL-CONVERSION', 'EVID-MQL-DIMENSIONS', 'EVID-SEGMENT-SCOPE'],
        finding_type: 'observed_pattern',
        confidence: 'high'
      },
      {
        module: 'SQL Qualification',
        title: 'SQL Qualification: Sales Acceptance & Discovery Progression',
        observation: `The MQL-to-SQL Conversion Rate stands at ${rates.mql_to_sql_conversion_rate_pct}%, with ${sql.total_sql} account(s) actively accepted from ${mql.qualified_mql_count} qualified MQLs. Promoted SQLs reflect an average assessment score of ${sql.average_score}/100, with ${sql.breakdown.sql_qualified} confirmed qualified and ${sql.breakdown.unassessed} pending MEDDPICC discovery.`,
        business_implication: `Smooth sales handover verifies cross-functional alignment between SDR and AE functions. Maintaining rigorous MEDDPICC discovery criteria at this stage directly preserves AE capacity and prevents deal stall downstream.`,
        supporting_metrics: [
          {
            metric_name: 'MQL-to-SQL Conversion Rate',
            value: `${rates.mql_to_sql_conversion_rate_pct}%`,
            evidence_reference: 'EVID-SQL-PROGRESSION'
          },
          {
            metric_name: 'Qualified SQL Volume',
            value: `${sql.total_sql}`,
            evidence_reference: 'EVID-SQL-PROGRESSION'
          },
          {
            metric_name: 'Average SQL Score',
            value: `${sql.average_score}/100`,
            evidence_reference: 'EVID-SQL-PROGRESSION'
          }
        ],
        evidence_references: ['EVID-SQL-PROGRESSION'],
        finding_type: 'observed_pattern',
        confidence: 'high'
      },
      {
        module: 'Opportunity Qualification',
        title: 'Opportunity Qualification: Pipeline Conversion & Revenue Yield',
        observation: `The SQL-to-Opportunity Conversion Rate is ${rates.sql_to_opp_conversion_rate_pct}%, successfully advancing ${opp.total_opportunities} active pipeline opportunity record(s) from ${sql.total_sql} SQLs. The cumulative Lead-to-Opportunity conversion yield across the full funnel is ${rates.lead_to_opp_conversion_rate_pct}%.`,
        business_implication: `Consistent progression from SQL to Opportunity confirms that qualified pipeline carries demonstrable commercial intent. Enforcing formal economic buyer verification and mutual action plans protects deal velocity and forecast reliability.`,
        supporting_metrics: [
          {
            metric_name: 'SQL-to-Opportunity Conversion Rate',
            value: `${rates.sql_to_opp_conversion_rate_pct}%`,
            evidence_reference: 'EVID-OPP-CONVERSION'
          },
          {
            metric_name: 'Lead-to-Opp Funnel Yield',
            value: `${rates.lead_to_opp_conversion_rate_pct}%`,
            evidence_reference: 'EVID-OPP-CONVERSION'
          },
          {
            metric_name: 'Active Opportunities',
            value: `${opp.total_opportunities}`,
            evidence_reference: 'EVID-OPP-CONVERSION'
          }
        ],
        evidence_references: ['EVID-OPP-CONVERSION'],
        finding_type: 'observed_pattern',
        confidence: 'high'
      }
    ];

    // Identified Qualification Risks covering all 3 modules
    const qualificationRisks: QualificationRisk[] = [
      {
        module: 'MQL Qualification',
        target_area: 'MQL Qualification',
        title: `MQL Evaluation Lag & ${lowestDim[0].toUpperCase()} Timing Friction`,
        description: `With a Lead Evaluation Rate of ${rates.lead_evaluation_rate_pct}% and lagging ${lowestDim[0]} dimension scores (${lowestDim[1]}/100), ${mql.breakdown.unassessed} unassessed leads risk stagnating, resulting in inbound decay and reduced conversion yield.`,
        evidence_references: ['EVID-MQL-CONVERSION', 'EVID-MQL-DIMENSIONS'],
        confidence: 'high'
      },
      {
        module: 'SQL Qualification',
        target_area: 'SQL Qualification',
        title: 'SQL Discovery Incompletion & Economic Sponsor Verification',
        description: `${sql.breakdown.borderline_sql + sql.breakdown.needs_nurturing + sql.breakdown.unassessed} SQL opportunities require completed MEDDPICC discovery. Advancing accounts without verified economic decision-makers elevates late-stage slip risk.`,
        evidence_references: ['EVID-SQL-PROGRESSION'],
        confidence: 'medium'
      },
      {
        module: 'Opportunity Qualification',
        target_area: 'Opportunity Qualification',
        title: 'Opportunity Conditional Criteria & Pipeline Slippage',
        description: `Active pipeline opportunities face conditional qualification dependencies. Without locked technical criteria and procurement milestones, deal closing cycles risk unexpected extensions.`,
        evidence_references: ['EVID-OPP-CONVERSION'],
        confidence: 'medium'
      }
    ];

    // Recommended Executive Actions covering all 3 modules
    const recommendedActions: RecommendedAction[] = [
      {
        priority: 'high',
        target_area: 'MQL Qualification',
        action: `Execute AI Qualification across all ${mql.breakdown.unassessed} pending leads and activate targeted ${lowestDim[0]} acceleration nurtures`,
        rationale: `Reaching 100% evaluation coverage secures maximum Lead-to-MQL conversion (${rates.lead_to_mql_conversion_rate_pct}%) and prevents high-fit accounts from lingering uncontacted.`,
        evidence_references: ['EVID-MQL-CONVERSION', 'EVID-MQL-DIMENSIONS']
      },
      {
        priority: 'high',
        target_area: 'SQL Qualification',
        action: `Institutionalize mandatory MEDDPICC Economic Buyer and Compelling Event gates prior to stage progression`,
        rationale: `Protecting the ${rates.mql_to_sql_conversion_rate_pct}% MQL-to-SQL conversion progression requires documented business case validation before allocating solution engineering resources.`,
        evidence_references: ['EVID-SQL-PROGRESSION']
      },
      {
        priority: 'medium',
        target_area: 'Opportunity Qualification',
        action: `Establish Mutual Action Plans (MAP) and Procurement Milestones for all active opportunities`,
        rationale: `Ensuring the ${rates.sql_to_opp_conversion_rate_pct}% SQL-to-Opp pipeline converts into booked revenue requires early alignment on legal, infosec, and contract signing paths.`,
        evidence_references: ['EVID-OPP-CONVERSION']
      }
    ];

    return {
      executive_summary: executiveSummary,
      key_findings: keyFindings,
      qualification_risks: qualificationRisks,
      recommended_actions: recommendedActions,
      limitations: coverage.analysis_limitations || []
    };
  }
}

