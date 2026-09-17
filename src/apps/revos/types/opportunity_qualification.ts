// Opportunity Qualification Module Type Definitions

export interface OpportunitySession {
  id: string;
  opportunity_id: string;
  revenue_motion: string;
  industry: string;
  sql_inheritance_data?: any;
  overall_score?: number;
  confidence_score?: number;
  qualification_status: string; // NOT_STARTED, IN_PROGRESS, QUALIFIED, CONDITIONALLY_QUALIFIED, EVIDENCE_INSUFFICIENT, DISQUALIFIED, ON_HOLD
  is_promoted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityEvidenceRecord {
  id?: string;
  session_id: string;
  dimension_code: string; // OQ01 to OQ10
  evidence_id: string; // Unique question ID from KB
  question_text: string;
  answer_value: string;
  evidence_source: string;
  evidence_strength: string; // unverified, verified, customer_confirmed
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityQualificationResult {
  id: string;
  session_id: string;
  qualification_status: string;
  overall_score: number;
  confidence_score: number;
  dimension_results: Array<{
    dimension_id: string;
    dimension_name: string;
    score: number;
    confidence: number;
    evidence_status: string;
    positive_signals: string[];
    negative_signals: string[];
    missing_evidence: string[];
    reasoning: string;
  }>;
  qualification_explanation: string;
  risks: Array<{
    category: string;
    risk_description: string;
    severity: string; // Low, Medium, High, Critical
    dimension_id: string;
  }>;
  contradictions: Array<{
    evidence_id: string;
    inherited_value: string;
    new_value: string;
    contradiction_severity: string; // Low, Medium, High
    resolution: string;
  }>;
  recommended_actions: Array<{
    action: string;
    dimension_id: string;
    reason: string;
    risk_addressed: string;
    priority: string; // High, Medium, Low
  }>;
  next_best_questions: Array<{
    question_id: string;
    dimension_id: string;
    question: string;
    reason: string;
    priority: string; // High, Medium, Low
  }>;
  final_decision?: any;
  configuration_versions?: any;
  created_at?: string;
}
