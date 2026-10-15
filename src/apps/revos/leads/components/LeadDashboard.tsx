import React, { useState, useEffect } from 'react';
import { MQLCampaign, MQLLead, MQLQualificationResult } from '../../types/mql';
import { SQLOpportunity, SQLAssessment } from '../../types/sql';
import { PromotionDataService } from '../services/promotionDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLDataService } from '../services/sqlDataService';
import { supabase } from '@/src/lib/supabase';
import { QualificationIntelligenceSection } from './QualificationIntelligenceSection';
import { QualificationDimensionIntelligence } from './QualificationDimensionIntelligence';
import { 
  TrendingUp, 
  Users, 
  Cpu, 
  Zap, 
  Award, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Lightbulb,
  Filter,
  Workflow
} from 'lucide-react';

interface LeadDashboardProps {
  campaigns?: MQLCampaign[];
  selectedCampaignId?: string;
  onCampaignChange?: (campaignId: string) => void;
  campaign?: MQLCampaign | null;
  leads: MQLLead[];
  qualResults: MQLQualificationResult[];
  onNavigateToLead?: (lead: MQLLead, columnType?: 'lead' | 'mql' | 'sql' | 'opp') => void;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({ 
  campaigns = [],
  selectedCampaignId = 'all',
  onCampaignChange,
  campaign, 
  leads, 
  qualResults,
  onNavigateToLead
}) => {
  const isAllCampaigns = !campaign || selectedCampaignId === 'all';

  const [mqlPromotions, setMqlPromotions] = useState<any[]>([]);
  const [oppPromotions, setOppPromotions] = useState<any[]>([]);
  const [oppRevenueMap, setOppRevenueMap] = useState<Record<string, number>>({});
  const [promotedLeadIds, setPromotedLeadIds] = useState<string[]>([]);
  const [sqlPromotedLeadIds, setSqlPromotedLeadIds] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<SQLOpportunity[]>([]);
  const [sqlAssessments, setSqlAssessments] = useState<SQLAssessment[]>([]);
  const [sqlResultsMap, setSqlResultsMap] = useState<Record<string, any>>({});
  const [oppFormDataMap, setOppFormDataMap] = useState<Record<string, any>>({});
  const [oppSessionsMap, setOppSessionsMap] = useState<Record<string, any>>({});
  const [oppResultsMap, setOppResultsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const [
          mqlPromos, 
          oppPromos, 
          revMap, 
          promoIds, 
          sqlPromoIds,
          opps,
          assessListRes
        ] = await Promise.all([
          PromotionDataService.getMqlSqlPromotions().catch(() => []),
          PromotionDataService.getSqlOpportunityPromotions().catch(() => []),
          OpportunityDataService.getOpportunityEstimatedRevenuesMap().catch(() => ({})),
          PromotionDataService.getPromotedLeadIds().catch(() => []),
          PromotionDataService.getSqlOpportunityPromotedLeadIds().catch(() => []),
          SQLDataService.getOpportunities().catch(() => []),
          (async () => {
            try {
              const res = await supabase.from('sql_assessments').select('*').order('created_at', { ascending: false });
              return res?.data || [];
            } catch {
              return [];
            }
          })()
        ]);
        setMqlPromotions(mqlPromos || []);
        setOppPromotions(oppPromos || []);
        if (revMap) setOppRevenueMap(revMap);
        if (promoIds) setPromotedLeadIds(promoIds);
        if (sqlPromoIds) setSqlPromotedLeadIds(sqlPromoIds);
        if (opps) setOpportunities(opps);
        if (assessListRes) setSqlAssessments(assessListRes as SQLAssessment[]);

        // Load SQL saved results and SQL Opportunity Qualification Roster data (matching SqlToOpportunityTable)
        const allOppList: SQLOpportunity[] = [...(opps || [])];
        leads.forEach(l => {
          if (
            l.status === 'SQL' || 
            promoIds?.includes(l.id) || 
            sqlPromoIds?.includes(l.id) || 
            (l as any).is_opportunity === true || 
            l.status === 'Opportunity'
          ) {
            const exists = allOppList.some(o => 
              o.mql_reference_id === l.id || 
              (o.company_name && l.company_name && o.company_name.toLowerCase().trim() === l.company_name.toLowerCase().trim())
            );
            if (!exists) {
              allOppList.push({
                id: `virtual_opp_${l.id}`,
                company_name: l.company_name || 'Enterprise Client',
                industry: l.lead_industry || 'Enterprise Software',
                revenue_motion: 'Digital Solution Selling',
                opportunity_name: `${l.company_name || 'Enterprise'} Opportunity`,
                mql_reference_id: l.id,
                created_at: l.lead_date || new Date().toISOString()
              });
            }
          }
        });

        if (allOppList.length > 0) {
          const sqlResMap: Record<string, any> = {};
          const fRecords: Record<string, any> = {};
          const sessMap: Record<string, any> = {};
          const oqResMap: Record<string, any> = {};

          await Promise.all(
            allOppList.map(async (opp: SQLOpportunity) => {
              const oppId = opp.id;
              try {
                const [sqlRes, fData, sess, oppRes] = await Promise.all([
                  SQLDataService.getSavedQualificationResult(oppId).catch(() => null),
                  OpportunityDataService.getOpportunityFormData(oppId).catch(() => null),
                  OpportunityDataService.getSessionByOpportunity(oppId).catch(() => null),
                  OpportunityDataService.getSavedQualificationResult(oppId).catch(() => null)
                ]);
                if (sqlRes) sqlResMap[oppId] = sqlRes;
                if (fData) fRecords[oppId] = fData;
                if (sess) sessMap[oppId] = sess;

                let resolvedOppRes = oppRes;
                if (!resolvedOppRes && typeof window !== 'undefined') {
                  const cached = localStorage.getItem(`oq_result_${oppId}`);
                  if (cached) {
                    try {
                      const parsed = JSON.parse(cached);
                      resolvedOppRes = parsed.qualification_summary ? parsed : { qualification_summary: parsed };
                    } catch {}
                  }
                }
                if (resolvedOppRes) oqResMap[oppId] = resolvedOppRes;
              } catch (e) {}
            })
          );
          setSqlResultsMap(sqlResMap);
          setOppFormDataMap(fRecords);
          setOppSessionsMap(sessMap);
          setOppResultsMap(oqResMap);
        }
      } catch (err) {
        console.error('Failed to load promotions in LeadDashboard:', err);
      }
    };

    loadPromotions();

    const handleUpdate = () => {
      loadPromotions();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lead_promoted_to_sql', handleUpdate);
      window.addEventListener('sql_qualification_updated', handleUpdate);
      window.addEventListener('opportunity_form_updated', handleUpdate);
      window.addEventListener('opportunity_qualification_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('lead_promoted_to_sql', handleUpdate);
        window.removeEventListener('sql_qualification_updated', handleUpdate);
        window.removeEventListener('opportunity_form_updated', handleUpdate);
        window.removeEventListener('opportunity_qualification_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [leads]);

  // 1. Calculations & Metrics Aggregations
  const totalLeads = leads.length;
  const evaluatedLeads = qualResults.length;

  // 7-day threshold calculation
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const isWithinLast7Days = (dateVal: any): boolean => {
    if (!dateVal) return false;
    let d: Date | null = null;
    if (dateVal instanceof Date) {
      d = isNaN(dateVal.getTime()) ? null : dateVal;
    } else if (typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else if (typeof dateVal === 'string') {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        const parts = dateVal.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const alt = new Date(year, month, day);
          if (!isNaN(alt.getTime())) d = alt;
        }
      }
    }
    if (!d) return false;
    return d.getTime() >= sevenDaysAgo.getTime() && d.getTime() <= now.getTime();
  };

  // 1. Total Leads: absolute change & percentage change in last 7 days
  const totalLeads7d = leads.filter(l => isWithinLast7Days(l.created_at) || isWithinLast7Days(l.lead_date)).length;
  const prevTotalLeads = Math.max(0, totalLeads - totalLeads7d);
  const totalLeadsPct = prevTotalLeads > 0 
    ? ((totalLeads7d / prevTotalLeads) * 100).toFixed(1) 
    : (totalLeads7d > 0 ? '100.0' : '0.0');
  const totalLeadsChangeText = `${totalLeads7d >= 0 ? '+' : ''}${totalLeads7d} (${totalLeads7d >= 0 ? '+' : ''}${totalLeadsPct}%) in last 7 days`;

  // Helper to extract handover ticket details for MQL Kanban matching
  const getMqlHandoverInfo = (lead: MQLLead) => {
    let ticket: any = null;
    const leadQual = qualResults.find(r => r.lead_id === lead.id);
    if (leadQual?.recommendations && typeof leadQual.recommendations === 'object' && !Array.isArray(leadQual.recommendations)) {
      const recObj = leadQual.recommendations as any;
      if (recObj.handover_ticket) {
        ticket = recObj.handover_ticket;
      }
    }
    if (!ticket && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`mql_handover_${lead.id}`);
      if (stored) {
        try { ticket = JSON.parse(stored); } catch {}
      }
    }
    const isHandedOver = lead.handover_status === 'Handover to Sales' || !!ticket;
    return { isHandedOver, ticket, leadQual };
  };

  // 2. Qualified MQLs: retrieved from MQL Kanban in Lead Canvas + absolute and percentage change in last 7 days
  const mqlLeadsList = leads.filter(l => getMqlHandoverInfo(l).isHandedOver);
  const qualifiedMqlsCount = mqlLeadsList.length;

  const mql7dCount = mqlLeadsList.filter(l => {
    const { ticket, leadQual } = getMqlHandoverInfo(l);
    return (
      isWithinLast7Days(ticket?.handed_over_at) ||
      isWithinLast7Days(ticket?.handover_date) ||
      isWithinLast7Days(leadQual?.evaluated_at) ||
      isWithinLast7Days(l.updated_at)
    );
  }).length;
  const prevMqlCount = Math.max(0, qualifiedMqlsCount - mql7dCount);
  const mqlPct = prevMqlCount > 0 
    ? ((mql7dCount / prevMqlCount) * 100).toFixed(1) 
    : (mql7dCount > 0 ? '100.0' : '0.0');
  const mqlChangeText = `${mql7dCount >= 0 ? '+' : ''}${mql7dCount} (${mql7dCount >= 0 ? '+' : ''}${mqlPct}%) in last 7 days`;

  // 3. Qualified SQLs: retrieved from SQL Kanban in Lead Canvas + absolute and percentage change in last 7 days
  const sqlPromoMap = new Map<string, any>();
  mqlPromotions.forEach(p => {
    if (p.lead_id) sqlPromoMap.set(p.lead_id, p);
  });
  const sqlLeadsList = leads.filter(l => 
    l.status === 'SQL' || 
    promotedLeadIds.includes(l.id) || 
    sqlPromoMap.has(l.id)
  );
  const qualifiedSqlsCount = sqlLeadsList.length;

  const sql7dCount = sqlLeadsList.filter(l => {
    const promo = sqlPromoMap.get(l.id);
    if (promo && isWithinLast7Days(promo.promoted_at)) return true;
    if (l.status === 'SQL' && (isWithinLast7Days(l.updated_at) || isWithinLast7Days(l.created_at))) return true;
    return false;
  }).length;
  const prevSqlCount = Math.max(0, qualifiedSqlsCount - sql7dCount);
  const sqlPct = prevSqlCount > 0 
    ? ((sql7dCount / prevSqlCount) * 100).toFixed(1) 
    : (sql7dCount > 0 ? '100.0' : '0.0');
  const sqlChangeText = `${sql7dCount >= 0 ? '+' : ''}${sql7dCount} (${sql7dCount >= 0 ? '+' : ''}${sqlPct}%) in last 7 days`;

  // 4. Qualified Opportunities: retrieved from Opportunity Kanban in Lead Canvas + absolute and percentage change in last 7 days
  const oppPromoMap = new Map<string, any>();
  oppPromotions.forEach(p => {
    if (p.lead_id) oppPromoMap.set(p.lead_id, p);
  });
  const oppLeadsList = leads.filter(l => 
    sqlPromotedLeadIds.includes(l.id) ||
    oppPromoMap.has(l.id) || 
    (l as any).is_opportunity === true || 
    (l.status as string) === 'Opportunity' ||
    (typeof window !== 'undefined' && localStorage.getItem(`sql_opp_promoted_lead_${l.id}`) === 'true')
  );
  const qualifiedOppsCount = oppLeadsList.length;

  const opp7dCount = oppLeadsList.filter(l => {
    const promo = oppPromoMap.get(l.id);
    if (promo && (isWithinLast7Days(promo.promoted_at) || isWithinLast7Days(promo.created_at))) return true;
    if (((l as any).is_opportunity === true || l.status === 'Opportunity') && isWithinLast7Days(l.updated_at)) return true;
    return false;
  }).length;
  const prevOppCount = Math.max(0, qualifiedOppsCount - opp7dCount);
  const oppPct = prevOppCount > 0 
    ? ((opp7dCount / prevOppCount) * 100).toFixed(1) 
    : (opp7dCount > 0 ? '100.0' : '0.0');
  const oppChangeText = `${opp7dCount >= 0 ? '+' : ''}${opp7dCount} (${opp7dCount >= 0 ? '+' : ''}${oppPct}%) in last 7 days`;

  // Funnel Conversion rates matching Lead Canvas
  const calcRatio = (num: number, denom: number) => {
    if (denom === 0) return 0;
    return Math.round((num / denom) * 100);
  };

  const leadToMqlRate = calcRatio(qualifiedMqlsCount, totalLeads);
  const mqlToSqlRate = calcRatio(qualifiedSqlsCount, qualifiedMqlsCount);
  const sqlToOppRate = calcRatio(qualifiedOppsCount, qualifiedSqlsCount);
  const leadToOppRate = totalLeads > 0 
    ? Math.round((qualifiedOppsCount / totalLeads) * 100) 
    : 0;

  // Helper to extract Estimated Revenue defined in Opportunity Form (matching LeadCanvas)
  const getOpportunityEstimatedRevenue = (lead: MQLLead): number => {
    if (oppRevenueMap[lead.id] !== undefined && oppRevenueMap[lead.id] > 0) {
      return oppRevenueMap[lead.id];
    }
    if (typeof window !== 'undefined') {
      const oppCardEdits = localStorage.getItem(`opp_isolated_card_edits_${lead.id}`);
      if (oppCardEdits) {
        try {
          const parsed = JSON.parse(oppCardEdits);
          if (parsed.estimated_revenue) {
            const num = parseFloat(String(parsed.estimated_revenue).replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) return num;
          }
        } catch (e) {}
      }

      const sqlCardEdits = localStorage.getItem(`sql_isolated_card_edits_${lead.id}`);
      if (sqlCardEdits) {
        try {
          const parsed = JSON.parse(sqlCardEdits);
          if (parsed.estimated_revenue) {
            const num = parseFloat(String(parsed.estimated_revenue).replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) return num;
          }
        } catch (e) {}
      }
    }
    const rawNum = parseFloat(String(lead.annual_revenue || '').replace(/[^0-9.]/g, ''));
    return isNaN(rawNum) ? 0 : rawNum;
  };

  // Value formatting: converted to kilo (k) when > 1,000,000, and million (M) when > 10,000,000
  const formatConvertedRevenue = (val: number): string => {
    if (!val || val === 0) return '$0';
    if (val >= 10000000) {
      const millions = val / 1000000;
      const formatted = millions % 1 === 0 
        ? millions.toLocaleString('en-US') 
        : parseFloat(millions.toFixed(2)).toLocaleString('en-US');
      return `$${formatted}M`;
    }
    if (val >= 1000000) {
      const kilos = val / 1000;
      const formatted = kilos % 1 === 0 
        ? kilos.toLocaleString('en-US') 
        : parseFloat(kilos.toFixed(1)).toLocaleString('en-US');
      return `$${formatted}k`;
    }
    return `$${val.toLocaleString('en-US')}`;
  };

  // Total estimated revenue and average for opportunities listed in SQL column
  const sqlTotalRevenue = sqlLeadsList.reduce((acc, curr) => {
    return acc + getOpportunityEstimatedRevenue(curr);
  }, 0);
  const formattedSqlRevenue = formatConvertedRevenue(sqlTotalRevenue);
  const avgSqlValue = sqlLeadsList.length > 0 
    ? Math.round(sqlTotalRevenue / sqlLeadsList.length) 
    : 0;
  const formattedAvgSqlValue = `$${avgSqlValue.toLocaleString('en-US')}`;

  // Total estimated revenue and average for opportunities listed in Opportunity column
  const oppTotalRevenue = oppLeadsList.reduce((acc, curr) => {
    return acc + getOpportunityEstimatedRevenue(curr);
  }, 0);
  const formattedOppRevenue = formatConvertedRevenue(oppTotalRevenue);
  const avgOppValue = oppLeadsList.length > 0 
    ? Math.round(oppTotalRevenue / oppLeadsList.length) 
    : 0;
  const formattedAvgOppValue = `$${avgOppValue.toLocaleString('en-US')}`;

  // Status breakdown from lead records
  const statusCounts = leads.reduce((acc, lead) => {
    const status = lead.status || 'New';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highlyQualifiedCount = statusCounts['Highly Qualified MQL'] || 0;
  const qualifiedCount = statusCounts['Qualified MQL'] || 0;
  const nurtureCount = statusCounts['Marketing Nurture'] || 0;
  const disqualifiedCount = statusCounts['Disqualified'] || 0;
  const newOrAssessingCount = totalLeads - (highlyQualifiedCount + qualifiedCount + nurtureCount + disqualifiedCount);

  const evaluationRate = totalLeads > 0 ? Math.round((evaluatedLeads / totalLeads) * 100) : 0;

  // Core metrics averages
  const avgScore = evaluatedLeads > 0 
    ? Math.round(qualResults.reduce((acc, r) => acc + r.qualification_score, 0) / evaluatedLeads) 
    : 0;

  const avgConfidence = evaluatedLeads > 0
    ? Math.round(qualResults.reduce((acc, r) => acc + r.confidence_score, 0) / evaluatedLeads)
    : 0;

  // Dimension average scores
  const dimensionAverages = {
    fit: 0,
    intent: 0,
    engagement: 0,
    timing: 0
  };

  if (evaluatedLeads > 0) {
    qualResults.forEach(r => {
      dimensionAverages.fit += r.dimension_scores.fit;
      dimensionAverages.intent += r.dimension_scores.intent;
      dimensionAverages.engagement += r.dimension_scores.engagement;
      dimensionAverages.timing += r.dimension_scores.timing;
    });

    dimensionAverages.fit = Math.round(dimensionAverages.fit / evaluatedLeads);
    dimensionAverages.intent = Math.round(dimensionAverages.intent / evaluatedLeads);
    dimensionAverages.engagement = Math.round(dimensionAverages.engagement / evaluatedLeads);
    dimensionAverages.timing = Math.round(dimensionAverages.timing / evaluatedLeads);
  }



  // 3. Dynamic Cognitive Insights Engine (Recommendations Card)
  const getDynamicInsight = () => {
    if (evaluatedLeads === 0) {
      return {
        title: "Initiate Qualifications",
        description: isAllCampaigns
          ? "Zero leads have been analyzed across your campaigns yet. Populate the Leads Register and run the AI Qualification Engine on individuals to unlock deep dimension diagnostics."
          : "Zero leads have been analyzed in this campaign yet. Populate the Leads Register and run the AI Qualification Engine on individuals to unlock deep dimension diagnostics.",
        action: "Go to Lead List & Add Profiles"
      };
    }

    if (dimensionAverages.fit < 60) {
      return {
        title: "ICP Deviation Warning",
        description: `Average Fit is quite low (${dimensionAverages.fit}/100). The current inbound leads do not align well with the target ICP. Consider re-evaluating target segments, campaign channels, or refining the target market configuration.`,
        action: "Refine Campaign ICP Criteria"
      };
    }

    if (dimensionAverages.timing < 55) {
      return {
        title: "Compelling Timing Gap",
        description: `Average Timing score is at ${dimensionAverages.timing}/100. Leads show fit and engagement, but are missing clear immediate purchasing triggers or urgency. Focus on setting up nurture campaigns based on product triggers.`,
        action: "Enroll in Marketing Nurture Sequences"
      };
    }

    if (dimensionAverages.intent > 75) {
      return {
        title: "High Buyer-Intent Signals Detected",
        description: `Average Intent is exceptionally strong at ${dimensionAverages.intent}/100! These leads show active search behaviors, competitive comparisons, or strong outbound response rates. Dispatch senior account executives immediately for personalized outbound sequences.`,
        action: "Prioritize Direct Outbound Campaign"
      };
    }

    return {
      title: "Strong Balanced Lead Flow",
      description: "Leads show healthy alignment across Fit, Intent, and Engagement. The current revenue motion parameters appear well-optimized. Keep expanding current outbound rosters.",
      action: "Scale Roster Acquisition"
    };
  };

  const cognitiveInsight = getDynamicInsight();

  // Helper to parse description JSON (matching SqlToOpportunityTable)
  const parseOppDescription = (desc?: string) => {
    if (desc && desc.trim().startsWith('{')) {
      try {
        return JSON.parse(desc);
      } catch {}
    }
    return {};
  };

  // Helper to determine if status is "Qualified" (matching SqlToOpportunityTable)
  const isOpportunityQualified = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return (
      s.includes('qualified') &&
      !s.includes('conditional') &&
      !s.includes('conditionally') &&
      !s.includes('disqualified')
    );
  };

  // 4. SQL Leaderboard ranking (Top SQLs from SQL Opportunity Qualification Roster - SqlToOpp table)
  // Only select opportunities with "Qualified" in Opportunity Status, selecting Top 5 based on Opportunity Score
  const deletedOppIds: string[] = (() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sql_opportunity_table_deleted_ids');
        return stored ? JSON.parse(stored) : [];
      } catch {}
    }
    return [];
  })();

  const oppList: SQLOpportunity[] = [...opportunities].filter(o => !deletedOppIds.includes(o.id));

  // If filtered to a specific campaign, filter opportunities matching the scoped leads
  const scopedOpps = isAllCampaigns 
    ? oppList 
    : oppList.filter(opp => leads.some(l => 
        l.id === opp.mql_reference_id ||
        (l.company_name && opp.company_name && l.company_name.toLowerCase().trim() === opp.company_name.toLowerCase().trim())
      ));

  // Also include any SQL leads from the current scope that don't yet have an entry in scopedOpps (matching SqlToOpportunityTable)
  sqlLeadsList.forEach(l => {
    const exists = scopedOpps.some(opp => 
      opp.mql_reference_id === l.id || 
      (opp.company_name && l.company_name && opp.company_name.toLowerCase().trim() === l.company_name.toLowerCase().trim())
    );
    const virtualId = `virtual_opp_${l.id}`;
    if (!exists && !deletedOppIds.includes(virtualId)) {
      scopedOpps.push({
        id: virtualId,
        company_name: l.company_name || 'Enterprise Client',
        industry: l.lead_industry || 'Enterprise Software',
        revenue_motion: 'Digital Solution Selling',
        opportunity_name: `${l.company_name || 'Enterprise'} Opportunity`,
        mql_reference_id: l.id,
        created_at: l.lead_date || new Date().toISOString()
      });
    }
  });

  const topSqls = scopedOpps.map(opp => {
    const oppId = opp.id;
    const formRecord = oppFormDataMap[oppId];
    const qResult = oppResultsMap[oppId];
    const session = oppSessionsMap[oppId];
    const parsedDesc = parseOppDescription(opp.description);

    // Find backing lead
    const backingLead = leads.find(l => 
      l.id === opp.mql_reference_id ||
      (l.company_name && opp.company_name && l.company_name.toLowerCase().trim() === opp.company_name.toLowerCase().trim())
    );

    // 1. Company Name (from SqlToOpportunityTable)
    const companyName = formRecord?.company_name || opp.company_name || backingLead?.company_name || '—';

    // 2. Opportunity Name (replaces Contact - from SqlToOpportunityTable)
    const opportunityName = formRecord?.opportunity_name || opp.opportunity_name || parsedDesc.opportunity_name || `${companyName} Opportunity`;

    // 3. Estimated Revenue (replaces Contact Title - from SqlToOpportunityTable)
    const rawRevenue = formRecord?.estimated_revenue || parsedDesc.estimated_revenue || (opp as any).deal_size;
    let estimatedRevenue = '—';
    let numRevenue = 0;
    if (rawRevenue !== undefined && rawRevenue !== null && rawRevenue !== '') {
      if (typeof rawRevenue === 'number') {
        numRevenue = rawRevenue;
        estimatedRevenue = `$${rawRevenue.toLocaleString('en-US')}`;
      } else {
        const str = String(rawRevenue).trim();
        const n = parseFloat(str.replace(/[^0-9.]/g, ''));
        if (!isNaN(n)) numRevenue = n;
        if (str.startsWith('$')) {
          estimatedRevenue = str;
        } else {
          estimatedRevenue = !isNaN(n) ? `$${n.toLocaleString('en-US')}` : str;
        }
      }
    } else if (backingLead) {
      numRevenue = getOpportunityEstimatedRevenue(backingLead);
      estimatedRevenue = numRevenue > 0 ? `$${numRevenue.toLocaleString('en-US')}` : '—';
    }

    // 4. Opportunity Score (from SqlToOpportunityTable: qResult?.qualification_summary?.overall_score ?? (session?.overall_score ?? (session ? 75 : 0)))
    const scoreVal = qResult?.qualification_summary?.overall_score ?? (session?.overall_score ?? (session ? 75 : 0));
    const opportunityScore = Math.round(Number(scoreVal) || 0);

    // 5. Opportunity Status (from SqlToOpportunityTable: qResult?.qualification_summary?.qualification_status || session?.qualification_status || 'Needs More Evidence')
    const opportunityStatus = qResult?.qualification_summary?.qualification_status 
      || session?.qualification_status 
      || 'Needs More Evidence';

    return {
      oppId,
      opportunityName,
      companyName,
      numRevenue,
      estimatedRevenue,
      opportunityScore,
      opportunityStatus,
      backingLead
    };
  })
  // ONLY select opportunities with "Qualified" in Opportunity Status
  .filter(item => isOpportunityQualified(item.opportunityStatus))
  // Select Top 5 based on Opportunity Score
  .sort((a, b) => {
    if (b.opportunityScore !== a.opportunityScore) return b.opportunityScore - a.opportunityScore;
    return b.numRevenue - a.numRevenue;
  })
  .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Campaign Details Header block with Master Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-5 rounded-2xl bg-bg-surface/50 border border-border shadow-sm">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-mono font-black text-text-secondary uppercase tracking-widest">
            {isAllCampaigns ? "Account-Wide Pipeline Diagnostics" : "Active Campaign Diagnostics"}
          </span>
          <h2 className="text-lg font-black text-text-primary uppercase tracking-wide mt-0.5 truncate">
            {isAllCampaigns ? "All Campaigns Summary" : `${campaign?.name} Summary`}
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
            {isAllCampaigns 
              ? "Aggregated metrics, qualification diagnostics, and leaderboard across all campaigns enrolled under your account."
              : (campaign?.objective || "Aggregated metrics and qualitative distribution across all active prospects under this campaign blueprint.")
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          {/* Master Campaign Filter Dropdown */}
          {onCampaignChange && campaigns && campaigns.length > 0 && (
            <div className="flex items-center gap-2 bg-bg-surface border border-border rounded-xl px-3 py-2 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase whitespace-nowrap">Campaign:</span>
              <select
                value={selectedCampaignId || 'all'}
                onChange={(e) => onCampaignChange(e.target.value)}
                className="bg-transparent text-text-primary font-sans text-xs font-bold focus:outline-none cursor-pointer pr-1 w-full sm:w-auto min-w-[170px]"
              >
                <option value="all" className="bg-bg-surface text-text-primary font-medium">All Campaigns (Account-Wide)</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id} className="bg-bg-surface text-text-primary font-medium">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {isAllCampaigns ? (
              <>
                <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
                  {campaigns?.length || 0} Campaigns
                </span>
                <span className="px-2.5 py-1 bg-bg-primary border border-border text-text-secondary font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
                  {totalLeads} Total Leads
                </span>
              </>
            ) : (
              <>
                <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
                  {campaign?.industry || 'General'}
                </span>
                <span className="px-2.5 py-1 bg-bg-primary border border-border text-text-secondary font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
                  {campaign?.revenue_motion?.replace(/_/g, ' ') || 'General Motion'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Panel Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Leads", 
            val: totalLeads, 
            desc: totalLeadsChangeText, 
            icon: Users, 
            color: "text-blue-500",
            change: totalLeads7d
          },
          { 
            label: "Qualified MQLs", 
            val: qualifiedMqlsCount, 
            desc: mqlChangeText, 
            icon: Award, 
            color: "text-emerald-500",
            change: mql7dCount
          },
          { 
            label: "Qualified SQLs", 
            val: qualifiedSqlsCount, 
            desc: sqlChangeText, 
            icon: TrendingUp, 
            color: "text-accent",
            change: sql7dCount
          },
          { 
            label: "Qualified Opportunities", 
            val: qualifiedOppsCount, 
            desc: oppChangeText, 
            icon: Target, 
            color: "text-purple-500",
            change: opp7dCount
          }
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-110`} />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-1">{stat.val}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono leading-normal ${stat.change > 0 ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-text-secondary font-medium'}`}>
                {stat.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel Conversion Rates KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Lead-to-MQL Conversion",
            val: `${leadToMqlRate}%`,
            desc: `${qualifiedMqlsCount} of ${totalLeads} leads qualified as MQL`,
            icon: Workflow,
            color: "text-blue-500",
            barColor: "bg-blue-500",
            rate: leadToMqlRate
          },
          {
            label: "MQL-to-SQL Conversion",
            val: `${mqlToSqlRate}%`,
            desc: `${qualifiedSqlsCount} of ${qualifiedMqlsCount} MQLs converted to SQL`,
            icon: CheckCircle2,
            color: "text-emerald-500",
            barColor: "bg-emerald-500",
            rate: mqlToSqlRate
          },
          {
            label: "SQL-to-Opportunity Conversion",
            val: `${sqlToOppRate}%`,
            desc: `${qualifiedOppsCount} of ${qualifiedSqlsCount} SQLs converted to Opp`,
            icon: Zap,
            color: "text-accent",
            barColor: "bg-accent",
            rate: sqlToOppRate
          },
          {
            label: "Lead-to-Opportunity Conversion",
            val: `${leadToOppRate}%`,
            desc: `${qualifiedOppsCount} of ${totalLeads} leads converted to Opp`,
            icon: Target,
            color: "text-purple-500",
            barColor: "bg-purple-500",
            rate: leadToOppRate
          }
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-110`} />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-1">{stat.val}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-mono leading-normal text-text-secondary font-medium">
                {stat.desc}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stat.barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(0, stat.rate))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Qualification Funnel Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Qualification Funnel Visualization (Positioned far-left, 25% wider [col-span-9], 35% taller) */}
        <div className="px-5 py-1.5 rounded-2xl border border-border bg-bg-surface shadow-sm col-span-12 lg:col-span-9 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border/80 pb-1.5 mb-1">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Qualification Funnel
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">End-to-end conversion progression across qualification stages</p>
          </div>

          {/* Funnel SVG Visualization matching reference layout and color palette */}
          {(() => {
            // Normalized height scale calculations based on actual lead counts
            // Funnel height bounds in SVG coordinate space (viewBox 0 0 1100 403)
            const maxH = 376; // full height for 100% Leads
            const hLead = maxH;

            // Safe proportional curved scaling so low counts (e.g. 1, 2) remain visually distinct without clamping to the exact same flat height
            const getCurvedHeight = (count: number, maxCount: number, parentHeight: number, minFloor: number) => {
              if (count <= 0) return minFloor;
              if (maxCount <= 0) return minFloor;
              if (count >= maxCount) return parentHeight;
              const ratio = count / maxCount;
              // Power curve keeps single-digit stages distinct, readable, and well-proportioned
              const curvedRatio = Math.pow(ratio, 0.62);
              return Math.max(minFloor, Math.round(curvedRatio * parentHeight));
            };

            const hMql = totalLeads > 0 
              ? getCurvedHeight(qualifiedMqlsCount, totalLeads, hLead, 48)
              : 48;

            const hSql = qualifiedMqlsCount > 0
              ? getCurvedHeight(qualifiedSqlsCount, qualifiedMqlsCount, hMql, 36)
              : (totalLeads > 0 ? getCurvedHeight(qualifiedSqlsCount, totalLeads, hLead, 36) : 36);

            // Opportunity right side height:
            // When qualifiedSqlsCount > 0, the right side height strictly reflects qualifiedOppsCount relative to qualifiedSqlsCount.
            // For example, if SQL is 2 and Opportunity is 1, the right side is directly half (or proportional to) the left side height!
            let hOpp: number;
            if (qualifiedOppsCount <= 0) {
              hOpp = 16;
            } else if (qualifiedSqlsCount > 0) {
              if (qualifiedOppsCount >= qualifiedSqlsCount) {
                hOpp = hSql;
              } else {
                // Strictly proportional to qualifiedOppsCount / qualifiedSqlsCount
                const oppToSqlRatio = qualifiedOppsCount / qualifiedSqlsCount;
                hOpp = Math.max(16, Math.min(hSql - 14, Math.round(hSql * oppToSqlRatio)));
              }
            } else {
              hOpp = totalLeads > 0 ? getCurvedHeight(qualifiedOppsCount, totalLeads, hLead, 18) : 18;
            }

            // Centering along Y in the coordinate space
            const cy = 203;
            const yLeadTop = cy - hLead / 2;
            const yLeadBot = cy + hLead / 2;

            const yMqlTop = cy - hMql / 2;
            const yMqlBot = cy + hMql / 2;

            const ySqlTop = cy - hSql / 2;
            const ySqlBot = cy + hSql / 2;

            const yOppTop = cy - hOpp / 2;
            const yOppBot = cy + hOpp / 2;

            // X-coordinates across 5 segments - circle diameter equals right side height of Opportunity
            const circleRadius = Math.max(12, Math.round(hOpp / 2));
            const rightEdge = 1086;
            const cxCircle = rightEdge - circleRadius;
            const connectorGap = 24;
            const x4 = cxCircle - circleRadius - connectorGap;
            const x0 = 12;   // Left edge of Lead
            const stageWidth = (x4 - x0) / 4;
            const x1 = Math.round(x0 + stageWidth);      // Lead right / MQL left
            const x2 = Math.round(x0 + stageWidth * 2);  // MQL right / SQL left
            const x3 = Math.round(x0 + stageWidth * 3);  // SQL right / Opportunity left

            return (
              <div className="w-full flex-1 flex flex-col justify-between min-h-[390px]">
                <div className="w-full flex-1 flex items-center overflow-x-auto custom-scrollbar-horizontal py-0.5">
                  <svg 
                    viewBox="0 0 1100 403" 
                    className="w-full min-w-[680px] h-[256px] select-none"
                  >
                    <defs>
                      {/* Subtle shadows and gradients */}
                      <filter id="funnelShadow" x="-5%" y="-5%" width="110%" height="115%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
                      </filter>
                      <filter id="circleGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#22c55e" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Stage 1: Lead (Straight rectangle / left-most pillar) */}
                    <path
                      d={`M ${x0} ${yLeadTop} L ${x1} ${yLeadTop} L ${x1} ${yLeadBot} L ${x0} ${yLeadBot} Z`}
                      fill="#104861"
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />

                    {/* Stage 2: MQL (Trapezoid from Lead right side to MQL right side) */}
                    <path
                      d={`M ${x1} ${yLeadTop} L ${x2} ${yMqlTop} L ${x2} ${yMqlBot} L ${x1} ${yLeadBot} Z`}
                      fill="#44B3E1"
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />

                    {/* Stage 3: SQL (Trapezoid from MQL right side to SQL right side) */}
                    <path
                      d={`M ${x2} ${yMqlTop} L ${x3} ${ySqlTop} L ${x3} ${ySqlBot} L ${x2} ${yMqlBot} Z`}
                      fill="#83CCEB"
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />

                    {/* Stage 4: Opportunity (Trapezoid from SQL right side to Opportunity right side) */}
                    <path
                      d={`M ${x3} ${ySqlTop} L ${x4} ${yOppTop} L ${x4} ${yOppBot} L ${x3} ${ySqlBot} Z`}
                      fill="#DAE9F8"
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />

                    {/* Stage 5: Circle Area (Diameter exactly equal to height of right side of Opportunity area) */}
                    <circle
                      cx={cxCircle}
                      cy={cy}
                      r={circleRadius}
                      fill="#DAE9F8"
                      filter="url(#circleGlow)"
                      className="transition-all duration-500 hover:scale-105"
                    />

                    {/* Stage 5: Circle Stroke (Diameter exactly equal to height of right side of Opportunity area) */}
                    <circle
                      cx={cxCircle}
                      cy={cy}
                      r={circleRadius}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth={6}//{circleRadius * 2 * 0.08}
                      filter="url(#circleGlow)"
                      className="transition-all duration-500 hover:scale-105"
                    />

                    {/* Stage 6: top-stroke */}
                    <path
                      d={`M ${x0} ${yLeadTop} L ${x1} ${yLeadTop} L ${x2} ${yMqlTop} L ${x3} ${ySqlTop} L ${x4} ${yOppTop} `}
                      fill="none"
                      stroke="var(--text-primary)"
                      strokeWidth={5}
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />

                    {/* Stage 7: bot-stroke */}
                    <path
                      d={`M ${x0} ${yLeadBot} L ${x1} ${yLeadBot} L ${x2} ${yMqlBot} L ${x3} ${ySqlBot} L ${x4} ${yOppBot}`}
                      fill="none"
                      stroke="var(--text-primary)"
                      strokeWidth={5}
                      filter="url(#funnelShadow)"
                      className="transition-all duration-500 hover:opacity-95"
                    />
                    
                    {/* Dashed connecting bridge from Opportunity right side to circle */}
                    <line
                      x1={x4}
                      y1={cy}
                      x2={cxCircle - circleRadius}
                      y2={cy}
                      stroke="#22C55E"
                      strokeWidth="3"
                      strokeDasharray="3 3"
                      opacity="0.6"
                    />

                    {/* Content Overlays for Area 1: Lead */}
                    <g transform={`translate(${(x0 + x1) / 2}, ${cy})`} textAnchor="middle">
                      <text y="-190" style={{ fill: 'var(--text-primary)' }} fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.05em">
                        LEAD
                      </text>
                      <text y="-12" fill="#DBEAFE" fontSize="13" fontWeight="500" fontFamily="monospace">
                        100%
                      </text>
                      <text y="10" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="monospace">
                        {totalLeads}
                      </text>
                      <text y="24" fill="#EFF6FF" fontSize="16" fontWeight="500" fontFamily="monospace" opacity="0.9">
                        Total Leads
                      </text>
                    </g>

                    {/* Content Overlays for Area 2: MQL */}
                    <g transform={`translate(${(x1 + x2) / 2}, ${cy})`} textAnchor="middle">
                      <text y="-190" style={{ fill: 'var(--text-primary)' }} fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.05em">
                        MQL
                      </text>
                      <text y="-12" fill="#D1FAE5" fontSize="13" fontWeight="500" fontFamily="monospace">
                        Lead→MQL {leadToMqlRate}%
                      </text>
                      <text y="10" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="monospace">
                        {qualifiedMqlsCount}
                      </text>
                      <text y="24" fill="#ECFDF5" fontSize="16" fontWeight="500" fontFamily="monospace" opacity="0.9">
                        Qualified MQLs
                      </text>
                    </g>

                    {/* Content Overlays for Area 3: SQL */}
                    <g transform={`translate(${(x2 + x3) / 2}, ${cy})`} textAnchor="middle">
                      <text y="-190" style={{ fill: 'var(--text-primary)' }} fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.05em">
                        SQL
                      </text>
                      <text y="-12" fill="#1E2124" fontSize="13" fontWeight="500" fontFamily="monospace">
                        MQL→SQL {mqlToSqlRate}%
                      </text>
                      <text y="10" fill="#1E2124" fontSize="22" fontWeight="900" fontFamily="monospace">
                        {qualifiedSqlsCount}
                      </text>
                      <text y="24" fill="#1E2124" fontSize="16" fontWeight="500" fontFamily="monospace">
                        {formattedSqlRevenue}
                      </text>
                      {/*<text y="60" fill="#FEF3C7" fontSize="10" fontWeight="700" fontFamily="monospace" opacity="0.9">
                        Est. Revenue
                      </text>*/}
                    </g>

                    {/* Content Overlays for Area 4: Opportunity */}
                    <g transform={`translate(${(x3 + x4) / 2}, ${cy})`} textAnchor="middle">
                      <text y="-190" style={{ fill: 'var(--text-primary)' }} fontSize="14" fontWeight="600" fontFamily="sans-serif" letterSpacing="0.05em">
                        OPPORTUNITY
                      </text>
                      <text y="-12" fill="#1E2124" fontSize="13" fontWeight="500" fontFamily="monospace">
                        SQL→Opp {sqlToOppRate}%
                      </text>
                      <text y="10" fill="#1E2124" fontSize="22" fontWeight="900" fontFamily="monospace">
                        {qualifiedOppsCount}
                      </text>
                      <text y="24" fill="#1E2124" fontSize="16" fontWeight="500" fontFamily="monospace">
                        {formattedOppRevenue}
                      </text>
                      {/*<text y="60" fill="#FCE7F3" fontSize="10" fontWeight="700" fontFamily="monospace" opacity="0.9">
                        Est. Revenue
                      </text>*/}
                    </g>

                    {/* Content Overlays for Area 5: Circle */}
                    <g transform={`translate(${cxCircle}, ${cy})`} textAnchor="middle">
                      <text 
                        y={circleRadius > 45 ? "-8" : "1"} 
                        fill="#1E2124" 
                        fontSize={Math.max(13, Math.min(28, Math.round(circleRadius * 0.75)))} 
                        fontWeight="900" 
                        fontFamily="monospace"
                        dominantBaseline="central"
                      >
                        {qualifiedOppsCount}
                      </text>
                      {circleRadius > 45 && (
                        <text 
                          y="20" 
                          fill="#DCFCE7" 
                          fontSize="10" 
                          fontWeight="800" 
                          fontFamily="sans-serif"
                          letterSpacing="0.04em"
                        >
                          QUALIFIED
                        </text>
                      )}
                    </g>
                  </svg>
                </div>

                {/* Legend footer with stage details - positioned 50% closer to bottom line */}
                <div className="mt-1 pt-1.5 mb-[23px] border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#104861]" />
                    <span className="text-text-secondary">Lead:</span>
                    <span className="font-bold text-text-primary">{totalLeads}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#44B3E1]" />
                    <span className="text-text-secondary">MQL:</span>
                    <span className="font-bold text-text-primary">{qualifiedMqlsCount} ({leadToMqlRate}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#83CCEB]" />
                    <span className="text-text-secondary">SQL:</span>
                    <span className="font-bold text-text-primary">{qualifiedSqlsCount} ({mqlToSqlRate}%) · {formattedSqlRevenue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#DAE9F8]" />
                    <span className="text-text-secondary">Opp:</span>
                    <span className="font-bold text-text-primary">{qualifiedOppsCount} ({sqlToOppRate}%) · {formattedOppRevenue}</span>
                  </div>
                  {/*<div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                    <span className="text-text-secondary">Wins/Qualified:</span>
                    <span className="font-bold text-text-primary">{qualifiedOppsCount}</span>
                  </div>*/}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Opp Value Intelligence Section (Positioned on the right side of Qualification Funnel, matching section height) */}
        <div className="col-span-12 lg:col-span-3 rounded-2xl border border-border bg-bg-surface shadow-sm p-4 flex flex-col justify-between overflow-hidden">
          <div className="border-b border-border/80 pb-2 mb-2">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Opp Value Intelligence
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Pipeline valuation & deal density analytics</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-between">
            {/* Upper Half Area: Total SQL Value */}
            <div className="flex-1 rounded-xl bg-bg-primary/50 border border-border/80 p-3.5 flex flex-col justify-between group hover:border-accent/80 transition-all shadow-inner">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
                    Total SQL Value
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#83CCEB]/20 text-[#155e75] dark:text-[#83CCEB]">
                    {qualifiedSqlsCount} SQL{qualifiedSqlsCount === 1 ? '' : 's'}
                  </span>
                </div>
                {/* Hero value */}
                <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-sans">
                  {formattedSqlRevenue}
                </div>
              </div>
              {/* Illustrative information below */}
              <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-secondary">SQL Size:</span>
                <span className="font-bold text-text-primary">{formattedAvgSqlValue}</span>
              </div>
            </div>

            {/* Down Half Area: Total Opportunity Value */}
            <div className="flex-1 rounded-xl bg-bg-primary/50 border border-border/80 p-3.5 flex flex-col justify-between group hover:border-accent/80 transition-all shadow-inner">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
                    Total Opp. Value
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#DAE9F8]/60 text-[#1e3a8a] dark:text-[#BFDBFE]">
                    {qualifiedOppsCount} Opp{qualifiedOppsCount === 1 ? '' : 's'}
                  </span>
                </div>
                {/* Hero value */}
                <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-sans">
                  {formattedOppRevenue}
                </div>
              </div>
              {/* Illustrative information below */}
              <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-secondary">Opp. Size:</span>
                <span className="font-bold text-text-primary">{formattedAvgOppValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Intelligence — Executive Insights Section (Positioned just below Qualification Funnel and Opp Value Intelligence) */}
      <QualificationIntelligenceSection
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        campaign={campaign}
        leads={leads}
        qualResults={qualResults}
        mqlPromotions={mqlPromotions}
        oppPromotions={oppPromotions}
        dashboardMetrics={{
          leadToMqlRate,
          mqlToSqlRate,
          sqlToOppRate,
          leadToOppRate,
          evaluationRate,
          totalLeads,
          qualifiedMqlsCount,
          qualifiedSqlsCount,
          qualifiedOppsCount,
          evaluatedLeadsCount: evaluatedLeads,
          sqlTotalRevenue,
          oppTotalRevenue
        }}
      />

      {/* Qualification Dimension Intelligence Section (Interactive heatmaps for MQL, SQL, and Opportunity Qualification) */}
      <QualificationDimensionIntelligence
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        campaign={campaign}
        leads={leads}
        qualResults={qualResults}
        mqlPromotions={mqlPromotions}
        oppPromotions={oppPromotions}
        opportunities={opportunities}
        sqlAssessments={sqlAssessments}
        sqlResultsMap={sqlResultsMap}
        oppFormDataMap={oppFormDataMap}
        oppSessionsMap={oppSessionsMap}
        oppResultsMap={oppResultsMap}
        promotedLeadIds={promotedLeadIds}
        sqlPromotedLeadIds={sqlPromotedLeadIds}
        onNavigateToLead={onNavigateToLead}
      />

      {/* Cognitive Intelligence Recommendation & Leaderboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: AI Cognitive Insight */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-accent/25 bg-accent/5 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-[10px] font-mono font-black text-accent uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Lightbulb className="h-4 w-4" />
              AI Commercial Intelligence Summary
            </h4>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wide border-b border-accent/15 pb-2.5 mb-3">
              {cognitiveInsight.title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              {cognitiveInsight.description}
            </p>
          </div>
          <div className="pt-5 border-t border-accent/15 mt-5">
            <div className="text-[9px] font-mono text-text-secondary uppercase">Recommended Action:</div>
            <div className="text-xs font-black text-text-primary uppercase tracking-wide mt-1 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 bg-accent rounded-full animate-ping" />
              {cognitiveInsight.action}
            </div>
          </div>
        </div>

        {/* Right Col: Top SQLs */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface flex flex-col shadow-sm">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-accent" />
              Top SQLs
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">
              {isAllCampaigns 
                ? "Top-ranked qualified opportunities across all campaigns from SQL Opportunity Qualification Roster" 
                : "Top-ranked qualified opportunities from SQL Opportunity Qualification Roster"}
            </p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar-vertical">
            {topSqls.map((item, idx) => {
              const leadCamp = isAllCampaigns && campaigns && item.backingLead 
                ? campaigns.find(c => c.id === item.backingLead?.campaign_id) 
                : null;

              return (
                <div key={item.oppId} className="p-3 rounded-xl border border-border bg-bg-primary/40 hover:bg-bg-primary/80 transition-all flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-text-primary truncate">{item.opportunityName}</div>
                      <div className="text-[10px] text-text-secondary truncate">
                        {item.companyName} • Estimated Revenue: <strong className="text-text-primary font-mono">{item.estimatedRevenue}</strong>
                        {leadCamp && (
                          <span className="ml-1.5 text-accent font-semibold font-mono text-[9px]">[{leadCamp.name}]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                      QUALIFIED
                    </span>
                    <div className="text-right font-mono">
                      <span className="text-xs font-black text-accent">{item.opportunityScore}</span>
                      <span className="text-[9px] text-text-secondary">/100</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {topSqls.length === 0 && (
              <div className="text-center py-10 text-[10px] font-mono text-text-secondary italic">
                No qualified opportunities found in the SQL Opportunity Qualification Roster.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
