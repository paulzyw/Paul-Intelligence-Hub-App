import { supabase } from '@/src/lib/supabase';
import { OpportunitySession, OpportunityEvidenceRecord, OpportunityQualificationResult } from '../../types/opportunity_qualification';

export class OpportunityDataService {
  // Session Management
  static async createSession(opportunityId: string, options: { sqlInheritanceData?: any; revenueMotion?: string; industry?: string }) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'create-opportunity-session',
        opportunity_id: opportunityId,
        sql_inheritance_data: options.sqlInheritanceData || {},
        revenue_motion: options.revenueMotion || 'Digital Solution Selling',
        industry: options.industry || 'Enterprise Software'
      }
    });
    if (error) throw error;
    return data as OpportunitySession;
  }

  static async getSessionByOpportunity(opportunityId: string) {
    const { data, error } = await supabase
      .from('opportunity_qualification_sessions')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching session by opportunity:', error);
      return null;
    }
    return data as OpportunitySession | null;
  }

  // Evidence Submission
  static async submitEvidence(sessionId: string, evidence: Partial<OpportunityEvidenceRecord>[]) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'submit-opportunity-evidence',
        session_id: sessionId,
        evidence
      }
    });
    if (error) throw error;
    return data;
  }

  static async getEvidenceRecords(sessionId: string) {
    const { data, error } = await supabase
      .from('opportunity_qualification_evidence')
      .select('*')
      .eq('session_id', sessionId);
    if (error) {
      console.error('Error fetching evidence records:', error);
      return [];
    }
    return data as OpportunityEvidenceRecord[];
  }

  // Dynamic Suggestion Answers
  static async generateSuggestedAnswers(opportunityId: string, revenueMotion: string, industry: string, evidenceQuestions: any[]) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'generate-opportunity-suggested-answers',
        opportunity_id: opportunityId,
        revenue_motion: revenueMotion,
        industry: industry,
        evidence_questions: evidenceQuestions
      }
    });
    if (error) throw error;
    return data?.suggested_answers || [];
  }

  // Reasoning Execution
  static async executeReasoning(
    sessionId: string,
    contexts: {
      sql_inheritance_context: any;
      opportunity_assessment_context: any;
      industry_config: any;
      evidence_kb: any;
      qualification_rules: any;
    }
  ) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'execute-opportunity-reasoning',
        session_id: sessionId,
        ...contexts
      }
    });
    if (error) throw error;
    return data;
  }

  // Retrieve Saved Assessment Results
  static async retrieveResult(sessionId: string) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'retrieve-opportunity-qualification-result',
        session_id: sessionId
      }
    });
    if (error) throw error;
    return data as {
      session: OpportunitySession;
      evidence: OpportunityEvidenceRecord[];
      results: OpportunityQualificationResult;
    };
  }

  // Promotion/Qualification Pipeline Execution
  static async promoteToOpportunity(opportunityId: string, sessionId: string) {
    const { data, error } = await supabase.functions.invoke('lead-qualification', {
      body: {
        action: 'promote-sql-to-opportunity',
        opportunity_id: opportunityId,
        session_id: sessionId
      }
    });
    if (error) throw error;
    return data;
  }
}
