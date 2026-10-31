# RevOS Privacy Policy — Verification Checklist & Internal Audit Report
**Version:** 1.0  
**Audit Date:** October 30, 2026  
**Target Platform:** RevOS (Apprevos Technology)  
**Publication Status:** **PENDING LEGAL & OWNER CONFIRMATION (PUBLICATION BLOCKER DETECTED)**

---

## 1. Executive Summary & Purpose

This document provides a factual, evidence-based privacy audit of the RevOS platform based on a comprehensive inspection of the frontend codebase, Supabase configuration, Edge Functions, Gemini AI pipelines, browser storage mechanisms, and third-party integrations.

Under the core principle: **"Never invent privacy practices, legal commitments, providers, data retention periods, legal bases, security certifications, or technical capabilities that cannot be verified,"** this document categorizes findings into:
1. **Verified Technical Implementation Facts** (Confirmed directly from source code and runtime configuration).
2. **Provider & Contractual Facts Requiring Verification** (Dependent on external service terms, DPA execution, or GCP/Supabase account tiers).
3. **Business & Legal Information Requiring Owner Confirmation** (Cannot be established from source code; publication blockers until resolved by legal counsel or company leadership).

---

## 2. Structured Privacy Audit Table

| Area | Finding | Code / Architecture Evidence | Verification Status | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Legal Entity** | Operates under brand "RevOS", company name "Apprevos Technology". | `src/components/Footer.tsx`, `src/pages/Contact.tsx` | Partially Verified | **OWNER CONFIRMATION**: Confirm full registered legal entity name, corporate registration number, and official jurisdiction of incorporation. |
| **Controller Address** | No registered legal street address is present in the codebase. | Inspected `Contact.tsx`, `Footer.tsx` | Unverified (Missing) | **PUBLICATION BLOCKER**: Provide physical registered business address for GDPR / statutory notice. |
| **Privacy Contact** | Verified direct email is `paul.zy.wang@hotmail.com`. Online contact form at `/about/contact`. | `src/pages/Contact.tsx`, `src/pages/CookiePolicy.tsx` | Verified | **OWNER DECISION**: Confirm if direct email or dedicated mailbox (e.g. `privacy@apprevos.com`) should be published. |
| **DPO Appointment** | No Data Protection Officer (DPO) is designated or mentioned in code. | Full codebase search | Unverified | **OWNER DECISION**: Determine whether appointment of a DPO or EU/UK representative is mandatory under GDPR Art. 37. |
| **Authentication** | Supabase Auth used directly from frontend. Collects Full Name, Email, Password. Session token (`sb-*-auth-token`) stored in `localStorage`. | `src/pages/Auth.tsx`, `src/context/AuthContext.tsx`, `src/lib/supabase.ts` | **Verified** | Accurately documented in policy. No authentication cookies are used. |
| **Self-Service Deletion**| Super Admin can flag user deletion in console (`RevOSConsole.tsx`). No automated user self-service deletion button exists in regular user settings. | `src/pages/RevOSConsole.tsx`, `src/apps/revos/RevOSApp.tsx` | **Verified** | Accurately disclose that erasure requests are fulfilled manually via the Contact page / email. |
| **Database Storage** | PostgreSQL on Supabase (`yfonihlpdvelssfmzokp.supabase.co`). Stores profiles, MQL/SQL lead qualification data, opportunity pipeline records, assessment scores, and audit logs. | `supabase/migrations/`, `src/lib/supabase.ts` | **Verified** | Documented in policy under User-Submitted Business Information. |
| **Access Controls** | Row Level Security (RLS) enabled on all public tables. RBAC role hierarchy enforced. | `supabase/migrations/20260520_rbac_system.sql`, `20261031_cookie_consents.sql` | **Verified** | Documented under Technical and Organizational Security Measures. |
| **AI Architecture** | Server-side Gemini API calls via Supabase Edge Functions (`gtmos-api`, `lead-qualification`, `chat-assistant`). Client never holds `GEMINI_API_KEY`. | `supabase/functions/gtmos-api/index.ts`, `lead-qualification/index.ts` | **Verified** | Accurately documented in policy. |
| **AI Data Transmitted**| Company info, product specs, revenue targets, competitors, deal sizes, MEDDPICC qualification evidence, stakeholder titles, buyer challenges. | `supabase/functions/gtmos-api/index.ts`, `lead-qualification/index.ts` | **Verified** | Disclosed clearly in policy. Users warned not to submit unauthorized personal data. |
| **AI Model Training** | Cannot be verified from codebase whether Google uses submitted API data for model training. | Depends on GCP / AI Studio billing tier and Google API Terms of Service | Unverified | **OWNER & CONTRACTUAL VERIFICATION**: Verify whether paid enterprise API terms apply (where customer data is not used for base model training) or Developer terms. |
| **AI Output Storage** | Assessments, evidence scores (0-100), SWOT outputs, and chat histories are stored in Supabase tables. | `opportunity_qualification_results`, `mql_qualification_results`, `chat_history` | **Verified** | Disclosed in policy. |
| **Automated Decisions** | RevOS generates AI-assisted recommendations and scores to assist human sales reps and executives. No automated decisions producing legal or significant personal effects occur. | `supabase/functions/lead-qualification/index.ts` | **Verified** | Disclosed under GDPR Art. 22 analysis (human-in-the-loop decision support). |
| **Browser Storage** | `localStorage` used for session, consent, theme, and workspace drafts. `sessionStorage` for temporary case study unlock. | `src/types/cookies.ts`, `src/services/cookieConsentService.ts` | **Verified** | Documented in alignment with the Cookie Policy. |
| **Analytics & Tracking**| First-party traffic logging via `log-traffic` Edge Function. Gated strictly by `hasConsent('analytics')`. No Google Analytics, Clarity, or third-party cookies installed. | `src/hooks/useTrafficTracking.ts`, `src/services/cookieConsentService.ts` | **Verified** | Accurately stated in policy. |
| **Advertising / Ads** | Zero advertising cookies, remarketing pixels, or ad networks installed. | `index.html`, `src/` | **Verified** | Explicitly stated that RevOS does not serve third-party ads or sell data. |
| **Third-Party Email** | EmailJS (`@emailjs/browser`) used for routing contact form submissions. | `src/pages/Contact.tsx`, `package.json` | **Verified** | EmailJS disclosed with privacy policy reference. |
| **Hosting & Cloud** | Google Cloud Run (Frontend container) + Supabase Cloud (Database, Auth, Edge Functions). | Project metadata, build scripts, Supabase URL | **Verified** | Disclosed as infrastructure sub-processors. |
| **International Transfers**| Supabase project is hosted in US East (`us-east1` / AWS/GCP). Users outside the US undergo cross-border data transfer. | Cloud Run URL (`us-east1`), Supabase project URL | Partially Verified | **OWNER CONFIRMATION**: Confirm whether Standard Contractual Clauses (SCCs) and EU-US Data Privacy Framework commitments are in place with Supabase and Google Cloud. |
| **Data Retention** | Consent records kept for 365 days. Active account data persists indefinitely until manually deleted. No automated retention purge cron is present. | `src/types/cookies.ts`, Supabase schemas | **Verified** | Documented with criteria-based retention rather than invented fixed deadlines. |

---

## 3. Publication Blockers & Required Owner Decisions

Before this Privacy Policy can be considered **legally finalized for production commercial operation**, the business owner and legal counsel must resolve the following items:

1. **[BLOCKER 1] Legal Entity & Registered Address:**
   - **Requirement:** GDPR Article 13(1)(a) requires the name and physical contact details of the data controller.
   - **Current State:** Identified as "Apprevos Technology" with founder email. Physical registered office address is missing.
   - **Action:** Provide the legal company name and registered business address.

2. **[BLOCKER 2] Gemini API Data-Processing Terms & Model Training:**
   - **Requirement:** Transparent disclosure on whether user-submitted business prompts and context are retained by Google or used for model fine-tuning/training.
   - **Current State:** API calls use `GoogleGenAI` in Supabase Edge Functions with `GEMINI_API_KEY`.
   - **Action:** Confirm whether RevOS is operating under Google Cloud Vertex AI / Enterprise Terms (where customer data is confidential and not used for training) or Google AI Studio developer terms.

3. **[BLOCKER 3] International Data Transfer Safeguards:**
   - **Requirement:** GDPR Chapter V compliance for transfers from the EU/EEA/UK to United States infrastructure (Supabase & Google Cloud Run in `us-east1`).
   - **Action:** Confirm execution of Data Processing Addenda (DPA) incorporating European Commission Standard Contractual Clauses (SCCs) and certification under the EU-U.S. Data Privacy Framework.

4. **[BLOCKER 4] Data Subject Access Request (DSAR) SLA & Mailbox:**
   - **Requirement:** Clear procedure and timeframe for responding to access, rectification, and erasure requests (default statutory window is 30 calendar days).
   - **Action:** Confirm whether `paul.zy.wang@hotmail.com` or a dedicated corporate address (`privacy@apprevos.com`) will monitor requests.

---

## 4. Technical Implementation Integrity

The frontend Privacy Policy page has been constructed with:
- Strict factual alignment with verified technical capabilities.
- Live integration with the existing Cookie Management System (`openPreferences()` and direct link to `/cookie-policy`).
- Zero fabricated cookie inventories or fictitious certifications (no false claims of SOC 2 / ISO 27001).
- Clear human-in-the-loop explanation for AI revenue scoring without misleading automated decision claims.
