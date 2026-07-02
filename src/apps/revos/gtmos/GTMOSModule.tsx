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
  ArrowUpRight,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useRevOS } from '../context/RevOSContext';
import { OnboardingCategoryFields, StrategyPillar, GTMOSActionTask, GTMOSSimulationState, GTMOSRisk, GTMOSRecommendation, GTMOSProject, CategoryId } from './types';
import { CATEGORY_SPECS, INITIAL_ONBOARDING_FIELDS, EMPTY_ONBOARDING_FIELDS, SEED_PROJECTS, DEFAULT_PILLARS } from './initialState';
import { OnboardingForms } from './OnboardingForms';
import { GTMSimulationEngine } from './GTMSimulationEngine';
import { GTMExecutionEngine } from './GTMExecutionEngine';
import { GTMExecutionPlan } from './types';
import { ExecutionPipeline } from './ExecutionPipeline';
import { ExecutionDashboard } from './ExecutionDashboard';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { ExecutiveDashboardEngine } from './ExecutiveDashboardEngine';
import { RevenueDecomposition } from './RevenueDecomposition';
import { GTMReportReviewModal } from './components/GTMReportReviewModal';
import ReactMarkdown from 'react-markdown';

import TextareaAutosize from 'react-textarea-autosize';

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
    name: 'Pillar 6: Sales & Channel Strategy',
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function AutoResizingTextarea({
  value,
  onChange,
  className = '',
  placeholder = '',
  onKeyDown
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
  }, [value]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(adjustHeight, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onKeyDown={onKeyDown}
      rows={1}
      className={`block overflow-hidden resize-none whitespace-pre-wrap break-words [word-break:break-word] ${className}`}
      placeholder={placeholder}
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
  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);

  // Pillar 2 ICP Playground States
  const [icpPlaygroundCategory, setIcpPlaygroundCategory] = useState<string>('company_size');
  const [isGeneratingIcp, setIsGeneratingIcp] = useState<boolean>(false);
  const [generatedIcpResult, setGeneratedIcpResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [icpSuccessMsg, setIcpSuccessMsg] = useState<string>('');

  // Pillar 3 Buyer Persona Playground States
  const [buyerPersonaCategory, setBuyerPersonaCategory] = useState<string>('economic_buyers');
  const [isGeneratingBuyerPersona, setIsGeneratingBuyerPersona] = useState<boolean>(false);
  const [generatedBuyerPersonaResult, setGeneratedBuyerPersonaResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [buyerPersonaSuccessMsg, setBuyerPersonaSuccessMsg] = useState<string>('');

  // Pillar 4 Value Proposition Playground States
  const [valuePropCategory, setValuePropCategory] = useState<string>('customer_value');
  const [isGeneratingValueProp, setIsGeneratingValueProp] = useState<boolean>(false);
  const [generatedValuePropResult, setGeneratedValuePropResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [valuePropSuccessMsg, setValuePropSuccessMsg] = useState<string>('');

  // Pillar 6 Sales & Channel Strategy Playground States
  const [salesChannelCategory, setSalesChannelCategory] = useState<string>('direct_sales_strategy');
  const [isGeneratingSalesChannel, setIsGeneratingSalesChannel] = useState<boolean>(false);
  const [generatedSalesChannelResult, setGeneratedSalesChannelResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [salesChannelSuccessMsg, setSalesChannelSuccessMsg] = useState<string>('');

  // Pillar 7 Marketing & Demand Generation Playground States
  const [marketingDemandCategory, setMarketingDemandCategory] = useState<string>('demand_generation_program');
  const [isGeneratingMarketingDemand, setIsGeneratingMarketingDemand] = useState<boolean>(false);
  const [generatedMarketingDemandResult, setGeneratedMarketingDemandResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [marketingDemandSuccessMsg, setMarketingDemandSuccessMsg] = useState<string>('');

  // Pillar 8 Enablement & Execution Playground States
  const [enablementExecutionCategory, setEnablementExecutionCategory] = useState<string>('shared_vision');
  const [isGeneratingEnablementExecution, setIsGeneratingEnablementExecution] = useState<boolean>(false);
  const [generatedEnablementExecutionResult, setGeneratedEnablementExecutionResult] = useState<{
    profile: string;
    keyCharacteristics: string[];
  } | null>(null);
  const [enablementExecutionSuccessMsg, setEnablementExecutionSuccessMsg] = useState<string>('');

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

  // Pillar 1 Target Accounts Playground States
  const [isGeneratingTargetAccounts, setIsGeneratingTargetAccounts] = useState<boolean>(false);
  const [generatedTargetAccountsResult, setGeneratedTargetAccountsResult] = useState<{
    accounts: Array<{ name: string; rationale: string; expectedValue: string }>;
  } | null>(null);
  const [targetAccountsSuccessMsg, setTargetAccountsSuccessMsg] = useState<string>('');

  // Pillar 5 Messaging Playground States
  const [messagingPlaygroundType, setMessagingPlaygroundType] = useState<string>('positioning_statement');
  const [isGeneratingMessaging, setIsGeneratingMessaging] = useState<boolean>(false);
  const [generatedMessagingResult, setGeneratedMessagingResult] = useState<{
    messaging: string;
    keyPoints: string[];
  } | null>(null);
  const [messagingSuccessMsg, setMessagingSuccessMsg] = useState<string>('');

  // Step 12 GTM Strategy Canvas States
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState<boolean>(false);
  const [canvasSuccessMsg, setCanvasSuccessMsg] = useState<string>('');

  // Interactive addition form for Step 1
  const [showNewProjDialog, setShowNewProjDialog] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSegment, setNewProjSegment] = useState('');
  const [newProjObj, setNewProjObj] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
        localCache.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        setProjectsList(localCache);
        setCurrentProjectId(localCache[0].id);
        setActiveStep(1);
        localStorage.setItem(cacheKey, JSON.stringify(localCache));
        setDbStatusMsg('Restored from Local Cache');
      }

      if (!supabase) {
        setIsSyncingDb(false);
        return;
      }

      try {
        // Multi-tenant Security Check: Enforce user's creator_id filter so users only see their own strategies
        let query = supabase.from('revos_gtmos_strategies').select('*').order('updated_at', { ascending: false });
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
              revenueDecomposition: raw.revenueDecomposition || null,
              executiveDashboardRollup: raw.executiveDashboardRollup || null,
              updated_at: row.updated_at || new Date().toISOString()
            };
          });

          setProjectsList(formattedProjects);
          // Auto-select the most active (top) project upon returning/loading
          setCurrentProjectId(formattedProjects[0].id);
          setActiveStep(1);
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
                  updated_at: freshProj.updated_at || new Date().toISOString(),
                  raw_input: {
                    currentStep: freshProj.currentStep,
                    onboarding: freshProj.onboarding,
                    tasks: freshProj.tasks,
                    simulationConfig: freshProj.simulationConfig,
                    gtmStrategyDraft: freshProj.gtmStrategyDraft || null,
                    gtmCanvas: freshProj.gtmCanvas || null,
                    gtmExecutionPlan: freshProj.gtmExecutionPlan || null,
                    archivedExecutionPlan: freshProj.archivedExecutionPlan || null,
                    revenueDecomposition: freshProj.revenueDecomposition || null,
                    executiveDashboardRollup: freshProj.executiveDashboardRollup || null
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
            setActiveStep(1);
            localStorage.setItem(cacheKey, JSON.stringify(uploadedList));
            setDbStatusMsg('Synced with Supabase Cloud');
          } else {
            // No local cache, initialize our seed project with a unique, secure UUID per user
            const seedId = generateUUID();
            const seed = {
              ...SEED_PROJECTS[0],
              id: seedId,
              updated_at: new Date().toISOString()
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
                updated_at: seed.updated_at,
                raw_input: {
                  currentStep: seed.currentStep,
                  onboarding: seed.onboarding,
                  tasks: seed.tasks,
                  simulationConfig: seed.simulationConfig,
                  gtmStrategyDraft: seed.gtmStrategyDraft || null,
                  gtmCanvas: seed.gtmCanvas || null,
                  gtmExecutionPlan: seed.gtmExecutionPlan || null,
                  archivedExecutionPlan: seed.archivedExecutionPlan || null,
                  revenueDecomposition: seed.revenueDecomposition || null,
                  executiveDashboardRollup: seed.executiveDashboardRollup || null
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
              setActiveStep(1);
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
    const now = new Date().toISOString();
    // Re-stamp the target's updated time and sort list so newest edits are at the top
    const sortedProjects = updatedProjects
      .map(p => p.id === targetProjId ? { ...p, updated_at: now } : p)
      .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());

    setProjectsList(sortedProjects);
    const cacheKey = getCacheKey();
    // Persist immediately in Local Storage for maximum reliability
    try {
      localStorage.setItem(cacheKey, JSON.stringify(sortedProjects));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    const target = sortedProjects.find(p => p.id === targetProjId);
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
          updated_at: target.updated_at,
          raw_input: {
            currentStep: target.currentStep,
            onboarding: target.onboarding,
            tasks: target.tasks,
            simulationConfig: target.simulationConfig,
            gtmStrategyDraft: target.gtmStrategyDraft || null,
            gtmCanvas: target.gtmCanvas || null,
            gtmExecutionPlan: target.gtmExecutionPlan || null,
            archivedExecutionPlan: target.archivedExecutionPlan || null,
            revenueDecomposition: target.revenueDecomposition || null,
            executiveDashboardRollup: target.executiveDashboardRollup || null
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
          revenueDecomposition: raw.revenueDecomposition || null,
          updated_at: data.updated_at || new Date().toISOString()
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

  const topRef = useRef<HTMLDivElement>(null);

  // Set step state on tick
  const handleStepChange = (step: number) => {
    setActiveStep(step);
    const nextList = projectsList.map(p => (p.id === currentProjectId ? { ...p, currentStep: step } : p));
    syncWithCloud(nextList, currentProjectId);
    
    // Defer scrolling until after the DOM has updated with the new step content
    setTimeout(() => {
      // Find the main scrolling container in the app layout and scroll it to the top
      const scrollContainer = document.querySelector('.overflow-y-auto') || window;
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
      recommendations: [],
      updated_at: new Date().toISOString()
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
      setActiveStep(1);
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
    let strategyDraftResult: any = null;

    try {
      strategyDraftResult = await invokeGtmApi('generate-gtm-draft', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title
      });
    } catch (err) {
      console.error('GTM Draft generation error, applying fallback:', err);
      strategyDraftResult = {
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
    }

    let finalProjData: any = null;
    let nextList = projectsList.map(p => {
      if (p.id === currentProjectId) {
        const tempProj = {
          ...p,
          gtmStrategyDraft: strategyDraftResult,
          currentStep: 11
        };
        finalProjData = {
          ...tempProj,
          simulationStrategicOptions: extractSnapshotOptions(tempProj)
        };
        return finalProjData;
      }
      return p;
    });

    if (finalProjData) {
      const heuristicsData = await invokeGtmApi('generate-simulation-heuristics', {
        options: finalProjData.simulationStrategicOptions
      }).catch((e) => {
        console.error("Heuristics API failure:", e);
        return null;
      });

      if (heuristicsData && heuristicsData.segments) {
        nextList = nextList.map(p => 
          p.id === currentProjectId ? { ...p, simulationHeuristics: heuristicsData } : p
        );
      }
    }

    setProjectsList(nextList);
    await syncWithCloud(nextList, currentProjectId);
    setActiveStep(11);
    setIsGeneratingGtmDraft(false);
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

  const handleGenerateTargetAccounts = async () => {
    setIsGeneratingTargetAccounts(true);
    setTargetAccountsSuccessMsg('');
    try {
      const pillar1Data = currentProject.gtmStrategyDraft?.['pillar_1_market_segmentation'] || [];
      const data = await invokeGtmApi('generate-target-accounts', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        marketSegmentationData: pillar1Data
      });
      if (data) {
        setGeneratedTargetAccountsResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTargetAccounts(false);
    }
  };

  const handleApplyTargetAccounts = () => {
    if (!generatedTargetAccountsResult) return;
    const itemsToAdd = generatedTargetAccountsResult.accounts.map(
      (a) => `Target Account: ${a.name} - ${a.rationale} (Est Value: ${a.expectedValue})`
    );
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft.pillar_1_market_segmentation) draft.pillar_1_market_segmentation = [];
    draft.pillar_1_market_segmentation = [...draft.pillar_1_market_segmentation, ...itemsToAdd];

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

    setTargetAccountsSuccessMsg('Added to Strategy Lines!');
    setTimeout(() => setTargetAccountsSuccessMsg(''), 3000);
  };

  const handleGenerateMessaging = async () => {
    setIsGeneratingMessaging(true);
    setMessagingSuccessMsg('');
    try {
      const draft = currentProject.gtmStrategyDraft || {};
      const data = await invokeGtmApi('generate-messaging', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        messagingType: messagingPlaygroundType,
        pillar1Data: draft['pillar_1_market_segmentation'] || [],
        pillar2Data: draft['pillar_2_icp'] || [],
        pillar3Data: draft['pillar_3_buyer_personas'] || [],
        pillar4Data: draft['pillar_4_value_proposition'] || [],
        pillar5Data: draft['pillar_5_messaging_positioning'] || []
      });
      if (data) {
        setGeneratedMessagingResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMessaging(false);
    }
  };

  const handleApplyMessaging = () => {
    if (!generatedMessagingResult?.messaging) return;
    const bulletText = `Message (${messagingPlaygroundType}): ${generatedMessagingResult.messaging}`;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    if (!draft.pillar_5_messaging_positioning) draft.pillar_5_messaging_positioning = [];
    draft.pillar_5_messaging_positioning = [...draft.pillar_5_messaging_positioning, bulletText];

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

    setMessagingSuccessMsg('Added to Strategy Lines!');
    setTimeout(() => setMessagingSuccessMsg(''), 3000);
  };

  const handleRegenerateIcpProfile = async () => {
    setIsGeneratingIcp(true);
    setIcpSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-icp', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: icpPlaygroundCategory
      });
      if (data) {
        setGeneratedIcpResult(data);
      }
    } catch (err) {
      console.error('Failed to generate ICP profile:', err);
    } finally {
      setIsGeneratingIcp(false);
    }
  };

  const handleApplyIcpProfile = () => {
    if (!generatedIcpResult) return;
    
    // Check if item already exists
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_2_icp'] || [];
    const formattedCategory = icpPlaygroundCategory.replace('_', ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedIcpResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_2_icp'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setIcpSuccessMsg('ICP saved to draft lines.');
      setTimeout(() => setIcpSuccessMsg(''), 3000);
    } else {
      setIcpSuccessMsg('Item already exists.');
      setTimeout(() => setIcpSuccessMsg(''), 3000);
    }
  };

  const handleRegenerateBuyerPersona = async () => {
    setIsGeneratingBuyerPersona(true);
    setBuyerPersonaSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-buyer-persona', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: buyerPersonaCategory
      });
      if (data) {
        setGeneratedBuyerPersonaResult(data);
      }
    } catch (err) {
      console.error('Failed to generate Buyer Persona:', err);
    } finally {
      setIsGeneratingBuyerPersona(false);
    }
  };

  const handleApplyBuyerPersona = () => {
    if (!generatedBuyerPersonaResult) return;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_3_buyer_personas'] || [];
    const formattedCategory = buyerPersonaCategory.replace(/_/g, ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedBuyerPersonaResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_3_buyer_personas'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setBuyerPersonaSuccessMsg('Buyer Persona saved to draft lines.');
      setTimeout(() => setBuyerPersonaSuccessMsg(''), 3000);
    } else {
      setBuyerPersonaSuccessMsg('Item already exists.');
      setTimeout(() => setBuyerPersonaSuccessMsg(''), 3000);
    }
  };

  const handleRegenerateValueProp = async () => {
    setIsGeneratingValueProp(true);
    setValuePropSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-value-prop', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: valuePropCategory
      });
      if (data) {
        setGeneratedValuePropResult(data);
      }
    } catch (err) {
      console.error('Failed to generate Value Proposition:', err);
    } finally {
      setIsGeneratingValueProp(false);
    }
  };

  const handleApplyValueProp = () => {
    if (!generatedValuePropResult) return;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_4_value_proposition'] || [];
    const formattedCategory = valuePropCategory.replace(/_/g, ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedValuePropResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_4_value_proposition'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setValuePropSuccessMsg('Value Proposition saved to draft lines.');
      setTimeout(() => setValuePropSuccessMsg(''), 3000);
    } else {
      setValuePropSuccessMsg('Item already exists.');
      setTimeout(() => setValuePropSuccessMsg(''), 3000);
    }
  };

  const handleRegenerateSalesChannel = async () => {
    setIsGeneratingSalesChannel(true);
    setSalesChannelSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-sales-channel', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: salesChannelCategory
      });
      if (data) {
        setGeneratedSalesChannelResult(data);
      }
    } catch (err) {
      console.error('Failed to generate Sales & Channel Strategy:', err);
    } finally {
      setIsGeneratingSalesChannel(false);
    }
  };

  const handleApplySalesChannel = () => {
    if (!generatedSalesChannelResult) return;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_6_sales_channel'] || [];
    const formattedCategory = salesChannelCategory.replace(/_/g, ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedSalesChannelResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_6_sales_channel'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setSalesChannelSuccessMsg('Sales & Channel Strategy saved to draft lines.');
      setTimeout(() => setSalesChannelSuccessMsg(''), 3000);
    } else {
      setSalesChannelSuccessMsg('Item already exists.');
      setTimeout(() => setSalesChannelSuccessMsg(''), 3000);
    }
  };

  const handleRegenerateMarketingDemand = async () => {
    setIsGeneratingMarketingDemand(true);
    setMarketingDemandSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-marketing-demand', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: marketingDemandCategory
      });
      if (data) {
        setGeneratedMarketingDemandResult(data);
      }
    } catch (err) {
      console.error('Failed to generate Marketing & Demand Gen Strategy:', err);
    } finally {
      setIsGeneratingMarketingDemand(false);
    }
  };

  const handleApplyMarketingDemand = () => {
    if (!generatedMarketingDemandResult) return;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_7_marketing_demand'] || [];
    const formattedCategory = marketingDemandCategory.replace(/_/g, ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedMarketingDemandResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_7_marketing_demand'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setMarketingDemandSuccessMsg('Marketing & Demand Gen Strategy saved to draft lines.');
      setTimeout(() => setMarketingDemandSuccessMsg(''), 3000);
    } else {
      setMarketingDemandSuccessMsg('Item already exists.');
      setTimeout(() => setMarketingDemandSuccessMsg(''), 3000);
    }
  };

  const handleRegenerateEnablementExecution = async () => {
    setIsGeneratingEnablementExecution(true);
    setEnablementExecutionSuccessMsg('');
    try {
      const data = await invokeGtmApi('generate-enablement-execution', {
        onboardingData: currentProject.onboarding,
        projectName: currentProject.title,
        strategyDraft: currentProject.gtmStrategyDraft,
        category: enablementExecutionCategory
      });
      if (data) {
        setGeneratedEnablementExecutionResult(data);
      }
    } catch (err) {
      console.error('Failed to generate Enablement & Execution Strategy:', err);
    } finally {
      setIsGeneratingEnablementExecution(false);
    }
  };

  const handleApplyEnablementExecution = () => {
    if (!generatedEnablementExecutionResult) return;
    
    const draft = { ...(currentProject.gtmStrategyDraft || {}) } as Record<string, string[]>;
    const draftContent = draft['pillar_8_enablement_execution'] || [];
    const formattedCategory = enablementExecutionCategory.replace(/_/g, ' ').toUpperCase();
    const newItemText = `[${formattedCategory}] ${generatedEnablementExecutionResult.profile}`;
    
    if (!draftContent.includes(newItemText)) {
      draft['pillar_8_enablement_execution'] = [...draftContent, newItemText];
      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) return { ...p, gtmStrategyDraft: draft };
        return p;
      });
      setProjectsList(nextList);
      setSaveState('dirty');

      setEnablementExecutionSuccessMsg('Enablement & Execution Strategy saved to draft lines.');
      setTimeout(() => setEnablementExecutionSuccessMsg(''), 3000);
    } else {
      setEnablementExecutionSuccessMsg('Item already exists.');
      setTimeout(() => setEnablementExecutionSuccessMsg(''), 3000);
    }
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

  const extractSnapshotOptions = (proj: Pick<GTMOSProject, 'onboarding' | 'gtmStrategyDraft'>) => {
    const ob = proj.onboarding || {} as any;
    const draft = proj.gtmStrategyDraft || {};
    
    // We can enrich onboarding texts with draft first items.
    const getStr = (obStr: string | undefined, draftKey: string) => {
      let base = obStr || '';
      if (draft && draft[draftKey] && draft[draftKey][0]) {
        base += `, ${draft[draftKey][0]}`;
      }
      return base;
    };

    const segmentsStr = getStr(ob.targetIndustries, 'pillar_1_market_segmentation');
    const icpsStr = getStr(ob.bestCustomers, 'pillar_2_icp');
    const personasStr = getStr(ob.typicalBuyers, 'pillar_3_buyer_personas');
    const valPropsStr = getStr(ob.uniqueDifferentiators, 'pillar_4_value_proposition');
    const motionsStr = getStr(ob.currentSalesMotion, 'pillar_6_sales_motion');
    const channelsStr = getStr(ob.currentChannels, 'pillar_5_distribution_channels');
    const marketingStr = getStr(ob.currentMarketingActivities, 'pillar_5_distribution_channels');

    const getOptions = (field: string | undefined, fallbacks: string[]) => {
      if (!field || field.trim() === '') return fallbacks;
      // split by common delimiters but exclude comma because users use commas in sentences
      const parts = field.split(/[\n|;]/).map(s => s.trim()).filter(Boolean);
      const opts = [];
      
      const formatStr = (s: string) => s.length > 50 ? s.substring(0, 47) + '...' : s;
      
      if (parts.length >= 1) opts.push(formatStr(parts[0])); else opts.push(fallbacks[0]);
      if (parts.length >= 2) opts.push(formatStr(parts[1])); else opts.push(fallbacks[1]);
      if (parts.length >= 3) opts.push(formatStr(parts[2])); else opts.push(fallbacks[2]);
      
      // If we didn't get enough parts from strict delimiters, try generic fallback safely
      if (parts.length < 3 && !field.includes('\n') && !field.includes('|') && !field.includes(';')) {
        // try to separate by comma if it looks like a simple list
        const commaParts = field.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length < 60);
        if (commaParts.length >= 3) {
           return [formatStr(commaParts[0]), formatStr(commaParts[1]), formatStr(commaParts[2])];
        }
      }
      return opts;
    };

    return {
      segments: getOptions(segmentsStr, ['Enterprise', 'Mid-Market', 'SMB/PLG']),
      icps: getOptions(icpsStr, ['Enterprise Scaling', 'Developer Groups', 'Legacy Migrations']),
      personas: getOptions(personasStr, ['Economic Buyer', 'Technical Evaluator', 'Head of Ops']),
      valProps: getOptions(valPropsStr, ['ROI Telemetry', 'Sub-Millisecond Speed', 'Zero Setup Cost']),
      messaging: getOptions(ob.painPoints, ['Business/Outcome', 'Technical/Deep', 'Operational/Easy']),
      motions: getOptions(motionsStr, ['Direct Outbound', 'PLG Self-Serve', 'Indirect Partner']),
      channels: getOptions(channelsStr, ['CRM Marketplace', 'Direct Sales Force', 'Inbound Search']),
      marketing: getOptions(marketingStr, ['Paid Campaigns', 'Strategic Events', 'Viral Growth'])
    };
  };

  const handleSaveDraftStrategyGlobal = async () => {
    setSaveState('saving');
    try {
      const snapshot = extractSnapshotOptions(currentProject);
      let heuristics = currentProject.simulationHeuristics;
      
      const heuristicsData = await invokeGtmApi('generate-simulation-heuristics', {
        options: snapshot
      }).catch(err => {
        console.error("Failed to generate simulation heuristics", err);
        return null; // fallback gracefully
      });
      
      if (heuristicsData && heuristicsData.segments) {
        heuristics = heuristicsData;
      }

      const nextList = projectsList.map(p => 
        p.id === currentProjectId ? { ...p, simulationStrategicOptions: snapshot, simulationHeuristics: heuristics } : p
      );
      setProjectsList(nextList);
      await syncWithCloud(nextList, currentProjectId);
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

  const handleUpdateExecutiveDashboardRollup = async (projectId: string, rollup: any) => {
    const nextList = projectsList.map(p => {
      if (p.id === projectId) {
        return { ...p, executiveDashboardRollup: rollup };
      }
      return p;
    });
    // This immediately syncs and updates React state
    await syncWithCloud(nextList, projectId);
  };

  // Steps 18 - 19: Risk & Recommendations Audit trigger
  const runRiskAudit = async () => {
    setIsGeneratingAudit(true);
    try {
      const results = await invokeGtmApi('risks-recommendations', {
        onboardingData: currentProject.onboarding,
        strategyData: currentProject.pillars,
        revenueDecomposition: currentProject.revenueDecomposition,
        executionPlan: currentProject.gtmExecutionPlan,
        simulationConfig: currentProject.simulationConfig
      });

      const nextList = projectsList.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            risks: results.risks || [],
            recommendations: results.recommendations || [],
            riskReasoningLog: results.reasoningLog || null
          };
        }
        return p;
      });
      await syncWithCloud(nextList, currentProjectId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAudit(false);
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
    { num: 13, name: 'Revenue Decomposition' },
    { num: 14, name: 'GTM Simulation' },
    { num: 15, name: 'GTM Execution Engine' },
    { num: 16, name: 'Execution Pipeline' },
    { num: 17, name: 'Execution Dashboard' },
    { num: 18, name: 'Defense Audit' },
    { num: 19, name: 'Pivotal Actions' },
    { num: 20, name: 'Execution Insights' },
    { num: 21, name: 'Executive Dashboard' },
    { num: 22, name: 'GTM Report' }
  ];

  const currentOnboardingCategory = CATEGORY_SPECS.find(c => c.stepNumber === activeStep);

  return (
    <div ref={topRef} className="flex flex-col min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
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

      {/* Horizontal rolling workflow timeline stepper (Steps 1 to 20) */}
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
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6">
                  {/* Strategic context select rail */}
                  <div className="w-full lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border flex flex-col">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3 sm:mb-4">
                      <h3 className="font-bold text-[11px] sm:text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-accent" />
                        GTM Strategy List
                      </h3>
                      <button
                        onClick={() => setShowNewProjDialog(true)}
                        className="p-1.5 sm:p-2 rounded-lg bg-accent/15 border border-accent/20 hover:bg-accent hover:text-black hover:border-accent text-accent transition-all shrink-0"
                        title="Initialize fresh strategy blueprint"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto scrollbar-none pr-1 max-h-[40vh] lg:max-h-[50vh]">
                      {projectsList.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setCurrentProjectId(p.id);
                            handleStepChange(1);
                          }}
                          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer text-left relative group ${
                            p.id === currentProjectId
                              ? 'bg-accent/15 border-accent text-accent'
                              : 'bg-bg-primary/60 border-border/80 text-text-secondary hover:border-text-secondary/25'
                          }`}
                        >
                          <h4 className="text-[11px] sm:text-xs font-black leading-snug pr-6 truncate">{p.title}</h4>
                          <span className="text-[8px] sm:text-[9px] font-mono uppercase block mt-1 opacity-80 truncate">{p.market_segment}</span>
                          
                          <button
                            onClick={(e) => handleDeleteProject(p.id, e)}
                            className="absolute right-2 sm:right-3 top-2 sm:top-3.5 p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="Purge strategy row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Strategy config focus sheet */}
                  <div className="w-full lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-bg-surface/50 border border-border flex flex-col justify-center text-left">
                    <div className="border-b border-border pb-3 sm:pb-4 mb-4 sm:mb-5">
                      <span className="text-[8px] sm:text-[9px] font-mono text-accent uppercase tracking-widest block mb-1.5">Target strategy context</span>
                      <h2 className="text-sm sm:text-base md:text-lg font-black text-text-primary leading-tight">{currentProject.title}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase mb-1">Market Segment / Vertical</span>
                        <div className="p-2.5 sm:p-3 bg-bg-primary/60 border border-border/80 text-[11px] sm:text-xs font-bold text-text-primary rounded-xl truncate">{currentProject.market_segment}</div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase mb-1">Enterprise strategic Priorities</span>
                        <div className="p-2.5 sm:p-3 bg-bg-primary/60 border border-border/80 text-[11px] sm:text-xs text-text-primary rounded-xl truncate">{currentProject.strategic_objective}</div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-2.5 sm:gap-3 mb-4 sm:mb-5 items-start">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                      <p className="text-[11px] sm:text-xs leading-relaxed text-text-secondary">
                        Selecting this strategy mounts the respective onboarding variables and compiles all steps. Click <span className="font-bold text-accent">"Primary Onboarding Phase"</span> below to initiate Company onboarding metrics.
                      </p>
                    </div>

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => handleStepChange(2)}
                        className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-accent text-black font-extrabold rounded-2xl text-[11px] sm:text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-accent/10 hover:shadow-accent/25"
                      >
                        Primary Onboarding Phase
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
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
              <div className="space-y-4 sm:space-y-6 text-left">
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Trigger Controller panel */}
                  <div className="w-full lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-4 sm:space-y-5">
                    <div className="border-b border-border pb-3">
                      <span className="text-[8px] sm:text-[9px] font-mono text-[#00F090] uppercase font-bold block mb-1">Commercial alignment score</span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-text-primary">L2 Strategic Readiness Assessment</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-bg-primary/50 rounded-2xl border border-border relative">
                      <div className="text-[9px] sm:text-[10px] font-mono text-text-secondary uppercase absolute top-3 sm:top-4 left-3 sm:left-4">Readiness Index</div>
                      <div className="text-3xl sm:text-4xl md:text-5xl font-black text-accent mt-4 select-none">
                        {currentProject.readinessScore}%
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-text-secondary/60 uppercase mt-2 font-mono text-center">Normalized GTM parameters</div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase">Initiate model audit</span>
                      <button
                        onClick={runStrategicReasoning}
                        disabled={isReasoning}
                        className="w-full py-2.5 sm:py-3 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/10"
                      >
                        {isReasoning ? <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        Execute Alignment Reasoners
                      </button>
                    </div>

                    {currentProject.aiReasoning && (
                      <div className="space-y-2 pt-3 sm:pt-4 border-t border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                          GTM Strategy Ready
                        </span>
                        <button
                          onClick={runGtmDraftGeneration}
                          disabled={isGeneratingGtmDraft}
                          className="w-full py-2.5 sm:py-3 bg-[#00F090] text-black font-black text-[11px] sm:text-xs rounded-xl hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00F090]/15"
                        >
                          {isGeneratingGtmDraft ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                              Generating Strategy...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Generate GTM Strategy Draft
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Operational Terminal shell logs */}
                  <div className="w-full lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="p-3 sm:p-4 rounded-2xl bg-black border border-border/80 font-mono text-[10px] sm:text-xs text-left h-40 sm:h-48 overflow-y-auto scrollbar-none space-y-1 sm:space-y-1.5 flex flex-col justify-end">
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className="text-accent/90">{log}</div>
                      ))}
                      {consoleLogs.length === 0 && (
                        <div className="text-text-secondary/40 italic">Terminal active. Click "Execute Alignment Reasoners" to check framework constraints...</div>
                      )}
                    </div>

                    {currentProject.aiReasoning && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-3 sm:space-y-4">
                        <h4 className="text-[11px] sm:text-xs font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                          Consolidated Reasoning Outcomes
                        </h4>
                        <div className="max-w-none font-sans text-[10px] sm:text-[11px] text-text-secondary leading-relaxed space-y-2">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-[10px] sm:text-[11px] font-normal text-text-secondary leading-relaxed mb-1.5">{children}</p>,
                              strong: ({ children }) => <strong className="text-[10px] sm:text-[11px] font-bold text-text-secondary">{children}</strong>,
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
                            <span className="text-[9px] sm:text-[10px] font-bold text-red-400 uppercase flex items-center gap-1.5">
                              <AlertOctagon className="h-3.5 w-3.5" />
                              Critical Vulnerability detections
                            </span>
                            <div className="space-y-1.5">
                              {currentProject.aiVulnerabilities.map((v, i) => (
                                <div key={i} className="text-[10px] sm:text-xs text-text-secondary flex gap-2 items-start bg-red-400/5 p-2 rounded-lg border border-red-500/10">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span className="font-sans text-[10px] sm:text-[11px]">{v}</span>
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
              <div className="space-y-4 sm:space-y-6 text-left animate-in fade-in duration-300">
                {/* Intro banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-[#00F090] uppercase block">Continuous Operating Enforcer</span>
                    <h2 className="text-sm sm:text-base font-black text-text-primary">Step 11: Go-to-Market Strategy Draft</h2>
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-normal max-w-2xl font-sans">
                      Review and fine-tune your core commercial tactics mapped upon the 9-pillar GTM framework below. You can customize, delete, or append new strategy items for each individual operational lever.
                    </p>
                  </div>
                  
                  {/* Save Draft Button */}
                  <button
                    onClick={handleSaveDraftStrategyGlobal}
                    disabled={saveState === 'saving'}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-accent hover:bg-accent/95 disabled:bg-accent/40 text-black font-extrabold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
                  >
                    {saveState === 'saving' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Saving items...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Save Strategy Draft
                      </>
                    )}
                  </button>
                </div>

                {!currentProject.gtmStrategyDraft ? (
                  /* Prompt to generate strategy if not present */
                  <div className="max-w-md mx-auto space-y-4 sm:space-y-5 p-6 sm:p-8 rounded-3xl bg-bg-surface/50 border border-border text-center">
                    <div className="p-3 sm:p-4 rounded-2xl bg-accent/10 border border-accent/20 w-fit mx-auto">
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-wider">GTM Strategy Not Generated</h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                        Generate a comprehensive commercial roadmap matching your onboarding parameters and multi-agent alignment audit.
                      </p>
                    </div>

                    <button
                      onClick={runGtmDraftGeneration}
                      disabled={isGeneratingGtmDraft}
                      className="px-5 sm:px-6 py-3 sm:py-3.5 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-40"
                    >
                      {isGeneratingGtmDraft ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      Generate GTM Strategy Draft
                    </button>
                  </div>
                ) : (
                  /* Grid view / Sidebar layout */
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                    {/* Left Column: List of 9 pillars */}
                    <div className="w-full lg:col-span-4 space-y-2">
                      <div className="text-[9px] sm:text-[10px] font-mono text-text-secondary uppercase tracking-widest pl-1 mb-2">9 Commercial Pillars</div>
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
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h4 className={`text-xs font-bold break-words [word-break:break-word] whitespace-pre-wrap ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                                {p.name}
                              </h4>
                              <p className="text-[10px] text-text-secondary break-words [word-break:break-word] whitespace-pre-wrap font-sans">{p.purpose}</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg-primary border border-border shrink-0 font-bold group-hover:border-accent/30 ml-2">
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
                        <div className="w-full lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-bg-surface/50 border border-border text-left space-y-4 sm:space-y-6">
                          {/* Workspace info header */}
                          <div className="border-b border-border/80 pb-3 sm:pb-4 space-y-2">
                            <span className="text-[8px] sm:text-[9px] font-mono font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded-md border border-accent/20">
                              ACTIVE REFINEMENT DESK
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-wider pt-2 break-words [word-break:break-word] whitespace-pre-wrap">
                              {activeMeta.name}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-text-secondary font-sans leading-normal break-words [word-break:break-word] whitespace-pre-wrap">
                              <strong className="text-text-primary">Purpose: </strong>
                              {activeMeta.purpose}
                            </p>
                          </div>

                          {/* Reference card - Outputs and guidelines */}
                          <div className="p-3 sm:p-4 rounded-xl bg-bg-primary/40 border border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary uppercase block mb-1.5 font-bold">Strategic Questions</span>
                              <ul className="space-y-1 text-[10px] sm:text-[11px] text-text-secondary font-sans list-disc pl-3 leading-relaxed">
                                {activeMeta.keyQuestions.map((q, idx) => (
                                  <li key={idx} className="break-words [word-break:break-word] whitespace-pre-wrap">{q}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary uppercase block mb-1.5 font-bold">Commercial Outputs</span>
                              <div className="flex flex-wrap gap-1.5">
                                {activeMeta.outputs.map((out, idx) => (
                                  <span key={idx} className="text-[9px] sm:text-[10px] font-mono bg-accent/5 text-accent/90 border border-accent/15 px-2 py-0.5 rounded-md font-bold break-words [word-break:break-word] whitespace-pre-wrap">
                                    {out}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Interactive list of strategy items */}
                          <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                            <div className="text-[9px] sm:text-[10px] font-mono text-text-secondary uppercase tracking-wider pl-1 font-bold">Draft Strategy Lines</div>
                            {activeItems.length === 0 ? (
                              <div className="p-4 sm:p-6 text-center text-[11px] sm:text-xs text-text-secondary/40 italic rounded-xl border border-dashed border-border">
                                No strategy lines formulated. Add custom items below or regenerate draft.
                              </div>
                            ) : (
                              <div className="space-y-2 sm:space-y-2.5">
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
                                          <span className="px-2.5 py-0.5 rounded-md bg-[#00F090]/10 border border-[#00F090]/25 text-[#00F090] font-black text-[9px] uppercase tracking-wider font-mono select-none break-words [word-break:break-word] whitespace-pre-wrap max-w-full text-center">
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
                                        className="w-full bg-transparent border-none text-[16px] sm:text-xs text-text-primary focus:outline-none focus:ring-0 select-text leading-relaxed font-sans placeholder-text-secondary/30 p-0"
                                        placeholder="Refine strategic item text..."
                                      />                                       <button
                                        onClick={() => handleDeleteDraftItem(selectedDraftPillar, index)}
                                        className="p-2 sm:p-1.5 rounded-lg border border-transparent hover:border-red-500/20 text-text-secondary hover:text-red-400 opacity-60 hover:opacity-100 transition-all shrink-0 self-start sm:-mt-1"
                                        title="Purge strategy row"
                                      >
                                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Interactive Target Accounts Playground for Pillar 1 */}
                          {selectedDraftPillar === 'pillar_1_market_segmentation' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Target Accounts Recommendation
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize top 5 target accounts grounded directly in your defined market segmentation strategy.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleGenerateTargetAccounts}
                                    disabled={isGeneratingTargetAccounts}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingTargetAccounts ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Generating Accounts...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Generate Target Accounts
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedTargetAccountsResult && (
                                  <div className="p-3 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3 sm:space-y-4.5 text-left transition-all duration-300">
                                    <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary uppercase tracking-wider font-bold block">
                                      RECOMMENDED TOP 5 TARGET ACCOUNTS
                                    </span>
                                    <div className="space-y-2 sm:space-y-3">
                                      {generatedTargetAccountsResult.accounts.map((account, idx) => (
                                        <div key={idx} className="p-3 border border-border/50 rounded-lg space-y-1.5">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                                            <span className="text-xs sm:text-sm font-bold text-text-primary">{account.name}</span>
                                            <span className="text-[9px] sm:text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full w-fit">{account.expectedValue}</span>
                                          </div>
                                          <p className="text-[11px] sm:text-xs text-text-secondary font-sans leading-relaxed">{account.rationale}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Integrate controls */}
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {targetAccountsSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {targetAccountsSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyTargetAccounts}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive ICP Playground for Pillar 2 */}
                          {selectedDraftPillar === 'pillar_2_icp' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Cognitive ICP Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize Ideal Customer Profile parameters grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      ICP Parameter Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'company_size', label: 'Company Size' },
                                        { id: 'industry', label: 'Industry' },
                                        { id: 'geography', label: 'Geography' },
                                        { id: 'buying_triggers', label: 'Buying Triggers' },
                                        { id: 'budget_characteristics', label: 'Budget Characteristics' },
                                        { id: 'decision_structure', label: 'Decision Structure' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setIcpPlaygroundCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            icpPlaygroundCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateIcpProfile}
                                    disabled={isGeneratingIcp}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingIcp ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing ICP...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate ICP
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedIcpResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {icpPlaygroundCategory.replace('_', ' ')} Profile</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedIcpResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedIcpResult.keyCharacteristics && generatedIcpResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedIcpResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {icpSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {icpSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyIcpProfile}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive Buyer Persona Playground for Pillar 3 */}
                          {selectedDraftPillar === 'pillar_3_buyer_personas' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Cognitive Buyer Persona Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize buyer persona strategies grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Buyer Persona Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                      {[
                                        { id: 'economic_buyers', label: 'Economic Buyers' },
                                        { id: 'technical_buyers', label: 'Technical Buyers' },
                                        { id: 'business_buyers', label: 'Business Buyers' },
                                        { id: 'influencers', label: 'Influencers' },
                                        { id: 'pain_point', label: 'Pain Point' },
                                        { id: 'success_metrics', label: 'Success Metrics' },
                                        { id: 'ceo', label: 'CEO' },
                                        { id: 'cfo', label: 'CFO' },
                                        { id: 'coo', label: 'COO' },
                                        { id: 'cto', label: 'CTO' },
                                        { id: 'cro', label: 'CRO' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setBuyerPersonaCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            buyerPersonaCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateBuyerPersona}
                                    disabled={isGeneratingBuyerPersona}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingBuyerPersona ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing Persona...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate Persona
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedBuyerPersonaResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {buyerPersonaCategory.replace(/_/g, ' ')} Profile</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedBuyerPersonaResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedBuyerPersonaResult.keyCharacteristics && generatedBuyerPersonaResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedBuyerPersonaResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {buyerPersonaSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {buyerPersonaSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyBuyerPersona}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive Value Proposition Playground for Pillar 4 */}
                          {selectedDraftPillar === 'pillar_4_value_proposition' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Cognitive Value Proposition Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize value proposition strategies grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Value Proposition Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'customer_value', label: 'Customer Value' },
                                        { id: 'business_outcomes', label: 'Business Outcomes' },
                                        { id: 'differentiation', label: 'Differentiation' },
                                        { id: 'competitive_advantages', label: 'Competitive Advantages' },
                                        { id: 'roi_statements', label: 'ROI Statements' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setValuePropCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            valuePropCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateValueProp}
                                    disabled={isGeneratingValueProp}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingValueProp ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing Value Prop...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate Value Prop
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedValuePropResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {valuePropCategory.replace(/_/g, ' ')} Strategy</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedValuePropResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedValuePropResult.keyCharacteristics && generatedValuePropResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedValuePropResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {valuePropSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {valuePropSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyValueProp}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive Messaging Playground for Pillar 5 */}
                          {selectedDraftPillar === 'pillar_5_messaging_positioning' && (
                            <div className="pt-6 border-t border-border/60 space-y-4">
                              <div className="p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
                                {/* Title block */}
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-5 w-5 text-accent" />
                                  <div>
                                    <h4 className="text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Messaging & Positioning Playground
                                    </h4>
                                    <p className="text-[11px] text-text-secondary">
                                      Dynamically synthesize outcome-based messaging grounded directly in your defined strategy pillars.
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider font-bold">Messaging Type</span>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                      {[
                                        { id: 'positioning_statement', label: 'Positioning Statement' },
                                        { id: 'core_messaging', label: 'Core Messaging' },
                                        { id: 'economic_buyers', label: 'Economic Buyers' },
                                        { id: 'technical_buyers', label: 'Technical Buyers' },
                                        { id: 'business_buyers', label: 'Business Buyers' },
                                        { id: 'influencers', label: 'Influencers' },
                                        { id: 'major_competitors', label: 'Major Competitors' },
                                        { id: 'outcome_based', label: 'Outcome-Based' }
                                      ].map(type => (
                                        <button
                                          key={type.id}
                                          type="button"
                                          onClick={() => setMessagingPlaygroundType(type.id)}
                                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${messagingPlaygroundType === type.id ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'bg-bg-primary border border-border/60 text-text-secondary hover:text-text-primary hover:border-border/80'}`}
                                        >
                                          {type.label}
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
                                    onClick={handleGenerateMessaging}
                                    disabled={isGeneratingMessaging}
                                    className="px-4.5 py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-105 active:scale-95 transition-all text-accent text-xs font-black rounded-xl select-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingMessaging ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating Messaging...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-4 w-4" />
                                        Generate Messaging
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedMessagingResult && (
                                  <div className="p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-4.5 text-left transition-all duration-300">
                                    <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider font-bold block">
                                      GENERATED MESSAGING
                                    </span>
                                    <div className="p-4 bg-bg-surface border border-border/40 rounded-xl space-y-3 shadow-inner">
                                      <p className="text-sm font-medium text-text-primary leading-relaxed whitespace-pre-wrap">
                                        "{generatedMessagingResult.messaging}"
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider font-bold block">
                                        Key Points
                                      </span>
                                      <ul className="space-y-1.5">
                                        {generatedMessagingResult.keyPoints.map((point, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-accent/60 mt-1.5" />
                                            <span className="text-xs text-text-secondary">{point}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Integrate controls */}
                                    <div className="pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex items-center gap-2.5">
                                        {messagingSuccessMsg && (
                                          <span className="text-[11px] text-[#00F090] font-bold animate-pulse">
                                            {messagingSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyMessaging}
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

                          {/* Interactive Sales & Channel Strategy Playground for Pillar 6 */}
                          {selectedDraftPillar === 'pillar_6_sales_channel' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Sales & Channel Strategy Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize sales and channel strategies grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Strategy Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'direct_sales_strategy', label: 'Direct Sales Strategy' },
                                        { id: 'partner_strategy', label: 'Partner Strategy' },
                                        { id: 'distributor_strategy', label: 'Distributor Strategy' },
                                        { id: 'digital_strategy', label: 'Digital Strategy' },
                                        { id: 'hybrid_revenue_motion', label: 'Hybrid Revenue Motion' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setSalesChannelCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            salesChannelCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateSalesChannel}
                                    disabled={isGeneratingSalesChannel}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingSalesChannel ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing Strategy...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate Strategy
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedSalesChannelResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {salesChannelCategory.replace(/_/g, ' ')} Strategy</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedSalesChannelResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedSalesChannelResult.keyCharacteristics && generatedSalesChannelResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedSalesChannelResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {salesChannelSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {salesChannelSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplySalesChannel}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive Marketing & Demand Gen Playground for Pillar 7 */}
                          {selectedDraftPillar === 'pillar_7_marketing_demand' && (
                            <div className="pt-4 sm:pt-6 border-t border-border/60 space-y-4">
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Marketing & Demand Gen Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize marketing and demand generation strategies grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Strategy Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'demand_generation_program', label: 'Demand Generation Program' },
                                        { id: 'campaign_strategy', label: 'Campaign Strategy' },
                                        { id: 'content_strategy', label: 'Content Strategy' },
                                        { id: 'digital_marketing_strategy', label: 'Digital Marketing Strategy' },
                                        { id: 'lead_generation_strategy', label: 'Lead Generation Strategy' },
                                        { id: 'outbound_campaign_strategy', label: 'Outbound Campaign Strategy' },
                                        { id: 'account_based_marketing_campaign_strategy', label: 'Account-Based Marketing Campaign Strategy' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setMarketingDemandCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            marketingDemandCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateMarketingDemand}
                                    disabled={isGeneratingMarketingDemand}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingMarketingDemand ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing Strategy...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate Strategy
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedMarketingDemandResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {marketingDemandCategory.replace(/_/g, ' ')} Strategy</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedMarketingDemandResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedMarketingDemandResult.keyCharacteristics && generatedMarketingDemandResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedMarketingDemandResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {marketingDemandSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {marketingDemandSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyMarketingDemand}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interactive Cognitive Pitch Playground for Pillar 8 */}
                          {selectedDraftPillar === 'pillar_8_enablement_execution' && (
                            <div className="pt-6 border-t border-border/60 space-y-6">
                              {/* Interactive Enablement & Execution Strategy Playground */}
                              <div className="p-4 sm:p-5.5 rounded-2xl bg-accent/5 border border-accent/20 space-y-3 sm:space-y-4">
                                {/* Title block */}
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                                  <div>
                                    <h4 className="text-[11px] sm:text-xs font-black text-accent uppercase tracking-wider">
                                      ⚡ Enablement & Execution Playground
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-text-secondary leading-snug">
                                      Dynamically synthesize enablement and execution strategies grounded directly in your finalized strategy lines.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {/* Category selector */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-text-secondary uppercase font-bold pl-0.5">
                                      Strategy Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { id: 'shared_vision', label: 'Shared Vision' },
                                        { id: 'sales_playbooks', label: 'Sales Playbooks' },
                                        { id: 'enablement_plans', label: 'Enablement Plans' },
                                        { id: 'training_program', label: 'Training Program' },
                                        { id: 'execution_frameworks', label: 'Execution Frameworks' },
                                        { id: 'operational_readiness', label: 'Operational Readiness' }
                                      ].map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setEnablementExecutionCategory(cat.id)}
                                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center select-none cursor-pointer ${
                                            enablementExecutionCategory === cat.id
                                              ? 'bg-accent text-black border-accent'
                                              : 'bg-bg-primary hover:bg-bg-primary/80 text-text-secondary hover:text-text-primary border-border'
                                          }`}
                                        >
                                          {cat.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-border/30">
                                  <span className="text-[8px] sm:text-[9px] font-mono text-text-secondary/60 block mb-2 sm:mb-0">
                                    Grounded via gemini-3.1-flash-lite
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleRegenerateEnablementExecution}
                                    disabled={isGeneratingEnablementExecution}
                                    className="w-full sm:w-auto px-4 sm:px-4.5 py-2 sm:py-2.5 bg-accent/20 border border-accent/30 hover:bg-accent hover:text-black hover:scale-[1.02] active:scale-95 transition-all text-accent text-[11px] sm:text-xs font-black rounded-xl select-none flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {isGeneratingEnablementExecution ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        Synthesizing Strategy...
                                      </>
                                    ) : (
                                      <>
                                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Dynamically Regenerate Strategy
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* Generated output visual desk */}
                                {generatedEnablementExecutionResult && (
                                  <div className="p-4 sm:p-4.5 rounded-xl bg-bg-primary/60 border border-border/80 space-y-3.5 sm:space-y-4.5 text-left transition-all duration-300">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-[10px] font-mono text-accent mb-1.5 uppercase font-bold">Generated {enablementExecutionCategory.replace(/_/g, ' ')} Strategy</h5>
                                        <p className="text-xs sm:text-sm text-text-primary leading-relaxed bg-bg-surface p-2.5 sm:p-3 rounded-lg border border-border/50">
                                          {generatedEnablementExecutionResult.profile}
                                        </p>
                                      </div>
                                      
                                      {generatedEnablementExecutionResult.keyCharacteristics && generatedEnablementExecutionResult.keyCharacteristics.length > 0 && (
                                        <div>
                                          <h5 className="text-[10px] font-mono text-text-secondary mb-1.5 uppercase font-bold">Key Characteristics</h5>
                                          <ul className="text-[11px] sm:text-xs text-text-secondary space-y-1 sm:space-y-1.5 list-disc pl-4">
                                            {generatedEnablementExecutionResult.keyCharacteristics.map((point, idx) => (
                                              <li key={idx} className="pl-1 leading-snug">{point}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-3 sm:pt-2.5 border-t border-border/30 flex flex-col sm:flex-row items-center justify-end gap-3">
                                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                                        {enablementExecutionSuccessMsg && (
                                          <span className="text-[10px] sm:text-[11px] text-[#00F090] font-bold animate-pulse text-center w-full sm:w-auto">
                                            {enablementExecutionSuccessMsg}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={handleApplyEnablementExecution}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#00F090]/15 border border-[#00F090]/30 hover:bg-[#00F090] text-[#00F090] hover:text-black text-[11px] sm:text-xs font-black rounded-xl transition-all select-none flex items-center justify-center gap-1 shadow-lg shadow-[#00F090]/5"
                                        >
                                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Apply to Strategy Lines list
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

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
                                        className="w-full bg-bg-surface border border-border/80 hover:border-border focus:border-accent/40 rounded-xl px-3 py-2.5 text-[16px] sm:text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans"
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

                              <AutoResizingTextarea
                                value={newDraftItemText}
                                onChange={(val) => setNewDraftItemText(val)}
                                placeholder={selectedAddPrefix ? `Describe strategic details for "${selectedAddPrefix}"...` : "e.g. Describe strategic action or details..."}
                                className="w-full bg-bg-primary border border-border hover:border-border-hover focus:border-accent/40 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-text-primary focus:outline-none placeholder-text-secondary/40 font-sans"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddDraftItem(selectedDraftPillar);
                                  }
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
              <div className="space-y-4 sm:space-y-6">
                {/* Header panel with generate / status tools */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface/30 border border-border/80 rounded-2xl p-4 sm:p-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[#00F090] uppercase tracking-wider font-bold">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00F090]" />
                      Model-Synthesized Strategic Frame
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-text-primary">9-Pillar GTM Strategy Canvas</h3>
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed max-w-2xl font-sans">
                      This canvas shows high-impact condensed executive summaries of each commercial pillar, synthesized by Gemini based on the detailed draft strategic lines finalized and stored in <span className="font-bold text-accent">Step 11: GTM Strategy Draft</span>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                    <button
                      onClick={handleGenerateStrategyCanvas}
                      disabled={isGeneratingCanvas}
                      className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/5 disabled:opacity-40"
                    >
                      {isGeneratingCanvas ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      {currentProject.gtmCanvas ? 'Update Strategy Canvas' : 'Compile Strategy Canvas'}
                    </button>
                  </div>
                </div>

                {canvasSuccessMsg && (
                  <div className="p-3 bg-accent/5 border border-accent/25 text-[11px] sm:text-xs text-accent rounded-xl animate-in fade-in duration-200 font-sans">
                    {canvasSuccessMsg}
                  </div>
                )}

                {/* If canvas isn't generated yet */}
                {!currentProject.gtmCanvas ? (
                  <div className="max-w-md mx-auto space-y-4 sm:space-y-5 p-6 sm:p-8 rounded-3xl bg-bg-surface/50 border border-border text-center my-4 sm:my-6">
                    <div className="p-3 sm:p-4 rounded-2xl bg-accent/10 border border-accent/20 w-fit mx-auto">
                      <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-wider">Uncompiled Strategic Canvas</h4>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-2 leading-relaxed font-sans">
                        Ready to synthesize your finalized strategy? Gemini will aggregate and summarize your GTM Strategy Draft input from Step 11 into a complete 9-pillar executive dashboard canvas.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateStrategyCanvas}
                      disabled={isGeneratingCanvas}
                      className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-40"
                    >
                      {isGeneratingCanvas ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                      Compile Strategy Canvas
                    </button>
                  </div>
                ) : (
                  /* 3x3 Bento Canvas Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

            {/* Step 13: Revenue Decomposition */}
            {activeStep === 13 && (
              <RevenueDecomposition
                project={currentProject}
                updateProject={(updates) => {
                  const updatedProject = { ...currentProject, ...updates };
                  const nextList = projectsList.map(p => p.id === currentProjectId ? updatedProject : p);
                  syncWithCloud(nextList, currentProjectId);
                }}
                nextStep={() => handleStepChange(14)}
                prevStep={() => handleStepChange(12)}
              />
            )}

            {/* Step 14: GTM Simulation */}
            {activeStep === 14 && (
              <GTMSimulationEngine
                currentProject={currentProject}
                projectsList={projectsList}
                setProjectsList={setProjectsList}
                syncWithCloud={syncWithCloud}
              />
            )}

            {/* Step 15: GTM Execution Engine */}
            {activeStep === 15 && (
              <GTMExecutionEngine
                project={currentProject}
                onSavePlan={handleSaveExecutionPlan}
                onArchivePlan={handleArchiveExecutionPlan}
                isGenerating={isGeneratingExecutionPlan}
                onGenerate={runExecutionEngineGeneration}
              />
            )}

            {/* Step 16: Execution Pipeline */}
            {activeStep === 16 && (
              <ExecutionPipeline
                projects={projectsList}
                currentProjectId={currentProjectId}
                onUpdateProjectPlan={handleUpdateProjectArchivedPlan}
              />
            )}

            {/* Step 17: Execution Dashboard */}
            {activeStep === 17 && (
              <ExecutionDashboard
                projects={projectsList}
                currentProjectId={currentProjectId}
              />
            )}

            {/* Step 18: Risk Detection */}
            {activeStep === 18 && (
              <div className="space-y-4 sm:space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-accent/5 border border-accent/20 gap-4">
                  <div className="flex gap-2.5 items-start">
                    <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-text-primary">Operational Risks Detection audit</h4>
                      <p className="text-[10px] sm:text-[11px] text-text-secondary font-sans leading-normal">Analyzes structural discrepancies across GTM channels and highlights mitigations.</p>
                    </div>
                  </div>

                  <button
                    onClick={runRiskAudit}
                    disabled={isGeneratingAudit}
                    className="w-full sm:w-auto px-4 py-2 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isGeneratingAudit ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Generating Audit...
                      </>
                    ) : (
                      'Run Risks Detection Audit'
                    )}
                  </button>
                </div>

                {currentProject.riskReasoningLog && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface/30 border border-accent/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                        <BrainCircuit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-text-primary uppercase tracking-wider">Gemini System Reasoning</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-text-secondary leading-relaxed font-sans prose prose-invert max-w-none prose-p:my-1 prose-headings:text-text-primary prose-a:text-accent prose-strong:text-text-primary">
                        <ReactMarkdown>{currentProject.riskReasoningLog}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                    <div key={r.id} className="p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1 border-b border-border/40 pb-3">
                        <div className={`w-fit px-2.5 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          r.level === 'Red' ? 'bg-red-500/15 text-red-500 border-red-500/30 shadow-lg shadow-red-500/10' : 
                          r.level === 'Orange' ? 'bg-orange-500/15 text-orange-500 border-orange-500/30 shadow-lg shadow-orange-500/10' : 
                          'bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-lg shadow-amber-500/10'
                        }`}>
                          <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {r.level} Risk
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                          <div className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            r.impact === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            r.impact === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            <AlertOctagon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Impact: {r.impact}
                          </div>
                          <div className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            r.probability === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            r.probability === 'Medium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Prob: {r.probability}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-text-primary mt-1">{r.title}</h4>
                      <p className="text-[11px] sm:text-xs text-text-secondary leading-normal font-sans">{r.description}</p>
                      
                      <div className="p-3 sm:p-3.5 bg-bg-primary/50 text-text-secondary rounded-xl border border-border/80 text-[10px] sm:text-[11px] font-sans leading-relaxed flex flex-col gap-1 sm:gap-1.5 text-left">
                        <span className="font-bold text-accent uppercase tracking-wider text-[8px] sm:text-[9px]">Proactive Mitigation</span>
                        {r.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 19: AI Optimization recommendations */}
            {activeStep === 19 && (
              <div className="space-y-4 sm:space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-accent/5 border border-accent/20 gap-4">
                  <div className="flex gap-2.5 items-start">
                    <Bookmark className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-text-primary">Pivotal Actions & Optimization</h4>
                      <p className="text-[10px] sm:text-[11px] text-text-secondary font-sans leading-normal">Evaluates detected risks and structural gaps to surface high-leverage growth opportunities through Gemini reasoning.</p>
                    </div>
                  </div>

                  <button
                    onClick={runRiskAudit}
                    disabled={isGeneratingAudit}
                    className="w-full sm:w-auto px-4 py-2 bg-accent text-black font-extrabold text-[11px] sm:text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isGeneratingAudit ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        Generating Pivots...
                      </>
                    ) : (
                      'Run Optimization Audit'
                    )}
                  </button>
                </div>

                {currentProject.riskReasoningLog && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-bg-surface/30 border border-accent/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3 border-b border-border/40 pb-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                        <BrainCircuit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-text-primary uppercase tracking-wider">Gemini System Reasoning</span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-text-secondary leading-relaxed font-sans prose prose-invert max-w-none prose-p:my-1 prose-headings:text-text-primary prose-a:text-accent prose-strong:text-text-primary">
                        <ReactMarkdown>{currentProject.riskReasoningLog}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                    <div key={rec.id} className="p-4 sm:p-5 rounded-2xl bg-bg-surface/50 border border-border flex flex-col space-y-3 sm:space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1 border-b border-border/40 pb-3">
                        <span className="w-fit px-2.5 py-1.5 rounded-xl border border-accent/30 bg-accent/10 text-accent text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-accent/10">
                          <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {rec.category}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                          <div className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            rec.impact === 'High' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                            rec.impact === 'Moderate' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            'bg-gray-500/10 border-gray-500/20 text-gray-400'
                          }`}>
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Impact: {rec.impact}
                          </div>
                          
                          <div className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            rec.effort === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            rec.effort === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-green-500/10 border-green-500/20 text-green-400'
                          }`}>
                            <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Effort: {rec.effort}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-text-primary mt-1">{rec.title}</h4>
                      
                      <div className="p-3 sm:p-3.5 bg-bg-primary/50 text-text-secondary rounded-xl border border-border/80 text-[10px] sm:text-[11px] font-sans leading-relaxed flex flex-col gap-1 sm:gap-1.5 text-left">
                        <span className="font-bold text-accent uppercase tracking-wider text-[8px] sm:text-[9px]">Actionable Pivot</span>
                        {rec.actionableSteps}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 20: Executive/Boardroom Insights */}
            {activeStep === 20 && (
              <ExecutiveDashboard 
                project={currentProject} 
                onRefresh={runRiskAudit} 
                isRefreshing={isGeneratingAudit} 
              />
            )}

            {/* Step 21: Executive Dashboard Engine */}
            {activeStep === 21 && (
              <ExecutiveDashboardEngine project={currentProject} onUpdate={handleUpdateExecutiveDashboardRollup} />
            )}

            {/* Step 22: GTM Report */}
            {activeStep === 22 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] sm:min-h-[400px] space-y-4 sm:space-y-6 px-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary">GTM Report System</h2>
                  <p className="text-[11px] sm:text-xs text-text-secondary max-w-lg mx-auto">
                    Generate a comprehensive PDF report combining intelligence from all modules.
                    Configure the components you wish to include, review the layout, and save or print the final document.
                  </p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-accent text-black font-black text-sm sm:text-lg rounded-2xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 hover:scale-105 active:scale-95"
                >
                  Configure & Generate Report
                </button>
                {isReportModalOpen && (
                  <GTMReportReviewModal project={currentProject} onClose={() => setIsReportModalOpen(false)} />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent Horizontal Sequential navigation bar (Back / Continue step buttons) */}
      <div className="flex flex-row justify-between items-center pt-5 border-t border-border gap-2 sm:gap-4">
        {/* Left Aligned - Back button & optional save status indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleStepChange(activeStep - 1)}
            disabled={activeStep <= 1}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border text-text-secondary hover:text-text-primary text-[10px] sm:text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Previous Phase
          </button>

          {activeStep >= 2 && activeStep <= 9 && (
            <>
              {saveState === 'dirty' && (
                <span className="hidden md:flex text-[10px] sm:text-xs font-mono text-yellow-500 animate-pulse items-center gap-1.5 ml-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Unsaved modifications detected
                </span>
              )}
              {saveState === 'saved' && (
                <span className="hidden md:flex text-[10px] sm:text-xs font-mono text-accent items-center gap-1.5 ml-1 animate-in fade-in slide-in-from-left-2 duration-200">
                  <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                  All progress securely saved
                </span>
              )}
            </>
          )}
        </div>

        {/* Center - branding or identity */}
        <div className="text-[10px] font-mono text-text-secondary/50 font-extrabold uppercase select-none tracking-widest hidden lg:block">
          REVOS GTM STRATEGIC REGISTER
        </div>

        {/* Right Aligned - Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end">
          {activeStep >= 2 && activeStep <= 9 && (
            <button
              onClick={handleSaveClickGlobal}
              disabled={saveState === 'saving'}
              className={`hidden sm:flex px-4 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all items-center justify-center gap-1 sm:gap-2 border cursor-pointer h-9 sm:h-10 ${
                saveState === 'dirty'
                  ? 'bg-accent/15 hover:bg-accent text-accent hover:text-black border-accent/40 shadow-lg shadow-accent/5'
                  : 'bg-bg-primary hover:bg-bg-primary/80 text-text-primary border-border/80'
              }`}
            >
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Save
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
            disabled={activeStep >= 21 || saveState === 'saving'}
            className="px-3 sm:px-5 py-2 bg-accent hover:bg-accent/90 text-black font-extrabold text-[10px] sm:text-xs rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 sm:gap-1.5 shadow h-9 sm:h-10 cursor-pointer"
          >
            {activeStep >= 2 && activeStep <= 9 && saveState === 'dirty' ? (
              <>
                Save & Proceed
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
              </>
            ) : (
              <>
                Next Phase
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
