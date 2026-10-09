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

  // Dedicated SQL Handover Intelligence Storage
  static async getSqlHandoverData(opportunityId: string) {
    try {
      // 1. Try retrieving from the dedicated isolated table
      const { data, error } = await supabase
        .from('opportunity_sql_handover_details')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Dedicated opportunity_sql_handover_details table not yet initialized, checking session fallback:', e);
    }

    // 2. Fallback to existing opportunity_qualification_sessions.sql_inheritance_data
    try {
      const session = await this.getSessionByOpportunity(opportunityId);
      if (session && session.sql_inheritance_data && Object.keys(session.sql_inheritance_data).length > 0) {
        return {
          opportunity_id: opportunityId,
          session_id: session.id,
          sql_qip_package: session.sql_inheritance_data,
          ...session.sql_inheritance_data
        };
      }
    } catch (e) {
      console.warn('Error fetching session fallback:', e);
    }

    return null;
  }

  static async saveSqlHandoverData(opportunityId: string, payload: {
    sqlQipPackage: any;
    editableFields?: any;
    revenueMotion?: string;
    industry?: string;
  }) {
    const { sqlQipPackage, editableFields, revenueMotion, industry } = payload;

    // 1. Ensure an opportunity_qualification_session exists and sync sql_inheritance_data
    let session = await this.getSessionByOpportunity(opportunityId);
    if (!session) {
      session = await this.createSession(opportunityId, {
        sqlInheritanceData: sqlQipPackage,
        revenueMotion: revenueMotion || 'Digital Solution Selling',
        industry: industry || 'Enterprise Software'
      });
    } else {
      await supabase
        .from('opportunity_qualification_sessions')
        .update({
          sql_inheritance_data: sqlQipPackage,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    // 2. Persist in dedicated isolated table `opportunity_sql_handover_details`
    try {
      const record = {
        opportunity_id: opportunityId,
        session_id: session?.id,
        sql_qip_package: sqlQipPackage,
        customer_context: sqlQipPackage.customer_context || {},
        revenue_motion_context: sqlQipPackage.revenue_motion_context || {},
        business_context: sqlQipPackage.business_context || {},
        business_value_context: sqlQipPackage.business_value_context || {},
        solution_context: sqlQipPackage.solution_context || {},
        stakeholder_context: sqlQipPackage.stakeholder_context || {},
        engagement_context: sqlQipPackage.engagement_context || {},
        dimension_results: sqlQipPackage.qualification_dimension_results || {},
        qualification_evidence: sqlQipPackage.qualification_evidence || {},
        qualification_risks: sqlQipPackage.qualification_risks || {},
        qualification_recommendations: sqlQipPackage.qualification_recommendations || {},
        editable_fields: editableFields || {},
        handover_status: 'Synchronized',
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: existingRecord } = await supabase
        .from('opportunity_sql_handover_details')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existingRecord) {
        await supabase
          .from('opportunity_sql_handover_details')
          .update(record)
          .eq('id', existingRecord.id);
      } else {
        await supabase
          .from('opportunity_sql_handover_details')
          .insert([record]);
      }
    } catch (err) {
      console.info('Dedicated opportunity_sql_handover_details upsert bypassed (pending Supabase SQL migration execution):', err);
    }

    return true;
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

  // Opportunity Form Data Management (Supabase-Persisted)
  static async getOpportunityFormData(opportunityId: string) {
    // 1. Try dedicated opportunity_form_records table
    try {
      const { data, error } = await supabase
        .from('opportunity_form_records')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Table may not yet be initialized in Supabase
    }

    // 2. Check opportunity_sql_handover_details editable_fields
    try {
      const handover = await this.getSqlHandoverData(opportunityId);
      if (handover?.editable_fields && Object.keys(handover.editable_fields).length > 0) {
        return handover.editable_fields;
      }
    } catch (e) {
      // Fallback
    }

    // 3. Fallback to opportunities record
    try {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .maybeSingle();

      if (opp) {
        let parsedDesc: any = {};
        if (opp.description && opp.description.trim().startsWith('{')) {
          try {
            parsedDesc = JSON.parse(opp.description);
          } catch (e) {}
        }
        return {
          company_name: opp.company_name,
          opportunity_name: opp.opportunity_name,
          industry: opp.industry,
          revenue_motion: opp.revenue_motion,
          opportunity_owner: parsedDesc.opportunity_owner || 'Senior Enterprise AE',
          opportunity_stage: parsedDesc.opportunity_stage || 'Emerging Opportunity',
          estimated_revenue: parsedDesc.estimated_revenue || '$150,000',
          pipeline_stage: parsedDesc.pipeline_stage || 'Qualification',
          expected_close_date: parsedDesc.expected_close_date || '',
          ...parsedDesc
        };
      }
    } catch (e) {}

    return null;
  }

  static async saveOpportunityFormData(opportunityId: string, formData: {
    company_name: string;
    opportunity_name: string;
    opportunity_owner: string;
    opportunity_stage: string;
    estimated_revenue: string;
    pipeline_stage: string;
    expected_close_date: string;
    industry: string;
    revenue_motion: string;
    strategic_note?: string;
  }) {
    // 1. Update public.opportunities table (primary system of record)
    const { error: oppError } = await supabase
      .from('opportunities')
      .update({
        company_name: formData.company_name,
        opportunity_name: formData.opportunity_name,
        industry: formData.industry,
        revenue_motion: formData.revenue_motion,
        description: JSON.stringify(formData),
        updated_at: new Date().toISOString()
      })
      .eq('id', opportunityId);

    if (oppError) {
      console.error('Error updating opportunities record:', oppError);
    }

    // 2. Update public.opportunity_sql_handover_details
    try {
      await this.saveSqlHandoverData(opportunityId, {
        sqlQipPackage: {},
        editableFields: formData,
        revenueMotion: formData.revenue_motion,
        industry: formData.industry
      });
    } catch (e) {
      console.warn('saveSqlHandoverData fallback:', e);
    }

    // 3. Upsert into public.opportunity_form_records
    try {
      const record = {
        opportunity_id: opportunityId,
        company_name: formData.company_name,
        opportunity_name: formData.opportunity_name,
        opportunity_owner: formData.opportunity_owner,
        opportunity_stage: formData.opportunity_stage,
        estimated_revenue: formData.estimated_revenue,
        pipeline_stage: formData.pipeline_stage,
        expected_close_date: formData.expected_close_date ? formData.expected_close_date : null,
        industry: formData.industry,
        revenue_motion: formData.revenue_motion,
        strategic_note: formData.strategic_note || '',
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('opportunity_form_records')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('opportunity_form_records')
          .update(record)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('opportunity_form_records')
          .insert([record]);
      }
    } catch (e) {
      console.info('opportunity_form_records upsert note (will succeed once migration runs):', e);
    }

    return true;
  }
}
