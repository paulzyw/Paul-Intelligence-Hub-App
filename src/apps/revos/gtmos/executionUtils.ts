import { GTMExecutionPlan, GTMRisk } from './types';

export function calculateExecutionMetrics(plan: GTMExecutionPlan | undefined | null) {
  if (!plan) {
    return {
      hasPlan: false,
      totalActions: 0,
      completedActions: 0,
      inProgressActions: 0,
      blockedActions: 0,
      todoActions: 0,
      progressPct: 0,
      avgKpiAttainment: 0,
      hasKpis: false,
      riskScore: 0,
      highRisksCount: 0,
      mediumRisksCount: 0,
      healthScore: 0,
      healthGrade: 'N/A',
      healthStatus: 'Plan Pending',
      allRisks: [] as GTMRisk[],
      workstreamStats: [] as any[],
      recommendations: [] as string[]
    };
  }

  let totalActions = 0;
  let completedActions = 0;
  let inProgressActions = 0;
  let blockedActions = 0;
  let todoActions = 0;
  
  let totalKpis = 0;
  let accumulatedKpiAttainment = 0;
  
  let totalRisks = 0;
  let totalRiskWeight = 0;
  let highRisksCount = 0;
  let mediumRisksCount = 0;
  const allRisks: GTMRisk[] = [];

  const workstreamStats: any[] = [];

  const parseValueHelper = (val: string) => {
    if (!val) return 0;
    const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  plan.workstreams?.forEach((ws) => {
    let wsTotalActs = 0;
    let wsDoneActs = 0;
    let wsRisksCount = 0;

    ws.initiatives?.forEach((init) => {
      // Actions
      init.actions?.forEach((act) => {
        totalActions++;
        wsTotalActs++;
        if (act.status === 'completed') {
          completedActions++;
          wsDoneActs++;
        }
        else if (act.status === 'in_progress') inProgressActions++;
        else if (act.status === 'blocked') blockedActions++;
        else todoActions++;
      });

      // KPIs
      init.kpis?.forEach((kpi) => {
        totalKpis++;
        const base = parseValueHelper(kpi.baseline);
        const target = parseValueHelper(kpi.target);
        const curr = parseValueHelper(kpi.currentValue);

        if (Math.abs(target - base) > 0) {
          const attainment = Math.min(Math.max((curr - base) / (target - base), 0), 1) * 100;
          accumulatedKpiAttainment += attainment;
        } else {
          accumulatedKpiAttainment += 100; // instant baseline target match
        }
      });

      // Risks
      init.risks?.forEach((risk) => {
        allRisks.push({
          ...risk,
          workstreamName: ws.workstreamName,
          initiativeName: init.initiativeName
        } as any);

        totalRisks++;
        let w = 1;
        if (risk.impact === 'high') {
          highRisksCount++;
          w += 4;
        } else if (risk.impact === 'medium') {
          mediumRisksCount++;
          w += 2;
        }
        if (risk.probability === 'high') {
          w += 4;
        } else if (risk.probability === 'medium') {
          w += 2;
        }
        totalRiskWeight += w;
        wsRisksCount++;
      });
    });

    workstreamStats.push({
      id: ws.id,
      name: ws.workstreamName,
      owner: ws.owner || 'Unassigned',
      totalActions: wsTotalActs,
      completedActions: wsDoneActs,
      progress: wsTotalActs > 0 ? Math.round((wsDoneActs / wsTotalActs) * 100) : 0,
      risksCount: wsRisksCount
    });
  });

  const progressPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const avgKpiAttainment = totalKpis > 0 ? Math.round(accumulatedKpiAttainment / totalKpis) : 0;

  // Direct Risk score weighted on scale of 100
  const maxPossibleRiskWeight = totalRisks * 9; // High + High = 9
  const riskScore = maxPossibleRiskWeight > 0 ? Math.round((totalRiskWeight / maxPossibleRiskWeight) * 100) : 0;

  // Deduct risk penalty and add milestone alignment
  // Health score components: 40% progress, 45% KPI achievement, 15% risk mitigation status
  const healthProgressContribution = progressPct * 0.40;
  const healthKpiContribution = (totalKpis > 0 ? avgKpiAttainment : progressPct) * 0.45;
  const riskPenaltyPct = Math.max(0, 15 - (riskScore * 0.15)); // smaller risk means higher mitigation multiplier
  const healthScore = Math.min(Math.max(Math.round(healthProgressContribution + healthKpiContribution + riskPenaltyPct), 0), 100);

  let healthGrade = 'A+';
  let healthStatus = 'Peak Performance';
  if (healthScore >= 90) {
    healthGrade = 'A';
    healthStatus = 'Exceptional Alignment';
  } else if (healthScore >= 80) {
    healthGrade = 'B+';
    healthStatus = 'On Track';
  } else if (healthScore >= 70) {
    healthGrade = 'B';
    healthStatus = 'Minor Alignment Gaps';
  } else if (healthScore >= 60) {
    healthGrade = 'C';
    healthStatus = 'Moderate Slippage';
  } else if (healthScore >= 45) {
    healthGrade = 'D';
    healthStatus = 'At High Risk';
  } else {
    healthGrade = 'F';
    healthStatus = 'Delayed / Intervention Required';
  }

  const recommendations: string[] = [];
  if (blockedActions > 0) {
    recommendations.push(`Urgent: Resolve ${blockedActions} blockages immediately to restore initiative momentum.`);
  }
  if (riskScore > 40) {
    recommendations.push(`High Hazard: Aggregated Risk Exposure Index is elevated (${riskScore}%). Address top mitigations below.`);
  }
  if (progressPct > 10 && avgKpiAttainment < progressPct * 0.5) {
    recommendations.push(`Strategic Drift: Tasks are being completed faster than KPIs are yielding outcome performance. Re-evaluate action efficacy.`);
  }
  if (totalActions === 0) {
    recommendations.push("Launch Readiness: Define tactical operational items inside workstreams to begin monitoring pipeline telemetry.");
  } else if (completedActions === 0) {
    recommendations.push("Initiation Sprint: Focus team alignment around initial critical milestones to break the zero-start baseline.");
  }
  if (recommendations.length < 3) {
    recommendations.push("Optimise Cadence: Leverage CRM integration triggers to automate task transition audits.");
    recommendations.push("Resource Balance: Strategic velocity is stable; proceed with current sprint structure.");
  }

  return {
    hasPlan: true,
    totalActions,
    completedActions,
    inProgressActions,
    blockedActions,
    todoActions,
    progressPct,
    avgKpiAttainment,
    hasKpis: totalKpis > 0,
    riskScore,
    highRisksCount,
    mediumRisksCount,
    healthScore,
    healthGrade,
    healthStatus,
    allRisks,
    workstreamStats,
    recommendations
  };
}
