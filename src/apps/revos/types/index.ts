/**
 * RevOS Foundational Types
 * Defines the core models for the Revenue Operating System sandbox.
 */

export type RevOSRole = 
  | 'guest'
  | 'free_user'
  | 'paid_user'
  | 'enterprise_user'
  | 'workspace_admin'
  | 'enterprise_executive'
  | 'revos_admin'
  | 'super_admin';

export interface RevOSOrg {
  id: string;
  name: string;
  domain?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface RevOSProfile {
  id: string;
  org_id: string | null;
  role: RevOSRole;
  is_active: boolean;
  api_usage_quota: number;
  created_at: string;
}

export interface RevOSModuleState {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  last_ai_insight?: string;
}

export interface RevOSState {
  profile: RevOSProfile | null;
  org: RevOSOrg | null;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// Go-To-Market Operating System (GTMOS) Types
// ==========================================

export type GTMOSPillarId =
  | 'market_opportunity'
  | 'target_personas'
  | 'value_prop'
  | 'pricing_packaging'
  | 'sales_channels'
  | 'marketing_leads'
  | 'customer_success'
  | 'unit_economics'
  | 'differentiation';

export interface GTMOSPillar {
  id: GTMOSPillarId;
  title: string;
  subtitle: string;
  percentageComplete: number;
  summary: string;
  keyMetrics: { label: string; value: string }[];
  strategicPoints: string[];
  rawText?: string;
}

export interface GTMOSSimulationConfig {
  marketingBudget: number; // $ per month
  pricingMultiplier: number; // 0.5 to 2.5
  salesCycleSpeed: number; // multiplier e.g. 1.0 is standard, 1.5 is faster, 0.7 slower
  conversionRate: number; // standard e.g. 2.0%
  primaryGTMPath: 'plg' | 'slg' | 'hybrid';
}

export interface GTMOSSimulationDataPoint {
  month: number;
  monthName: string;
  mrr: number;
  totalCustomers: number;
  cac: number;
  ltv: number;
  conversionRate: number;
  paybackMonths: number;
  ltvToCac: number;
}

export interface GTMOSAction {
  id: string;
  program: string; // e.g. 'Demand Generation', 'Product-Led Optimization', 'Sales Enablement', 'Customer Advisory'
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface GTMOSStrategy {
  id: string;
  org_id: string | null;
  creator_id: string | null;
  title: string;
  market_segment: string;
  strategic_objective: string;
  raw_input: {
    pillars: Record<GTMOSPillarId, GTMOSPillar>;
    simulationConfig?: GTMOSSimulationConfig;
    actions?: GTMOSAction[];
  };
  structured_intelligence?: {
    overallScoring: number;
    vulnerabilityAlerts: string[];
    aiRecommendations: { id: string; pillarId: GTMOSPillarId; title: string; description: string; priority: 'low' | 'medium' | 'high' }[];
    marketPositioningAnalysis: string;
    normalizedSummary: string;
  };
  created_at?: string;
  updated_at?: string;
}

