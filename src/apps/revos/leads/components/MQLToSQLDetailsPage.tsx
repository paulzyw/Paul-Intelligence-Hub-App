import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MQLLead, MQLCampaign, MQLQualificationResult } from '../../types/mql';
import { SQLDataService } from '../services/sqlDataService';
import { PromotionDataService } from '../services/promotionDataService';
import { SQLOpportunity } from '../../types/sql';
import { MQLDataService } from '../services/mqlDataService';
import { 
  ArrowLeft, BadgeCheck, ShieldAlert, FileText, User, 
  Layers, BarChart3, ChevronRight, Activity, Zap, 
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Building2,
  Calendar, Check, Landmark, Award, X
} from 'lucide-react';
import { SQLDynamicEvidenceForm, ensureUICompatibleResult } from './SQL_DynamicEvidenceForm';
import { SQLQualificationResult, SQLQualificationResultData } from './SQL_QualificationResult';
import UREKB_Config from '../../../../config/SQL_evidence_knowledge_base.json';

interface MQLToSQLDetailsPageProps {
  lead: MQLLead;
  campaign: MQLCampaign | null;
  qualResult: MQLQualificationResult | null;
  onBack: () => void;
  onPromoteSuccess: () => void;
}

export const MQLToSQLDetailsPage: React.FC<MQLToSQLDetailsPageProps> = ({
  lead,
  campaign,
  qualResult,
  onBack,
  onPromoteSuccess
}) => {
  // MQL to SQL Data Inheritance Framework Package Construction
  const inheritanceContext = {
    mql_summary: {
      qualification_status: qualResult?.qualification_status || "Qualified MQL",
      qualification_score: qualResult?.qualification_score || 85,
      confidence_score: qualResult?.confidence_score || 90,
      evaluated_at: qualResult?.evaluated_at || lead.updated_at || new Date().toISOString(),
      handover_summary: qualResult?.reasoning?.summary || "Highly qualified marketing lead displaying consistent high-intent signals and perfect demographic ICP alignment."
    },
    lead_profile: {
      lead_id: lead.id,
      contact_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Valued Prospect',
      job_title: lead.job_title || "Director of Cloud Strategy",
      department: lead.department || "Operations / Information Technology",
      contact_role: lead.job_title || "Primary Decision Contributor",
      campaign_assignment: campaign?.name || "Global Enterprise AI Cloud Outreach Campaign"
    },
    company_context: {
      company_name: lead.company_name || "Enterprise Prospect Corp",
      employee_size: lead.employee_size || "1,000 - 5,000",
      annual_revenue: lead.annual_revenue || "$100M - $250M",
      location: lead.location || "North America (HQ)",
      business_segment: lead.lead_industry || "Enterprise Cloud Software"
    },
    engagement_intelligence: {
      engagement_events: [
        { event: "Standard Demo Inquiry Form Submission", date: "2 days ago" },
        { event: "Technical Architecture Whitepaper Downloaded", date: "5 days ago" },
        { event: "High-value Webinar Session Attendance", date: "1 week ago" },
        { event: "Enterprise Product Pricing Sheet View", date: "1 week ago" }
      ],
      content_interactions: [
        "Cloud Migration Strategy & Best Practices Guide v4",
        "ROI Financial Calculator Spreadsheet Tool",
        "Security & Compliance Standards Matrix"
      ],
      campaign_history: [
        campaign?.name || "Enterprise Strategic Inbound"
      ],
      engagement_score: qualResult?.dimension_scores?.engagement || 82
    },
    marketing_evidence: {
      mql_reason: qualResult?.reasoning?.summary || "Multiple high-intent actions verified alongside executive-level role match.",
      fit_signals: qualResult?.supporting_evidence?.filter(e => e.toLowerCase().includes('fit')) || [
        "Organization demographics perfectly match core Tier-1 ICP parameters",
        "Role level contains buying power and executive operational influence",
        "Target industry is explicitly supported by existing case studies"
      ],
      intent_signals: qualResult?.supporting_evidence?.filter(e => e.toLowerCase().includes('intent')) || [
        "Pricing calculator was interacted with for custom multi-region setups",
        "Direct contact form submitted requesting technical account specialist"
      ],
      engagement_signals: qualResult?.supporting_evidence?.filter(e => e.toLowerCase().includes('engagement')) || [
        "Email newsletter click-through rate exceeds standard baseline by 3.5x",
        "Regular repeat sessions recorded over a 14-day tracking window"
      ],
      timing_signals: qualResult?.supporting_evidence?.filter(e => e.toLowerCase().includes('timing')) || [
        "Active digital budget deployment aligns with current standard Q3/Q4 cycle"
      ]
    },
    customer_intent_intelligence: {
      identified_interest: "Automating cloud operations workflows and resolving cross-region resource latency.",
      business_topic: "Operations Streamlining & Enterprise Automation",
      customer_goal: "Decrease system deployment times by 40% and establish automated configuration audit trails.",
      trigger_event: "Recent standard audits highlighted compliance bottlenecking in manually configured regions."
    },
    mql_risk_information: {
      missing_information: qualResult?.missing_evidence || [
        "Direct mobile contact number not verified",
        "Exact fiscal budget limits not explicitly shared during handover"
      ],
      low_confidence_signals: [
        "Self-reported organization annual revenue has not been verified via external financial feeds",
        "Inbound connection origin displays multiple alternative location hops"
      ],
      qualification_concerns: [
        "Lead is currently Director level; must secure Executive Vice President buy-in during early sales stages"
      ]
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'static' | 'intel' | 'evidence' | 'risks'>('summary');
  const [promoting, setPromoting] = useState(false);
  const [promotionSuccess, setPromotionSuccess] = useState(false);
  const [existingOpp, setExistingOpp] = useState<SQLOpportunity | null>(null);

  const [formCompanyName, setFormCompanyName] = useState(inheritanceContext.company_context.company_name);
  const [formOpportunityName, setFormOpportunityName] = useState(`${inheritanceContext.company_context.company_name} - ${inheritanceContext.customer_intent_intelligence.business_topic}`);
  const [formOpportunityOwner, setFormOpportunityOwner] = useState('');
  const [formIndustry, setFormIndustry] = useState(campaign?.industry || "");
  const [formRevenueMotion, setFormRevenueMotion] = useState(campaign?.revenue_motion || "Digital Solution Selling");
  const [formOpportunityStage, setFormOpportunityStage] = useState('Emerging Opportunity');
  const [formEstimatedRevenue, setFormEstimatedRevenue] = useState('$100,000');
  const [formPipelineStage, setFormPipelineStage] = useState('Qualification');
  const [formExpectedCloseDate, setFormExpectedCloseDate] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<SQLQualificationResultData | null>(null);

  useEffect(() => {
    const loadExistingOpportunity = async () => {
      try {
        const opp = await SQLDataService.getOpportunityByMqlId(lead.id);
        if (opp) {
          setExistingOpp(opp);
          setFormCompanyName(opp.company_name || '');
          setFormOpportunityName(opp.opportunity_name || '');
          setFormIndustry(campaign?.industry || opp.industry || '');
          setFormRevenueMotion(campaign?.revenue_motion || opp.revenue_motion || '');
          if (opp.description) {
            try {
              const desc = JSON.parse(opp.description);
              setFormOpportunityOwner(desc.opportunity_owner || '');
              setFormOpportunityStage(desc.opportunity_stage || '');
              setFormEstimatedRevenue(desc.estimated_revenue || '');
              setFormPipelineStage(desc.pipeline_stage || '');
              setFormExpectedCloseDate(desc.expected_close_date || '');
            } catch (e) {
              // Not JSON description
            }
          }
          // Check if there's an existing draft/assessment and auto-expand
          const assessment = await SQLDataService.getAssessmentByOpportunity(opp.id);
          if (assessment) {
            setShowEvidenceForm(true);
          }
          // Check for saved qualification result
          const savedResult = await SQLDataService.getSavedQualificationResult(opp.id);
          if (savedResult) {
            const motion = campaign?.revenue_motion || opp.revenue_motion || 'Digital Solution Selling';
            const library = UREKB_Config.UREKB_SQL.revenue_motion_library;
            const motionData = library[motion as keyof typeof library];
            const uiResult = ensureUICompatibleResult(savedResult, motionData);
            setQualificationResult(uiResult);
          }
        }
      } catch (err) {
        console.error("Failed to load existing opp:", err);
      }
    };
    loadExistingOpportunity();
  }, [lead.id, campaign]);

  const scrollToForm = () => {
    const el = document.getElementById('opportunity-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveOpportunity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formCompanyName.trim() || !formOpportunityName.trim() || !formOpportunityOwner.trim()) {
      setSaveError("Please fill out all required fields (Company Name, Opportunity Name, and Opportunity Owner).");
      scrollToForm();
      return;
    }
    setSaveError(null);
    setSaveSuccessMessage(null);
    setPromoting(true);

    try {
      const descriptionText = `Inherited MQL Prospect Lead Profile: ${inheritanceContext.lead_profile.contact_name} (${inheritanceContext.lead_profile.job_title}). Customer Objective: ${inheritanceContext.customer_intent_intelligence.customer_goal}`;
      const serializedDescription = JSON.stringify({
        description: descriptionText,
        opportunity_owner: formOpportunityOwner,
        opportunity_stage: formOpportunityStage,
        estimated_revenue: formEstimatedRevenue,
        pipeline_stage: formPipelineStage,
        expected_close_date: formExpectedCloseDate
      });

      if (existingOpp) {
        // Update existing opportunity
        const updatedOpp = await SQLDataService.updateOpportunity(existingOpp.id, {
          company_name: formCompanyName,
          opportunity_name: formOpportunityName,
          industry: formIndustry,
          revenue_motion: formRevenueMotion,
          description: serializedDescription,
        });
        setExistingOpp(updatedOpp);
      } else {
        // Create new opportunity
        const newOpp = await SQLDataService.createOpportunity({
          company_name: formCompanyName,
          opportunity_name: formOpportunityName,
          industry: formIndustry,
          revenue_motion: formRevenueMotion,
          description: serializedDescription,
          source: 'MQL Handover',
          mql_reference_id: lead.id
        });
        setExistingOpp(newOpp);
      }

      setSaveSuccessMessage("Opportunity details saved successfully!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Saving opportunity failed:", err);
      setSaveError("Error saving Opportunity information. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  const handlePromoteToSQL = async () => {
    if (!existingOpp) {
      setSaveError("Please save the opportunity details first before promoting.");
      scrollToForm();
      return;
    }
    setPromoting(true);
    try {
      // Keep MQL lead status unchanged in mql_leads table
      setPromotionSuccess(true);
      setTimeout(() => {
        onPromoteSuccess();
      }, 1500);
    } catch (err) {
      console.error("Promotion failed:", err);
      setSaveError("Error promoting to SQL. Please try again.");
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-40 duration-200">
      
      {/* HEADER NAVIGATION */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div className="w-full pr-10 md:pr-0">
          <button 
            onClick={onBack} 
            className="text-xs font-mono text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Lead Canvas
          </button>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">MQL Handover Detail</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
              Sales Handover Phase
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Analyzing validated marketing intelligence handover package for <span className="font-bold text-text-primary">{inheritanceContext.lead_profile.contact_name}</span> at <span className="font-bold text-text-primary">{inheritanceContext.company_context.company_name}</span>
          </p>
        </div>
        <button
          onClick={onBack}
          className="absolute top-5 right-5 md:static p-2.5 rounded-xl border border-border bg-bg-primary/50 text-text-secondary hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
          title="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* CLASSIFIED CATEGORY SUB-TABS */}
      <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none gap-1 bg-bg-surface/30 p-1.5 rounded-xl border border-border">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'summary'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Handover Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('static')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'static'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Static Context (Cat A)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('intel')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'intel'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Marketing Intel (Cat B)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('evidence')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'evidence'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>Qual Evidence (Cat C)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risks')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
            activeSubTab === 'risks'
              ? 'bg-accent/15 text-accent border border-accent/20'
              : 'text-text-secondary hover:text-text-primary border border-transparent'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Handover Risks (Cat D)</span>
        </button>
      </div>

      {/* DETAIL CONTEXT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE INFO DISPLAY */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: OVERVIEW SUMMARY */}
          {activeSubTab === 'summary' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-6"
            >
              {/* Handover Statement */}
              <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">Handover Narrative Summary</h3>
                </div>
                <p className="text-xs text-text-primary font-medium leading-relaxed font-sans">
                  "{inheritanceContext.mql_summary.handover_summary}"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono text-text-secondary uppercase">MQL Intent Target</span>
                    <span className="text-xs text-text-primary font-bold block mt-1">{inheritanceContext.customer_intent_intelligence.identified_interest}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-bg-primary/50 border border-border">
                    <span className="text-[10px] font-mono text-text-secondary uppercase">Expected Business Goal</span>
                    <span className="text-xs text-text-primary font-bold block mt-1">{inheritanceContext.customer_intent_intelligence.customer_goal}</span>
                  </div>
                </div>
              </div>

              {/* Data Evolution Model Info card */}
              <div className="p-5 rounded-2xl bg-accent/[0.02] border border-accent/15 space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">RevOS Data Evolution Journey</h3>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 text-center">
                  <div className="flex-1 p-3 bg-bg-surface border border-border rounded-xl">
                    <span className="text-[9px] font-mono font-bold text-text-secondary uppercase">1. Marketing Signal</span>
                    <p className="text-[11px] text-text-primary font-bold mt-1">Acquired Resource Downloads</p>
                  </div>
                  <div className="flex items-center justify-center text-text-secondary/50 font-mono text-xs hidden sm:block">➜</div>
                  <div className="flex-1 p-3 bg-accent/5 border border-accent/20 rounded-xl">
                    <span className="text-[9px] font-mono font-bold text-accent uppercase">2. Handover Interest</span>
                    <p className="text-[11px] text-text-primary font-black mt-1">Confirmed ICP Solution Intent</p>
                  </div>
                  <div className="flex items-center justify-center text-text-secondary/50 font-mono text-xs hidden sm:block">➜</div>
                  <div className="flex-1 p-3 bg-bg-surface border border-border/50 rounded-xl opacity-60">
                    <span className="text-[9px] font-mono font-bold text-text-secondary uppercase">3. Validated Need</span>
                    <p className="text-[11px] text-text-secondary mt-1">Sales Confirmed Business Case</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: STATIC CONTEXT (CATEGORY A) */}
          {activeSubTab === 'static' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-5 rounded-2xl bg-bg-surface border border-border space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Building2 className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">Category A — Static Demographics</h3>
              </div>

              {/* Lead Profile */}
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block mb-2">Lead Contact Profile</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Contact Name</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.lead_profile.contact_name}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Job Title</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.lead_profile.job_title}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Department</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.lead_profile.department}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Campaign Assignment</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.lead_profile.campaign_assignment}</span>
                  </div>
                </div>
              </div>

              {/* Company Context */}
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block mb-2">Company Context</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Company Name</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.company_context.company_name}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Employee Size</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.company_context.employee_size}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Annual Revenue</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.company_context.annual_revenue}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Location</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.company_context.location}</span>
                  </div>
                  <div className="p-3 bg-bg-primary/50 border border-border rounded-xl sm:col-span-2">
                    <span className="text-[9px] font-mono text-text-secondary uppercase block">Business Segment</span>
                    <span className="text-xs text-text-primary font-bold block mt-0.5">{inheritanceContext.company_context.business_segment}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: MARKETING INTELLIGENCE (CATEGORY B) */}
          {activeSubTab === 'intel' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-5 rounded-2xl bg-bg-surface border border-border space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Zap className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">Category B — Marketing Intelligence &amp; Engagement</h3>
              </div>

              {/* Engagement Score */}
              <div className="p-4 bg-accent/[0.02] border border-accent/15 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono text-text-secondary uppercase block">Marketing Engagement Score</span>
                  <p className="text-xs text-text-secondary mt-0.5">Calculated based on sequence event completeness and frequency.</p>
                </div>
                <div className="px-3.5 py-1.5 bg-accent/10 border border-accent/25 text-accent font-mono font-black rounded-lg text-sm">
                  {inheritanceContext.engagement_intelligence.engagement_score} / 100
                </div>
              </div>

              {/* Content Interactions */}
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase block mb-2.5">Key Marketing Resource Interactions</span>
                <ul className="space-y-2">
                  {inheritanceContext.engagement_intelligence.content_interactions.map((content, idx) => (
                    <li key={idx} className="flex items-center gap-2 p-2.5 bg-bg-primary/40 border border-border/60 rounded-xl text-xs font-medium text-text-primary">
                      <FileText className="h-4 w-4 text-text-secondary/60" />
                      <span>{content}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Engagement Timeline */}
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase block mb-2.5">Marketing Touchpoint History</span>
                <div className="space-y-2">
                  {inheritanceContext.engagement_intelligence.engagement_events.map((event, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-bg-primary/40 border border-border/60 rounded-xl text-xs font-medium text-text-primary">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                      <span>{event.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: QUALIFICATION EVIDENCE (CATEGORY C) */}
          {activeSubTab === 'evidence' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-5 rounded-2xl bg-bg-surface border border-border space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <BadgeCheck className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">Category C — Validated Marketing Evidence</h3>
              </div>

              {/* Fit Signals */}
              <div>
                <span className="text-[10px] font-black uppercase text-green-500 tracking-wider block mb-2.5">ICP &amp; Demographic Fit Evidence</span>
                <ul className="space-y-2">
                  {inheritanceContext.marketing_evidence.fit_signals.map((sig, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 bg-green-500/[0.02] border border-green-500/15 rounded-xl text-xs">
                      <span className="text-green-500 mt-0.5 font-bold">•</span>
                      <span className="text-text-primary font-medium">{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Intent Signals */}
              <div>
                <span className="text-[10px] font-black uppercase text-accent tracking-wider block mb-2.5">Observed Behavioral Intent Evidence</span>
                <ul className="space-y-2">
                  {inheritanceContext.marketing_evidence.intent_signals.map((sig, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 bg-accent/[0.02] border border-accent/15 rounded-xl text-xs">
                      <span className="text-accent mt-0.5 font-bold">•</span>
                      <span className="text-text-primary font-medium">{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timing & Budget Signals */}
              <div>
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider block mb-2.5">Procurement Timing Indicators</span>
                <ul className="space-y-2">
                  {inheritanceContext.marketing_evidence.timing_signals.map((sig, i) => (
                    <li key={i} className="flex items-start gap-2 p-2.5 bg-blue-500/[0.02] border border-blue-500/15 rounded-xl text-xs">
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      <span className="text-text-primary font-medium">{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* TAB 5: RISKS & HANDOVER CONCERNS (CATEGORY D) */}
          {activeSubTab === 'risks' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="p-5 rounded-2xl bg-bg-surface border border-border space-y-6"
            >
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <h3 className="text-xs font-black uppercase text-text-primary tracking-wide">Category D — Existing Risks &amp; Concerns</h3>
              </div>

              <div className="p-4 bg-red-500/[0.02] border border-red-500/15 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-red-500 uppercase font-black block">Sales Alert</span>
                <p className="text-xs text-text-secondary leading-normal">
                  The following factors are logged by marketing as known gaps. High-priority action should be scheduled by sales to probe these areas.
                </p>
              </div>

              {/* Missing Information */}
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block mb-2.5">Missing Handover Information</span>
                <ul className="space-y-2">
                  {inheritanceContext.mql_risk_information.missing_information.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2.5 bg-amber-500/[0.02] border border-amber-500/15 rounded-xl text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-text-primary font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Low Confidence Signals */}
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider block mb-2.5">Low Confidence Indicators</span>
                <ul className="space-y-2">
                  {inheritanceContext.mql_risk_information.low_confidence_signals.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 p-2.5 bg-red-500/[0.02] border border-red-500/15 rounded-xl text-xs">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-text-primary font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Qualification Concerns */}
              <div>
                <span className="text-[10px] font-black uppercase text-text-secondary tracking-wider block mb-2.5">Strategic Engagement Concerns</span>
                <ul className="space-y-2">
                  {inheritanceContext.mql_risk_information.qualification_concerns.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-2.5 bg-bg-primary/60 border border-border rounded-xl text-xs">
                      <span className="text-text-secondary font-black">•</span>
                      <span className="text-text-secondary font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

        </div>

        {/* RIGHT COLUMN: CORE SUMMARY STATS */}
        <div className="space-y-6">
          
          {/* MQL Summary card */}
          <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
            <span className="text-[10px] font-mono text-text-secondary uppercase block border-b border-border/60 pb-2">Handover Core Stats</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-primary/50 border border-border rounded-xl text-center">
                <span className="text-[9px] font-mono text-text-secondary uppercase block">MQL Score</span>
                <span className="text-xl font-mono font-black text-accent mt-1 block">
                  {inheritanceContext.mql_summary.qualification_score}
                </span>
              </div>
              <div className="p-3 bg-bg-primary/50 border border-border rounded-xl text-center">
                <span className="text-[9px] font-mono text-text-secondary uppercase block">Confidence</span>
                <span className="text-xl font-mono font-black text-accent mt-1 block">
                  {inheritanceContext.mql_summary.confidence_score}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-bg-primary/30 border border-border/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-text-secondary">
                <span>Phase</span>
                <span className="font-bold text-text-primary">MQL → SQL Handover</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Evaluated</span>
                <span className="font-bold text-text-primary font-mono text-[11px]">
                  {new Date(inheritanceContext.mql_summary.evaluated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Method</span>
                <span className="font-bold text-text-primary">AI Agent Evaluated</span>
              </div>
            </div>
          </div>

          {/* GTM Motion Detail */}
          <div className="p-5 rounded-2xl bg-bg-surface border border-border space-y-4">
            <span className="text-[10px] font-mono text-text-secondary uppercase block border-b border-border/60 pb-2">GTM Motion Alignment</span>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[9px] font-mono text-text-secondary uppercase block">Revenue Motion Class</span>
                <span className="text-text-primary font-black block mt-0.5">Digital Solution Selling</span>
              </div>
              <div className="pt-2 border-t border-border/50">
                <span className="text-[9px] font-mono text-text-secondary uppercase block">Segment Strategy</span>
                <span className="text-text-primary font-medium block mt-0.5">High-touch Enterprise software sales, requiring stakeholder-deep mapping &amp; pain point correlation.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* OPPORTUNITY FORM PANEL */}
      <div id="opportunity-form-section" className="p-6 md:p-8 rounded-2xl bg-bg-surface border border-border space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
        <div className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-accent" />
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Opportunity Form</h3>
            <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
              SQL Initialization
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Configure the parameters for the new Sales-Qualified Opportunity. Industry and Revenue Motion are automatically inherited from the MQL Handover context.
          </p>
        </div>

        <form onSubmit={handleSaveOpportunity} className="space-y-6">
          {saveError && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccessMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-xl text-green-500 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left/Middle Column group for editable inputs */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                  Company Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                  className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-text-primary font-sans transition-all placeholder-text-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                  Opportunity Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOpportunityName}
                  onChange={(e) => setFormOpportunityName(e.target.value)}
                  placeholder="Enter Opportunity Name"
                  className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-text-primary font-sans transition-all placeholder-text-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                  Opportunity Owner <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOpportunityOwner}
                  onChange={(e) => setFormOpportunityOwner(e.target.value)}
                  placeholder="Enter Opportunity Owner Name (e.g. Jane Doe)"
                  className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-text-primary font-sans transition-all placeholder-text-secondary/30"
                />
              </div>

              {/* Dynamic Opportunity Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                    Opportunity Stage
                  </label>
                  <select
                    value={formOpportunityStage}
                    onChange={(e) => setFormOpportunityStage(e.target.value)}
                    className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-text-primary font-sans cursor-pointer transition-all"
                  >
                    <option value="Emerging Opportunity">Emerging Opportunity</option>
                    <option value="Defined Opportunity">Defined Opportunity</option>
                    <option value="Validated Opportunity">Validated Opportunity</option>
                    <option value="Active Buying Opportunity">Active Buying Opportunity</option>
                    <option value="Decision Opportunity">Decision Opportunity</option>
                    <option value="Contract Decision">Contract Decision</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                    Estimated Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary/60">$</span>
                    <input
                      type="text"
                      value={formEstimatedRevenue}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('$')) {
                          val = '$' + val;
                        }
                        setFormEstimatedRevenue(val);
                      }}
                      placeholder="e.g. $100,000"
                      className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl pl-8 pr-4 py-2.5 text-xs text-text-primary font-sans transition-all placeholder-text-secondary/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                    Pipeline Stage
                  </label>
                  <select
                    value={formPipelineStage}
                    onChange={(e) => setFormPipelineStage(e.target.value)}
                    className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-text-primary font-sans cursor-pointer transition-all"
                  >
                    <option value="Qualification">Qualification</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Solution Development">Solution Development</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Evaluation">Evaluation</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Commit">Commit</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formExpectedCloseDate}
                    onChange={(e) => setFormExpectedCloseDate(e.target.value)}
                    className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-4 py-2 text-xs text-text-primary font-sans transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Column group for read-only inherited fields */}
            <div className="space-y-4 bg-bg-primary/30 p-5 rounded-2xl border border-border/40 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-secondary uppercase block border-b border-border/40 pb-2 mb-4">
                  MQL Inherited Framework
                </span>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                        Industry
                      </label>
                      <span className="text-[8px] font-mono font-bold bg-green-500/10 border border-green-500/20 text-green-500 px-1.5 py-0.2 rounded">
                        Inherited
                      </span>
                    </div>
                    <div className="w-full bg-bg-primary/80 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-text-secondary font-sans flex items-center justify-between select-none">
                      <span>{formIndustry}</span>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary block">
                        Revenue Motion
                      </label>
                      <span className="text-[8px] font-mono font-bold bg-green-500/10 border border-green-500/20 text-green-500 px-1.5 py-0.2 rounded">
                        Inherited
                      </span>
                    </div>
                    <div className="w-full bg-bg-primary/80 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-text-secondary font-sans flex items-center justify-between select-none">
                      <span>{formRevenueMotion}</span>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-text-secondary/60 mt-4 leading-normal flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70 shrink-0 mt-0.5" />
                <span>Verified marketing parameters locked for sales-funnel data consistency.</span>
              </div>
            </div>
          </div>

          {/* Action buttons at the bottom of the form */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <button
              type="submit"
              disabled={promoting}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center gap-2"
            >
              {promoting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEvidenceForm(true);
                setTimeout(() => {
                  document.getElementById('sql-evidence-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-6 py-2.5 bg-bg-surface border border-border hover:bg-bg-primary text-text-primary font-black uppercase text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start SQL Qualification</span>
            </button>
          </div>
        </form>
      </div>

      {showEvidenceForm && (
        <div id="sql-evidence-form-section">
          <SQLDynamicEvidenceForm 
            industry={formIndustry}
            revenueMotion={formRevenueMotion}
            opportunityId={existingOpp?.id}
            onQualificationComplete={(data) => {
              setQualificationResult(data);
            }}
          />
        </div>
      )}

      {qualificationResult && (
        <div id="sql-qualification-result-section">
          <SQLQualificationResult 
            data={qualificationResult} 
            opportunityId={existingOpp?.id} 
            leadId={lead.id}
            onPromote={async () => {
              try {
                // First, check if there is an existing opportunity, if not, save it!
                let oppId = existingOpp?.id;
                if (!oppId) {
                  const descriptionText = `Inherited MQL Prospect Lead Profile: ${inheritanceContext.lead_profile.contact_name} (${inheritanceContext.lead_profile.job_title}). Customer Objective: ${inheritanceContext.customer_intent_intelligence.customer_goal}`;
                  const serializedDescription = JSON.stringify({
                    description: descriptionText,
                    opportunity_owner: formOpportunityOwner || 'Sales Rep',
                    opportunity_stage: formOpportunityStage,
                    estimated_revenue: formEstimatedRevenue,
                    pipeline_stage: formPipelineStage,
                    expected_close_date: formExpectedCloseDate
                  });
                  const newOpp = await SQLDataService.createOpportunity({
                    company_name: formCompanyName,
                    opportunity_name: formOpportunityName,
                    industry: formIndustry,
                    revenue_motion: formRevenueMotion,
                    description: serializedDescription,
                    source: 'MQL Handover',
                    mql_reference_id: lead.id
                  });
                  setExistingOpp(newOpp);
                  oppId = newOpp.id;
                }

                // Save qualification result to SQLOpportunity in the backend too if available
                if (oppId && qualificationResult) {
                  await SQLDataService.saveFullQualificationResult(oppId, qualificationResult);
                }

                // Add to promoted list table in Supabase
                await PromotionDataService.promoteLead(lead.id, oppId);

                return true;
              } catch (err) {
                console.error("Promotion failed:", err);
                return false;
              }
            }}
          />
        </div>
      )}

    </div>
  );
};
