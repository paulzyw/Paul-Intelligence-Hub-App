/**
 * Cookie Management Types & Constants for RevOS
 */

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentStatus = 'pending' | 'accepted_all' | 'rejected_non_essential' | 'custom';

export interface CookieCategories {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord extends CookieCategories {
  version: string;
  status: ConsentStatus;
  updatedAt: string | null;
  expiresAt: string | null;
  anonymousId?: string;
}

export interface CategoryMetadata {
  id: CookieCategory;
  name: string;
  badge?: string;
  isLocked: boolean;
  purpose: string;
  examples: string[];
}

export const COOKIE_POLICY_VERSION = '1.0';
export const COOKIE_STORAGE_KEY = 'revos_cookie_consent';
export const COOKIE_ANONYMOUS_ID_KEY = 'revos_anonymous_id';
export const COOKIE_EXPIRY_DAYS = 365; // Standard 12-month consent validity under GDPR/ePrivacy

export const COOKIE_CATEGORIES_METADATA: CategoryMetadata[] = [
  {
    id: 'necessary',
    name: 'Strictly Necessary',
    badge: 'Always Active',
    isLocked: true,
    purpose: 'Essential security, authentication session integrity, and core platform functionality. These technologies are required for the platform to operate safely and cannot be switched off.',
    examples: ['Authentication tokens & session storage', 'Security & CSRF validation', 'Theme & appearance preference cache', 'Cookie consent decision storage']
  },
  {
    id: 'functional',
    name: 'Functional',
    isLocked: false,
    purpose: 'Remember your preferences, language choices, and personalized settings to deliver an enhanced and more streamlined user interface.',
    examples: ['Interface customization & layout states', 'Module sidebar drawer preferences', 'Saved table view configurations']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    isLocked: false,
    purpose: 'Help us understand how visitors interact with RevOS by collecting anonymized usage metrics. This allows us to measure performance, identify bottlenecks, and continuously refine our revenue intelligence modules.',
    examples: ['Page visit & funnel interaction telemetry', 'Module usage frequency metrics', 'Error diagnostics & latency monitoring']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    isLocked: false,
    purpose: 'Used to measure marketing campaign efficiency and attribution. We do not sell your data or serve third-party advertising banners.',
    examples: ['Campaign attribution tracking', 'Referral partner measurement', 'Conversion event validation']
  }
];

export const DEFAULT_CONSENT_RECORD: ConsentRecord = {
  version: COOKIE_POLICY_VERSION,
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  status: 'pending',
  updatedAt: null,
  expiresAt: null
};
