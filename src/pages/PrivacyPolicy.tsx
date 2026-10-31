import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  SlidersHorizontal, 
  Cookie, 
  ExternalLink, 
  Calendar, 
  UserCheck, 
  Database, 
  Bot, 
  Server, 
  FileText, 
  Mail, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

export function PrivacyPolicy() {
  const { openPreferences } = useCookieConsent();

  useEffect(() => {
    document.title = 'Privacy Policy | RevOS';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Learn how RevOS collects, uses, stores and protects personal information, including data processed through its AI-powered revenue intelligence platform.'
      );
    }
  }, []);

  const LAST_UPDATED = 'October 30, 2026';

  const SECTIONS = [
    { id: 'introduction', title: '1. Introduction & Scope' },
    { id: 'who-we-are', title: '2. Who We Are (Data Controller)' },
    { id: 'data-collected', title: '3. Personal Information We Collect' },
    { id: 'how-we-use', title: '4. How We Use Personal Data' },
    { id: 'legal-basis', title: '5. Legal Bases for Processing' },
    { id: 'ai-processing', title: '6. How RevOS Uses Artificial Intelligence' },
    { id: 'data-sharing', title: '7. Who May Receive Your Personal Data' },
    { id: 'international-transfers', title: '8. International Data Transfers' },
    { id: 'data-retention', title: '9. How Long We Retain Your Data' },
    { id: 'data-security', title: '10. Technical & Organizational Security' },
    { id: 'user-rights', title: '11. Your Data Protection Rights' },
    { id: 'cookies-storage', title: '12. Cookies & Similar Technologies' },
    { id: 'automated-decisions', title: '13. AI Analysis & Decision-Making' },
    { id: 'third-party-links', title: '14. Third-Party Services & Links' },
    { id: 'policy-updates', title: '15. Updates to This Policy' },
    { id: 'contact-us', title: '16. Contact & Complaints' }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="border-b border-border bg-bg-surface/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Legal & Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
            How RevOS Collects, Uses and Protects Your Personal Data
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-6">
            This Privacy Policy explains how RevOS ("we", "us", or "our") processes personal data when you visit our website, register for an account, or interact with our AI-native revenue operating system.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-secondary pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Last updated: <strong>{LAST_UPDATED}</strong></span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <div>Policy Version: <strong>1.0</strong></div>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/terms-of-service" className="text-accent hover:underline font-semibold flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Terms of Service</span>
            </Link>
            <span className="hidden sm:inline text-border">•</span>
            <Link to="/cookie-policy" className="text-accent hover:underline font-semibold flex items-center gap-1">
              <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cookie Policy</span>
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
              Contents
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
            <section id="introduction" aria-labelledby="intro-heading" className="space-y-4">
              <h2 id="intro-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                1. Introduction &amp; Scope
              </h2>
              <p>
                RevOS provides commercial revenue intelligence, go-to-market strategy frameworks, lead qualification modules (MQL/SQL), and pipeline assessment tools. Protecting your personal data and commercial confidentiality is essential to our mission.
              </p>
              <p>
                This Privacy Policy applies to personal data collected through:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>The public RevOS website and research publications.</li>
                <li>The authenticated RevOS commercial web application and intelligence modules.</li>
                <li>Direct inquiries, customer support requests, and communications submitted through our contact forms.</li>
              </ul>
              <p>
                This policy applies to website visitors, registered commercial users, and individuals whose business contact details are uploaded or entered into our qualification modules by our commercial customers.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 2 */}
            <section id="who-we-are" aria-labelledby="who-heading" className="space-y-4">
              <h2 id="who-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                2. Who Is Responsible for Your Personal Data?
              </h2>
              <p>
                The data controller responsible for the processing of your personal data under this Privacy Policy is:
              </p>
              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2 text-xs sm:text-sm">
                <div><strong>Platform Brand:</strong> RevOS</div>
                <div><strong>Operating Entity:</strong> Apprevos Technology</div>
                <div><strong>Founder &amp; Principal:</strong> Paul Wang</div>
                <div><strong>Direct Contact Mailbox:</strong> <a href="mailto:paul.zy.wang@hotmail.com" className="text-accent hover:underline">paul.zy.wang@hotmail.com</a></div>
                <div><strong>Online Inquiries:</strong> <Link to="/about/contact" className="text-accent hover:underline">Contact Form (/about/contact)</Link></div>
              </div>
              <p className="text-xs italic text-text-secondary">
                Note on Corporate Details: Official corporate registration numbers and physical registered office addresses are currently being formalized as part of our platform incorporation. Inquiries may be directed to our founder contact mailbox above.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 3 */}
            <section id="data-collected" aria-labelledby="collected-heading" className="space-y-6">
              <h2 id="collected-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                3. Personal Information We Collect
              </h2>
              <p>
                We collect personal information directly from you, automatically through your interaction with the platform, and through user-submitted business records:
              </p>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-accent" />
                    3.1 Account and Authentication Information
                  </h3>
                  <p className="text-xs sm:text-sm">
                    When you create an account, we collect your <strong>Full Name</strong> and <strong>Email Address</strong>. Authentication credentials and password hashes are handled securely via our Supabase Auth infrastructure. RevOS never stores or has access to your plaintext password.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" />
                    3.2 User-Submitted Business Information
                  </h3>
                  <p className="text-xs sm:text-sm">
                    RevOS users submit strategic commercial data to power revenue analysis. This may include:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                    <li>Ideal Customer Profiles (ICP), target industries, company revenue ranges, and buyer personas.</li>
                    <li>Marketing-Qualified Lead (MQL) and Sales-Qualified Lead (SQL) records, including contact names, business email addresses, job titles, and company names.</li>
                    <li>Deal qualification evidence, discovery meeting notes, stakeholder authority mappings, and MEDDPICC criteria evaluations.</li>
                    <li>Revenue forecasts, win rates, sales velocity parameters, and go-to-market plans.</li>
                  </ul>
                  <p className="text-xs text-text-secondary pt-1">
                    <em>Important:</em> Business records submitted by users may contain personal data relating to their own colleagues, prospects, or customer stakeholders. Commercial customers are solely responsible for ensuring they possess an appropriate legal basis to submit such information.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-accent" />
                    3.3 AI Inputs and Generated Outputs
                  </h3>
                  <p className="text-xs sm:text-sm">
                    When invoking AI reasoning modules (GTMOS, Lead Qualification, or Chat Assistant), the context you enter (such as company pain points, qualification answers, or strategic goals) is processed to generate audit scores, executive summaries, deal gap analyses, and next best actions. Assessment scores and generated syntheses are stored in our database for your ongoing workflow review.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-accent" />
                    3.4 Technical and Usage Telemetry
                  </h3>
                  <p className="text-xs sm:text-sm">
                    When you access our platform, our edge infrastructure automatically collects standard web logs (IP addresses, user-agent, request timestamps). If you grant <strong>Analytics consent</strong> in our Cookie Preference Center, first-party visit telemetry (page paths and referrers) is logged via secure edge functions to identify platform performance and bottlenecks.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-accent" />
                    3.5 Inquiries and Communications
                  </h3>
                  <p className="text-xs sm:text-sm">
                    When you submit an inquiry through our Contact page, we collect your full name, business email, company name, subject, and message content to respond to your request.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 4 */}
            <section id="how-we-use" aria-labelledby="use-heading" className="space-y-4">
              <h2 id="use-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                4. How We Use Personal Data
              </h2>
              <p>
                We use the personal information we collect for the following specific, legitimate business purposes:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Account Management:</strong> To create, authenticate, and maintain your RevOS user account and enforce role-based access controls (RBAC).</li>
                <li><strong>Service Delivery:</strong> To provide you with access to GTMOS strategic planning, lead qualification audits, and pipeline assessment dashboards.</li>
                <li><strong>AI Reasoning Execution:</strong> To synthesize your qualification evidence, calculate objective deal confidence scores, and generate contextual recommendations.</li>
                <li><strong>Workspace Persistence:</strong> To save your progress, draft assessments, and team qualification sessions.</li>
                <li><strong>Security &amp; Integrity:</strong> To protect the platform against fraud, bot attacks, unauthorized access, and cyber threats.</li>
                <li><strong>Customer Communications:</strong> To respond to support inquiries, strategic partnership proposals, and administrative notifications.</li>
                <li><strong>Performance Monitoring:</strong> To analyze feature usage trends and optimize database query latencies (subject to visitor consent).</li>
                <li><strong>Legal Compliance:</strong> To satisfy statutory accounting, tax, regulatory, and audit obligations.</li>
              </ol>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 5 */}
            <section id="legal-basis" aria-labelledby="legal-heading" className="space-y-4">
              <h2 id="legal-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                5. Legal Bases for Processing (GDPR Article 6)
              </h2>
              <p>
                Where the General Data Protection Regulation (GDPR) or UK GDPR applies, we rely on the following statutory legal bases to process your personal data:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border bg-bg-surface text-xs sm:text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-bg-primary/70 text-text-primary font-semibold">
                      <th className="p-3 sm:p-4">Processing Purpose</th>
                      <th className="p-3 sm:p-4">Personal Data Involved</th>
                      <th className="p-3 sm:p-4">Applicable Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">Account Creation &amp; Authentication</td>
                      <td className="p-3 sm:p-4">Full name, email address, password hash</td>
                      <td className="p-3 sm:p-4">Performance of a Contract (Art. 6(1)(b))</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">Core Revenue Platform Delivery</td>
                      <td className="p-3 sm:p-4">Workspace records, strategy drafts, assessments</td>
                      <td className="p-3 sm:p-4">Performance of a Contract (Art. 6(1)(b))</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">AI Reasoning &amp; Assessment Scoring</td>
                      <td className="p-3 sm:p-4">User prompts, submitted qualification criteria</td>
                      <td className="p-3 sm:p-4">Performance of a Contract (Art. 6(1)(b)) / Legitimate Interests (Art. 6(1)(f))</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">Platform Telemetry &amp; Analytics</td>
                      <td className="p-3 sm:p-4">Page paths, referrers, anonymous ID</td>
                      <td className="p-3 sm:p-4">Consent (Art. 6(1)(a) &amp; ePrivacy Directive)</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">Platform Security &amp; Fraud Prevention</td>
                      <td className="p-3 sm:p-4">IP addresses, security logs, access timestamps</td>
                      <td className="p-3 sm:p-4">Legitimate Interests (Art. 6(1)(f))</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-medium text-text-primary">Inquiries &amp; Support Communications</td>
                      <td className="p-3 sm:p-4">Contact name, email, message history</td>
                      <td className="p-3 sm:p-4">Legitimate Interests (Art. 6(1)(f)) / Contractual steps (Art. 6(1)(b))</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 6 */}
            <section id="ai-processing" aria-labelledby="ai-heading" className="space-y-4">
              <h2 id="ai-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                6. How RevOS Uses Artificial Intelligence (Gemini API)
              </h2>
              <p>
                RevOS is an AI-native revenue operating system. We utilize advanced Large Language Model capabilities via Google’s Gemini API to structure commercial intelligence, score qualification criteria against methodologies like MEDDPICC, and provide strategic recommendations.
              </p>
              
              <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 space-y-3">
                <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                  <Bot className="h-4 w-4 text-accent" />
                  Technical AI Architecture
                </h3>
                <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                  <li><strong>Server-Side Proxy Execution:</strong> All AI reasoning requests originate strictly from backend Supabase Edge Functions (e.g. <code>gtmos-api</code> and <code>lead-qualification</code>). The client browser never communicates directly with Gemini, and API secrets are never exposed.</li>
                  <li><strong>Data Transmitted:</strong> Information transmitted in AI prompts includes user-submitted company attributes, deal metrics, qualification answers, and evaluation rubrics.</li>
                  <li><strong>Model Training Disclosure:</strong> RevOS processes user queries through enterprise API endpoints. Under standard Google Cloud Enterprise API terms, customer API inputs and outputs are not used to train or fine-tune Google’s foundational AI models without authorization.</li>
                  <li><strong>Storage of AI Outputs:</strong> Structured assessment scores, reasoning summaries, and executive audit notes generated by the AI are stored in RevOS database tables so that sales teams can review historical progression over time.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-border bg-bg-surface text-xs sm:text-sm space-y-2">
                <strong className="text-text-primary flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  User Responsibility for Third-Party Confidentiality:
                </strong>
                <p>
                  You should not submit sensitive personal data (such as health, biometric, or payment card information) into AI prompt fields. When submitting information about your company’s sales prospects, you are responsible for ensuring that your disclosure complies with applicable privacy laws and confidentiality agreements.
                </p>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 7 */}
            <section id="data-sharing" aria-labelledby="sharing-heading" className="space-y-4">
              <h2 id="sharing-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                7. Who May Receive Your Personal Data?
              </h2>
              <p>
                We do not sell, rent, or trade your personal information. We share personal data solely with trusted infrastructure service providers who act as data processors on our behalf:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl border border-border bg-bg-surface space-y-1.5">
                  <div className="font-bold text-text-primary">Supabase Inc.</div>
                  <div className="text-accent text-xs">Database, Authentication &amp; Edge Functions</div>
                  <p className="text-text-secondary leading-relaxed">
                    Hosts our PostgreSQL database, executes edge functions, and stores encrypted user profiles and qualification sessions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-bg-surface space-y-1.5">
                  <div className="font-bold text-text-primary">Google Cloud (Vertex AI / Gemini)</div>
                  <div className="text-accent text-xs">AI Inference &amp; Container Hosting</div>
                  <p className="text-text-secondary leading-relaxed">
                    Provides Cloud Run container hosting for web app delivery and Gemini AI inference APIs for revenue analysis.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-bg-surface space-y-1.5">
                  <div className="font-bold text-text-primary">EmailJS</div>
                  <div className="text-accent text-xs">Contact Form Routing</div>
                  <p className="text-text-secondary leading-relaxed">
                    Transmits inquiry messages submitted through our Contact page directly to our founder inbox.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-bg-surface space-y-1.5">
                  <div className="font-bold text-text-primary">Legal &amp; Regulatory Authorities</div>
                  <div className="text-accent text-xs">Statutory Compliance</div>
                  <p className="text-text-secondary leading-relaxed">
                    Where strictly required by applicable subpoena, court order, or mandatory statutory law.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 8 */}
            <section id="international-transfers" aria-labelledby="transfers-heading" className="space-y-4">
              <h2 id="transfers-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                8. International Transfers of Personal Data
              </h2>
              <p>
                RevOS platform infrastructure (including our Google Cloud Run containers and Supabase cloud database instance) is primarily hosted within data centers located in the <strong>United States</strong> (e.g. <code>us-east1</code>).
              </p>
              <p>
                If you access RevOS from the European Economic Area (EEA), United Kingdom, or Switzerland, your personal data will be transferred to and processed in the United States. Where required by GDPR Chapter V, we rely on statutory transfer mechanisms including:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>European Commission Standard Contractual Clauses (SCCs):</strong> Implemented within our cloud vendor service agreements.</li>
                <li><strong>EU-U.S. Data Privacy Framework (DPF):</strong> Where our enterprise cloud sub-processors (Google Cloud, Supabase) maintain active self-certification under the DPF.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 9 */}
            <section id="data-retention" aria-labelledby="retention-heading" className="space-y-4">
              <h2 id="retention-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                9. How Long We Retain Your Personal Data
              </h2>
              <p>
                We do not retain personal information longer than necessary to fulfill the operational purposes for which it was collected:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                <li><strong>Account &amp; Workspace Data:</strong> Retained for the duration of your active RevOS account. If you request account closure or termination, data is scheduled for deletion subject to necessary legal audit retention.</li>
                <li><strong>Cookie Consent Choices:</strong> Consent preferences are persisted in browser <code>localStorage</code> for exactly <strong>365 days</strong> (12 months), after which you are prompted to confirm your choices.</li>
                <li><strong>Temporary Case Study Tokens:</strong> Stored in <code>sessionStorage</code> and automatically cleared when you close your browser tab.</li>
                <li><strong>Inquiry Messages:</strong> Retained for a reasonable commercial period to address your inquiry and maintain business communications records.</li>
              </ul>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 10 */}
            <section id="data-security" aria-labelledby="security-heading" className="space-y-4">
              <h2 id="security-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                10. Technical and Organizational Security Measures
              </h2>
              <p>
                We employ robust, industry-standard technical and organizational security measures to protect your personal data against unauthorized access, destruction, loss, or alteration:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
                <li><strong>Row Level Security (RLS):</strong> Enforced at the PostgreSQL database layer in Supabase, preventing users from accessing or modifying records belonging to other tenants.</li>
                <li><strong>Encryption in Transit:</strong> All HTTP interactions across the RevOS domain are enforced via Transport Layer Security (TLS 1.2+ / HTTPS).</li>
                <li><strong>Strict Secret Isolation:</strong> Service-role database keys and Gemini AI API keys are stored exclusively in server-side environment variables and are never transmitted to browser clients.</li>
                <li><strong>Role-Based Access Control (RBAC):</strong> Strict hierarchy (Guest, Free User, Paid User, Enterprise User, Workspace Admin, RevOS Admin, Super Admin) governing platform administrative permissions.</li>
              </ul>
              <p className="text-xs text-text-secondary italic">
                While we implement rigorous security controls, no internet transmission or electronic storage method is 100% immune from security vulnerabilities. We encourage users to maintain unique, secure passwords.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 11 */}
            <section id="user-rights" aria-labelledby="rights-heading" className="space-y-4">
              <h2 id="rights-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                11. Your Data Protection Rights
              </h2>
              <p>
                Under applicable privacy regulations (including the GDPR, UK GDPR, and relevant regional privacy laws), you are entitled to exercise the following data protection rights:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Access</strong>
                  Request confirmation and a copy of the personal data we hold about you.
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Rectification</strong>
                  Request correction of inaccurate or incomplete personal records.
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Erasure ("Right to be Forgotten")</strong>
                  Request deletion of your account and personal records where statutory grounds apply.
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Restrict Processing</strong>
                  Request suspension of data processing under specific legal conditions.
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Data Portability</strong>
                  Receive your personal data in a structured, commonly used, machine-readable format.
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-bg-surface">
                  <strong className="text-text-primary block mb-1">Right to Object</strong>
                  Object to data processing conducted on the basis of our legitimate interests.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-bg-surface text-xs sm:text-sm space-y-2 mt-4">
                <strong className="text-text-primary">How to Exercise Your Rights:</strong>
                <p>
                  To exercise any of your statutory rights, please submit an inquiry via our <Link to="/about/contact" className="text-accent hover:underline">Contact Page</Link> or email our founder directly at <a href="mailto:paul.zy.wang@hotmail.com" className="text-accent hover:underline">paul.zy.wang@hotmail.com</a>. We will respond without undue delay and within thirty (30) days in accordance with statutory requirements.
                </p>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 12 */}
            <section id="cookies-storage" aria-labelledby="cookies-heading" className="space-y-4">
              <h2 id="cookies-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                12. Cookies and Similar Technologies
              </h2>
              <p>
                RevOS uses cookies and local browser storage (such as <code>localStorage</code> and <code>sessionStorage</code>) for security authentication tokens, user theme preferences, and privacy consent records.
              </p>
              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-3 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-base">Cookie Management &amp; Detailed Inventory</h3>
                    <p className="text-text-secondary text-xs">
                      For a complete inventory of verified storage keys, durations, and categories, review our dedicated policy.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Link
                      to="/cookie-policy"
                      className="px-4 py-2 rounded-xl border border-border hover:border-accent/40 bg-bg-primary text-text-primary text-xs font-semibold"
                    >
                      View Cookie Policy
                    </Link>
                    <button
                      type="button"
                      onClick={openPreferences}
                      className="px-4 py-2 rounded-xl bg-accent text-black text-xs font-bold shadow-sm"
                    >
                      Cookie Settings
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 13 */}
            <section id="automated-decisions" aria-labelledby="automated-heading" className="space-y-4">
              <h2 id="automated-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                13. AI-Assisted Analysis and Decision-Making
              </h2>
              <p>
                RevOS produces AI-driven qualification scores, opportunity win-probability estimates, and strategic gap analyses. These analytical outputs are designed exclusively as <strong>human-in-the-loop decision support tools</strong> for revenue executives, managers, and sales representatives.
              </p>
              <p>
                RevOS <strong>does not make automated decisions that produce legal effects or similarly significant effects concerning individuals</strong> under GDPR Article 22. All deal qualification evaluations, pricing choices, hiring priorities, and commercial sales actions remain under human review and discretion.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 14 */}
            <section id="third-party-links" aria-labelledby="links-heading" className="space-y-4">
              <h2 id="links-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                14. Third-Party Services and External Websites
              </h2>
              <p>
                Our platform and research publications may contain links to external third-party websites (such as LinkedIn professional profiles, partner organizations, or external reference sources). RevOS does not control and is not responsible for the privacy practices, content, or policies of external third-party sites. We encourage you to review their respective privacy notices.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 15 */}
            <section id="policy-updates" aria-labelledby="updates-heading" className="space-y-4">
              <h2 id="updates-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                15. Updates to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect operational modifications, feature expansions, or regulatory revisions. When updates are published, the revised date at the top of this policy will be updated. In the event of material changes affecting user privacy rights or data processing purposes, we will provide appropriate notice via our website.
              </p>
            </section>

            <hr className="border-border/60" />

            {/* SECTION 16 */}
            <section id="contact-us" aria-labelledby="contact-heading" className="space-y-4">
              <h2 id="contact-heading" className="text-2xl font-bold tracking-tight text-text-primary">
                16. Contact Us and Supervisory Authority Complaints
              </h2>
              <p>
                If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, please contact us:
              </p>

              <div className="p-5 rounded-2xl border border-border bg-bg-surface space-y-2 text-xs sm:text-sm">
                <div><strong>Organization:</strong> Apprevos Technology (RevOS)</div>
                <div><strong>Email:</strong> <a href="mailto:paul.zy.wang@hotmail.com" className="text-accent hover:underline">paul.zy.wang@hotmail.com</a></div>
                <div><strong>Contact Portal:</strong> <Link to="/about/contact" className="text-accent hover:underline">/about/contact</Link></div>
              </div>

              <div className="pt-2 text-xs sm:text-sm text-text-secondary">
                <strong className="text-text-primary block mb-1">Right to Lodge a Complaint:</strong>
                If you are a resident of the European Economic Area (EEA) or UK and believe that our data processing infringes your rights under the GDPR, you have the statutory right to lodge a complaint with your local Data Protection Authority (e.g. the CNIL in France, the DPC in Ireland, the BfDI in Germany, or the ICO in the United Kingdom).
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
