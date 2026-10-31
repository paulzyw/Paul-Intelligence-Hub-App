/**
 * Cookie Consent Context for RevOS
 * Provides React-friendly hooks and state management across all public and authenticated routes.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  ConsentRecord, 
  CookieCategory, 
  CookieCategories, 
  ConsentStatus, 
  DEFAULT_CONSENT_RECORD 
} from '../types/cookies';
import { cookieConsentService } from '../services/cookieConsentService';
import { useAuth } from './AuthContext';

interface CookieConsentContextType {
  consent: ConsentRecord;
  status: ConsentStatus;
  isBannerOpen: boolean;
  isPreferencesOpen: boolean;
  hasConsent: (category: CookieCategory) => boolean;
  acceptAll: () => Promise<void>;
  rejectNonEssential: () => Promise<void>;
  updateConsent: (categories: Partial<CookieCategories>) => Promise<void>;
  withdrawConsent: () => Promise<void>;
  resetConsent: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentRecord>(() => cookieConsentService.getConsent());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const { user } = useAuth();

  // Banner should display only when consent decision is pending
  const isBannerOpen = consent.status === 'pending' && !isPreferencesOpen;

  // Subscribe to service-level consent state changes
  useEffect(() => {
    const unsubscribe = cookieConsentService.subscribeToConsentChanges((newConsent) => {
      setConsent(newConsent);
    });
    return unsubscribe;
  }, []);

  // Associate user account with consent record if user logs in post-consent
  useEffect(() => {
    if (user?.id) {
      cookieConsentService.associateUser(user.id);
    }
  }, [user?.id]);

  const hasConsent = useCallback((category: CookieCategory) => {
    return cookieConsentService.hasConsent(category);
  }, [consent]);

  const acceptAll = useCallback(async () => {
    await cookieConsentService.acceptAll(user?.id);
    setIsPreferencesOpen(false);
  }, [user?.id]);

  const rejectNonEssential = useCallback(async () => {
    await cookieConsentService.rejectNonEssential(user?.id);
    setIsPreferencesOpen(false);
  }, [user?.id]);

  const updateConsent = useCallback(async (categories: Partial<CookieCategories>) => {
    await cookieConsentService.updateCustomPreferences(categories, user?.id);
    setIsPreferencesOpen(false);
  }, [user?.id]);

  const withdrawConsent = useCallback(async () => {
    await cookieConsentService.withdrawConsent(user?.id);
    setIsPreferencesOpen(false);
  }, [user?.id]);

  const resetConsent = useCallback(() => {
    cookieConsentService.resetConsent();
  }, []);

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        status: consent.status,
        isBannerOpen,
        isPreferencesOpen,
        hasConsent,
        acceptAll,
        rejectNonEssential,
        updateConsent,
        withdrawConsent,
        resetConsent,
        openPreferences,
        closePreferences
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
