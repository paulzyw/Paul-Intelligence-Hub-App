/**
 * RevOS Pipeline Assessment Engine - Core TypeScript Types
 * Governed by:
 *   - Pipeline Technical Design Specification v1.1
 *   - Pipeline Assessment Data Inheritance Framework v1.0 (PADIF)
 *   - Pipeline SWOT Intelligence Master Schema v1.0
 *   - Pipeline Assessment Rules v1.1
 */

export type CanonicalRevenueMotionId = 
  | 'RM01_Digital_Solution_Selling'
  | 'RM02_Professional_Solution_Services'
  | 'RM03_Digital_Transformation_OT'
  | 'RM04_Engineering_Project_Solutions'
  | 'RM05_Project_Procurement'
  | 'RM06_Generic_Solution_Selling';

export type PADFDimensionId =
  | 'PA1_Customer_Value_and_Urgency'
  | 'PA2_Buying_Center_and_Influence'
  | 'PA3_Buying_Process_and_Decision_Control'
  | 'PA4_Solution_and_Value_Proposition'
  | 'PA5_Competitive_Position'
  | 'PA6_Commercial_and_Deal_Structure'
  | 'PA7_Sales_Execution_and_Deal_Readiness'
  | 'PA8_Deal_Momentum_Risk_and_Closeability';

export type SWOTCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

export type TOWSType = 'SO' | 'WO' | 'ST' | 'WT';

export type RuntimeRelationshipType = 
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'QUALIFIES'
  | 'CONTEXTUALIZES'
  | 'GAP_SIGNAL'
  | 'CHANGE_SIGNAL';

export type RuntimePolarityType =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNDETERMINED';

export type EvidenceGapType =
  | 'missing_evidence'
  | 'insufficient_evidence'
  | 'conflicting_evidence'
  | 'outdated_evidence'
  | 'unverified_assumption';

export interface PipelineOpportunity {
  id?: string;
  pipeline_id: string;
  lead_id?: string;
  opportunity_id?: string;
  tenant_id?: string;
  customer_id?: string;
  customer_name: string;
  opportunity_name: string;
  industry_id: string;
  industry_name: string;
  revenue_motion_id: CanonicalRevenueMotionId | string;
  revenue_motion_name: string;
  deal_value: number;
  currency: string;
  sales_stage: string;
  pipeline_stage: string;
  forecast_category?: string;
  expected_close_date?: string;
  opportunity_owner: string;
  lifecycle_status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED_WON' | 'CLOSED_LOST';
  source_system?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineInheritance {
  id?: string;
  inheritance_id: string;
  pipeline_id: string;
  opportunity_id?: string;
  lead_id?: string;
  source_qualification_id?: string;
  source_module: string;
  framework_version: string;
  qualification_decision?: string;
  qualification_score?: number;
  qualification_confidence?: number;
  inherited_payload: Record<string, unknown>;
  validation_status: 'VALIDATED' | 'REQUIRES_REVALIDATION' | 'SUPERSEDED';
  inherited_at?: string;
  revalidated_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineEvidence {
  id?: string;
  evidence_instance_id: string;
  pipeline_id: string;
  evidence_object_id?: string;
  evidence_type: string;
  evidence_statement: string;
  source_type: string;
  source_reference?: string;
  source_date?: string;
  recorded_by?: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED' | 'STALE';
  evidence_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  evidence_confidence: number; // 0 - 100 Knowledge Base scale
  customer_confirmed: boolean;
  freshness_days?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineEvidenceRelationship {
  id?: string;
  relationship_id: string;
  evidence_instance_id: string;
  pipeline_id: string;
  target_factor_id?: string;
  target_dimension_id?: PADFDimensionId | string;
  mapping_source?: string;
  mapping_relevance: 'DIRECT' | 'SUPPORTING' | 'INDIRECT';
  runtime_relationship: RuntimeRelationshipType;
  runtime_polarity: RuntimePolarityType;
  runtime_interpretation?: string;
  evaluation_reference?: string;
  created_at?: string;
}

export interface PipelineAssessment {
  id?: string;
  assessment_id: string;
  pipeline_id: string;
  assessment_sequence: number;
  assessment_status: 'INITIALIZING' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED';
  trigger_type: 'INITIAL_ASSESSMENT' | 'EVIDENCE_UPDATE' | 'REASSESSMENT' | 'STAGE_CHANGE';
  base_winability: number; // 0 - 100 deterministic
  risk_adjusted_winability: number; // 0 - 100 deterministic
  pipeline_health: 'STRONG' | 'HEALTHY' | 'MODERATE' | 'AT_RISK' | 'CRITICAL';
  assessment_confidence: number; // 0 - 100
  configuration_version: string;
  evidence_kb_version: string;
  rules_version: string;
  reasoning_prompt_version: string;
  model_identifier: string;
  raw_reasoning_output?: Record<string, unknown>;
  executive_summary?: {
    overall_assessment?: string;
    current_strengths?: string[];
    key_constraints?: string[];
    key_risks?: string[];
    evidence_gaps?: string[];
    priority_actions?: string[];
  };
  created_by?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelinePADFResult {
  id?: string;
  assessment_id: string;
  pipeline_id: string;
  dimension_id: PADFDimensionId | string;
  dimension_name: string;
  dimension_score: number; // 0 - 100 deterministic
  assessment_state: 'STRONG' | 'HEALTHY' | 'MODERATE' | 'VULNERABLE' | 'UNKNOWN';
  evidence_coverage: 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'NONE';
  key_strengths?: string[];
  key_weaknesses?: string[];
  evidence_references?: string[];
  business_implications?: string;
  recommended_actions?: string[];
  created_at?: string;
}

export interface PipelineSWOTResult {
  id?: string;
  assessment_id: string;
  pipeline_id: string;
  factor_id: string;
  factor_name: string;
  factor_type: SWOTCategory;
  factor_layer: 'universal_baseline' | 'revenue_motion_override' | 'industry_override';
  strategic_impact: number; // 1 - 5 ordinal
  evidence_confidence: number; // 1 - 5 ordinal
  relevance: number; // 1 - 5 ordinal
  urgency: number; // 1 - 5 ordinal
  manageability: number; // 1 - 5 ordinal
  winability_influence: number; // 1 - 5 ordinal
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  assessment_state: 'EVALUATED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_EVIDENCE';
  evaluation_rationale?: string;
  supporting_evidence_ids?: string[];
  contradicting_evidence_ids?: string[];
  related_padf_dimensions?: string[];
  created_at?: string;
}

export interface PipelineRisk {
  id?: string;
  risk_instance_id: string;
  assessment_id: string;
  pipeline_id: string;
  risk_id: string;
  risk_category: string;
  risk_description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  likelihood: 'HIGH' | 'MODERATE' | 'LOW';
  impact: 'SEVERE' | 'MODERATE' | 'MINOR';
  triggering_evidence?: string[];
  risk_status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED' | 'ACCEPTED';
  mitigation_strategy?: string;
  mitigation_actions?: string[];
  owner?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineStrategy {
  id?: string;
  strategy_instance_id: string;
  assessment_id: string;
  pipeline_id: string;
  strategy_id: string;
  strategy_type: TOWSType | 'WINNING_PLAYBOOK';
  tows_category?: string;
  strategic_objective: string;
  strategic_rationale: string;
  supporting_swot_factor_ids?: string[];
  supporting_evidence_ids?: string[];
  related_risk_ids?: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expected_impact: string;
  feasibility: 'HIGH' | 'MODERATE' | 'CHALLENGING';
  dependencies?: string[];
  strategy_status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUPERSEDED';
  created_at?: string;
  updated_at?: string;
}

export interface PipelineAction {
  id?: string;
  action_id: string;
  strategy_instance_id?: string;
  pipeline_id: string;
  action_description: string;
  strategic_objective?: string;
  action_owner: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  target_date?: string;
  action_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  completion_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineAssessmentSnapshot {
  id?: string;
  snapshot_id: string;
  assessment_id: string;
  pipeline_id: string;
  snapshot_sequence: number;
  snapshot_timestamp: string;
  full_snapshot_payload: {
    opportunity: PipelineOpportunity;
    inheritance: PipelineInheritance;
    evidence: PipelineEvidence[];
    padf_results: PipelinePADFResult[];
    swot_results: PipelineSWOTResult[];
    risks: PipelineRisk[];
    strategies: PipelineStrategy[];
    actions: PipelineAction[];
    assessment: PipelineAssessment;
  };
  created_at?: string;
}
