import { OnboardingCategoryFields, CategoryInfo } from './types';

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
