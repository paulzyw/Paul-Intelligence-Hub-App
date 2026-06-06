import React, { useState, useEffect } from 'react';
import { GTMOSSimulationState } from './types';
import { Sliders, TrendingUp, DollarSign, Users, Award, ShieldAlert, RefreshCw, Check } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface SimulationTabProps {
  config: GTMOSSimulationState;
  onChange: (fields: Partial<GTMOSSimulationState>) => void;
  tabMode: 'simulation' | 'forecast'; // simulation is step 12; forecast is step 20
  onboardingData: any;
  onRefreshProjectFromCloud?: () => Promise<void>;
}

function parseFormattedNumber(val: string | number | undefined, defaultVal: number): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return val;
  const clean = val.trim().toLowerCase();
  if (!clean) return defaultVal;
  
  // Clean commas or spaces
  const numPartMatch = clean.replace(/,/g, '').match(/^[$\s-]*([0-9.]+)/);
  if (!numPartMatch) return defaultVal;
  const num = parseFloat(numPartMatch[1]);
  if (isNaN(num)) return defaultVal;

  if (clean.includes('b') || clean.includes('billion')) {
    return num * 1000000000;
  }
  if (clean.includes('m') || clean.includes('million')) {
    return num * 1000000;
  }
  if (clean.includes('k') || clean.includes('thousand')) {
    return num * 1000;
  }
  if (num < 1000 && defaultVal >= 100000) {
    if (defaultVal >= 1000000) return num * 1000000;
    return num * 1000;
  }
  return num;
}

export const SimulationTab: React.FC<SimulationTabProps> = ({
  config,
  onChange,
  tabMode,
  onboardingData,
  onRefreshProjectFromCloud
}) => {
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [forecastingData, setForecastingData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);

  // Base constants derived directly from client onboarding inputs loaded from Supabase
  const baseACV = parseFormattedNumber(onboardingData?.revenueTarget, 75000);
  const initialARR = parseFormattedNumber(onboardingData?.ARR, 24000000);

  const triggerLiveRefresh = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      if (onRefreshProjectFromCloud) {
        await onRefreshProjectFromCloud();
      }
      setIsRefreshing(false);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (err) {
      console.error('Refresh cloud error:', err);
      setIsRefreshing(false);
    }
  };

  // Run Step 12 Simulation math on slider update
  useEffect(() => {
    const dataPoints = [];
    let currentMRR = (initialARR / 12);
    let cumulativeCash = 0;
    
    const baseLeadCost = 150; 
    const channelMultiplier = config.primaryGTMPath === 'plg' ? 0.4 : (config.primaryGTMPath === 'enterprise' ? 1.5 : 1.0);
    const costPerLead = baseLeadCost * config.pricingMultiplier * channelMultiplier;
    
    const leadsCount = config.marketingBudget / costPerLead;
    const actualConversion = config.conversionRate / 100 * config.salesCycleSpeed;
    const newCustomersPerMonth = leadsCount * actualConversion;
    
    // contract pricing seat ACV
    const acvPerCustomerMonthly = (baseACV / 12) * config.pricingMultiplier;
    const monthlyChurnRate = config.primaryGTMPath === 'plg' ? 0.045 : (config.primaryGTMPath === 'enterprise' ? 0.015 : 0.025);
    
    for (let m = 1; m <= 12; m++) {
      const customersWon = Math.round(newCustomersPerMonth * (1 + (m * 0.05))); // slight growth multiplier over months
      const lostMRR = currentMRR * monthlyChurnRate;
      const gainedMRR = customersWon * acvPerCustomerMonthly;
      currentMRR = currentMRR - lostMRR + gainedMRR;
      
      const monthlySpend = config.marketingBudget;
      const monthlyRevenue = currentMRR;
      cumulativeCash += (monthlyRevenue - monthlySpend);
      
      dataPoints.push({
        name: `Month ${m}`,
        MRR: Math.round(currentMRR),
        Revenue: Math.round(monthlyRevenue),
        Spend: Math.round(monthlySpend),
        Acquisitions: customersWon,
        CashFlow: Math.round(cumulativeCash)
      });
    }
    setSimulationData(dataPoints);
  }, [config, initialARR, baseACV]);

  // Run Step 20 Revenue Forecast compilation
  useEffect(() => {
    const arrPoints = [];
    const baseAnnual = initialARR;
    
    for (let yr = 1; yr <= 3; yr++) {
      const lowMultiple = Math.pow(1.15, yr);
      const midMultiple = Math.pow(1.35, yr);
      const highMultiple = Math.pow(1.60, yr);
      
      arrPoints.push({
        year: `Year ${yr}`,
        Conservative: Math.round(baseAnnual * lowMultiple),
        Optimistic: Math.round(baseAnnual * midMultiple),
        Aggressive: Math.round(baseAnnual * highMultiple)
      });
    }
    // Expand to quarterly for smoother curves
    const quarterlyPoints = [];
    let prevAgg = baseAnnual;
    let prevMid = baseAnnual;
    let prevCon = baseAnnual;

    quarterlyPoints.push({ name: 'Start', Conservative: baseAnnual, Optimistic: baseAnnual, Aggressive: baseAnnual });

    for (let q = 1; q <= 12; q++) {
      // growth quotients quarterly
      const aggressiveQ = prevAgg * 1.12;
      const optimisticQ = prevMid * 1.08;
      const conservativeQ = prevCon * 1.04;
      
      prevAgg = aggressiveQ;
      prevMid = optimisticQ;
      prevCon = conservativeQ;

      quarterlyPoints.push({
        name: `Q${Math.ceil(q / 3)} Y${Math.ceil(q / 4) || 1}`,
        Conservative: Math.round(conservativeQ),
        Optimistic: Math.round(optimisticQ),
        Aggressive: Math.round(aggressiveQ)
      });
    }
    setForecastingData(quarterlyPoints);
  }, [initialARR]);

  // Read current metrics inside simulation tab
  const simEndMRR = simulationData[11]?.MRR || 0;
  const simEndARR = simEndMRR * 12;
  const simTotalCashFlow = simulationData[11]?.CashFlow || 0;

  const syncHeader = (
    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm mb-6">
      <div className="flex gap-3">
        <div className="p-2 bg-accent/10 rounded-lg shrink-0 text-accent flex items-center justify-center">
          <RefreshCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            Live Supabase Sync Bridge
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F090] animate-pulse"></span>
          </h4>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Linked directly to cloud schema. Derived Seeding Baselines: <span className="font-mono text-accent font-extrabold">${initialARR.toLocaleString()} initial ARR</span> | <span className="font-mono text-[#00F090] font-extrabold">${baseACV.toLocaleString()} Target ACV</span>.
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={triggerLiveRefresh}
        disabled={isRefreshing}
        className={`px-4 py-2 border rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
          refreshSuccess 
            ? 'bg-[#00F090]/15 border-[#00F090]/45 text-[#00F090]' 
            : 'bg-bg-surface hover:bg-bg-surface/85 border-border/80 text-text-primary hover:border-text-secondary/40'
        }`}
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />
            <span>Fetching Cloud...</span>
          </>
        ) : refreshSuccess ? (
          <>
            <Check className="h-3.5 w-3.5 text-[#00F090]" />
            <span>Synced Successfully</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Cloud Data</span>
          </>
        )}
      </button>
    </div>
  );

  if (tabMode === 'simulation') {
    return (
      <div className="space-y-6">
        {syncHeader}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 p-5 rounded-2xl bg-bg-surface/50 border border-border/80 space-y-6">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              <h3 className="font-bold text-sm text-text-primary">Operational Parameters</h3>
            </div>
            
            <div className="space-y-5">
              {/* Control 1: Marketing Spend */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-secondary">Monthly GTM Spend</span>
                  <span className="font-mono font-bold text-accent">${config.marketingBudget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={config.marketingBudget}
                  onChange={(e) => onChange({ marketingBudget: parseInt(e.target.value) })}
                  className="w-full accent-accent h-1 bg-bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-text-secondary/50">Spend allocated for campaigns, ad buy, and core traffic generation.</p>
              </div>

              {/* Control 2: Pricing Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-secondary">Contract Value Multiplier</span>
                  <span className="font-mono font-bold text-accent">{config.pricingMultiplier.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={config.pricingMultiplier}
                  onChange={(e) => onChange({ pricingMultiplier: parseFloat(e.target.value) })}
                  className="w-full accent-accent h-1 bg-bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-text-secondary/50">Raises ACV billing floor, with potential negative pressure on conversions.</p>
              </div>

              {/* Control 3: Speed Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-secondary">Sales Cycle Speed</span>
                  <span className="font-mono font-bold text-accent">{config.salesCycleSpeed.toFixed(1)}x acceleration</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.salesCycleSpeed}
                  onChange={(e) => onChange({ salesCycleSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-accent h-1 bg-bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-text-secondary/50">Factor scaling CRM trial velocities and closed cycle speeds.</p>
              </div>

              {/* Control 4: Conversion Rate Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-secondary">Meeting close-win base rate</span>
                  <span className="font-mono font-bold text-accent">{config.conversionRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={config.conversionRate}
                  onChange={(e) => onChange({ conversionRate: parseFloat(e.target.value) })}
                  className="w-full accent-accent h-1 bg-bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-text-secondary/50">Operational close efficiency mapping directly from qualified leads to won accounts.</p>
              </div>

              {/* Control 5: Channels Style */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Execution Routing Engine</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'enterprise', name: 'Direct Sales' },
                    { id: 'plg', name: 'PLG Trials' },
                    { id: 'hybrid', name: 'Hybrid GTM' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => onChange({ primaryGTMPath: p.id })}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        config.primaryGTMPath === p.id
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-bg-primary/50 border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/20'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Viz & Metrics Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics Summaries */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em] mb-1">Ending ARR Projection</div>
                <div className="text-sm sm:text-base font-black text-accent">${Math.round(simEndARR).toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em] mb-1">Cumulative Net Contribution</div>
                <div className={`text-sm sm:text-base font-black ${simTotalCashFlow >= 0 ? "text-accent" : "text-red-400"}`}>
                  ${simTotalCashFlow.toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em] mb-1">Target Account acquisitions</div>
                <div className="text-sm sm:text-base font-black text-accent">
                  {simulationData.reduce((sum, p) => sum + p.Acquisitions, 0)} Logos
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="p-5 rounded-2xl bg-bg-surface/50 border border-border/85">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-text-primary tracking-tight">12-Month Simulation Growth Run</h4>
                <span className="text-[9px] font-mono text-accent">MONTE CARLO RECURSIVE ENGINE</span>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252528" />
                    <XAxis dataKey="name" stroke="#5d5d62" fontSize={10} />
                    <YAxis stroke="#5d5d62" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1c1c1f", border: "1px solid #2d2d30", borderRadius: "10px" }}
                      itemStyle={{ color: "#ffffff", fontSize: "11px" }}
                      labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line type="monotone" dataKey="Revenue" stroke="#00F090" name="Monthly Inflow ($)" strokeWidth={2.5} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Spend" stroke="#6b7280" name="Allocated Spend ($)" strokeWidth={1} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Stage 23: 36-Month Strategic Revenue Forecasting
    return (
      <div className="space-y-6">
        {syncHeader}

        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex gap-2.5">
          <ShieldAlert className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-accent">L2 Financial Forecasting Model: </span> 
            Compound Growth coefficients show quarterly projections extending ARR trajectory out 36 months based on raw seeding parameters of 
            <span className="font-mono text-accent ml-1 px-1 py-0.5 rounded bg-accent/10">${initialARR.toLocaleString()}</span>.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {[
              { id: 'con', tier: 'Conservative (15% CAGR)', color: 'text-gray-400', val: forecastingData[ forecasingIdx(12) ]?.Conservative || 0 },
              { id: 'mid', tier: 'Core Optimistic (35% CAGR)', color: 'text-accent', val: forecastingData[ forecasingIdx(12) ]?.Optimistic || 0 },
              { id: 'agg', tier: 'Aggressive High (60% CAGR)', color: 'text-blue-400', val: forecastingData[ forecasingIdx(12) ]?.Aggressive || 0 }
            ].map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-bg-surface/50 border border-border">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.tier}</div>
                <div className={`text-lg font-black mt-1 ${t.color}`}>
                  ${t.val.toLocaleString()} ARR
                </div>
                <div className="text-[9px] text-text-secondary/50 mt-1">36-Month Compound Projection.</div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 p-5 rounded-2xl bg-bg-surface/50 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                3-Year Adaptive Compound Growth Trends
              </h4>
              <span className="text-[9px] font-mono text-text-secondary uppercase">36 Months Horizon Area Curve</span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastingData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252528" />
                  <XAxis dataKey="name" stroke="#5d5d62" fontSize={10} />
                  <YAxis stroke="#5d5d62" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1c1c1f", border: "1px solid #2d2d30", borderRadius: "10px" }}
                    itemStyle={{ fontSize: "11px" }}
                    labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Area type="monotone" dataKey="Aggressive" stroke="#3b82f6" fillOpacity={0.05} fill="#3b82f6" name="Aggressive Outbound" />
                  <Area type="monotone" dataKey="Optimistic" stroke="#00F090" fillOpacity={0.08} fill="#00F090" name="Core Expected Scale" />
                  <Area type="monotone" dataKey="Conservative" stroke="#6b7280" fillOpacity={0.02} fill="#6b7280" name="Defensive Compound" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function forecasingIdx(target: number) {
    if (forecastingData.length > target) return target;
    return forecastingData.length - 1;
  }
};
