import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  SlidersHorizontal, 
  Cookie, 
  CheckCircle2, 
  AlertTriangle,
  Scale, 
  Calendar, 
  Users, 
  Bot, 
  Server, 
  Database,
  ArrowRight
} from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

export function TermsOfService() {
  const { openPreferences } = useCookieConsent();

  useEffect(() => {
    document.title = 'Terms of Service | RevOS';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Read the RevOS Terms of Service to understand the conditions governing platform access, user responsibilities, subscriptions, intellectual property, AI-assisted services and contractual obligations.'
      );
    }
  }, []);

  const EFFECTIVE_DATE = 'October 30, 2026';
  const LAST_UPDATED = 'October 30, 2026';

  const SECTIONS = [
    { id: 'acceptance', title: '1. Introduction & Acceptance' },
    { id: 'definitions', title: '2. Definitions' },
    { id: 'eligibility', title: '3. Eligibility & Authority' },
    { id: 'account-security', title: '4. Account Registration & Security' },
    { id: 'services-scope', title: '5. RevOS Services & Features' },
    { id: 'fees-billing', title: '6. Subscriptions, Fees & Payments' },
    { id: 'acceptable-use', title: '7. Acceptable Use & Restrictions' },
    { id: 'customer-content', title: '8. Customer Content & Responsibilities' },
    { id: 'intellectual-property', title: '9. Intellectual Property Rights' },
    { id: 'ai-limitations', title: '10. AI Outputs & Decision-Support Limitations' },
    { id: 'confidentiality', title: '11. Confidential Information' },
    { id: 'privacy-protection', title: '12. Privacy & Data Protection' },
    { id: 'availability-changes', title: '13. Availability, Maintenance & Changes' },
    { id: 'third-party-services', title: '14. Third-Party Services' },
    { id: 'suspension-termination', title: '15. Suspension & Termination' },
    { id: 'disclaimers-liability', title: '16. Disclaimers & Limitation of Liability' },
    { id: 'governing-law', title: '17. Governing Law & Dispute Resolution' },
    { id: 'general-terms', title: '18. General Provisions' }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="border-b border-border bg-bg-surface/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
            <Scale className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Legal &amp; Agreements</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
            Terms Governing Your Use of RevOS
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-6">
            These Terms of Service constitute a legally binding agreement between you and RevOS ("Apprevos Technology") governing your access to and use of our platform, applications, and AI-native revenue operating tools.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-secondary pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Effective Date: <strong>{EFFECTIVE_DATE}</strong></span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div>Last Updated: <strong>{LAST_UPDATED}</strong></div>
            <span className="hidden sm:inline text-border">•</span>
            <div>Version: <strong>1.0</strong></div>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/privacy-policy" className="text-accent hover:underline font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN CONTENT WITH STICKY TOC */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 items-start">
          
          {/* STICKY TABLE OF CONTENTS (DESKTOP) */}
          <aside className="hidden lg:block sticky top-24 space-y-4 p-5 rounded-2xl border border-border bg-bg-surface/80 max-h-[80vh] overflow-y-auto text-xs">
            <div className="font-bold uppercase tracking-wider text-accent text-[11px] mb-2">
              Contract Sections
            </div>
            <nav className="space-y-1.5">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block text-text-secondary hover:text-accent transition-colors py-1 leading-snug"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* EDITORIAL ARTICLES */}
          <main className="space-y-16 text-sm sm:text-base text-text-secondary leading-relaxed">

            {/* SECTION 1 */}
            <section id="acceptance" aria-labelledby="acceptance-heading" className="space-y-4">
              <h2 id="acceptance-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                1. Introduction and Acceptance
              </h2>
              <p>
                Welcome to <strong>RevOS</strong>. These Terms of Service ("<strong>Terms</strong>") govern your access to and use of the RevOS website, web application, software, and commercial intelligence services (collectively, the "<strong>Services</strong>"), operated by <strong>Apprevos Technology</strong> ("<strong>RevOS</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>").
              </p>
              <p>
                By creating an account, checking the acceptance box during registration, or accessing the Services, you agree to be bound by these Terms and our <Link to="/privacy-policy" className="text-accent hover:underline font-medium">Privacy Policy</Link>. If you do not agree to these Terms, you must not access or use the Services.
              </p>
              <p>
                If you are accessing the Services on behalf of a company, organization, or other legal entity, you represent and warrant that you have the legal authority to bind that entity to these Terms. In that case, "<strong>Customer</strong>", "<strong>you</strong>", and "<strong>your</strong>" refer to that entity.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 2 */}
            <section id="definitions" aria-labelledby="definitions-heading" className="space-y-4">
              <h2 id="definitions-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                2. Definitions
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Account"</strong> means a registered user profile created to access the RevOS platform.</li>
                <li><strong>"Customer Content"</strong> means all text, business metrics, pipeline data, deal qualification records, customer information, and materials uploaded or entered into the Services by you.</li>
                <li><strong>"AI Inputs"</strong> means any data, criteria, prompts, or context you submit to our AI reasoning features.</li>
                <li><strong>"AI Outputs"</strong> means the assessments, deal scores, SWOT analyses, executive critiques, and recommendations generated by our AI models based on your AI Inputs.</li>
                <li><strong>"Services"</strong> means the RevOS commercial revenue operating system, including GTMOS, Lead Qualification, Pipeline Assessment, and related modules.</li>
                <li><strong>"Workspace"</strong> means a digital organizational container within RevOS where your team accesses shared data, intelligence graphs, and revenue modules.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 3 */}
            <section id="eligibility" aria-labelledby="eligibility-heading" className="space-y-4">
              <h2 id="eligibility-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                3. Eligibility and Authority
              </h2>
              <p>
                RevOS is a professional B2B software platform intended for business users, commercial revenue executives, sales managers, and revenue operations teams. You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to register for and use the Services.
              </p>
              <p>
                You represent and warrant that you are not barred from receiving the Services under the laws of applicable jurisdictions (including international trade sanctions and export control regulations) and that your use of the Services complies with all applicable business regulations.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 4 */}
            <section id="account-security" aria-labelledby="account-heading" className="space-y-4">
              <h2 id="account-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                4. Account Registration and Security
              </h2>
              <p>
                To access the commercial intelligence modules, you must register for an Account by providing your full name, business email address, and a secure password. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Provide accurate, current, and complete registration information.</li>
                <li>Maintain the confidentiality and security of your login credentials.</li>
                <li>Promptly notify RevOS if you discover or suspect unauthorized access to your Account.</li>
                <li>Remain responsible for all activities conducted under your Account credentials, except where unauthorized access results from our proven failure to implement required technical security controls.</li>
              </ul>
              <p>
                Account sharing across multiple individuals is prohibited. Each user accessing the platform must possess their own unique commercial identity.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 5 */}
            <section id="services-scope" aria-labelledby="services-heading" className="space-y-4">
              <h2 id="services-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                5. RevOS Services and Platform Features
              </h2>
              <p>
                RevOS delivers structured methodologies combined with AI reasoning to assist business users in evaluating commercial revenue operations. Active platform modules include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <div className="font-bold text-text-primary text-base">GTMOS (Go-to-Market OS)</div>
                  <p className="text-xs sm:text-sm">
                    Structured examination of ideal customer profiles (ICP), market segments, value propositions, competitive positioning, and revenue target models.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <div className="font-bold text-text-primary text-base">Lead &amp; Pipeline Qualification</div>
                  <p className="text-xs sm:text-sm">
                    Structured evaluation of Marketing-Qualified Leads (MQL), Sales-Qualified Leads (SQL), and enterprise deal opportunities under proven methodologies including MEDDPICC.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <div className="font-bold text-text-primary text-base">Pipeline Risk Assessment</div>
                  <p className="text-xs sm:text-sm">
                    Identification of opportunity qualification gaps, deal stall indicators, decision authority deficits, and recommended next best sales actions.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <div className="font-bold text-text-primary text-base">AI Reasoning &amp; Syntheses</div>
                  <p className="text-xs sm:text-sm">
                    Contextual AI-generated assessment scores, executive summaries, and SWOT insights to enhance human strategic decision-making.
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm italic">
                RevOS is a continuously evolving cloud platform. We reserve the right to deploy updates, enhance analytical features, optimize data models, or modify non-essential platform interfaces in accordance with these Terms.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 6 */}
            <section id="fees-billing" aria-labelledby="fees-heading" className="space-y-4">
              <h2 id="fees-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                6. Subscription Plans, Fees and Payments
              </h2>
              <p>
                <strong>Current Platform Stage:</strong> RevOS is currently provided under early commercial access, pilot evaluations, or free sandbox access ("<strong>Free Tier</strong>"). No credit card is required to register, and no fees are charged for standard exploratory usage.
              </p>
              <p>
                <strong>Future Commercial Tiers:</strong> When paid commercial plans (e.g. Paid User, Enterprise Executive, or Workspace Governance) are introduced, applicable subscription fees, billing cycles, quotas, and renewal terms will be clearly presented prior to activation. You will never be billed without your explicit prior authorization and agreement to an applicable order form or checkout schedule.
              </p>
              <p>
                <strong>Usage Quotas:</strong> To maintain platform stability and protect backend AI infrastructure, RevOS may apply reasonable monthly API reasoning quotas (e.g. standard monthly query allotments associated with user roles).
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 7 */}
            <section id="acceptable-use" aria-labelledby="acceptable-heading" className="space-y-4">
              <h2 id="acceptable-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                7. Acceptable Use and Prohibited Activities
              </h2>
              <p>
                You agree to use the Services only for lawful business purposes in compliance with these Terms. You agree <strong>not</strong> to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                <li>Access or attempt to access non-public areas of the platform, computer systems, or database infrastructure.</li>
                <li>Bypass, disable, or tamper with security controls, authentication mechanisms, or Row Level Security (RLS) policies.</li>
                <li>Reverse engineer, decompile, disassemble, or extract the source code or underlying proprietary algorithms of RevOS.</li>
                <li>Conduct unauthorized automated scraping, systematic data extraction, or bulk query flooding against our edge APIs.</li>
                <li>Resell, sublicense, lease, or distribute the Services to third parties without prior written commercial authorization.</li>
                <li>Upload malicious code, viruses, worms, or software designed to damage or disrupt platform operations.</li>
                <li>Submit misleading, fraudulent, defamatory, or unlawful business records, or violate third-party confidentiality rights.</li>
                <li>Interfere with or disrupt the access of any user, host, or network connected to the Services.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 8 */}
            <section id="customer-content" aria-labelledby="content-heading" className="space-y-4">
              <h2 id="content-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                8. Customer Content and User Responsibilities
              </h2>
              <p>
                <strong>Ownership:</strong> As between you and RevOS, you retain all rights, title, and ownership in and to your Customer Content. RevOS claims no ownership over your proprietary pipeline data, sales notes, or strategic plans.
              </p>
              <p>
                <strong>Limited License to RevOS:</strong> You grant RevOS a worldwide, non-exclusive, royalty-free, limited license to host, store, transfer, display, and process your Customer Content solely as necessary to provide, secure, support, and maintain the Services for you and your authorized team members.
              </p>
              <p>
                <strong>Customer Warranties:</strong> You represent and warrant that you possess all necessary rights, licenses, and statutory authority to submit your Customer Content (including any contact details of prospects or colleagues) to RevOS without violating any third-party privacy, intellectual property, or contractual rights.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 9 */}
            <section id="intellectual-property" aria-labelledby="ip-heading" className="space-y-4">
              <h2 id="ip-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                9. Intellectual Property Rights
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>RevOS Platform IP:</strong> The Services, including the software, source code, user interfaces, branding, logos, proprietary qualification scoring engines, structured frameworks, and documentation, are the exclusive property of Apprevos Technology and its licensors, protected by intellectual property laws.
                </p>
                <p>
                  <strong>Feedback:</strong> If you provide feedback, ideas, or suggestions regarding the platform, RevOS may use that feedback without restriction or obligation of compensation to you.
                </p>
                <p>
                  <strong>AI Outputs:</strong> Subject to your compliance with these Terms, RevOS grants you the right to use, copy, export, and internally distribute the AI Outputs generated for your Account for your internal business and commercial revenue operations.
                </p>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 10 */}
            <section id="ai-limitations" aria-labelledby="ai-lim-heading" className="space-y-4">
              <h2 id="ai-lim-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                10. AI Features, Outputs and Decision-Support Limitations
              </h2>
              <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2 text-accent font-bold text-base">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  <span>Important Contractual Disclaimers Regarding AI Analysis</span>
                </div>
                <p className="text-xs sm:text-sm">
                  RevOS utilizes generative artificial intelligence models to assist commercial revenue teams. By using our AI reasoning modules, you acknowledge and agree to the following contractual terms:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                  <li><strong>Probabilistic Nature:</strong> AI outputs are probabilistic assessments. While designed to adhere strictly to enterprise qualification frameworks (e.g. MEDDPICC), outputs may occasionally contain inaccuracies, incomplete conclusions, or assumptions that do not reflect your real-world customer situation.</li>
                  <li><strong>Input Dependency:</strong> The accuracy and validity of deal scores and recommendations depend entirely on the completeness and truthfulness of the evidence and criteria you provide.</li>
                  <li><strong>Human-in-the-Loop Required:</strong> RevOS is an executive decision-support tool. It is not an automated replacement for human commercial discernment. You are responsible for reviewing, testing, and validating all recommendations before making sales, pricing, or strategic investments.</li>
                  <li><strong>No Commercial Guarantees:</strong> RevOS does not guarantee closed sales, win rates, quota attainment, revenue growth, or specific financial results. Commercial success depends on market factors beyond the control of any software platform.</li>
                  <li><strong>No Professional Advisory:</strong> RevOS outputs do not constitute formal legal, accounting, tax, or regulatory advice.</li>
                </ul>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 11 */}
            <section id="confidentiality" aria-labelledby="confidentiality-heading" className="space-y-4">
              <h2 id="confidentiality-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                11. Confidential Information
              </h2>
              <p>
                "<strong>Confidential Information</strong>" means any non-public technical, business, commercial, or strategic data disclosed by one party to the other that is marked as confidential or should reasonably be understood to be confidential.
              </p>
              <p>
                Each party agrees to: (a) protect the other party's Confidential Information with the same degree of care it uses for its own confidential data (and no less than reasonable care); (b) not disclose Confidential Information to any third party except to authorized employees, contractors, and cloud sub-processors who need to know it; and (c) use Confidential Information solely to exercise rights and perform obligations under these Terms.
              </p>
              <p className="text-xs sm:text-sm">
                Confidentiality obligations do not apply to information that is or becomes publicly known without breach, was already known prior to disclosure, or is independently developed without reference to the other party's Confidential Information.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 12 */}
            <section id="privacy-protection" aria-labelledby="privacy-heading" className="space-y-4">
              <h2 id="privacy-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                12. Privacy and Data Protection
              </h2>
              <p>
                We process personal information in accordance with our <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">Privacy Policy</Link> and <Link to="/cookie-policy" className="text-accent hover:underline font-semibold">Cookie Policy</Link>.
              </p>
              <p>
                Where RevOS processes personal data on behalf of an enterprise Customer as a data processor (such as prospect records entered by your sales team), the parties agree to enter into an appropriate Data Processing Agreement (DPA) incorporating standard contractual clauses where required by applicable data protection law.
              </p>
              <p>
                You may review and adjust your browser storage and tracking preferences at any time using our <button type="button" onClick={openPreferences} className="text-accent hover:underline font-semibold inline-flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" />Cookie Settings</button>.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 13 */}
            <section id="availability-changes" aria-labelledby="avail-heading" className="space-y-4">
              <h2 id="avail-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                13. Platform Availability, Maintenance and Changes
              </h2>
              <p>
                RevOS strives to maintain reliable service delivery. However, the Services are provided over cloud infrastructure, and access may occasionally be suspended or restricted for emergency maintenance, software upgrades, or technical issues.
              </p>
              <p>
                Unless explicitly agreed in a separate signed Enterprise Service Level Agreement (SLA), RevOS does not guarantee uninterrupted or error-free platform uptime. We recommend that customers maintain independent backups of critical strategic business information.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 14 */}
            <section id="third-party-services" aria-labelledby="third-heading" className="space-y-4">
              <h2 id="third-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                14. Third-Party Services
              </h2>
              <p>
                RevOS relies on select enterprise infrastructure sub-processors to power its platform, including Supabase Inc. (cloud database &amp; auth), Google Cloud (Cloud Run container delivery &amp; Gemini AI models), and EmailJS (inquiry delivery).
              </p>
              <p>
                Your use of features that interact with third-party providers is subject to the technical availability of those services. While RevOS maintains responsibility for its own software architecture, we are not liable for outages caused by independent upstream telecommunication or third-party cloud failures outside our reasonable control.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 15 */}
            <section id="suspension-termination" aria-labelledby="term-heading" className="space-y-4">
              <h2 id="term-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                15. Suspension and Termination
              </h2>
              <p>
                <strong>Termination by You:</strong> You may terminate these Terms at any time by discontinuing use of the Services and requesting closure of your Account through our <Link to="/about/contact" className="text-accent hover:underline">Contact Portal</Link>.
              </p>
              <p>
                <strong>Suspension or Termination by RevOS:</strong> We may suspend or terminate your access to the Services immediately if: (a) you materially breach these Terms (including acceptable use rules); (b) your use poses a security risk to the platform or other users; (c) required by statutory law or court order; or (d) you fail to cure a non-material breach within thirty (30) days of written notice.
              </p>
              <p>
                <strong>Effect of Termination:</strong> Upon termination, your right to access the Services ceases. We will handle your Customer Content in accordance with our data retention schedule outlined in our Privacy Policy.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 16 */}
            <section id="disclaimers-liability" aria-labelledby="liability-heading" className="space-y-4">
              <h2 id="liability-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                16. Disclaimers and Limitation of Liability
              </h2>
              <div className="space-y-3">
                <p>
                  <strong>Disclaimer of Warranties:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES AND AI OUTPUTS ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  <strong>Limitation of Indirect Damages:</strong> IN NO EVENT SHALL REVOS, ITS AFFILIATES, OFFICERS, DIRECTORS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF REVENUE, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH THE SERVICES OR AI OUTPUTS.
                </p>
                <p>
                  <strong>Mandatory Statutory Rights Preserved:</strong> NOTHING IN THESE TERMS SHALL EXCLUDE OR LIMIT LIABILITY FOR: (A) DEATH OR PERSONAL INJURY CAUSED BY NEGLIGENCE; (B) INTENTIONAL MISCONDUCT (VORSATZ) OR GROSS NEGLIGENCE (GROBE FAHRLÄSSIGKEIT); (C) FRAUD OR FRAUDULENT MISREPRESENTATION; OR (D) ANY OTHER LIABILITY THAT CANNOT LAWFULLY BE EXCLUDED OR LIMITED UNDER APPLICABLE MANDATORY STATUTORY LAW.
                </p>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 17 */}
            <section id="governing-law" aria-labelledby="law-heading" className="space-y-4">
              <h2 id="law-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                17. Governing Law and Dispute Resolution
              </h2>
              <p>
                These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be governed by and construed in accordance with the laws of the jurisdiction of Apprevos Technology’s registered establishment, without giving effect to conflict of law principles.
              </p>
              <p>
                Before initiating formal legal proceedings, the parties agree to make good-faith efforts to resolve any dispute through informal executive consultation by contacting <a href="mailto:paul.zy.wang@hotmail.com" className="text-accent hover:underline">paul.zy.wang@hotmail.com</a>. If the dispute is not resolved within forty-five (45) days, either party may seek resolution before the competent courts of the platform operator's registered seat.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 18 */}
            <section id="general-terms" aria-labelledby="general-heading" className="space-y-4">
              <h2 id="general-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                18. General Provisions
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                <li><strong>Modifications to Terms:</strong> We may revise these Terms from time to time. When material changes are made, we will update the "Last Updated" date and provide notice through the platform. Your continued use of the Services after updated Terms become effective constitutes agreement.</li>
                <li><strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, that provision will be enforced to the maximum extent permissible, and the remaining provisions will remain in full force and effect.</li>
                <li><strong>Waiver:</strong> No failure or delay by either party in exercising any right under these Terms shall constitute a waiver of that right.</li>
                <li><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. RevOS may assign its rights and obligations in connection with a corporate reorganization, merger, or asset sale.</li>
                <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, Cookie Policy, and any signed Enterprise Order Form, constitute the entire agreement between you and RevOS regarding the Services.</li>
                <li><strong>Contact Information:</strong> For contractual notices or inquiries regarding these Terms, contact us at:
                  <div className="mt-2 p-3.5 rounded-xl border border-border bg-bg-surface font-mono text-xs">
                    Apprevos Technology (RevOS)<br />
                    Attn: Commercial Legal &amp; Compliance<br />
                    Email: paul.zy.wang@hotmail.com<br />
                    Online: /about/contact
                  </div>
                </li>
              </ul>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
