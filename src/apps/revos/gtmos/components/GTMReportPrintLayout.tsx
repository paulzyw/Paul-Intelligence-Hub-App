import React, { useMemo } from 'react';
import { GTMOSProject, CategoryId } from '../types';
import { CATEGORY_SPECS } from '../initialState';
import { calculateExecutionMetrics, computeInitiativeStatus, getDynamicStatus } from '../executionUtils';

interface Props {
  project: GTMOSProject;
  selectedItems: Record<string, boolean>;
}

export const GTMReportPrintLayout: React.FC<Props> = ({ project, selectedItems }) => {
  const activePlan = project.archivedExecutionPlan || project.gtmExecutionPlan;
  const executionMetrics = useMemo(() => calculateExecutionMetrics(activePlan), [activePlan]);

  return (
    <div id="gtmos-printable-area" className="w-full min-h-full bg-slate-200 print:bg-white text-black font-sans py-8 print:py-0">
      <table className="w-full print:table">
        <thead className="print:table-header-group hidden">
          <tr><td><div className="h-0"></div></td></tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {/* 1. Cover Page */}
      <div className="a4-page-canvas block bg-slate-50 border-b-8 border-blue-900">
        <div className="max-w-2xl mt-32">
          <h4 className="text-blue-900 font-bold tracking-widest uppercase text-sm mb-4">RevOS GTMOS Report System</h4>
          <h1 className="text-5xl font-black text-slate-900 mb-6">{project.title || 'Untitled Project'}</h1>
          <div className="w-16 h-1 bg-blue-600 mb-8" />
          <h2 className="text-2xl text-slate-700 font-light mb-2">{project.market_segment || 'Target Market Segment'}</h2>
          <h3 className="text-xl text-slate-500 font-light mb-12">{project.strategic_objective || 'Strategic Objective'}</h3>
          
          <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">GTM Readiness Score</p>
              <p className="text-4xl font-black text-blue-600">{project.readinessScore || 0}</p>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Date Stamp</p>
              <p className="text-sm font-medium text-slate-800">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <RunningFooter pageNum={1} totalPages="?" />
      </div>

      {/* 2. Executive Briefing */}
      <div className="a4-page-canvas block">
        <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">Executive Briefing</h2>
        <div className="prose prose-sm max-w-none text-slate-800">
          <p className="text-sm leading-relaxed mb-4">
            This document outlines the strategic go-to-market mechanics, execution pipeline, and readiness assessment for <strong>{project.title}</strong>. 
            The current readiness score is <strong>{project.readinessScore} / 100</strong>, reflecting the holistic alignment of target segments, execution assets, and business objectives.
          </p>
          {project.aiReasoning && (
            <div className="p-4 bg-slate-50 border-l-4 border-blue-500 mb-6">
              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">Strategic Intelligence Briefing</h4>
              <div className="text-sm text-slate-700">
                {project.aiReasoning
                  .replace(/([.!?])\s+(\d+\.)\s/g, '$1\n\n$2 ')
                  .replace(/(:)\s+(\d+\.)\s/g, '$1\n\n$2 ')
                  .replace(/([.!?])\s+(However,)/g, '$1\n\n$2')
                  .split('\n')
                  .filter(p => p.trim() !== '')
                  .map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
        <RunningFooter />
      </div>

      {/* 3. Workspace Config (Step 1) */}
      {selectedItems['workspaceConfig'] && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">1. Workspace Config</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs uppercase font-bold text-slate-500 mb-1">Project Name</p>
              <p className="text-sm font-medium text-slate-900">{project.title}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs uppercase font-bold text-slate-500 mb-1">Market Segment</p>
              <p className="text-sm font-medium text-slate-900">{project.market_segment}</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg col-span-2">
              <p className="text-xs uppercase font-bold text-slate-500 mb-1">Strategic Objective</p>
              <p className="text-sm font-medium text-slate-900">{project.strategic_objective}</p>
            </div>
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 4. Onboarding Input Data (Step 2 to Step 9) */}
      {selectedItems['onboardingData'] && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">2. Core Business Parameters</h2>
          <div className="grid grid-cols-2 gap-4 flex-grow">
            {CATEGORY_SPECS.map(cat => (
              <div key={cat.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-1">{cat.name}</h3>
                <div className="space-y-2">
                  {cat.fields.map(field => {
                    const val = project.onboarding[field as keyof typeof project.onboarding];
                    if (!val) return null;
                    return (
                      <div key={field} className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{field.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-900">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 5. GTM Strategy (Step 11) */}
      {selectedItems['gtmStrategy'] && project.gtmStrategyDraft && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">3. GTM Strategy Lines</h2>
          <div className="flex-grow space-y-6">
            {Object.entries(project.gtmStrategyDraft)
              .sort(([a], [b]) => {
                const getPillarNum = (str: string) => {
                  const match = str.match(/pillar_(\d+)/i) || str.match(/\d+/);
                  return match ? parseInt(match[1] || match[0], 10) : 0;
                };
                return getPillarNum(a) - getPillarNum(b);
              })
              .map(([pillarId, items]) => {
              if (!items || items.length === 0) return null;
              return (
                <div key={pillarId} className="page-break-inside-avoid border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">{pillarId.replace(/_/g, ' ')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-800">{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 6. Revenue Decomposition (Step 13) */}
      {selectedItems['revenueDecomposition'] && project.revenueDecomposition?.result && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">4. Revenue Decomposition</h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Customers Required" value={project.revenueDecomposition.result.customersRequired} />
            <MetricCard label="Deals Required" value={project.revenueDecomposition.result.dealsRequired} />
            <MetricCard label="Pipeline Required" value={project.revenueDecomposition.result.pipelineRequired} />
            <MetricCard label="Opportunities Required" value={project.revenueDecomposition.result.opportunitiesRequired} />
            <MetricCard label="SQL Required" value={project.revenueDecomposition.result.sqlRequired} />
            <MetricCard label="MQL Required" value={project.revenueDecomposition.result.mqlRequired} />
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 7. Execution Actions Pipeline (Step 16) & 8. Execution Sufficiency Assessment */}
      {(selectedItems['executionPipeline'] || selectedItems['executionSufficiency']) && activePlan && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">5. Execution Pipeline & Assessment</h2>
          
          {/* Program Objective & Scorecard Card */}
          <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Program Objective</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Program Name</p>
                <p className="text-xs text-slate-900 font-bold">{activePlan.programName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Economic Sponsor</p>
                <p className="text-xs text-slate-900 font-bold">{activePlan.executiveSponsor}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Goal Outcome</p>
                <p className="text-xs text-slate-900 font-bold">{activePlan.revenueGoal} / {activePlan.businessGoal}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Description</p>
                <p className="text-xs text-slate-900">{activePlan.description}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Overall Action Progress</p>
                <p className="text-lg font-black text-blue-600">{executionMetrics.progressPct}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">KPI Achievement</p>
                <p className="text-lg font-black text-green-600">{executionMetrics.avgKpiAttainment}%</p>
              </div>
            </div>
          </div>

          {selectedItems['executionSufficiency'] && activePlan.sufficiencyAssessment && (
             <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-blue-900 uppercase">Sufficiency Assessment</h3>
                 <div className="text-2xl font-black text-blue-700">{activePlan.sufficiencyAssessment.score} / 100</div>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                 {Object.entries(activePlan.sufficiencyAssessment.coverageAnalysis).map(([k, v]) => (
                   <div key={k}>
                     <p className="text-[10px] font-bold uppercase text-blue-800/60 mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                     <p className="text-xs text-blue-900">{String(v)}</p>
                   </div>
                 ))}
               </div>
               
               {activePlan.sufficiencyAssessment.identifiedGaps && activePlan.sufficiencyAssessment.identifiedGaps.length > 0 && (
                 <div className="mb-4">
                   <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">Execution Gaps Identified</h4>
                   <ul className="list-disc pl-4 space-y-1">
                     {activePlan.sufficiencyAssessment.identifiedGaps.map((gap, i) => (
                       <li key={i} className="text-xs text-blue-800">{gap}</li>
                     ))}
                   </ul>
                 </div>
               )}

               {activePlan.sufficiencyAssessment.aiRecommendations && activePlan.sufficiencyAssessment.aiRecommendations.length > 0 && (
                 <div>
                   <h4 className="text-xs font-bold text-blue-900 uppercase mb-2">AI Gap Expansion & Recommendations</h4>
                   <ul className="list-disc pl-4 space-y-1">
                     {activePlan.sufficiencyAssessment.aiRecommendations.map((rec, i) => (
                       <li key={i} className="text-xs text-blue-800">{rec}</li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
          )}

          {selectedItems['executionPipeline'] && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Strategic Initiatives</h3>
              {activePlan.workstreams.flatMap(ws => ws.initiatives.map(init => ({ ...init, workstreamName: ws.workstreamName }))).map((init, j) => (
                <div key={j} className="p-4 border border-slate-200 rounded-lg page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{init.workstreamName}</p>
                      <h4 className="text-sm font-bold text-slate-800">{init.initiativeName}</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold uppercase">{computeInitiativeStatus(init)}</span>
                  </div>
                  
                  <div className="mb-4 text-xs text-slate-600">
                    <p className="mb-1"><span className="font-semibold text-slate-700">Description:</span> {init.description}</p>
                    <p className="mb-1"><span className="font-semibold text-slate-700">Objective:</span> {init.strategicObjective}</p>
                    {init.expectedOutcome && <p className="mb-1 text-green-700"><span className="font-semibold">Outcome:</span> {init.expectedOutcome}</p>}
                    <p><span className="font-semibold text-slate-700">Task Owner:</span> {init.owner}</p>
                  </div>

                  {init.kpis && init.kpis.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-[10px] font-bold text-slate-900 uppercase mb-2">Metrics Ledger KPIs</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {init.kpis.map((kpi, idx) => {
                          const parseVal = (val: string) => {
                            if (!val) return 0;
                            const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
                            return isNaN(parsed) ? 0 : parsed;
                          };
                          const base = parseVal(kpi.baseline);
                          const target = parseVal(kpi.target);
                          const curr = parseVal(kpi.currentValue);
                          let pct = 0;
                          if (Math.abs(target - base) !== 0) {
                            const progress = (curr - base) / (target - base);
                            pct = Math.min(Math.max(Math.round(progress * 100), 0), 100);
                          }
                          return (
                            <div key={idx} className="flex justify-between items-center text-[10px] p-2 bg-slate-50 border border-slate-100 rounded">
                              <span className="font-semibold text-slate-700 w-1/3 truncate pr-2" title={kpi.kpiName}>{kpi.kpiName}</span>
                              <span className="text-slate-500 w-1/3 text-center truncate pr-2">Target: {kpi.target}</span>
                              <span className="font-bold text-blue-600 w-1/3 text-right">{pct}% Achieved</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <RunningFooter />
        </div>
      )}

      {/* 9. Execution Status (Step 17) */}
      {selectedItems['executionStatus'] && project.tasks && project.tasks.length > 0 && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">6. Execution Status</h2>
          <div className="grid grid-cols-1 gap-3">
            {project.tasks.map(task => (
              <div key={task.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center page-break-inside-avoid">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                  <p className="text-xs text-slate-500">{task.program} • Owner: {task.owner}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-mono px-2 py-1 rounded-full uppercase font-bold ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 10. Risks & Pivotal Actions (Step 18 & Step 19) */}
      {selectedItems['risksAndActions'] && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">7. Defense Audit & Pivotal Actions</h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Identified Risks</h3>
            <div className="space-y-4">
              {project.risks && project.risks.map(risk => (
                <div key={risk.id} className="p-4 border border-red-200 bg-red-50 rounded-lg page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-red-900">{risk.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      Severity: {risk.level}
                    </span>
                  </div>
                  <p className="text-xs text-red-800 mb-2">{risk.description}</p>
                  <div className="text-xs font-medium text-red-900 bg-red-100/50 p-2 rounded">
                    <strong>Mitigation:</strong> {risk.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Pivotal Recommendations</h3>
            <div className="space-y-4">
              {project.recommendations && project.recommendations.map(rec => (
                <div key={rec.id} className="p-4 border border-amber-200 bg-amber-50 rounded-lg page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-amber-900">{rec.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Impact: {rec.impact}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80 mb-2 whitespace-pre-wrap">{rec.actionableSteps}</p>
                </div>
              ))}
            </div>
          </div>
          <RunningFooter />
        </div>
      )}

      {/* 11. Executive Insights (Step 21) */}
      {selectedItems['executiveInsights'] && project.executiveDashboardRollup && (
        <div className="a4-page-canvas block">
          <h2 className="text-2xl font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-200">8. Executive Insights</h2>
          
          <div className="p-6 bg-slate-900 text-white rounded-xl mb-6 page-break-inside-avoid">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Attainment Health</h3>
              <div className="text-3xl font-black">{executionMetrics.healthScore} / 100</div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{project.executiveDashboardRollup.section_a_attainment.narrative_brief}</p>
          </div>

          <div className="space-y-6">
            <div className="page-break-inside-avoid">
              <h3 className="text-xs uppercase font-bold text-slate-500 mb-3">Strategic Deltas</h3>
              <div className="grid grid-cols-2 gap-3">
                {project.executiveDashboardRollup.section_b_strategic_deltas.map((delta, i) => {
                  const dynamicStatus = getDynamicStatus(delta, activePlan);
                  return (
                  <div key={i} className="p-3 border border-slate-200 rounded bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-700">{delta.strategic_pillar}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        (dynamicStatus === 'On Track' || dynamicStatus === 'In Progress') ? 'bg-blue-100 text-blue-700' :
                        (dynamicStatus === 'Ahead' || dynamicStatus === 'Completed') ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>{dynamicStatus}</span>
                    </div>
                    <p className="text-xs text-slate-600">{delta.variance_explanation}</p>
                  </div>
                  );
                })}
              </div>
            </div>
            
            <div className="page-break-inside-avoid">
              <h3 className="text-xs uppercase font-bold text-slate-500 mb-3">Predictive Forecast</h3>
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-blue-900">Projected Attainment</span>
                  <span className="text-xl font-black text-blue-700">{project.executiveDashboardRollup.section_d_predictive_forecast.predicted_attainment_percentage}%</span>
                </div>
                <p className="text-xs text-blue-800 mb-3">{project.executiveDashboardRollup.section_d_predictive_forecast.trajectory_narrative}</p>
                <div className="mt-3 pt-3 border-t border-blue-200/50">
                  <h4 className="text-[10px] font-bold text-blue-800 uppercase mb-2">Scenario Levers</h4>
                  <ul className="space-y-2">
                    {project.executiveDashboardRollup.section_d_predictive_forecast.scenario_levers.map((lever, i) => (
                      <li key={i} className="text-[10px] text-blue-800"><strong className="text-blue-900">{lever.action}:</strong> {lever.projected_impact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="page-break-inside-avoid">
              <h3 className="text-xs uppercase font-bold text-slate-500 mb-3">Risk Radar & Mitigation</h3>
              <div className="grid grid-cols-2 gap-3">
                {project.executiveDashboardRollup.section_c_risk_radar.map((risk, i) => (
                  <div key={i} className={`p-3 border rounded ${risk.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold ${risk.severity === 'CRITICAL' ? 'text-red-800' : 'text-orange-800'}`}>{risk.threat_description}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${risk.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{risk.severity}</span>
                    </div>
                    <p className={`text-[10px] font-mono mb-2 ${risk.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}`}>Impact: {risk.impacted_goal}</p>
                    <div className={`mt-2 pt-2 border-t ${risk.severity === 'CRITICAL' ? 'border-red-200/50' : 'border-orange-200/50'}`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${risk.severity === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>Tactical Pivot Plan</span>
                      <p className={`text-[10px] leading-normal ${risk.severity === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>{risk.suggested_mitigation_pivot}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {project.executiveDashboardRollup.section_g_market_signals && (
              <div className="page-break-inside-avoid">
                <h3 className="text-xs uppercase font-bold text-slate-500 mb-3">External Signals (Market Dynamics)</h3>
                <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Competitor Dynamic</span>
                    <p className="text-xs text-slate-800">{project.executiveDashboardRollup.section_g_market_signals.competitor_dynamic}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Execution Pacing Gap</span>
                      <p className="text-[10px] text-slate-700">{project.executiveDashboardRollup.section_g_market_signals.execution_pacing_gap}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Strategic Pivot</span>
                      <p className="text-[10px] text-slate-700">{project.executiveDashboardRollup.section_g_market_signals.strategic_pivot_recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <RunningFooter />
        </div>
      )}

            </td>
          </tr>
        </tbody>
        <tfoot className="print:table-footer-group hidden">
          <tr>
            <td>
              <div className="pt-2 border-t border-slate-200 mt-8 flex justify-between items-center w-full">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold flex-1 text-left">RevOS GTMOS Report System</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold flex-1 text-right">Internal / Confidential</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 page-break-inside-avoid">
    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{label}</p>
    <p className="text-lg font-bold text-slate-900">{value}</p>
  </div>
);

const RunningFooter: React.FC<{ pageNum?: number, totalPages?: string }> = ({ pageNum, totalPages }) => (
  <div className="absolute bottom-[12mm] left-[15mm] right-[15mm] flex justify-between items-center pt-2 border-t border-slate-200 print:hidden">
    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">RevOS GTMOS Report System</span>
    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Internal / Confidential</span>
  </div>
);
