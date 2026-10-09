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
    // 1. Direct persistence in Supabase table
    try {
      if (evidence && evidence.length > 0) {
        const records = evidence.map(e => ({
          session_id: sessionId,
          dimension_code: e.dimension_code || '',
          evidence_id: e.evidence_id || '',
          question_text: e.question_text || '',
          answer_value: e.answer_value || '',
          evidence_source: e.evidence_source || 'Sales Rep Interview',
          evidence_strength: e.evidence_strength || 'customer_confirmed',
          updated_at: new Date().toISOString()
        }));

        const { error: upsertErr } = await supabase
          .from('opportunity_qualification_evidence')
          .upsert(records, { onConflict: 'session_id,evidence_id' });

        if (upsertErr) {
          console.warn('Direct upsert to opportunity_qualification_evidence error, checking function:', upsertErr);
        }
      }
    } catch (dbErr) {
      console.warn('Direct database error in submitEvidence:', dbErr);
    }

    // 2. Also invoke Edge function if available
    try {
      const { data, error } = await supabase.functions.invoke('lead-qualification', {
        body: {
          action: 'submit-opportunity-evidence',
          session_id: sessionId,
          evidence
        }
      });
      if (!error && data) return data;
    } catch (e) {
      // Direct table upsert above succeeded
    }

    return true;
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

  static async getOrCreateSession(opportunityId: string, options?: {
    revenueMotion?: string;
    industry?: string;
    sqlInheritanceData?: any;
  }) {
    let session = await this.getSessionByOpportunity(opportunityId);
    if (!session) {
      try {
        const { data, error } = await supabase
          .from('opportunity_qualification_sessions')
          .insert([{
            opportunity_id: opportunityId,
            revenue_motion: options?.revenueMotion || 'Digital Solution Selling',
            industry: options?.industry || 'SaaS / Software',
            sql_inheritance_data: options?.sqlInheritanceData || {}
          }])
          .select()
          .maybeSingle();

        if (!error && data) {
          session = data as OpportunitySession;
        }
      } catch (e) {
        console.warn('Direct session insert failed, trying Edge Function:', e);
      }

      if (!session) {
        session = await this.createSession(opportunityId, options || {});
      }
    }
    return session;
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

  // ==============================================================================
  // Start Qualification Tracking & Dynamic Default Navigation State
  // ==============================================================================

  /**
   * Records that the user clicked "Start Opportunity Qualification" in Opportunity Form
   */
  static async recordStartQualification(opportunityId: string, options?: { revenueMotion?: string; industry?: string }) {
    if (!opportunityId) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`oq_started_${opportunityId}`, 'true');
      }

      // 1. Ensure session exists and update status/inheritance flag
      let session = await this.getSessionByOpportunity(opportunityId);
      if (!session) {
        session = await this.getOrCreateSession(opportunityId, {
          revenueMotion: options?.revenueMotion || 'Digital Solution Selling',
          industry: options?.industry || 'Enterprise Software',
          sqlInheritanceData: { qualification_started: true, started_at: new Date().toISOString() }
        });
      } else {
        const currentData = session.sql_inheritance_data || {};
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            sql_inheritance_data: { ...currentData, qualification_started: true, started_at: new Date().toISOString() },
            qualification_status: session.qualification_status && session.qualification_status !== 'NOT_STARTED' ? session.qualification_status : 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);
      }

      // 2. Also update opportunity_form_records form_status
      try {
        await supabase
          .from('opportunity_form_records')
          .update({
            form_status: 'Qualification Started',
            updated_at: new Date().toISOString()
          })
          .eq('opportunity_id', opportunityId);
      } catch (e) {
        // non-blocking
      }
    } catch (err) {
      console.warn('Error recording qualification start in database:', err);
    }
  }

  /**
   * Records that evidence answers were saved in Supabase
   */
  static async recordEvidenceSaved(opportunityId: string, sessionId: string, savedCount: number) {
    if (!opportunityId) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`oq_started_${opportunityId}`, 'true');
        localStorage.setItem(`oq_has_saved_evidence_${opportunityId}`, 'true');
        localStorage.setItem(`oq_evidence_count_${opportunityId}`, String(savedCount));
      }

      // Ensure session in Supabase has the saved evidence flag
      if (sessionId) {
        const session = await this.getSessionByOpportunity(opportunityId);
        const currentData = session?.sql_inheritance_data || {};
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            sql_inheritance_data: {
              ...currentData,
              qualification_started: true,
              has_saved_evidence: true,
              saved_evidence_count: savedCount,
              last_evidence_saved_at: new Date().toISOString()
            },
            qualification_status: session?.qualification_status && session?.qualification_status !== 'NOT_STARTED' ? session.qualification_status : 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.warn('Error recording evidence saved in database:', err);
    }
  }

  /**
   * Checks whether the Opportunity Qualification Form should be displayed by default for this opportunity:
   * Condition 1: User clicked "Start Opportunity Qualification" in Opportunity Form
   * Condition 2: Saved answer for at least one evidence question
   */
  static async checkShouldDefaultToQualificationForm(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;

    // Fast check from localStorage
    const localStarted = typeof window !== 'undefined' && localStorage.getItem(`oq_started_${opportunityId}`) === 'true';
    const localSaved = typeof window !== 'undefined' && localStorage.getItem(`oq_has_saved_evidence_${opportunityId}`) === 'true';

    try {
      // Database check: query session
      const session = await this.getSessionByOpportunity(opportunityId);
      if (!session) {
        return localStarted && localSaved;
      }

      const startedInDb = session.sql_inheritance_data?.qualification_started === true ||
        (session.qualification_status && session.qualification_status !== 'NOT_STARTED');

      const isStarted = localStarted || startedInDb;
      if (!isStarted) {
        // Also check opportunity_form_records
        const { data: formRec } = await supabase
          .from('opportunity_form_records')
          .select('form_status')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();

        if (formRec?.form_status !== 'Qualification Started') {
          return false;
        }
      }

      // Verify that at least one evidence question has a saved non-empty answer
      const { data: evidenceRows, error } = await supabase
        .from('opportunity_qualification_evidence')
        .select('answer_value')
        .eq('session_id', session.id);

      if (error) {
        return (localStarted || isStarted) && localSaved;
      }

      const hasAnswer = (evidenceRows || []).some(
        (row: any) => row.answer_value && typeof row.answer_value === 'string' && row.answer_value.trim().length > 0
      );

      if (hasAnswer) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`oq_started_${opportunityId}`, 'true');
          localStorage.setItem(`oq_has_saved_evidence_${opportunityId}`, 'true');
        }
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Error checking qualification form default status:', err);
      return localStarted && localSaved;
    }
  }

  /**
   * Pre-loads default qualification form display status for a list of opportunities
   */
  static async getQualificationFormDefaultsMap(opportunityIds: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (!opportunityIds || opportunityIds.length === 0) return result;

    await Promise.all(
      opportunityIds.map(async (id) => {
        try {
          result[id] = await this.checkShouldDefaultToQualificationForm(id);
        } catch {
          result[id] = false;
        }
      })
    );
    return result;
  }

  // ==============================================================================
  // Full Qualification Result & History Management (Supabase-Persisted)
  // ==============================================================================

  /**
   * Save the full qualification result to Supabase opportunity_qualification_results,
   * update the session, record qualification history, and sync local cache.
   */
  static async saveFullQualificationResult(
    opportunityId: string, 
    sessionId: string, 
    result: any
  ): Promise<boolean> {
    if (!opportunityId) return false;

    // Cache locally immediately for instant feedback
    if (typeof window !== 'undefined') {
      localStorage.setItem(`oq_has_result_${opportunityId}`, 'true');
      try {
        localStorage.setItem(`oq_result_${opportunityId}`, JSON.stringify(result));
      } catch (e) {}
    }

    const status = result.qualification_summary?.qualification_status || 'QUALIFIED';
    const score = Number(result.qualification_summary?.overall_score || 0);
    const confidence = Number(result.qualification_summary?.confidence_score || 0);

    // 1. Update session in Supabase
    try {
      if (sessionId) {
        await supabase
          .from('opportunity_qualification_sessions')
          .update({
            qualification_status: status,
            overall_score: score,
            confidence_score: confidence,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    } catch (err) {
      console.warn('Session update in saveFullQualificationResult:', err);
    }

    // 2. Upsert into opportunity_qualification_results
    try {
      if (sessionId) {
        const payload = {
          session_id: sessionId,
          qualification_status: status,
          overall_score: score,
          confidence_score: confidence,
          dimension_results: result.dimension_assessments || result.dimension_results || [],
          qualification_explanation: result.qualification_summary?.summary || result.qualification_explanation || '',
          risks: result.risk_analysis || result.risks || [],
          contradictions: result.contradictions || [],
          recommended_actions: result.recommendations || result.recommended_actions || [],
          next_best_questions: result.next_best_questions || [],
          final_decision: {
            qualification_summary: result.qualification_summary,
            evidence_assessments: result.evidence_assessments,
            explainability: result.explainability,
            opportunity_promotion_recommendation: result.opportunity_promotion_recommendation
          },
          configuration_versions: {
            Opportunity_industry_configuration_JSON_version: "3.0",
            evidence_kb_version: "3.0",
            qualification_rules_version: "3.0",
            reasoning_strategy_version: "3.0",
            gemini_prompt_version: "3.0"
          }
        };

        const { error } = await supabase
          .from('opportunity_qualification_results')
          .upsert(payload, { onConflict: 'session_id' });

        if (error) {
          console.warn('opportunity_qualification_results upsert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('Results upsert exception:', e);
    }

    // 3. Save a History record to opportunity_qualification_history
    try {
      await this.saveQualificationHistory({
        opportunity_id: opportunityId,
        session_id: sessionId || null,
        event_name: 'Opportunity Assessment Run',
        qualification_status: status,
        score: score,
        confidence: confidence,
        evidence_changes: `${(result.evidence_assessments || []).length} evidence items evaluated`,
        reasoning_version: 'Gemini 3.1 Flash Lite - v3.0',
        rules_version: 'OQ Rules v3.0',
        user_name: 'Sales Representative',
        raw_result: result
      });
    } catch (e) {}

    return true;
  }

  /**
   * Check if a qualification result exists for this opportunity (for default view selection)
   */
  static async checkHasQualificationResult(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;

    // Fast synchronous check
    if (typeof window !== 'undefined' && localStorage.getItem(`oq_has_result_${opportunityId}`) === 'true') {
      return true;
    }

    try {
      // Check session status first
      const session = await this.getSessionByOpportunity(opportunityId);
      if (session) {
        if (session.overall_score && session.overall_score > 0 && session.qualification_status && session.qualification_status !== 'NOT_STARTED') {
          if (typeof window !== 'undefined') localStorage.setItem(`oq_has_result_${opportunityId}`, 'true');
          return true;
        }

        // Check opportunity_qualification_results table
        const { data, error } = await supabase
          .from('opportunity_qualification_results')
          .select('id')
          .eq('session_id', session.id)
          .maybeSingle();

        if (!error && data) {
          if (typeof window !== 'undefined') localStorage.setItem(`oq_has_result_${opportunityId}`, 'true');
          return true;
        }
      }
    } catch (err) {
      console.warn('checkHasQualificationResult error:', err);
    }

    return false;
  }

  /**
   * Pre-load qualification results map for a list of opportunities
   */
  static async getQualificationResultsMap(opportunityIds: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (!opportunityIds || opportunityIds.length === 0) return result;

    await Promise.all(
      opportunityIds.map(async (id) => {
        try {
          result[id] = await this.checkHasQualificationResult(id);
        } catch {
          result[id] = false;
        }
      })
    );
    return result;
  }

  /**
   * Retrieve saved qualification result from Supabase or localStorage
   */
  static async getSavedQualificationResult(opportunityId: string, sessionId?: string): Promise<any | null> {
    if (!opportunityId) return null;

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const session = await this.getSessionByOpportunity(opportunityId);
      targetSessionId = session?.id;
    }

    if (targetSessionId) {
      try {
        const { data, error } = await supabase
          .from('opportunity_qualification_results')
          .select('*')
          .eq('session_id', targetSessionId)
          .maybeSingle();

        if (!error && data) {
          // Reconstitute into full result structure
          const reconstituted = {
            qualification_summary: {
              qualification_status: data.qualification_status,
              overall_score: Number(data.overall_score || 0),
              confidence_score: Number(data.confidence_score || 0),
              summary: data.qualification_explanation || data.final_decision?.qualification_summary?.summary || '',
              primary_reason: data.qualification_explanation || data.final_decision?.qualification_summary?.primary_reason || '',
              health_indicator: data.final_decision?.qualification_summary?.health_indicator,
              opportunity_readiness: data.final_decision?.qualification_summary?.opportunity_readiness
            },
            dimension_assessments: data.dimension_results || [],
            evidence_assessments: data.final_decision?.evidence_assessments || [],
            risk_analysis: data.risks || [],
            recommendations: data.recommended_actions || [],
            explainability: data.final_decision?.explainability || {
              decision_summary: data.qualification_explanation || ''
            },
            opportunity_promotion_recommendation: data.final_decision?.opportunity_promotion_recommendation
          };

          return reconstituted;
        }
      } catch (err) {
        console.warn('Error fetching saved qualification result:', err);
      }
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`oq_result_${opportunityId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }

    return null;
  }

  /**
   * Save entry to opportunity_qualification_history
   */
  static async saveQualificationHistory(historyItem: {
    opportunity_id: string;
    session_id?: string | null;
    event_name: string;
    qualification_status: string;
    score: number;
    confidence: number;
    evidence_changes?: string;
    reasoning_version?: string;
    rules_version?: string;
    user_name?: string;
    raw_result?: any;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('opportunity_qualification_history')
        .insert([{
          ...historyItem,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.warn('opportunity_qualification_history insert note:', error.message);
      }
    } catch (e) {}

    // Also cache history item locally
    if (typeof window !== 'undefined' && historyItem.opportunity_id) {
      const key = `oq_history_${historyItem.opportunity_id}`;
      const existingStr = localStorage.getItem(key);
      let list = [];
      try { list = existingStr ? JSON.parse(existingStr) : []; } catch (e) {}
      list.unshift({
        event: historyItem.event_name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: historyItem.qualification_status,
        score: historyItem.score,
        confidence: `${historyItem.confidence}%`,
        evidence_changes: historyItem.evidence_changes || 'None',
        reasoning_version: historyItem.reasoning_version || 'v3.0',
        rules_version: historyItem.rules_version || 'v3.0',
        user: historyItem.user_name || 'Sales Representative'
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 15)));
    }

    return true;
  }

  /**
   * Get qualification history for an opportunity
   */
  static async getQualificationHistory(opportunityId: string): Promise<any[]> {
    if (!opportunityId) return [];

    try {
      const { data, error } = await supabase
        .from('opportunity_qualification_history')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          event: d.event_name,
          date: new Date(d.event_date || d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: d.qualification_status,
          score: Number(d.score || 0),
          confidence: `${d.confidence}%`,
          evidence_changes: d.evidence_changes || 'Evaluation run',
          reasoning_version: d.reasoning_version || 'v3.0',
          rules_version: d.rules_version || 'v3.0',
          user: d.user_name || 'Sales Representative'
        }));
      }
    } catch (e) {
      console.warn('Error fetching opportunity_qualification_history:', e);
    }

    // Check localStorage fallback
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`oq_history_${opportunityId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }

    return [];
  }
}
