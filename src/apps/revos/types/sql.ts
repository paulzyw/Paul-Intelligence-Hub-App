// SQL Qualification MEDDPICC-Aligned Type Definitions

export interface SQLOpportunity {
  id: string;
  organization_id?: string;
  company_name: string;
  industry: string;
  revenue_motion: string;
  opportunity_name: string;
  description?: string;
  source?: string;
  mql_reference_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SQLAssessment {
  id: string;
  opportunity_id: string;
  assessment_status: 'created' | 'collecting_evidence' | 'ai_processing' | 'review' | 'completed';
  qualification_status?: 'Qualified' | 'Conditionally Qualified' | 'Needs More Evidence' | 'Disqualified';
  overall_score?: number;
  confidence_score?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface SQLEvidenceRecord {
  id: string;
  assessment_id: string;
  dimension_code: string;
  evidence_object_id: string;
  evidence_content: string;
  evidence_source: string;
  validation_status: 'unverified' | 'customer_confirmed' | 'verified';
  created_at?: string;
}

export interface SQLDimensionResult {
  id: string;
  assessment_id: string;
  dimension_code: string;
  dimension_name: string;
  score: number;
  confidence: number;
  assessment_summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  created_at?: string;
}

export interface SQLReasoningSession {
  id: string;
  assessment_id: string;
  model_name: string;
  prompt_version: string;
  input_context: any;
  output_response: any;
  execution_status: 'success' | 'failed';
  execution_time_ms?: number;
  created_at?: string;
}

export interface SQLRecommendation {
  id: string;
  assessment_id: string;
  dimension_code: string;
  priority: 'High' | 'Medium' | 'Low';
  recommendation: string;
  expected_impact: string;
  status: 'pending' | 'completed' | 'dismissed';
  created_at?: string;
}

export interface SQLKnowledgeAssetVersion {
  id: string;
  asset_name: string;
  version: string;
  status: 'active' | 'inactive';
  activated_at?: string;
  created_at?: string;
}

export interface SQLAuditLog {
  id: string;
  user_id?: string;
  action: string;
  object_type: string;
  object_id?: string;
  details?: any;
  created_at?: string;
}
