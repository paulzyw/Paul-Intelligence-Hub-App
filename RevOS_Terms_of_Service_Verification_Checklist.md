# RevOS Terms of Service — Verification Checklist & Commercial Audit Report
**Version:** 1.0  
**Audit Date:** October 30, 2026  
**Target Platform:** RevOS (Apprevos Technology)  
**Publication Status:** **PENDING OWNER CONFIRMATION (PUBLICATION BLOCKERS IDENTIFIED)**

---

## 1. Executive Summary & Purpose

This document establishes the commercial and contractual audit of the RevOS platform based on a thorough inspection of the codebase, application modules, registration flow, commercial model, AI reasoning pipelines, and third-party integrations.

Under the core principle: **"Never invent legal entities, commercial terms, subscription arrangements, refund policies, service guarantees, intellectual property rights, liability commitments or contractual obligations that cannot be verified,"** this document distinguishes:
1. **Verified Technical & Commercial Implementation Facts**.
2. **Commercial & Contractual Facts Requiring Owner Confirmation**.
3. **Future Product Decisions & Commercial Features**.
4. **Publication Blockers Requiring Legal Resolution**.

---

## 2. Structured Commercial & Contractual Audit Table

| Area | Verified Finding | Evidence in Codebase | Verification Status | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Contracting Entity** | Operates as "RevOS", company name "Apprevos Technology", founder Paul Wang. | `src/components/Footer.tsx`, `src/pages/Contact.tsx` | Partially Verified | **OWNER CONFIRMATION**: Confirm full registered corporate name (e.g. Apprevos Technology GmbH / Inc. / Ltd.) and registered address. |
| **Customer Model** | Primarily B2B enterprise revenue teams (sales, GTM leaders, executives). Individual registration is possible. | `src/pages/Auth.tsx`, `RevOSApp.tsx` | **Verified** | Disclose B2B orientation while ensuring mandatory consumer rights are not unlawfully waived. |
| **Product Scope** | GTMOS (GTM strategy), Lead Qualification (MQL/SQL/Opportunity with MEDDPICC), Pipeline Assessment, and AI reasoning. | `src/apps/revos/gtmos/`, `src/apps/revos/leads/` | **Verified** | Accurately describe available modules without promising unbuilt features. |
| **Commercial Model** | Currently operating as a pilot / early access sandbox. No payment gateway (Stripe, etc.) or checkout exists in code. | Full codebase inspection | **Verified** | Terms accurately state current free pilot/trial terms. No fabricated payment or renewal clauses. |
| **Role Hierarchy** | RBAC roles: `guest`, `free_user`, `paid_user`, `enterprise_user`, `workspace_admin`, `enterprise_executive`, `revos_admin`, `super_admin`. New signups default to `free_user`. | `src/types/index.ts`, `supabase/migrations/20260520_rbac_system.sql` | **Verified** | Reflected in service access terms. |
| **Registration Acceptance**| Previously, signup did not require explicit checkbox acceptance of Terms or Privacy Policy. | `src/pages/Auth.tsx` | **Addressed** | Added explicit un-preselected agreement checkbox recording `terms_version: '1.0'` and timestamp in auth metadata. |
| **AI Integration** | Google Gemini API accessed server-side via Supabase Edge Functions (`gtmos-api`, `lead-qualification`). | `supabase/functions/` | **Verified** | Comprehensive AI limitations and disclaimers drafted in Section 10. |
| **AI Output Nature** | AI outputs are decision-support insights (deal confidence scores, gap analyses, executive summaries). No automated legal decisions under GDPR Art. 22. | `lead-qualification/index.ts` | **Verified** | Explicitly framed as human-in-the-loop decision support. |
| **Customer Data Rights** | Customers submit company profiles, deal notes, and pipeline metrics. Customers retain all rights in Customer Content. | `src/apps/revos/` | **Verified** | Granted limited license solely to operate, secure, and deliver the service. |
| **Service Availability**| No formal Service Level Agreement (SLA) or guaranteed uptime percentage exists in code or documentation. | Repository inspection | **Verified** | Disclaim specific uptime guarantees while committing to commercially reasonable availability. |
| **Governing Law** | Not specified in codebase. | Owner confirmation needed | Unverified | **OWNER & LEGAL DECISION**: Formally select governing law and competent court jurisdiction (e.g., Delaware, England & Wales, Germany, etc.). |
| **Liability Limits** | No liability cap currently contracted. | Owner confirmation needed | Unverified | **LEGAL REVIEW**: Review standard SaaS liability limitation in light of governing jurisdiction. |

---

## 3. Publication Blockers & Required Owner Decisions

Before these Terms of Service can be considered **legally finalized for production commercial execution**, the business owner and legal counsel must resolve the following 4 blockers:

1. **[BLOCKER 1] Legal Entity & Registered Office Address:**
   - **Requirement:** The contracting party must be definitively named with its registered jurisdiction and legal address.
   - **Action:** Provide official registered corporate name and physical street address.

2. **[BLOCKER 2] Governing Law & Jurisdiction:**
   - **Requirement:** A commercial contract must specify which jurisdiction's laws govern disputes and which courts have jurisdiction.
   - **Action:** Specify governing jurisdiction (e.g., German law with Munich courts, or Delaware law with US courts).

3. **[BLOCKER 3] Future Commercial Tier & Payment Policy:**
   - **Requirement:** When paid subscriptions launch (Stripe / invoicing), terms must incorporate fee structures, auto-renewal rules, and cancellation policies.
   - **Action:** Complete Section 6 prior to deploying paid credit card checkout or invoicing workflows.

4. **[BLOCKER 4] Enterprise Data Processing Agreement (DPA):**
   - **Requirement:** When enterprise customers submit proprietary pipeline records containing employee or prospect personal data, a formal DPA must accompany the Terms.
   - **Action:** Finalize standard RevOS customer DPA template.

---

## 4. Technical Implementation Integrity

- **Route:** Accessible at `/terms-of-service` (with redirect from `/terms`).
- **Footer Integration:** Linked in the bottom legal row alongside Privacy Policy, Cookie Policy, and Cookie Settings.
- **Registration Integration:** Added a mandatory, un-preselected Terms & Privacy agreement checkbox in `src/pages/Auth.tsx` capturing version `1.0` and timestamp in user metadata upon signup.
- **Zero Fictitious Terms:** Transparently describes current platform reality (free trial/pilot access, no credit card required) without fabricated payment or refund rules.
