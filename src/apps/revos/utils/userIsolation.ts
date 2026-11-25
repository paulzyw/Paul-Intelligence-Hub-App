import { supabase } from '../../../lib/supabase';

export const REVOS_AUTH_USER_CHANGED_EVENT = 'revos_auth_user_changed';

let activeRevOSUserId: string | null = null;

const WORKSPACE_CACHE_EXACT_KEYS = new Set<string>([
  'revos_cached_pipeline_portfolio_v2',
  'revos_cached_pipeline_dashboard_v1',
  'revos_latest_created_draft_id',
  'revos_cached_promoted_lead_ids',
  'sql_opportunity_promoted_lead_ids',
  'revos_cached_opp_revenue_map',
  'revos_cached_opp_name_map',
  'mql_deleted_lead_ids',
  'sql_mql_table_deleted_ids',
  'sql_opportunity_table_deleted_ids',
  'pipeline_directory_deleted_ids',
  'pipeline_directory_purged_ids',
  'revos_portfolio_cache'
]);

const WORKSPACE_CACHE_PREFIXES = [
  'revos_u_',
  'revos_cached_pipeline_',
  'revos_created_opp_draft_',
  'revos_latest_created_draft_',
  'pipeline_handover_detail_',
  'pipeline_isolated_card_edits_',
  'pipeline_directory_',
  'revos_cached_promoted_lead_ids',
  'sql_opportunity_promoted_lead_ids',
  'mql_promotion_date_',
  'sql_opp_promoted_',
  'oq_promoted_',
  'oq_promotion_date_',
  'revos_cached_opp_revenue_map',
  'revos_cached_opp_name_map',
  'oq_started_',
  'oq_has_saved_evidence_',
  'oq_evidence_count_',
  'oq_has_result_',
  'oq_result_',
  'oq_history_',
  'mql_deleted_lead_ids',
  'mql_lead_extra_',
  'sql_isolated_card_edits_',
  'opp_isolated_card_edits_',
  'mql_handover_',
  'mql_result_',
  'sql_mql_table_deleted_ids',
  'sql_opportunity_table_deleted_ids',
  'qualification_executive_insights_',
  'revos_gtmos_projects_',
  'revos_gtmos_active_id_'
];

export const clearAllRevOSWorkspaceCaches = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      if (
        WORKSPACE_CACHE_EXACT_KEYS.has(k) ||
        WORKSPACE_CACHE_PREFIXES.some((prefix) => k.startsWith(prefix))
      ) {
        keysToRemove.push(k);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Unable to clear RevOS workspace localStorage caches:', err);
  }
};

export const emitRevOSAuthUserChanged = (userId: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(REVOS_AUTH_USER_CHANGED_EVENT, {
        detail: { userId }
      })
    );
  } catch {}
};

export const setActiveRevOSUserId = (nextUserId: string | null): void => {
  const normalized = nextUserId ? String(nextUserId).trim() || null : null;
  const changed = activeRevOSUserId !== normalized;

  if (changed) {
    // Scrub workspace caches on sign-out or account switch to guarantee zero leakage
    clearAllRevOSWorkspaceCaches();
    activeRevOSUserId = normalized;
    emitRevOSAuthUserChanged(normalized);
  }
};

export const getActiveRevOSUserId = (): string | null => activeRevOSUserId;

export const resolveAuthenticatedRevOSUser = async (): Promise<{
  id: string;
  email: string | null;
} | null> => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      if (activeRevOSUserId !== session.user.id) {
        setActiveRevOSUserId(session.user.id);
      }
      return {
        id: session.user.id,
        email: session.user.email || null
      };
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user?.id) {
      if (activeRevOSUserId !== user.id) {
        setActiveRevOSUserId(user.id);
      }
      return {
        id: user.id,
        email: user.email || null
      };
    }

    if (activeRevOSUserId !== null) {
      setActiveRevOSUserId(null);
    }
    return null;
  } catch {
    return null;
  }
};

export const resolveAuthenticatedRevOSUserId = async (
  explicitUserId?: string | null
): Promise<string | null> => {
  if (explicitUserId && String(explicitUserId).trim()) {
    return String(explicitUserId).trim();
  }
  const authUser = await resolveAuthenticatedRevOSUser();
  if (authUser?.id) return authUser.id;
  return activeRevOSUserId;
};

export const scopedStorageKey = (
  baseKey: string,
  userId?: string | null
): string | null => {
  const uid = userId !== undefined ? userId : activeRevOSUserId;
  if (!uid || !String(uid).trim()) return null;
  return `revos_u_${String(uid).trim()}__${baseKey}`;
};

export const getScopedStorageItem = (
  baseKey: string,
  userId?: string | null
): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const key = scopedStorageKey(baseKey, userId);
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setScopedStorageItem = (
  baseKey: string,
  value: string,
  userId?: string | null
): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const key = scopedStorageKey(baseKey, userId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

export const removeScopedStorageItem = (
  baseKey: string,
  userId?: string | null
): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const key = scopedStorageKey(baseKey, userId);
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
};

export const subscribeRevOSUserChange = (
  listener: (userId: string | null) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ userId?: string | null }>;
    listener(customEvent?.detail?.userId ?? activeRevOSUserId);
  };
  window.addEventListener(REVOS_AUTH_USER_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(REVOS_AUTH_USER_CHANGED_EVENT, handler);
  };
};
