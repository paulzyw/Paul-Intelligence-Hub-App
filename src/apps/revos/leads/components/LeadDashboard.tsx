import React, { useState, useEffect } from 'react';
import { MQLCampaign, MQLLead, MQLQualificationResult } from '../../types/mql';
import { PromotionDataService } from '../services/promotionDataService';
import { OpportunityDataService } from '../services/opportunityDataService';
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
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({ 
  campaigns = [],
  selectedCampaignId = 'all',
  onCampaignChange,
  campaign, 
  leads, 
  qualResults 
}) => {
  const isAllCampaigns = !campaign || selectedCampaignId === 'all';

  const [mqlPromotions, setMqlPromotions] = useState<any[]>([]);
  const [oppPromotions, setOppPromotions] = useState<any[]>([]);
  const [oppRevenueMap, setOppRevenueMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const [mqlPromos, oppPromos, revMap] = await Promise.all([
          PromotionDataService.getMqlSqlPromotions(),
          PromotionDataService.getSqlOpportunityPromotions(),
          OpportunityDataService.getOpportunityEstimatedRevenuesMap().catch(() => ({}))
        ]);
        setMqlPromotions(mqlPromos);
        setOppPromotions(oppPromos);
        if (revMap) setOppRevenueMap(revMap);
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
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('lead_promoted_to_sql', handleUpdate);
        window.removeEventListener('sql_qualification_updated', handleUpdate);
        window.removeEventListener('opportunity_form_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

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
  const sqlLeadsList = leads.filter(l => l.status === 'SQL' || sqlPromoMap.has(l.id));
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

  // Total estimated revenue for opportunities listed in SQL column
  const sqlTotalRevenue = sqlLeadsList.reduce((acc, curr) => {
    return acc + getOpportunityEstimatedRevenue(curr);
  }, 0);
  const formattedSqlRevenue = sqlTotalRevenue > 0
    ? `$${sqlTotalRevenue.toLocaleString('en-US')}`
    : '$0';

  // Total estimated revenue for opportunities listed in Opportunity column
  const oppTotalRevenue = oppLeadsList.reduce((acc, curr) => {
    return acc + getOpportunityEstimatedRevenue(curr);
  }, 0);
  const formattedOppRevenue = oppTotalRevenue > 0
    ? `$${oppTotalRevenue.toLocaleString('en-US')}`
    : '$0';

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

  // 4. Lead Leaderboard ranking
  const rankedLeads = [...leads]
    .map(lead => {
      const result = qualResults.find(r => r.lead_id === lead.id);
      return {
        lead,
        score: result ? result.qualification_score : 0,
        result
      };
    })
    .sort((a, b) => b.score - a.score)
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
            const minH = 16; // baseline minimum to keep 0 or low count visible without distorting proportions
            const maxH = 376; // full height for 100% Leads

            const hLead = maxH;
            const hMql = totalLeads > 0 
              ? Math.max(minH, Math.min(maxH, (qualifiedMqlsCount / totalLeads) * maxH))
              : minH;
            const hSql = totalLeads > 0 
              ? Math.max(minH, Math.min(hMql, (qualifiedSqlsCount / totalLeads) * maxH))
              : minH;
            const hOpp = totalLeads > 0 
              ? Math.max(minH, Math.min(hSql, (qualifiedOppsCount / totalLeads) * maxH))
              : minH;

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
            const circleRadius = Math.max(16, Math.round(hOpp / 2));
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
      </div>

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

        {/* Right Col: Top Qualified Leads Leaderboard */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-bg-surface flex flex-col shadow-sm">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-accent" />
              {isAllCampaigns ? "Top Account Prospects (Leaderboard)" : "Top Campaign Prospects (Leaderboard)"}
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">
              {isAllCampaigns 
                ? "Top-ranked prospects across all campaigns compiled by qualification scores" 
                : "Top-ranked lead profiles compiled by qualification scores"}
            </p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px]">
            {rankedLeads.filter(item => item.score > 0).map((item, idx) => {
              const statusColor = item.lead.status?.toLowerCase().includes('highly')
                ? 'text-green-500 bg-green-500/10'
                : 'text-emerald-500 bg-emerald-500/10';

              const leadCamp = isAllCampaigns && campaigns ? campaigns.find(c => c.id === item.lead.campaign_id) : null;

              return (
                <div key={item.lead.id} className="p-3 rounded-xl border border-border bg-bg-primary/40 hover:bg-bg-primary/80 transition-all flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-text-primary truncate">{item.lead.first_name} {item.lead.last_name}</div>
                      <div className="text-[10px] text-text-secondary truncate">
                        {item.lead.company_name} • {item.lead.job_title}
                        {leadCamp && (
                          <span className="ml-1.5 text-accent font-semibold font-mono text-[9px]">[{leadCamp.name}]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider ${statusColor}`}>
                      {item.lead.status}
                    </span>
                    <div className="text-right font-mono">
                      <span className="text-xs font-black text-accent">{item.score}</span>
                      <span className="text-[9px] text-text-secondary">/100</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {rankedLeads.filter(item => item.score > 0).length === 0 && (
              <div className="text-center py-10 text-[10px] font-mono text-text-secondary italic">
                No profiles qualified yet. Trigger evaluation inside the Lead List.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
