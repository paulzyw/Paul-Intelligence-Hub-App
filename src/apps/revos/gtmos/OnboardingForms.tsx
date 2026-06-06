import React, { useState } from 'react';
import { OnboardingCategoryFields, CategoryId } from './types';
import { CATEGORY_SPECS } from './initialState';
import { Sparkles, Loader2, CheckCircle2, HelpCircle, FileText, Info, Save, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface OnboardingFormsProps {
  activeCategoryId: CategoryId;
  onboardingFields: OnboardingCategoryFields;
  onChange: (field: keyof OnboardingCategoryFields, val: string) => void;
  onSaveBatch: (fields: Partial<OnboardingCategoryFields>) => void;
  activeStep: number;
  onStepChange: (step: number) => void;
  saveState: 'idle' | 'saving' | 'saved' | 'dirty';
  setSaveState: React.Dispatch<React.SetStateAction<'idle' | 'saving' | 'saved' | 'dirty'>>;
}

const FIELD_LABELS: Record<keyof OnboardingCategoryFields, { label: string; placeholder: string; helper: string }> = {
  companyName: {
    label: "Company Name",
    placeholder: "e.g., Acme Cloud Core",
    helper: "Official incorporated corporate identity."
  },
  industry: {
    label: "Primary Industry Segment",
    placeholder: "e.g., Enterprise Software / SaaS",
    helper: "Select the dominant target industry sector."
  },
  headquarters: {
    label: "Corporate HQ Location",
    placeholder: "e.g., Singapore, SF, London",
    helper: "Principal city hosting the main administrative team."
  },
  countriesServed: {
    label: "Countries Served",
    placeholder: "e.g., United States, Japan, UK",
    helper: "Key global geographical market regions."
  },
  employeeCount: {
    label: "Employee Count / Scale",
    placeholder: "e.g., 250 headcount",
    helper: "Total operational employee footprint."
  },
  annualRevenue: {
    label: "Annual Recurring Revenue (ARR)",
    placeholder: "e.g., $15M ARR",
    helper: "Latest continuous recurring income run-rate."
  },
  growthStage: {
    label: "Growth Stage Alignment",
    placeholder: "e.g., Series B Scale-up",
    helper: "Your current organization phase: early, speed scale, mature."
  },
  fundingStage: {
    label: "Capital Funding Stage",
    placeholder: "e.g., Seed, Bootstrapped, Series A",
    helper: "Dominant corporate backing capital structure."
  },
  businessModel: {
    label: "Core Revenue Business Model",
    placeholder: "e.g., Enterprise SaaS, B2B Hybrid",
    helper: "Contract arrangement style (seat licenses, compute-token, etc.)."
  },
  strategicPriorities: {
    label: "High-level Expansion Priorities",
    placeholder: "e.g., Accelerate APAC sales, build cloud moat",
    helper: "Top three objectives for the current physical board year."
  },

  productName: {
    label: "Product / Service Name",
    placeholder: "e.g., CloudSec Audit",
    helper: "The primary brand/offering name to solve model needs."
  },
  productCategory: {
    label: "Defining Product Category",
    placeholder: "e.g., Cybersecurity Ledger",
    helper: "The category the product seeks to dominate."
  },
  productDescription: {
    label: "Core Value Description",
    placeholder: "e.g., Non-stop automated metadata assessment...",
    helper: "Substantial explanation of what the technology accomplishes."
  },
  keyFeatures: {
    label: "Primary Technical Features",
    placeholder: "e.g., Auto ledger indexing, webhook alerts",
    helper: "Three structural product feature keys."
  },
  keyBenefits: {
    label: "Measurable Customer Benefits",
    placeholder: "e.g., 35% effort saved, 0 false positives",
    helper: "Primary ROI parameters proven during pilots."
  },
  uniqueDifferentiators: {
    label: "Core Unique Differentiator",
    placeholder: "e.g., Real-time semantic checking instead of charts",
    helper: "Why you win against standard market incumbents."
  },
  competitiveAdvantages: {
    label: "Sustained Competitive Advantages",
    placeholder: "e.g., Proprietary database graph, 5-minute sync",
    helper: "Your technical or commercial defensive moat."
  },
  technologyPlatform: {
    label: "Dominant Technology Stack",
    placeholder: "e.g., Rust engines and GraphDB network",
    helper: "Frameworks supporting the ledger engine."
  },
  deploymentModel: {
    label: "Deployment Topology",
    placeholder: "e.g., Dedicated AWS Tenant, shared SaaS cloud",
    helper: "How customers ingest and read the engine output."
  },
  pricingModel: {
    label: "Pricing Structure",
    placeholder: "e.g., $150 user seat seat licenses with value tiers",
    helper: "Seat license details or contractual minimums."
  },

  primaryBusinessGoal: {
    label: "Primary GTM Goal",
    placeholder: "e.g., Acquire 50 enterprise logos",
    helper: "The primary metric of GTM victory."
  },
  revenueTarget: {
    label: "Target Revenue Objective",
    placeholder: "e.g., $45M recurring ARR",
    helper: "Target recurring volume to trigger."
  },
  pipelineTarget: {
    label: "Total Sales Pipeline Target",
    placeholder: "e.g., $120M active coverage",
    helper: "Aggregated dynamic sales pipeline requirement."
  },
  marketShareTarget: {
    label: "Market Share Alignment Goal",
    placeholder: "e.g., 8% of Cloudsec SAM",
    helper: "Targeted capture percentage of reachable market size."
  },
  customerAcquisitionGoal: {
    label: "Target Client volume",
    placeholder: "e.g., 60 enterprise accounts",
    helper: "Expected count of new customers won."
  },
  expansionGoal: {
    label: "Net Expansion / Retention Target",
    placeholder: "e.g., 115% NRR expansion",
    helper: "Expected account growth through usage upsell."
  },
  timeHorizon: {
    label: "Planning Strategic Timeline",
    placeholder: "e.g., 12 Months",
    helper: "Strategic duration of this active campaign."
  },

  targetIndustries: {
    label: "Target Customer Sectors",
    placeholder: "e.g., Fintech, Healthcare Software",
    helper: "High-affinity industry sectors targeted."
  },
  targetGeographies: {
    label: "Primary Customer Geographies",
    placeholder: "e.g., US East, UK Financial Hub",
    helper: "Geographical locations targeted by sales reps."
  },
  marketSize: {
    label: "Serviceable Addressable Market (SAM)",
    placeholder: "e.g., $1.8B Addressable Segment",
    helper: "The reachable market size for this product."
  },
  marketGrowthRate: {
    label: "Sector CAGR Growth Speed",
    placeholder: "e.g., 18% YoY Sector CAGR",
    helper: "Average year-over-year sectoral growth."
  },
  marketTrends: {
    label: "Critical Market Trends",
    placeholder: "e.g., Focus on compliance automation regulations",
    helper: "Top behavioral or structural shift in buyers."
  },
  competitorList: {
    label: "Key Market Competitors",
    placeholder: "e.g., Clari, Salesforce Revenue, Gong",
    helper: "The names of primary sales alternatives."
  },
  competitivePosition: {
    label: "Strategic Category Position",
    placeholder: "e.g., High-fidelity niche ledger specialist",
    helper: "How you place yourself inside the landscape grid."
  },

  existingCustomerBase: {
    label: "Active Account Install-Base",
    placeholder: "e.g., 80 active enterprise companies",
    helper: "Your current paying corporate logos count."
  },
  bestCustomers: {
    label: "Super-User / Ideal ICP Company",
    placeholder: "e.g., High-tech firms with $30M ARR, 20 SDRs",
    helper: "The customer profile that yields the highest ACV."
  },
  customerIndustries: {
    label: "Install-Base Core Industries",
    placeholder: "e.g., cybersecurity networks, banking logistics",
    helper: "Primary segments represented inside current revenues."
  },
  customerSizes: {
    label: "ICP Employee Demographics",
    placeholder: "e.g., 150 - 1000 employee count",
    helper: "Preferred employee scale bracket of buyers."
  },
  typicalBuyers: {
    label: "Typical ICP Buyer Personas",
    placeholder: "e.g., VP of Revops, Chief Information Officer",
    helper: "The role holding budget and veto keys."
  },
  painPoints: {
    label: "Key Customer Pain Points",
    placeholder: "e.g., Unpredictable forecast leaks, manual logging gaps",
    helper: "What keeps the buyer up at night."
  },
  buyingTriggers: {
    label: "Target Buying Triggers",
    placeholder: "e.g., missed quarterly target, key director hire",
    helper: "Events that prompt them to buy a system."
  },
  buyingProcess: {
    label: "Standard Purchasing Process",
    placeholder: "e.g., 3-week security check, CRO signature",
    helper: "The procurement steps required from hello to sign-off."
  },
  decisionMakingStructure: {
    label: "Procurement Committee Structure",
    placeholder: "e.g., CRO is main signer, CFO holds override",
    helper: "All internal roles that participate in closing the contract."
  },

  currentSalesMotion: {
    label: "Current Sales Playbook Motion",
    placeholder: "e.g., Rep outbound paired with inbound trials",
    helper: "Your standard sales workflow (direct, digital-first, etc.)."
  },
  currentChannels: {
    label: "Lead Acquisition Channels",
    placeholder: "e.g., Outbound sales reps, local partners",
    helper: "Primary channels where deals originate."
  },
  existingPartners: {
    label: "Strategic Channel Partners",
    placeholder: "e.g., Salesforce Regional Integrators",
    helper: "Independent agencies co-marketing your ledger."
  },
  currentMarketingActivities: {
    label: "Primary Marketing Actions",
    placeholder: "e.g., Account campaigns, research publications",
    helper: "Your loudest current market channels."
  },
  pipelinePerformance: {
    label: "Operational Cycle Metrics",
    placeholder: "e.g., Average win cycle 38 days, deal size $45,000",
    helper: "Average duration and ticket size of wins."
  },
  conversionRates: {
    label: "Pipeline Meeting-to-Opp Rate",
    placeholder: "e.g., 12% standard benchmark",
    helper: "Percentage of calls converting to structured opps."
  },
  winRates: {
    label: "Opp-to-Closed Win Rate",
    placeholder: "e.g., 18% Opp won ratio",
    helper: "Percentage of qualified pipeline deals won."
  },

  salesTeamSize: {
    label: "Sales Team Staff Allocation",
    placeholder: "e.g., 12 sales reps, 3 SDRs",
    helper: "Headcount allocated directly to target pipeline sales."
  },
  marketingTeamSize: {
    label: "Marketing Team Footprint",
    placeholder: "e.g., 4 campaign leads",
    helper: "Headcount allocated to demand creation."
  },
  customerSuccessTeamSize: {
    label: "CS / Integration Staff Size",
    placeholder: "e.g., 5 onboarding leads",
    helper: "Headcount managing training and setup phases."
  },
  partnerTeamSize: {
    label: "Channel / Partner Leads",
    placeholder: "e.g., 2 channels managers",
    helper: "Staff managing external reseller alignments."
  },
  availableBudget: {
    label: "Program Spend Allocation ($)",
    placeholder: "e.g., $1.2M annual marketing budget",
    helper: "Available program capital for campaigns."
  },
  existingAssets: {
    label: "Marketing Sales Collateral Assets",
    placeholder: "e.g., ROI spreadsheets, 3 customer case studies",
    helper: "Supporting artifacts reps use to build trust."
  },
  CRMPlatform: {
    label: "Corporate CRM Platform",
    placeholder: "e.g., Salesforce enterprise edition",
    helper: "Main directory repository for transaction state."
  },
  marketingTechnologyStack: {
    label: "Operational Tech / Martech Stack",
    placeholder: "e.g., HubSpot, Marketo, ZoomInfo, Zoom",
    helper: "Complementary programmatic utilities."
  },

  revenue: {
    label: "Current Total Revenue ($)",
    placeholder: "e.g., $12M aggregate sales",
    helper: "Total actual annual company income."
  },
  ARR: {
    label: "Ending Annual Run Rate (ARR)",
    placeholder: "e.g., $12M clean ARR",
    helper: "Run-rate value computed at last month close."
  },
  pipeline: {
    label: "Active CRM Pipeline Volume ($)",
    placeholder: "e.g., $38M active volume",
    helper: "Aggregate open value in pipeline records."
  },
  opportunities: {
    label: "Count of Active Opportunities",
    placeholder: "e.g., 140 open CRM opportunities",
    helper: "Count of open deals in standard sales stages."
  },
  winRate: {
    label: "Historical Close-Win Base Rate (%)",
    placeholder: "e.g., 18% Opp won average",
    helper: "Historic won percentage of opportunities."
  },
  customerRetention: {
    label: "Aggregate Net Revenue Retention (%)",
    placeholder: "e.g., 112% SaaS retention index",
    helper: "Income retained from cohort after expansions."
  },
  customerSatisfaction: {
    label: "NPS / CSAT Rating Score",
    placeholder: "e.g., 90% customer satisfaction index",
    helper: "Standard net promoter feedback index."
  },
  CAC: {
    label: "Aggregate Acquisition Cost (CAC)",
    placeholder: "e.g., $12,500 total CAC",
    helper: "Blended programmatic sales and marketing cost of a win."
  },
  LTV: {
    label: "SaaS Lifetime Value (LTV)",
    placeholder: "e.g., $240,000 blended customer value",
    helper: "Aggregated recurring cash flow expected per logo."
  }
};

export const OnboardingForms: React.FC<OnboardingFormsProps> = ({
  activeCategoryId,
  onboardingFields,
  onChange,
  onSaveBatch,
  activeStep,
  onStepChange,
  saveState,
  setSaveState
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);

  const spec = CATEGORY_SPECS.find(c => c.id === activeCategoryId);
  if (!spec) return null;

  // Compute category stats
  const filledCount = spec.fields.filter(f => !!onboardingFields[f]).length;
  const totalCount = spec.fields.length;
  const ratio = Math.round((filledCount / totalCount) * 100);

  const handleFieldChange = (field: keyof OnboardingCategoryFields, val: string) => {
    onChange(field, val);
    setSaveState('dirty');
  };

  const handleAIEnrich = async () => {
    setIsEnriching(true);
    setEnrichResult(null);

    try {
      let data: any = null;
      if (supabase) {
        try {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('gtmos-api', {
            body: {
              action: 'enrich',
              categoryId: activeCategoryId,
              companyName: onboardingFields.companyName,
              industry: onboardingFields.industry,
              currentFields: spec.fields.reduce((acc, f) => {
                acc[f] = onboardingFields[f];
                return acc;
              }, {} as Record<string, string>)
            }
          });
          if (edgeError) throw edgeError;
          data = edgeData;
        } catch (edgeErr) {
          console.warn("Supabase edge function 'enrich' failed, falling back to local api:", edgeErr);
        }
      }

      if (!data) {
        const response = await fetch("/api/gtmos/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: activeCategoryId,
            companyName: onboardingFields.companyName,
            industry: onboardingFields.industry,
            currentFields: spec.fields.reduce((acc, f) => {
              acc[f] = onboardingFields[f];
              return acc;
            }, {} as Record<string, string>)
          })
        });

        if (!response.ok) {
          throw new Error("HTTP status " + response.status);
        }

        data = await response.json();
      }

      if (data && data.enrichedFields) {
        onSaveBatch(data.enrichedFields);
        setSaveState('dirty');
        setEnrichResult("AI successfully populated empty fields with professional, high-fidelity context benchmarks! Press 'Save' below to commit these values.");
      } else {
        setEnrichResult("Failed to resolve enrichment data. Verify GEMINI_API_KEY is active on your Supabase dashboard.");
      }
    } catch (err: any) {
      console.error(err);
      setEnrichResult("Enrichment connection issue: " + err.message);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Progress Stats Bannner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-bg-primary/40 border border-border/80 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-primary">{spec.name} Onboarding Workspace</h3>
            <p className="text-[10px] sm:text-xs text-text-secondary">Provide precise operational inputs to feed strategic strategy templates.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs font-mono font-medium text-text-secondary">Category Readiness Check</div>
            <div className="text-lg font-bold text-accent">{ratio}% <span className="text-xs text-text-secondary">({filledCount}/{totalCount} fields)</span></div>
          </div>
          <button
            onClick={handleAIEnrich}
            disabled={isEnriching}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/20 to-blue-500/10 hover:from-accent hover:to-blue-500 hover:text-black border border-accent/30 hover:border-accent disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold text-accent transition-all duration-300 shadow-lg shadow-accent/5"
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI Auto-Enrich Category
              </>
            )}
          </button>
        </div>
      </div>

      {enrichResult && (
        <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 text-[11px] text-accent/90 flex gap-2.5 items-start">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{enrichResult}</span>
        </div>
      )}

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {spec.fields.map(field => {
          const fieldSpec = FIELD_LABELS[field] || { label: field, placeholder: "Type here...", helper: "" };
          const value = onboardingFields[field] || '';
          const isMissing = !value;

          return (
            <div key={field} className="group flex flex-col p-4 rounded-2xl bg-bg-surface/50 border border-border group-hover:border-accent/10 transition-all space-y-1.5 focus-within:border-accent/40 focus-within:bg-bg-surface/90 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-tight text-text-primary flex items-center gap-1.5">
                  {fieldSpec.label}
                  {isMissing ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" title="Incomplete requirement" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  )}
                </span>
                <span className="text-[9px] font-mono font-extrabold uppercase text-text-secondary/60">
                  {field}
                </span>
              </div>

              {field === 'productDescription' || field === 'strategicPriorities' || field === 'painPoints' ? (
                <textarea
                  id={`field-${field}`}
                  rows={3}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={fieldSpec.placeholder}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans placeholder-text-secondary/40 resize-none h-20"
                />
              ) : field === 'industry' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select industry segment...</option>
                  {[
                    "SaaS / Software", "Enterprise Software", "Consulting", "AI Solutions", 
                    "Cloud Transformation", "System Integration", "Managed Services", 
                    "Engineering Solutions", "Infrastructure Projects", "EPC / EP Projects", 
                    "Digital Transformation", "OT/IT Solutions", "Professional Services", 
                    "Enterprise Procurement", "Solution-Selling Organizations", "Other solutions"
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'growthStage' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select growth stage...</option>
                  {[
                    'BOOTSTRAPPED', 'SEED', 'SERIES_A_C', 'GROWTH_STAGE', 'ENTERPRISE_PUBLIC'
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'fundingStage' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select funding stage...</option>
                  {[
                    'BOOTSTRAPPED', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D_PLUS', 'REVENUE_FUNDED', 'PUBLIC'
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'businessModel' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select business model...</option>
                  {[
                    'SaaS', 'Usage-Based/Pay-Per-Use', 'Data and Intelligence Providers', 
                    'Enterprise License', 'Sourcing and Manufacturing', 'B2B Marketplaces', 
                    'Transaction / Payment Infrastructure', 'Wholesale Distribution', 'Professional Services', 'Others'
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'primaryBusinessGoal' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select primary business goal...</option>
                  {[
                    "Revenue Growth", "Market Expansion", "New Product Launch", "Customer Retention", "Partner Growth"
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'competitivePosition' ? (
                <select
                  id={`field-${field}`}
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select competitive position...</option>
                  {[
                    "Market Leader", "Challenger", "Visionary", "Niche Player"
                  ].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field === 'currentSalesMotion' ? (
                <div id={`field-${field}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-1">
                  {["Inbound", "Outbound Enterprise", "Product Led", "Channel Partner"].map(opt => {
                    const options = ["Inbound", "Outbound Enterprise", "Product Led", "Channel Partner"];
                    const isChecked = value.split(',').map((s: string) => s.trim()).includes(opt);
                    return (
                      <label 
                        key={opt}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-accent/10 border-accent/40 text-text-primary' 
                            : 'bg-bg-primary/50 border-border/60 text-text-secondary hover:border-border hover:bg-bg-primary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            let currentList = value.split(',').map((s: string) => s.trim()).filter(v => options.includes(v));
                            if (isChecked) {
                              currentList = currentList.filter(v => v !== opt);
                            } else {
                              currentList.push(opt);
                            }
                            handleFieldChange(field, currentList.join(', '));
                          }}
                          className="rounded border-border text-accent focus:ring-accent bg-bg-primary h-4 w-4 accent-accent cursor-pointer"
                        />
                        <span className="font-sans leading-none">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  id={`field-${field}`}
                  type="text"
                  value={value}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={fieldSpec.placeholder}
                  className="w-full bg-bg-primary border border-border/80 focus:border-accent/50 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-sans placeholder-text-secondary/40"
                />
              )}

              <div className="flex items-start gap-1">
                <HelpCircle className="h-3 w-3 text-text-secondary/40 mt-0.5 shrink-0" />
                <span className="text-[10px] text-text-secondary/60 leading-normal">{fieldSpec.helper}</span>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
};
