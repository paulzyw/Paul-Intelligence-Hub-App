import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  User,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Lock,
  Sparkles,
  Save,
  Database,
  Globe,
  Megaphone,
  Package
} from 'lucide-react';
import {
  PipelineOpportunity,
  PipelineOpportunityHandoverDetail,
  PipelineFormRecord
} from '../../types/pipeline';
import { PipelineDataService } from '../services/PipelineDataService';
import { STANDARD_COUNTRIES } from '../../leads/constants/countries';

export interface PipelineFormProps {
  opportunity: PipelineOpportunity;
  handoverDetail?: PipelineOpportunityHandoverDetail | null;
  onUpdate?: (updatedOpportunity: PipelineOpportunity, savedForm: PipelineFormRecord) => void;
  onStartAssessment?: () => void;
}

const OPPORTUNITY_STAGES = [
  'Emerging Opportunity',
  'Defined Opportunity',
  'Validated Opportunity',
  'Active Buying Opportunity',
  'Decision Opportunity',
  'Contract Decision'
];

const PIPELINE_STAGES = [
  'Qualification',
  'Discovery',
  'Solution Development',
  'Proposal',
  'Evaluation',
  'Negotiation',
  'Commit',
  'Closed Won',
  'Closed Lost'
];

const normalizeOpportunityStageValue = (raw?: string): string => {
  if (!raw) return 'Emerging Opportunity';
  const match = OPPORTUNITY_STAGES.find((s) => s.toLowerCase() === raw.trim().toLowerCase());
  if (match) return match;
  const low = raw.toLowerCase();
  if (low.includes('contract')) return 'Contract Decision';
  if (low.includes('decision')) return 'Decision Opportunity';
  if (low.includes('active')) return 'Active Buying Opportunity';
  if (low.includes('valid') || low.includes('qualif')) return 'Validated Opportunity';
  if (low.includes('defin') || low.includes('discover')) return 'Defined Opportunity';
  return 'Emerging Opportunity';
};

const normalizePipelineStageValue = (raw?: string, lifecycleStatus?: string): string => {
  if (lifecycleStatus === 'CLOSED_WON') return 'Closed Won';
  if (lifecycleStatus === 'CLOSED_LOST') return 'Closed Lost';
  if (!raw) return 'Qualification';
  const match = PIPELINE_STAGES.find((s) => s.toLowerCase() === raw.trim().toLowerCase());
  if (match) return match;
  const low = raw.toLowerCase();
  if (low.includes('won')) return 'Closed Won';
  if (low.includes('lost')) return 'Closed Lost';
  if (low.includes('commit')) return 'Commit';
  if (low.includes('negotiat')) return 'Negotiation';
  if (low.includes('evaluat')) return 'Evaluation';
  if (low.includes('propos')) return 'Proposal';
  if (low.includes('solution')) return 'Solution Development';
  if (low.includes('discover')) return 'Discovery';
  return 'Qualification';
};

export const PipelineForm: React.FC<PipelineFormProps> = ({
  opportunity,
  handoverDetail,
  onUpdate,
  onStartAssessment
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable Fields (Initial values inherited from Opportunity Qualification / SQL Qualification)
  const [companyName, setCompanyName] = useState(opportunity.customer_name || '');
  const [opportunityName, setOpportunityName] = useState(opportunity.opportunity_name || '');
  const [owner, setOwner] = useState(opportunity.opportunity_owner || 'Senior Enterprise AE');
  const [opportunityStage, setOpportunityStage] = useState(
    normalizeOpportunityStageValue(opportunity.sales_stage)
  );
  const [estimatedRevenue, setEstimatedRevenue] = useState(
    String(opportunity.deal_value ?? 0)
  );
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [pipelineStage, setPipelineStage] = useState(
    normalizePipelineStageValue(opportunity.pipeline_stage, opportunity.lifecycle_status)
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    opportunity.expected_close_date && /^\d{4}-\d{2}-\d{2}/.test(opportunity.expected_close_date)
      ? opportunity.expected_close_date.slice(0, 10)
      : ''
  );
  const [country, setCountry] = useState(
    opportunity.country || (opportunity.metadata as any)?.country || ''
  );
  const [campaignAssignment, setCampaignAssignment] = useState(
    opportunity.campaign_assignment || (opportunity.metadata as any)?.campaign_assignment || ''
  );
  const [businessSegment, setBusinessSegment] = useState(
    opportunity.business_segment || (opportunity.metadata as any)?.business_segment || ''
  );
  const [productSolution, setProductSolution] = useState(
    opportunity.product_solution || (opportunity.metadata as any)?.product_solution || ''
  );
  const [source, setSource] = useState(
    opportunity.source || (opportunity.metadata as any)?.source || 'Inherited'
  );

  // Fixed Read-Only Fields Inherited from Opportunity Qualification Module
  const [industry, setIndustry] = useState(opportunity.industry_name || 'Enterprise Software');
  const [revenueMotion, setRevenueMotion] = useState(
    opportunity.revenue_motion_name || 'Digital Solution Selling'
  );

  const parseRevenueAmount = (val: string): string => {
    if (!val) return '';
    return val.replace(/[^0-9.]/g, '');
  };

  const formatCurrencyDisplay = (val: string): string => {
    const cleanNum = parseRevenueAmount(val);
    if (!cleanNum) return '';
    const num = parseFloat(cleanNum);
    if (isNaN(num)) return cleanNum;
    return new Intl.NumberFormat('en-US').format(num);
  };

  useEffect(() => {
    let mounted = true;

    const loadFormData = async () => {
      if (!opportunity?.pipeline_id) return;
      setLoading(true);
      try {
        const record = await PipelineDataService.getPipelineFormData(opportunity, handoverDetail);
        if (!mounted) return;

        setCompanyName(record.company_name || '');
        setOpportunityName(record.opportunity_name || '');
        setOwner(record.opportunity_owner || 'Senior Enterprise AE');
        setOpportunityStage(normalizeOpportunityStageValue(record.opportunity_stage));
        setEstimatedRevenue(
          parseRevenueAmount(
            record.deal_value !== undefined && record.deal_value !== null
              ? String(record.deal_value)
              : record.estimated_revenue
          )
        );
        setCurrencySymbol(record.currency_symbol || '$');
        setPipelineStage(
          normalizePipelineStageValue(record.pipeline_stage, opportunity.lifecycle_status)
        );
        setExpectedCloseDate(record.expected_close_date || '');
        setCountry(record.country || '');
        setCampaignAssignment(record.campaign_assignment || '');
        setBusinessSegment(record.business_segment || '');
        setProductSolution(record.product_solution || '');
        setSource(
          record.source ||
            (opportunity.opportunity_id ||
            opportunity.lead_id ||
            opportunity.source_system === 'RevOS_Opportunity_Qualification'
              ? 'Inherited'
              : '')
        );
        setIndustry(record.industry || opportunity.industry_name || 'Enterprise Software');
        setRevenueMotion(
          record.revenue_motion || opportunity.revenue_motion_name || 'Digital Solution Selling'
        );
      } catch (err) {
        console.error('Error loading Pipeline Form data from Supabase:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFormData();

    return () => {
      mounted = false;
    };
  }, [opportunity.pipeline_id, handoverDetail?.updated_at, opportunity.updated_at]);

  const handleSave = async (e?: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    if (!opportunity?.pipeline_id) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const cleanAmount = parseRevenueAmount(estimatedRevenue);
      const numericDealValue = cleanAmount ? parseFloat(cleanAmount) || 0 : 0;
      const formattedRevenue = `${currencySymbol}${formatCurrencyDisplay(estimatedRevenue) || '0'}`;

      const { formRecord, updatedOpportunity } = await PipelineDataService.savePipelineFormData(
        opportunity,
        {
          company_name: companyName.trim(),
          opportunity_name: opportunityName.trim(),
          opportunity_owner: owner.trim(),
          opportunity_stage: opportunityStage,
          estimated_revenue: formattedRevenue,
          currency_symbol: currencySymbol,
          deal_value: numericDealValue,
          pipeline_stage: pipelineStage,
          expected_close_date: expectedCloseDate,
          country: country.trim(),
          campaign_assignment: campaignAssignment.trim(),
          business_segment: businessSegment.trim(),
          product_solution: productSolution.trim(),
          source: source.trim(),
          industry,
          revenue_motion: revenueMotion,
          form_status: isDraft ? 'Draft' : 'Saved'
        }
      );

      setSaveSuccess(
        isDraft
          ? 'Pipeline draft successfully saved in Supabase database!'
          : 'Pipeline form successfully saved & synchronized in Supabase database!'
      );

      if (onUpdate) {
        onUpdate(updatedOpportunity, formRecord);
      }

      if (!isDraft && onStartAssessment) {
        onStartAssessment();
      }

      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save Pipeline Form to Supabase:', err);
      setSaveError(err.message || 'Failed to save to Supabase database. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isCreatedSource =
    String(source || '').trim().toLowerCase() === 'created' ||
    opportunity.source_system === 'RevOS_Pipeline_Direct_Creation';

  return (
    <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden p-6 sm:p-7 space-y-6">
      {/* Header (Title typography consistent with Opportunity Handover) */}
      <div className="border-b border-border/70 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">
              Pipeline Form
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
              Pipeline Assessment Engine
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {isCreatedSource
              ? 'Update and calibrate deal parameters inherited from Opportunity Creation. All changes are stored directly in the Supabase database.'
              : 'Update and calibrate deal parameters inherited from Opportunity Qualification & SQL Qualification. All changes are stored directly in the Supabase database.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary bg-bg-primary/50 px-3 py-1.5 rounded-xl border border-border/60 self-start sm:self-auto shrink-0">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>
            {isCreatedSource
              ? 'Inherited from Opportunity Creation'
              : 'Inherited from Opportunity Qualification'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-bold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-medium rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary space-y-2">
          <RefreshCw className="h-5 w-5 animate-spin text-accent" />
          <span className="text-xs font-mono uppercase tracking-wider">
            Loading Pipeline Parameters from Supabase...
          </span>
        </div>
      ) : (
        <form onSubmit={(e) => handleSave(e, false)} className="space-y-6">
          {/* Main 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* 1. Company Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-text-secondary/70" />
                <span>1. Company Name</span>
                <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Inherited from SQL / Opportunity Qualification entity
              </span>
            </div>

            {/* 2. Opportunity Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-text-secondary/70" />
                <span>2. Opportunity Name</span>
                <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={opportunityName}
                onChange={(e) => setOpportunityName(e.target.value)}
                placeholder="e.g. Acme Global Cloud Modernization"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Formal opportunity naming standard
              </span>
            </div>

            {/* 3. Opportunity Owner */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <User className="h-3 w-3 text-text-secondary/70" />
                <span>3. Opportunity Owner</span>
                <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Enterprise AE)"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Assigned AE / Account Director responsible
              </span>
            </div>

            {/* 4. Opportunity Stage */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                <span>4. Opportunity Stage</span>
                <span className="text-accent">*</span>
              </label>
              <select
                value={opportunityStage}
                onChange={(e) => setOpportunityStage(e.target.value)}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-bg-surface text-text-primary">
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Opportunity qualification milestone state
              </span>
            </div>

            {/* 5. Estimated Revenue */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-text-secondary/70" />
                <span>5. Estimated Revenue</span>
                <span className="text-accent">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3 py-2.5 text-xs font-mono font-bold cursor-pointer text-text-primary"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="¥">¥ (JPY/CNY)</option>
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-text-secondary">
                    {currencySymbol}
                  </span>
                  <input
                    type="text"
                    required
                    value={formatCurrencyDisplay(estimatedRevenue)}
                    onChange={(e) => setEstimatedRevenue(parseRevenueAmount(e.target.value))}
                    placeholder="150,000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-mono font-bold tabular-nums transition-all text-text-primary placeholder-text-secondary/40"
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Estimated contract or annual deal valuation
              </span>
            </div>

            {/* 6. Pipeline Stage */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-text-secondary/70" />
                <span>6. Pipeline Stage</span>
                <span className="text-accent">*</span>
              </label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                {PIPELINE_STAGES.map((ps) => (
                  <option key={ps} value={ps} className="bg-bg-surface text-text-primary">
                    {ps}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Formal CRM pipeline classification stage
              </span>
            </div>

            {/* 7. Expected Close Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-text-secondary/70" />
                <span>7. Expected Close Date</span>
                <span className="text-accent">*</span>
              </label>
              <input
                type="date"
                required
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-sans transition-all text-text-primary"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Anticipated contract execution date
              </span>
            </div>

            {/* 8. Country */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-text-secondary/70" />
                <span>8. Country</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Country
                </option>
                {country && !STANDARD_COUNTRIES.includes(country) && (
                  <option value={country} className="bg-bg-surface text-text-primary">
                    {country}
                  </option>
                )}
                {STANDARD_COUNTRIES.map((countryName) => (
                  <option key={countryName} value={countryName} className="bg-bg-surface text-text-primary">
                    {countryName}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Inherited from Opportunity Qualification module
              </span>
            </div>

            {/* 9. Campaign Assignment */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Megaphone className="h-3 w-3 text-text-secondary/70" />
                <span>9. Campaign Assignment</span>
              </label>
              <input
                type="text"
                value={campaignAssignment}
                onChange={(e) => setCampaignAssignment(e.target.value)}
                placeholder="Enter Campaign Assignment"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Inherited from Opportunity Qualification module
              </span>
            </div>

            {/* 10. Business Segment */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-text-secondary/70" />
                <span>10. Business Segment</span>
              </label>
              <input
                type="text"
                value={businessSegment}
                onChange={(e) => setBusinessSegment(e.target.value)}
                placeholder="Enter Business Segment"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Inherited from Opportunity Qualification module
              </span>
            </div>

            {/* 11. Product/Solution */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <Package className="h-3 w-3 text-text-secondary/70" />
                <span>11. Product/Solution</span>
              </label>
              <input
                type="text"
                value={productSolution}
                onChange={(e) => setProductSolution(e.target.value)}
                placeholder="Enter Product/Solution"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                {isCreatedSource
                  ? 'Retrieved from Proposed Solution / Offering (Opportunity Creation Form)'
                  : 'Inherited from Opportunity Qualification module'}
              </span>
            </div>

            {/* 12. Source (Locked - Retrieved from Database) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <span>12. Source</span>
                </label>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  Database Locked
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={source}
                className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans text-text-secondary cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Locked source value retrieved from Supabase database
              </span>
            </div>

            {/* 13. Industry (Inherited from Opportunity Qualification Module - Read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <span>13. Industry (Inherited)</span>
                </label>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  OQ Module Locked
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={industry}
                className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans text-text-secondary cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Fixed canonical configuration inherited from Opportunity Qualification
              </span>
            </div>

            {/* 14. Revenue Motion (Inherited from Opportunity Qualification Module - Read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <span>14. Revenue Motion (Inherited)</span>
                </label>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  OQ Module Locked
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={revenueMotion}
                className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans text-text-secondary cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Fixed sales playbook architecture inherited from Opportunity Qualification
              </span>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-border/70">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Database className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px]">
                Database Target: Supabase Cloud (Data API Compliant)
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Save Draft Button with Accent Color Background */}
              <button
                type="button"
                onClick={(e) => handleSave(e, true)}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-black uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>

              {/* Start Assessment Button saving Pipeline Form into Supabase & opening Pipeline Assessment Form */}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Start Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default PipelineForm;
