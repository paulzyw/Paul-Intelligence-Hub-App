import { GTMOSStrategy, GTMOSPillarId, GTMOSPillar, GTMOSAction, GTMOSSimulationConfig } from '../types';

export const DEFAULT_PILLARS: Record<GTMOSPillarId, GTMOSPillar> = {
  market_opportunity: {
    id: 'market_opportunity',
    title: 'Market Opportunity Analysis',
    subtitle: 'Define your serviceable ICP, TAM, SAM, and realistic SOM metrics.',
    percentageComplete: 100,
    summary: 'Focusing on mid-market to enterprise B2B SaaS organizations facing severe pipeline leaks, with a serviceable addressable market (SAM) of approximately $2.4B globally.',
    keyMetrics: [
      { label: 'Total Addressable Market (TAM)', value: '$12.5B' },
      { label: 'Serviceable Addressable Market (SAM)', value: '$2.4B' },
      { label: 'Serviceable Obtainable Market (SOM)', value: '$450M' },
    ],
    strategicPoints: [
      'Target segment: Enterprise B2B tech companies with ARR between $20M and $250M.',
      'Key geographical market expansion sequence: North America (primary), EMEA (secondary).',
      'Underlying catalyst: Rise of generative AI creating a need for automated revenue compliance.'
    ],
    rawText: 'Our TAM is estimated at $12.5B globally, covering all commercial teams using CRM analytics. SAM targets mid-market and enterprise B2B tech firms with $20M-$250M ARR which represents $2.4B. Our 3-year SOM goal is $450M by acquiring 1,200 core high-value account configurations.'
  },
  target_personas: {
    id: 'target_personas',
    title: 'Target Personas & Customer Pain Points',
    subtitle: 'Identify key decision makers, influencers, and their critical blockers.',
    percentageComplete: 100,
    summary: 'Targeting Chief Revenue Officers (CRO), VP of Sales Ops, and CFOs who struggle with inaccurate pipeline attribution, dirty CRM records, and high customer acquisition costs.',
    keyMetrics: [
      { label: 'Core Buying Personas', value: 'CRO, VP RevOps, CFO' },
      { label: 'Average Contract Value (ACV)', value: '$75k/year' },
      { label: 'Primary Pain Point', value: 'Pipeline attribution gaps' }
    ],
    strategicPoints: [
      'CROs care about team productivity and quarterly pipeline predictability.',
      'VP of Revenue Operations desires tool consolidation, clean CRM data, and streamlined integrations.',
      'CFOs seek quick ROI and CAC payback metrics beneath 12 months.'
    ],
    rawText: 'Primary buyer is the CRO, who is constant pressure to forecast accurately. VP of RevOps coordinates the actual setup. The business case must satisfy the CFO, who wants tool consolidation and CAC payback within 12 months.'
  },
  value_prop: {
    id: 'value_prop',
    title: 'Value Proposition & Positioning',
    subtitle: 'Articulate your core differentiator and positioning statement.',
    percentageComplete: 100,
    summary: 'RevOS is the world\'s first AI-native Go-to-Market operating system that bridges the gap between high-level strategic models and daily front-line actions with real-time auditability.',
    keyMetrics: [
      { label: 'Core Claim', value: '30% forecast accuracy boost' },
      { label: 'Positioning Category', value: 'Revenue Intelligence L2' },
      { label: 'Time-to-Value (TTV)', value: 'Less than 14 days' }
    ],
    strategicPoints: [
      'Elevate from simple CRM charts to real-time proactive strategic orchestration.',
      'Unique "Layer 2" structure that connects raw sales behavior directly to commercial strategy.',
      'Zero-agent, zero-manual logging required: automated live-updating CRM capture.'
    ],
    rawText: 'RevOS provides real-time strategic alignment, not retrospective stats. We position ourselves as an execution-oriented platform rather than another passive logging dashboard. Value prop promises 30% pipeline leaks reduction.'
  },
  pricing_packaging: {
    id: 'pricing_packaging',
    title: 'Pricing & Packaging Strategy',
    subtitle: 'Structure your monetization layers, expansion triggers, and billing metrics.',
    percentageComplete: 100,
    summary: 'Dynamic value-based pricing backed by self-service prepaid compute credits for smaller teams, transitioning to annual enterprise subscription contracts with user/seat thresholds.',
    keyMetrics: [
      { label: 'Base Subscription User/Mo', value: '$120' },
      { label: 'Enterprise Annual Floor', value: '$45,000' },
      { label: 'Expansion Metric', value: 'AI compute tokens used' }
    ],
    strategicPoints: [
      'Self-service entry point using dynamic prepaid compute credits for pipeline intelligence queries.',
      'Growth tier based on user seat capacity with active Salesforce/Hubspot synced accounts.',
      'Enterprise tier incorporates custom model fine-tuning and strict data sovereign security configurations.'
    ],
    rawText: 'We use a dual pricing model: self-service teams can prepay for credit packages starting at $120/seat, while enterprise clients sign annual recurring contracts commencing at an annual fee of $45k with custom SLA support.'
  },
  sales_channels: {
    id: 'sales_channels',
    title: 'Sales & Distribution Channels',
    subtitle: 'Establish self-serve onboarding, sales playbooks, and strategic partners.',
    percentageComplete: 100,
    summary: 'A hybrid Go-to-Market engine combining product-led growth (PLG) for rapid sandbox sign-ups with account-executive sales-led growth (SLG) for larger enterprises.',
    keyMetrics: [
      { label: 'Primary Sales Cycle', value: '35 Days' },
      { label: 'PLG-to-Enterprise Conv.', value: '4.2%' },
      { label: 'Tech Partner Channels', value: 'Salesforce AppExchange' }
    ],
    strategicPoints: [
      'Product-led trial: Users can log into the sandbox, connect read-only CRM data, and get a risk audit in 5 minutes.',
      'Enterprise sales motion triggered when an account shows >15 active seats or requests SOC2 custom compliance.',
      'Co-selling campaigns in collaboration with verified regional RevOps consulting boutiques and Salesforce ISV partners.'
    ],
    rawText: 'We run a hybrid sales funnel. High velocity PLG brings initial self-serve workspace admins, while commercial AEs target executive level CROs for company-wide site deployments.'
  },
  marketing_leads: {
    id: 'marketing_leads',
    title: 'Marketing & Lead Generation Strategy',
    subtitle: 'Target inbound, outbound, and ABM campaign playbooks.',
    percentageComplete: 100,
    summary: 'High-intensity Inbound Search Engine Optimization (SEO) pairing with highly personalized Account-Based Marketing (ABM) playbooks targeting Tier 1 enterprise profiles.',
    keyMetrics: [
      { label: 'Customer Acq. Cost (CAC)', value: '$8,500' },
      { label: 'ABM Conversion Rate', value: '18% Meeting-to-Opp' },
      { label: 'Organic Search Share', value: '35%' }
    ],
    strategicPoints: [
      'Publish proprietary research reports on pipeline leaks and state of RevOps twice per year.',
      'Outbound campaigns targeted at specific companies who recently hired a new CFO or CRO.',
      'Customized executive landing pages showing real-time anonymized industry conversion rate benchmarks.'
    ],
    rawText: 'Demand generation split into SEO-driven thought leadership reports and outbound executive ABM sequences. We target firms immediately after leadership transitions (e.g., new CRO hire) with pipeline audit assessments.'
  },
  customer_success: {
    id: 'customer_success',
    title: 'Customer Success & Retention Plan',
    subtitle: 'Outline onboarding, health scoring, and expansion programs.',
    percentageComplete: 100,
    summary: 'Structured customer success onboarding that delivers a fully mapped strategy and integrated pipeline audit within 14 days, driving strong Net Revenue Retention (NRR).',
    keyMetrics: [
      { label: 'Target Net Revenue Ret.', value: '118%' },
      { label: 'CSAT Score Goal', value: '96%' },
      { label: 'Time-to-Initial Value', value: '5 Days' }
    ],
    strategicPoints: [
      'First 30 days focus: Technical data hygiene, connecting source systems, and generating the first strategic diagnosis.',
      'Monthly business review (MBR) automated scorecard summarizing ROI and pipeline leakages plugged.',
      'Quarterly executive alignments: Strategic review session with CROs to identify potential areas of seats expansion.'
    ],
    rawText: 'Customer Success is critical. Prompt setup is key to beat the churning window. We automate weekly health score telemetry. High scores automatically trigger expansion sequences in the app platform.'
  },
  unit_economics: {
    id: 'unit_economics',
    title: 'Unit Economics & CAC Payback',
    subtitle: 'Model lifetime user value, payload margins, and payback sequences.',
    percentageComplete: 100,
    summary: 'A strong LTV:CAC profile driven by low server hosting requirements (scale-to-zero) and high gross margins, facilitating complete CAC payback within 9.2 months.',
    keyMetrics: [
      { label: 'LTV to CAC Ratio', value: '4.8 : 1' },
      { label: 'CAC Payback Period', value: '9.2 Months' },
      { label: 'Platform Gross Margin', value: '88%' }
    ],
    strategicPoints: [
      'Low data ingestion costs: metadata-only tracking requires zero expensive full-content replication storage.',
      'Self-service PLG tracks have an average CAC under $1,200. Enterprise SLG ACV contracts balance out with higher upfront values.',
      'Compute server scaling triggered dynamically based on active cron sync scheduling intervals.'
    ],
    rawText: 'Gross margins are healthy at 88% due to metadata-only architecture. LTV:CAC is modeled at 4.8:1 based on an average customer life of 4 years. CAC Payback completes on month 9.'
  },
  differentiation: {
    id: 'differentiation',
    title: 'Competitive Differentiation & Defensive Moats',
    subtitle: 'Design high-barrier-to-entry technological and platform moats.',
    percentageComplete: 100,
    summary: 'Unlike legacy business dashboards, RevOS connects live executing data directly to the structural strategic pillars using generative AI, establishing a high-value feedback engine.',
    keyMetrics: [
      { label: 'Proprietary IP Assets', value: '3 Core Patents' },
      { label: 'Pipeline Sync Velocity', value: 'Near-Live Data' },
      { label: 'Customer Retention Rate', value: '94%' }
    ],
    strategicPoints: [
      'Proprietary generative graph reasoning models that convert unstructured strategic documents into strict relational rules.',
      'Platform networking effect: as more accounts connect to the system, our anonymized industry conversion rate benchmark accuracy rises.',
      'Deep integration inside existing CRM systems makes switching extremely costly and disruptive once configured.'
    ],
    rawText: 'We don\'t just pull Salesforce data into a bar chart. We compile CRM behaviors into logic frameworks matching high-level strategy. This semantic coupling is patented and forms our structural technical moat.'
  }
};

export const DEFAULT_ACTIONS: GTMOSAction[] = [
  {
    id: 'act-1',
    program: 'Inbound Demand Generation',
    title: 'Publish the "State of B2B SaaS Pipeline Leakage" report',
    description: 'Compile and design the biannual data research insight report utilizing 500+ analyzed anonymous CRM profiles to capture high-intent outbound leads.',
    owner: 'Sarah Jenkins',
    dueDate: '2026-07-15',
    status: 'in_progress',
    priority: 'high'
  },
  {
    id: 'act-2',
    program: 'Product-Led Optimization',
    title: 'Simplify read-only CRM connection wizard',
    description: 'Reduce sandbox registration steps from 5 to 2 to improve organic visitor trial conversion rates.',
    owner: 'Alex Martinez',
    dueDate: '2026-06-30',
    status: 'todo',
    priority: 'high'
  },
  {
    id: 'act-3',
    program: 'Sales Enablement',
    title: 'Draft standard "CFO Business Case" presentation deck',
    description: 'Create a pre-packaged template highlighting 9.2-month CAC payback periods and tool consolidation savings for enterprise sales reps.',
    owner: 'Emily Wong',
    dueDate: '2026-07-01',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: 'act-4',
    program: 'Customer Advisory Success',
    title: 'Establish Customer Success Automated Scorecard',
    description: 'Integrate live telemetry tracking to export MBR scorecards directly to customer channels via email/Slack.',
    owner: 'David Carter',
    dueDate: '2026-08-01',
    status: 'todo',
    priority: 'low'
  }
];

export const DEFAULT_SIMULATION_CONFIG: GTMOSSimulationConfig = {
  marketingBudget: 15000,
  pricingMultiplier: 1.0,
  salesCycleSpeed: 1.0,
  conversionRate: 2.2,
  primaryGTMPath: 'hybrid'
};

export const DEFAULT_STRATEGY: GTMOSStrategy = {
  id: 'strat-revos-intelligence',
  org_id: null,
  creator_id: null,
  title: 'RevOS Enterprise GTM Strategy',
  market_segment: 'B2B SaaS Mid-Market & Enterprise',
  strategic_objective: 'Aquire 100 enterprise accounts at average Contract Value of $75k/yr.',
  raw_input: {
    pillars: DEFAULT_PILLARS,
    simulationConfig: DEFAULT_SIMULATION_CONFIG,
    actions: DEFAULT_ACTIONS
  },
  structured_intelligence: {
    overallScoring: 92,
    vulnerabilityAlerts: [
      'Expansion metrics rely heavily on seat counts, creating a risk in downsizing firms.',
      'Outbound campaigns could face saturation; inbound SEO content quality is a critical single-point of dependency.'
    ],
    aiRecommendations: [
      {
        id: 'rec-1',
        pillarId: 'pricing_packaging',
        title: 'Introduce non-user volume expansion trigger',
        description: 'Establish platform tier expansion based on the total value of pipeline monitored rather than pure seat counts. This insulates revenue against enterprise seat downsizing in tech markets.',
        priority: 'high'
      },
      {
        id: 'rec-2',
        pillarId: 'marketing_leads',
        title: 'Launch CRM-triggered personalized LinkedIn ads',
        description: 'Automatically trigger personalized account-based display ad campaigns on LinkedIn the moment an account in our tier target hires a new CRO or CFO.',
        priority: 'medium'
      },
      {
        id: 'rec-3',
        pillarId: 'customer_success',
        title: 'Reward active sandbox users with API credit grants',
        description: 'Provide an extra 5,000 API compute tokens to trial users who successfully configure their first pipeline compliance automated warning rule within their first 7 days.',
        priority: 'low'
      }
    ],
    marketPositioningAnalysis: 'Strong product-market alignment targeting clear, quantitative pain points (forecast predictability and pipeline leakage). The hybrid PLG to Enterprise SLG motion leverages organic growth safely while ensuring enterprise ACV scale.',
    normalizedSummary: 'Highly defensible revenue-automation framework with structured L2 semantic CRM orchestration, solid unit economics (LTV:CAC 4.8:1), and high gross margins (88%).'
  }
};
