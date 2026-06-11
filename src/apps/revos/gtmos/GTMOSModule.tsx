import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Sparkles,
  Settings,
  CheckCircle,
  Play,
  Plus,
  BookOpen,
  Users,
  ShieldAlert,
  Sliders,
  Calendar,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Download,
  RefreshCw,
  Bot,
  AlertCircle,
  Cpu,
  Bookmark,
  TrendingUp,
  Award,
  Layers,
  Activity,
  Heart,
  Target,
  Edit2,
  Trash2,
  Check,
  Briefcase,
  AlertOctagon,
  LineChart as LineChartIcon,
  FolderOpen,
  Loader2,
  Save,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRevOS } from '../context/RevOSContext';
import { OnboardingCategoryFields, StrategyPillar, GTMOSActionTask, GTMOSSimulationState, GTMOSRisk, GTMOSRecommendation, GTMOSProject, CategoryId } from './types';
import { CATEGORY_SPECS, INITIAL_ONBOARDING_FIELDS, EMPTY_ONBOARDING_FIELDS, SEED_PROJECTS, DEFAULT_PILLARS } from './initialState';
import { OnboardingForms } from './OnboardingForms';
import { SimulationTab } from './SimulationTab';
import { PillarRefiner } from './PillarRefiner';
import { ExecutionManager } from './ExecutionManager';
import { GTMSimulationEngine } from './GTMSimulationEngine';
import { GTMExecutionEngine } from './GTMExecutionEngine';
import { GTMExecutionPlan } from './types';
import { ExecutionPipeline } from './ExecutionPipeline';
import { ExecutionDashboard } from './ExecutionDashboard';
import { RevenueDecomposition } from './RevenueDecomposition';
import ReactMarkdown from 'react-markdown';

const PILLARS_METADATA = [
  {
    key: 'pillar_1_market_segmentation',
    name: 'Pillar 1: Market Segmentation',
    purpose: 'Identify and prioritize the highest-value customer segments.',
    keyQuestions: [
      'Which segments have the highest opportunity?',
      'Which segments have the strongest need?',
      'Which segments are most accessible?'
    ],
    outputs: ['Market Segments', 'Segment Prioritization', 'Market Opportunity Analysis', 'Target Market Selection']
  },
  {
    key: 'pillar_2_icp',
    name: 'Pillar 2: Ideal Customer Profile (ICP)',
    purpose: 'Define the customers most likely to buy and succeed.',
    keyQuestions: [
      'What company sizes target our features?',
      'Which industries are most profitable?',
      'What geographical locations do we cover?'
    ],
    outputs: ['Company Size', 'Industry', 'Geography', 'Buying Triggers', 'Budget Characteristics', 'Decision Structure']
  },
  {
    key: 'pillar_3_buyer_personas',
    name: 'Pillar 3: Buyer Personas',
    purpose: 'Identify and understand decision-makers and influencers.',
    keyQuestions: [
      'Who is our Economic Buyer (CFO, VP)?',
      'Who is our Technical Buyer?',
      'What are their primary pain points and success metrics?'
    ],
    outputs: ['Economic Buyers', 'Technical Buyers', 'Business Buyers', 'Influencers', 'Pain Points', 'Success Metrics']
  },
  {
    key: 'pillar_4_value_proposition',
    name: 'Pillar 4: Value Proposition',
    purpose: 'Translate product capabilities into measurable customer outcomes.',
    keyQuestions: [
      'What business outcomes do customers achieve?',
      'What are our competitive advantages?',
      'What are our core ROI Statements?'
    ],
    outputs: ['Customer Value', 'Business Outcomes', 'Differentiation', 'Competitive Advantages', 'ROI Statements']
  },
  {
    key: 'pillar_5_messaging_positioning',
    name: 'Pillar 5: Messaging & Positioning',
    purpose: 'Create differentiated and outcome-focused market messaging.',
    keyQuestions: [
      'What is our core positioning story?',
      'How do we anchor messaging in quantifiable benefits?',
      'What is our outcome-based narrative?'
    ],
    outputs: ['Positioning Statement', 'Core Messaging', 'Persona Messaging', 'Competitive Messaging', 'Outcome-Based Messaging']
  },
  {
    key: 'pillar_6_sales_channel',
    name: 'Pillar 6: Sales & Channel Strategy (Revenue Motion)',
    purpose: 'Define and prioritize how the company reaches market and acquires customers.',
    keyQuestions: [
      'Do we use direct outbound sales, inbound, or partners?',
      'What is our hybrid revenue motion?',
      'What is our partner strategy?'
    ],
    outputs: ['Direct Sales Strategy', 'Partner Strategy', 'Distributor Strategy', 'Digital Strategy', 'Hybrid Revenue Motion']
  },
  {
    key: 'pillar_7_marketing_demand',
    name: 'Pillar 7: Marketing & Demand Generation',
    purpose: 'Generate awareness, demand, pipeline, and market engagement.',
    keyQuestions: [
      'What programs command target awareness?',
      'What campaign structures fuel our sales team?',
      'How is lead-generation structured?'
    ],
    outputs: ['Demand Generation Programs', 'Campaign Strategy', 'Content Strategy', 'Digital Marketing Strategy', 'Lead Generation Strategy']
  },
  {
    key: 'pillar_8_enablement_execution',
    name: 'Pillar 8: Enablement & Execution',
    purpose: 'Convert strategy into execution readiness.',
    keyQuestions: [
      'Do reps have sales playbooks and enablement plans?',
      'What ready-to-use sales pitches do we deploy?',
      'What is our training and operational readiness program?'
    ],
    outputs: ['Shared vision', 'Sales Playbooks', 'Enablement Plans', 'Training Programs', 'Ready-to-use sales pitches', 'Execution Frameworks', 'Operational Readiness']
  },
  {
    key: 'pillar_9_metrics_feedback',
    name: 'Pillar 9: Metrics & Feedback Loop',
    purpose: 'Measure, monitor, and continuously improve GTM performance.',
    keyQuestions: [
      'What leading and lagging KPIs measure success?',
      'How are feedback loops integrated to improve performance?',
      'What is our continuous improvement framework?'
    ],
    outputs: ['Success Metrics', 'KPI Framework', 'Leading Indicators', 'Lagging Indicators', 'Feedback Loops', 'Continuous Improvement Framework']
  }
];

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeProjectId(id: string): string {
  if (id === 'proj-revos-core') {
    return '00000000-0000-0000-0000-000000000001';
  }
  if (!UUID_REGEX.test(id)) {
    return generateUUID();
  }
  return id;
}

interface AutoResizingTextareaProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

function AutoResizingTextarea({
  value,
  onChange,
  className = '',
  placeholder = ''
}: AutoResizingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      rows={1}
      className={`overflow-hidden resize-none ${className}`}
      placeholder={placeholder}
      style={{ height: 'auto', display: 'block', overflowY: 'hidden' }}
    />
  );
}

const invokeGtmApi = async (action: string, payload: Record<string, any> = {}) => {
  if (!supabase) throw new Error("Supabase client is not initialized.");

  const { data, error } = await supabase.functions.invoke('gtmos-api', {
    body: { action, ...payload }
  });

  if (error) {
    console.error(`Supabase edge function error for action '${action}':`, error);
    throw error;
  }
  return data;
};

export function GTMOSModule() {
  const { profile, org } = useRevOS();

  // Selected state
  const [projectsList, setProjectsList] = useState<GTMOSProject[]>(SEED_PROJECTS);
  const [currentProjectId, setCurrentProjectId] = useState<string>('00000000-0000-0000-0000-000000000001');

  // Isolates local cache key per logged-in user to prevent multi-account profile mixing in the browser
  const getCacheKey = () => {
    return profile?.id ? `revos_gtmos_projects_${profile.id}` : 'revos_gtmos_projects_guest';
  };
  
  // Terminal log lines for Step 10
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isReasoning, setIsReasoning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isGeneratingPillars, setIsGeneratingPillars] = useState<boolean>(false);
  const [isGeneratingExecutionPlan, setIsGeneratingExecutionPlan] = useState<boolean>(false);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('Local Cache Buffer');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'dirty'>('idle');

  // Stepper container scrolling reference
  const stepperContainerRef = useRef<HTMLDivElement>(null);

  // Step 11: Go-to-Market Strategy Draft States
  const [selectedDraftPillar, setSelectedDraftPillar] = useState<string>('pillar_1_market_segmentation');
  const [newDraftItemText, setNewDraftItemText] = useState<string>('');
  const [selectedAddPrefix, setSelectedAddPrefix] = useState<string>('');
  const [isGeneratingGtmDraft, setIsGeneratingGtmDraft] = useState<boolean>(false);

  // Step 11 Pitch Playground States
  const [playgroundBuyerType, setPlaygroundBuyerType] = useState<string>('economic_buyer');
  const [playgroundFormat, setPlaygroundFormat] = useState<string>('elevator_pitch');
  const [isGeneratingPlaygroundPitch, setIsGeneratingPlaygroundPitch] = useState<boolean>(false);
  const [generatedPlaygroundResult, setGeneratedPlaygroundResult] = useState<{
    pitch: string;
    keyPoints: string[];
    conversationalOpener: string;
  } | null>(null);
  const [pitchSuccessMsg, setPitchSuccessMsg] = useState<string>('');

  // Step 12 GTM Strategy Canvas States
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState<boolean>(false);
  const [canvasSuccessMsg, setCanvasSuccessMsg] = useState<string>('');

  // Interactive addition form for Step 1
  const [showNewProjDialog, setShowNewProjDialog] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSegment, setNewProjSegment] = useState('');
  const [newProjObj, setNewProjObj] = useState('');

  // Loaded project reference helper
  const currentProject = projectsList.find(p => p.id === currentProjectId) || projectsList[0];

  // Auto-scroll selected step into visual center of the timeline stepper
  useEffect(() => {
    const container = stepperContainerRef.current;
    const activeBtn = document.getElementById(`gtm-step-btn-${activeStep}`);
    if (container && activeBtn) {
      const containerWidth = container.clientWidth;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.clientWidth;
      container.scrollTo({
        left: btnLeft - (containerWidth / 2) + (btnWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [activeStep]);

  // Load from Supabase on init with robust Local Storage backup
  useEffect(() => {
    async function loadDatabaseState() {
      setIsSyncingDb(true);
      const cacheKey = getCacheKey();
      
      // Step 1: Pre-populate from Local Storage for near-instant offline load
      let localCache: GTMOSProject[] | null = null;
      try {
        const localBackup = localStorage.getItem(cacheKey);
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          if (parsed && parsed.length > 0) {
            localCache = parsed.map((p: any) => ({
              ...p,
              id: sanitizeProjectId(p.id)
            }));
          }
        }
      } catch (e) {
        console.warn('Could not parse local backup:', e);
      }

      if (localCache) {
        setProjectsList(localCache);
        setCurrentProjectId(localCache[0].id);
        setActiveStep(localCache[0].currentStep || 1);
        localStorage.setItem(cacheKey, JSON.stringify(localCache));
        setDbStatusMsg('Restored from Local Cache');
      }

      if (!supabase) {
        setIsSyncingDb(false);
        return;
      }

      try {
        // Multi-tenant Security Check: Enforce user's creator_id filter so users only see their own strategies
        let query = supabase.from('revos_gtmos_strategies').select('*');
        if (profile?.id) {
          query = query.eq('creator_id', profile.id);
        } else {
          // If Guest or Profile not loaded yet, only fetch guest strategies
          query = query.is('creator_id', null);
        }
        
        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          // Parse loaded rows to state
          const formattedProjects: GTMOSProject[] = data.map((row: any) => {
            const raw = row.raw_input || {};
            const intel = row.structured_intelligence || {};
            return {
              id: row.id,
              title: row.title || 'Untitled Sandbox GTM',
              market_segment: row.market_segment || 'General B2B',
              strategic_objective: row.strategic_objective || 'Scale pipeline ARR',
              currentStep: raw.currentStep || 1,
              onboarding: raw.onboarding || INITIAL_ONBOARDING_FIELDS,
              aiReasoning: intel.aiReasoning || null,
              aiVulnerabilities: intel.aiVulnerabilities || [],
              readinessScore: intel.readinessScore || 70,
              pillars: intel.pillars || null,
              tasks: raw.tasks || [],
              simulationData: raw.simulationData || null,
              simulationConfig: raw.simulationConfig || {
                marketingBudget: 15000,
                pricingMultiplier: 1.0,
                salesCycleSpeed: 1.0,
                conversionRate: 2.2,
                primaryGTMPath: 'hybrid'
              },
              risks: intel.risks || [],
              recommendations: intel.recommendations || [],
              gtmStrategyDraft: raw.gtmStrategyDraft || null,
              gtmCanvas: raw.gtmCanvas || null,
              gtmExecutionPlan: raw.gtmExecutionPlan || null,
              archivedExecutionPlan: raw.archivedExecutionPlan || null,
              revenueDecomposition: raw.revenueDecomposition || null
            };
          });

          setProjectsList(formattedProjects);
          const currentValid = formattedProjects.find(p => p.id === currentProjectId) || formattedProjects[0];
          setCurrentProjectId(currentValid.id);
          setActiveStep(currentValid.currentStep || 1);
          localStorage.setItem(cacheKey, JSON.stringify(formattedProjects));
          setDbStatusMsg('Connected with Supabase Cloud');
        } else {
          // No remote rows found. If we had local cache, upload them to Supabase to transition to SaaS
          if (localCache && localCache.length > 0) {
            setDbStatusMsg('Uploading Local Cache to SaaS...');
            const uploadedList: GTMOSProject[] = [];
            for (const proj of localCache) {
              // Ensure we replace any shared seed UUID to prevent global primary key collision
              const targetId = proj.id === '00000000-0000-0000-0000-000000000001' ? generateUUID() : proj.id;
              const freshProj = { ...proj, id: targetId };
              uploadedList.push(freshProj);

              await supabase
                .from('revos_gtmos_strategies')
                .upsert({
                  id: targetId,
                  org_id: org?.id || null,
                  creator_id: profile?.id || null,
                  title: freshProj.title,
                  market_segment: freshProj.market_segment,
                  strategic_objective: freshProj.strategic_objective,
                  raw_input: {
                    currentStep: freshProj.currentStep,
                    onboarding: freshProj.onboarding,
                    tasks: freshProj.tasks,
                    simulationConfig: freshProj.simulationConfig,
                    gtmStrategyDraft: freshProj.gtmStrategyDraft || null,
                    gtmCanvas: freshProj.gtmCanvas || null,
                    gtmExecutionPlan: freshProj.gtmExecutionPlan || null,
                    archivedExecutionPlan: freshProj.archivedExecutionPlan || null
                  },
                  structured_intelligence: {
                    aiReasoning: freshProj.aiReasoning,
                    aiVulnerabilities: freshProj.aiVulnerabilities,
                    readinessScore: freshProj.readinessScore,
                    pillars: freshProj.pillars,
                    risks: freshProj.risks,
                    recommendations: freshProj.recommendations
                  }
                });
            }
            setProjectsList(uploadedList);
            setCurrentProjectId(uploadedList[0].id);
            setActiveStep(uploadedList[0].currentStep || 1);
            localStorage.setItem(cacheKey, JSON.stringify(uploadedList));
            setDbStatusMsg('Synced with Supabase Cloud');
          } else {
            // No local cache, initialize our seed project with a unique, secure UUID per user
            const seedId = generateUUID();
            const seed = {
              ...SEED_PROJECTS[0],
              id: seedId
            };
            const { error: insertErr } = await supabase
              .from('revos_gtmos_strategies')
              .insert({
                id: seed.id,
                org_id: org?.id || null,
                creator_id: profile?.id || null,
                title: seed.title,
                market_segment: seed.market_segment,
                strategic_objective: seed.strategic_objective,
                raw_input: {
                  currentStep: seed.currentStep,
                  onboarding: seed.onboarding,
                  tasks: seed.tasks,
                  simulationConfig: seed.simulationConfig,
                  gtmStrategyDraft: seed.gtmStrategyDraft || null,
                  gtmCanvas: seed.gtmCanvas || null,
                  gtmExecutionPlan: seed.gtmExecutionPlan || null,
                  archivedExecutionPlan: seed.archivedExecutionPlan || null
                },
                structured_intelligence: {
                  aiReasoning: seed.aiReasoning,
                  aiVulnerabilities: seed.aiVulnerabilities,
                  readinessScore: seed.readinessScore,
                  pillars: seed.pillars,
                  risks: seed.risks,
                  recommendations: seed.recommendations
                }
              });
            if (!insertErr) {
              const list = [seed];
              setProjectsList(list);
              setCurrentProjectId(seed.id);
              setActiveStep(seed.currentStep || 1);
              localStorage.setItem(cacheKey, JSON.stringify(list));
              setDbStatusMsg('Synced Seed with Supabase');
            }
          }
        }
      } catch (err: any) {
        console.error('Database Sync Issue:', err);
        setDbStatusMsg('Supabase Sandbox (RLS Enabled)');
      } finally {
        setIsSyncingDb(false);
      }
    }
    loadDatabaseState();
  }, [profile, org]);

  // Sync back to database helper on mutations
  const syncWithCloud = async (updatedProjects: GTMOSProject[], targetProjId: string) => {
    setProjectsList(updatedProjects);
    const cacheKey = getCacheKey();
    // Persist immediately in Local Storage for maximum reliability
    try {
      localStorage.setItem(cacheKey, JSON.stringify(updatedProjects));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    const target = updatedProjects.find(p => p.id === targetProjId);
    if (!target) return;

    if (!supabase) return;
    try {
      setDbStatusMsg('Synchronizing to Cloud...');
      const { error } = await supabase
        .from('revos_gtmos_strategies')
        .upsert({
          id: target.id,
          org_id: org?.id || null,
          creator_id: profile?.id || null,
          title: target.title,
          market_segment: target.market_segment,
          strategic_objective: target.strategic_objective,
          raw_input: {
            currentStep: target.currentStep,
            onboarding: target.onboarding,
            tasks: target.tasks,
            simulationConfig: target.simulationConfig,
            gtmStrategyDraft: target.gtmStrategyDraft || null,
            gtmCanvas: target.gtmCanvas || null,
            gtmExecutionPlan: target.gtmExecutionPlan || null,
            archivedExecutionPlan: target.archivedExecutionPlan || null,
            revenueDecomposition: target.revenueDecomposition || null
          },
          structured_intelligence: {
            aiReasoning: target.aiReasoning,
            aiVulnerabilities: target.aiVulnerabilities,
            readinessScore: target.readinessScore,
            pillars: target.pillars,
            risks: target.risks,
            recommendations: target.recommendations
          }
        });
      if (error) throw error;
      setDbStatusMsg('State Locked into Supabase Cloud');
    } catch (err: any) {
      console.error('Trigger sync error:', err);
      setDbStatusMsg('Saved locally (Offline)');
      throw err;
    }
  };

  const refreshProjectFromCloud = async () => {
    if (!supabase) return;
    try {
      setDbStatusMsg('Polling Live Cloud State...');
      const { data, error } = await supabase
        .from('revos_gtmos_strategies')
        .select('*')
        .eq('id', currentProjectId)
        .eq('creator_id', profile?.id || '')
        .single();

      if (error) throw error;
      if (data) {
        const raw = data.raw_input || {};
        const intel = data.structured_intelligence || {};
        
        const updatedProject: GTMOSProject = {
          id: data.id,
          title: data.title || 'Untitled Sandbox GTM',
          market_segment: data.market_segment || 'General B2B',
          strategic_objective: data.strategic_objective || 'Scale pipeline ARR',
          currentStep: raw.currentStep || activeStep,
          onboarding: raw.onboarding || INITIAL_ONBOARDING_FIELDS,
          aiReasoning: intel.aiReasoning || null,
          aiVulnerabilities: intel.aiVulnerabilities || [],
          readinessScore: intel.readinessScore || 70,
          pillars: intel.pillars || null,
          tasks: raw.tasks || [],
          simulationData: raw.simulationData || null,
          simulationConfig: raw.simulationConfig || currentProject.simulationConfig,
          risks: intel.risks || [],
          recommendations: intel.recommendations || [],
          gtmStrategyDraft: raw.gtmStrategyDraft || null,
          gtmCanvas: raw.gtmCanvas || null,
          gtmExecutionPlan: raw.gtmExecutionPlan || null,
          archivedExecutionPlan: raw.archivedExecutionPlan || null,
          revenueDecomposition: raw.revenueDecomposition || null
        };

        const nextList = projectsList.map(p => p.id === currentProjectId ? updatedProject : p);
        setProjectsList(nextList);
        localStorage.setItem(getCacheKey(), JSON.stringify(nextList));
        setDbStatusMsg('Cloud State Integrated');
      }
    } catch (err) {
      console.error('Failed to sync-fetch from cloud:', err);
      setDbStatusMsg('Cloud Polling Error');
      throw err;
    }
  };

  // Set step state on tick
  const handleStepChange = (step: number) => {
    setActiveStep(step);
    const nextList = projectsList.map(p => (p.id === currentProjectId ? { ...p, currentStep: step } : p));
    syncWithCloud(nextList, currentProjectId);
  };

  // Step 1: Create Custom Project Strategic Registry
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;

    const newProjId = generateUUID();
    const fresh: GTMOSProject = {
      id: newProjId,
      title: newProjTitle,
      market_segment: newProjSegment || 'Enterprise SaaS',
      strategic_objective: newProjObj || 'Grow pipeline volume',
      currentStep: 1,
      onboarding: {
        ...EMPTY_ONBOARDING_FIELDS,
        companyName: newProjTitle,
        industry: newProjSegment || 'Enterprise SaaS'
      },
      aiReasoning: null,
      aiVulnerabilities: [],
      readinessScore: 60,
      pillars: null,
      tasks: [],
      simulationData: null,
      simulationConfig: {
        marketingBudget: 15000,
        pricingMultiplier: 1.0,
        salesCycleSpeed: 1.0,
        conversionRate: 2.2,
        primaryGTMPath: 'hybrid'
      },
      risks: [],
      recommendations: []
    };

    const nextProjects = [...projectsList, fresh];
    setProjectsList(nextProjects);
    setCurrentProjectId(newProjId);
    setActiveStep(1);
    setShowNewProjDialog(false);
    setNewProjTitle('');
    setNewProjSegment('');
    setNewProjObj('');

    // Upsert to DB
    await syncWithCloud(nextProjects, newProjId);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectsList.length <= 1) return; // keep at least one

    const next = projectsList.filter(p => p.id !== id);
    setProjectsList(next);
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(next));
    } catch (err) {
      console.warn(err);
    }
    
    if (currentProjectId === id) {
      setCurrentProjectId(next[0].id);
      setActiveStep(next[0].currentStep || 1);
    }

    if (supabase) {
      try {
        await supabase.from('revos_gtmos_strategies').delete().eq('id', id).eq('creator_id', profile?.id || '');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Questionnaire mutators (Steps 2 - 9)
  // Saved inside state and LocalStorage for high-performance responsive typing, and persisted to Supabase upon clicking Save Changes/Next Step
  const handleOnboardingChange = (field: keyof OnboardingCategoryFields, val: string) => {
    const updated = {
      ...currentProject.onboarding,
      [field]: val
    };
    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return { ...p, onboarding: updated };
      }
      return p;
    });
    setProjectsList(nextList);
    setSaveState('dirty');
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(nextList));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleOnboardingSaveBatch = (fields: Partial<OnboardingCategoryFields>) => {
    const updated = {
      ...currentProject.onboarding,
      ...fields
    };
    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return { ...p, onboarding: updated };
      }
      return p;
    });
    setProjectsList(nextList);
    setSaveState('dirty');
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(nextList));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveClickGlobal = async () => {
    setSaveState('saving');
    try {
      // Formally commit everything to Supabase Database
      await syncWithCloud(projectsList, currentProjectId);
      setSaveState('saved');
    } catch (err: any) {
      console.error('Failed to sync to Supabase:', err);
      // Still saved in local storage, but flag database RLS warning
      setSaveState('saved'); // Allow clean UI completion
    }
    setTimeout(() => {
      setSaveState(prev => prev === 'saved' ? 'idle' : prev);
    }, 4000);
  };

  const handleSaveAndContinueGlobal = async () => {
    setSaveState('saving');
    try {
      // Formally commit everything to Supabase Database
      await syncWithCloud(projectsList, currentProjectId);
      setSaveState('saved');
      setTimeout(() => {
        handleStepChange(activeStep + 1);
        setSaveState('idle');
      }, 300);
    } catch (err: any) {
      console.error('Failed to sync to Supabase:', err);
      setSaveState('saved'); // Allow clean UI completion
      setTimeout(() => {
        handleStepChange(activeStep + 1);
        setSaveState('idle');
      }, 300);
    }
  };

  // Step 11 Draft Strategy Mutators & Generators
  const runGtmDraftGeneration = async () => {
    setIsGeneratingGtmDraft(true);
    try {
      const data = await invokeGtmApi('generate-gtm-draft', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title
      });

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            gtmStrategyDraft: data,
            currentStep: 11
          };
        }
        return p;
      });

      await syncWithCloud(nextList, currentProjectId);
      setActiveStep(11);
    } catch (err) {
      console.error('GTM Draft generation error, applying fallback:', err);
      const fallback = {
        pillar_1_market_segmentation: [
          `Market Segments: B2B Enterprise Software environments within ${currentProject.onboarding.targetIndustries || 'high-growth SaaS and enterprise tech'} sectors.`,
          `Segment Prioritization: Prioritized targeting of ${currentProject.onboarding.customerSizes || '100 - 500 employee companies'} showing high immediate need.`,
          `Market Opportunity Analysis: Address total addressable market with SAM targets matching projected size of ${currentProject.onboarding.marketSize || '$2.4B ARR'}.`,
          `Target Market Selection: Launch initial outreach in key regions including ${currentProject.onboarding.targetGeographies || 'North America and global corridors'}.`
        ],
        pillar_2_icp: [
          `Company Size: Primary focus is ${currentProject.onboarding.customerSizes || '100 - 500 employee organizations'}.`,
          `Industry: Tailored specifically to companies within the ${currentProject.onboarding.customerIndustries || 'specialized modern SaaS industries'} sector.`,
          `Geography: Priority targeting in the main territories of ${currentProject.onboarding.targetGeographies || 'North America and global corridors'}.`,
          `Buying Triggers: Monitor specific events such as: ${currentProject.onboarding.buyingTriggers || 'key technical system upgrades, quarterly performance misses, or leadership changes'}.`,
          `Budget Characteristics: Average targeted corporate budget profile mapped to optimal procurement limits.`,
          `Decision Structure: Map decision structure requirements to support cross-functional operational sign-off: ${currentProject.onboarding.decisionMakingStructure || 'multi-threaded review and verification pilot activation'}.`
        ],
        pillar_3_buyer_personas: [
          `Economic Buyers: Direct targeting to key economic stakeholders: ${currentProject.onboarding.typicalBuyers || 'CROs, VPs of Sales Operations, and CFOs'}.`,
          `Technical Buyers: Dedicated technical evaluation leaders seeking robust system architecture integration.`,
          `Business Buyers: Revenue leaders focused on quick performance wins and time-to-value indicators.`,
          `Influencers: Commercial operation and sales management squads who want higher productivity.`,
          `Pain Points: Countering critical pain points: ${currentProject.onboarding.painPoints || 'pipeline unpredictability, manual data entry friction, and sales rep onboarding latency'}.`,
          `Success Metrics: Aligning with the major operational priority: ${currentProject.onboarding.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`
        ],
        pillar_4_value_proposition: [
          `Customer Value: Translate product capabilities into concrete value as a leading ${currentProject.onboarding.productCategory || 'L2 Revenue Decision layer'}.`,
          `Business Outcomes: Directly align sales execution with the overarching business goal: ${currentProject.onboarding.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`,
          `Differentiation: Enable key benefit solutions: ${currentProject.onboarding.keyBenefits || 'reduced deal leakage, instant pipeline telemetry, and high forecast predictability'}.`,
          `Competitive Advantages: Establish strong advantages over competitors like ${currentProject.onboarding.competitorList || 'BI dashboard developers'}: ${currentProject.onboarding.uniqueDifferentiators || 'native active strategic enforcement right inside CRMs'}.`,
          `ROI Statements: Direct reduction of sales leakage to secure rapid payback timelines.`
        ],
        pillar_5_messaging_positioning: [
          `Positioning Statement: Differentiated GTM positioning statement focused on driving ${currentProject.onboarding.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`,
          `Core Messaging: Deliver high impact messaging focused on solving critical pain points: ${currentProject.onboarding.painPoints || 'pipeline unpredictability, manual data entry friction, and sales rep onboarding latency'}.`,
          `Persona Messaging: Custom commercial value stories highlighting native active enforcement right inside CRMs.`,
          `Competitive Messaging: Explicitly benchmarked advantages over traditional alternatives like ${currentProject.onboarding.competitorList || 'BI dashboard developers'}.`,
          `Outcome-Based Messaging: Quantified outcome projection: reduce pipeline data leaks by 30% or trim sales rep onboarding velocity by 15 days.`
        ],
        pillar_6_sales_channel: [
          `Direct Sales Strategy: Optimize the direct model using ${currentProject.onboarding.currentSalesMotion || 'direct enterprise sales outreach reps'} for customer acquisition.`,
          `Partner Strategy: Utilize existing partner avenues such as: ${currentProject.onboarding.existingPartners || 'consultancy networks, systems integrators, and software app stores'}.`,
          `Distributor Strategy: Leverage digital application hubs and marketplaces.`,
          `Digital Strategy: Build strong online search and discovery models linked to targeted demand campaigns.`,
          `Hybrid Revenue Motion: Coordinate PLS trials with direct corporate enterprise outreach loops.`
        ],
        pillar_7_marketing_demand: [
          `Demand Generation Programs: Build campaigns using current activities: ${currentProject.onboarding.currentMarketingActivities || 'SEO whitepapers, quantitative benchmarking surveys, and webinars'}.`,
          `Campaign Strategy: Highly targeted campaign structures directed at decisionmakers in ${currentProject.onboarding.customerIndustries || 'specialized modern SaaS industries'}.`,
          `Content Strategy: Produce targeted audit checklists and benchmarking reports.`,
          `Digital Marketing Strategy: Coordinate paid and organic social outreach targeting hiring signals and technical updates.`,
          `Lead Generation Strategy: Run lead generation processes designed to secure custom targets: ${currentProject.onboarding.customerAcquisitionGoal || '100 active logos within 18 months'}.`
        ],
        pillar_8_enablement_execution: [
          `Shared vision: Align all teams under a unified GTM operating system.`,
          `Sales Playbooks: Deploy playbooks for the commercial sales team of ${currentProject.onboarding.salesTeamSize || '15+ reps'}.`,
          `Enablement Plans: Distribute value sheets and financial justification templates.`,
          `Training Programs: Formulate regular process checks aligned with CRM workflows.`,
          `Ready-to-use sales pitches: Standardized sales pitches demonstrating instant CRM leakage analytics in 5 minutes.`,
          `Execution Frameworks: Standardised deal verification sequences integrated into CRM workflows.`,
          `Operational Readiness: Align training modules with typical software stack tools: ${currentProject.onboarding.CRMPlatform || 'Salesforce/HubSpot'} paired with GTMOS dashboards.`
        ],
        pillar_9_metrics_feedback: [
          `Success Metrics: Meet strict target outcome metrics of ${currentProject.onboarding.ARR || '$24,000,000 ending ARR run rate'}.`,
          `KPI Framework: Monitor close-win conversion rates targeting at least: ${currentProject.onboarding.winRate || '22% opportunity-won level'}.`,
          `Leading Indicators: Monitor weekly pipeline health rating and CRM process adherence metrics.`,
          `Lagging Indicators: Mapped directly onto customer retention indexes: ${currentProject.onboarding.customerRetention || '95% customer gross retention targets'}.`,
          `Feedback Loops: Structured quarterly review checks connecting strategic outputs with onboarding results.`,
          `Continuous Improvement Framework: Iterative optimization of active enforcement rules based on actual win-loss trends.`
        ]
      };

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            gtmStrategyDraft: fallback,
            currentStep: 11
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
      setActiveStep(11);
    } finally {
      setIsGeneratingGtmDraft(false);
    }
  };

  const handleUpdateDraftItem = (pillarKey: string, index: number, newText: string) => {
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft[pillarKey]) draft[pillarKey] = [];
    draft[pillarKey][index] = newText;

    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          gtmStrategyDraft: draft
        };
      }
      return p;
    });
    setProjectsList(nextList);
    setSaveState('dirty');
  };

  const handleDeleteDraftItem = (pillarKey: string, index: number) => {
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft[pillarKey]) draft[pillarKey] = [];
    draft[pillarKey] = draft[pillarKey].filter((_, idx) => idx !== index);

    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          gtmStrategyDraft: draft
        };
      }
      return p;
    });
    setProjectsList(nextList);
    setSaveState('dirty');
  };

  const handleAddDraftItem = (pillarKey: string) => {
    if (!newDraftItemText.trim()) return;
    const prefixString = selectedAddPrefix ? `${selectedAddPrefix}: ` : '';
    const fullText = prefixString + newDraftItemText.trim();

    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft[pillarKey]) draft[pillarKey] = [];
    draft[pillarKey] = [...draft[pillarKey], fullText];

    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          gtmStrategyDraft: draft
        };
      }
      return p;
    });
    setProjectsList(nextList);
    setNewDraftItemText('');
    setSelectedAddPrefix(''); // Reset prefix after successful addition
    setSaveState('dirty');
  };

  const handleRegeneratePlaygroundPitch = async () => {
    setIsGeneratingPlaygroundPitch(true);
    setPitchSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-pitch', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        buyerType: playgroundBuyerType,
        pitchFormat: playgroundFormat
      });
      if (data) {
        setGeneratedPlaygroundResult(data);
      }
    } catch (err) {
      console.error('Failed to generate sales pitch:', err);
    } finally {
      setIsGeneratingPlaygroundPitch(false);
    }
  };

  const handleApplyPlaygroundPitch = () => {
    if (!generatedPlaygroundResult?.pitch) return;
    const bulletText = `Ready-to-use sales pitches: ${generatedPlaygroundResult.pitch}`;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft.pillar_8_enablement_execution) draft.pillar_8_enablement_execution = [];
    
    const idx = draft.pillar_8_enablement_execution.findIndex(item => item.startsWith('Ready-to-use sales pitches:'));
    if (idx !== -1) {
      draft.pillar_8_enablement_execution[idx] = bulletText;
    } else {
      draft.pillar_8_enablement_execution.push(bulletText);
    }

    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          gtmStrategyDraft: draft
        };
      }
      return p;
    });
    setProjectsList(nextList);
    setSaveState('dirty');
    setPitchSuccessMsg('Pitch successfully integrated into Pillar 8 draft strategy lines above!');
    setTimeout(() => setPitchSuccessMsg(''), 5000);
  };

  const handleGenerateStrategyCanvas = async () => {
    setIsGeneratingCanvas(true);
    setCanvasSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-canvas', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        gtmStrategyDraft: currentProject.gtmStrategyDraft
      });
      if (data) {
        const nextList = projectsList.map(p => {
          if (p.id === currentProjectId) {
            return {
              ...p,
              gtmCanvas: data
            };
          }
          return p;
        });
        setProjectsList(nextList);
        await syncWithCloud(nextList, currentProjectId);
        setCanvasSuccessMsg('Strategy Canvas successfully synthesized and saved!');
        setTimeout(() => setCanvasSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Failed to generate Strategy Canvas:', err);
    } finally {
      setIsGeneratingCanvas(false);
    }
  };

  const handleSaveDraftStrategyGlobal = async () => {
    setSaveState('saving');
    try {
      await syncWithCloud(projectsList, currentProjectId);
      setSaveState('saved');
    } catch (err) {
      console.error(err);
      setSaveState('saved');
    }
    setTimeout(() => {
      setSaveState(prev => prev === 'saved' ? 'idle' : prev);
    }, 4000);
  };

  // Step 10: AI Multi-Agent Strategic Reasoning trigger
  const runStrategicReasoning = async () => {
    setIsReasoning(true);
    setConsoleLogs([]);

    const logPhrases = [
      '[L1 Indexer] Loading Category onboarding fields (Categories 1-8)...',
      '[Parser] Sanitizing ARR run rates & target metrics...',
      '[Model Engine] Initiating connection into RevOS Reasoning Cluster...',
      '[L2 Reasoner] Analyzing target buyer CRO & VP of RevOps friction limits...',
      '[Constraint Master] Evaluating competitive defensive patents...',
      '[Compiler] Consolidating pipeline risk parameters...',
      '[Success] AI multi-agent alignment audit constructed!'
    ];

    // Stream logs for immersion
    for (let i = 0; i < logPhrases.length; i++) {
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logPhrases[i]}`]);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    try {
      const data = await invokeGtmApi('reason', {
        onboardingData: currentProject.onboarding
      });

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            aiReasoning: data.analysis || 'Strategic analysis completed satisfactorily.',
            aiVulnerabilities: data.vulnerabilities || [],
            readinessScore: data.readinessScore || 75
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [...prev, `[ERROR] AI Reasoning module failed: ${err.message}`]);
    } finally {
      setIsReasoning(false);
    }
  };

  // Step 11: AI GTM Strategy Generation
  const runStrategyGeneration = async () => {
    setIsGeneratingPillars(true);
    try {
      const data = await invokeGtmApi('generate-strategy', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title
      });

      const generatedPillars = data.pillars || DEFAULT_PILLARS;

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            pillars: generatedPillars
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
    } catch (err: any) {
      console.error(err);
      // Fallback to defaults
      const nextList = projectsList.map(p => (p.id === currentProjectId ? { ...p, pillars: DEFAULT_PILLARS } : p));
      await syncWithCloud(nextList, currentProjectId);
    } finally {
      setIsGeneratingPillars(false);
    }
  };

  // Step 14: Simulation Configuration mutators
  const handleSimulationConfigChange = (fields: Partial<GTMOSSimulationState>) => {
    const updated = {
      ...currentProject.simulationConfig,
      ...fields
    };
    const nextList = projectsList.map(p => (p.id === currentProjectId ? { ...p, simulationConfig: updated } : p));
    syncWithCloud(nextList, currentProjectId);
  };

  // Step 15: Save Refined Pillars
  const handleSavePillars = (updatedPillars: Record<string, StrategyPillar>) => {
    const nextList = projectsList.map(p => (p.id === currentProjectId ? { ...p, pillars: updatedPillars } : p));
    syncWithCloud(nextList, currentProjectId);
  };

  // Step 15: GTM Execution Engine Generation & Archive handlers
  const runExecutionEngineGeneration = async () => {
    setIsGeneratingExecutionPlan(true);
    try {
      const planData = await invokeGtmApi('generate-execution-engine', {
        onboardingData: currentProject.onboarding,
        gtmStrategyDraft: currentProject.pillars,
        revenueDecomposition: currentProject.revenueDecomposition?.result,
        projectName: currentProject.title
      });

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            gtmExecutionPlan: planData
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
    } catch (err) {
      console.error("Failed to generate GTM Execution Engine plan:", err);
    } finally {
      setIsGeneratingExecutionPlan(false);
    }
  };

  const handleSaveExecutionPlan = (plan: GTMExecutionPlan) => {
    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          gtmExecutionPlan: plan
        };
      }
      return p;
    });
    syncWithCloud(nextList, currentProjectId);
  };

  const handleArchiveExecutionPlan = (plan: GTMExecutionPlan) => {
    const nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          archivedExecutionPlan: plan
        };
      }
      return p;
    });
    syncWithCloud(nextList, currentProjectId);
  };

  const handleUpdateProjectArchivedPlan = (projectId: string, plan: GTMExecutionPlan) => {
    const nextList = projectsList.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          archivedExecutionPlan: plan
        };
      }
      return p;
    });
    syncWithCloud(nextList, currentProjectId);
  };

  // Steps 18 - 19: Risk & Recommendations Audit trigger
  const runRiskAudit = async () => {
    try {
      const results = await invokeGtmApi('risks-recommendations', {
        onboardingData: currentProject.onboarding,
        strategyData: currentProject.pillars
      });

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            risks: results.risks || [],
            recommendations: results.recommendations || []
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
    } catch (err) {
      console.error(err);
    }
  };

  // List of active 25 steps
  const workflowSteps = [
    { num: 1, name: 'Workspace Config' },
    { num: 2, name: 'Company Info' },
    { num: 3, name: 'Product Segment' },
    { num: 4, name: 'Business Plan' },
    { num: 5, name: 'Market Info' },
    { num: 6, name: 'Customer base' },
    { num: 7, name: 'Current GTM' },
    { num: 8, name: 'Execution Force' },
    { num: 9, name: 'Metrics Ledger' },
    { num: 10, name: 'AI Reasoning' },
    { num: 11, name: 'GTM Strategy Draft' },
    { num: 12, name: 'GTM Strategy Canvas' },
    { num: 13, name: 'GTM Simulation' },
    { num: 14, name: 'Forecast Sandbox' },
    { num: 15, name: 'Revenue Decomposition' },
    { num: 16, name: 'GTM Execution Engine' },
    { num: 17, name: 'Execution Pipeline' },
    { num: 18, name: 'Execution Dashboard' },
    { num: 19, name: 'Pillar Refiner' },
    { num: 20, name: 'Live Telemetry' },
    { num: 21, name: 'Defense Audit' },
    { num: 22, name: 'Pivotal Actions' },
    { num: 23, name: 'ARR Forecast' }
  ];

  const currentOnboardingCategory = CATEGORY_SPECS.find(c => c.stepNumber === activeStep);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Module Title Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] text-accent uppercase flex items-center gap-1.5 mb-1.5">
            <Cpu className="h-4 w-4 text-accent" />
            Layer 2 Commercial Reasoning Modules
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-sans text-text-primary tracking-tight">GTMOS Operational Engine</h1>
        </div>

        {/* Database Status Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25">
            <div className={`h-1.5 w-1.5 rounded-full ${isSyncingDb ? 'bg-amber-400 animate-spin' : 'bg-[#00F090]'}`} />
            <span className="text-[10px] font-mono font-black text-accent uppercase tracking-widest">{dbStatusMsg}</span>
          </div>
        </div>
      </div>

      {/* Horizontal rolling workflow timeline stepper (Steps 1 to 21) */}
      <div className="p-4 rounded-2xl bg-bg-surface/60 border border-border/80 shadow relative">
        <div className="flex items-center justify-between pointer-events-none mb-3 border-b border-border/40 pb-2">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Unified strategic lifecycle sequence</span>
          <span className="text-xs font-bold text-accent">Active Operational step: {activeStep} / {workflowSteps.length}</span>
        </div>

        {/* Rolling wrapper */}
        <div 
          ref={stepperContainerRef}
          className="overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar-horizontal py-1 pb-3 flex items-center gap-2"
        >
          {workflowSteps.map((s) => {
            const isActive = activeStep === s.num;
            const isFinished = s.num < activeStep;
            
            return (
              <button
                key={s.num}
                id={`gtm-step-btn-${s.num}`}
                onClick={() => handleStepChange(s.num)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 ${
                  isActive
                    ? 'bg-accent border-accent text-black font-black scale-105 shadow-md shadow-accent/15'
                    : isFinished
                    ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/25'
                    : 'bg-bg-primary/50 border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
                }`}
              >
                <span className="font-mono">{s.num}.</span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Workspace container */}
      <div className="min-h-[50vh] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* Step 1: Establish Workspace */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Strategic context select rail */}
                  <div className="md:col-span-1 p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-accent" />
                        GTM Strategy List
                      </h3>
                      <button
                        onClick={() => setShowNewProjDialog(true)}
                        className="p-1.5 rounded-lg bg-accent/15 border border-accent/20 hover:bg-accent hover:text-black hover:border-accent text-accent transition-all"
                        title="Initialize fresh strategy blueprint"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-none pr-1">
                      {projectsList.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setCurrentProjectId(p.id);
                            handleStepChange(p.currentStep || 1);
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                            p.id === currentProjectId
                              ? 'bg-accent/15 border-accent text-accent'
                              : 'bg-bg-primary/60 border-border/80 text-text-secondary hover:border-text-secondary/25'
                          }`}
                        >
                          <h4 className="text-xs font-black leading-snug pr-6 truncate">{p.title}</h4>
                          <span className="text-[9px] font-mono text-text-secondary uppercase block mt-1">{p.market_segment}</span>
                          
                          <button
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            className="absolute right-3 top-3.5 p-1 rounded-lg border border-transparent hover:border-red-500/20 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="Purge strategy row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Strategy config focus sheet */}
                  <div className="md:col-span-2 p-6 rounded-2xl bg-bg-surface/50 border border-border space-y-5 text-left">
                    <div className="border-b border-border pb-3">
                      <span className="text-[9px] font-mono text-accent uppercase tracking-widest block mb-1">Target strategy context</span>
                      <h2 className="text-base font-black text-text-primary leading-tight">{currentProject.title}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Market Segment / Vertical</span>
                        <div className="p-3 bg-bg-primary/60 border border-border/80 text-xs font-bold text-text-primary rounded-xl mt-1">{currentProject.market_segment}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Enterprise strategic Priorities</span>
                        <div className="p-3 bg-bg-primary/60 border border-border/80 text-xs text-text-primary rounded-xl mt-1 truncate">{currentProject.strategic_objective}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2">
                      <Bot className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                      <p className="text-xs leading-normal">
                        Selecting this strategy mounts the respective onboarding variables and compiles all steps. Click <span className="font-bold text-accent">"Primary Onboarding Phase"</span> below to initiate Company onboarding metrics.
                      </p>
                    </div>

                    <button
                      onClick={() => handleStepChange(2)}
                      className="inline-flex items-center gap-1.5 px-6 py-3 bg-accent text-black font-extrabold rounded-2xl text-xs hover:scale-105 transition-all mt-4"
                    >
                      Primary Onboarding Phase
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Create Custom Strategy Modal Drawer popup */}
                {showNewProjDialog && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleCreateProject} className="w-full max-w-md p-6 rounded-3xl bg-bg-surface border border-border space-y-5 text-left animate-in zoom-in-95 duration-200">
                      <div>
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Initialize GTMOS strategic row</h3>
                        <p className="text-[10px] text-text-secondary mt-1">Provide preliminary targets to shape sandbox models.</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Strategy/Core launch Title</label>
                          <input
                            type="text"
                            required
                            value={newProjTitle}
                            onChange={(e) => setNewProjTitle(e.target.value)}
                            placeholder="e.g. RevOS APAC Outbound Growth Plan"
                            className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Primary Target Vertical</label>
                          <input
                            type="text"
                            value={newProjSegment}
                            onChange={(e) => setNewProjSegment(e.target.value)}
                            placeholder="e.g. FinTech Enterprise, Cybersecurity SaaS"
                            className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Priority commercial Objective</label>
                          <input
                            type="text"
                            value={newProjObj}
                            onChange={(e) => setNewProjObj(e.target.value)}
                            placeholder="e.g. Capture $15M cumulative ARR in 2 years"
                            className="w-full bg-bg-primary border border-border/80 focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => setShowNewProjDialog(false)}
                          className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-accent text-black font-bold rounded-xl text-xs hover:scale-105 active:scale-95 transition-all"
                        >
                          Create blueprint
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Steps 2 - 9: Categories Onboarding Guided Checklist */}
            {activeStep >= 2 && activeStep <= 9 && currentOnboardingCategory && (
              <OnboardingForms
                activeCategoryId={currentOnboardingCategory.id}
                onboardingFields={currentProject.onboarding}
                onChange={handleOnboardingChange}
                onSaveBatch={handleOnboardingSaveBatch}
                activeStep={activeStep}
                onStepChange={handleStepChange}
                saveState={saveState}
                setSaveState={setSaveState}
              />
            )}

            {/* Step 10: Multi-Agent Strategic Reasoning */}
            {activeStep === 10 && (
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Trigger Controller panel */}
                  <div className="lg:col-span-1 p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-5">
                    <div className="border-b border-border pb-3">
                      <span className="text-[9px] font-mono text-[#00F090] uppercase font-bold block mb-1">Commercial alignment score</span>
                      <h3 className="font-extrabold text-sm text-text-primary">L2 Strategic Readiness Assessment</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-bg-primary/50 rounded-2xl border border-border relative">
                      <div className="text-[10px] font-mono text-text-secondary uppercase absolute top-4 left-4">Readiness Index</div>
                      <div className="text-4xl sm:text-5xl font-black text-accent mt-4 select-none">
                        {currentProject.readinessScore}%
                      </div>
                      <div className="text-[10px] text-text-secondary/60 uppercase mt-2 font-mono">Normalized GTM parameters</div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">Initiate model audit</span>
                      <button
                        onClick={runStrategicReasoning}
                        disabled={isReasoning}
                        className="w-full py-3 bg-accent text-black font-extrabold text-xs rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/10"
                      >
                        {isReasoning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Execute Alignment Reasoners
                      </button>
                    </div>

                    {currentProject.aiReasoning && (
                      <div className="space-y-2 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                          GTM Strategy Ready
                        </span>
                        <button
                          onClick={runGtmDraftGeneration}
                          disabled={isGeneratingGtmDraft}
                          className="w-full py-3 bg-[#00F090] text-black font-black text-xs rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00F090]/15"
                        >
                          {isGeneratingGtmDraft ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating Strategy...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate GTM Strategy Draft
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Operational Terminal shell logs */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="p-4 rounded-2xl bg-black border border-border/80 font-mono text-xs text-left h-48 overflow-y-auto scrollbar-none space-y-1.5 flex flex-col justify-end">
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className="text-accent/90">{log}</div>
                      ))}
                      {consoleLogs.length === 0 && (
                        <div className="text-text-secondary/40 italic">Terminal active. Click "Execute Alignment Reasoners" to check framework constraints...</div>
                      )}
                    </div>

                    {currentProject.aiReasoning && (
                      <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-4">
                        <h4 className="text-xs font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
                          <Bot className="h-4 w-4 text-accent" />
                          Consolidated Reasoning Outcomes
                        </h4>
                        <div className="max-w-none font-sans text-[11px] text-text-secondary leading-relaxed space-y-2">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-[11px] font-normal text-text-secondary leading-relaxed mb-1.5">{children}</p>,
                              strong: ({ children }) => <strong className="text-[11px] font-bold text-text-secondary">{children}</strong>,
                              b: ({ children }) => <b className="text-[11px] font-bold text-text-secondary">{children}</b>,
                              h1: ({ children }) => <h1 className="text-[11px] font-bold text-text-secondary mt-2 mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-[11px] font-bold text-text-secondary mt-2 mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-[11px] font-bold text-text-secondary mt-2 mb-1">{children}</h3>,
                              h4: ({ children }) => <h4 className="text-[11px] font-bold text-text-secondary mt-2 mb-1">{children}</h4>,
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5 text-[11px] text-text-secondary">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5 text-[11px] text-text-secondary">{children}</ol>,
                              li: ({ children }) => <li className="text-[11px] font-normal text-text-secondary leading-relaxed">{children}</li>,
                            }}
                          >
                            {currentProject.aiReasoning}
                          </ReactMarkdown>
                        </div>

                        {/* Vulnerability alerts lists */}
                        {currentProject.aiVulnerabilities.length > 0 && (
                          <div className="pt-3 border-t border-border/40 space-y-2">
                            <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1.5">
                              <AlertOctagon className="h-3.5 w-3.5" />
                              Critical Vulnerability detections
                            </span>
                            <div className="space-y-1.5">
                              {currentProject.aiVulnerabilities.map((v, i) => (
                                <div key={i} className="text-xs text-text-secondary flex gap-2 items-start bg-red-400/5 p-2 rounded-lg border border-red-500/10">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span className="font-sans text-[11px]">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 11: Go-to-Market Strategy Draft */}
            {activeStep === 11 && (
              <div className="space-y-6 text-left animate-in fade-in duration-300">
                {/* Intro banner */}
                <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#00F090] uppercase block">Continuous Operating Enforcer</span>
                    <h2 className="text-base font-black text-text-primary">Step 11: Go-to-Market Strategy Draft</h2>
                    <p className="text-xs text-text-secondary leading-normal max-w-2xl font-sans">
                      Review and fine-tune your core commercial tactics mapped upon the 9-pillar GTM framework below. You can customize, delete, or append new strategy items for each individual operational lever.
                    </p>
                  </div>
                  
                  {/* Save Draft Button */}
                  <button
                    onClick={handleSaveDraftStrategyGlobal}
                    disabled={saveState === 'saving'}
                    className="px-5 py-2.5 bg-accent hover:bg-accent/95 disabled:bg-accent/40 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
                  >
                    {saveState === 'saving' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving items...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Strategy Draft
                      </>
                    )}
                  </button>
                </div>

                {!currentProject.gtmStrategyDraft ? (
                  /* Prompt to generate strategy if not present */
                  <div className="max-w-md mx-auto space-y-5 p-8 rounded-3xl bg-bg-surface/50 border border-border text-center">
                    <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 w-fit mx-auto">
                      <Sparkles className="h-8 w-8 text-accent animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">GTM Strategy Not Generated</h3>
                      <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                        Generate a comprehensive commercial roadmap matching your onboarding parameters and multi-agent alignment audit.
                      </p>
                    </div>

                    <button
                      onClick={runGtmDraftGeneration}
                      disabled={isGeneratingGtmDraft}
                      className="px-6 py-3.5 bg-accent text-black font-extrabold text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-40"
                    >
                      {isGeneratingGtmDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate GTM Strategy Draft
                    </button>
                  </div>
                ) : (
                  /* Grid view / Sidebar layout */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: List of 9 pillars */}
                    <div className="md:col-span-4 space-y-2">
                      <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest pl-1 mb-2">9 Commercial Pillars</div>
                      {PILLARS_METADATA.map((p) => {
                        const isSelected = selectedDraftPillar === p.key;
                        const itemsCount = currentProject.gtmStrategyDraft?.[p.key]?.length || 0;
                        return (
                          <div
                            key={p.key}
                            onClick={() => setSelectedDraftPillar(p.key)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'bg-accent/10 border-accent text-accent'
                                : 'bg-bg-surface/40 border-border/75 hover:border-text-secondary/20 text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div className="space-y-0.5 truncate">
                              <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                                {p.name}
                              </h4>
                              <p className="text-[10px] text-text-secondary truncate font-sans">{p.purpose}</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg-primary border border-border shrink-0 font-bold group-hover:border-accent/30">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Work desk for the selected pillar */}
                    {(() => {
                      const activeMeta = PILLARS_METADATA.find(p => p.key === selectedDraftPillar)!;
                      const activeItems = currentProject.gtmStrategyDraft?.[selectedDraftPillar] || [];
                      
                      return (
                        <div className="md:col-span-8 p-6 rounded-2xl bg-bg-surface/50 border border-border text-left space-y-6">
                          {/* Workspace info header */}
                          <div className="border-b border-border/80 pb-4 space-y-2">
                            <span className="text-[9px] font-mono font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded-md border border-accent/20">
                              ACTIVE REFINEMENT DESK
                            </span>
                            <h3 className="text-sm font-black text-text-primary uppercase tracking-wider pt-2">
                              {activeMeta.name}
                            </h3>
                            <p className="text-xs text-text-secondary font-sans leading-normal">
                              <strong className="text-text-primary">Purpose: </strong>
                              {activeMeta.purpose}
                            </p>
                          </div>

                          {/* Reference card - Outputs and guidelines */}
                          <div className="p-4 rounded-xl bg-bg-primary/40 border border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] font-mono text-text-secondary uppercase block mb-1.5 font-bold">Strategic Questions</span>
                              <ul className="space-y-1 text-[11px] text-text-secondary font-sans list-disc pl-3 leading-relaxed">
                                {activeMeta.keyQuestions.map((q, idx) => (
                                  <li key={idx}>{q}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <span className="text-[9px] font-mono text-text-secondary uppercase block mb-1.5 font-bold">Commercial Outputs</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeMeta.outputs.map((out, idx) => (
                                  <span key={idx} className="text-[10px] font-mono bg-accent/5 text-accent/90 border border-accent/15 px-2 py-0.5 rounded-md font-bold">
                                    {out}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Interactive list of strategy items */}
                          <div className="space-y-3 pt-2">
                            <div className="text-[10px] font-mono text-text-secondary uppercase tracking-wider pl-1 font-bold">Draft Strategy Lines</div>
                            {activeItems.length === 0 ? (
                              <div className="p-6 text-center text-xs text-text-secondary/40 italic rounded-xl border border-dashed border-border">
                                No strategy lines formulated. Add custom items below or regenerate draft.
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {activeItems.map((item, index) => {
                                  const colonIdx = item.indexOf(': ');
                                  const hasPrefix = colonIdx !== -1;
                                  const prefix = hasPrefix ? item.substring(0, colonIdx) : '';
                                  const body = hasPrefix ? item.substring(colonIdx + 2) : item;

                                  return (
                                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start bg-bg-primary/40 p-3 rounded-xl border border-border group hover:border-accent/25 transition-all w-full">
                                      <div className="flex gap-2 items-center shrink-0">
                                        <span className="text-[10px] font-mono text-accent/60 bg-accent/5 h-6 w-6 rounded-lg flex items-center justify-center border border-accent/10 font-bold">
                                          {index + 1}
                                        </span>
                                        
                                        {hasPrefix && (
                                          <span className="px-2.5 py-0.5 rounded-md bg-[#00F090]/10 border border-[#00F090]/25 text-[#00F090] font-black text-[9px] uppercase tracking-wider font-mono select-none">
                                            {prefix}
                                          </span>
                                        )}
                                      </div>

                                      <AutoResizingTextarea
                                        value={body}
                                        onChange={(newVal) => {
                                          const newValue = hasPrefix ? `${prefix}: ${newVal}` : newVal;
                                          handleUpdateDraftItem(selectedDraftPillar, index, newValue);
                                        }}
                                        className="flex-1 bg-transparent border-none text-xs text-text-primary focus:outline-none focus:ring-0 select-text leading-relaxed font-sans placeholder-text-secondary/30 p-0 w-full min-h-[1.5rem]"
                                        placeholder="Refine strategic item text..."
                                      />

                                      <button
                                        onClick={() => handleDeleteDraftItem(selectedDraftPillar, index)}
                                        className="p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-text-secondary hover:text-red-400 sm:opacity-60 group-hover:opacity-100 transition-all shrink-0 self-start -mt-1"
                                        title="Purge strategy row"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Interactive Cognitive Pitch Playground for Pillar 8 */}
                          {selectedDraftPillar === 'pillar_8_enablement_execution' && (
                            <div className="pt-6 border-t border-border/60 space-y-4">
                              <div className="p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
                                {/* Title block */}
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-5 w-5 text-accent" />
                                  <div>
                                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Cognitive Pitch Playground
                                    </h4>
                                    <p className="text-[11px] text-text-secondary">
                                      Dynamically synthesize buyer-persona-focused pitches grounded directly in your organizational parameters.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Buyer type selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Target Buyer Segment
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {[
                                        { id: 'economic_buyer', label: 'Economic Buyer' },
                                        { id: 'technical_buyer', label: 'Technical Buyer' },
                                        { id: 'business_buyer', label: 'Business Buyer' },
                                        { id: 'influencer', label: 'Influencer' }
                                      ].map((bt) => (
                                        <button
                                          key={bt.id}
                                          type="button"
                                          onClick={() => setPlaygroundBuyerType(bt.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            playgroundBuyerType === bt.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {bt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Format Selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Output Presentation Format
                                    </label>
                                    <div className="flex flex-col gap-1.5">
                                      {[
                                        { id: 'technical_brief', label: 'Technical Brief (Architecture)' },
                                        { id: 'executive_roi', label: 'Executive ROI (Economic Value)' },
                                        { id: 'elevator_pitch', label: 'Elevator Pitch (30-Sec Opener)' }
                                      ].map((f) => (
                                        <button
                                          key={f.id}
                                          type="button"
                                          onClick={() => setPlaygroundFormat(f.id)}
                                          className={`w-full px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-left select-none cursor-pointer ${
                                            playgroundFormat === f.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {playgroundFormat === f.id ? '● ' : '○ '} {f.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                                  <span className="text-[9px] font-mono text-text-secondary/60">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegeneratePlaygroundPitch}
                                    disabled={isGeneratingPlaygroundPitch}
                                    className="px-4.5 py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-105 active:scale-95 transition-all text-accent text-xs font-black rounded-xl select-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingPlaygroundPitch ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Synthesizing Pitch...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-4 w-4" />
                                        Dynamically Regenerate Pitch
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedPlaygroundResult && (
                                  <div className="p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-4.5 text-left transition-all duration-300">
                                    {/* Opener quote box */}
                                    <div className="border-l-2 border-[#00F090]/80 pl-3 space-y-1">
                                      <span className="text-[9px] font-mono text-[#00F090] uppercase tracking-widest font-black block">
                                        SUGGESTED INTRODUCTORY ICEBREAKER
                                      </span>
                                      <p className="text-xs italic text-text-secondary leading-relaxed font-sans">
                                        "{generatedPlaygroundResult.conversationalOpener}"
                                      </p>
                                    </div>

                                    {/* Full pitch copy space */}
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider font-bold block">
                                        PITCH COPY (Ready-to-use)
                                      </span>
                                      <AutoResizingTextarea
                                        value={generatedPlaygroundResult.pitch}
                                        onChange={(newVal) => setGeneratedPlaygroundResult(prev => prev ? { ...prev, pitch: newVal } : null)}
                                        className="w-full bg-bg-surface border border-border/80 hover:border-border focus:border-accent/40 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans"
                                      />
                                    </div>

                                    {/* Key Resonating Points */}
                                    <div className="space-y-1.5">
                                      <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest font-bold block">
                                        WHY THIS RESONATES WITH BUYER
                                      </span>
                                      <ul className="space-y-1 text-[11px] text-text-secondary/90 font-sans list-disc pl-4 leading-relaxed">
                                        {generatedPlaygroundResult.keyPoints.map((kp, i) => (
                                          <li key={i} className="hover:text-text-primary transition-colors">{kp}</li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Integrate controls */}
                                    <div className="pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(generatedPlaygroundResult.pitch);
                                          setPitchSuccessMsg('Copied to clipboard!');
                                          setTimeout(() => setPitchSuccessMsg(''), 3000);
                                        }}
                                        className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer select-none"
                                      >
                                        Copy pure pitch text
                                      </button>
                                      <div className="flex items-center gap-2.5">
                                        {pitchSuccessMsg && (
                                          <span className="text-[11px] text-[#00F090] font-bold animate-pulse">
                                            {pitchSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyPlaygroundPitch}
                                          className="px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-xs font-black rounded-xl transition-all select-none cursor-pointer flex items-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-4 w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Inline adding form */}
                          <div className="pt-2 border-t border-border/40 space-y-2">
                            <div className="text-[10px] font-mono text-text-secondary uppercase tracking-wider pl-1 font-bold">Add Custom Strategy Line</div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={selectedAddPrefix}
                                onChange={(e) => setSelectedAddPrefix(e.target.value)}
                                className="bg-bg-primary border border-border hover:border-border-hover focus:border-accent/40 rounded-xl px-3 py-2.5 text-xs text-text-secondary font-sans focus:outline-none min-w-[180px] shrink-0"
                              >
                                <option value="">(No Output Prefix)</option>
                                {activeMeta.outputs.map((out) => (
                                  <option key={out} value={out}>
                                    {out}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={newDraftItemText}
                                onChange={(e) => setNewDraftItemText(e.target.value)}
                                placeholder={selectedAddPrefix ? `Describe strategic details for "${selectedAddPrefix}"...` : "e.g. Describe strategic action or details..."}
                                className="flex-1 bg-bg-primary border border-border hover:border-border-hover focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddDraftItem(selectedDraftPillar);
                                }}
                              />
                              <button
                                onClick={() => handleAddDraftItem(selectedDraftPillar)}
                                className="px-4 bg-accent/15 border border-accent/25 hover:bg-accent text-accent hover:text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none justify-center py-2.5 sm:py-0"
                              >
                                <Plus className="h-4 w-4" />
                                Add Line
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Step 12: GTM Strategy Canvas */}
            {activeStep === 12 && (
              <div className="space-y-6">
                {/* Header panel with generate / status tools */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-surface/30 border border-border/80 rounded-2xl p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#00F090] uppercase tracking-wider font-bold">
                      <Sparkles className="h-4 w-4 text-[#00F090]" />
                      Model-Synthesized Strategic Frame
                    </div>
                    <h3 className="text-lg font-black text-text-primary">9-Pillar GTM Strategy Canvas</h3>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-2xl font-sans">
                      This canvas shows high-impact condensed executive summaries of each commercial pillar, synthesized by Gemini based on the detailed draft strategic lines finalized and stored in <span className="font-bold text-accent">Step 11: GTM Strategy Draft</span>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={handleGenerateStrategyCanvas}
                      disabled={isGeneratingCanvas}
                      className="px-5 py-3 bg-accent text-black font-extrabold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/5 disabled:opacity-40"
                    >
                      {isGeneratingCanvas ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      {currentProject.gtmCanvas ? 'Update Strategy Canvas' : 'Compile Strategy Canvas'}
                    </button>
                  </div>
                </div>

                {canvasSuccessMsg && (
                  <div className="p-3 bg-accent/5 border border-accent/25 text-xs text-accent rounded-xl animate-in fade-in duration-200 font-sans">
                    {canvasSuccessMsg}
                  </div>
                )}

                {/* If canvas isn't generated yet */}
                {!currentProject.gtmCanvas ? (
                  <div className="max-w-md mx-auto space-y-5 p-8 rounded-3xl bg-bg-surface/50 border border-border text-center my-6">
                    <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 w-fit mx-auto">
                      <Layers className="h-8 w-8 text-accent animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Uncompiled Strategic Canvas</h4>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed font-sans">
                        Ready to synthesize your finalized strategy? Gemini will aggregate and summarize your GTM Strategy Draft input from Step 11 into a complete 9-pillar executive dashboard canvas.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateStrategyCanvas}
                      disabled={isGeneratingCanvas}
                      className="px-6 py-3.5 bg-accent text-black font-extrabold text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-40"
                    >
                      {isGeneratingCanvas ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                      Compile Strategy Canvas
                    </button>
                  </div>
                ) : (
                  /* 3x3 Bento Canvas Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { key: 'pillar_1_market_segmentation', name: 'Pillar 1: Market Segmentation', icon: Layers, color: 'from-blue-500/10 to-transparent' },
                      { key: 'pillar_2_icp', name: 'Pillar 2: Ideal Customer Profile (ICP)', icon: Target, color: 'from-green-500/10 to-transparent' },
                      { key: 'pillar_3_buyer_personas', name: 'Pillar 3: Buyer Personas', icon: Users, color: 'from-purple-500/10 to-transparent' },
                      
                      { key: 'pillar_4_value_proposition', name: 'Pillar 4: Value Proposition', icon: Award, color: 'from-amber-500/10 to-transparent' },
                      { key: 'pillar_5_messaging_positioning', name: 'Pillar 5: Messaging & Positioning', icon: Compass, color: 'from-cyan-500/10 to-transparent' },
                      { key: 'pillar_6_sales_channel', name: 'Pillar 6: Sales & Channel Strategy', icon: Briefcase, color: 'from-emerald-500/10 to-transparent' },
                      
                      { key: 'pillar_7_marketing_demand', name: 'Pillar 7: Marketing & Demand Gen', icon: TrendingUp, color: 'from-orange-500/10 to-transparent' },
                      { key: 'pillar_8_enablement_execution', name: 'Pillar 8: Enablement & Execution', icon: CheckSquare, color: 'from-pink-500/10 to-transparent' },
                      { key: 'pillar_9_metrics_feedback', name: 'Pillar 9: Metrics & Feedback Loop', icon: Activity, color: 'from-indigo-500/10 to-transparent' }
                    ].map((p) => {
                      const IconComp = p.icon;
                      const summaryText = currentProject.gtmCanvas?.[p.key] || "";
                      const hasLinesInDraft = currentProject.gtmStrategyDraft?.[p.key] && currentProject.gtmStrategyDraft[p.key].length > 0;

                      return (
                        <div
                          key={p.key}
                          className="relative overflow-hidden p-6 rounded-2xl bg-bg-surface/40 hover:bg-bg-surface/65 border border-border/80 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all group flex flex-col justify-between min-h-[220px]"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none`} />
                          
                          <div className="relative space-y-4">
                            <div className="flex items-start justify-between pb-3 border-b border-border/30 gap-3">
                              <button
                                onClick={() => {
                                  setActiveStep(11);
                                  setSelectedDraftPillar(p.key);
                                }}
                                className="text-left group/link flex items-center gap-1.5 focus:outline-none cursor-pointer"
                                title="Click to view & edit detailed strategy draft in Step 11"
                              >
                                <span className="text-xs md:text-sm font-sans text-text-primary group-hover/link:text-accent font-black uppercase tracking-wide transition-colors leading-snug">
                                  {p.name}
                                </span>
                                <ArrowUpRight className="h-4 w-4 text-text-secondary group-hover/link:text-accent transition-all transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 shrink-0" />
                              </button>
                              <button
                                onClick={() => {
                                  setActiveStep(11);
                                  setSelectedDraftPillar(p.key);
                                }}
                                className="p-2 rounded-lg bg-bg-primary/50 hover:bg-accent/15 hover:text-accent text-text-secondary border border-border/40 transition-all shrink-0 cursor-pointer"
                                title="Click to view & edit detailed strategy draft in Step 11"
                              >
                                <IconComp className="h-4 w-4 transition-transform hover:scale-110" />
                              </button>
                            </div>

                            {summaryText ? (
                              <p className="text-xs text-text-primary leading-relaxed font-sans font-medium">
                                {summaryText}
                              </p>
                            ) : (
                              <p className="text-xs text-text-secondary/60 italic leading-snug font-sans">
                                Click Compile Strategy Canvas above to summarize the GTM draft details.
                              </p>
                            )}
                          </div>

                          <div className="relative mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[10px] text-text-secondary font-mono">
                            <div>Source: {hasLinesInDraft ? `Step 11 Draft` : `Onboarding Data`}</div>
                            {hasLinesInDraft && (
                              <div className="flex items-center gap-1 text-accent font-bold">
                                <Check className="h-3.5 w-3.5 text-[#00F090]" />
                                Finalized Draft
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 13: GTM Simulation */}
            {activeStep === 13 && (
              <GTMSimulationEngine
                currentProject={currentProject}
                projectsList={projectsList}
                setProjectsList={setProjectsList}
                syncWithCloud={syncWithCloud}
              />
            )}

            {/* Step 14: Forecast Playground Sandbox */}
            {activeStep === 14 && (
              <SimulationTab
                config={currentProject.simulationConfig}
                onChange={handleSimulationConfigChange}
                tabMode="simulation"
                onboardingData={currentProject.onboarding}
                onRefreshProjectFromCloud={refreshProjectFromCloud}
              />
            )}

            {/* Step 15: Revenue Decomposition */}
            {activeStep === 15 && (
              <RevenueDecomposition
                project={currentProject}
                updateProject={(updates) => {
                  const updatedProject = { ...currentProject, ...updates };
                  const nextList = projectsList.map(p => p.id === currentProjectId ? updatedProject : p);
                  syncWithCloud(nextList, currentProjectId);
                }}
                nextStep={() => handleStepChange(16)}
                prevStep={() => handleStepChange(14)}
              />
            )}

            {/* Step 16: GTM Execution Engine */}
            {activeStep === 16 && (
              <GTMExecutionEngine
                project={currentProject}
                onSavePlan={handleSaveExecutionPlan}
                onArchivePlan={handleArchiveExecutionPlan}
                isGenerating={isGeneratingExecutionPlan}
                onGenerate={runExecutionEngineGeneration}
              />
            )}

            {/* Step 17: Execution Pipeline */}
            {activeStep === 17 && (
              <ExecutionPipeline
                projects={projectsList}
                currentProjectId={currentProjectId}
                onUpdateProjectPlan={handleUpdateProjectArchivedPlan}
              />
            )}

            {/* Step 18: Execution Dashboard */}
            {activeStep === 18 && (
              <ExecutionDashboard
                projects={projectsList}
                currentProjectId={currentProjectId}
              />
            )}

            {/* Step 19: Review & Refine Strategic pillars */}
            {activeStep === 19 && (
              <PillarRefiner
                pillars={currentProject.pillars || DEFAULT_PILLARS}
                onSavePillars={handleSavePillars}
              />
            )}

            {/* Step 20: Performance Monitoring & Live telemetry */}
            {activeStep === 20 && (
              <div className="space-y-6 text-left">
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5">
                  <Activity className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs">
                    <span className="font-bold text-accent">Active Telemetry Tracker (Step 20): </span> 
                    Displays live pipeline health ratings calculated by comparing active sales velocities against core operational variables inside onboarding Categories 1-8.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { id: 'arr', name: 'Ending ARR RunRate', val: currentProject.onboarding.ARR || '$24,000,000', icon: TrendingUp },
                    { id: 'pipe', name: 'Total open Pipeline', val: currentProject.onboarding.pipeline || '$72,000,000', icon: Target },
                    { id: 'win', name: 'Close win ratio', val: currentProject.onboarding.winRate || '22%', icon: Award },
                    { id: 'ret', name: 'Net Retention Index', val: currentProject.onboarding.customerRetention || '95%', icon: Heart }
                  ].map(ticker => (
                    <div key={ticker.id} className="p-4 rounded-2xl bg-bg-surface/50 border border-border flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">{ticker.name}</span>
                        <div className="text-base font-black text-text-primary mt-1">{ticker.val}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/25">
                        <ticker.icon className="h-4 w-4 text-accent" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated Telemetry charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Daily Active Pipeline Conversion volume</span>
                    <div className="h-44 bg-bg-primary/50 rounded-xl border border-border/80 flex items-center justify-center p-4">
                      {/* Abstract visual telemetry bars representing metrics */}
                      <div className="flex items-end justify-between w-full h-full gap-2.5 font-mono text-[9px] text-accent">
                        {[45, 62, 55, 78, 69, 82, 90, 88].map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                            <div className="w-full bg-accent/20 border-t border-accent rounded-t" style={{ height: `${v}%` }} />
                            <div className="text-[8px] text-text-secondary mt-1">D{i+1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Customer Satisfaction benchmark tracking</span>
                    <div className="h-44 bg-bg-primary/50 text-center rounded-xl border border-border/80 flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl font-black text-accent">{currentProject.onboarding.customerSatisfaction || '94%'} CSAT</div>
                      <p className="text-[10px] text-text-secondary font-sans max-w-xs mx-auto px-4 leading-normal">Satisfactorily matching our priority targeted contract expansions.</p>
                      <div className="h-1 bg-border/40 w-40 rounded-full overflow-hidden">
                        <div className="bg-[#00F090] h-full" style={{ width: '94%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 21: Risk Detection */}
            {activeStep === 21 && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-accent/5 border border-accent/20 gap-4">
                  <div className="flex gap-2.5 items-start">
                    <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">Operational Risks Detection audit</h4>
                      <p className="text-[11px] text-text-secondary font-sans leading-normal">Analyzes structural discrepancies across GTM channels and highlights mitigations.</p>
                    </div>
                  </div>

                  <button
                    onClick={runRiskAudit}
                    className="px-4 py-2 bg-accent text-black font-extrabold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    Run Risks Detection Audit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(currentProject.risks && currentProject.risks.length > 0 ? currentProject.risks : [
                    {
                      id: 'risk-std-1',
                      title: 'Pricing Model Compression',
                      level: 'Orange',
                      probability: 'Medium',
                      impact: 'High',
                      description: 'Relying strictly on upfront base seat pricing limits account contract sizes when clients downsize staff counts.',
                      mitigation: 'Incorporate usage based micro computation credit billing layers to support independent margin upsells.'
                    },
                    {
                      id: 'risk-std-2',
                      title: 'Outbound sales pipeline velocity drop-off',
                      level: 'Yellow',
                      probability: 'High',
                      impact: 'Moderate',
                      description: 'Sales cycles duration could increase beyond planning horizons if SDR reps spend excess time on dirty Salesforce ledger inputs.',
                      mitigation: 'Enable automated CRM activity tracking modules to bypass administrative logging effort.'
                    }
                  ]).map(r => (
                    <div key={r.id} className="p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          r.level === 'Red' ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 
                          r.level === 'Orange' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25' : 
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {r.level} Risk Level
                        </span>
                        <div className="text-[10px] font-mono text-text-secondary">Impact: <span className="font-bold text-text-primary">{r.impact}</span></div>
                      </div>

                      <h4 className="text-sm font-bold text-text-primary">{r.title}</h4>
                      <p className="text-xs text-text-secondary leading-normal font-sans">{r.description}</p>
                      
                      <div className="p-3 bg-bg-primary/50 rounded-xl border border-border/80 text-[11px] text-text-secondary font-sans leading-relaxed">
                        <span className="font-bold text-accent mr-1">Proactive Mitigation:</span>
                        {r.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 22: AI Optimization recommendations */}
            {activeStep === 22 && (
              <div className="space-y-6 text-left">
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5">
                  <Bookmark className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <span className="font-bold text-accent">Active Pivot center (Step 22): </span> 
                    Lists recommended operational GTM optimization vectors cued to accelerate transaction velocity and secure margins.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {(currentProject.recommendations && currentProject.recommendations.length > 0 ? currentProject.recommendations : [
                    {
                      id: 'rec-std-1',
                      category: 'Pricing Alignment',
                      title: 'Implement Pipeline Monitoring Caps',
                      impact: 'High',
                      effort: 'Medium',
                      actionableSteps: 'Structure seat billing around total monitored opportunity totals inside CRM accounts to isolate seats from staffing contractions.'
                    },
                    {
                      id: 'rec-std-2',
                      category: 'Demand Generation',
                      title: 'Deploy Automated CRM wizard sandboxes',
                      impact: 'High',
                      effort: 'Low',
                      actionableSteps: 'Establish a read-only integration pilot allowing target CROs to audit their leakage benchmarks in 5 minutes without manual logging.'
                    },
                    {
                      id: 'rec-std-3',
                      category: 'Sales Enablement',
                      title: 'Launch "CFO value Proof" playbooks',
                      impact: 'Moderate',
                      effort: 'Low',
                      actionableSteps: 'Furnish team reps with customizable financial calculations proving 9-month LTV CAC paybacks based on tool consolidations.'
                    }
                  ]).map(rec => (
                    <div key={rec.id} className="p-5 rounded-2xl bg-bg-surface/50 border border-border flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider block">{rec.category}</span>
                        <h4 className="text-xs font-bold text-text-primary leading-snug">{rec.title}</h4>
                        <p className="text-xs text-text-secondary leading-normal font-sans">{rec.actionableSteps}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40 text-[10px]">
                        <div>Impact level: <span className="font-bold text-accent">{rec.impact}</span></div>
                        <div>Effort level: <span className="font-bold text-text-primary">{rec.effort}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 23: Predictive Revenue Forecasting curves */}
            {activeStep === 23 && (
              <SimulationTab
                config={currentProject.simulationConfig}
                onChange={handleSimulationConfigChange}
                tabMode="forecast"
                onboardingData={currentProject.onboarding}
                onRefreshProjectFromCloud={refreshProjectFromCloud}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent Horizontal Sequential navigation bar (Back / Continue step buttons) */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-border gap-4">
        {/* Left Aligned - Back button & optional save status indicators */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleStepChange(activeStep - 1)}
            disabled={activeStep <= 1}
            className="px-4 py-2.5 border border-border text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Phase
          </button>

          {activeStep >= 2 && activeStep <= 9 && (
            <>
              {saveState === 'dirty' && (
                <span className="text-[10px] sm:text-xs font-mono text-yellow-500 animate-pulse flex items-center gap-1.5 ml-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Unsaved modifications detected
                </span>
              )}
              {saveState === 'saved' && (
                <span className="text-[10px] sm:text-xs font-mono text-accent flex items-center gap-1.5 ml-1 animate-in fade-in slide-in-from-left-2 duration-200">
                  <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                  All progress securely saved
                </span>
              )}
            </>
          )}
        </div>

        {/* Center - branding or identity */}
        <div className="text-[10px] font-mono text-text-secondary/50 font-extrabold uppercase select-none tracking-widest hidden md:block">
          REVOS GTM STRATEGIC REGISTER
        </div>

        {/* Right Aligned - Action buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {activeStep >= 2 && activeStep <= 9 && (
            <button
              onClick={handleSaveClickGlobal}
              disabled={saveState === 'saving'}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border cursor-pointer h-10 ${
                saveState === 'dirty'
                  ? 'bg-accent/15 hover:bg-accent text-accent hover:text-black border-accent/40 shadow-lg shadow-accent/5'
                  : 'bg-bg-primary hover:bg-bg-primary/80 text-text-primary border-border/80'
              }`}
            >
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Info...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          )}

          <button
            onClick={
              activeStep >= 2 && activeStep <= 9 && saveState === 'dirty'
                ? handleSaveAndContinueGlobal
                : () => handleStepChange(activeStep + 1)
            }
            disabled={activeStep >= 25 || saveState === 'saving'}
            className="px-5 py-2 bg-accent hover:bg-accent/90 text-black font-extrabold text-xs rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow h-10 cursor-pointer"
          >
            {activeStep >= 2 && activeStep <= 9 && saveState === 'dirty' ? (
              <>
                Save & Proceed
                <ChevronRight className="h-4 w-4 text-black" />
              </>
            ) : (
              <>
                Proceed to Next Phase
                <ChevronRight className="h-4 w-4 text-black" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
