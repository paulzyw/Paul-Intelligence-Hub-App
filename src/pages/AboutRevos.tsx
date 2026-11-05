import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Target, 
  CheckCircle2, 
  LineChart, 
  ShieldCheck, 
  Lightbulb, 
  Brain, 
  Layers, 
  Users, 
  Scale, 
  RefreshCw, 
  Compass, 
  FileText, 
  CheckSquare, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { RevosWorkflowChart } from '../components/RevosWorkflowChart';

export function AboutRevos() {
  // SEO & Structured Metadata
  useEffect(() => {
    document.title = 'About RevOS | Mission, Vision & AI-Native Revenue Operating System';

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Discover the RevOS mission, vision and philosophy. Learn how an AI-native Revenue Operating System combines structured methodologies and evidence-informed AI reasoning to support better revenue decisions.'
    );

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.origin + '/about/aboutRevos');

    // Schema.org WebApplication Structured Data
    const schemaScriptId = 'about-revos-schema';
    let scriptTag = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaScriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About RevOS',
      headline: 'A Better Way to Think About Revenue Growth',
      description: 'Discover the RevOS mission, vision, philosophy, platform, and principles for an AI-native Revenue Operating System.',
      publisher: {
        '@type': 'Organization',
        name: 'RevOS',
        url: window.location.origin
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'RevOS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'An AI-native Revenue Operating System combining structured revenue methodologies with evidence-informed AI reasoning.'
      }
    });

    return () => {
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col w-full bg-bg-primary text-text-primary min-h-screen">
      
      {/* ========================================================= */}
      {/* SECTION 1 — HERO: THE PURPOSE BEHIND RevOS */}
      {/* ========================================================= */}
      <section 
        id="hero" 
        className="relative w-full bg-bg-hero-primary text-text-hero-primary pt-24 pb-20 sm:pt-32 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-border/40 overflow-hidden"
      >
        {/* Subtle background structural grid */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-hero-primary via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6 sm:space-y-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-accent">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            ABOUT RevOS
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-hero-primary leading-tight sm:leading-[1.15]">
            A Better Way to Think About <br className="hidden sm:inline" />
            Revenue Growth.
          </h1>

          {/* Supporting statement */}
          <p className="text-sm sm:text-base md:text-lg text-text-hero-secondary max-w-4xl mx-auto leading-relaxed md:leading-normal">
            RevOS is an AI-native Revenue Operating System designed to bring structure, evidence-informed intelligence and actionable thinking into the way organizations approach revenue growth.
          </p>

          {/* Core statement highlight card */}
          <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl border border-accent/30 bg-bg-hero-surface/80 shadow-md backdrop-blur-sm">
            <p className="text-sm sm:text-base font-semibold text-text-hero-primary italic leading-relaxed">
              &ldquo;Revenue growth is not just about doing more. It is about making better decisions, using better evidence, and taking the right actions.&rdquo;
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/product/overview/revos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-accent text-white hover:brightness-110 shadow-md transition-all active:scale-[0.98]"
            >
              <span>Explore the RevOS Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('our-philosophy')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border border-text-hero-primary/20 text-text-hero-primary hover:border-accent hover:text-accent bg-white/5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Discover Our Philosophy</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2 — WHY RevOS EXISTS */}
      {/* ========================================================= */}
      <section id="why-revos-exists" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              WHY RevOS EXISTS
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Revenue Challenges Are Connected. Revenue Decisions Should Be Too.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Organizations invest in salespeople, technology, marketing activities and customer relationships. Yet revenue performance can remain difficult to improve when the decisions guiding these activities are fragmented, inconsistent or insufficiently supported by evidence.
            </p>
          </div>

          {/* Four Fundamental Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Challenge 1 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface hover:border-accent/60 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent">CHALLENGE 01</span>
                <Layers className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary">
                Fragmented Revenue Thinking
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Revenue strategy, lead qualification, opportunity management and sales execution are frequently treated as separate activities rather than connected parts of a revenue system.
              </p>
            </div>

            {/* Challenge 2 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface hover:border-accent/60 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent">CHALLENGE 02</span>
                <Scale className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary">
                Inconsistent Decision-Making
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Without structured methodologies, similar business situations may be assessed differently, making it difficult to establish consistent qualification and decision-making discipline.
              </p>
            </div>

            {/* Challenge 3 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface hover:border-accent/60 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent">CHALLENGE 03</span>
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary">
                Underutilized Evidence
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Organizations may possess substantial customer, market and opportunity information without systematically translating it into useful business insights.
              </p>
            </div>

            {/* Challenge 4 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface hover:border-accent/60 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent">CHALLENGE 04</span>
                <CheckSquare className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary">
                Disconnected Actions
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Identifying a problem is not enough. Revenue teams also need to understand what should happen next, why it matters and how actions can address identified risks and gaps.
              </p>
            </div>
          </div>

          {/* Closing statement */}
          <div className="p-6 rounded-2xl bg-bg-surface border-l-4 border-accent border-y border-r border-border">
            <p className="text-base sm:text-lg font-medium text-text-primary">
              The challenge is not simply to manage more revenue activities. It is to improve thinking, decisions and actions that drive them.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3 — OUR MISSION & VISION */}
      {/* ========================================================= */}
      <section id="mission-vision" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-bg-surface/40">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              OUR MISSION &amp; VISION
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Building a More Intelligent Approach to Revenue Growth.
            </h2>
          </div>

          {/* Connected Dual Concept Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* MISSION */}
            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md transition-all duration-300 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/10 text-accent text-xs font-mono font-bold uppercase tracking-wider">
                  MISSION
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">
                  To help organizations make better revenue decisions through structured methodologies, evidence-informed AI reasoning and actionable intelligence.
                </h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  RevOS aims to help revenue professionals and organizations approach complex revenue challenges more systematically. By combining structured frameworks with AI reasoning, RevOS supports the assessment of available evidence, identification of potential risks and gaps, and development of practical next steps.
                </p>
              </div>
              <div className="pt-4 border-t border-border/60 text-xs font-medium text-accent flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Systematic decision-making &amp; actionable clarity</span>
              </div>
            </div>

            {/* VISION */}
            <div className="p-8 sm:p-10 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md transition-all duration-300 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/10 text-accent text-xs font-mono font-bold uppercase tracking-wider">
                  VISION
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">
                  To advance a more intelligent, systematic and evidence-informed approach to revenue growth.
                </h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  We envision a future in which revenue decisions are not driven solely by intuition, fragmented information or disconnected activities, but are supported by structured thinking, contextual evidence and coordinated execution.
                </p>
              </div>
              <div className="pt-4 border-t border-border/60 text-xs font-medium text-accent flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Contextual evidence &amp; coordinated execution</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4 — OUR PHILOSOPHY */}
      {/* ========================================================= */}
      <section id="our-philosophy" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              OUR PHILOSOPHY
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Better Revenue Outcomes Begin With Better Thinking.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Revenue growth is a complex business process involving markets, customers, value propositions, buying decisions, competition, commercial considerations and execution. We believe better revenue decisions require a more structured way to understand and manage these interconnected dimensions.
            </p>
          </div>

          {/* Five Interconnected Philosophical Beliefs Progression */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5">
            {/* 1. Structure */}
            <div className="p-6 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-accent">01 / STRUCTURE</span>
                <h3 className="text-base font-bold text-text-primary">Structure Before Assumptions</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Complex revenue challenges should be approached through clear methodologies and structured thinking rather than disconnected activities or unsupported assumptions.
                </p>
              </div>
            </div>

            {/* 2. Evidence */}
            <div className="p-6 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-accent">02 / EVIDENCE</span>
                <h3 className="text-base font-bold text-text-primary">Evidence Before Conclusions</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Decisions should be informed by relevant information and available evidence. Data must be interpreted in context, and missing information should not be confused with facts.
                </p>
              </div>
            </div>

            {/* 3. Reasoning */}
            <div className="p-6 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-accent">03 / REASONING</span>
                <h3 className="text-base font-bold text-text-primary">Reasoning Before Recommendations</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  AI should do more than generate generic answers. It should support structured analysis, evaluate relevant context and explain the reasoning behind potential recommendations.
                </p>
              </div>
            </div>

            {/* 4. Action */}
            <div className="p-6 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-accent">04 / ACTION</span>
                <h3 className="text-base font-bold text-text-primary">Insight Into Action</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Analysis has practical value when it helps users determine what matters, identify priorities and decide what to do next.
                </p>
              </div>
            </div>

            {/* 5. Human Judgment */}
            <div className="p-6 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-accent">05 / JUDGMENT</span>
                <h3 className="text-base font-bold text-text-primary">Human Judgment Remains Essential</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  AI should strengthen human decision-making, not replace professional experience, accountability or business judgment.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy Summary Banner */}
          <div className="p-6 rounded-2xl border border-border bg-bg-surface text-center">
            <p className="text-base sm:text-lg font-semibold text-text-primary">
              Our philosophy is simple: structure the thinking, understand the evidence, assess the situation and focus on the actions that matter.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5 — THE RevOS PLATFORM */}
      {/* ========================================================= */}
      <section id="platform" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-bg-surface/30">
        <div className="max-w-6xl mx-auto space-y-14">
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              FROM PHILOSOPHY TO PLATFORM
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              An Operating System for More Intelligent Revenue Decisions.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              RevOS translates its philosophy into a practical AI-native operating system through specialized revenue engines. Rather than treating revenue challenges as isolated tasks, RevOS provides structured capabilities for examining go-to-market strategy, qualifying leads and assessing pipeline opportunities.
            </p>
          </div>

          {/* Three Specialized Engines */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Engine 1: GTMOS */}
            <div 
              className="p-8 rounded-2xl border border-[#051c2c]/15 shadow-lg space-y-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(to bottom right, var(--gtm-light), var(--gtm))'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#051c2c] text-[#C5D704] flex items-center justify-center font-bold font-mono shadow-xs text-sm">
                    GTM
                  </div>
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-[#051c2c]/75">Strategy &amp; Intelligence</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#051c2c] tracking-tight leading-snug">
                  GTMOS — Go-to-Market Strategy &amp; Intelligence
                </h3>
                <p className="text-sm text-[#051c2c]/90 leading-relaxed font-normal">
                  Help organizations develop and examine go-to-market strategies through structured strategic dimensions, evidence-informed analysis, scenario thinking and actionable recommendations.
                </p>
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[#051c2c] uppercase tracking-wider">Core Focus:</span>
                  <ul className="text-xs sm:text-sm text-[#051c2c]/90 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Market and segment understanding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Ideal Customer Profile and buyer personas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Value proposition and positioning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Messaging and revenue motion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Demand strategy and enablement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#051c2c] shrink-0 mt-1.5" />
                      <span>Revenue objectives, constraints and planning</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                to="/product/revos/gtmos"
                className="inline-flex items-center justify-between text-xs sm:text-sm font-bold text-[#051c2c] hover:text-black pt-4 border-t border-[#051c2c]/20 group transition-colors"
              >
                <span>Explore GTMOS Engine</span>
                <ChevronRight className="w-4 h-4 text-[#051c2c] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Engine 2: Lead Qualification */}
            <div 
              className="p-8 rounded-2xl border border-[#042B57]/15 shadow-lg space-y-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(to bottom right, var(--lead-light), var(--lead))'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#042B57] text-[#B2E1F5] flex items-center justify-center font-bold font-mono shadow-xs text-sm">
                    LQ
                  </div>
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-[#042B57]/80">Qualification Engine</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#042B57] tracking-tight leading-snug">
                  Lead Qualification Engine
                </h3>
                <p className="text-sm text-[#042B57]/90 leading-relaxed font-normal">
                  Help sales professionals evaluate lead qualification and readiness through structured dimensions and available evidence.
                </p>
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[#042B57] uppercase tracking-wider">Core Focus:</span>
                  <ul className="text-xs sm:text-sm text-[#042B57]/90 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>MQL, SQL, and Opportunity qualification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>Business problem and value understanding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>Stakeholder and buying-process alignment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>Decision criteria and commercial readiness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>Opportunity momentum and competitive position</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#042B57] shrink-0 mt-1.5" />
                      <span>Evidence verification and gap tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                to="/product/revos/leads"
                className="inline-flex items-center justify-between text-xs sm:text-sm font-bold text-[#042B57] hover:text-[#051c2c] pt-4 border-t border-[#042B57]/20 group transition-colors"
              >
                <span>Explore Lead Qualification</span>
                <ChevronRight className="w-4 h-4 text-[#042B57] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Engine 3: Pipeline Assessment */}
            <div 
              className="p-8 rounded-2xl border border-white/20 shadow-lg space-y-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(to bottom right, var(--pipeline-light), var(--pipeline))'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#042B57] text-white flex items-center justify-center font-bold font-mono shadow-xs text-sm">
                    PA
                  </div>
                  <span className="text-xs font-mono uppercase font-bold tracking-wider text-[#042B57]">Assessment &amp; Strategy</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#051c2c] tracking-tight leading-snug">
                  Pipeline Assessment Engine
                </h3>
                <p className="text-sm text-[#051c2c]/95 leading-relaxed font-normal">
                  Help sales professionals assess opportunity health, understand winability, identify deal risks and develop winning strategy recommendations.
                </p>
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[#F4F4F9] uppercase tracking-wider drop-shadow-xs">Core Focus:</span>
                  <ul className="text-xs sm:text-sm text-[#F4F4F9]/95 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Opportunity health &amp; winability analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Evidence and qualification gaps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Deal and delivery risk identification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Competitive positioning &amp; dynamics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Winning strategy generation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B2E1F5] shrink-0 mt-1.5 shadow-2xs" />
                      <span>Practical prioritized recommended actions</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                to="/product/revos/pipeline"
                className="inline-flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-[#B2E1F5] pt-4 border-t border-white/20 group transition-colors"
              >
                <span>Explore Pipeline Assessment</span>
                <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Shared Operating Philosophy Box */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface space-y-4">
            <h4 className="text-base sm:text-lg font-bold text-text-primary">
              The Shared Operating Architecture
            </h4>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Across these engines, RevOS unifies five essential capabilities: <strong>(1)</strong> Structured revenue methodologies, <strong>(2)</strong> Contextual evidence and information, <strong>(3)</strong> Evidence-informed AI reasoning, <strong>(4)</strong> Assessment and risk identification, and <strong>(5)</strong> Actionable recommendations. Individual workflows and assessment dimensions differ according to the specific purpose of each engine.
            </p>
          </div>

          {/* Platform Architecture SVG Visualization */}
          <div className="space-y-4">
            <RevosWorkflowChart />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 6 — OUR PRINCIPLES */}
      {/* ========================================================= */}
      <section id="our-principles" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              OUR PRINCIPLES
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              The Principles Behind Every RevOS Decision.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              The value of an AI-native operating system should not be measured only by the intelligence it generates, but also by the quality of the methodology, evidence and decisions behind it.
            </p>
          </div>

          {/* Six Refined Principle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Principle 1 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Methodology-Driven</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe structured methodologies provide a more consistent foundation for analyzing complex revenue challenges.
              </p>
            </div>

            {/* Principle 2 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Evidence-Informed</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe decisions should be grounded in relevant available information, with uncertainty and missing evidence recognized appropriately.
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Context-Aware Reasoning</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe useful AI reasoning must consider the specific business situation, not simply produce generic recommendations.
              </p>
            </div>

            {/* Principle 4 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Action-Oriented Intelligence</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe insights should help users identify priorities and determine practical next steps.
              </p>
            </div>

            {/* Principle 5 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Human-Led Decisions</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe AI should support and strengthen human judgment. People remain responsible for reviewing and making business decisions.
              </p>
            </div>

            {/* Principle 6 */}
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-bg-surface shadow-sm hover:shadow-md hover:border-accent/60 transition-all duration-300 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Continuous Improvement</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                We believe revenue methodologies, evidence and execution should evolve through learning, feedback and changing business conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7 — THE THINKING BEHIND RevOS */}
      {/* ========================================================= */}
      <section id="the-thinking-behind-revos" className="w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/80 bg-bg-surface/30">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-accent">
              A DIFFERENT WAY TO APPROACH REVENUE
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
              Beyond Managing Revenue Activities. Toward Improving Revenue Decisions.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Traditional revenue systems and processes often focus on managing information, recording activities and tracking progress. RevOS introduces a complementary approach: helping people think more systematically about revenue challenges, evaluate available evidence, assess situations and determine what actions can improve execution.
            </p>
          </div>

          {/* Balanced Two-Column Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Conventional Approach */}
            <div className="p-8 rounded-2xl border border-border bg-bg-surface space-y-6">
              <div className="space-y-2 pb-4 border-b border-border">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">SYSTEMS OF RECORD</span>
                <h3 className="text-xl font-bold text-text-primary">
                  Conventional Revenue Management Approach
                </h3>
              </div>
              <ul className="space-y-4 text-sm sm:text-base text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-secondary mt-2 shrink-0" />
                  <span>Information and activity management.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-secondary mt-2 shrink-0" />
                  <span>Disconnected revenue processes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-secondary mt-2 shrink-0" />
                  <span>Experience-driven or inconsistent assessments.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-secondary mt-2 shrink-0" />
                  <span>Limited connection between analysis and recommended actions.</span>
                </li>
              </ul>
            </div>

            {/* RevOS Approach */}
            <div className="p-8 rounded-2xl border-2 border-accent/60 bg-bg-surface shadow-md space-y-6">
              <div className="space-y-2 pb-4 border-b border-border">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">SYSTEMS OF REASONING &amp; ACTION</span>
                <h3 className="text-xl font-bold text-text-primary">
                  RevOS Operating Approach
                </h3>
              </div>
              <ul className="space-y-4 text-sm sm:text-base text-text-primary">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <span>Structured revenue methodologies.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <span>Connected revenue decision workflows.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <span>Evidence-informed AI reasoning.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <span>Multidimensional assessment and risk identification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <span>Actionable recommendations supporting human decisions.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Closing Positioning Statement */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border text-center max-w-4xl mx-auto">
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              RevOS is not designed to replace the systems organizations use to manage their customer relationships. It is designed to strengthen the intelligence and decision-making that guide revenue execution.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 8 — CLOSING: A BETTER WAY FORWARD */}
      {/* ========================================================= */}
      <section id="closing" className="w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-bg-hero-primary text-text-hero-primary border-t border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-hero-primary leading-tight">
            Structure Your Thinking. Strengthen Your Decisions. <br className="hidden sm:inline" />
            Move Revenue Forward.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-text-hero-secondary max-w-2xl mx-auto leading-relaxed">
            Revenue growth requires more than activity. It requires a clear understanding of the market, customers, opportunities and actions that matter. RevOS brings structured methodologies and evidence-informed AI reasoning together to help revenue professionals approach these challenges with greater clarity and discipline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/product/overview/revos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm bg-accent text-white hover:brightness-110 shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Explore RevOS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('platform')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm border border-text-hero-primary/20 text-text-hero-primary hover:border-accent hover:text-accent bg-white/5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Discover the RevOS Platform</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
