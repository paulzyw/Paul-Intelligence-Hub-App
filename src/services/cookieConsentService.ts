/**
 * Centralized Cookie Consent Management Service
 * Single source of truth for consent verification, persistence, validation, and gating.
 */

import { 
  CookieCategory, 
  CookieCategories, 
  ConsentRecord, 
  ConsentStatus, 
  COOKIE_POLICY_VERSION, 
  COOKIE_STORAGE_KEY, 
  COOKIE_ANONYMOUS_ID_KEY,
  COOKIE_EXPIRY_DAYS, 
  DEFAULT_CONSENT_RECORD 
} from '../types/cookies';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type ConsentChangeCallback = (consent: ConsentRecord) => void;

class CookieConsentService {
  private memoryConsent: ConsentRecord;
  private listeners: Set<ConsentChangeCallback> = new Set();
  private anonymousId: string;

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.memoryConsent = this.loadValidatedConsent();
  }

  /**
   * Generates or retrieves an anonymous identifier without collecting personal data or fingerprints.
   */
  private getOrCreateAnonymousId(): string {
    if (typeof window === 'undefined') return 'server-rendered-id';
    try {
      const existing = localStorage.getItem(COOKIE_ANONYMOUS_ID_KEY);
      if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
        return existing;
      }
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'anon-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
      localStorage.setItem(COOKIE_ANONYMOUS_ID_KEY, newId);
      return newId;
    } catch {
      return 'anon-ephemeral-' + Date.now();
    }
  }

  /**
   * Validates and reads consent record from browser storage.
   * If record is missing, corrupted, or has an outdated policy version, fails safely to default pending state.
   */
  private loadValidatedConsent(): ConsentRecord {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
    }

    try {
      const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
      }

      const parsed = JSON.parse(raw);

      // Validate required structure and policy version
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== COOKIE_POLICY_VERSION ||
        typeof parsed.necessary !== 'boolean' ||
        typeof parsed.functional !== 'boolean' ||
        typeof parsed.analytics !== 'boolean' ||
        typeof parsed.marketing !== 'boolean' ||
        !['pending', 'accepted_all', 'rejected_non_essential', 'custom'].includes(parsed.status)
      ) {
        console.info('[RevOS Privacy] Outdated or invalid consent record detected. Resetting to pending.');
        return { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
      }

      // Check expiration (standard 12-month consent validity)
      if (parsed.expiresAt) {
        const expiryDate = new Date(parsed.expiresAt).getTime();
        if (isNaN(expiryDate) || Date.now() > expiryDate) {
          console.info('[RevOS Privacy] Consent record expired. Re-requesting visitor decision.');
          return { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
        }
      }

      // Valid stored record
      return {
        version: COOKIE_POLICY_VERSION,
        necessary: true, // Always locked true
        functional: Boolean(parsed.functional),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        status: parsed.status as ConsentStatus,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        expiresAt: parsed.expiresAt || null,
        anonymousId: this.anonymousId
      };
    } catch (err) {
      console.warn('[RevOS Privacy] Error reading browser storage:', err);
      return { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
    }
  }

  /**
   * Returns current active consent record.
   */
  public getConsent(): ConsentRecord {
    return { ...this.memoryConsent };
  }

  /**
   * Checks whether a specific category has received affirmative visitor consent.
   */
  public hasConsent(category: CookieCategory): boolean {
    if (category === 'necessary') return true;
    if (this.memoryConsent.status === 'pending') return false;
    return Boolean(this.memoryConsent[category]);
  }

  /**
   * Subscribes a listener to consent changes. Returns an unsubscribe cleanup function.
   */
  public subscribeToConsentChanges(callback: ConsentChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const current = this.getConsent();
    this.listeners.forEach(callback => {
      try {
        callback(current);
      } catch (err) {
        console.error('[RevOS Privacy] Error in consent listener callback:', err);
      }
    });
  }

  /**
   * Persists consent record to browser storage and optionally synchronizes to Supabase.
   */
  public async setConsent(
    categories: Partial<CookieCategories>,
    status: ConsentStatus,
    userId?: string | null
  ): Promise<ConsentRecord> {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const updatedRecord: ConsentRecord = {
      version: COOKIE_POLICY_VERSION,
      necessary: true, // Always locked
      functional: Boolean(categories.functional),
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
      status,
      updatedAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      anonymousId: this.anonymousId
    };

    this.memoryConsent = updatedRecord;

    // 1. First-party browser storage persistence
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updatedRecord));
    } catch (err) {
      console.warn('[RevOS Privacy] Unable to write consent to localStorage:', err);
    }

    // 2. Enforce consent rules immediately (cleanup if non-essential consent is false)
    this.enforceConsent(updatedRecord);

    // 3. Notify all subscribed runtime listeners
    this.notifyListeners();

    // 4. Optional asynchronous Supabase sync (never blocks visitor interface)
    this.syncConsentToSupabase(updatedRecord, userId).catch((err) => {
      // Non-blocking telemetry warning
      console.debug('[RevOS Privacy] Background Supabase consent log deferred or offline:', err?.message || err);
    });

    return updatedRecord;
  }

  /**
   * Visitor clicks "Accept All"
   */
  public async acceptAll(userId?: string | null): Promise<ConsentRecord> {
    return this.setConsent(
      { necessary: true, functional: true, analytics: true, marketing: true },
      'accepted_all',
      userId
    );
  }

  /**
   * Visitor clicks "Reject Non-Essential"
   */
  public async rejectNonEssential(userId?: string | null): Promise<ConsentRecord> {
    return this.setConsent(
      { necessary: true, functional: false, analytics: false, marketing: false },
      'rejected_non_essential',
      userId
    );
  }

  /**
   * Visitor saves customized category selections in the Preference Center
   */
  public async updateCustomPreferences(
    categories: Partial<CookieCategories>,
    userId?: string | null
  ): Promise<ConsentRecord> {
    const allAccepted = Boolean(categories.functional && categories.analytics && categories.marketing);
    const noneAccepted = !categories.functional && !categories.analytics && !categories.marketing;

    const status: ConsentStatus = allAccepted 
      ? 'accepted_all' 
      : noneAccepted 
        ? 'rejected_non_essential' 
        : 'custom';

    return this.setConsent(categories, status, userId);
  }

  /**
   * Visitor withdraws all non-essential consent
   */
  public async withdrawConsent(userId?: string | null): Promise<ConsentRecord> {
    return this.rejectNonEssential(userId);
  }

  /**
   * Resets consent state to pending (e.g. for testing or policy revision prompts)
   */
  public resetConsent(): void {
    try {
      localStorage.removeItem(COOKIE_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.memoryConsent = { ...DEFAULT_CONSENT_RECORD, anonymousId: this.anonymousId };
    this.enforceConsent(this.memoryConsent);
    this.notifyListeners();
  }

  /**
   * Centralized enforcement: cleans up non-essential browser data when categories are disabled.
   */
  private enforceConsent(record: ConsentRecord): void {
    if (typeof window === 'undefined') return;

    // If analytics consent is not present, clean up known analytics identifiers or local caches
    if (!record.analytics) {
      try {
        // Clear common analytics session keys if present
        const analyticsKeys = ['_ga', '_gid', '_gat', '_clck', '_clsk'];
        analyticsKeys.forEach(k => {
          document.cookie = `${k}=; Max-Age=-99999999; path=/;`;
        });
      } catch {
        // ignore
      }
    }

    // If marketing consent is not present, clean up marketing attribution cookies
    if (!record.marketing) {
      try {
        const marketingKeys = ['_fbp', '_gcl_au', '_uetsid', '_uetvid'];
        marketingKeys.forEach(k => {
          document.cookie = `${k}=; Max-Age=-99999999; path=/;`;
        });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Optional Supabase database sync for compliance records.
   * Uses public client with anon / authenticated JWT. Never uses service role key.
   */
  public async syncConsentToSupabase(record: ConsentRecord, userId?: string | null): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const payload = {
        user_id: userId || null,
        anonymous_id: record.anonymousId || this.anonymousId,
        consent_version: record.version,
        necessary: record.necessary,
        functional: record.functional,
        analytics: record.analytics,
        marketing: record.marketing,
        consent_status: record.status,
        consent_timestamp: record.updatedAt || new Date().toISOString()
      };

      const { error } = await supabase.from('cookie_consents').insert([payload]);
      if (error) {
        // If the table hasn't been migrated yet, silently ignore to avoid breaking visitor experience
        console.debug('[RevOS Privacy] Supabase consent audit log notice:', error.message);
      }
    } catch (err: any) {
      console.debug('[RevOS Privacy] Supabase sync deferred:', err?.message || err);
    }
  }

  /**
   * Link existing anonymous consent record with authenticated user upon login
   */
  public async associateUser(userId: string): Promise<void> {
    if (!userId || !isSupabaseConfigured) return;
    if (this.memoryConsent.status === 'pending') return;

    // Asynchronously log the authenticated association without modifying the visitor's decisions
    await this.syncConsentToSupabase(this.memoryConsent, userId).catch(() => {});
  }
}

// Export singleton instance
export const cookieConsentService = new CookieConsentService();
