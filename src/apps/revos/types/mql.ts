export interface MQLCampaign {
  id: string;
  org_id: string;
  name: string;
  objective?: string;
  target_market?: string;
  icp_definition?: string;
  revenue_motion?: string;
  industry?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MQLLead {
  id: string;
  org_id: string;
  campaign_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  job_title?: string;
  status: 'New' | 'Assessing' | 'Qualified' | 'Disqualified' | 'Nurture';
  created_by?: string;
  created_at: string;
  updated_at: string;
  website?: string;
  lead_industry?: string;
  employee_size?: string;
  location?: string;
  annual_revenue?: string;
  phone?: string;
  department?: string;
  lead_date?: string;
}

export interface MQLEvidenceAssessment {
  id: string;
  lead_id: string;
  evidence_id: string;
  dimension: 'fit' | 'intent' | 'engagement' | 'timing';
  is_present: boolean;
  evidence_value?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MQLQualificationResult {
  id: string;
  lead_id: string;
  qualification_status: 'Highly Qualified MQL' | 'Qualified MQL' | 'Marketing Nurture' | 'Disqualified';
  qualification_score: number;
  confidence_score: number;
  dimension_scores: {
    fit: number;
    intent: number;
    engagement: number;
    timing: number;
  };
  supporting_evidence: string[];
  negative_evidence: string[];
  missing_evidence: string[];
  reasoning: {
    summary: string;
    fit: string;
    intent: string;
    engagement: string;
    timing: string;
    evidence_evaluations?: {
      evidence_id: string;
      evidence_name: string;
      dimension: string;
      score: number;
      matched_type: 'positive' | 'negative' | 'neutral' | 'unknown';
      reason: string;
    }[];
  };
  recommendations: string[];
  next_best_actions: string[];
  evaluated_at: string;
}
