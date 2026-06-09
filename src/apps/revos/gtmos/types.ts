// GTMOS 20-Step TypeScript Types

export interface OnboardingCategoryFields {
  companyName: string;
  industry: string;
  headquarters: string;
  countriesServed: string;
  employeeCount: string;
  annualRevenue: string;
  growthStage: string;
  fundingStage: string;
  businessModel: string;
  strategicPriorities: string;

  productName: string;
  productCategory: string;
  productDescription: string;
  keyFeatures: string;
  keyBenefits: string;
  uniqueDifferentiators: string;
  competitiveAdvantages: string;
  technologyPlatform: string;
  deploymentModel: string;
  pricingModel: string;

  primaryBusinessGoal: string;
  revenueTarget: string;
  pipelineTarget: string;
  marketShareTarget: string;
  customerAcquisitionGoal: string;
  expansionGoal: string;
  timeHorizon: string;

  targetIndustries: string;
  targetGeographies: string;
  marketSize: string;
  marketGrowthRate: string;
  marketTrends: string;
  competitorList: string;
  competitivePosition: string;

  existingCustomerBase: string;
  bestCustomers: string;
  customerIndustries: string;
  customerSizes: string;
  typicalBuyers: string;
  painPoints: string;
  buyingTriggers: string;
  buyingProcess: string;
  decisionMakingStructure: string;

  currentSalesMotion: string;
  currentChannels: string;
  existingPartners: string;
  currentMarketingActivities: string;
  pipelinePerformance: string;
  conversionRates: string;
  winRates: string;

  salesTeamSize: string;
  marketingTeamSize: string;
  customerSuccessTeamSize: string;
  partnerTeamSize: string;
  availableBudget: string;
  existingAssets: string;
  CRMPlatform: string;
  marketingTechnologyStack: string;

  revenue: string;
  ARR: string;
  pipeline: string;
  opportunities: string;
  winRate: string;
  customerRetention: string;
  customerSatisfaction: string;
  CAC: string;
  LTV: string;
}

export type CategoryId =
  | 'company_info'
  | 'product_info'
  | 'business_objectives'
  | 'market_info'
  | 'customer_info'
  | 'current_gtm_info'
  | 'execution_readiness'
  | 'metrics_performance';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  stepNumber: number;
  fields: (keyof OnboardingCategoryFields)[];
}

export interface MetricItem {
  label: string;
  value: string;
}

export interface StrategyPillar {
  title: string;
  subtitle: string;
  percentageComplete: number;
  summary: string;
  keyMetrics: MetricItem[];
  strategicPoints: string[];
}

export interface GTMOSActionTask {
  id: string;
  program: string;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface GTMOSSimulationState {
  marketingBudget: number;
  pricingMultiplier: number;
  salesCycleSpeed: number;
  conversionRate: number;
  primaryGTMPath: string;
}

export interface GTMOSRisk {
  id: string;
  title: string;
  level: string; // Red, Orange, Yellow
  probability: string;
  impact: string;
  description: string;
  mitigation: string;
}

export interface GTMOSRecommendation {
  id: string;
  category: string;
  title: string;
  impact: string;
  effort: string;
  actionableSteps: string;
}

export interface GTMActionItem {
  id: string;
  actionName: string;
  description: string;
  taskType: string;
  owner: string;
  startDate: string;
  dueDate: string;
  dependencies: string;
  completionCriteria: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  progress?: number;
}

export interface GTMKPI {
  id: string;
  kpiName: string;
  kpiCategory: string;
  baseline: string;
  target: string;
  currentValue: string;
  measurementFrequency: string;
  owner: string;
}

export interface GTMRisk {
  id: string;
  riskName: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskScore: number;
  mitigationPlan: string;
  owner: string;
}

export interface GTMDependency {
  id: string;
  dependencyType: string;
  blockingInitiative: string;
  blockedInitiative: string;
  impactDescription: string;
}

export interface GTMAIMonitoringRule {
  id: string;
  metric: string;
  targetThreshold: string;
  alertThreshold: string;
  triggerCondition: string;
  recommendedAction: string;
}

export interface GTMInitiative {
  id: string;
  initiativeName: string;
  description: string;
  strategicObjective: string;
  expectedOutcome: string;
  priority: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
  budget: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  actions: GTMActionItem[];
  kpis: GTMKPI[];
  risks: GTMRisk[];
  dependencies: GTMDependency[];
  aiMonitoringRules: GTMAIMonitoringRule[];
}

export interface GTMWorkstream {
  id: string;
  workstreamName: string;
  purpose: string;
  relatedGtmPillar: string;
  priority: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
  initiatives: GTMInitiative[];
}

export interface GTMExecutionPlan {
  programName: string;
  description: string;
  strategicObjective: string;
  revenueGoal: string;
  businessGoal: string;
  launchPeriod: string;
  status: string;
  executiveSponsor: string;
  workstreams: GTMWorkstream[];
  governance: {
    raciAssignment: string;
    reviewCadence: string;
    escalationPath: string;
  };
  executiveSummary: string;
}

export interface GTMOSProject {
  id: string;
  title: string;
  market_segment: string;
  strategic_objective: string;
  currentStep: number;
  onboarding: OnboardingCategoryFields;
  aiReasoning: string | null;
  aiVulnerabilities: string[];
  readinessScore: number;
  pillars: Record<string, StrategyPillar> | null;
  tasks: GTMOSActionTask[];
  simulationData: any[] | null;
  simulationConfig: GTMOSSimulationState;
  risks: GTMOSRisk[];
  recommendations: GTMOSRecommendation[];
  gtmStrategyDraft?: Record<string, string[]> | null;
  gtmCanvas?: Record<string, string> | null;
  gtmExecutionPlan?: GTMExecutionPlan | null;
  archivedExecutionPlan?: GTMExecutionPlan | null;
}
