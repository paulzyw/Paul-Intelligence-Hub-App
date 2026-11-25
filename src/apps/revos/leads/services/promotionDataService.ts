import { supabase } from '@/src/lib/supabase';
import {
  getScopedStorageItem,
  removeScopedStorageItem,
  resolveAuthenticatedRevOSUserId,
  setScopedStorageItem,
  subscribeRevOSUserChange
} from '../../utils/userIsolation';

export interface MQLSQLPromotion {
  id?: string;
  lead_id: string;
  opportunity_id?: string;
  status?: string;
  promoted_at?: string;
  promoted_by?: string;
  created_by?: string;
}

let memoryPromotedLeadIds: { userId: string; ids: string[] } | null = null;
let memorySqlOpportunityPromotedLeadIds: { userId: string; ids: string[] } | null = null;

subscribeRevOSUserChange(() => {
  memoryPromotedLeadIds = null;
  memorySqlOpportunityPromotedLeadIds = null;
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id?: string | null): id is string => typeof id === 'string' && UUID_REGEX.test(id);

export class PromotionDataService {
  /**
   * Synchronous cached getters scoped to the active authenticated user
   */
  static getCachedPromotedLeadIds(explicitUserId?: string | null): string[] {
    if (
      memoryPromotedLeadIds &&
      (!explicitUserId || memoryPromotedLeadIds.userId === explicitUserId)
    ) {
      return memoryPromotedLeadIds.ids;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = getScopedStorageItem('revos_cached_promoted_lead_ids', explicitUserId);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (explicitUserId) {
              memoryPromotedLeadIds = { userId: explicitUserId, ids: parsed };
            }
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  }

  static getCachedSqlOpportunityPromotedLeadIds(explicitUserId?: string | null): string[] {
    if (
      memorySqlOpportunityPromotedLeadIds &&
      (!explicitUserId || memorySqlOpportunityPromotedLeadIds.userId === explicitUserId)
    ) {
      return memorySqlOpportunityPromotedLeadIds.ids;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = getScopedStorageItem('sql_opportunity_promoted_lead_ids', explicitUserId);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (explicitUserId) {
              memorySqlOpportunityPromotedLeadIds = { userId: explicitUserId, ids: parsed };
            }
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  }

  /**
   * Get all promoted lead IDs for the authenticated user from Supabase table mql_sql_promotions.
   */
  static async getPromotedLeadIds(): Promise<string[]> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('lead_id')
        .eq('created_by', userId);

      if (error) {
        console.warn('mql_sql_promotions table fetch:', error.message);
        return this.getCachedPromotedLeadIds(userId);
      }
      const ids = (data || []).map((row: any) => row.lead_id).filter(Boolean);
      memoryPromotedLeadIds = { userId, ids };
      setScopedStorageItem('revos_cached_promoted_lead_ids', JSON.stringify(ids), userId);
      return ids;
    } catch (err) {
      console.error('Failed to fetch promoted lead IDs from Supabase:', err);
      return this.getCachedPromotedLeadIds(userId);
    }
  }

  /**
   * Get all MQL to SQL promotion records with timestamps for the authenticated user from Supabase.
   */
  static async getMqlSqlPromotions(): Promise<any[]> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('*')
        .eq('created_by', userId);

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
   * Check if a specific lead ID is promoted in Supabase for the authenticated user.
   */
  static async isLeadPromoted(leadId: string): Promise<boolean> {
    if (!isValidUuid(leadId)) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from('mql_sql_promotions')
        .select('id')
        .eq('lead_id', leadId)
        .eq('created_by', userId)
        .limit(1);

      if (error) {
        return false;
      }
      return Boolean(data && data.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Promote a lead to SQL in Supabase mql_sql_promotions table.
   */
  static async promoteLead(leadId: string, opportunityId?: string, promotionDate?: string): Promise<boolean> {
    if (!leadId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;
    try {
      const dateToSave = promotionDate || new Date().toISOString().split('T')[0];
      setScopedStorageItem(`mql_promotion_date_${leadId}`, dateToSave, userId);
      if (memoryPromotedLeadIds?.userId === userId && !memoryPromotedLeadIds.ids.includes(leadId)) {
        memoryPromotedLeadIds.ids.push(leadId);
      }
      const { error } = await supabase
        .from('mql_sql_promotions')
        .upsert(
          [
            {
              lead_id: leadId,
              opportunity_id: opportunityId,
              status: 'Promoted',
              promotion_date: dateToSave,
              created_by: userId
            }
          ],
          { onConflict: 'lead_id' }
        );

      if (error) {
        console.warn('Error promoting lead in Supabase (will succeed once migration runs):', error.message);
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
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;
    try {
      if (memoryPromotedLeadIds?.userId === userId) {
        memoryPromotedLeadIds = {
          userId,
          ids: memoryPromotedLeadIds.ids.filter((id) => id !== leadId)
        };
      }
      const { error } = await supabase
        .from('mql_sql_promotions')
        .delete()
        .eq('lead_id', leadId)
        .eq('created_by', userId);

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
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;
    try {
      if (memorySqlOpportunityPromotedLeadIds?.userId === userId) {
        memorySqlOpportunityPromotedLeadIds = {
          userId,
          ids: memorySqlOpportunityPromotedLeadIds.ids.filter((id) => id !== opportunityId)
        };
      }
      const { error } = await supabase
        .from('sql_opportunity_promotions')
        .delete()
        .eq('opportunity_id', opportunityId)
        .eq('created_by', userId);

      if (error) {
        console.error('Error unpromoting SQL opportunity in Supabase:', error);
        return false;
      }
      removeScopedStorageItem(`sql_opp_promoted_opp_${opportunityId}`, userId);
      removeScopedStorageItem(`oq_promoted_${opportunityId}`, userId);
      return true;
    } catch (err) {
      console.error('Failed to unpromote SQL opportunity in Supabase:', err);
      return false;
    }
  }

  /**
   * Get all promoted lead IDs for the authenticated user from Supabase table sql_opportunity_promotions.
   */
  static async getSqlOpportunityPromotedLeadIds(): Promise<string[]> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('lead_id, opportunity_id')
        .eq('created_by', userId);

      if (error) {
        console.warn('sql_opportunity_promotions table fetch:', error.message);
        return this.getCachedSqlOpportunityPromotedLeadIds(userId);
      }

      const leadIds = (data || []).map((row: any) => row.lead_id).filter(Boolean);
      memorySqlOpportunityPromotedLeadIds = { userId, ids: leadIds };
      setScopedStorageItem('sql_opportunity_promoted_lead_ids', JSON.stringify(leadIds), userId);
      return leadIds;
    } catch (err) {
      console.error('Failed to fetch promoted lead IDs from sql_opportunity_promotions:', err);
      return this.getCachedSqlOpportunityPromotedLeadIds(userId);
    }
  }

  /**
   * Get all SQL to Opportunity promotion records for the authenticated user from Supabase.
   */
  static async getSqlOpportunityPromotions(): Promise<any[]> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('*')
        .eq('created_by', userId);

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
   * Get all promoted opportunity IDs for the authenticated user from Supabase table sql_opportunity_promotions.
   */
  static async getSqlOpportunityPromotedOppIds(): Promise<string[]> {
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('sql_opportunity_promotions')
        .select('opportunity_id')
        .eq('created_by', userId);

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
   * Check if a lead or opportunity has been promoted in sql_opportunity_promotions for the authenticated user.
   */
  static async isSqlToOpportunityPromoted(identifier: { leadId?: string; opportunityId?: string }): Promise<boolean> {
    const { leadId, opportunityId } = identifier;
    if (!leadId && !opportunityId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    if (leadId && getScopedStorageItem(`sql_opp_promoted_lead_${leadId}`, userId) === 'true') return true;
    if (opportunityId && getScopedStorageItem(`sql_opp_promoted_opp_${opportunityId}`, userId) === 'true') return true;

    try {
      if (isValidUuid(leadId)) {
        const { data, error } = await supabase
          .from('sql_opportunity_promotions')
          .select('id, status')
          .eq('lead_id', leadId)
          .eq('created_by', userId)
          .maybeSingle();

        if (!error && data) {
          setScopedStorageItem(`sql_opp_promoted_lead_${leadId}`, 'true', userId);
          if (opportunityId) setScopedStorageItem(`sql_opp_promoted_opp_${opportunityId}`, 'true', userId);
          return true;
        }
      }

      if (isValidUuid(opportunityId)) {
        const { data, error } = await supabase
          .from('sql_opportunity_promotions')
          .select('id, status, lead_id')
          .eq('opportunity_id', opportunityId)
          .eq('created_by', userId)
          .maybeSingle();

        if (!error && data) {
          setScopedStorageItem(`sql_opp_promoted_opp_${opportunityId}`, 'true', userId);
          if (data.lead_id) setScopedStorageItem(`sql_opp_promoted_lead_${data.lead_id}`, 'true', userId);
          return true;
        }
      }
    } catch (err) {
      console.warn('sql_opportunity_promotions check warning:', err);
    }

    if (opportunityId) {
      const oppPromoted = await this.isOpportunityPromoted(opportunityId);
      if (oppPromoted) return true;
    }

    return false;
  }

  /**
   * Find corresponding lead_id for an owned opportunity from Supabase.
   */
  static async resolveLeadIdForOpportunity(opportunityId: string, fallbackLeadId?: string): Promise<string | null> {
    if (fallbackLeadId) return fallbackLeadId;
    if (!opportunityId) return null;
    if (opportunityId.startsWith('virtual_opp_')) {
      return opportunityId.replace('virtual_opp_', '') || null;
    }
    if (!isValidUuid(opportunityId)) return null;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;

    try {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('mql_reference_id')
        .eq('id', opportunityId)
        .eq('created_by', userId)
        .maybeSingle();

      if (opp?.mql_reference_id) {
        return opp.mql_reference_id;
      }

      const { data: mqlPromo } = await supabase
        .from('mql_sql_promotions')
        .select('lead_id')
        .eq('opportunity_id', opportunityId)
        .eq('created_by', userId)
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
   */
  static async recordSqlOpportunityPromotion(
    leadId: string,
    opportunityId: string,
    notes?: string
  ): Promise<boolean> {
    if (!leadId && !opportunityId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    if (leadId) setScopedStorageItem(`sql_opp_promoted_lead_${leadId}`, 'true', userId);
    if (opportunityId) {
      setScopedStorageItem(`sql_opp_promoted_opp_${opportunityId}`, 'true', userId);
      setScopedStorageItem(`oq_promoted_${opportunityId}`, 'true', userId);
    }
    try {
      const stored = getScopedStorageItem('sql_opportunity_promoted_lead_ids', userId);
      const ids = stored ? JSON.parse(stored) : [];
      if (leadId && Array.isArray(ids) && !ids.includes(leadId)) {
        ids.push(leadId);
        setScopedStorageItem('sql_opportunity_promoted_lead_ids', JSON.stringify(ids), userId);
      }
    } catch {}
    if (
      memorySqlOpportunityPromotedLeadIds?.userId === userId &&
      leadId &&
      !memorySqlOpportunityPromotedLeadIds.ids.includes(leadId)
    ) {
      memorySqlOpportunityPromotedLeadIds.ids.push(leadId);
    }

    const payload = {
      lead_id: leadId || null,
      opportunity_id: opportunityId || null,
      status: 'Promoted',
      promoted_at: new Date().toISOString(),
      promoted_by: 'Sales Representative',
      notes: notes || 'Promoted via RevOS Opportunity Qualification Engine',
      updated_at: new Date().toISOString(),
      created_by: userId
    };

    try {
      const { error } = await supabase
        .from('sql_opportunity_promotions')
        .upsert(payload, { onConflict: 'opportunity_id' });

      if (error) {
        console.warn('sql_opportunity_promotions upsert note (will succeed once SQL migration is run in Supabase):', error.message);
      }
    } catch (e) {
      console.warn('sql_opportunity_promotions upsert exception:', e);
    }

    if (opportunityId) {
      try {
        await this.promoteToOpportunity(opportunityId, new Date().toISOString().split('T')[0], undefined, notes);
      } catch {}
    }

    return true;
  }

  /**
   * Check if an owned opportunity has been promoted in Supabase dedicated table
   */
  static async isOpportunityPromoted(opportunityId: string): Promise<boolean> {
    if (!opportunityId) return false;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    if (getScopedStorageItem(`oq_promoted_${opportunityId}`, userId) === 'true') {
      return true;
    }

    if (!isValidUuid(opportunityId)) return false;

    try {
      const { data, error } = await supabase
        .from('opportunity_promotions')
        .select('id, promotion_status')
        .eq('opportunity_id', opportunityId)
        .eq('created_by', userId)
        .maybeSingle();

      if (!error && data) {
        setScopedStorageItem(`oq_promoted_${opportunityId}`, 'true', userId);
        return true;
      }
    } catch (err) {
      console.warn('opportunity_promotions check failed:', err);
    }

    try {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id')
        .eq('id', opportunityId)
        .eq('created_by', userId)
        .maybeSingle();
      if (!opp) return false;

      const { data: session } = await supabase
        .from('opportunity_qualification_sessions')
        .select('is_promoted')
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (session?.is_promoted) {
        setScopedStorageItem(`oq_promoted_${opportunityId}`, 'true', userId);
        return true;
      }
    } catch {}

    return false;
  }

  /**
   * Get promotion record for an owned opportunity
   */
  static async getOpportunityPromotion(opportunityId: string): Promise<any | null> {
    if (!opportunityId) return null;
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return null;

    if (isValidUuid(opportunityId)) {
      try {
        const { data, error } = await supabase
          .from('opportunity_promotions')
          .select('*')
          .eq('opportunity_id', opportunityId)
          .eq('created_by', userId)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('opportunity_promotions query:', err);
      }
    }

    const isPromoted = getScopedStorageItem(`oq_promoted_${opportunityId}`, userId) === 'true';
    const promoDate = getScopedStorageItem(`oq_promotion_date_${opportunityId}`, userId);
    if (isPromoted) {
      return {
        opportunity_id: opportunityId,
        promotion_date: promoDate || new Date().toISOString().split('T')[0],
        promotion_status: 'Promoted to Opportunity',
        promoted_by: 'Sales Representative'
      };
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
    const userId = await resolveAuthenticatedRevOSUserId();
    if (!userId) return false;

    setScopedStorageItem(`oq_promoted_${opportunityId}`, 'true', userId);
    setScopedStorageItem(`oq_promotion_date_${opportunityId}`, promotionDate, userId);

    const payload = {
      opportunity_id: opportunityId,
      session_id: sessionId || null,
      promotion_date: promotionDate,
      promotion_status: 'Promoted to Opportunity',
      promoted_by: 'Sales Representative',
      notes: notes || 'Promoted via RevOS Opportunity Qualification Engine',
      updated_at: new Date().toISOString(),
      created_by: userId
    };

    try {
      const { error } = await supabase
        .from('opportunity_promotions')
        .upsert(payload, { onConflict: 'opportunity_id' });

      if (error) {
        console.warn('Direct opportunity_promotions upsert note (will succeed once migration runs):', error.message);
      }
    } catch (e) {
      console.warn('opportunity_promotions upsert exception:', e);
    }

    try {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('id')
        .eq('id', opportunityId)
        .eq('created_by', userId)
        .maybeSingle();
      if (!opp) return true;

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
    } catch {}

    return true;
  }
}
