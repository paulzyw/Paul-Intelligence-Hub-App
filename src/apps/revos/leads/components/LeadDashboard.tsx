import React from 'react';
import { MQLCampaign, MQLLead, MQLQualificationResult } from '../../types/mql';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Cpu, 
  Activity, 
  Zap, 
  Award, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface LeadDashboardProps {
  campaign: MQLCampaign;
  leads: MQLLead[];
  qualResults: MQLQualificationResult[];
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({ campaign, leads, qualResults }) => {
  // 1. Calculations & Metrics Aggregations
  const totalLeads = leads.length;
  const evaluatedLeads = qualResults.length;
  
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

  // 2. Data Preparation for Recharts
  // Status distribution Pie chart data
  const statusChartData = [
    { name: 'Highly Qualified', value: highlyQualifiedCount, color: '#22c55e' }, // green-500
    { name: 'Qualified', value: qualifiedCount, color: '#10b981' }, // emerald-500
    { name: 'Marketing Nurture', value: nurtureCount, color: '#FF7A00' }, // GTMOS Accent orange
    { name: 'Disqualified', value: disqualifiedCount, color: '#ef4444' }, // red-500
    { name: 'Unassigned/Assessing', value: newOrAssessingCount, color: '#94a3b8' } // slate-400
  ].filter(item => item.value > 0);

  // Dimension Comparison Bar chart data
  const dimensionChartData = [
    { name: 'Fit', Score: dimensionAverages.fit, color: '#3b82f6' },
    { name: 'Intent', Score: dimensionAverages.intent, color: '#6366f1' },
    { name: 'Engagement', Score: dimensionAverages.engagement, color: '#a855f7' },
    { name: 'Timing', Score: dimensionAverages.timing, color: '#f97316' }
  ];

  // Custom tooltips to match GTMOS look
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-surface border border-border px-3 py-2.5 rounded-xl shadow-lg font-mono text-[10px] leading-relaxed">
          <p className="font-bold text-text-primary uppercase tracking-wider">{payload[0].name}</p>
          <p className="text-accent font-black mt-0.5">SCORE: {payload[0].value}/100</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-surface border border-border px-3 py-2.5 rounded-xl shadow-lg font-mono text-[10px] leading-relaxed">
          <p className="font-bold text-text-primary uppercase tracking-wider">{payload[0].name}</p>
          <p className="text-accent font-black mt-0.5">LEADS: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // 3. Dynamic Cognitive Insights Engine (Recommendations Card)
  const getDynamicInsight = () => {
    if (evaluatedLeads === 0) {
      return {
        title: "Initiate Qualifications",
        description: "Zero leads have been analyzed in this campaign yet. Populate the Leads Register and run the AI Qualification Engine on individuals to unlock deep dimension diagnostics.",
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
      {/* Campaign Details Header block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 rounded-2xl bg-bg-surface/50 border border-border shadow-sm">
        <div>
          <span className="text-[9px] font-mono font-black text-text-secondary uppercase tracking-widest">Active Campaign Diagnostics</span>
          <h2 className="text-lg font-black text-text-primary uppercase tracking-wide mt-0.5">{campaign.name} Summary</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
            {campaign.objective || "Aggregated metrics and qualitative distribution across all active prospects under this campaign blueprint."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
            {campaign.industry}
          </span>
          <span className="px-2.5 py-1 bg-bg-primary border border-border text-text-secondary font-mono font-bold text-[9px] rounded-lg uppercase tracking-wider">
            {campaign.revenue_motion?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* KPI Stats Panel Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Lead Roster", val: totalLeads, desc: "Total profiles enrolled", icon: Users, color: "text-blue-500" },
          { label: "Qualified Prospects", val: highlyQualifiedCount + qualifiedCount, desc: `Of ${evaluatedLeads} evaluated leads`, icon: Award, color: "text-emerald-500" },
          { label: "Avg MQL Score", val: avgScore > 0 ? `${avgScore}%` : "—", desc: "Across assessed dimensions", icon: TrendingUp, color: "text-accent" },
          { label: "AI Cognitive Confidence", val: avgConfidence > 0 ? `${avgConfidence}%` : "—", desc: "Machine assurance level", icon: Cpu, color: "text-purple-500" }
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-2xl border border-border bg-bg-surface flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-110`} />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-1">{stat.val}</div>
            <span className="text-[10px] text-text-secondary mt-1.5 block leading-normal">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Recharts Grid (Pie Chart + Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-5 rounded-2xl border border-border bg-bg-surface shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div className="border-b border-border/80 pb-3 mb-4">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-accent" />
              MQL Roster Status Distribution
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Proportionate breakdown of prospective classifications</p>
          </div>

          <div className="h-[200px] sm:h-[220px] w-full relative flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-text-secondary font-mono text-[10px] italic">
                No evaluated statuses available.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
            {statusChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary truncate">{item.name}:</span>
                <span className="font-bold text-text-primary ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension Comparison Bar Chart */}
        <div className="p-5 rounded-2xl border border-border bg-bg-surface shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div className="border-b border-border/80 pb-3 mb-4">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Core Assessment Dimension Strength
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Average scores (0-100) computed from observed criteria</p>
          </div>

          <div className="h-[220px] w-full">
            {evaluatedLeads > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dimensionChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #1e293b)" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--color-text-secondary, #94a3b8)" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="var(--color-text-secondary, #94a3b8)" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,122,0,0.03)' }} />
                  <Bar dataKey="Score" radius={[8, 8, 0, 0]}>
                    {dimensionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-text-secondary font-mono text-[10px] italic">
                Awaiting assessments to draw dimension charts.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-x-6 gap-y-1.5 justify-center text-[10px] font-mono">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-1 bg-blue-500" /> Fit: {dimensionAverages.fit}</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-1 bg-indigo-500" /> Intent: {dimensionAverages.intent}</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-1 bg-purple-500" /> Engagement: {dimensionAverages.engagement}</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-1 bg-orange-500" /> Timing: {dimensionAverages.timing}</div>
          </div>
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
              Top Campaign Prospects (Leaderboard)
            </h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Top-ranked lead profiles compiled by qualification scores</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px]">
            {rankedLeads.filter(item => item.score > 0).map((item, idx) => {
              const statusColor = item.lead.status?.toLowerCase().includes('highly')
                ? 'text-green-500 bg-green-500/10'
                : 'text-emerald-500 bg-emerald-500/10';

              return (
                <div key={item.lead.id} className="p-3 rounded-xl border border-border bg-bg-primary/40 hover:bg-bg-primary/80 transition-all flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-black">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-text-primary truncate">{item.lead.first_name} {item.lead.last_name}</div>
                      <div className="text-[10px] text-text-secondary truncate">{item.lead.company_name} • {item.lead.job_title}</div>
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
