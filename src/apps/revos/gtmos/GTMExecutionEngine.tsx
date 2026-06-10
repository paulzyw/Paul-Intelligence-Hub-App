import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Bot, Save, Archive, Plus, Trash2, Edit2, Check, CheckCircle, 
  AlertTriangle, Gauge, Users, Target, TrendingUp, Clock, ArrowRight, 
  Activity, Eye, Lock, Unlock, Zap, ChevronRight, ShieldAlert, CheckSquare, RefreshCw
} from 'lucide-react';
import { 
  GTMOSProject, GTMExecutionPlan, GTMWorkstream, GTMInitiative, 
  GTMActionItem, GTMKPI, GTMRisk, GTMDependency, GTMAIMonitoringRule 
} from './types';
import { supabase } from '../../../lib/supabase';

interface GTMExecutionEngineProps {
  project: GTMOSProject;
  onSavePlan: (plan: GTMExecutionPlan) => void;
  onArchivePlan: (plan: GTMExecutionPlan) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const GTMExecutionEngine: React.FC<GTMExecutionEngineProps> = ({
  project,
  onSavePlan,
  onArchivePlan,
  isGenerating,
  onGenerate
}) => {
  // Current active plan is cloned into local draft state
  const [draftPlan, setDraftPlan] = useState<GTMExecutionPlan | null>(null);
  
  // Track selected workstream and initiative index for details pane
  const [selectedWsIndex, setSelectedWsIndex] = useState<number>(0);
  const [selectedInitIndex, setSelectedInitIndex] = useState<number>(0);

  // Active view: 'modeling' or 'execution' (governed by archived state presence)
  const [activeStage, setActiveStage] = useState<'modeling' | 'execution'>('modeling');

  // Inline edit state for strategic program metadata
  const [isEditingProgramInfo, setIsEditingProgramInfo] = useState(false);

  // Track if we are editing an existing sub-item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Modal states for adding/editing sub-items
  const [activeModal, setActiveModal] = useState<'action' | 'kpi' | 'risk' | 'dependency' | 'aimonitoring' | null>(null);

  // Form states for adding/editing action
  const [newActionName, setNewActionName] = useState('');
  const [newActionType, setNewActionType] = useState('Asset Creation');
  const [newActionDesc, setNewActionDesc] = useState('Perform target delivery of operations assets.');
  const [newActionOwner, setNewActionOwner] = useState('Associate Core Team');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionCriteria, setNewActionCriteria] = useState('Verified output');

  // Form states for adding/editing KPI
  const [newKpiName, setNewKpiName] = useState('');
  const [newKpiCategory, setNewKpiCategory] = useState('Acquisition');
  const [newKpiBaseline, setNewKpiBaseline] = useState('0');
  const [newKpiTarget, setNewKpiTarget] = useState('100');
  const [newKpiFreq, setNewKpiFreq] = useState('Weekly');
  const [newKpiOwner, setNewKpiOwner] = useState('Analyst');

  // Form states for adding/editing Risk
  const [newRiskName, setNewRiskName] = useState('');
  const [newRiskDesc, setNewRiskDesc] = useState('Unexpected blockages in operations timeline.');
  const [newRiskProb, setNewRiskProb] = useState<'low' | 'medium' | 'high'>('medium');
  const [newRiskImpact, setNewRiskImpact] = useState<'low' | 'medium' | 'high'>('high');
  const [newRiskMitigation, setNewRiskMitigation] = useState('Pre-seed alternative pathways.');
  const [newRiskOwner, setNewRiskOwner] = useState('Project Lead');

  // Form states for adding/editing Dependency
  const [newDepType, setNewDepType] = useState('Technical Dependency');
  const [newDepBlocking, setNewDepBlocking] = useState('');
  const [newDepBlocked, setNewDepBlocked] = useState('');
  const [newDepImpact, setNewDepImpact] = useState('');

  // Form states for adding/editing AI Rule
  const [newRuleMetric, setNewRuleMetric] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const [newRuleAlert, setNewRuleAlert] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleAction, setNewRuleAction] = useState('');

  const handleCreateActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !draftPlan || !currentInitiative || !newActionName.trim()) return;

    const updatedWorkstreams = [...draftPlan.workstreams];
    const currentActions = currentInitiative.actions || [];

    let finalActions;
    if (editingItemId) {
      finalActions = currentActions.map(act => act.id === editingItemId ? {
        ...act,
        actionName: newActionName.trim(),
        description: newActionDesc,
        taskType: newActionType,
        owner: newActionOwner,
        dueDate: newActionDueDate || act.dueDate,
        completionCriteria: newActionCriteria
      } : act);
    } else {
      const newAct: GTMActionItem = {
        id: `act-${Date.now()}`,
        actionName: newActionName.trim(),
        description: newActionDesc,
        taskType: newActionType,
        owner: newActionOwner,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: newActionDueDate || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
        dependencies: "None",
        completionCriteria: newActionCriteria,
        status: "todo"
      };
      finalActions = [...currentActions, newAct];
    }

    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      actions: finalActions
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setActiveModal(null);
    setEditingItemId(null);
  };

  const handleCreateKPISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !draftPlan || !currentInitiative || !newKpiName.trim()) return;

    const updatedWorkstreams = [...draftPlan.workstreams];
    const currentKPIs = currentInitiative.kpis || [];

    let finalKPIs;
    if (editingItemId) {
      finalKPIs = currentKPIs.map(kpi => kpi.id === editingItemId ? {
        ...kpi,
        kpiName: newKpiName.trim(),
        kpiCategory: newKpiCategory,
        baseline: newKpiBaseline,
        target: newKpiTarget,
        measurementFrequency: newKpiFreq,
        owner: newKpiOwner
      } : kpi);
    } else {
      const newKpi: GTMKPI = {
        id: `kpi-${Date.now()}`,
        kpiName: newKpiName.trim(),
        kpiCategory: newKpiCategory,
        baseline: newKpiBaseline,
        target: newKpiTarget,
        currentValue: newKpiBaseline,
        measurementFrequency: newKpiFreq,
        owner: newKpiOwner
      };
      finalKPIs = [...currentKPIs, newKpi];
    }

    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      kpis: finalKPIs
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setActiveModal(null);
    setEditingItemId(null);
  };

  const handleCreateRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !draftPlan || !currentInitiative || !newRiskName.trim()) return;

    const pVal = newRiskProb === 'low' ? 1 : newRiskProb === 'medium' ? 2 : 3;
    const iVal = newRiskImpact === 'low' ? 1 : newRiskImpact === 'medium' ? 2 : 3;

    const updatedWorkstreams = [...draftPlan.workstreams];
    const currentRisks = currentInitiative.risks || [];

    let finalRisks;
    if (editingItemId) {
      finalRisks = currentRisks.map(r => r.id === editingItemId ? {
        ...r,
        riskName: newRiskName.trim(),
        description: newRiskDesc,
        probability: newRiskProb,
        impact: newRiskImpact,
        riskScore: pVal * iVal,
        mitigationPlan: newRiskMitigation,
        owner: newRiskOwner
      } : r);
    } else {
      const newRisk: GTMRisk = {
        id: `risk-${Date.now()}`,
        riskName: newRiskName.trim(),
        description: newRiskDesc,
        probability: newRiskProb,
        impact: newRiskImpact,
        riskScore: pVal * iVal,
        mitigationPlan: newRiskMitigation,
        owner: newRiskOwner
      };
      finalRisks = [...currentRisks, newRisk];
    }

    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      risks: finalRisks
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setActiveModal(null);
    setEditingItemId(null);
  };

  const handleCreateDependencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !draftPlan || !currentInitiative || !newDepBlocking.trim()) return;

    const updatedWorkstreams = [...draftPlan.workstreams];
    const currentDeps = currentInitiative.dependencies || [];

    let finalDeps;
    if (editingItemId) {
      finalDeps = currentDeps.map(dep => dep.id === editingItemId ? {
        ...dep,
        dependencyType: newDepType,
        blockingInitiative: newDepBlocking.trim(),
        blockedInitiative: newDepBlocked.trim() || currentInitiative.initiativeName,
        impactDescription: newDepImpact.trim() || "Critical path block"
      } : dep);
    } else {
      const newDep = {
        id: `dep-${Date.now()}`,
        dependencyType: newDepType,
        blockingInitiative: newDepBlocking.trim(),
        blockedInitiative: newDepBlocked.trim() || currentInitiative.initiativeName,
        impactDescription: newDepImpact.trim() || "Critical path block"
      };
      finalDeps = [...currentDeps, newDep];
    }

    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      dependencies: finalDeps
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setActiveModal(null);
    setEditingItemId(null);
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !draftPlan || !currentInitiative || !newRuleMetric.trim()) return;

    const updatedWorkstreams = [...draftPlan.workstreams];
    const currentRules = currentInitiative.aiMonitoringRules || [];

    let finalRules;
    if (editingItemId) {
      finalRules = currentRules.map(rule => rule.id === editingItemId ? {
        ...rule,
        metric: newRuleMetric.trim(),
        targetThreshold: newRuleTarget.trim(),
        alertThreshold: newRuleAlert.trim(),
        triggerCondition: newRuleCondition.trim(),
        recommendedAction: newRuleAction.trim()
      } : rule);
    } else {
      const newRule = {
        id: `rule-${Date.now()}`,
        metric: newRuleMetric.trim(),
        targetThreshold: newRuleTarget.trim(),
        alertThreshold: newRuleAlert.trim(),
        triggerCondition: newRuleCondition.trim(),
        recommendedAction: newRuleAction.trim()
      };
      finalRules = [...currentRules, newRule];
    }

    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      aiMonitoringRules: finalRules
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setActiveModal(null);
    setEditingItemId(null);
  };

  // Initialize draft when project fields update, without clobbering local changes
  useEffect(() => {
    if (project.gtmExecutionPlan) {
      const parentStr = JSON.stringify(project.gtmExecutionPlan);
      setDraftPlan(prev => {
        if (!prev || JSON.stringify(prev) !== parentStr) {
          return JSON.parse(parentStr);
        }
        return prev;
      });
    } else {
      setDraftPlan(null);
    }
  }, [project.gtmExecutionPlan]);

  // Set initial stage preference
  useEffect(() => {
    if (project.archivedExecutionPlan) {
      setActiveStage('execution');
    } else {
      setActiveStage('modeling');
    }
  }, [project.archivedExecutionPlan]);

  const activePlan = activeStage === 'execution' && project.archivedExecutionPlan 
    ? project.archivedExecutionPlan 
    : draftPlan;

  const isLocked = activeStage === 'execution';

  // State update helpers for draft plan
  const updateDraft = (updated: GTMExecutionPlan) => {
    setDraftPlan(updated);
  };

  // Helper to persist current draft to the core module state
  const handleLocalSave = () => {
    if (draftPlan) {
      onSavePlan(draftPlan);
    }
  };

  // Helper to copy current draft/active plan into the archived slot
  const handleArchive = () => {
    if (draftPlan) {
      let archivedCopy = JSON.parse(JSON.stringify(draftPlan));
      const existingArchive = project.archivedExecutionPlan;

      if (existingArchive && existingArchive.workstreams) {
        // Find the selected workstream from the draft
        const selectedDraftWs = draftPlan.workstreams[selectedWsIndex];
        
        if (selectedDraftWs) {
          const mergedWorkstreams = draftPlan.workstreams.map((draftWs, wsIdx) => {
            // If this is NOT the selected workstream, preserve the entire archived workstream as-is (including statuses, actions, KPIs, and risks)
            if (draftWs.id !== selectedDraftWs.id && wsIdx !== selectedWsIndex) {
              const existingWs = existingArchive.workstreams.find(w => w.id === draftWs.id) 
                || existingArchive.workstreams[wsIdx];
              if (existingWs) {
                return JSON.parse(JSON.stringify(existingWs));
              }
            }

            // If this is the selected workstream, we merge draft changes with existing archive's progress
            const existingWs = existingArchive.workstreams.find(w => w.id === draftWs.id)
              || existingArchive.workstreams[wsIdx];
            
            if (!existingWs) {
              // No existing archived workstream found, keep draft structure
              return JSON.parse(JSON.stringify(draftWs));
            }

            // Clone draft workstream
            const mergedWs = JSON.parse(JSON.stringify(draftWs));

            // Merge initiatives under this workstream
            mergedWs.initiatives = draftWs.initiatives.map(draftInit => {
              const existingInit = existingWs.initiatives.find(i => i.id === draftInit.id)
                || existingWs.initiatives.find(i => i.initiativeName === draftInit.initiativeName);
              
              if (!existingInit) {
                // Brand new initiative under the selected workstream, use draft
                return draftInit;
              }

              // Found matching initiative: preserve status
              const mergedInit = {
                ...draftInit,
                status: existingInit.status || draftInit.status || "Not Started",
              };

              // Merge actions: keep status for existing ones
              mergedInit.actions = draftInit.actions.map(draftAct => {
                const existingAct = existingInit.actions.find(a => a.id === draftAct.id)
                  || existingInit.actions.find(a => a.actionName === draftAct.actionName);
                if (!existingAct) {
                  return draftAct;
                }
                return {
                  ...draftAct,
                  status: existingAct.status || draftAct.status || "todo"
                };
              });

              // Merge KPIs: keep currentValue for existing ones
              mergedInit.kpis = draftInit.kpis.map(draftKpi => {
                const existingKpi = existingInit.kpis.find(k => k.id === draftKpi.id)
                  || existingInit.kpis.find(k => k.kpiName === draftKpi.kpiName);
                if (!existingKpi) {
                  return draftKpi;
                }
                return {
                  ...draftKpi,
                  currentValue: existingKpi.currentValue !== undefined ? existingKpi.currentValue : draftKpi.currentValue
                };
              });

              // Merge Risks: keep probability, impact, riskScore, etc.
              mergedInit.risks = draftInit.risks.map(draftRisk => {
                const existingRisk = existingInit.risks.find(r => r.id === draftRisk.id)
                  || existingInit.risks.find(r => r.riskName === draftRisk.riskName);
                if (!existingRisk) {
                  return draftRisk;
                }
                return {
                  ...draftRisk,
                  probability: existingRisk.probability || draftRisk.probability,
                  impact: existingRisk.impact || draftRisk.impact,
                  riskScore: existingRisk.riskScore !== undefined ? existingRisk.riskScore : draftRisk.riskScore,
                  mitigationPlan: existingRisk.mitigationPlan || draftRisk.mitigationPlan,
                  owner: existingRisk.owner || draftRisk.owner
                };
              });

              return mergedInit;
            });

            return mergedWs;
          });

          archivedCopy.workstreams = mergedWorkstreams;
        }
      }

      archivedCopy.status = 'Archived for Execution';
      onArchivePlan(archivedCopy);
      setActiveStage('execution');
    }
  };

  // Helper to release the active execution slot and return to strategy molding
  const handleReleaseArchive = () => {
    if (confirm("Are you sure you want to release the archived execution lock? This will permit structural editing but may reset custom execution progressions if you regenerate.")) {
      setActiveStage('modeling');
    }
  };

  // Safe getter for active item lists
  const currentWorkstream: GTMWorkstream | undefined = activePlan?.workstreams?.[selectedWsIndex];
  const currentInitiative: GTMInitiative | undefined = currentWorkstream?.initiatives?.[selectedInitIndex];

  // Calculations for execution compliance scores
  const getProgressStats = (plan: GTMExecutionPlan | null) => {
    if (!plan || !plan.workstreams) return { total: 0, completed: 0, percent: 0 };
    let totalActions = 0;
    let completedActions = 0;

    plan.workstreams.forEach(ws => {
      ws.initiatives.forEach(init => {
        init.actions.forEach(act => {
          totalActions++;
          if (act.status === 'completed') {
            completedActions++;
          }
        });
      });
    });

    return {
      total: totalActions,
      completed: completedActions,
      percent: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
    };
  };

  const getKPIAchievements = (plan: GTMExecutionPlan | null) => {
    if (!plan || !plan.workstreams) return { total: 0, achieved: 0, percent: 0 };
    let totalKpis = 0;
    let achievedKpis = 0;

    plan.workstreams.forEach(ws => {
      ws.initiatives.forEach(init => {
        init.kpis.forEach(k => {
          totalKpis++;
          const targetNum = parseFloat(k.target.replace(/[^0-9.]/g, '')) || 0;
          const currentNum = parseFloat(k.currentValue.replace(/[^0-9.]/g, '')) || 0;
          if (targetNum > 0 && currentNum >= targetNum) {
            achievedKpis++;
          } else if (targetNum === 0 && k.currentValue === k.target) {
            achievedKpis++;
          }
        });
      });
    });

    return {
      total: totalKpis,
      achieved: achievedKpis,
      percent: totalKpis > 0 ? Math.round((achievedKpis / totalKpis) * 100) : 0
    };
  };

  const activeStats = getProgressStats(activePlan);
  const kpiStats = getKPIAchievements(activePlan);

  // Structural mutant actions (Modeling stage ONLY)
  const addWorkstream = () => {
    if (isLocked || !draftPlan) return;
    const newWs: GTMWorkstream = {
      id: `ws-${Date.now()}`,
      workstreamName: "New Operational Workstream",
      purpose: "Define critical outcome-based focus area for GTM team.",
      relatedGtmPillar: "Pillar 1: ICP & Segments",
      priority: "medium",
      timeline: "Q3 2026",
      owner: "Workstream Lead",
      initiatives: []
    };
    const updated = { ...draftPlan, workstreams: [...draftPlan.workstreams, newWs] };
    updateDraft(updated);
    onSavePlan(updated);
    setSelectedWsIndex(updated.workstreams.length - 1);
    setSelectedInitIndex(0);
  };

  const deleteWorkstream = (wsIdx: number) => {
    if (isLocked || !draftPlan) return;
    if (draftPlan.workstreams.length <= 1) {
      alert("At least one Workstream must exist in the execution plan.");
      return;
    }
    const nextWs = draftPlan.workstreams.filter((_, idx) => idx !== wsIdx);
    const updated = { ...draftPlan, workstreams: nextWs };
    updateDraft(updated);
    onSavePlan(updated);
    setSelectedWsIndex(0);
    setSelectedInitIndex(0);
  };

  const addInitiative = () => {
    if (isLocked || !draftPlan || !currentWorkstream) return;
    const newInit: GTMInitiative = {
      id: `init-${Date.now()}`,
      initiativeName: "New Commercial Initiative",
      description: "Define tactical steps focusing on expanding business metrics.",
      strategicObjective: "Boost performance parameters",
      expectedOutcome: "Measurable revenue efficiency",
      priority: "medium",
      timeline: "Months 1-3",
      owner: "Tactical Owner",
      budget: "$10,000",
      status: "Not Started",
      actions: [],
      kpis: [],
      risks: [],
      dependencies: [],
      aiMonitoringRules: []
    };

    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex] = {
      ...currentWorkstream,
      initiatives: [...currentWorkstream.initiatives, newInit]
    };
    
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setSelectedInitIndex(currentWorkstream.initiatives.length);
  };

  const deleteInitiative = (initIdx: number) => {
    if (isLocked || !draftPlan || !currentWorkstream) return;
    if (currentWorkstream.initiatives.length <= 1) {
      alert("At least one Initiative must remain in each workstream.");
      return;
    }
    const nextInits = currentWorkstream.initiatives.filter((_, idx) => idx !== initIdx);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex] = {
      ...currentWorkstream,
      initiatives: nextInits
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
    setSelectedInitIndex(0);
  };

  // Sub-items mutations (Actions, KPIs, Risks) - allowed in BOTH stages, but structure only editable in draft model.
  // In locked execution stage, the user can change progress metrics (Action Status, KPI currentValue, Risk mitigations)
  const updateActionStatus = (actionId: string, nextStatus: 'todo' | 'in_progress' | 'completed' | 'blocked') => {
    if (!activePlan) return;
    const targetPlan = isLocked ? project.archivedExecutionPlan! : draftPlan!;
    
    // Safely parse numbers and detect formats
    const parseValueHelper = (val: string) => {
      if (!val) return { num: 0, hasPercent: false, hasDollar: false };
      const cleaned = val.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned) || 0;
      return {
        num,
        hasPercent: val.includes('%'),
        hasDollar: val.includes('$')
      };
    };

    const formatValueHelper = (num: number, hasPercent: boolean, hasDollar: boolean) => {
      let formatted = num.toFixed(0);
      if (hasDollar) {
        if (num >= 1000) {
          formatted = Math.round(num).toLocaleString('en-US');
        }
        return `$${formatted}`;
      }
      if (hasPercent) {
        return `${formatted}%`;
      }
      return formatted;
    };

    const updatedWs = targetPlan.workstreams.map((ws, wsIdx) => {
      if (wsIdx !== selectedWsIndex) return ws;
      return {
        ...ws,
        initiatives: ws.initiatives.map((init, initIdx) => {
          if (initIdx !== selectedInitIndex) return init;
          
          // Apply state change to targeted action
          const nextActions = init.actions.map(act => {
            if (act.id !== actionId) return act;
            return { ...act, status: nextStatus };
          });

          // Calculate completed actions percentage
          const totalActions = nextActions.length;
          const completedActions = nextActions.filter(a => a.status === 'completed').length;
          const progressMultiplier = totalActions > 0 ? (completedActions / totalActions) : 0;

          // Align KPI currentValue to progress
          const updatedKPIs = init.kpis.map(kpi => {
            const baseInfo = parseValueHelper(kpi.baseline);
            const targetInfo = parseValueHelper(kpi.target);
            const nextValNum = baseInfo.num + (targetInfo.num - baseInfo.num) * progressMultiplier;
            const updatedVal = formatValueHelper(nextValNum, targetInfo.hasPercent, targetInfo.hasDollar);
            return { ...kpi, currentValue: updatedVal };
          });

          return {
            ...init,
            actions: nextActions,
            kpis: updatedKPIs
          };
        })
      };
    });

    const finalPlan = { ...targetPlan, workstreams: updatedWs };
    if (isLocked) {
      onArchivePlan(finalPlan);
    } else {
      updateDraft(finalPlan);
      onSavePlan(finalPlan);
    }
  };

  const updateKPICurrentValue = (kpiId: string, nextVal: string) => {
    if (!activePlan) return;
    const targetPlan = isLocked ? project.archivedExecutionPlan! : draftPlan!;

    const updatedWs = targetPlan.workstreams.map((ws, wsIdx) => {
      if (wsIdx !== selectedWsIndex) return ws;
      return {
        ...ws,
        initiatives: ws.initiatives.map((init, initIdx) => {
          if (initIdx !== selectedInitIndex) return init;
          return {
            ...init,
            kpis: init.kpis.map(k => {
              if (k.id !== kpiId) return k;
              return { ...k, currentValue: nextVal };
            })
          };
        })
      };
    });

    const finalPlan = { ...targetPlan, workstreams: updatedWs };
    if (isLocked) {
      onArchivePlan(finalPlan);
    } else {
      updateDraft(finalPlan);
      onSavePlan(finalPlan);
    }
  };

  // Structural mutations on sub-items (Actions, KPIs, Risks, Dependencies, Rules) - ONLY modeling stage
  const addSubItemAction = () => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const promptName = prompt("Enter new action name:");
    if (!promptName) return;

    const newAct: GTMActionItem = {
      id: `act-${Date.now()}`,
      actionName: promptName,
      description: "Perform target delivery of operations assets.",
      taskType: "Asset Creation",
      owner: "Associate Core Team",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      dependencies: "None",
      completionCriteria: "Verified output",
      status: "todo"
    };

    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      actions: [...currentInitiative.actions, newAct]
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const deleteSubItemAction = (actId: string) => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const filtered = currentInitiative.actions.filter(a => a.id !== actId);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      actions: filtered
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const addSubItemKPI = () => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const name = prompt("Enter KPI name:");
    if (!name) return;

    const newKpi: GTMKPI = {
      id: `kpi-${Date.now()}`,
      kpiName: name,
      kpiCategory: "Acquisition",
      baseline: "0",
      target: "100",
      currentValue: "0",
      measurementFrequency: "Weekly",
      owner: "Analyst"
    };

    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      kpis: [...currentInitiative.kpis, newKpi]
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const deleteSubItemKPI = (kId: string) => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const filtered = currentInitiative.kpis.filter(k => k.id !== kId);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      kpis: filtered
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const addSubItemRisk = () => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const name = prompt("Enter Risk Name:");
    if (!name) return;

    const newRisk: GTMRisk = {
      id: `risk-${Date.now()}`,
      riskName: name,
      description: "Unexpected blockages in operations timeline.",
      probability: "medium",
      impact: "high",
      riskScore: 6,
      mitigationPlan: "Pre-seed alternative pathways.",
      owner: "Project Lead"
    };

    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      risks: [...currentInitiative.risks, newRisk]
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const deleteSubItemRisk = (rId: string) => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const filtered = currentInitiative.risks.filter(r => r.id !== rId);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      risks: filtered
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const changeRiskScore = (rId: string, prob: 'low' | 'medium' | 'high', imp: 'low' | 'medium' | 'high') => {
    if (!activePlan) return;
    const targetPlan = isLocked ? project.archivedExecutionPlan! : draftPlan!;

    const pVal = prob === 'low' ? 1 : prob === 'medium' ? 2 : 3;
    const iVal = imp === 'low' ? 1 : imp === 'medium' ? 2 : 3;
    const calculated = pVal * iVal;

    const updatedWs = targetPlan.workstreams.map((ws, wsIdx) => {
      if (wsIdx !== selectedWsIndex) return ws;
      return {
        ...ws,
        initiatives: ws.initiatives.map((init, initIdx) => {
          if (initIdx !== selectedInitIndex) return init;
          return {
            ...init,
            risks: init.risks.map(r => {
              if (r.id !== rId) return r;
              return { ...r, probability: prob, impact: imp, riskScore: calculated };
            })
          };
        })
      };
    });

    const finalPlan = { ...targetPlan, workstreams: updatedWs };
    if (isLocked) {
      onArchivePlan(finalPlan);
    } else {
      updateDraft(finalPlan);
      onSavePlan(finalPlan);
    }
  };

  const [isGeneratingIntelligence, setIsGeneratingIntelligence] = useState(false);

  const deleteSubItemDependency = (depId: string) => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const filtered = (currentInitiative.dependencies || []).filter(dep => dep.id !== depId);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      dependencies: filtered
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const deleteSubItemRule = (ruleId: string) => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    const filtered = (currentInitiative.aiMonitoringRules || []).filter(rule => rule.id !== ruleId);
    const updatedWorkstreams = [...draftPlan.workstreams];
    updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
      ...currentInitiative,
      aiMonitoringRules: filtered
    };
    const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
    updateDraft(finalPlan);
    onSavePlan(finalPlan);
  };

  const generateInitiativeIntelligence = async () => {
    if (isLocked || !draftPlan || !currentInitiative) return;
    setIsGeneratingIntelligence(true);
    try {
      const { data: result, error: edgeError } = await supabase.functions.invoke('gtmos-api', {
        body: {
          action: 'generate-initiative-intelligence',
          initiativeName: currentInitiative.initiativeName,
          description: currentInitiative.description,
          strategicObjective: currentInitiative.strategicObjective,
          onboardingData: project.onboarding
        }
      });

      if (edgeError || !result) {
        throw new Error(edgeError?.message || "Failed to contact Gemini strategy advisor.");
      }
      
      const updatedWorkstreams = [...draftPlan.workstreams];
      
      const newDeps = [
        ...(currentInitiative.dependencies || []),
        ...(result.dependencies || [])
      ].map((d, i) => d.id ? d : { ...d, id: `dep-gen-${i}-${Date.now()}` });
      
      const newRules = [
        ...(currentInitiative.aiMonitoringRules || []),
        ...(result.aiMonitoringRules || [])
      ].map((r, i) => r.id ? r : { ...r, id: `rule-gen-${i}-${Date.now()}` });

      updatedWorkstreams[selectedWsIndex].initiatives[selectedInitIndex] = {
        ...currentInitiative,
        dependencies: newDeps,
        aiMonitoringRules: newRules
      };
      
      const finalPlan = { ...draftPlan, workstreams: updatedWorkstreams };
      updateDraft(finalPlan);
      onSavePlan(finalPlan);
    } catch (err: any) {
      console.error(err);
      alert("Intelligence generation failed. Ensure your server is running and your Gemini API Key is active.");
    } finally {
      setIsGeneratingIntelligence(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS CARD */}
      <div className="p-6 rounded-3xl bg-bg-surface/60 border border-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#00F090] uppercase block">Operations Orchestration</span>
            {isLocked ? (
              <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] font-mono text-accent flex items-center gap-1">
                <Lock className="h-3 w-3" /> Live Executing
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-500 flex items-center gap-1">
                <Unlock className="h-3 w-3" /> Strategy Sandbox
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-text-primary">Step 15: GTM Execution Engine</h2>
          <p className="text-xs text-text-secondary leading-normal max-w-2xl font-sans">
            Bridge GTM theory and dynamic execution. Converted from abstract strategic pillars into a trackable Program Hierarchy: Workstreams, Initiatives, Actions, and real-time AI Monitoring.
          </p>
        </div>

        {/* PERSISTENCE & STAGE TOGGLE DOCK */}
        <div className="flex flex-wrap items-center gap-3">
          {project.archivedExecutionPlan && (
            <div className="flex bg-bg-surface border border-border/80 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setActiveStage('modeling')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all flex items-center gap-1.5 ${
                  activeStage === 'modeling' ? 'bg-amber-500 text-black shadow' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Unlock className="h-3.5 w-3.5" /> 1. Strategy Draft
              </button>
              <button
                onClick={() => setActiveStage('execution')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition-all flex items-center gap-1.5 ${
                  activeStage === 'execution' ? 'bg-accent text-black shadow' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Lock className="h-3.5 w-3.5" /> 2. Live Execution
              </button>
            </div>
          )}

          {!activePlan ? (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-accent text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Program Architecture...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate GTM Execution Plan
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isLocked ? (
                <>
                  <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-bg-surface border border-border text-text-primary font-bold text-xs rounded-xl hover:bg-bg-surface/80 flex items-center gap-1.5 disabled:opacity-40"
                    title="Regenerating will update Strategy Draft and replace edited items."
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate Draft
                  </button>
                  <button
                    onClick={handleLocalSave}
                    className="px-4 py-2 bg-bg-surface border border-border text-text-primary hover:text-accent hover:border-accent font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Draft
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-4 py-2 bg-accent hover:bg-accent/95 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-accent/10"
                    title="Lock GTM strategy and load archived program tracking stage."
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive to Execution
                  </button>
                </>
              ) : (
                <button
                  onClick={handleReleaseArchive}
                  className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Release Execution Lock
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* METRIC PERFORMANCE AND SCOREBAR BANNER */}
      {activePlan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border/80 flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-text-secondary uppercase">Revenue Goal Target</div>
              <div className="text-xs font-black text-text-primary leading-tight mt-0.5">{activePlan.revenueGoal || '$10M ARR'}</div>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border/80 flex items-center gap-3">
            <div className="p-3 bg-[#00F090]/10 rounded-xl">
              <Clock className="h-5 w-5 text-[#00F090]" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#00F090] uppercase">Strategic Timeframe</div>
              <div className="text-xs font-black text-text-primary leading-tight mt-0.5">{activePlan.launchPeriod || '12-18 Months'}</div>
            </div>
          </div>

          {/* DYNAMIC PROGRESS MONITORING (LOCKED OR ACTIVE) */}
          <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border/80 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary uppercase mb-1">
              <span>Sprint Task Completion</span>
              <span className="font-bold text-text-primary">{activeStats.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500" 
                style={{ width: `${activeStats.percent}%` }}
              />
            </div>
            <div className="text-[9px] text-text-secondary/80 mt-1 font-mono text-right">
              {activeStats.completed} of {activeStats.total} actions hit
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-surface/40 border border-border/80 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary uppercase mb-1">
              <span>KPI Target Attainment</span>
              <span className="font-bold text-[#00F090]">{kpiStats.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div 
                className="h-full bg-[#00F090] transition-all duration-500" 
                style={{ width: `${kpiStats.percent}%` }}
              />
            </div>
            <div className="text-[9px] text-text-secondary/80 mt-1 font-mono text-right">
              {kpiStats.achieved} of {kpiStats.total} metrics locked
            </div>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE SPLIT LAYOUT */}
      {!activePlan ? (
        <div className="p-16 rounded-3xl bg-bg-surface/30 border border-border/80 text-center space-y-4">
          <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl w-fit mx-auto animate-pulse">
            <Bot className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-text-primary">Operational Program Architecture Blank</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              Based on your onboarding segments, finalized strategic pillars, and active planning horizons, the Execution Engine will model program workstreams complete with actions, RACI variables, budget structures, and AI risk buffers.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-accent text-black font-extrabold text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-40"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            Compile Strategic Execution Structure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE PANEL: WORKSTREAMS & INITIATIVES INDEX */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* PROGRAM METADATA AND STATEMENT CARD */}
            <div className="p-5 rounded-2xl bg-bg-surface/55 border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-mono uppercase bg-accent/10 text-accent px-1.5 py-0.5 rounded">Program Objective</span>
                {!isLocked && (
                  <button 
                    onClick={() => setIsEditingProgramInfo(!isEditingProgramInfo)}
                    className="p-1 hover:text-accent transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-text-secondary" />
                  </button>
                )}
              </div>

              {isEditingProgramInfo ? (
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase">Program Name</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2 rounded bg-bg-surface border border-border text-text-primary font-bold"
                      value={activePlan.programName}
                      onChange={e => updateDraft({ ...activePlan, programName: e.target.value })}
                      onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-text-secondary uppercase">Description</label>
                    <textarea
                      rows={2}
                      className="w-full text-xs p-2 rounded bg-bg-surface border border-border text-text-primary font-sans leading-normal"
                      value={activePlan.description}
                      onChange={e => updateDraft({ ...activePlan, description: e.target.value })}
                      onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingProgramInfo(false);
                      if (draftPlan) onSavePlan(draftPlan);
                    }}
                    className="px-2.5 py-1.5 bg-accent text-black font-extrabold text-[10px] rounded-lg"
                  >
                    Close & Apply
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-text-primary">{activePlan.programName}</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed font-sans">{activePlan.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Economic Sponsor</div>
                      <div className="font-bold text-text-primary">{activePlan.executiveSponsor}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Goal Outcome</div>
                      <div className="font-bold text-text-primary truncate">{activePlan.businessGoal}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WORKSTREAMS LIST */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono font-bold uppercase text-text-secondary">Workstream Hierarchy</span>
                {!isLocked && (
                  <button 
                    onClick={addWorkstream}
                    className="p-1 px-2 rounded-lg bg-bg-surface border border-border text-[10px] font-bold font-sans text-text-secondary hover:text-accent hover:border-accent flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Add WS
                  </button>
                )}
              </div>

              {activePlan.workstreams.map((ws, wsIdx) => (
                <div 
                  key={ws.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    wsIdx === selectedWsIndex 
                      ? 'bg-bg-surface border-accent shadow-mdshadow-accent/5' 
                      : 'bg-bg-surface/30 border-border hover:bg-bg-surface/40'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <button
                      onClick={() => {
                        setSelectedWsIndex(wsIdx);
                        setSelectedInitIndex(0);
                      }}
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono font-bold tracking-widest text-[#00F090] uppercase">WS {wsIdx + 1}</span>
                        <span className={`px-1 rounded text-[8px] uppercase font-bold ${
                          ws.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-500'
                        }`}>{ws.priority}</span>
                      </div>
                      
                      {!isLocked && wsIdx === selectedWsIndex ? (
                        <div className="space-y-1.5 mt-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Workstream name"
                            className="w-full text-xs p-1 font-bold bg-bg-surface border border-border/80 text-text-primary rounded focus:ring-1 focus:ring-accent"
                            value={ws.workstreamName}
                            onChange={e => {
                              const cloned = [...activePlan.workstreams];
                              cloned[wsIdx].workstreamName = e.target.value;
                              updateDraft({ ...activePlan, workstreams: cloned });
                            }}
                            onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                          />
                          <textarea
                            placeholder="Workstream strategy / description..."
                            rows={2}
                            className="w-full text-[10px] p-1 font-sans bg-bg-surface border border-border/80 text-text-secondary rounded leading-normal resize-none focus:ring-1 focus:ring-accent"
                            value={ws.purpose}
                            onChange={e => {
                              const cloned = [...activePlan.workstreams];
                              cloned[wsIdx].purpose = e.target.value;
                              updateDraft({ ...activePlan, workstreams: cloned });
                            }}
                            onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                          />
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-black text-text-primary mt-1 line-clamp-1">{ws.workstreamName}</h4>
                          <p className="text-[10px] text-text-secondary/80 font-sans mt-0.5 max-w-full leading-normal">{ws.purpose}</p>
                        </div>
                      )}
                    </button>

                    {!isLocked && (
                      <button 
                        onClick={() => deleteWorkstream(wsIdx)}
                        className="p-1 text-text-secondary/60 hover:text-red-400 transition-colors shrink-0"
                        title="Delete workstream"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* INITIATIVES UNDER THIS WS */}
                  <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                    {ws.initiatives.map((init, initIdx) => (
                      <button
                        key={init.id}
                        onClick={() => {
                          setSelectedWsIndex(wsIdx);
                          setSelectedInitIndex(initIdx);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex justify-between items-center text-[11px] transition-all ${
                          wsIdx === selectedWsIndex && initIdx === selectedInitIndex
                            ? 'bg-accent/15 text-accent border-l-2 border-accent font-black pl-3.5'
                            : 'text-text-secondary bg-bg-surface/20 hover:text-text-primary border-l-2 border-transparent'
                        }`}
                      >
                        <span className="truncate flex-1 pr-2">{init.initiativeName}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    ))}
                    
                    {!isLocked && wsIdx === selectedWsIndex && (
                      <button
                        onClick={addInitiative}
                        className="w-full p-2 rounded-xl border border-dashed border-border/80 text-center text-[10px] font-sans text-text-secondary hover:text-accent hover:border-accent flex items-center justify-center gap-1 transition-all mt-1"
                      >
                        <Plus className="h-3 w-3" /> Insert New Initiative
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* RACI GOVERNANCE BRIEF */}
            <div className="p-5 rounded-2xl bg-bg-surface/20 border border-border/80 space-y-2.5">
              <span className="text-[8px] font-mono uppercase bg-border text-text-secondary px-1.5 py-0.5 rounded">RACI GOVERNANCE</span>
              <p className="text-[10px] font-sans text-text-secondary leading-relaxed">{activePlan.governance?.raciAssignment}</p>
              <div className="text-[10px] bg-bg-surface/40 p-2 rounded border border-border/40 space-y-1">
                <div><span className="font-bold text-text-primary">Cadence:</span> {activePlan.governance?.reviewCadence}</div>
                <div><span className="font-bold text-text-primary">Escalation Path:</span> {activePlan.governance?.escalationPath}</div>
              </div>
            </div>
            
          </div>

          {/* RIGHT SIDE DETAILS PANEL: INITIATIVE DEPTH VIEW */}
          <div className="lg:col-span-8 space-y-6">
            
            {currentInitiative ? (
              <div className="space-y-6">
                
                {/* ACTIVE INITIATIVE HEADER CARD */}
                <div className="p-6 rounded-3xl bg-bg-surface border border-accent/20 relative overflow-hidden space-y-4">
                  {/* Backdrop glowing accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-mono uppercase bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent">Initiative Active Details</span>
                        {!isLocked ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={currentInitiative.priority}
                              onChange={e => {
                                const cloned = [...activePlan.workstreams];
                                cloned[selectedWsIndex].initiatives[selectedInitIndex].priority = e.target.value as 'low' | 'medium' | 'high';
                                updateDraft({ ...activePlan, workstreams: cloned });
                              }}
                              onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                              className="px-1.5 py-0.5 rounded border border-border/80 bg-bg-surface text-[9px] font-bold text-text-primary uppercase cursor-pointer"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>

                            <select
                              value={currentInitiative.status || "Not Started"}
                              onChange={e => {
                                const cloned = [...activePlan.workstreams];
                                cloned[selectedWsIndex].initiatives[selectedInitIndex].status = e.target.value as any;
                                updateDraft({ ...activePlan, workstreams: cloned });
                              }}
                              onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                              className="px-1.5 py-0.5 rounded border border-border/80 bg-bg-surface text-[9px] font-bold text-text-primary uppercase cursor-pointer"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Delayed">Delayed</option>
                            </select>
                          </div>
                        ) : (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-border text-[9px] font-bold text-text-secondary uppercase">{currentInitiative.priority} Priority</span>
                            <span className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] font-bold text-accent uppercase">{currentInitiative.status || "Not Started"}</span>
                          </>
                        )}
                      </div>
                      
                      {!isLocked ? (
                        <input
                          type="text"
                          className="text-base font-black text-text-primary bg-bg-surface border-b border-border w-full py-1 focus:border-accent"
                          value={currentInitiative.initiativeName}
                          onChange={e => {
                            const cloned = [...activePlan.workstreams];
                            cloned[selectedWsIndex].initiatives[selectedInitIndex].initiativeName = e.target.value;
                            updateDraft({ ...activePlan, workstreams: cloned });
                          }}
                          onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                        />
                      ) : (
                        <h3 className="text-base font-black text-text-primary">{currentInitiative.initiativeName}</h3>
                      )}
                    </div>

                    {!isLocked && (
                      <button
                        onClick={() => deleteInitiative(selectedInitIndex)}
                        className="p-1 px-2.5 rounded-lg border border-border text-[10px] font-bold text-text-secondary hover:text-red-400 hover:border-red-400 flex items-center gap-1 transition-all"
                        title="Delete this entire initiative from this workstream"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Initiative
                      </button>
                    )}
                  </div>

                  {!isLocked ? (
                    <textarea
                      rows={2}
                      className="w-full text-xs p-2 rounded bg-bg-surface border border-border text-text-primary font-sans leading-normal"
                      value={currentInitiative.description}
                      onChange={e => {
                        const cloned = [...activePlan.workstreams];
                        cloned[selectedWsIndex].initiatives[selectedInitIndex].description = e.target.value;
                        updateDraft({ ...activePlan, workstreams: cloned });
                      }}
                      onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                    />
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed font-sans">{currentInitiative.description}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50 text-[11px] font-sans">
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Objective</div>
                      {!isLocked ? (
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 mt-0.5 bg-bg-surface border border-border text-text-primary rounded focus:ring-1 focus:ring-accent"
                          value={currentInitiative.strategicObjective}
                          onChange={e => {
                            const cloned = [...activePlan.workstreams];
                            cloned[selectedWsIndex].initiatives[selectedInitIndex].strategicObjective = e.target.value;
                            updateDraft({ ...activePlan, workstreams: cloned });
                          }}
                          onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                        />
                      ) : (
                        <div className="font-bold text-text-primary mt-0.5">{currentInitiative.strategicObjective}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Delivery Budget</div>
                      {!isLocked ? (
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 mt-0.5 bg-bg-surface border border-border text-text-primary rounded focus:ring-1 focus:ring-accent"
                          value={currentInitiative.budget}
                          onChange={e => {
                            const cloned = [...activePlan.workstreams];
                            cloned[selectedWsIndex].initiatives[selectedInitIndex].budget = e.target.value;
                            updateDraft({ ...activePlan, workstreams: cloned });
                          }}
                          onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                        />
                      ) : (
                        <div className="font-bold text-text-primary mt-0.5">{currentInitiative.budget}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Task Owner</div>
                      {!isLocked ? (
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 mt-0.5 bg-bg-surface border border-border text-[#00F090] font-bold rounded focus:ring-1 focus:ring-accent"
                          value={currentInitiative.owner}
                          onChange={e => {
                            const cloned = [...activePlan.workstreams];
                            cloned[selectedWsIndex].initiatives[selectedInitIndex].owner = e.target.value;
                            updateDraft({ ...activePlan, workstreams: cloned });
                          }}
                          onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                        />
                      ) : (
                        <div className="font-bold text-[#00F090] mt-0.5">{currentInitiative.owner}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-text-secondary uppercase">Campaign Timeline</div>
                      {!isLocked ? (
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 mt-0.5 bg-bg-surface border border-border text-text-primary rounded focus:ring-1 focus:ring-accent"
                          value={currentInitiative.timeline}
                          onChange={e => {
                            const cloned = [...activePlan.workstreams];
                            cloned[selectedWsIndex].initiatives[selectedInitIndex].timeline = e.target.value;
                            updateDraft({ ...activePlan, workstreams: cloned });
                          }}
                          onBlur={() => { if (draftPlan) onSavePlan(draftPlan); }}
                        />
                      ) : (
                        <div className="font-bold text-text-primary mt-0.5">{currentInitiative.timeline}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TAB SECTION A: ACTIONS SPRINTS BOARD */}
                <div className="p-6 rounded-3xl bg-bg-surface/40 border border-border space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-[#00F090]/10 border border-[#00F090]/20 text-[#00F090]">
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Operational Action Board</h4>
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => {
                          setNewActionName('');
                          setNewActionType('Asset Creation');
                          setNewActionDesc('Perform target delivery of operations assets.');
                          setNewActionOwner('Associate Core Team');
                          setNewActionDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                          setNewActionCriteria('Verified output');
                          setActiveModal('action');
                        }}
                        className="py-1 px-2.5 rounded-lg bg-bg-surface border border-border hover:border-accent hover:text-accent font-bold text-[10px] text-text-secondary flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3 w-3" /> Add Action
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {currentInitiative.actions.length === 0 ? (
                      <p className="text-[11px] text-text-secondary/70 italic text-center py-4 font-sans">No active actions defined. Add one or regenerate plan.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentInitiative.actions.map(act => (
                          <div 
                            key={act.id} 
                            className={`p-4 rounded-xl border flex flex-col justify-between ${
                              act.status === 'completed'
                                ? 'bg-bg-surface border-border/40 opacity-75'
                                : act.status === 'blocked'
                                ? 'bg-red-500/5 border-red-500/20'
                                : 'bg-bg-surface border-border/80'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  act.taskType === 'Systems Integration' ? 'bg-[#00F090]/10 text-[#00F090]' : 'bg-accent/10 text-accent'
                                }`}>{act.taskType}</span>
                                
                                <div className="flex items-center gap-2">
                                  <select
                                    value={act.status}
                                    onChange={e => updateActionStatus(act.id, e.target.value as any)}
                                    className="p-1 rounded border border-border bg-bg-surface text-[9px] font-sans text-text-primary cursor-pointer"
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                  </select>

                                  {!isLocked && (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                          setNewActionName(act.actionName);
                                          setNewActionType(act.taskType);
                                          setNewActionDesc(act.description);
                                          setNewActionOwner(act.owner);
                                          setNewActionDueDate(act.dueDate);
                                          setNewActionCriteria(act.completionCriteria || '');
                                          setEditingItemId(act.id);
                                          setActiveModal('action');
                                        }}
                                        className="text-text-secondary/60 hover:text-accent p-0.5"
                                        title="Edit Action"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button 
                                        onClick={() => deleteSubItemAction(act.id)}
                                        className="text-text-secondary/60 hover:text-red-400 p-0.5"
                                        title="Delete Action"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <h5 className="text-xs font-black text-text-primary leading-tight">{act.actionName}</h5>
                                <p className="text-[10px] text-text-secondary font-sans leading-relaxed">{act.description}</p>
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-border/40 flex justify-between items-center text-[9px] text-text-secondary/80 font-mono">
                              <div>Owner: <span className="text-text-primary font-bold">{act.owner}</span></div>
                              <div className="text-right">Due: <span className="text-text-primary font-bold">{act.dueDate}</span></div>
                            </div>
                            
                            {act.completionCriteria && (
                              <div className="mt-2 bg-bg-surface/50 p-1.5 rounded border border-border/30 text-[9px] text-text-secondary leading-normal font-sans">
                                <span className="font-bold text-text-primary">Done Criteria:</span> {act.completionCriteria}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* GRID: TAB SECTION B: KPIs & RISKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* PERFORMANCE COGNITIVE KPIS */}
                  <div className="p-5 rounded-2xl bg-bg-surface/40 border border-border space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 text-accent" />
                        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Metrics Ledger KPIs</h5>
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() => {
                            setNewKpiName('');
                            setNewKpiCategory('Acquisition');
                            setNewKpiBaseline('0');
                            setNewKpiTarget('100');
                            setNewKpiFreq('Weekly');
                            setNewKpiOwner('Analyst');
                            setActiveModal('kpi');
                          }}
                          className="py-1 px-2 rounded-lg border border-border hover:border-accent hover:text-accent font-bold text-[9px] text-text-secondary flex items-center gap-1 transition-all"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add KPI
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {currentInitiative.kpis.length === 0 ? (
                        <p className="text-[10px] text-text-secondary/70 italic text-center py-3 font-sans">No dynamic metrics mapped.</p>
                      ) : (
                        currentInitiative.kpis.map(kpi => {
                          const goalNum = parseFloat(kpi.target.replace(/[^0-9.]/g, '')) || 0;
                          const currentNum = parseFloat(kpi.currentValue.replace(/[^0-9.]/g, '')) || 0;
                          const completionRatio = goalNum > 0 ? Math.min(Math.round((currentNum / goalNum) * 100), 100) : 0;

                          return (
                            <div key={kpi.id} className="p-3.5 rounded-xl bg-bg-surface border border-border/80 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-[8px] font-mono text-text-secondary/80 uppercase">{kpi.kpiCategory} • {kpi.measurementFrequency}</span>
                                  <h6 className="text-[11px] font-bold text-text-primary line-clamp-1">{kpi.kpiName}</h6>
                                </div>
                                {!isLocked && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button 
                                      onClick={() => {
                                        setNewKpiName(kpi.kpiName);
                                        setNewKpiCategory(kpi.kpiCategory);
                                        setNewKpiBaseline(kpi.baseline);
                                        setNewKpiTarget(kpi.target);
                                        setNewKpiFreq(kpi.measurementFrequency);
                                        setNewKpiOwner(kpi.owner);
                                        setEditingItemId(kpi.id);
                                        setActiveModal('kpi');
                                      }}
                                      className="text-text-secondary/50 hover:text-accent p-0.5"
                                      title="Edit KPI"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => deleteSubItemKPI(kpi.id)} 
                                      className="text-text-secondary/50 hover:text-red-400 p-0.5"
                                      title="Delete KPI"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1 bg-bg-surface/40 p-1.5 rounded border border-border/30 text-[10px] text-center font-mono">
                                <div>
                                  <div className="text-[7px] text-text-secondary">Base</div>
                                  <div className="text-text-primary/70">{kpi.baseline}</div>
                                </div>
                                <div className="border-x border-border/40">
                                  <div className="text-[7px] text-[#00F090]">Target</div>
                                  <div className="text-[#00F090] font-bold">{kpi.target}</div>
                                </div>
                                <div>
                                  <div className="text-[7px] text-accent">Value</div>
                                  <input
                                    type="text"
                                    className="w-full text-center font-bold bg-bg-surface text-accent border border-border/40 rounded py-0.5 text-[10px]"
                                    value={kpi.currentValue}
                                    onChange={e => updateKPICurrentValue(kpi.id, e.target.value)}
                                  />
                                </div>
                              </div>

                              {goalNum > 0 && (
                                <div className="space-y-1">
                                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                                    <div 
                                      className="h-full bg-accent transition-all duration-300" 
                                      style={{ width: `${completionRatio}%` }}
                                    />
                                  </div>
                                  <div className="text-[7px] text-text-secondary font-mono text-right">{completionRatio}% achieved</div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RISK FACTOR BUFFER ENGINE */}
                  <div className="p-5 rounded-2xl bg-bg-surface/40 border border-border space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Strategic Risk Buffer</h5>
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() => {
                            setNewRiskName('');
                            setNewRiskDesc('Unexpected blockages in operations timeline.');
                            setNewRiskProb('medium');
                            setNewRiskImpact('high');
                            setNewRiskMitigation('Pre-seed alternative pathways.');
                            setNewRiskOwner('Project Lead');
                            setActiveModal('risk');
                          }}
                          className="py-1 px-2 rounded-lg border border-border hover:border-red-400 hover:text-red-400 font-bold text-[9px] text-text-secondary flex items-center gap-1 transition-all"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add Risk
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {currentInitiative.risks.length === 0 ? (
                        <p className="text-[10px] text-text-secondary/70 italic text-center py-3 font-sans">No risks mapped.</p>
                      ) : (
                        currentInitiative.risks.map(risk => {
                          const score = risk.riskScore || 4;
                          const badgCol = score >= 6 ? 'bg-red-500/15 text-red-400 border-red-500/20' : score >= 3 ? 'bg-amber-500/15 text-amber-500 border-amber-500/20' : 'bg-green-500/15 text-green-400 border-green-500/20';

                          return (
                            <div key={risk.id} className="p-3.5 rounded-xl bg-bg-surface border border-border/80 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <h6 className="text-[11px] font-bold text-text-primary line-clamp-1">{risk.riskName}</h6>
                                  <p className="text-[10px] text-text-secondary leading-normal font-sans">{risk.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${badgCol}`}>
                                    Score: {score}
                                  </span>
                                  {!isLocked && (
                                    <div className="flex items-center gap-0.5">
                                      <button 
                                        onClick={() => {
                                          setNewRiskName(risk.riskName);
                                          setNewRiskDesc(risk.description);
                                          setNewRiskProb(risk.probability);
                                          setNewRiskImpact(risk.impact);
                                          setNewRiskMitigation(risk.mitigationPlan);
                                          setNewRiskOwner(risk.owner);
                                          setEditingItemId(risk.id);
                                          setActiveModal('risk');
                                        }}
                                        className="text-text-secondary/50 hover:text-accent p-0.5"
                                        title="Edit Risk"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button 
                                        onClick={() => deleteSubItemRisk(risk.id)}
                                        className="text-text-secondary/50 hover:text-red-400 p-0.5"
                                        title="Delete Risk"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 bg-bg-surface/50 p-2 rounded border border-border/30 text-[9px] font-mono">
                                <div className="flex-1">
                                  <label className="text-[7px] text-text-secondary">PROBABILITY</label>
                                  <select
                                    value={risk.probability}
                                    onChange={e => changeRiskScore(risk.id, e.target.value as any, risk.impact)}
                                    className="w-full mt-0.5 p-1 rounded bg-bg-surface border border-border/60 text-text-primary text-[9px]"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                </div>
                                
                                <div className="flex-1">
                                  <label className="text-[7px] text-text-secondary">IMPACT</label>
                                  <select
                                    value={risk.impact}
                                    onChange={e => changeRiskScore(risk.id, risk.probability, e.target.value as any)}
                                    className="w-full mt-0.5 p-1 rounded bg-bg-surface border border-border/60 text-text-primary text-[9px]"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                </div>
                              </div>

                              <div className="bg-bg-surface/80 p-2 rounded border border-border/50 text-[10px] font-sans text-text-secondary leading-normal">
                                <span className="font-bold text-text-primary">Mitigation:</span> {risk.mitigationPlan}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>                {/* GRID: TAB SECTION C: DEPENDENCIES & AI MONITORING RULES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* DEPENDENCIES PANEL */}
                  <div className="p-5 rounded-2xl bg-bg-surface/40 border border-border space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-indigo-400" />
                        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider font-sans">Strategic Dependencies</h5>
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setNewDepType('Technical Dependency');
                              setNewDepBlocking('');
                              setNewDepBlocked(currentInitiative.initiativeName);
                              setNewDepImpact('');
                              setEditingItemId(null);
                              setActiveModal('dependency');
                            }}
                            className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1"
                          >
                            <Plus className="h-2.5 w-2.5" /> Manual Add
                          </button>

                          <button
                            onClick={generateInitiativeIntelligence}
                            disabled={isGeneratingIntelligence}
                            className="px-2 py-1 rounded bg-[#00F090]/10 border border-[#00F090]/20 text-[9px] font-mono text-[#00F090] hover:bg-[#00F090]/20 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <Sparkles className="h-2.5 w-2.5 animate-pulse" /> {isGeneratingIntelligence ? "Reasoning..." : "AI Consult"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-[11px] font-sans">
                      {currentInitiative.dependencies && currentInitiative.dependencies.length > 0 ? (
                        currentInitiative.dependencies.map(dep => (
                          <div key={dep.id} className="p-3.5 rounded-xl bg-bg-surface border border-border/80 space-y-1.5 relative group">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                {dep.dependencyType}
                              </span>
                              {!isLocked && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setNewDepType(dep.dependencyType);
                                      setNewDepBlocking(dep.blockingInitiative);
                                      setNewDepBlocked(dep.blockedInitiative);
                                      setNewDepImpact(dep.impactDescription);
                                      setEditingItemId(dep.id);
                                      setActiveModal('dependency');
                                    }}
                                    className="p-0.5 text-text-secondary/60 hover:text-accent rounded"
                                    title="Edit Dependency"
                                  >
                                    <Edit2 className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteSubItemDependency(dep.id)}
                                    className="p-0.5 text-text-secondary/60 hover:text-red-400 rounded"
                                    title="Delete Dependency"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-text-primary">
                              <span className="font-bold text-red-400 truncate max-w-[120px]" title={dep.blockingInitiative}>{dep.blockingInitiative}</span>
                              <span className="font-mono text-text-secondary shrink-0">BLOCKS ➔</span>
                              <span className="font-bold text-indigo-400 truncate max-w-[120px]" title={dep.blockedInitiative}>{dep.blockedInitiative}</span>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed pt-1 border-t border-border/30">{dep.impactDescription}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-text-secondary/70 italic text-center py-3">No active critical dependencies mapped.</p>
                      )}
                    </div>
                  </div>

                  {/* AI GUARDIAN MONITORING ENGINE */}
                  <div className="p-5 rounded-2xl bg-[#00F090]/5 border border-[#00F090]/15 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-[#00F090]" />
                        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">AI Guardian Monitoring</h5>
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setNewRuleMetric('');
                              setNewRuleTarget('');
                              setNewRuleAlert('');
                              setNewRuleCondition('');
                              setNewRuleAction('');
                              setEditingItemId(null);
                              setActiveModal('aimonitoring');
                            }}
                            className="px-2 py-1 rounded bg-[#00F090]/10 border border-[#00F090]/20 text-[9px] font-mono text-[#00F090] hover:bg-[#00F090]/20 transition-all flex items-center gap-1"
                          >
                            <Plus className="h-2.5 w-2.5" /> Manual Add
                          </button>

                          <button
                            onClick={generateInitiativeIntelligence}
                            disabled={isGeneratingIntelligence}
                            className="px-2 py-1 rounded bg-[#00F090]/10 border border-[#00F090]/20 text-[9px] font-mono text-[#00F090] hover:bg-[#00F090]/20 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            <Sparkles className="h-2.5 w-2.5 animate-pulse" /> {isGeneratingIntelligence ? "Reasoning..." : "AI Consult"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-[11px] font-sans">
                      {currentInitiative.aiMonitoringRules && currentInitiative.aiMonitoringRules.length > 0 ? (
                        currentInitiative.aiMonitoringRules.map(rule => {
                          const fakeTriggered = kpiStats.percent < 15;

                          return (
                            <div key={rule.id} className="p-3.5 rounded-xl bg-bg-surface border border-border/80 space-y-2 relative group">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-mono text-text-secondary uppercase">METRIC TARGET: {rule.metric}</span>
                                <div className="flex items-center gap-1.5">
                                  {fakeTriggered ? (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-[#00F090]/20 text-[8px] font-mono text-red-400 animate-pulse flex items-center gap-1">
                                      🔴 CRITICAL TRIGGER
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-[#00F090]/10 border border-[#00F090]/20 text-[8px] font-mono text-[#00F090] flex items-center gap-1">
                                      🟢 STANDBY OK
                                    </span>
                                  )}
                                  {!isLocked && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 border-l border-border/40 pl-1.5">
                                      <button
                                        onClick={() => {
                                          setNewRuleMetric(rule.metric);
                                          setNewRuleTarget(rule.targetThreshold);
                                          setNewRuleAlert(rule.alertThreshold);
                                          setNewRuleCondition(rule.triggerCondition);
                                          setNewRuleAction(rule.recommendedAction);
                                          setEditingItemId(rule.id);
                                          setActiveModal('aimonitoring');
                                        }}
                                        className="p-0.5 text-text-secondary/60 hover:text-accent rounded"
                                        title="Edit Alert Rule"
                                      >
                                        <Edit2 className="h-2.5 w-2.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteSubItemRule(rule.id)}
                                        className="p-0.5 text-text-secondary/60 hover:text-red-400 rounded"
                                        title="Delete Alert Rule"
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 bg-bg-surface/50 p-2 rounded border border-border/30 text-[9px] font-mono">
                                <div>
                                  <span className="text-text-secondary">TARGET BAR</span>
                                  <div className="text-[#00F090] font-bold">{rule.targetThreshold}</div>
                                </div>
                                <div className="border-l border-border/40 pl-2">
                                  <span className="text-text-secondary">ALERT BAR</span>
                                  <div className="text-red-400 font-bold">{rule.alertThreshold}</div>
                                </div>
                              </div>

                              <p className="text-[10px] text-text-secondary"><span className="font-bold text-text-primary">Trigger Condition:</span> {rule.triggerCondition}</p>
                              
                              <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-text-primary flex items-start gap-1.5">
                                <Bot className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-[9px] font-mono text-accent">RECOMMENDED AUTOMATION</div>
                                  <p className="text-[11px] leading-normal font-sans font-medium mt-0.5">{rule.recommendedAction}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-text-secondary/70 italic text-center py-3">No active AI telemetry rules mapped.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-bg-surface/30 border border-border/80 text-center text-text-secondary font-sans italic">
                Select an initiative from the workstream list to examine core details.
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL DIALOGS FOR DYNAMIC SUB-ITEMS ADDITION */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-border rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-border/50 flex justify-between items-center">
              <h4 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent" />
                {activeModal === 'action' && (editingItemId ? "Update Operational Action Item" : "Add Operational Action Item")}
                {activeModal === 'kpi' && (editingItemId ? "Update Metrics Ledger KPI" : "Add Metrics Ledger KPI")}
                {activeModal === 'risk' && (editingItemId ? "Update Strategic Risk Buffer Factor" : "Add Strategic Risk Buffer Factor")}
                {activeModal === 'dependency' && (editingItemId ? "Update Strategic Dependency Relation" : "Add Strategic Dependency Relation")}
                {activeModal === 'aimonitoring' && (editingItemId ? "Update AI Guardian SLA Rule" : "Add AI Guardian SLA Rule")}
              </h4>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setEditingItemId(null);
                }}
                className="text-text-secondary hover:text-text-primary font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-left">
              {activeModal === 'action' && (
                <form onSubmit={handleCreateActionSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Action Name/Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Conduct baseline buyer feedback session"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-medium font-sans text-xs"
                      value={newActionName}
                      onChange={e => setNewActionName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Task Type/Category</label>
                      <select 
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-sans text-xs"
                        value={newActionType}
                        onChange={e => setNewActionType(e.target.value)}
                      >
                        <option value="Asset Creation">Asset Creation</option>
                        <option value="Systems Integration">Systems Integration</option>
                        <option value="Campaign Setup">Campaign Setup</option>
                        <option value="Analytics & BI">Analytics & BI</option>
                        <option value="Enablement Training">Enablement Training</option>
                        <option value="Operational Audit">Operational Audit</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Task Owner</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Head of Product Marketing"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newActionOwner}
                        onChange={e => setNewActionOwner(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Action Description</label>
                    <textarea 
                      rows={2}
                      placeholder="Detail what tasks are involved in executing this action..."
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent leading-normal font-sans text-xs"
                      value={newActionDesc}
                      onChange={e => setNewActionDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Target Due Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newActionDueDate}
                        onChange={e => setNewActionDueDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Done Completion Criteria</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Signed sign-off from CRM owner"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newActionCriteria}
                        onChange={e => setNewActionCriteria(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-border hover:bg-bg-surface/50 text-text-primary rounded-xl font-bold font-sans text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-[#00F090] text-black hover:bg-[#00F090]/90 rounded-xl font-extrabold shadow font-sans text-xs"
                    >
                      {editingItemId ? "Update Action Item" : "Add Action Item"}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'kpi' && (
                <form onSubmit={handleCreateKPISubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">KPI Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sales Pipeline Velocity Expansion"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-medium font-sans text-xs"
                      value={newKpiName}
                      onChange={e => setNewKpiName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">KPI Category</label>
                      <select 
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-sans text-xs"
                        value={newKpiCategory}
                        onChange={e => setNewKpiCategory(e.target.value)}
                      >
                        <option value="Acquisition">Acquisition</option>
                        <option value="Conversion">Conversion</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Retention">Retention</option>
                        <option value="Pipeline">Pipeline</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Measurement Frequency</label>
                      <select 
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-sans text-xs"
                        value={newKpiFreq}
                        onChange={e => setNewKpiFreq(e.target.value)}
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Baseline Value</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 0% or $10k"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newKpiBaseline}
                        onChange={e => setNewKpiBaseline(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Target Value *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 80% or $150k"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newKpiTarget}
                        onChange={e => setNewKpiTarget(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">KPI Metric Owner</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. VP of RevOps"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                      value={newKpiOwner}
                      onChange={e => setNewKpiOwner(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-border hover:bg-bg-surface/50 text-text-primary rounded-xl font-bold font-sans text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-[#00F090] text-black hover:bg-[#00F090]/90 rounded-xl font-extrabold shadow font-sans text-xs"
                    >
                      {editingItemId ? "Update KPI Metric" : "Add KPI Metric"}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'risk' && (
                <form onSubmit={handleCreateRiskSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Risk Name/Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Data syncing lag in sales ledger"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-medium font-sans text-xs"
                      value={newRiskName}
                      onChange={e => setNewRiskName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Risk Probability</label>
                      <select 
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-semibold font-sans text-xs"
                        value={newRiskProb}
                        onChange={e => setNewRiskProb(e.target.value as any)}
                      >
                        <option value="low">Low Probability</option>
                        <option value="medium">Medium Probability</option>
                        <option value="high">High Probability</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Risk Impact</label>
                      <select 
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-semibold font-sans text-xs"
                        value={newRiskImpact}
                        onChange={e => setNewRiskImpact(e.target.value as any)}
                      >
                        <option value="low">Low Impact</option>
                        <option value="medium">Medium Impact</option>
                        <option value="high">High Impact</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Risk Description</label>
                    <textarea 
                      rows={2}
                      placeholder="Describe the risk and why it poses an operational hazard..."
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent leading-normal font-sans text-xs"
                      value={newRiskDesc}
                      onChange={e => setNewRiskDesc(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Mitigation Strategy Plan</label>
                    <textarea 
                      rows={2}
                      placeholder="Detail proactive measures designed to prevent or mitigate this risk..."
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent leading-normal font-sans text-xs"
                      value={newRiskMitigation}
                      onChange={e => setNewRiskMitigation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Risk Owner</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Risk Compliance Officer"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                      value={newRiskOwner}
                      onChange={e => setNewRiskOwner(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-border hover:bg-bg-surface/50 text-text-primary rounded-xl font-bold font-sans text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-[#00F090] text-black hover:bg-[#00F090]/90 rounded-xl font-extrabold shadow font-sans text-xs"
                    >
                      {editingItemId ? "Update Risk Factor" : "Add Risk Factor"}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'dependency' && (
                <form onSubmit={handleCreateDependencySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Dependency Type *</label>
                    <select 
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-sans text-xs"
                      value={newDepType}
                      onChange={e => setNewDepType(e.target.value)}
                    >
                      <option value="Technical Dependency">Technical Dependency</option>
                      <option value="Operational Dependency">Operational Dependency</option>
                      <option value="Resource Dependency">Resource Dependency</option>
                      <option value="Market Dependency">Market Dependency</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Blocking Initiative *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. CRM Integration Sync"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newDepBlocking}
                        onChange={e => setNewDepBlocking(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Blocked Initiative *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Direct Marketing Campaign launch"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newDepBlocked}
                        onChange={e => setNewDepBlocked(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Impact / Link Description</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Detail specifically what is blocked and how this dependency should be coordinated or bypassed..."
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent leading-normal font-sans text-xs"
                      value={newDepImpact}
                      onChange={e => setNewDepImpact(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-border hover:bg-bg-surface/50 text-text-primary rounded-xl font-bold font-sans text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-[#00F090] text-black hover:bg-[#00F090]/90 rounded-xl font-extrabold shadow font-sans text-xs"
                    >
                      {editingItemId ? "Update Relation" : "Add relation"}
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'aimonitoring' && (
                <form onSubmit={handleCreateRuleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">SLA Metric Target Tag *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sales cycle velocity drop"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent focus:border-accent font-medium font-sans text-xs"
                      value={newRuleMetric}
                      onChange={e => setNewRuleMetric(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Target Value Threshold</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 50 days threshold"
                        className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newRuleTarget}
                        onChange={e => setNewRuleTarget(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-text-secondary uppercase">Critical Alert Threshold</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. > 65 days alert"
                        className="w-full p-1.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                        value={newRuleAlert}
                        onChange={e => setNewRuleAlert(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">Trigger Rule Condition Detail</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Metric value exceeds 65 days for 2 successive weeks"
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent font-sans text-xs"
                      value={newRuleCondition}
                      onChange={e => setNewRuleCondition(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-text-secondary uppercase">AI Guardian Prescribed Automation Action</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="e.g. Instantly alert RevOps channel and spin up crisis mediation meetings with workstream owners..."
                      className="w-full p-2.5 rounded-xl bg-bg-surface border border-border text-text-primary focus:ring-1 focus:ring-accent leading-normal font-sans text-xs"
                      value={newRuleAction}
                      onChange={e => setNewRuleAction(e.target.value)}
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setEditingItemId(null);
                      }}
                      className="px-4 py-2 border border-border hover:bg-bg-surface/50 text-text-primary rounded-xl font-bold font-sans text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-[#00F090] text-black hover:bg-[#00F090]/90 rounded-xl font-extrabold shadow font-sans text-xs"
                    >
                      {editingItemId ? "Update SLA Rule" : "Add SLA Rule"}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
