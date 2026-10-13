import { supabase } from '@/src/lib/supabase';

export interface MQLSQLPromotion {
  id?: string;
  lead_id: string;
  opportunity_id?: string;
  status?: string;
  promoted_at?: string;
  promoted_by?: string;
}

export class PromotionDataService {
  /**
   * Get all promoted lead IDs from Supabase table mql_sql_promotions.
   */
  static async getPromotedLeadIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('lead_id');

      if (error) {
        console.warn('mql_sql_promotions table fetch:', error.message);
        return [];
      }
      return (data || []).map((row: any) => row.lead_id).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch promoted lead IDs from Supabase:', err);
      return [];
    }
  }

  /**
   * Get all MQL to SQL promotion records with timestamps from Supabase.
   */
  static async getMqlSqlPromotions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('*');

      if (error) {
        console.warn('mql_sql_promotions table fetch:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Failed to fetch mql_sql_promotions from Supabase:', err);
      return [];
    }
  }

  /**
   * Check if a specific lead ID is promoted in Supabase.
   */
  static async isLeadPromoted(leadId: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('id')
        .eq('lead_id', leadId)
        .limit(1);

      if (error) {
        return false;
      }
      return Boolean(data && data.length > 0);
    } catch (err) {
      return false;
    }
  }

  /**
   * Promote a lead to SQL in Supabase mql_sql_promotions table.
   */
  static async promoteLead(leadId: string, opportunityId?: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { error } = await supabase
        .from('mql_sql_promotions')
        .upsert(
          [{ lead_id: leadId, opportunity_id: opportunityId, status: 'Promoted' }],
          { onConflict: 'lead_id' }
        );

      if (error) {
        console.error('Error promoting lead in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to promote lead in Supabase:', err);
      return false;
    }
  }

  /**
   * Remove promotion record from Supabase mql_sql_promotions table.
   */
  static async unpromoteLead(leadId: string): Promise<boolean> {
    if (!leadId) return false;
    try {
      const { error } = await supabase
        .from('mql_sql_promotions')
        .delete()
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error unpromoting lead in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to unpromote lead in Supabase:', err);
      return false;
    }
  }

  static async unpromoteSqlOpportunity(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;
    try {
      const { error } = await supabase
        .from('sql_opportunity_promotions')
        .delete()
        .eq('opportunity_id', opportunityId);

      if (error) {
        console.error('Error unpromoting SQL opportunity in Supabase:', error);
        return false;
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`sql_opp_promoted_opp_${opportunityId}`);
        localStorage.removeItem(`oq_promoted_${opportunityId}`);
      }
      return true;
    } catch (err) {
      console.error('Failed to unpromote SQL opportunity in Supabase:', err);
      return false;
    }
  }

  // ==============================================================================
  // Dedicated SQL to Opportunity Promotion Methods (sql_opportunity_promotions table)
  // ==============================================================================

  /**
   * Get all promoted lead IDs from Supabase table sql_opportunity_promotions.
   */
  static async getSqlOpportunityPromotedLeadIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('lead_id, opportunity_id');

      if (error) {
        console.warn('sql_opportunity_promotions table fetch:', error.message);
        // Fallback to local storage if table is not yet provisioned
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('sql_opportunity_promoted_lead_ids');
          if (stored) {
            try { return JSON.parse(stored); } catch {}
          }
        }
        return [];
      }

      const leadIds = (data || []).map((row: any) => row.lead_id).filter(Boolean);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sql_opportunity_promoted_lead_ids', JSON.stringify(leadIds));
      }
      return leadIds;
    } catch (err) {
      console.error('Failed to fetch promoted lead IDs from sql_opportunity_promotions:', err);
      return [];
    }
  }

  /**
   * Get all SQL to Opportunity promotion records with timestamps from Supabase.
   */
  static async getSqlOpportunityPromotions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('*');

      if (error) {
        console.warn('sql_opportunity_promotions table fetch:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Failed to fetch sql_opportunity_promotions from Supabase:', err);
      return [];
    }
  }

  /**
   * Get all promoted opportunity IDs from Supabase table sql_opportunity_promotions.
   */
  static async getSqlOpportunityPromotedOppIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('opportunity_id');

      if (error) {
        console.warn('sql_opportunity_promotions table fetch:', error.message);
        return [];
      }

      return (data || []).map((row: any) => row.opportunity_id).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch promoted opp IDs from sql_opportunity_promotions:', err);
      return [];
    }
  }

  /**
   * Check if a lead or opportunity has been promoted in sql_opportunity_promotions in Supabase.
   */
  static async isSqlToOpportunityPromoted(identifier: { leadId?: string; opportunityId?: string }): Promise<boolean> {
    const { leadId, opportunityId } = identifier;
    if (!leadId && !opportunityId) return false;

    // Fast check in localStorage cache
    if (typeof window !== 'undefined') {
      if (leadId && localStorage.getItem(`sql_opp_promoted_lead_${leadId}`) === 'true') return true;
      if (opportunityId && localStorage.getItem(`sql_opp_promoted_opp_${opportunityId}`) === 'true') return true;
    }

    try {
      // 1. Try querying by lead_id
      if (leadId) {
        const { data, error } = await supabase
          .from('sql_opportunity_promotions')
          .select('id, status')
          .eq('lead_id', leadId)
          .maybeSingle();

        if (!error && data) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`sql_opp_promoted_lead_${leadId}`, 'true');
            if (opportunityId) localStorage.setItem(`sql_opp_promoted_opp_${opportunityId}`, 'true');
          }
          return true;
        }
      }

      // 2. Try querying by opportunity_id
      if (opportunityId) {
        const { data, error } = await supabase
          .from('sql_opportunity_promotions')
          .select('id, status, lead_id')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();

        if (!error && data) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`sql_opp_promoted_opp_${opportunityId}`, 'true');
            if (data.lead_id) localStorage.setItem(`sql_opp_promoted_lead_${data.lead_id}`, 'true');
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('sql_opportunity_promotions check warning:', err);
    }

    // Fallback: Check opportunity_promotions or local storage
    if (opportunityId) {
      const oppPromoted = await this.isOpportunityPromoted(opportunityId);
      if (oppPromoted) return true;
    }

    return false;
  }

  /**
   * Find corresponding lead_id for an opportunity from Supabase.
   */
  static async resolveLeadIdForOpportunity(opportunityId: string, fallbackLeadId?: string): Promise<string | null> {
    if (fallbackLeadId) return fallbackLeadId;
    if (!opportunityId) return null;

    try {
      // 1. Check opportunities.mql_reference_id
      const { data: opp } = await supabase
        .from('opportunities')
        .select('mql_reference_id')
        .eq('id', opportunityId)
        .maybeSingle();

      if (opp?.mql_reference_id) {
        return opp.mql_reference_id;
      }

      // 2. Check mql_sql_promotions
      const { data: mqlPromo } = await supabase
        .from('mql_sql_promotions')
        .select('lead_id')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (mqlPromo?.lead_id) {
        return mqlPromo.lead_id;
      }
    } catch (e) {
      console.warn('resolveLeadIdForOpportunity warning:', e);
    }

    return null;
  }

  /**
   * Promote an SQL to Opportunity in Supabase sql_opportunity_promotions table.
   * Note: Inserts into sql_opportunity_promotions without modifying sql_leads.
   */
  static async recordSqlOpportunityPromotion(
    leadId: string,
    opportunityId: string,
    notes?: string
  ): Promise<boolean> {
    if (!leadId && !opportunityId) return false;

    // Cache locally for immediate UI reactivity
    if (typeof window !== 'undefined') {
      if (leadId) localStorage.setItem(`sql_opp_promoted_lead_${leadId}`, 'true');
      if (opportunityId) {
        localStorage.setItem(`sql_opp_promoted_opp_${opportunityId}`, 'true');
        localStorage.setItem(`oq_promoted_${opportunityId}`, 'true');
      }
      // Update cached array of promoted lead IDs
      try {
        const stored = localStorage.getItem('sql_opportunity_promoted_lead_ids');
        const ids = stored ? JSON.parse(stored) : [];
        if (leadId && !ids.includes(leadId)) {
          ids.push(leadId);
          localStorage.setItem('sql_opportunity_promoted_lead_ids', JSON.stringify(ids));
        }
      } catch {}
    }

    const payload = {
      lead_id: leadId || null,
      opportunity_id: opportunityId || null,
      status: 'Promoted',
      promoted_at: new Date().toISOString(),
      promoted_by: 'Sales Representative',
      notes: notes || 'Promoted via RevOS Opportunity Qualification Engine',
      updated_at: new Date().toISOString()
    };

    let insertedSuccessfully = false;

    try {
      // 1. Insert into dedicated sql_opportunity_promotions table
      const { error } = await supabase
        .from('sql_opportunity_promotions')
        .upsert(payload, { onConflict: 'opportunity_id' });

      if (error) {
        console.warn('sql_opportunity_promotions upsert note (will succeed once SQL migration is run in Supabase):', error.message);
      } else {
        insertedSuccessfully = true;
      }
    } catch (e) {
      console.warn('sql_opportunity_promotions upsert exception:', e);
    }

    // 2. Also keep opportunity_promotions synchronized
    if (opportunityId) {
      try {
        await this.promoteToOpportunity(opportunityId, new Date().toISOString().split('T')[0], undefined, notes);
      } catch (e) {}
    }

    return true;
  }

  // ==============================================================================
  // Legacy / Direct Opportunity Promotion Methods (opportunity_promotions table)
  // ==============================================================================

  /**
   * Check if an opportunity has been promoted in Supabase dedicated table
   */
  static async isOpportunityPromoted(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;

    // Check localStorage cache first for instant synchronous feedback
    if (typeof window !== 'undefined' && localStorage.getItem(`oq_promoted_${opportunityId}`) === 'true') {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('opportunity_promotions')
        .select('id, promotion_status')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`oq_promoted_${opportunityId}`, 'true');
        }
        return true;
      }
    } catch (err) {
      console.warn('opportunity_promotions check failed:', err);
    }

    // Fallback: Check if opportunity_qualification_sessions is marked as is_promoted
    try {
      const { data: session } = await supabase
        .from('opportunity_qualification_sessions')
        .select('is_promoted')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (session?.is_promoted) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`oq_promoted_${opportunityId}`, 'true');
        }
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Get promotion record for an opportunity
   */
  static async getOpportunityPromotion(opportunityId: string): Promise<any | null> {
    if (!opportunityId) return null;

    try {
      const { data, error } = await supabase
        .from('opportunity_promotions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('opportunity_promotions query:', err);
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      const isPromoted = localStorage.getItem(`oq_promoted_${opportunityId}`) === 'true';
      const promoDate = localStorage.getItem(`oq_promotion_date_${opportunityId}`);
      if (isPromoted) {
        return {
          opportunity_id: opportunityId,
          promotion_date: promoDate || new Date().toISOString().split('T')[0],
          promotion_status: 'Promoted to Opportunity',
          promoted_by: 'Sales Representative'
        };
      }
    }

    return null;
  }

  /**
   * Record promotion to Opportunity in Supabase dedicated table
   */
  static async promoteToOpportunity(
    opportunityId: string, 
    promotionDate: string, 
    sessionId?: string,
    notes?: string
  ): Promise<boolean> {
    if (!opportunityId) return false;

    // Cache immediately in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`oq_promoted_${opportunityId}`, 'true');
      localStorage.setItem(`oq_promotion_date_${opportunityId}`, promotionDate);
    }

    const payload = {
      opportunity_id: opportunityId,
      session_id: sessionId || null,
      promotion_date: promotionDate,
      promotion_status: 'Promoted to Opportunity',
      promoted_by: 'Sales Representative',
      notes: notes || 'Promoted via RevOS Opportunity Qualification Engine',
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Upsert into dedicated opportunity_promotions table
      const { error } = await supabase
        .from('opportunity_promotions')
        .upsert(payload, { onConflict: 'opportunity_id' });

      if (error) {
        console.warn('Direct opportunity_promotions upsert note (will succeed once migration runs):', error.message);
      }
    } catch (e) {
      console.warn('opportunity_promotions upsert exception:', e);
    }

    // 2. Also update session is_promoted flag if session exists
    try {
      if (sessionId) {
        await supabase
          .from('opportunity_qualification_sessions')
          .update({ is_promoted: true, updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      } else {
        await supabase
          .from('opportunity_qualification_sessions')
          .update({ is_promoted: true, updated_at: new Date().toISOString() })
          .eq('opportunity_id', opportunityId);
      }
    } catch (e) {}

    return true;
  }
}

