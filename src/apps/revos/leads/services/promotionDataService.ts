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

  // ==============================================================================
  // Dedicated Opportunity Promotion Methods (opportunity_promotions table)
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
