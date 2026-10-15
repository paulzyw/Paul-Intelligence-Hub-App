import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Target, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle, 
  MinusCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  X, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Zap, 
  Info, 
  FileText, 
  Scale, 
  Briefcase, 
  Activity, 
  BarChart2, 
  Check,
  TrendingUp,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { MQLLead, MQLQualificationResult, MQLCampaign } from '../../types/mql';
import { SQLOpportunity, SQLAssessment } from '../../types/sql';
import { supabase } from '@/src/lib/supabase';

// ==========================================
// CANONICAL DIMENSION DEFINITIONS (FROM CONFIG)
// ==========================================

export interface DimensionConfig {
  key: string;
  name: string;
  shortName: string;
  category: string;
  weight?: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// 1. MQL Dimensions (From MQL_Qualification_rules.json)
export const MQL_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'fit',
    name: 'ICP & Firmographic Fit',
    shortName: 'ICP Fit',
    category: 'Firmographics',
    weight: 0.35,
    icon: Target,
    description: 'Account firmographics, industry alignment, company size, and executive buyer persona authority.'
  },
  {
    key: 'intent',
    name: 'Behavioral & Purchase Intent',
    shortName: 'Intent',
    category: 'Behavior',
    weight: 0.25,
    icon: Zap,
    description: 'Active digital research, content engagement, high-intent page visits, and buying signals.'
  },
  {
    key: 'engagement',
    name: 'Engagement Depth & Recency',
    shortName: 'Engagement',
    category: 'Activity',
    weight: 0.20,
    icon: Activity,
    description: 'Multichannel interaction velocity, webinar attendance, demo requests, and whitepaper downloads.'
  },
  {
    key: 'timing',
    name: 'Timing & Purchasing Urgency',
    shortName: 'Timing',
    category: 'Timeline',
    weight: 0.20,
    icon: Clock,
    description: 'Budget cycle alignment, procurement timeline, contract expiration, or fiscal year trigger.'
  }
];

// 2. SQL Dimensions (Exact 10 MEDDPICC Codes in sql_dimension_results & UREKB_SQL)
export const SQL_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'businessProblem',
    name: 'Business Problem',
    shortName: 'Problem',
    category: 'Discovery',
    icon: AlertTriangle,
    description: 'Clearly identified and quantified business challenge with operational cost implications.'
  },
  {
    key: 'metricsSuccessCriteria',
    name: 'Metrics & Success Criteria',
    shortName: 'Metrics',
    category: 'Discovery',
    icon: BarChart2,
    description: 'Defined quantitative KPIs and verifiable benchmark outcomes targeted by customer leadership.'
  },
  {
    key: 'businessValue',
    name: 'Business Value',
    shortName: 'Value',
    category: 'Economic Impact',
    icon: Zap,
    description: 'Expected ROI, revenue acceleration, operational margin expansion, or capital expenditure reduction.'
  },
  {
    key: 'solutionAlignment',
    name: 'Solution Alignment',
    shortName: 'Solution',
    category: 'Fit & Architecture',
    icon: Target,
    description: 'Technical and architectural compatibility with customer infrastructure and workflows.'
  },
  {
    key: 'stakeholderAlignment',
    name: 'Stakeholder Alignment',
    shortName: 'Stakeholders',
    category: 'People & Influence',
    icon: Users,
    description: 'Champion access, executive sponsor backing, and buying committee consensus.'
  },
  {
    key: 'decisionCriteria',
    name: 'Decision Criteria',
    shortName: 'Criteria',
    category: 'Governance',
    icon: Scale,
    description: 'Formal technical, commercial, security, and legal criteria used to evaluate competing vendors.'
  },
  {
    key: 'buyingProcessGovernance',
    name: 'Buying Process & Governance',
    shortName: 'Process',
    category: 'Governance',
    icon: FileText,
    description: 'Documented milestones, security reviews, legal redlines, and executive signing thresholds.'
  },
  {
    key: 'commercialReadiness',
    name: 'Commercial Readiness',
    shortName: 'Commercial',
    category: 'Economics',
    icon: Briefcase,
    description: 'Identified budget allocation, funding path, and approval authority for contractual commitment.'
  },
  {
    key: 'opportunityMomentum',
    name: 'Opportunity Momentum',
    shortName: 'Momentum',
    category: 'Velocity',
    icon: Flame,
    description: 'Pace of discovery meetings, executive reciprocity, and adherence to agreed evaluation timelines.'
  },
  {
    key: 'competitivePosition',
    name: 'Competitive Position',
    shortName: 'Competition',
    category: 'Strategy',
    icon: ShieldCheck,
    description: 'Vendor differentiation, incumbent lock-in risks, alternative solutions, and internal build threats.'
  }
];

// 3. Opportunity Dimensions (Exact OQ01-OQ10 Codes in Opportunity_evidence_knowledge_base.json)
export const OPP_DIMENSIONS: DimensionConfig[] = [
  {
    key: 'OQ01',
    name: 'Opportunity Definition & Business Context',
    shortName: 'Business Context',
    category: 'Context',
    icon: FileText,
    description: 'Opportunity scope, enterprise business environment, strategic rationale, and target business entity.'
  },
  {
    key: 'OQ02',
    name: 'Business Problem & Impact Validation',
    shortName: 'Business Impact',
    category: 'Discovery',
    icon: AlertTriangle,
    description: 'Validated economic impact, operational bottlenecks, revenue leakage, or compliance penalties.'
  },
  {
    key: 'OQ03',
    name: 'Solution Relevance & Customer Fit',
    shortName: 'Solution Fit',
    category: 'Architecture',
    icon: Target,
    description: 'Product fit, integration requirements, customized scope, and verified deployment viability.'
  },
  {
    key: 'OQ04',
    name: 'Customer Engagement & Commitment',
    shortName: 'Customer Engagement',
    category: 'Commitment',
    icon: Activity,
    description: 'Mutual action plan agreement, workshop participation, engineering time allocation, and POC involvement.'
  },
  {
    key: 'OQ05',
    name: 'Stakeholder Identification & Access',
    shortName: 'Stakeholders',
    category: 'Leadership',
    icon: Users,
    description: 'Direct access to economic buyer, procurement leads, technical influencers, and security architects.'
  },
  {
    key: 'OQ06',
    name: 'Buying Process Understanding',
    shortName: 'Buying Process',
    category: 'Procurement',
    icon: Scale,
    description: 'Procurement pathway, contracting sequence, vendor onboarding protocols, and legal governance.'
  },
  {
    key: 'OQ07',
    name: 'Commercial Potential & Funding Path',
    shortName: 'Commercial & Budget',
    category: 'Commercial',
    icon: Briefcase,
    description: 'Contract value sizing, budget line-item availability, multi-year expansion, and payment milestones.'
  },
  {
    key: 'OQ08',
    name: 'Timeline & Business Urgency',
    shortName: 'Buying Timeline',
    category: 'Timeline',
    icon: Clock,
    description: 'Hard compelling events, project deadlines, quarterly board mandate, or audit deadlines.'
  },
  {
    key: 'OQ09',
    name: 'Opportunity Advancement Evidence',
    shortName: 'Advancement',
    category: 'Execution',
    icon: TrendingUp,
    description: 'Concrete progression signals, shared NDA execution, security questionnaire submission, and proposal delivery.'
  },
  {
    key: 'OQ10',
    name: 'Opportunity Qualification Risk Assessment',
    shortName: 'Risk Assessment',
    category: 'Risk',
    icon: ShieldCheck,
    description: 'Comprehensive evaluation of commercial, execution, organizational, and technical delivery risks.'
  }
];

// ==========================================
// SEMANTIC OUTCOME DEFINITION & COLOR SYSTEM
// ==========================================

export type OutcomeSemantic = 
  | 'Qualified'
  | 'Conditional'
  | 'Neutral'
  | 'Disqualified'
  | 'Insufficient Evidence'
  | 'Not Assessed';

export interface DimensionCellData {
  dimensionKey: string;
  dimensionName: string;
  semantic: OutcomeSemantic;
  score?: number | null;
  confidence?: number | null;
  rationale?: string;
  evidenceSummary?: string;
  supportingEvidence?: string[];
  negativeEvidence?: string[];
  missingEvidence?: string[];
  risks?: string[];
  recommendations?: string[];
}

export interface HeatmapRowData {
  id: string;
  leadId?: string;
  opportunityId?: string;
  companyName: string;
  recordTitle: string;
  subtitle: string;
  stageBadge: string;
  industry?: string;
  campaignName?: string;
  overallSemantic: OutcomeSemantic;
  overallScore?: number | null;
  overallConfidence?: number | null;
  overallExplanation?: string;
  assessedAt?: string;
  cells: Record<string, DimensionCellData>;
  rawRecord: any;
}

export const getSemanticStyle = (semantic: OutcomeSemantic) => {
  switch (semantic) {
    case 'Qualified':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        border: 'border-emerald-500/30 dark:border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Qualified'
      };
    case 'Conditional':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        border: 'border-amber-500/30 dark:border-amber-500/40',
        text: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dot: 'bg-amber-500',
        icon: AlertTriangle,
        label: 'Conditional'
      };
    case 'Neutral':
      return {
        bg: 'bg-sky-500/10 dark:bg-sky-500/15',
        border: 'border-sky-500/30 dark:border-sky-500/40',
        text: 'text-sky-700 dark:text-sky-300',
        badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
        dot: 'bg-sky-500',
        icon: MinusCircle,
        label: 'Neutral'
      };
    case 'Disqualified':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/15',
        border: 'border-red-500/30 dark:border-red-500/40',
        text: 'text-red-700 dark:text-red-300',
        badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
        dot: 'bg-red-500',
        icon: AlertCircle,
        label: 'Disqualified'
      };
    case 'Insufficient Evidence':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
        border: 'border-indigo-500/30 dark:border-indigo-500/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
        dot: 'bg-indigo-500',
        icon: HelpCircle,
        label: 'Needs Evidence'
      };
    case 'Not Assessed':
    default:
      return {
        bg: 'bg-bg-primary/40 dark:bg-bg-primary/60',
        border: 'border-border/60 border-dashed',
        text: 'text-text-secondary/60',
        badgeBg: 'bg-border/20 text-text-secondary border-border/40',
        dot: 'bg-border',
        icon: Clock,
        label: 'Not Assessed'
      };
  }
};

interface QualificationDimensionIntelligenceProps {
  campaigns?: MQLCampaign[];
  selectedCampaignId?: string;
  campaign?: MQLCampaign | null;
  leads: MQLLead[];
  qualResults: MQLQualificationResult[];
  mqlPromotions?: any[];
  oppPromotions?: any[];
  opportunities?: SQLOpportunity[];
  sqlAssessments?: SQLAssessment[];
  sqlResultsMap?: Record<string, any>;
  oppFormDataMap?: Record<string, any>;
  oppSessionsMap?: Record<string, any>;
  oppResultsMap?: Record<string, any>;
  promotedLeadIds?: string[];
  sqlPromotedLeadIds?: string[];
  onNavigateToLead?: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
}

export const QualificationDimensionIntelligence: React.FC<QualificationDimensionIntelligenceProps> = ({
  campaigns = [],
  selectedCampaignId = 'all',
  campaign,
  leads = [],
  qualResults = [],
  mqlPromotions = [],
  oppPromotions = [],
  opportunities = [],
  sqlAssessments = [],
  sqlResultsMap = {},
  oppFormDataMap = {},
  oppSessionsMap = {},
  oppResultsMap = {},
  promotedLeadIds = [],
  sqlPromotedLeadIds = [],
  onNavigateToLead
}) => {
  // Active view: 'mql' | 'sql' | 'opportunity'
  const [activeView, setActiveView] = useState<'mql' | 'sql' | 'opportunity'>('mql');

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [dimensionFilter, setDimensionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'company_asc' | 'confidence_desc'>('score_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Dedicated Database Records State (Live from dedicated SQL and Opportunity qualification tables)
  const [dbSqlAssessments, setDbSqlAssessments] = useState<SQLAssessment[]>([]);
  const [dbSqlDimensionResults, setDbSqlDimensionResults] = useState<any[]>([]);
  const [dbSqlRecommendations, setDbSqlRecommendations] = useState<any[]>([]);
  const [dbSqlReasoningSessions, setDbSqlReasoningSessions] = useState<any[]>([]);
  const [dbOqSessions, setDbOqSessions] = useState<any[]>([]);
  const [dbOqResults, setDbOqResults] = useState<any[]>([]);
  const [dbOpportunities, setDbOpportunities] = useState<SQLOpportunity[]>([]);

  // Fetch dedicated database tables directly from Supabase
  const fetchDedicatedDatabases = async () => {
    try {
      const [
        assessRes,
        dimRes,
        recRes,
        sessRes,
        oqSessRes,
        oqResRes,
        oppsRes
      ] = await Promise.all([
        supabase.from('sql_assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('sql_dimension_results').select('*'),
        supabase.from('sql_recommendations').select('*'),
        supabase.from('sql_reasoning_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('opportunity_qualification_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('opportunity_qualification_results').select('*').order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').order('created_at', { ascending: false })
      ]);

      if (assessRes.data) setDbSqlAssessments(assessRes.data as SQLAssessment[]);
      if (dimRes.data) setDbSqlDimensionResults(dimRes.data);
      if (recRes.data) setDbSqlRecommendations(recRes.data);
      if (sessRes.data) setDbSqlReasoningSessions(sessRes.data);
      if (oqSessRes.data) setDbOqSessions(oqSessRes.data);
      if (oqResRes.data) setDbOqResults(oqResRes.data);
      if (oppsRes.data) setDbOpportunities(oppsRes.data as SQLOpportunity[]);
    } catch (err) {
      console.warn('Error fetching dedicated qualification database tables:', err);
    }
  };

  useEffect(() => {
    fetchDedicatedDatabases();

    const handleDataUpdate = () => {
      fetchDedicatedDatabases();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('sql_qualification_updated', handleDataUpdate);
      window.addEventListener('opportunity_form_updated', handleDataUpdate);
      window.addEventListener('lead_promoted_to_sql', handleDataUpdate);
      window.addEventListener('lead_promoted_to_opportunity', handleDataUpdate);
      window.addEventListener('storage', handleDataUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sql_qualification_updated', handleDataUpdate);
        window.removeEventListener('opportunity_form_updated', handleDataUpdate);
        window.removeEventListener('lead_promoted_to_sql', handleDataUpdate);
        window.removeEventListener('lead_promoted_to_opportunity', handleDataUpdate);
        window.removeEventListener('storage', handleDataUpdate);
      }
    };
  }, []);

  // Detail Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    row: HeatmapRowData;
    cell: DimensionCellData;
    dimension: DimensionConfig;
  } | null>(null);

  // Active Dimensions based on selected view
  const currentDimensions = useMemo<DimensionConfig[]>(() => {
    switch (activeView) {
      case 'mql':
        return MQL_DIMENSIONS;
      case 'sql':
        return SQL_DIMENSIONS;
      case 'opportunity':
        return OPP_DIMENSIONS;
    }
  }, [activeView]);

  // Master Campaign Scoped Leads
  const scopedLeads = useMemo(() => {
    if (!selectedCampaignId || selectedCampaignId === 'all') return leads;
    return leads.filter(l => l.campaign_id === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  // Helper to determine if lead is in MQL Column in Lead Canvas
  const isLeadInMqlColumn = (lead: MQLLead): boolean => {
    if (lead.handover_status === 'Handover to Sales') return true;
    const q = qualResults.find(r => r.lead_id === lead.id);
    const rec = q?.recommendations;
    if (rec && typeof rec === 'object' && !Array.isArray(rec) && (rec as any).handover_ticket) return true;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`mql_handover_${lead.id}`);
      if (stored) return true;
    }
    return false;
  };

  // Helper to determine if lead is in SQL Column in Lead Canvas
  const isLeadInSqlColumn = (lead: MQLLead): boolean => {
    if (lead.status === 'SQL') return true;
    if (promotedLeadIds.includes(lead.id)) return true;
    if (sqlPromotedLeadIds.includes(lead.id)) return true;
    if (mqlPromotions.some(p => p.lead_id === lead.id)) return true;
    return false;
  };

  // Merged Opportunities List (DB + props)
  const allOpportunities = useMemo<SQLOpportunity[]>(() => {
    const list = [...opportunities];
    dbOpportunities.forEach(dbOpp => {
      if (!list.some(o => o.id === dbOpp.id)) {
        list.push(dbOpp);
      }
    });
    return list;
  }, [opportunities, dbOpportunities]);

  // Merged SQL Assessments List (DB + props)
  const allSqlAssessments = useMemo<SQLAssessment[]>(() => {
    const list = [...(sqlAssessments || [])];
    dbSqlAssessments.forEach(dbAssess => {
      if (!list.some(a => a.id === dbAssess.id)) {
        list.push(dbAssess);
      }
    });
    return list;
  }, [sqlAssessments, dbSqlAssessments]);

  // ==========================================
  // 1. DATA ADAPTERS FOR THE 3 VIEWS
  // ==========================================

  // A. MQL Records: All evaluated leads in scope
  const mqlRows = useMemo<HeatmapRowData[]>(() => {
    return scopedLeads.map(lead => {
      let result = qualResults.find(r => r.lead_id === lead.id);
      if (!result && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`mql_result_${lead.id}`);
        if (cached) {
          try { result = JSON.parse(cached); } catch {}
        }
      }

      const camp = campaigns.find(c => c.id === lead.campaign_id);
      const campName = camp?.name || (lead.lead_industry || 'Standard');

      let overallSemantic: OutcomeSemantic = 'Not Assessed';
      let overallScore: number | null = null;
      let overallConfidence: number | null = null;
      let overallExplanation = '';

      if (result) {
        overallScore = typeof result.qualification_score === 'number' ? result.qualification_score : null;
        overallConfidence = typeof result.confidence_score === 'number' ? result.confidence_score : null;
        overallExplanation = result.reasoning?.summary || 'Standard MQL algorithmic evaluation.';
        
        const rawStatus = (result.qualification_status || '').toLowerCase();
        if (rawStatus.includes('disqualified')) {
          overallSemantic = 'Disqualified';
        } else if (rawStatus.includes('nurture') || rawStatus.includes('conditional')) {
          overallSemantic = 'Conditional';
        } else if (rawStatus.includes('qualified')) {
          overallSemantic = 'Qualified';
        } else {
          overallSemantic = 'Neutral';
        }
      } else {
        if (lead.status === 'Assessing') {
          overallSemantic = 'Insufficient Evidence';
        } else if (typeof lead.mql_score === 'number' && lead.mql_score > 0) {
          overallScore = lead.mql_score;
          overallConfidence = lead.confidence_score ?? 80;
          overallSemantic = lead.mql_score >= 70 ? 'Qualified' : 'Conditional';
        }
      }

      // Build dimension cells
      const cells: Record<string, DimensionCellData> = {};
      MQL_DIMENSIONS.forEach(dim => {
        let score: number | null = null;
        let semantic: OutcomeSemantic = 'Not Assessed';
        let rationale = '';
        let supp: string[] = [];
        let neg: string[] = [];
        let missing: string[] = [];

        if (result && result.dimension_scores) {
          const dimKey = dim.key as 'fit' | 'intent' | 'engagement' | 'timing';
          score = typeof result.dimension_scores[dimKey] === 'number' ? result.dimension_scores[dimKey] : null;

          if (score !== null) {
            if (score >= 75) semantic = 'Qualified';
            else if (score >= 60) semantic = 'Conditional';
            else if (score >= 40) semantic = 'Neutral';
            else semantic = 'Disqualified';
          } else {
            semantic = 'Insufficient Evidence';
          }

          if (result.reasoning && (result.reasoning as any)[dimKey]) {
            rationale = (result.reasoning as any)[dimKey];
          }

          if (result.supporting_evidence) supp = result.supporting_evidence;
          if (result.negative_evidence) neg = result.negative_evidence;
          if (result.missing_evidence) missing = result.missing_evidence;
        }

        cells[dim.key] = {
          dimensionKey: dim.key,
          dimensionName: dim.name,
          semantic,
          score,
          confidence: overallConfidence,
          rationale: rationale || (semantic === 'Not Assessed' ? 'Dimension not assessed yet.' : `Assessment of ${dim.name}.`),
          supportingEvidence: supp,
          negativeEvidence: neg,
          missingEvidence: missing,
          recommendations: result?.recommendations || []
        };
      });

      return {
        id: lead.id,
        leadId: lead.id,
        companyName: lead.company_name || 'Enterprise Prospect',
        recordTitle: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name || 'Prospect',
        subtitle: lead.job_title || lead.email || 'Lead Contact',
        stageBadge: lead.status || 'New Lead',
        industry: lead.lead_industry || 'Enterprise',
        campaignName: campName,
        overallSemantic,
        overallScore,
        overallConfidence,
        overallExplanation,
        assessedAt: result?.evaluated_at || lead.created_at,
        cells,
        rawRecord: lead
      };
    });
  }, [scopedLeads, qualResults, campaigns]);

  // B. SQL Records: EXACTLY the opportunities listed in the MQL Column in Lead Canvas
  // Dimensional status & scores fetched strictly from the dedicated database for the SQL qualification module
  const sqlRows = useMemo<HeatmapRowData[]>(() => {
    // 1. Filter leads strictly by MQL Column membership in Lead Canvas
    const mqlColLeads = scopedLeads.filter(l => isLeadInMqlColumn(l));

    return mqlColLeads.map(lead => {
      // Find matching opportunity in dedicated database / opportunities table
      const opp = allOpportunities.find(o => 
        o.mql_reference_id === lead.id || 
        (o.company_name && lead.company_name && o.company_name.toLowerCase().trim() === lead.company_name.toLowerCase().trim())
      );
      const oppId = opp?.id || `virtual_opp_${lead.id}`;
      const companyName = opp?.company_name || lead.company_name || 'Enterprise Account';
      const opportunityName = opp?.opportunity_name || `${companyName} Opportunity`;
      const industry = opp?.industry || lead.lead_industry || 'Enterprise Software';
      const revenueMotion = opp?.revenue_motion || 'Digital Solution Selling';

      // 2. Fetch assessment from dedicated SQL assessments database table
      const matchedAssessments = allSqlAssessments.filter(a => 
        a.opportunity_id === oppId || 
        (opp && a.opportunity_id === opp.id) || 
        a.opportunity_id === `virtual_opp_${lead.id}`
      );

      // Prioritize completed assessment or assessment with valid overall_score
      const assessment = matchedAssessments.sort((a, b) => {
        const aHasScore = (a.overall_score !== null && a.overall_score !== undefined) ? 1 : 0;
        const bHasScore = (b.overall_score !== null && b.overall_score !== undefined) ? 1 : 0;
        if (bHasScore !== aHasScore) return bHasScore - aHasScore;
        const aComp = a.assessment_status === 'completed' ? 1 : 0;
        const bComp = b.assessment_status === 'completed' ? 1 : 0;
        if (bComp !== aComp) return bComp - aComp;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      })[0] || null;

      // 3. Fetch reasoning session JSON from dedicated database
      const reasoningSession = assessment ? dbSqlReasoningSessions.find(s => s.assessment_id === assessment.id) : null;
      const reasoningOutput = reasoningSession?.output_response || sqlResultsMap[oppId] || (opp ? sqlResultsMap[opp.id] : null);

      // 4. Fetch dimension results from dedicated sql_dimension_results database table
      const dimResultsFromDb = assessment ? dbSqlDimensionResults.filter(d => d.assessment_id === assessment.id) : [];

      let overallSemantic: OutcomeSemantic = 'Not Assessed';
      let overallScore: number | null = null;
      let overallConfidence: number | null = null;
      let overallExplanation = '';

      if (assessment && (assessment.overall_score !== null && assessment.overall_score !== undefined)) {
        overallScore = Number(assessment.overall_score);
        overallConfidence = typeof assessment.confidence_score === 'number' ? assessment.confidence_score : 85;
        overallExplanation = reasoningOutput?.qualification_summary?.summary || reasoningOutput?.explainability?.decision_summary || '';

        const qStatus = (assessment.qualification_status || reasoningOutput?.qualification_summary?.qualification_status || '').toLowerCase();
        if (qStatus.includes('disqualified') || overallScore < 50) overallSemantic = 'Disqualified';
        else if (qStatus.includes('conditional') || (overallScore >= 60 && overallScore < 75)) overallSemantic = 'Conditional';
        else if (qStatus.includes('needs') || qStatus.includes('evidence')) overallSemantic = 'Insufficient Evidence';
        else if (qStatus.includes('qualified') || overallScore >= 75) overallSemantic = 'Qualified';
        else overallSemantic = 'Neutral';
      } else if (reasoningOutput?.qualification_summary?.overall_score !== undefined && reasoningOutput?.qualification_summary?.overall_score !== null) {
        overallScore = Number(reasoningOutput.qualification_summary.overall_score);
        overallConfidence = Number(reasoningOutput.qualification_summary.confidence_score || 85);
        overallExplanation = reasoningOutput.qualification_summary.summary || '';
        const qStatus = (reasoningOutput.qualification_summary.qualification_status || '').toLowerCase();
        if (qStatus.includes('disqualified') || overallScore < 50) overallSemantic = 'Disqualified';
        else if (qStatus.includes('conditional') || (overallScore >= 60 && overallScore < 75)) overallSemantic = 'Conditional';
        else if (qStatus.includes('needs') || qStatus.includes('evidence')) overallSemantic = 'Insufficient Evidence';
        else if (qStatus.includes('qualified') || overallScore >= 75) overallSemantic = 'Qualified';
        else overallSemantic = 'Neutral';
      }

      // Build dimension cells for 10 SQL dimensions strictly from dedicated database
      const cells: Record<string, DimensionCellData> = {};
      const outputDimAssessments = reasoningOutput?.dimension_assessments || [];

      SQL_DIMENSIONS.forEach(dim => {
        // Find matching dimension in sql_dimension_results from database
        const match = dimResultsFromDb.find(d => {
          const codeA = (d.dimension_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const codeB = dim.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (codeA === codeB) return true;
          const nameA = (d.dimension_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameB = dim.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameA.includes(nameB) || nameB.includes(nameA);
        }) || outputDimAssessments.find((da: any) => {
          const codeA = (da.dimension_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const codeB = dim.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (codeA === codeB) return true;
          const nameA = (da.dimension_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameB = dim.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameA.includes(nameB) || nameB.includes(nameA);
        });

        let score: number | null = null;
        let semantic: OutcomeSemantic = 'Not Assessed';
        let rationale = '';
        let strengths: string[] = [];
        let weaknesses: string[] = [];
        let risks: string[] = [];
        let recs: string[] = [];

        if (match) {
          score = typeof match.score === 'number' ? match.score : null;
          if (score !== null) {
            if (score >= 75) semantic = 'Qualified';
            else if (score >= 60) semantic = 'Conditional';
            else if (score >= 40) semantic = 'Neutral';
            else semantic = 'Disqualified';
          } else {
            semantic = 'Insufficient Evidence';
          }
          rationale = match.assessment_summary || match.ai_reasoning || '';
          strengths = match.strengths || [];
          weaknesses = match.weaknesses || [];
          risks = match.risks || [];
          recs = match.recommendations || [];
        }

        // Attach recommendations from sql_recommendations table
        if (assessment) {
          const dbRecs = dbSqlRecommendations.filter(r => 
            r.assessment_id === assessment.id && 
            (r.dimension_code?.toLowerCase().replace(/[^a-z0-9]/g, '') === dim.key.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ).map(r => r.recommendation);
          if (dbRecs.length > 0) {
            recs = Array.from(new Set([...recs, ...dbRecs]));
          }
        }

        cells[dim.key] = {
          dimensionKey: dim.key,
          dimensionName: dim.name,
          semantic,
          score,
          confidence: match?.confidence || overallConfidence,
          rationale: rationale || (semantic === 'Not Assessed' ? 'Dimension not evaluated in SQL qualification database.' : `Evaluation for ${dim.name}.`),
          supportingEvidence: strengths,
          negativeEvidence: weaknesses,
          risks,
          recommendations: recs
        };
      });

      return {
        id: oppId,
        leadId: lead.id,
        opportunityId: oppId,
        companyName,
        recordTitle: opportunityName,
        subtitle: `${industry} • MQL Handover Context`,
        stageBadge: 'SQL Qualification',
        industry,
        campaignName: revenueMotion,
        overallSemantic,
        overallScore,
        overallConfidence,
        overallExplanation,
        assessedAt: assessment?.completed_at || lead.updated_at,
        cells,
        rawRecord: { lead, opp, assessment }
      };
    });
  }, [scopedLeads, allOpportunities, allSqlAssessments, dbSqlDimensionResults, dbSqlRecommendations, dbSqlReasoningSessions, sqlResultsMap]);

  // C. Opportunity Records: EXACTLY the opportunities listed in the SQL Column in Lead Canvas
  // Dimensional status & scores fetched strictly from the dedicated database for the Opportunity qualification module
  const oppRows = useMemo<HeatmapRowData[]>(() => {
    // 1. Filter leads strictly by SQL Column membership in Lead Canvas
    const sqlColLeads = scopedLeads.filter(l => isLeadInSqlColumn(l));

    return sqlColLeads.map(lead => {
      // Find matching opportunity in dedicated database / opportunities table
      const opp = allOpportunities.find(o => 
        o.mql_reference_id === lead.id || 
        (o.company_name && lead.company_name && o.company_name.toLowerCase().trim() === lead.company_name.toLowerCase().trim())
      );
      const oppId = opp?.id || `virtual_opp_${lead.id}`;
      const companyName = opp?.company_name || lead.company_name || 'Enterprise Client';
      const opportunityName = opp?.opportunity_name || `${companyName} Opportunity`;
      const industry = opp?.industry || lead.lead_industry || 'Enterprise Software';

      // 2. Fetch session from dedicated opportunity_qualification_sessions database table
      const matchedSessions = dbOqSessions.filter(s => 
        s.opportunity_id === oppId || 
        (opp && s.opportunity_id === opp.id) || 
        s.opportunity_id === `virtual_opp_${lead.id}`
      );
      const session = matchedSessions.sort((a, b) => {
        const aScore = (a.overall_score !== null && a.overall_score !== undefined && a.overall_score > 0) ? 1 : 0;
        const bScore = (b.overall_score !== null && b.overall_score !== undefined && b.overall_score > 0) ? 1 : 0;
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
      })[0] || (oppSessionsMap[oppId] || (opp ? oppSessionsMap[opp.id] : null));

      // 3. Fetch qualification result from dedicated opportunity_qualification_results database table
      const oqResult = dbOqResults.find(r => 
        (session && r.session_id === session.id) || 
        r.opportunity_id === oppId || 
        (opp && r.opportunity_id === opp.id)
      ) || oppResultsMap[oppId] || (opp ? oppResultsMap[opp.id] : null);

      let overallSemantic: OutcomeSemantic = 'Not Assessed';
      let overallScore: number | null = null;
      let overallConfidence: number | null = null;
      let overallExplanation = '';

      if (oqResult) {
        overallScore = typeof oqResult.overall_score === 'number' && oqResult.overall_score > 0 ? oqResult.overall_score : null;
        overallConfidence = typeof oqResult.confidence_score === 'number' && oqResult.confidence_score > 0 ? oqResult.confidence_score : null;
        overallExplanation = oqResult.qualification_explanation || oqResult.final_decision?.qualification_summary?.summary || oqResult.qualification_summary?.summary || '';

        const oStatus = (oqResult.qualification_status || '').toUpperCase();
        if (oStatus.includes('DISQUALIFIED')) overallSemantic = 'Disqualified';
        else if (oStatus.includes('CONDITIONALLY') || oStatus.includes('ON_HOLD')) overallSemantic = 'Conditional';
        else if (oStatus.includes('INSUFFICIENT') || oStatus.includes('EVIDENCE')) overallSemantic = 'Insufficient Evidence';
        else if (oStatus.includes('QUALIFIED')) overallSemantic = 'Qualified';
        else overallSemantic = 'Neutral';
      } else if (session && session.qualification_status && session.qualification_status !== 'NOT_STARTED') {
        overallScore = typeof session.overall_score === 'number' && session.overall_score > 0 ? session.overall_score : null;
        overallConfidence = typeof session.confidence_score === 'number' && session.confidence_score > 0 ? session.confidence_score : null;
        const sStatus = session.qualification_status.toUpperCase();
        if (sStatus.includes('DISQUALIFIED')) overallSemantic = 'Disqualified';
        else if (sStatus.includes('CONDITIONALLY')) overallSemantic = 'Conditional';
        else if (sStatus.includes('INSUFFICIENT')) overallSemantic = 'Insufficient Evidence';
        else if (sStatus.includes('QUALIFIED')) overallSemantic = 'Qualified';
        else overallSemantic = 'Neutral';
      }

      // Build dimension cells for 10 OQ dimensions strictly from dedicated database
      const cells: Record<string, DimensionCellData> = {};
      const dimResultsFromDb = oqResult?.dimension_results || oqResult?.dimension_assessments || [];

      OPP_DIMENSIONS.forEach(dim => {
        // Find matching dimension in opportunity_qualification_results from database
        const match = dimResultsFromDb.find((dr: any) => {
          const code = (dr.dimension_code || dr.dimension_id || '').toUpperCase().trim();
          if (code === dim.key) return true;
          const nameA = (dr.dimension_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameB = dim.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameA.includes(nameB) || nameB.includes(nameA);
        });

        let score: number | null = null;
        let semantic: OutcomeSemantic = 'Not Assessed';
        let rationale = '';
        let pos: string[] = [];
        let neg: string[] = [];
        let missing: string[] = [];
        let recs: string[] = [];
        let risks: string[] = [];

        if (match) {
          score = typeof match.score === 'number' ? match.score : null;
          const evStrength = (match.evidence_strength || '').toLowerCase();
          const assessmentStr = (match.assessment || '').toLowerCase();

          if (assessmentStr === 'strong' || evStrength === 'customer_confirmed' || (score !== null && score >= 75)) {
            semantic = 'Qualified';
          } else if (assessmentStr === 'moderate' || (score !== null && score >= 60)) {
            semantic = 'Conditional';
          } else if (score !== null && score >= 40) {
            semantic = 'Neutral';
          } else if (score !== null && score < 40) {
            semantic = 'Disqualified';
          } else if (match.evidence_status === 'INSUFFICIENT') {
            semantic = 'Insufficient Evidence';
          } else {
            semantic = 'Neutral';
          }

          rationale = match.ai_reasoning || match.reasoning || match.assessment_summary || '';

          // Supporting evidence from DB
          if (typeof match.key_evidence === 'string' && match.key_evidence.trim() !== '' && match.key_evidence.toLowerCase() !== 'none') {
            pos.push(match.key_evidence);
          } else if (Array.isArray(match.positive_signals)) {
            pos = match.positive_signals;
          }

          // Risks from DB
          if (typeof match.risks === 'string' && match.risks.trim() !== '' && match.risks.toLowerCase() !== 'none') {
            risks.push(match.risks);
          } else if (Array.isArray(match.risks)) {
            risks = match.risks.map((r: any) => typeof r === 'string' ? r : (r.risk_description || r.category || 'Risk identified'));
          }

          // Evidence gaps from DB
          if (typeof match.evidence_gaps === 'string' && match.evidence_gaps.trim() !== '' && match.evidence_gaps.toLowerCase() !== 'none') {
            missing.push(match.evidence_gaps);
          } else if (Array.isArray(match.missing_evidence)) {
            missing = match.missing_evidence;
          }

          // Recommended actions from DB
          if (typeof match.recommended_action === 'string' && match.recommended_action.trim() !== '' && match.recommended_action.toLowerCase() !== 'none') {
            recs.push(match.recommended_action);
          } else if (Array.isArray(match.recommendations)) {
            recs = match.recommendations.map((r: any) => typeof r === 'string' ? r : (r.action || r.recommendation || ''));
          }
        }

        cells[dim.key] = {
          dimensionKey: dim.key,
          dimensionName: dim.name,
          semantic,
          score,
          confidence: match?.confidence || overallConfidence,
          rationale: rationale || (semantic === 'Not Assessed' ? 'Dimension not evaluated in Opportunity qualification database.' : `Evaluation for ${dim.name}.`),
          supportingEvidence: pos,
          negativeEvidence: neg,
          missingEvidence: missing,
          risks,
          recommendations: recs
        };
      });

      return {
        id: oppId,
        leadId: lead.id,
        opportunityId: oppId,
        companyName,
        recordTitle: opportunityName,
        subtitle: `${industry} • SQL Promotion Scope`,
        stageBadge: 'Opportunity Qualification',
        industry,
        campaignName: 'Universal Pipeline',
        overallSemantic,
        overallScore,
        overallConfidence,
        overallExplanation,
        assessedAt: session?.updated_at || lead.updated_at,
        cells,
        rawRecord: { lead, opp, session, oqResult }
      };
    });
  }, [scopedLeads, allOpportunities, dbOqSessions, dbOqResults, oppSessionsMap, oppResultsMap, promotedLeadIds, sqlPromotedLeadIds, mqlPromotions]);

  // Current dataset based on active view
  const currentDataset = useMemo<HeatmapRowData[]>(() => {
    switch (activeView) {
      case 'mql': return mqlRows;
      case 'sql': return sqlRows;
      case 'opportunity': return oppRows;
    }
  }, [activeView, mqlRows, sqlRows, oppRows]);

  // ==========================================
  // 2. PORTFOLIO SUMMARY CALCULATIONS
  // ==========================================

  const portfolioSummary = useMemo(() => {
    const totalEligible = currentDataset.length;
    const assessedRecords = currentDataset.filter(r => r.overallSemantic !== 'Not Assessed');
    const assessedCount = assessedRecords.length;
    const assessedDenominator = Math.max(1, assessedCount);

    let qualifiedCount = 0;
    let conditionalCount = 0;
    let neutralCount = 0;
    let disqualifiedCount = 0;
    let insufficientCount = 0;
    let notAssessedCount = 0;

    let scoreSum = 0;
    let scoreRecordsCount = 0;

    currentDataset.forEach(r => {
      switch (r.overallSemantic) {
        case 'Qualified': qualifiedCount++; break;
        case 'Conditional': conditionalCount++; break;
        case 'Neutral': neutralCount++; break;
        case 'Disqualified': disqualifiedCount++; break;
        case 'Insufficient Evidence': insufficientCount++; break;
        case 'Not Assessed': notAssessedCount++; break;
      }
      if (typeof r.overallScore === 'number') {
        scoreSum += r.overallScore;
        scoreRecordsCount++;
      }
    });

    const avgScore = scoreRecordsCount > 0 ? Math.round(scoreSum / scoreRecordsCount) : null;

    // Dimension-level calculations
    const dimensionStats = currentDimensions.map(dim => {
      let dimAssessedCount = 0;
      let dimPassCount = 0;
      let dimConditionalCount = 0;
      let dimNeutralCount = 0;
      let dimDisqualifiedCount = 0;
      let dimEvidenceGapsCount = 0;
      let dimScoreSum = 0;
      let dimScoreCount = 0;

      currentDataset.forEach(r => {
        const cell = r.cells[dim.key];
        if (!cell || cell.semantic === 'Not Assessed') return;
        
        dimAssessedCount++;
        if (cell.semantic === 'Qualified') dimPassCount++;
        else if (cell.semantic === 'Conditional') dimConditionalCount++;
        else if (cell.semantic === 'Neutral') dimNeutralCount++;
        else if (cell.semantic === 'Disqualified') dimDisqualifiedCount++;
        else if (cell.semantic === 'Insufficient Evidence') dimEvidenceGapsCount++;

        if (typeof cell.score === 'number') {
          dimScoreSum += cell.score;
          dimScoreCount++;
        }
      });

      const denom = Math.max(1, dimAssessedCount);
      const avgDimScore = dimScoreCount > 0 ? Math.round(dimScoreSum / dimScoreCount) : null;
      const passRate = Math.round((dimPassCount / denom) * 100);
      const gapRate = Math.round(((dimConditionalCount + dimDisqualifiedCount + dimEvidenceGapsCount) / denom) * 100);

      return {
        dimension: dim,
        assessedCount: dimAssessedCount,
        passRate,
        gapRate,
        avgScore: avgDimScore,
        conditionalCount: dimConditionalCount,
        disqualifiedCount: dimDisqualifiedCount,
        evidenceGapsCount: dimEvidenceGapsCount
      };
    });

    // Determine top bottleneck & strongest dimension
    const validStats = dimensionStats.filter(s => s.assessedCount > 0);
    const sortedByPass = [...validStats].sort((a, b) => b.passRate - a.passRate);
    const strongestDim = sortedByPass[0]?.dimension.name || 'Awaiting evaluations';
    const bottleneckDim = sortedByPass[sortedByPass.length - 1]?.dimension.name || 'None identified';

    // Top Recurring Conditional, Neutral & Disqualified Patterns
    const recurringPatterns: Array<{
      type: 'conditional' | 'neutral' | 'disqualified';
      title: string;
      percentage: number;
      description: string;
    }> = [];

    const topGaps = [...validStats].sort((a, b) => b.gapRate - a.gapRate).slice(0, 3);
    topGaps.forEach(g => {
      if (g.gapRate > 10) {
        if (g.disqualifiedCount >= g.conditionalCount && g.disqualifiedCount > 0) {
          recurringPatterns.push({
            type: 'disqualified',
            title: `${g.dimension.name} Hard Filter`,
            percentage: Math.round((g.disqualifiedCount / Math.max(1, g.assessedCount)) * 100),
            description: `Below minimum qualification threshold on ${g.dimension.name.toLowerCase()}.`
          });
        } else if (g.conditionalCount > 0) {
          recurringPatterns.push({
            type: 'conditional',
            title: `${g.dimension.name} Verification Needed`,
            percentage: Math.round((g.conditionalCount / Math.max(1, g.assessedCount)) * 100),
            description: `Requires customer confirmation on ${g.dimension.shortName.toLowerCase()} commitments.`
          });
        }
      }
    });

    if (recurringPatterns.length === 0 && assessedCount > 0) {
      recurringPatterns.push({
        type: 'conditional',
        title: 'High Qualification Integrity',
        percentage: 100,
        description: 'All assessed records meet baseline qualification requirements with minimal dimensional gaps.'
      });
    } else if (recurringPatterns.length === 0) {
      recurringPatterns.push({
        type: 'neutral',
        title: 'Pending Dimensional Evaluations',
        percentage: 0,
        description: 'Run qualification assessment in the module to surface automated gap detection patterns.'
      });
    }

    // Evidence completeness / coverage across assessed records
    let totalAssessedCells = 0;
    let verifiedCells = 0;
    currentDataset.forEach(r => {
      currentDimensions.forEach(dim => {
        const cell = r.cells[dim.key];
        if (cell && cell.semantic !== 'Not Assessed') {
          totalAssessedCells++;
          if (cell.semantic === 'Qualified') verifiedCells++;
        }
      });
    });

    const evidenceCompleteness = totalAssessedCells > 0 
      ? Math.round((verifiedCells / totalAssessedCells) * 100) 
      : 0;

    return {
      totalEligible,
      assessedCount,
      assessedRate: totalEligible > 0 ? Math.round((assessedCount / totalEligible) * 100) : 0,
      distribution: {
        qualified: { count: qualifiedCount, rate: Math.round((qualifiedCount / assessedDenominator) * 100) },
        conditional: { count: conditionalCount, rate: Math.round((conditionalCount / assessedDenominator) * 100) },
        neutral: { count: neutralCount, rate: Math.round((neutralCount / assessedDenominator) * 100) },
        disqualified: { count: disqualifiedCount, rate: Math.round((disqualifiedCount / assessedDenominator) * 100) },
        insufficient: { count: insufficientCount, rate: Math.round((insufficientCount / assessedDenominator) * 100) },
        notAssessed: { count: notAssessedCount, rate: Math.round((notAssessedCount / Math.max(1, totalEligible)) * 100) }
      },
      avgScore,
      dimensionStats,
      strongestDim,
      bottleneckDim,
      recurringPatterns,
      evidenceCompleteness
    };
  }, [currentDataset, currentDimensions]);

  // ==========================================
  // 3. SEARCH, SORT & PAGINATION
  // ==========================================

  const filteredAndSortedRows = useMemo(() => {
    let rows = [...currentDataset];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(r => 
        r.companyName.toLowerCase().includes(q) ||
        r.recordTitle.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        (r.industry && r.industry.toLowerCase().includes(q))
      );
    }

    // Filter by overall outcome
    if (outcomeFilter !== 'all') {
      rows = rows.filter(r => r.overallSemantic === outcomeFilter);
    }

    // Filter by specific dimension outcome
    if (dimensionFilter !== 'all') {
      const [dimKey, targetSemantic] = dimensionFilter.split(':');
      if (dimKey && targetSemantic) {
        rows = rows.filter(r => r.cells[dimKey]?.semantic === targetSemantic);
      }
    }

    // Sorting
    rows.sort((a, b) => {
      switch (sortBy) {
        case 'score_desc':
          return (b.overallScore ?? -1) - (a.overallScore ?? -1);
        case 'score_asc':
          return (a.overallScore ?? 999) - (b.overallScore ?? 999);
        case 'company_asc':
          return a.companyName.localeCompare(b.companyName);
        case 'confidence_desc':
          return (b.overallConfidence ?? -1) - (a.overallConfidence ?? -1);
        default:
          return 0;
      }
    });

    return rows;
  }, [currentDataset, searchQuery, outcomeFilter, dimensionFilter, sortBy]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  // Handle click on cell
  const handleCellClick = (row: HeatmapRowData, dim: DimensionConfig) => {
    const cell = row.cells[dim.key] || {
      dimensionKey: dim.key,
      dimensionName: dim.name,
      semantic: 'Not Assessed',
      rationale: 'No assessment record found in the dedicated database for this dimension.'
    };
    setSelectedCellInfo({ row, cell, dimension: dim });
    setDrawerOpen(true);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('qual-dimension-intelligence-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle click on row to navigate to lead or opportunity
  const handleRowClick = (row: HeatmapRowData) => {
    if (row.leadId) {
      const matchedLead = leads.find(l => l.id === row.leadId);
      if (matchedLead && onNavigateToLead) {
        const colType = activeView === 'mql' ? 'mql' : activeView === 'sql' ? 'sql' : 'opp';
        onNavigateToLead(matchedLead, colType);
        return;
      }
    }
    // Fallback: open drawer on primary dimension
    handleCellClick(row, currentDimensions[0]);
  };

  return (
    <div id="qual-dimension-intelligence-container" className="rounded-2xl border border-border bg-bg-surface shadow-sm overflow-hidden mt-6 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* SECTION HEADER & CATEGORY BAR */}
      {/* ======================================================== */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-bg-surface via-bg-surface to-bg-primary/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                <Layers className="h-4 w-4" />
              </span>
              <h3 className="text-base font-black text-text-primary uppercase tracking-tight">
                Qualification Dimension Intelligence
              </h3>
              {/*<span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/10 text-accent border border-accent/20">
                Interactive Heatmap Matrix
              </span>*/}
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">
              Cross-stage dimensional qualification analytics, evidence coverage gaps, and recurring conversion drivers at lead and portfolio scale.
            </p>
          </div>

          {/* Category Navigation Bar (3 Distinct Views) */}
          <div className="flex items-center p-1 rounded-xl bg-bg-primary border border-border/80 shadow-inner shrink-0 self-start lg:self-auto">
            {[
              { 
                id: 'mql', 
                label: 'MQL Qualification', 
                sublabel: 'Lead Pipeline',
                icon: Target, 
                count: mqlRows.length, 
                dims: 4 
              },
              { 
                id: 'sql', 
                label: 'SQL Qualification', 
                sublabel: 'MQL Column Opps',
                icon: Award, 
                count: sqlRows.length, 
                dims: 10 
              },
              { 
                id: 'opportunity', 
                label: 'Opportunity Qualification', 
                sublabel: 'SQL Column Opps',
                icon: Zap, 
                count: oppRows.length, 
                dims: 10 
              }
            ].map(tab => {
              const isActive = activeView === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveView(tab.id as any);
                    setCurrentPage(1);
                    setDimensionFilter('all');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-bg-surface text-text-primary shadow-sm border border-border'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/50'
                  }`}
                >
                  <TabIcon className={`h-3.5 w-3.5 ${isActive ? 'text-accent' : 'text-text-secondary'}`} />
                  <div className="text-left">
                    <div>{tab.label}</div>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono ${
                    isActive 
                      ? 'bg-accent/10 text-accent font-black' 
                      : 'bg-border/40 text-text-secondary font-medium'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* A. PORTFOLIO SUMMARY TILES */}
      {/* ======================================================== */}
      <div className="p-5 border-b border-border bg-bg-primary/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Assessed Volume & Completeness */}
          <div className="p-4 rounded-xl border border-border bg-bg-surface shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                {activeView === 'mql' ? 'Assessed Leads' : activeView === 'sql' ? 'MQL Column SQLs' : 'SQL Column Opps'}
              </span>
              <Users className="h-4 w-4 text-accent" />
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-text-primary tracking-tight">
                  {portfolioSummary.assessedCount}
                </span>
                <span className="text-xs font-mono text-text-secondary">
                  / {portfolioSummary.totalEligible} records ({portfolioSummary.assessedRate}%)
                </span>
              </div>
              <div className="text-[11px] text-text-secondary mt-1">
                {activeView === 'mql' 
                  ? 'Total leads in campaign scope evaluated.' 
                  : activeView === 'sql' 
                    ? 'Opportunities from MQL Column in Lead Canvas.' 
                    : 'Opportunities from SQL Column in Lead Canvas.'}
              </div>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-secondary">Dimensions Evaluated:</span>
              <span className="font-bold text-text-primary">{currentDimensions.length} Configured</span>
            </div>
          </div>

          {/* Tile 2: Outcome Distribution */}
          <div className="p-4 rounded-xl border border-border bg-bg-surface shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                Qualification Distribution
              </span>
              <BarChart2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="my-2">
              {/* Stacked bar */}
              <div className="h-2.5 w-full rounded-full bg-border/40 overflow-hidden flex my-1.5 shadow-inner">
                <div 
                  className="bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${portfolioSummary.distribution.qualified.rate}%` }} 
                  title={`Qualified: ${portfolioSummary.distribution.qualified.count} (${portfolioSummary.distribution.qualified.rate}%)`}
                />
                <div 
                  className="bg-amber-500 transition-all duration-500" 
                  style={{ width: `${portfolioSummary.distribution.conditional.rate}%` }} 
                  title={`Conditional: ${portfolioSummary.distribution.conditional.count} (${portfolioSummary.distribution.conditional.rate}%)`}
                />
                <div 
                  className="bg-sky-500 transition-all duration-500" 
                  style={{ width: `${portfolioSummary.distribution.neutral.rate}%` }} 
                  title={`Neutral: ${portfolioSummary.distribution.neutral.count} (${portfolioSummary.distribution.neutral.rate}%)`}
                />
                <div 
                  className="bg-red-500 transition-all duration-500" 
                  style={{ width: `${portfolioSummary.distribution.disqualified.rate}%` }} 
                  title={`Disqualified: ${portfolioSummary.distribution.disqualified.count} (${portfolioSummary.distribution.disqualified.rate}%)`}
                />
                <div 
                  className="bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${portfolioSummary.distribution.insufficient.rate}%` }} 
                  title={`Needs Evidence: ${portfolioSummary.distribution.insufficient.count} (${portfolioSummary.distribution.insufficient.rate}%)`}
                />
              </div>

              {/* Legend numbers */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {portfolioSummary.distribution.qualified.count} Qualified ({portfolioSummary.distribution.qualified.rate}%)
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {portfolioSummary.distribution.conditional.count} Cond.
                </span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {portfolioSummary.distribution.disqualified.count} Disq.
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-secondary">Average Portfolio Score:</span>
              <span className="font-bold text-accent font-sans">
                {portfolioSummary.avgScore !== null ? `${portfolioSummary.avgScore}/100` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Tile 3: Dimensional Bottlenecks */}
          <div className="p-4 rounded-xl border border-border bg-bg-surface shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                Dimension Health & Gaps
              </span>
              <Scale className="h-4 w-4 text-purple-500" />
            </div>
            <div className="my-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary truncate">Top Strength:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px] text-right" title={portfolioSummary.strongestDim}>
                  {portfolioSummary.strongestDim}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary truncate">Top Bottleneck:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 truncate max-w-[140px] text-right" title={portfolioSummary.bottleneckDim}>
                  {portfolioSummary.bottleneckDim}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-secondary">Evidence Completeness:</span>
              <span className="font-bold text-text-primary">{portfolioSummary.evidenceCompleteness}%</span>
            </div>
          </div>

          {/* Tile 4: Recurring Disqualification & Risk Patterns */}
          <div className="p-4 rounded-xl border border-border bg-bg-surface shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
                Recurring Disqualifier Patterns
              </span>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="my-1.5 space-y-1.5 overflow-hidden">
              {portfolioSummary.recurringPatterns.slice(0, 2).map((pat, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-tight">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    pat.type === 'disqualified' ? 'bg-red-500' : pat.type === 'conditional' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <div className="truncate">
                    <span className="font-bold text-text-primary truncate">{pat.title}</span>
                    <span className="text-[10px] font-mono text-text-secondary ml-1">({pat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-secondary">Database Source:</span>
              <span className="font-bold text-text-primary">
                {activeView === 'mql' ? 'MQL Engine DB' : activeView === 'sql' ? 'SQL Module DB' : 'OQ Module DB'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTROLS & FILTER TOOLBAR */}
      {/* ======================================================== */}
      <div className="p-4 border-b border-border bg-bg-surface flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Quick Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeView.toUpperCase()} records by company or title...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-bg-primary/50 border border-border rounded-lg text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Overall Outcome Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-bg-primary/50 border border-border rounded-lg px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-text-secondary shrink-0" />
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase">Outcome:</span>
            <select
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-bg-surface">All Outcomes ({currentDataset.length})</option>
              <option value="Qualified" className="bg-bg-surface">Qualified ({portfolioSummary.distribution.qualified.count})</option>
              <option value="Conditional" className="bg-bg-surface">Conditional ({portfolioSummary.distribution.conditional.count})</option>
              <option value="Neutral" className="bg-bg-surface">Neutral ({portfolioSummary.distribution.neutral.count})</option>
              <option value="Disqualified" className="bg-bg-surface">Disqualified ({portfolioSummary.distribution.disqualified.count})</option>
              <option value="Insufficient Evidence" className="bg-bg-surface">Needs Evidence ({portfolioSummary.distribution.insufficient.count})</option>
              <option value="Not Assessed" className="bg-bg-surface">Not Assessed ({portfolioSummary.distribution.notAssessed.count})</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-bg-primary/50 border border-border rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3 h-3 text-text-secondary shrink-0" />
            <span className="text-[10px] font-mono font-bold text-text-secondary uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="score_desc" className="bg-bg-surface">Score: High → Low</option>
              <option value="score_asc" className="bg-bg-surface">Score: Low → High</option>
              <option value="company_asc" className="bg-bg-surface">Company Name: A → Z</option>
              <option value="confidence_desc" className="bg-bg-surface">Confidence Score</option>
            </select>
          </div>
        </div>

        {/* Right Side: Semantic Color Legend */}
        <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono text-text-secondary">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Qualified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Conditional</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>Disqualified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>Needs Evidence</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-border bg-bg-primary" />
            <span>Not Assessed</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* B. INTERACTIVE HEATMAP TABLE */}
      {/* ======================================================== */}
      <div className="w-full overflow-x-auto custom-scrollbar-horizontal border-b border-border">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-bg-primary/70 text-[10.5px] font-mono text-text-secondary uppercase tracking-wider">
              {/* Sticky Identification Column */}
              <th className="sticky left-0 z-20 bg-bg-surface/95 backdrop-blur-md px-4 py-2 w-[230px] min-w-[230px] max-w-[230px] border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.03)] font-bold">
                {activeView === 'mql' ? 'MQL Account / Lead' : activeView === 'sql' ? 'MQL Column Opportunity' : 'SQL Column Opportunity'}
              </th>

              {/* Dynamic Qualification Dimensions Columns */}
              {currentDimensions.map(dim => {
                const DimIcon = dim.icon;
                return (
                  <th 
                    key={dim.key} 
                    className="px-3 py-3 text-center border-r border-border/60 min-w-[110px] max-w-[140px] group cursor-default"
                    title={`${dim.name}: ${dim.description}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DimIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{dim.shortName}</span>
                    </div>
                    {dim.weight && (
                      <div className="text-[9px] font-normal text-text-secondary/70 lowercase font-mono">
                        wt: {Math.round(dim.weight * 100)}%
                      </div>
                    )}
                  </th>
                );
              })}

              {/* Final Column: Overall Qualification Outcome */}
              <th className="sticky right-0 z-20 bg-bg-surface/95 backdrop-blur-md px-4 py-2 min-w-[150px] border-l border-border shadow-[-2px_0_5px_rgba(0,0,0,0.03)] text-center font-bold">
                Overall Outcome
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60 text-xs font-sans">
            {paginatedRows.map(row => {
              const overallStyle = getSemanticStyle(row.overallSemantic);

              return (
                <tr 
                  key={row.id} 
                  className="hover:bg-bg-primary/40 transition-colors group"
                >
                  {/* Sticky Identification Cell */}
                  <td 
                    onClick={() => handleRowClick(row)}
                    className="sticky left-0 z-10 bg-bg-surface w-[230px] min-w-[230px] max-w-[230px] group-hover:bg-bg-primary/40 px-4 py-2 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.03)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <div className="font-bold text-text-primary truncate flex items-center gap-1.5">
                          {row.companyName}
                          <ExternalLink className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <div className="text-[10.5px] text-text-secondary truncate mt-0.5">
                          {row.recordTitle}
                        </div>
                        {/*<div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                          <span className="px-1.5 py-0.2 rounded bg-border/40 text-text-secondary">
                            {row.industry || 'General'}
                          </span>
                          {row.campaignName && (
                            <span className="text-accent truncate max-w-[110px]" title={row.campaignName}>
                              [{row.campaignName}]
                            </span>
                          )}
                        </div>*/}
                      </div>
                    </div>
                  </td>

                  {/* Dimension Heatmap Cells */}
                  {currentDimensions.map(dim => {
                    const cell = row.cells[dim.key] || {
                      dimensionKey: dim.key,
                      dimensionName: dim.name,
                      semantic: 'Not Assessed'
                    };
                    const cellStyle = getSemanticStyle(cell.semantic);
                    const CellIcon = cellStyle.icon;

                    return (
                      <td 
                        key={dim.key} 
                        onClick={() => handleCellClick(row, dim)}
                        className="px-2 py-2 text-center border-r border-border/40 cursor-pointer transition-all hover:scale-[1.02] p-1"
                        title={`${dim.name}: ${cell.semantic} ${cell.score ? `(${cell.score}/100)` : ''} - Click for AI Evidence Drawer`}
                      >
                        <div className={`h-9 w-full rounded border flex flex-col items-center justify-center transition-all shadow-2xs hover:shadow-sm ${cellStyle.bg} ${cellStyle.border}`}>
                          <div className="flex items-center gap-1 leading-none">
                            <CellIcon className={`w-3.5 h-3.5 ${cellStyle.text} shrink-0`} />
                            {typeof cell.score === 'number' ? (
                              <span className={`font-mono font-bold text-[11px] ${cellStyle.text}`}>
                                {cell.score}
                              </span>
                            ) : (
                              <span className={`text-[9px] font-mono font-medium ${cellStyle.text}`}>
                                {cellStyle.label.split(' ')[0]}
                              </span>
                            )}
                          </div>

                          {/*<div className="text-[8.5px] font-mono opacity-80 mt-0.5 truncate max-w-[80px]">
                            {typeof cell.score === 'number' ? cellStyle.label : 'Pending'}
                          </div>*/}
                        </div>
                      </td>
                    );
                  })}

                  {/* Final Overall Outcome Cell */}
                  <td className="sticky right-0 z-10 bg-bg-surface group-hover:bg-bg-primary/40 px-3 py-2 text-center border-l border-border shadow-[-2px_0_5px_rgba(0,0,0,0.03)] transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${overallStyle.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${overallStyle.dot}`} />
                        {row.overallSemantic}
                      </span>
                      {typeof row.overallScore === 'number' && (
                        <div className="text-[11px] font-mono font-bold text-text-primary mt-1">
                          {row.overallScore}<span className="text-[9px] text-text-secondary">/100</span>
                        </div>
                      )}
                      {/*{typeof row.overallConfidence === 'number' && (
                        <div className="text-[8.5px] font-mono text-text-secondary mt-0.5">
                          {row.overallConfidence}% confidence
                        </div>
                      )}*/}
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={currentDimensions.length + 2} className="py-12 text-center text-text-secondary text-xs">
                  <div className="flex flex-col items-center justify-center">
                    <Info className="h-8 w-8 text-text-secondary/40 mb-2" />
                    <p className="font-semibold text-text-primary">
                      {activeView === 'sql' 
                        ? 'No opportunities currently in MQL Column in Lead Canvas' 
                        : activeView === 'opportunity' 
                          ? 'No opportunities currently in SQL Column in Lead Canvas' 
                          : 'No records found matching current criteria'}
                    </p>
                    <p className="text-[11px] mt-1 text-text-secondary">
                      {activeView === 'sql' 
                        ? 'Leads qualified as MQL with handover to sales will populate this section automatically.' 
                        : activeView === 'opportunity' 
                          ? 'Leads promoted to SQL in the Kanban canvas will populate this section automatically.' 
                          : 'Try clearing the search query or adjusting the outcome filter.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setOutcomeFilter('all');
                        setDimensionFilter('all');
                      }}
                      className="mt-3 px-3 py-1 rounded-lg bg-bg-primary border border-border text-xs font-bold text-accent hover:border-accent cursor-pointer transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* PAGINATION & FOOTER INFO */}
      {/* ======================================================== */}
      <div className="p-4 bg-bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-text-secondary text-[11px] font-mono">
          Showing <span className="font-bold text-text-primary">{filteredAndSortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-bold text-text-primary">{Math.min(currentPage * pageSize, filteredAndSortedRows.length)}</span> of <span className="font-bold text-text-primary">{filteredAndSortedRows.length}</span> {activeView.toUpperCase()} records
        </div>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary mr-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-bg-primary border border-border rounded px-1.5 py-0.5 text-text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page nav */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono font-bold text-text-primary px-2">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DETAIL DRAWER / SLIDE-OVER DRILLDOWN (Via Portal) */}
      {/* ======================================================== */}
      {typeof document !== 'undefined' && createPortal(
        drawerOpen && selectedCellInfo && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          >
            <div 
              className="w-full max-w-2xl max-h-[85vh] bg-bg-surface border border-border rounded-2xl shadow-2xl relative flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border bg-bg-primary/40 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent uppercase tracking-wider">
                      {activeView.toUpperCase()} Dimension Intelligence
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${getSemanticStyle(selectedCellInfo.cell.semantic).badgeBg}`}>
                      {selectedCellInfo.cell.semantic}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-text-primary tracking-tight mt-1.5">
                    {selectedCellInfo.row.companyName}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedCellInfo.row.recordTitle} • {selectedCellInfo.row.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dimension Hero Card */}
              <div className="p-5 border-b border-border bg-bg-surface">
                <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0 mt-0.5">
                      {React.createElement(selectedCellInfo.dimension.icon, { className: 'h-5 w-5' })}
                    </span>
                    <div>
                      <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                        {selectedCellInfo.dimension.category} • {selectedCellInfo.dimension.key}
                      </div>
                      <h4 className="text-sm font-black text-text-primary tracking-tight mt-0.5">
                        {selectedCellInfo.dimension.name}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {selectedCellInfo.dimension.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {typeof selectedCellInfo.cell.score === 'number' ? (
                      <div>
                        <div className="text-2xl font-black font-mono text-accent">
                          {selectedCellInfo.cell.score}
                        </div>
                        <div className="text-[9px] font-mono text-text-secondary">/ 100 Score</div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold text-text-secondary">
                        Unscored
                      </span>
                    )}
                    {typeof selectedCellInfo.cell.confidence === 'number' && (
                      <div className="text-[9px] font-mono text-text-secondary mt-1">
                        {selectedCellInfo.cell.confidence}% conf.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Body Details */}
              <div className="flex-1 overflow-y-auto custom-scrollbar-vertical p-5 space-y-5 text-xs">
                {/* 1. Assessment Rationale */}
                <div className="space-y-1.5">
                  <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Dedicated Database AI Reasoning
                  </h5>
                  <div className="p-3.5 rounded-xl bg-bg-primary/50 border border-border text-text-primary text-xs leading-relaxed font-sans">
                    {selectedCellInfo.cell.rationale || selectedCellInfo.row.overallExplanation || 'No evaluation rationale logged for this dimension in the database.'}
                  </div>
                </div>

                {/* 2. Supporting Evidence & Positive Signals */}
                <div className="space-y-1.5">
                  <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Supporting Evidence & Positive Signals
                  </h5>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                    {selectedCellInfo.cell.supportingEvidence && selectedCellInfo.cell.supportingEvidence.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedCellInfo.cell.supportingEvidence.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-text-primary">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary italic text-[11px]">
                        No explicit positive evidence signals logged in database for this dimension.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Risks & Weaknesses */}
                <div className="space-y-1.5">
                  <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Identified Risks & Friction Points
                  </h5>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                    {((selectedCellInfo.cell.negativeEvidence && selectedCellInfo.cell.negativeEvidence.length > 0) ||
                      (selectedCellInfo.cell.risks && selectedCellInfo.cell.risks.length > 0)) ? (
                      <ul className="space-y-1.5">
                        {(selectedCellInfo.cell.negativeEvidence || []).concat(selectedCellInfo.cell.risks || []).map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary italic text-[11px]">
                        Zero major risk points identified in this dimensional scope.
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Missing Evidence / Information Gaps */}
                <div className="space-y-1.5">
                  <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    Evidence Coverage Gaps
                  </h5>
                  <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
                    {selectedCellInfo.cell.missingEvidence && selectedCellInfo.cell.missingEvidence.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedCellInfo.cell.missingEvidence.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary italic text-[11px]">
                        Required minimum evidence questions fulfilled.
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Recommended Actions */}
                {selectedCellInfo.cell.recommendations && selectedCellInfo.cell.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5" />
                      Recommended Next Best Actions
                    </h5>
                    <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 text-xs">
                      <ul className="space-y-1.5">
                        {selectedCellInfo.cell.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-text-primary font-medium">
                            <span className="text-accent font-bold">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-bg-surface flex items-center justify-between gap-3">
                <div className="text-[10px] font-mono text-text-secondary">
                  Dimension Code: <span className="font-bold text-text-primary">{selectedCellInfo.dimension.key}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      handleRowClick(selectedCellInfo.row);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all cursor-pointer shadow-sm"
                  >
                    <span>Open Full Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
};
