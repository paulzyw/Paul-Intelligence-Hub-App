import { OnboardingCategoryFields, CategoryInfo, GTMOSProject } from './types';

export const CATEGORY_SPECS: CategoryInfo[] = [
  {
    id: 'company_info',
    name: 'Company Information',
    stepNumber: 2,
    fields: [
      'companyName',
      'industry',
      'headquarters',
      'countriesServed',
      'employeeCount',
      'annualRevenue',
      'growthStage',
      'fundingStage',
      'businessModel',
      'strategicPriorities'
    ]
  },
  {
    id: 'product_info',
    name: 'Product & Service Info',
    stepNumber: 3,
    fields: [
      'productName',
      'productCategory',
      'productDescription',
      'keyFeatures',
      'keyBenefits',
      'uniqueDifferentiators',
      'competitiveAdvantages',
      'technologyPlatform',
      'deploymentModel',
      'pricingModel'
    ]
  },
  {
    id: 'business_objectives',
    name: 'Business Objectives',
    stepNumber: 4,
    fields: [
      'primaryBusinessGoal',
      'revenueTarget',
      'pipelineTarget',
      'marketShareTarget',
      'customerAcquisitionGoal',
      'expansionGoal',
      'timeHorizon'
    ]
  },
  {
    id: 'market_info',
    name: 'Market Information',
    stepNumber: 5,
    fields: [
      'targetIndustries',
      'targetGeographies',
      'marketSize',
      'marketGrowthRate',
      'marketTrends',
      'competitorList',
      'competitivePosition'
    ]
  },
  {
    id: 'customer_info',
    name: 'Customer Information',
    stepNumber: 6,
    fields: [
      'existingCustomerBase',
      'bestCustomers',
      'customerIndustries',
      'customerSizes',
      'typicalBuyers',
      'painPoints',
      'buyingTriggers',
      'buyingProcess',
      'decisionMakingStructure'
    ]
  },
  {
    id: 'current_gtm_info',
    name: 'Current GTM Status',
    stepNumber: 7,
    fields: [
      'currentSalesMotion',
      'currentChannels',
      'existingPartners',
      'currentMarketingActivities',
      'pipelinePerformance',
      'conversionRates',
      'winRates'
    ]
  },
  {
    id: 'execution_readiness',
    name: 'Execution Readiness',
    stepNumber: 8,
    fields: [
      'salesTeamSize',
      'marketingTeamSize',
      'customerSuccessTeamSize',
      'partnerTeamSize',
      'availableBudget',
      'existingAssets',
      'CRMPlatform',
      'marketingTechnologyStack'
    ]
  },
  {
    id: 'metrics_performance',
    name: 'Metrics & Performance',
    stepNumber: 9,
    fields: [
      'revenue',
      'ARR',
      'pipeline',
      'opportunities',
      'winRate',
      'customerRetention',
      'customerSatisfaction',
      'CAC',
      'LTV'
    ]
  }
];

export const EMPTY_ONBOARDING_FIELDS: OnboardingCategoryFields = {
  companyName: '',
  industry: '',
  headquarters: '',
  countriesServed: '',
  employeeCount: '',
  annualRevenue: '',
  growthStage: '',
  fundingStage: '',
  businessModel: '',
  strategicPriorities: '',

  productName: '',
  productCategory: '',
  productDescription: '',
  keyFeatures: '',
  keyBenefits: '',
  uniqueDifferentiators: '',
  competitiveAdvantages: '',
  technologyPlatform: '',
  deploymentModel: '',
  pricingModel: '',

  primaryBusinessGoal: '',
  revenueTarget: '',
  pipelineTarget: '',
  marketShareTarget: '',
  customerAcquisitionGoal: '',
  expansionGoal: '',
  timeHorizon: '',

  targetIndustries: '',
  targetGeographies: '',
  marketSize: '',
  marketGrowthRate: '',
  marketTrends: '',
  competitorList: '',
  competitivePosition: '',

  existingCustomerBase: '',
  bestCustomers: '',
  customerIndustries: '',
  customerSizes: '',
  typicalBuyers: '',
  painPoints: '',
  buyingTriggers: '',
  buyingProcess: '',
  decisionMakingStructure: '',

  currentSalesMotion: '',
  currentChannels: '',
  existingPartners: '',
  currentMarketingActivities: '',
  pipelinePerformance: '',
  conversionRates: '',
  winRates: '',

  salesTeamSize: '',
  marketingTeamSize: '',
  customerSuccessTeamSize: '',
  partnerTeamSize: '',
  availableBudget: '',
  existingAssets: '',
  CRMPlatform: '',
  marketingTechnologyStack: '',

  revenue: '',
  ARR: '',
  pipeline: '',
  opportunities: '',
  winRate: '',
  customerRetention: '',
  customerSatisfaction: '',
  CAC: '',
  LTV: ''
};

export const INITIAL_ONBOARDING_FIELDS: OnboardingCategoryFields = {
  companyName: 'RevOS Technologies',
  industry: 'SaaS / Software',
  headquarters: 'Singapore (Global Hub)',
  countriesServed: 'United States, United Kingdom, Singapore, Australia',
  employeeCount: '120 employees',
  annualRevenue: '$24M ARR',
  growthStage: 'Scale-up Growth Stage',
  fundingStage: 'Series B ($35M raised)',
  businessModel: 'B2B Enterprise SaaS',
  strategicPriorities: 'Accelerate enterprise contract sizes, minimize sales cycle duration, plug pipeline friction leaks',

  productName: 'RevOS Intelligence Ledger',
  productCategory: 'Revenue Decision Systems (L2 Operations)',
  productDescription: 'Continuous, real-time strategy enforcement agent that analyzes live sales pipeline signals and highlights execution discrepancies natively in CRM ledgers.',
  keyFeatures: 'Generative GTM semantic mapping, zero-logging automated telemetry, secure CRM ledger indexing',
  keyBenefits: '30% reduction in stale pipeline deals, 15% increase in forecast confidence, proactive sales coaching signals',
  uniqueDifferentiators: 'Traditional solutions show static dashboard summaries; RevOS models dynamic strategies and enforces them directly over raw daily activities.',
  competitiveAdvantages: 'Proprietary graph reasoning patent, native zero-latency connection into Salesforce/HubSpot, clean and scalable data structure',
  technologyPlatform: 'Next-generation reasoning graphs and vector engines',
  deploymentModel: 'Cloud Native Secure Tenant / Shared SaaS Instance',
  pricingModel: '$120 - $250 user seat seat licenses with value-add prepaid computing tiers',

  primaryBusinessGoal: 'Revenue Growth & Enterprise Account Focus',
  revenueTarget: '$45M recurring revenue',
  pipelineTarget: '$180M active sales pipeline opportunities',
  marketShareTarget: '12% of APAC/US Mid-Market revops solutions base',
  customerAcquisitionGoal: 'Acquire 100 enterprise accounts at ACV value of $75,000/year',
  expansionGoal: 'Achieve 118% Net Revenue Retention through usage credits',
  timeHorizon: '18 Months timeframe goal',

  targetIndustries: 'High-growth B2B Tech, SaaS, Cybersecurity, Cloud Infrastructure',
  targetGeographies: 'North America, United Kingdom, APJ Markets',
  marketSize: '$2.4B Addressable Market Segment',
  marketGrowthRate: '22% YoY Sector CAGR',
  marketTrends: 'Shift towards AI-augmented sales enablement and extreme pipeline hygiene requirements from CFOs',
  competitorList: 'Clari, Gong, Salesforce Revenue Cloud, HubSpot Sales Hub',
  competitivePosition: 'Specialized strategy-to-execution Layer 2 reasoning platform',

  existingCustomerBase: '45 active customer logos across tech/SaaS',
  bestCustomers: 'Firms with $20M-$150M ARR and active sales teams of 30+ reps',
  customerIndustries: 'Cloud Security, Logistics Platforms, Developer Tools',
  customerSizes: '100 - 500 employee headcount organizations',
  typicalBuyers: 'Chief Revenue Officers, VPs of Sales Operations, CFOs',
  painPoints: 'Predictability gaps in pipelines, dirty Salesforce entries, high sales onboarding ramp times',
  buyingTriggers: 'Underperforming a quarterly target, onboarding a new CRO, or active CRM migration failures',
  buyingProcess: 'Vetted by RevOps Team, verified by Security, signed off by CFO and CRO',
  decisionMakingStructure: 'Cross-functional operations review with formal pilot validation',

  currentSalesMotion: 'Mainly Outbound Enterprise Sales paired with organic incoming trials',
  currentChannels: 'Direct sales reps, tech ISV referral networks, consultancies',
  existingPartners: 'Salesforce AppExchange Integrator Network, Regional RevOps consultancy firms',
  currentMarketingActivities: 'Thought leadership studies, targeted Account-Based sequences, executive webinars',
  pipelinePerformance: 'Average sales duration 45 days, average contract size $62,000',
  conversionRates: '15% Meeting-to-Opportunity conversion',
  winRates: '22% Opportunity Close-Win Ratio',

  salesTeamSize: '15 Direct Sales Representatives, 4 SDRs, 3 sales managers',
  marketingTeamSize: '5 Campaign Leads, 2 content/design leads',
  customerSuccessTeamSize: '6 dedicated Integration Leads',
  partnerTeamSize: '2 Channels Program Managers',
  availableBudget: '$3.5M allocation for annual programs',
  existingAssets: 'Comprehensive whitepapers, customer testimonial videos, and standard demo environments',
  CRMPlatform: 'Salesforce enterprise cloud & HubSpot pro',
  marketingTechnologyStack: 'Marketo, LinkedIn Sales Navigator, ZoomInfo, RevOS Sandbox UI',

  revenue: '$24M recurring ARR',
  ARR: '$24,000,000 current ARR',
  pipeline: '$72,000,000 active pipeline volume',
  opportunities: '320 active opportunities',
  winRate: '22% opportunity-won benchmark',
  customerRetention: '95% Gross Revenue Retention',
  customerSatisfaction: '94% Customer Net Promoter Score',
  CAC: '$8,500 standard client acquisition cost',
  LTV: '$310,000 customer lifetime value'
};

export const DEFAULT_PILLARS = {
  market_opportunity: {
    title: 'Market Opportunity Analysis',
    subtitle: 'Define your ICP, TAM, SAM, and SOM metrics.',
    percentageComplete: 100,
    summary: 'RevOS Technologies targets high-growth B2B Tech and SaaS companies with $20M-$250M ARR, establishing a SAM of $2.4B globally.',
    keyMetrics: [
      { label: 'TAM', value: '$12.5B' },
      { label: 'SAM', value: '$2.4B' },
      { label: 'SOM (3yr Target)', value: '$280M' }
    ],
    strategicPoints: [
      'Focus primary sales efforts on high-growth SaaS firms undergoing CRO change events.',
      'Prioritize North American and APJ regions leveraging Singapore headquarters.',
      'Differentiate through localized market compliance positioning.'
    ]
  },
  target_personas: {
    title: 'Target Personas & Pain Points',
    subtitle: 'Key influencers and purchase decision blockers.',
    percentageComplete: 100,
    summary: 'Aimed at CROs, VP of RevOps, and CFOs facing predictability leaks and dirty CRM pipelines.',
    keyMetrics: [
      { label: 'Buying Personas', value: 'CRO, VP RevOps, CFO' },
      { label: 'Avg ACV', value: '$75k/year' },
      { label: 'Pain Point Focus', value: 'Predictability Gaps' }
    ],
    strategicPoints: [
      'CROs: Highlight quarterly forecast predictability improvements.',
      'VPs of RevOps: Highlight zero-logging automated hygiene benefits.',
      'CFOs: Emphasize the 9-month payback ROI proof point.'
    ]
  },
  value_prop: {
    title: 'Value Proposition & Positioning',
    subtitle: 'Core product differentiators.',
    percentageComplete: 100,
    summary: 'Continuous, real-time strategy enforcement layer connecting high-level strategy to front-line sales behaviors directly inside CRM.',
    keyMetrics: [
      { label: 'Core Claim', value: '30% leakage reduction' },
      { label: 'Category', value: 'Revenue Ledger L2' },
      { label: 'TTV', value: '7 Days' }
    ],
    strategicPoints: [
      'Elevate from retrospective charts to active strategic orchestration.',
      'Enforce rules natively inside lead and account lifecycles.',
      'Requires zero administrative logging from sales reps.'
    ]
  },
  pricing_packaging: {
    title: 'Pricing & Packaging Strategy',
    subtitle: 'Structuring monetization layers.',
    percentageComplete: 100,
    summary: 'Dual seat-based pricing model commencing at $120/mo user billing with prepaid API credits for model usage.',
    keyMetrics: [
      { label: 'Pro User License', value: '$120/user/mo' },
      { label: 'Enterprise Floor', value: '$45,000/yr' },
      { label: 'Expansion Metric', value: 'AI token usage' }
    ],
    strategicPoints: [
      'Lower friction for midmarket with a self-serve 10-user prepaid tier.',
      'Incorporate custom compliance rules inside premium enterprise tiers.',
      'Leverage active seat expansion matching active CRM directory synchronization.'
    ]
  },
  sales_channels: {
    title: 'Sales & Distribution Channels',
    subtitle: 'Sandbox signups and Direct Sales.',
    percentageComplete: 100,
    summary: 'Hybrid model combining product-led growth (PLG) trials with Direct Enterprise Outbound sales reps.',
    keyMetrics: [
      { label: 'Primary Cycle', value: '45 Days' },
      { label: 'PLG Conversion', value: '15%' },
      { label: 'Outbound ACV', value: '$75k' }
    ],
    strategicPoints: [
      'Implement an automated trial sandbox showing target pipeline leaks in 5 minutes.',
      'Direct outbound targeting CRO hires to pitch proactive GTM readiness.',
      'Build localized consultancy partnerships to co-sell RevOS optimization services.'
    ]
  },
  marketing_leads: {
    title: 'Marketing & Lead Generation',
    subtitle: 'Inbound SEO and specialized ABM.',
    percentageComplete: 100,
    summary: 'Dual emphasis on SEO-driven proprietary SaaS pipeline research reports and focused ABM campaigns.',
    keyMetrics: [
      { label: 'Planned CAC', value: '$8,500' },
      { label: 'ABM Conversion', value: '18% Meeting-to-Opp' },
      { label: 'SEO Site Share', value: '35%' }
    ],
    strategicPoints: [
      'Publish biannual quantitative studies on pipeline data leaks.',
      'Deploy personalized micro-landing environments for Tier-1 ABM target lists.',
      'Utilize LinkedIn automated ad matching tied directly to leadership hire signals.'
    ]
  },
  customer_success: {
    title: 'Customer Success & Retention',
    subtitle: 'Onboarding, CSAT, and expansion.',
    percentageComplete: 100,
    summary: 'Intensive 14-day technical setup cycle delivering fully integrated audits to guarantee high NRR.',
    keyMetrics: [
      { label: 'Target NRR', value: '118%' },
      { label: 'NPS Goal', value: '94%' },
      { label: 'Time-to-Initial Value', value: '5 Days' }
    ],
    strategicPoints: [
      'Focus initial 30 days purely on technical data hygiene and ledger setup.',
      'Provide automated quarterly scorecards plotting returned value and plugged pipeline leaks.',
      'Integrate product feedback loops directly within user account portals.'
    ]
  },
  unit_economics: {
    title: 'Unit Economics & Payback',
    subtitle: 'Margins, paybacks, and lifetime values.',
    percentageComplete: 100,
    summary: 'Strong LTV:CAC of 4.8x anchored by high platform gross margins and low compute overhead.',
    keyMetrics: [
      { label: 'LTV:CAC', value: '4.8:1' },
      { label: 'Payback period', value: '9.2 Months' },
      { label: 'Gross Margin', value: '88%' }
    ],
    strategicPoints: [
      'Leverage metadata-only architectures to support minimal cloud storage requirements.',
      'Increase LTV through usage-based premium AI strategy simulations.',
      'Ensure PLG CAC remains sub-$1,200 via high viral loops.'
    ]
  },
  differentiation: {
    title: 'Defensive Moats & Differentiators',
    subtitle: 'Technical barriers to entry.',
    percentageComplete: 100,
    summary: 'Generative semantic strategic rules layer representing unique IP patterns far outperforming static BI dashboards.',
    keyMetrics: [
      { label: 'Patents Active', value: '3 Patents' },
      { label: 'Sync Frequency', value: 'Near Real-time' },
      { label: 'Platform Moat', value: 'Active strategic rules' }
    ],
    strategicPoints: [
      'Proprietary graph structures converting guidelines into logical constraints.',
      'Deep organizational integration: highly disruptive to switch once deployed.',
      'Growth-driven network effect: benchmarks improve as data registry climbs.'
    ]
  }
};

export const SEED_PROJECTS: GTMOSProject[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'RevOS Technologies Strategic Expansion',
    market_segment: 'B2B SaaS / Enterprise SaaS',
    strategic_objective: 'Aquire 100 enterprise accounts at average Contract Value of $75k/yr.',
    currentStep: 1,
    onboarding: INITIAL_ONBOARDING_FIELDS,
    aiReasoning: 'RevOS Technologies displays a highly coherent growth profile. The Series B funding ($35M) provides adequate execution runway ($3.5M budget) to expand its sales force. The differentiation model is highly defensible due to proprietary logic graph patents, resolving the typical CRO forecast predictibility pain points. Some friction lies in outbound CAC margins which must be cushioned with cheaper self-serve trial PLG tiers.',
    aiVulnerabilities: [
      'High Outbound SDR cost could drag unit economics unless PLG conversions cross 15%.',
      'Seat-based monetization sits under deflation stress; usage based computational token credits are crucial to insulate gross revenue margins.',
      'Geographical spread (US, UK, APJ) strains support teams under Series B scale limits.'
    ],
    readinessScore: 88,
    pillars: DEFAULT_PILLARS,
    tasks: [
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
      }
    ],
    simulationData: null,
    simulationConfig: {
      marketingBudget: 15000,
      pricingMultiplier: 1.0,
      salesCycleSpeed: 1.0,
      conversionRate: 2.2,
      primaryGTMPath: 'hybrid'
    },
    risks: [
      {
        id: 'risk-1',
        title: 'CRM API Ingestion Bottleneck',
        level: 'Orange',
        probability: 'Medium',
        impact: 'High',
        description: 'Salesforce bulk API rate ceilings could delay near-live strategy ledger synchronization for large accounts.',
        mitigation: 'Implement delta-only metadata cache pipelines and off-peak cron processing logic.'
      },
      {
        id: 'risk-2',
        title: 'SDR Outbound Burn-out',
        level: 'Yellow',
        probability: 'Medium',
        impact: 'Moderate',
        description: 'Outbound enterprise lead volume could drop if manual messaging steps are too taxing on Series B SDR cohorts.',
        mitigation: 'Equip representatives with AI intent triggers tied directly to target CRO executive transfers.'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        category: 'Pricing Alignment',
        title: 'Introduce Pipeline Value Billing Expansion Cap',
        impact: 'High',
        effort: 'Medium',
        actionableSteps: 'Transition pricing tiers from seat caps to total dollar value of pipeline monitored. This limits ARR downgrades when clients downsize staff rows.'
      }
    ]
  }
];
