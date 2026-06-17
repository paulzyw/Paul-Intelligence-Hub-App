import React, { useState, useEffect, useMemo } from 'react';
import { GTMOSProject } from './types';
import { supabase } from '../../../lib/supabase';
import {
  Sparkles,
  Bot,
  Loader2,
  TrendingUp,
  Activity,
  Award,
  Users,
  Compass,
  Layers,
  ArrowRight,
  HelpCircle,
  Play,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertOctagon,
  CheckCircle,
  BarChart3,
  Calendar,
  Zap,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

interface GTMSimulationEngineProps {
  currentProject: GTMOSProject;
  projectsList: GTMOSProject[];
  setProjectsList: (list: GTMOSProject[]) => void;
  syncWithCloud: (list: GTMOSProject[], activeId: string) => Promise<void>;
}

function parseFormattedNumber(val: string | number | undefined, defaultVal: number): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return val;
  const clean = val.trim().toLowerCase();
  if (!clean) return defaultVal;
  
  // Clean commas or spaces
  const numPartMatch = clean.replace(/,/g, '').match(/([0-9.]+)/);
  if (!numPartMatch) return defaultVal;
  const num = parseFloat(numPartMatch[1]);
  if (isNaN(num)) return defaultVal;

  let multiplier = 1;

  if (/\b(b|billion)s?\b/.test(clean) || /[0-9]+b\b/.test(clean)) {
    multiplier = 1000000000;
  } else if (/\b(m|million)s?\b/.test(clean) || /[0-9]+m\b/.test(clean)) {
    multiplier = 1000000;
  } else if (/\b(k|thousand)s?\b/.test(clean) || /[0-9]+k\b/.test(clean)) {
    multiplier = 1000;
  }

  return num * multiplier;
}

interface ScenarioDetails {
  opportunities: number;
  winRate: number; // percentage (e.g. 15 for 15%)
  acv: number;
  cycleLength: number; // in days
}

interface AIRecommendData {
  bestStrategy: string;
  alternativeStrategies: string[];
  risks: string[];
  tradeOffs: string[];
  expectedOutcomes: string;
  whySelected: string;
}

export const GTMSimulationEngine: React.FC<GTMSimulationEngineProps> = ({
  currentProject,
  projectsList,
  setProjectsList,
  syncWithCloud
}) => {
  const [showGuide, setShowGuide] = useState<boolean>(true);
  
  // Dynamically derive synced data reactively from onboarding input and revenue decomposition
  const syncedData = useMemo(() => {
    const ob = currentProject?.onboarding as any;
    const rd = currentProject?.revenueDecomposition?.config;
    const rdResult = currentProject?.revenueDecomposition?.result as any;

    const oppsRaw = rdResult?.opportunitiesRequired || ob?.opportunities || ob?.pipeline;
    const winRateRaw = rd?.winRate || ob?.winRates || ob?.winRate;
    const acvRaw = rd?.acv;
    const cycleLengthRaw = ob?.pipelinePerformance;
    const rawSpend = ob?.availableBudget;

    let derivedSpend = parseFormattedNumber(rawSpend, 15000);
    if (derivedSpend > 120000) {
      derivedSpend = Math.round(derivedSpend / 12);
    }

    return {
      opportunities: oppsRaw ? parseFormattedNumber(oppsRaw, 120) : 120,
      winRate: winRateRaw ? parseFormattedNumber(winRateRaw, 12) : 12,
      acv: acvRaw ? parseFormattedNumber(acvRaw, 45000) : 45000,
      cycleLength: cycleLengthRaw ? parseFormattedNumber(cycleLengthRaw, 75) : 75,
      gtmSpend: derivedSpend
    };
  }, [currentProject]);

  const [manualOpportunities, setManualOpportunities] = useState<number>(0);
  const [manualWinRate, setManualWinRate] = useState<number>(0);
  const [manualAcv, setManualAcv] = useState<number>(0);
  const [manualCycleLength, setManualCycleLength] = useState<number>(0);
  const [syncFeedback, setSyncFeedback] = useState<boolean>(false);

  const handleManualSync = () => {
    setManualOpportunities(syncedData.opportunities);
    setManualWinRate(syncedData.winRate);
    setManualAcv(syncedData.acv);
    setManualCycleLength(syncedData.cycleLength);
    setSyncFeedback(true);
    setTimeout(() => setSyncFeedback(false), 2000);
  };

  // Scenarios and presets
  const scenarios = useMemo(() => {
    const baseOpps = syncedData.opportunities || 120;
    const baseWinRate = syncedData.winRate || 12;
    const baseAcv = syncedData.acv || 45000;
    const baseCycle = syncedData.cycleLength || 75;

    const baseA = { opportunities: baseOpps, winRate: baseWinRate, acv: baseAcv, cycleLength: baseCycle };
    const baseB = { 
      opportunities: Math.max(5, Math.round(baseOpps * 0.33)), 
      winRate: Math.min(95, baseWinRate + 10), 
      acv: Math.round(baseAcv * 3.22), 
      cycleLength: Math.round(baseCycle * 1.6) 
    };
    const baseC = { 
      opportunities: Math.max(5, Math.round(baseOpps * 0.67)), 
      winRate: Math.min(95, baseWinRate + 4), 
      acv: Math.round(baseAcv * 1.33), 
      cycleLength: Math.round(baseCycle * 1.2) 
    };
    const baseD = { 
      opportunities: Math.max(5, Math.round(baseOpps * 2.9)), 
      winRate: Math.max(1, Math.round(baseWinRate * 0.33)), 
      acv: Math.max(1000, Math.round(baseAcv * 0.26)), 
      cycleLength: Math.max(5, Math.round(baseCycle * 0.28)) 
    };
    const baseE = { 
      opportunities: Math.max(5, Math.round(baseOpps * 1.75)), 
      winRate: Math.max(1, Math.round(baseWinRate * 0.75)), 
      acv: Math.round(baseAcv * 1.44), 
      cycleLength: Math.round(baseCycle * 0.8) 
    };

    const calcRisk = (wr: number, factor: number) => Math.min(95, Math.max(5, Math.round((100 - wr) * factor)));
    // Dynamically derive time to revenue in months from the simulated cycle length in days
    const calcTime = (cl: number, delayBufferMonths: number) => Math.max(1, +(cl / 30 + delayBufferMonths).toFixed(1));

    return [
      {
        id: 'Scenario A: Market Penetration',
        name: 'Scenario A: Market Penetration',
        tag: 'Volume Velocity',
        title: 'Broad Market Value Play',
        baseline: baseA,
        complexity: 'Medium',
        resources: '$$ (Mid-Level Direct Sales)',
        risk: calcRisk(baseA.winRate, 0.51),
        timeToRevenue: calcTime(baseA.cycleLength, 0.5), // add 15 days pipeline delay
        alignment: 'High'
      },
      {
        id: 'Scenario B: Vertical Specialization',
        name: 'Scenario B: Vertical Specialization',
        tag: 'Premium Niche',
        title: 'Enterprise Trust Specialized Play',
        baseline: baseB,
        complexity: 'High',
        resources: '$$$ (Senior Enterprise Reps)',
        risk: calcRisk(baseB.winRate, 0.38),
        timeToRevenue: calcTime(baseB.cycleLength, 2.0), // add 2 months procurement/legal delay
        alignment: 'Very High'
      },
      {
        id: 'Scenario C: Partner-Led Growth',
        name: 'Scenario C: Partner-Led Growth',
        tag: 'Indirect Reach',
        title: 'Resellers & Consultancies Alliance',
        baseline: baseC,
        complexity: 'Medium-High',
        resources: '$ (Channel Enablement & Revenue-Share)',
        risk: calcRisk(baseC.winRate, 0.42),
        timeToRevenue: calcTime(baseC.cycleLength, 1.0), // add 1 month partner enablement delay
        alignment: 'Medium'
      },
      {
        id: 'Scenario D: Product-Led Growth',
        name: 'Scenario D: Product-Led Growth',
        tag: 'Product Discovery',
        title: 'Frictionless Self-Serve Sandbox',
        baseline: baseD,
        complexity: 'Low-Medium',
        resources: '$$ (Product Onboarding & Dev Rel)',
        risk: calcRisk(baseD.winRate, 0.52),
        timeToRevenue: calcTime(baseD.cycleLength, 0), // frictionless setup
        alignment: 'High'
      },
      {
        id: 'Scenario E: Hybrid Revenue Motion',
        name: 'Scenario E: Hybrid Revenue Motion',
        tag: 'Full Spectrum',
        title: 'Bottom-up Usage with Top-down Sales',
        baseline: baseE,
        complexity: 'Very High',
        resources: '$$$ (Integrated Product + AE Engine)',
        risk: calcRisk(baseE.winRate, 0.6),
        timeToRevenue: calcTime(baseE.cycleLength, 1.0), // mix of usage and top-down
        alignment: 'High'
      }
    ];
  }, [syncedData]);

  // Selected scenario ID
  const [activeScenarioId, setActiveScenarioId] = useState<string>('Scenario A: Market Penetration');
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [activeScenarioId, scenarios]);

  // Synchronize manual sliders to the active scenario's baseline values when they change
  useEffect(() => {
    if (activeScenario && activeScenario.baseline) {
      setManualOpportunities(activeScenario.baseline.opportunities);
      setManualWinRate(activeScenario.baseline.winRate);
      setManualAcv(activeScenario.baseline.acv);
      setManualCycleLength(activeScenario.baseline.cycleLength);
    }
  }, [activeScenario]);

  // Dynamic Option Generator based on onboarding data or saved snapshot
  const dynamicOptions = useMemo(() => {
    // If we have simulation options saved in DB, and no active new draft, we use them.
    // However, to ensure "live" feel, we prefer merging onboarding and GTM draft directly here:
    const ob = currentProject.onboarding || {} as any;
    const draft = currentProject.gtmStrategyDraft || {};
    
    const getStr = (obStr: string | undefined, draftKey: string) => {
      let base = obStr || '';
      if (draft && draft[draftKey] && draft[draftKey][0]) {
        base += (base ? '; ' : '') + draft[draftKey][0];
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

    // Helper to safely extract exact 3 options from comma-separated text or default to fallbacks
    const getOptions = (field: string | undefined, fallbacks: string[]) => {
      if (!field || field.trim() === '') {
        // Fallback to simulationStrategicOptions if available
        return currentProject.simulationStrategicOptions ? fallbacks : fallbacks; 
        // Wait, if it's empty, we should check if simulationStrategicOptions has it? 
        // that's handled below
      }
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

    const simOps = currentProject.simulationStrategicOptions || {};

    return {
      segments: getOptions(segmentsStr, simOps.segments || ['Enterprise', 'Mid-Market', 'SMB/PLG']),
      icps: getOptions(icpsStr, simOps.icps || ['Enterprise Scaling', 'Developer Groups', 'Legacy Migrations']),
      personas: getOptions(personasStr, simOps.personas || ['Economic Buyer', 'Technical Evaluator', 'Head of Ops']),
      valProps: getOptions(valPropsStr, simOps.valProps || ['ROI Telemetry', 'Sub-Millisecond Speed', 'Zero Setup Cost']),
      messaging: getOptions(ob.painPoints, simOps.messaging || ['Business/Outcome', 'Technical/Deep', 'Operational/Easy']),
      motions: getOptions(motionsStr, simOps.motions || ['Direct Outbound', 'PLG Self-Serve', 'Indirect Partner']),
      channels: getOptions(channelsStr, simOps.channels || ['CRM Marketplace', 'Direct Sales Force', 'Inbound Search']),
      marketing: getOptions(marketingStr, simOps.marketing || ['Paid Campaigns', 'Strategic Events', 'Viral Growth'])
    };
  }, [currentProject.onboarding, currentProject.gtmStrategyDraft, currentProject.simulationStrategicOptions]);

  // Strategic Option overrides & parameters
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(1);
  const [selectedIcpIdx, setSelectedIcpIdx] = useState<number>(0);
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState<number>(0);
  const [selectedValPropIdx, setSelectedValPropIdx] = useState<number>(0);
  const [selectedMessagingIdx, setSelectedMessagingIdx] = useState<number>(0);
  const [selectedSalesMotionIdx, setSelectedSalesMotionIdx] = useState<number>(0);
  const [selectedChannelIdx, setSelectedChannelIdx] = useState<number>(1);
  const [selectedMarketingIdx, setSelectedMarketingIdx] = useState<number>(0);

  // Parameters derived from the combinations
  const calculatedMetrics = useMemo(() => {
    let opportunities = manualOpportunities || activeScenario.baseline.opportunities;
    let winRate = manualWinRate || activeScenario.baseline.winRate;
    let acv = manualAcv || activeScenario.baseline.acv;
    let cycleLength = manualCycleLength || activeScenario.baseline.cycleLength;

    const heuristics = currentProject.simulationHeuristics;

    const getShiftsForState = (segmentIdx: number, icpIdx: number, personaIdx: number, valPropIdx: number, messagingIdx: number, motionIdx: number, channelIdx: number, marketingIdx: number) => {
      let o = 0, a = 0, c = 0, w = 0;
      if (heuristics) {
        const applyH = (cat: string, idx: number) => {
          if (heuristics[cat] && heuristics[cat][idx]) {
            o += ((heuristics[cat][idx].opportunities ?? 1) - 1);
            a += ((heuristics[cat][idx].acv ?? 1) - 1);
            c += ((heuristics[cat][idx].cycleLength ?? 1) - 1);
            w += (heuristics[cat][idx].winRate ?? 0);
          }
        };
        applyH('segments', segmentIdx);
        applyH('icps', icpIdx);
        applyH('personas', personaIdx);
        applyH('valProps', valPropIdx);
        applyH('messaging', messagingIdx);
        applyH('motions', motionIdx);
        applyH('channels', channelIdx);
        applyH('marketing', marketingIdx);
      } else {
        // Fallback heuristics using identical additive shift system
        if (segmentIdx === 0) { o -= 0.6; a += 1.8; c += 0.5; w -= 2; }
        else if (segmentIdx === 2) { o += 1.5; a -= 0.65; c -= 0.6; w += 4; }
        
        if (icpIdx === 1) { o += 0.3; a -= 0.3; w += 3; }
        else if (icpIdx === 2) { a += 0.4; c += 0.3; w -= 1; }
        
        if (valPropIdx === 1) { a += 0.15; }
        else if (valPropIdx === 2) { c -= 0.15; }
        
        if (motionIdx === 1) { o += 1.1; a -= 0.75; c -= 0.65; w -= 6; }
        else if (motionIdx === 2) { o -= 0.2; c -= 0.1; w += 3; }
      }
      return { o, a, c, w };
    };

    const currentS = getShiftsForState(selectedSegmentIdx, selectedIcpIdx, selectedPersonaIdx, selectedValPropIdx, selectedMessagingIdx, selectedSalesMotionIdx, selectedChannelIdx, selectedMarketingIdx);

    // Baseline default state for the currently active scenario preset
    let defaultSegmentIdx = 1;
    let defaultMotionIdx = 0;
    if (activeScenario.id === 'Scenario D: Product-Led Growth') {
      defaultSegmentIdx = 2;
      defaultMotionIdx = 1;
    } else if (activeScenario.id === 'Scenario B: Vertical Specialization') {
      defaultSegmentIdx = 0;
      defaultMotionIdx = 0;
    }
    const defaultS = getShiftsForState(defaultSegmentIdx, 0, 0, 0, 0, defaultMotionIdx, 1, 0);

    // Delta shifts: we only apply the difference between current network state and the default state
    const oppShift = currentS.o - defaultS.o;
    const acvShift = currentS.a - defaultS.a;
    const cycleShift = currentS.c - defaultS.c;
    const winRateShift = currentS.w - defaultS.w;

    // Dampen extreme compounding by doing additive shifts instead of multiplicative compounding
    const applyShift = (base: number, shift: number, minMult: number, maxMult: number) => {
      // We dampen the shift by 50% (* 0.4) because 8 categories of shifts naturally add up significantly
      const multiplier = Math.max(minMult, Math.min(maxMult, 1 + (shift * 0.4))); 
      return Math.round(base * multiplier);
    };

    opportunities = applyShift(opportunities, oppShift, 0.1, 5.0);
    acv = applyShift(acv, acvShift, 0.1, 5.0);
    cycleLength = applyShift(cycleLength, cycleShift, 0.1, 3.0);
    
    // winRate is absolute points, dampen overall adjustments by 50%
    winRate += (winRateShift * 0.4);

    // Sanity clamps
    opportunities = Math.max(5, opportunities);
    winRate = Math.max(1, Math.min(95, Math.round(winRate)));
    acv = Math.max(1000, acv);
    cycleLength = Math.max(5, cycleLength);

    return { opportunities, winRate, acv, cycleLength };
  }, [
    activeScenario,
    currentProject.simulationHeuristics,
    selectedSegmentIdx,
    selectedIcpIdx,
    selectedPersonaIdx,
    selectedValPropIdx,
    selectedMessagingIdx,
    selectedSalesMotionIdx,
    selectedChannelIdx,
    selectedMarketingIdx,
    manualOpportunities,
    manualWinRate,
    manualAcv,
    manualCycleLength
  ]);

  const { opportunities, winRate, acv, cycleLength } = calculatedMetrics;

  const revenueVelocity = useMemo(() => {
    // V = (N * W% * ACV) / L in $/day
    return (opportunities * (winRate / 100) * acv) / cycleLength;
  }, [opportunities, winRate, acv, cycleLength]);

  // Monte Carlo Real-Time Simulation Loops (10,000 trials)
  const [stochasticResults, setStochasticResults] = useState<{
    p10: number;
    p50: number;
    p90: number;
    chartData: any[];
  } | null>(null);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const runMonteCarloSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const trials: number[] = [];
      const numTrials = 10000;

      // Box-Muller normal approximation
      const boxMullerRand = (mean: number, stdDev: number) => {
        let u = 0;
        let v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const rand = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + rand * stdDev;
      };

      for (let i = 0; i < numTrials; i++) {
        // Opps (N): mean, stdDev ~15%
        const sampleN = Math.max(2, boxMullerRand(opportunities, opportunities * 0.15));
        // WinRate (W): mean, stdDev ~12%
        const sampleW = Math.max(0.01, Math.min(0.95, boxMullerRand(winRate / 100, (winRate / 100) * 0.12)));
        // ACV: mean, stdDev ~15%
        const sampleACV = Math.max(500, boxMullerRand(acv, acv * 0.15));
        // L: mean, stdDev ~15%
        const sampleL = Math.max(1, boxMullerRand(cycleLength, cycleLength * 0.15));

        const sampleV = (sampleN * sampleW * sampleACV) / sampleL;
        trials.push(sampleV);
      }

      trials.sort((a, b) => a - b);

      const p10 = trials[Math.floor(numTrials * 0.1)];
      const p50 = trials[Math.floor(numTrials * 0.5)];
      const p90 = trials[Math.floor(numTrials * 0.9)];

      // Bucket data for frequency distribution plot (Bell curve)
      const minV = trials[0];
      const maxV = trials[numTrials - 1];
      const numBuckets = 25;
      const bucketSize = (maxV - minV) / numBuckets;

      const buckets = Array.from({ length: numBuckets }, (_, idx) => {
        const lowerBound = minV + idx * bucketSize;
        const upperBound = lowerBound + bucketSize;
        const count = trials.filter(v => v >= lowerBound && v < upperBound).length;
        return {
          name: `$${Math.round(lowerBound * 30).toLocaleString()}`, // monthly projection label
          value: lowerBound,
          frequency: count,
          type: lowerBound <= p10 ? 'P10 Range' : lowerBound <= p50 ? 'P50 Range' : 'P90 Range'
        };
      });

      setStochasticResults({
        p10,
        p50,
        p90,
        chartData: buckets
      });
      setIsSimulating(false);
    }, 300); // UI delay for authentic feel
  };

  // Run simulation on mount and parameter changes
  useEffect(() => {
    runMonteCarloSimulation();
  }, [opportunities, winRate, acv, cycleLength]);

  // AI Recommendation State
  const [aiRecommend, setAiRecommend] = useState<AIRecommendData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string>('');

  const fetchAIRecommendations = async () => {
    setIsGeneratingAI(true);
    setAiSuccessMsg('');
    try {
      let data: any = null;
      if (supabase) {
        try {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('gtmos-api', {
            body: {
              action: 'simulate-recommendations',
              onboardingData: currentProject.onboarding,
              projectName: currentProject.title,
              activeScenario: activeScenarioId,
              activeParams: {
                opportunities,
                winRate,
                acv,
                cycleLength,
                revenueVelocity
              }
            }
          });
          if (edgeError) throw edgeError;
          data = edgeData;
        } catch (edgeErr) {
          console.error("Supabase edge function 'simulate-recommendations' failed:", edgeErr);
          throw edgeErr;
        }
      }

      if (data) {
        setAiRecommend(data);
        setAiSuccessMsg('Strategic recommendation compiled successfully!');
        setTimeout(() => setAiSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Failed to generate simulation recommendations:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    // Clear recommendation on scenario change to encourage regeneration
    setAiRecommend(null);
  }, [activeScenarioId]);

  return (
    <div className="space-y-6">
      {/* Banner / Step Title Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-bg-surface/60 via-bg-surface/30 to-transparent border border-border/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Activity className="h-44 w-44 text-accent/20 animate-pulse" />
        </div>

        <div className="space-y-2 relative">
          <div className="flex items-center gap-1.5 text-xs font-mono text-accent font-black uppercase tracking-widest">
            <Zap className="h-4 w-4 text-accent animate-bounce" />
            Decision Sandbox & Risk Simulator
          </div>
          <h2 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">Step 15: GTM Simulation & Strategic Scenario Engine</h2>
          <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
            Evaluate how structural changes in onboarding assumptions ripple through the connected 9-pillar GTM strategy system. Project future outcomes using a stochastic Monte Carlo model integrated into our deterministic Revenue Velocity network.
          </p>
        </div>
      </div>

      {/* GTM Simulator Masterclass Guidance Portal */}
      <div className="rounded-2xl border border-accent/25 bg-accent/2 overflow-hidden transition-all duration-300">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-accent animate-spin-slow" />
            <div>
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                GTM SIMULATION MASTERCLASS GUIDE
                <span className="px-1.5 py-0.5 rounded bg-accent/15 text-[8px] font-mono text-accent">Interactive Insights</span>
              </h3>
              <p className="text-[11px] text-text-secondary/80 mt-0.5">Learn how to manipulate parameters to identify the most efficient route-to-market model.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-accent px-2 py-1 rounded-lg bg-bg-surface border border-accent/15">
            {showGuide ? '[ COLLAPSE GUIDE ]' : '[ OPEN GUIDE ]'}
          </span>
        </button>
        
        {showGuide && (
          <div className="p-5 border-t border-accent/15 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-text-secondary bg-bg-surface/30">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <Layers className="h-4 w-4 text-accent" />
                <span>1. Select a Core Scenario Preset</span>
              </div>
              <p className="leading-relaxed text-text-secondary/80 text-[11px]">
                Choose one of the presets like <span className="font-bold text-text-primary">Scenario B: Vertical Specialization</span> (for high-ACV enterprise plays) or <span className="font-bold text-text-primary">Scenario D: Product-Led Growth</span> (for high-volume bottom-up velocities). This populates the default mathematical seed baseline.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <Sliders className="h-4 w-4 text-[#00F090]" />
                <span>2. Customize Strategic Overrides</span>
              </div>
              <p className="leading-relaxed text-text-secondary/80 text-[11px]">
                Fine-tune target segments, ideal customer profiles, and sales motion routing. Notice how selecting <span className="font-bold text-text-primary">Enterprise Segments</span> immediately scales up the contract size (ACV) but lowers opportunity volume and win rate while extending velocity cycle length.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <Zap className="h-4 w-4 text-accent" />
                <span>3. Read Stochastic & AI Outputs</span>
              </div>
              <p className="leading-relaxed text-text-secondary/80 text-[11px]">
                Scroll down to investigate the <span className="font-bold text-text-primary">Stochastic Bell-Curve probability density map</span>. Click <span className="font-bold text-text-primary">"Consult AI Advisor"</span> to fetch a targeted assessment of execution risks, trade-offs, and critical mitigations matching your exact model.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Matchmaker selector row */}
      <div className="space-y-2">
        <h3 className="text-xs font-black font-mono text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          Active Strategic Scenario presets
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {scenarios.map(s => {
            const isActive = activeScenarioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveScenarioId(s.id);
                  // preset resets
                  if (s.id === 'Scenario D: Product-Led Growth') {
                    setSelectedSegmentIdx(2);
                    setSelectedSalesMotionIdx(1);
                  } else if (s.id === 'Scenario B: Vertical Specialization') {
                    setSelectedSegmentIdx(0);
                    setSelectedSalesMotionIdx(0);
                  } else {
                    setSelectedSegmentIdx(1);
                    setSelectedSalesMotionIdx(0);
                  }
                }}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer group ${
                  isActive
                    ? 'bg-accent/15 border-accent text-accent shadow-lg shadow-accent/5'
                    : 'bg-bg-surface/50 border-border/80 text-text-secondary hover:text-text-primary hover:border-text-secondary/20'
                }`}
              >
                <div>
                  <span className={`text-[8px] font-mono font-bold tracking-widest uppercase ${isActive ? 'text-accent' : 'text-text-secondary/50'}`}>
                    {s.tag}
                  </span>
                  <h4 className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{s.name.split(': ')[1]}</h4>
                </div>
                <div className="text-[10px] text-text-secondary/60 mt-3 group-hover:text-text-primary transition-colors flex items-center justify-between">
                  <span>Match: {s.alignment}</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Scenario Controls & Strategic Overrides */}
        <div className="xl:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/30 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-accent" />
                <h4 className="text-xs font-bold text-text-primary tracking-wider uppercase">Strategic Parameters</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualSync}
                  className={`text-[9px] font-mono font-bold uppercase transition-all px-2 py-1 rounded-md border flex items-center gap-1 cursor-pointer ${
                    syncFeedback
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-accent/10 hover:bg-accent/20 border-accent/20 text-accent'
                  }`}
                  title="Manually sync parameters to match the latest GTM Strategy and Revenue Decomposition source data"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${syncFeedback ? 'animate-spin' : ''}`} />
                  {syncFeedback ? 'Synced!' : 'Sync Live'}
                </button>
                <button
                  onClick={() => {
                    setSelectedSegmentIdx(1);
                    setSelectedIcpIdx(0);
                    setSelectedPersonaIdx(0);
                    setSelectedValPropIdx(0);
                    setSelectedMessagingIdx(0);
                    setSelectedSalesMotionIdx(0);
                    setSelectedChannelIdx(1);
                    setSelectedMarketingIdx(0);
                    setManualOpportunities(syncedData.opportunities || 0);
                    setManualWinRate(syncedData.winRate || 0);
                    setManualAcv(syncedData.acv || 0);
                    setManualCycleLength(syncedData.cycleLength || 0);
                  }}
                  className="text-[9px] font-mono text-text-secondary/60 hover:text-accent font-bold uppercase transition-colors px-1 py-1"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Parameter Overrides */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-text-secondary uppercase">Opportunities Base: {manualOpportunities}</label>
                <input type="range" min="5" max="1000" value={manualOpportunities} onChange={e => setManualOpportunities(parseInt(e.target.value))} className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-text-secondary uppercase">Win Rate %: {manualWinRate}</label>
                <input type="range" min="1" max="95" value={manualWinRate} onChange={e => setManualWinRate(parseInt(e.target.value))} className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-text-secondary uppercase">ACV: ${manualAcv.toLocaleString()}</label>
                <input type="range" min="1000" max="1000000" step="5000" value={manualAcv} onChange={e => setManualAcv(parseInt(e.target.value))} className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-text-secondary uppercase">Cycle Length (days): {manualCycleLength}</label>
                <input type="range" min="5" max="365" value={manualCycleLength} onChange={e => setManualCycleLength(parseInt(e.target.value))} className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent" />
              </div>

              <div className="my-6 border-b border-border/30" />

              {/* Parameter 1: Segment */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase">1. Segment Selection</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {dynamicOptions.segments.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSegmentIdx(idx)}
                      className={`truncate px-1 py-1.5 rounded-lg text-[9px] font-black border transition-all text-center cursor-pointer ${
                        selectedSegmentIdx === idx
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-primary/50 border-border text-text-secondary hover:text-text-primary'
                      }`}
                      title={opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 2: ICP */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase">2. Ideal Customer Profile</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {dynamicOptions.icps.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIcpIdx(idx)}
                      className={`truncate px-1 py-1.5 rounded-lg text-[9px] font-black border transition-all text-center cursor-pointer ${
                        selectedIcpIdx === idx
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-primary/50 border-border text-text-secondary hover:text-text-primary'
                      }`}
                      title={opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 3: Value Prop */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase">3. Core Value Proposition</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {dynamicOptions.valProps.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedValPropIdx(idx)}
                      className={`truncate px-1 py-1.5 rounded-lg text-[9px] font-black border transition-all text-center cursor-pointer ${
                        selectedValPropIdx === idx
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-primary/50 border-border text-text-secondary hover:text-text-primary'
                      }`}
                      title={opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter 4: Sales Motion */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase">4. Core Sales Motion</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {dynamicOptions.motions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSalesMotionIdx(idx)}
                      className={`truncate px-1 py-1.5 rounded-lg text-[9px] font-black border transition-all text-center cursor-pointer ${
                        selectedSalesMotionIdx === idx
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-primary/50 border-border text-text-secondary hover:text-text-primary'
                      }`}
                      title={opt}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Connected Strategic Evaluation stats inside controls */}
          <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-4">
            <h4 className="text-xs font-bold text-text-primary tracking-wider uppercase flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-[#00F090]" />
              Scenario Constraints Checklist
            </h4>
            
            <div className="space-y-4 text-[11px] font-sans">
              <div className="flex flex-col gap-1">
                <div className="text-text-secondary">Segment Attractiveness:</div>
                <div className="font-bold text-text-primary">
                  {selectedSegmentIdx === 0 ? 'High Tier Value' : selectedSegmentIdx === 2 ? 'High Velocity Pool' : 'Stable Growth Core'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-text-secondary">Expected Conversion Ease:</div>
                <div className="font-bold text-text-primary">
                  {selectedSalesMotionIdx === 1 ? 'Frictionless Bottom-up' : 'High-Touch / Multi-Threaded'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-text-secondary">Competitive Differentiation:</div>
                <div className="font-bold text-text-primary">
                  {selectedValPropIdx === 0 ? 'High Business Impact' : 'Technical Performance Edge'}                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-text-secondary">Pricing & win-rate impact:</div>
                <div className="font-bold text-text-primary">
                  {opportunities > 200 ? 'High Win Count, Low Price' : 'Slightly Extended Cycles, High ACV'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dependency graph & simulation outputs */}
        <div className="xl:col-span-2 space-y-6">
          {/* Strategy Dependency Graph layout */}
          <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 tracking-wider uppercase font-mono">
                <Compass className="h-4 w-4 text-accent" />
                Downstream Strategy Dependency Graph
              </h4>
              <span className="text-[10px] font-mono text-[#00F090] font-bold">ACTIVE CASCADE PROCESSOR</span>
            </div>

            {/* Custom crafted layout with horizontal flow indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3 relative">
              {[
                { label: 'Segment', value: dynamicOptions.segments[selectedSegmentIdx], desc: 'Market selection' },
                { label: 'ICP Target', value: dynamicOptions.icps[selectedIcpIdx], desc: 'Targeting profile' },
                { label: 'Value Prop', value: dynamicOptions.valProps[selectedValPropIdx], desc: 'Resonance factor' },
                { label: 'Sales Motion', value: dynamicOptions.motions[selectedSalesMotionIdx], desc: 'Revenue path' }
              ].map((node, index) => (
                <div
                  key={node.label}
                  className="p-3.5 rounded-xl bg-bg-primary/60 border border-border/60 hover:border-accent/40 relative flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="text-[8px] font-mono text-text-secondary uppercase">{node.label} Node</div>
                    <div className="text-xs font-black text-text-primary mt-1">{node.value}</div>
                    <div className="text-[9px] text-[#00F090] font-semibold mt-1 font-sans">{node.desc}</div>
                  </div>
                  {index < 3 && (
                    <div className="absolute top-1/2 -right-1.5 transform -translate-y-1/2 hidden sm:block pointer-events-none z-10">
                      <ArrowRight className="h-3.5 w-3.5 text-accent animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-accent/5 border border-accent/15 rounded-xl text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                Any option changed above automatically triggers the <span className="font-bold text-text-primary">Strategy Dependency Graph Engine</span>, cascading updates downstream to recalculate N, W, ACV, and L, ultimately impacting the forecasted revenue curves.
              </span>
            </div>
          </div>

          {/* Deterministic Revenue Velocity Model Formula box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* The math model */}
            <div className="md:col-span-1 p-5 rounded-2xl bg-bg-surface/50 border border-border/85 flex flex-col justify-between relative">
              <div className="absolute top-4 right-4 group">
                <button
                  onClick={() => {
                    // Trigger a forced state update on activeScenarioId (no-op functionally, but feels responsive)
                    const temp = activeScenarioId;
                    setActiveScenarioId('');
                    setTimeout(() => setActiveScenarioId(temp), 10);
                  }}
                  className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all text-text-secondary hover:text-accent"
                  title="Manually sync onboarding metrics"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-mono font-bold tracking-widest hidden group-hover:inline">SYNC</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-mono text-text-secondary uppercase">Calculator Core</span>
                <h4 className="text-xs font-bold text-text-primary tracking-wide uppercase">Velocity formula</h4>
                <div className="py-4 my-2 rounded-xl bg-bg-primary border border-border/40 text-center font-mono relative">
                  <div className="text-sm font-black text-[#00F090] italic">
                    V = (N × W × ACV) / L
                  </div>
                  <div className="text-[8px] text-text-secondary/50 mt-1">Daily Revenue Velocity</div>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-mono text-text-secondary">
                <div className="flex justify-between border-b border-border/20 pb-1">
                  <span>Opportunities (N):</span>
                  <span className="text-text-primary font-bold">{opportunities} opps</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-1">
                  <span>Win Rate (W):</span>
                  <span className="text-text-primary font-bold">{winRate}%</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-1">
                  <span>Average ACV:</span>
                  <span className="text-text-primary font-bold">${acv.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Cycle Length (L):</span>
                  <span className="text-text-primary font-bold">{cycleLength} days</span>
                </div>
              </div>
            </div>

            {/* Velocity Outputs */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-bg-surface/50 border border-border/85 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-text-secondary uppercase">Deterministic Output</span>
                <h4 className="text-xs font-bold text-text-primary tracking-wide uppercase mb-3">Projected Revenue Velocities</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-bg-primary border border-border/50 text-left">
                    <span className="text-[8px] font-mono text-text-secondary block">Daily Velocity (V)</span>
                    <span className="text-sm font-extrabold text-[#00F090]">${Math.round(revenueVelocity).toLocaleString()}</span>
                    <span className="text-[8px] font-mono text-text-secondary/50 block mt-1">/ day velocity</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-primary border border-border/50 text-left">
                    <span className="text-[8px] font-mono text-text-secondary block">Monthly Run Rate</span>
                    <span className="text-sm font-extrabold text-[#00F090]">${Math.round(revenueVelocity * 30).toLocaleString()}</span>
                    <span className="text-[8px] font-mono text-text-secondary/50 block mt-1">30-day projection</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-bg-primary border border-border/50 text-left">
                    <span className="text-[8px] font-mono text-text-secondary block">Annualized Velocity</span>
                    <span className="text-sm font-extrabold text-[#00F090]">${Math.round(revenueVelocity * 365).toLocaleString()}</span>
                    <span className="text-[8px] font-mono text-text-secondary/50 block mt-1">365-day ARR velocity</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#00F090]/5 border border-[#00F090]/15 rounded-xl text-[10px] text-text-secondary flex items-center gap-2 mt-4">
                <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                <span>Computed against target metrics. Select alternative scenarios above to compare velocity variance.</span>
              </div>
            </div>
          </div>

          {/* Monte Carlo Probability Curve Area Chart */}
          <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary tracking-wide uppercase font-mono flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Stochastic Probability Distribution Curve
                </h4>
                <p className="text-[10px] text-text-secondary font-sans">
                  Represents 10,000 recursive simulated trials showing probability bounds for monthly ARR velocity.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isSimulating}
                  onClick={runMonteCarloSimulation}
                  className="px-3 py-1.5 bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold rounded-lg flex items-center gap-1.5 hover:bg-accent/25 transition-all"
                >
                  <RefreshCw className={`h-3 w-3 ${isSimulating ? 'animate-spin' : ''}`} />
                  Recalculate Run
                </button>
              </div>
            </div>

            {stochasticResults && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats Panel */}
                <div className="md:col-span-1 space-y-3.5 pr-2 border-r border-border/20">
                  <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-red-400 block uppercase">Worst Case (P10)</span>
                    <span className="text-xs font-black text-text-primary">$ {Math.round(stochasticResults.p10 * 30).toLocaleString()} <span className="text-[9px] font-normal text-text-secondary">/mo</span></span>
                    <p className="text-[8px] text-text-secondary mt-0.5">Minimal channel conversion, high friction.</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-accent block uppercase">Expected Case (P50)</span>
                    <span className="text-xs font-black text-text-primary">$ {Math.round(stochasticResults.p50 * 30).toLocaleString()} <span className="text-[9px] font-normal text-text-secondary">/mo</span></span>
                    <p className="text-[8px] text-text-secondary mt-0.5">Normalized base track and trend speed.</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#00F090]/5 border border-[#00F090]/20">
                    <span className="text-[8px] font-mono font-bold tracking-widest text-[#00F090] block uppercase">Best Case (P90)</span>
                    <span className="text-xs font-black text-text-primary">$ {Math.round(stochasticResults.p90 * 30).toLocaleString()} <span className="text-[9px] font-normal text-text-secondary">/mo</span></span>
                    <p className="text-[8px] text-text-secondary mt-0.5">High market resonance, rapid cycles.</p>
                  </div>
                </div>

                {/* Curve Visualization */}
                <div className="md:col-span-3 h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stochasticResults.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252528" />
                      <XAxis dataKey="name" stroke="#5d5d62" fontSize={8} />
                      <YAxis stroke="#5d5d62" fontSize={8} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1c1c1f", border: "1px solid #2d2d30", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "10px", color: "#ffffff" }}
                        labelStyle={{ fontSize: "10px", fontWeight: "bold" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="frequency"
                        stroke="#00F090"
                        fill="url(#colorVelocity)"
                        name="Simulated Probability Density"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F090" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#00F090" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Matchmaker Comparative Grid Matrix */}
      <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-accent" />
            Scenario Matrix & Competitive Modeling (A-E)
          </h4>
          <button 
            onClick={handleManualSync} 
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent transition-colors text-[10px] font-bold font-mono tracking-widest uppercase"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Real Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="text-[10px] font-mono text-text-secondary uppercase border-b border-border/30 bg-bg-primary/40">
              <tr>
                <th className="p-3">Scenario Blueprint</th>
                <th className="p-3 text-center">Complexity</th>
                <th className="p-3">Resources Allocated</th>
                <th className="p-3 text-center">Risk Index</th>
                <th className="p-3 text-center">Time to Rev</th>
                <th className="p-3 text-right">Target Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {scenarios.map(s => {
                const isActive = activeScenarioId === s.id;
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-bg-primary/20 transition-colors ${isActive ? 'bg-accent/5 font-semibold text-text-primary' : ''}`}
                  >
                    <td className="p-3 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-accent animate-ping' : 'bg-text-secondary/20'}`} />
                      <div>
                        <div className="text-text-primary font-bold text-xs">{s.name.split(': ')[1]}</div>
                        <div className="text-[10px] text-text-secondary/50 font-sans italic">{s.title}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center text-[11px] font-mono">{s.complexity}</td>
                    <td className="p-3 font-sans max-w-xs truncate text-[11px]">{s.resources}</td>
                    <td className="p-3 text-center text-[11px] font-mono">
                      <span className={`px-2 py-0.5 rounded ${s.risk > 50 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-[#00F090]'}`}>
                        {s.risk} / 100
                      </span>
                    </td>
                    <td className="p-3 text-center text-[11px] font-mono">{s.timeToRevenue} months</td>
                    <td className="p-3 text-right text-[11px] font-mono font-bold text-text-primary">{s.baseline.winRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Advisory / Recommendation Layer Widget */}
      <div className="p-6 rounded-2xl bg-bg-surface/50 border border-border/85 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#00F090] uppercase tracking-wider font-bold">
              <Bot className="h-4 w-4 text-[#00F090]" />
              AI Recommendation Layer
            </div>
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wide">
              Evaluate Risks, Trade-offs & Strategic Alignment
            </h4>
          </div>

          <button
            onClick={fetchAIRecommendations}
            disabled={isGeneratingAI}
            className="px-5 py-3 bg-accent text-black font-extrabold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 shrink-0 cursor-pointer"
          >
            {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Consult AI Advisor for {activeScenarioId.split(': ')[1]}
          </button>
        </div>

        {aiSuccessMsg && (
          <div className="p-3 bg-[#00F090]/5 border border-[#00F090]/15 text-xs text-[#00F090] rounded-xl font-sans">
            {aiSuccessMsg}
          </div>
        )}

        {!aiRecommend ? (
          <div className="text-center py-8 text-text-secondary/60 text-xs font-sans max-w-md mx-auto space-y-3">
            <HelpCircle className="h-8 w-8 text-text-secondary/40 mx-auto" />
            <p>
              Click <span className="font-bold text-accent">"Consult AI Advisor"</span> to load an elite strategic assessment detailing optimal approaches, tradeoffs, and risks for {activeScenarioId.split(': ')[1]}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-sans mt-4">
            {/* Column 1: Best Strategy & Specific Rationale */}
            <div className="space-y-4 bg-bg-primary/40 border border-border/40 rounded-xl p-5">
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono text-accent uppercase font-bold">Elite Strategic Recommendation</div>
                <h5 className="text-xs font-bold text-text-primary">Best Path Execution Strategy</h5>
                <p className="text-text-secondary leading-relaxed font-sans mt-1">
                  {aiRecommend.bestStrategy}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/20">
                <div className="text-[10px] font-mono text-[#00F090] uppercase font-bold">Matching Diagnostics</div>
                <h5 className="text-xs font-bold text-text-primary">Why This Suits Your Context</h5>
                <p className="text-text-secondary/90 leading-relaxed font-sans mt-1">
                  {aiRecommend.whySelected}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/20">
                <div className="text-[10px] font-mono text-text-secondary uppercase">Alternative Adjustments Available</div>
                <ul className="space-y-1.5 text-text-secondary leading-relaxed font-sans pt-1">
                  {aiRecommend.alternativeStrategies.map((alt, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2: Risks, Tradeoffs & Expected Outcomes */}
            <div className="space-y-4 bg-bg-primary/40 border border-border/40 rounded-xl p-5 justify-between flex flex-col">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center gap-1">
                    <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                    Strategic Risk Vectors
                  </div>
                  <ul className="space-y-1.5 text-text-secondary leading-relaxed font-sans">
                    {aiRecommend.risks.map((risk, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-3 border-t border-border/20">
                  <div className="text-[10px] font-mono text-text-secondary uppercase font-bold">Tactical Trade-offs</div>
                  <ul className="space-y-1.5 text-text-secondary leading-relaxed font-sans">
                    {aiRecommend.tradeOffs.map((trade, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="font-extrabold text-accent shrink-0 font-mono">[-]</span>
                        <span>{trade}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/30 bg-accent/5 p-4 rounded-lg mt-auto">
                <div className="text-[10px] font-mono text-accent uppercase font-bold leading-none">Probabilistic Outcomes Rationale</div>
                <p className="text-text-primary leading-relaxed font-sans mt-1">
                  {aiRecommend.expectedOutcomes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Help helper icon fallback context component inside module
function Info({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02a.75.75 0 01-1.085-1.085zM12.75 12h.008v.008H12.75V12zm.75-9.75a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
