import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { OpportunityDataService } from '../services/opportunityDataService';
import { SQLDataService } from '../services/sqlDataService';
import { STANDARD_COUNTRIES, parseLegacyLocationToCountryAndState } from '../constants/countries';
import { getScopedStorageItem, resolveAuthenticatedRevOSUserId } from '../../utils/userIsolation';
import { 
  Building2, Briefcase, User, TrendingUp, Calendar, 
  DollarSign, CheckCircle2, AlertCircle, RefreshCw, 
  Layers, Lock, Sparkles, Save, FileEdit,
  Globe, Megaphone, Package
} from 'lucide-react';

interface OpportunityFormProps {
  opportunity: any;
  onUpdate?: (updatedFields: any) => void;
  onStartQualification?: () => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  opportunity,
  onUpdate,
  onStartQualification
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Field States
  const [companyName, setCompanyName] = useState(opportunity?.company_name || '');
  const [opportunityName, setOpportunityName] = useState(opportunity?.opportunity_name || '');
  const [owner, setOwner] = useState('Senior Enterprise AE');
  const [stage, setStage] = useState('Emerging Opportunity');
  const [estimatedRevenue, setEstimatedRevenue] = useState('150000');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [pipelineStage, setPipelineStage] = useState('Qualification');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [country, setCountry] = useState(opportunity?.country || '');
  const [campaignAssignment, setCampaignAssignment] = useState(opportunity?.campaign_assignment || '');
  const [businessSegment, setBusinessSegment] = useState(opportunity?.business_segment || '');
  const [productSolution, setProductSolution] = useState(opportunity?.product_solution || '');
  
  // Inherited from SQL Qualification Module (Read-only)
  const [industry, setIndustry] = useState(opportunity?.industry || 'Enterprise Software');
  const [revenueMotion, setRevenueMotion] = useState(opportunity?.revenue_motion || 'Digital Solution Selling');
  const [strategicNote, setStrategicNote] = useState('');

  // Dropdown options as requested
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

  // Helper to parse currency string to raw numeric representation
  const parseRevenueAmount = (val: string): string => {
    if (!val) return '';
    return val.replace(/[^0-9.]/g, '');
  };

  // Helper to format currency display
  const formatCurrencyDisplay = (val: string): string => {
    const cleanNum = parseRevenueAmount(val);
    if (!cleanNum) return '';
    const num = parseFloat(cleanNum);
    if (isNaN(num)) return cleanNum;
    return new Intl.NumberFormat('en-US').format(num);
  };

  useEffect(() => {
    const loadInheritedData = async () => {
      if (!opportunity?.id) return;
      setLoading(true);
      try {
        let parsedOppDesc: any = {};
        if (typeof opportunity?.description === 'string' && opportunity.description.trim().startsWith('{')) {
          try {
            parsedOppDesc = JSON.parse(opportunity.description);
          } catch {}
        }

        // 1. Fetch any persisted form data or handover data from Supabase
        const existingFormData = await OpportunityDataService.getOpportunityFormData(opportunity.id);
        let rawSql: any = null;

        if (existingFormData) {
          if (existingFormData.company_name) setCompanyName(existingFormData.company_name);
          if (existingFormData.opportunity_name) setOpportunityName(existingFormData.opportunity_name);
          if (existingFormData.opportunity_owner) setOwner(existingFormData.opportunity_owner);
          if (existingFormData.opportunity_stage) setStage(existingFormData.opportunity_stage);
          if (existingFormData.pipeline_stage) setPipelineStage(existingFormData.pipeline_stage);
          if (existingFormData.expected_close_date) setExpectedCloseDate(existingFormData.expected_close_date);
          if (existingFormData.industry) setIndustry(existingFormData.industry);
          if (existingFormData.revenue_motion) setRevenueMotion(existingFormData.revenue_motion);
          if (existingFormData.strategic_note) setStrategicNote(existingFormData.strategic_note);
          
          if (existingFormData.estimated_revenue) {
            const rawRev = parseRevenueAmount(existingFormData.estimated_revenue);
            setEstimatedRevenue(rawRev);
            if (existingFormData.estimated_revenue.startsWith('€')) setCurrencySymbol('€');
            else if (existingFormData.estimated_revenue.startsWith('£')) setCurrencySymbol('£');
            else if (existingFormData.estimated_revenue.startsWith('¥')) setCurrencySymbol('¥');
            else setCurrencySymbol('$');
          }
        } else {
          // 2. Fallback to SQL reasoning session or parent opportunity properties
          rawSql = await SQLDataService.getSavedQualificationResult(opportunity.id);
          if (rawSql?.customer_context) {
            if (rawSql.customer_context.company_name) setCompanyName(rawSql.customer_context.company_name);
            if (rawSql.customer_context.opportunity_name) setOpportunityName(rawSql.customer_context.opportunity_name);
            if (rawSql.customer_context.opportunity_owner) setOwner(rawSql.customer_context.opportunity_owner);
            if (rawSql.customer_context.industry) setIndustry(rawSql.customer_context.industry);
            if (rawSql.customer_context.revenue_motion) setRevenueMotion(rawSql.customer_context.revenue_motion);
            if (rawSql.customer_context.estimated_deal_size) {
              setEstimatedRevenue(parseRevenueAmount(rawSql.customer_context.estimated_deal_size));
            }
          }
        }

        // 3. Resolve Country, Campaign Assignment, Business Segment, Product/Solution from SQL -> Opportunity -> MQL fallback
        let resolvedCountry =
          existingFormData?.country ||
          opportunity?.country ||
          parsedOppDesc?.country ||
          rawSql?.customer_context?.country ||
          '';
        let resolvedCampaign =
          existingFormData?.campaign_assignment ||
          opportunity?.campaign_assignment ||
          parsedOppDesc?.campaign_assignment ||
          rawSql?.customer_context?.campaign_assignment ||
          '';
        let resolvedSegment =
          existingFormData?.business_segment ||
          opportunity?.business_segment ||
          parsedOppDesc?.business_segment ||
          rawSql?.customer_context?.business_segment ||
          '';
        let resolvedProduct =
          existingFormData?.product_solution ||
          opportunity?.product_solution ||
          parsedOppDesc?.product_solution ||
          rawSql?.customer_context?.product_solution ||
          '';

        if ((!resolvedCountry || !resolvedCampaign || !resolvedSegment || !resolvedProduct) && opportunity?.mql_reference_id) {
          let mqlExtra: any = {};
          if (typeof window !== 'undefined') {
            try {
              const rawExtra = getScopedStorageItem(`mql_lead_extra_${opportunity.mql_reference_id}`);
              if (rawExtra) mqlExtra = JSON.parse(rawExtra);
            } catch {}
          }

          try {
            const activeUserId = await resolveAuthenticatedRevOSUserId();
            let mqlLead: any = null;
            if (activeUserId) {
              const { data } = await supabase
                .from('mql_leads')
                .select('*')
                .eq('id', opportunity.mql_reference_id)
                .eq('created_by', activeUserId)
                .maybeSingle();
              mqlLead = data;
            }

            let campaignName = '';
            if (activeUserId && mqlLead?.campaign_id) {
              const { data: campaignRow } = await supabase
                .from('mql_campaigns')
                .select('name')
                .eq('id', mqlLead.campaign_id)
                .eq('created_by', activeUserId)
                .maybeSingle();
              campaignName = campaignRow?.name || '';
            }

            if (!resolvedCountry) {
              resolvedCountry =
                mqlLead?.country ||
                mqlExtra?.country ||
                parseLegacyLocationToCountryAndState(mqlLead?.location || mqlExtra?.location).country ||
                '';
            }
            if (!resolvedCampaign) {
              resolvedCampaign = campaignName;
            }
            if (!resolvedSegment) {
              resolvedSegment = mqlLead?.lead_industry || mqlExtra?.lead_industry || '';
            }
            if (!resolvedProduct) {
              resolvedProduct = mqlLead?.product_solution || mqlExtra?.product_solution || '';
            }
          } catch (mqlErr) {
            console.warn('Non-blocking MQL fallback lookup failed:', mqlErr);
          }
        }

        setCountry(resolvedCountry);
        setCampaignAssignment(resolvedCampaign);
        setBusinessSegment(resolvedSegment);
        setProductSolution(resolvedProduct);
      } catch (err) {
        console.error('Error loading opportunity form data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInheritedData();
  }, [opportunity?.id]);

  const handleSave = async (e?: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    if (!opportunity?.id) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const formattedRevenue = `${currencySymbol}${formatCurrencyDisplay(estimatedRevenue) || '0'}`;

      const payload = {
        company_name: companyName.trim(),
        opportunity_name: opportunityName.trim(),
        opportunity_owner: owner.trim(),
        opportunity_stage: stage,
        estimated_revenue: formattedRevenue,
        pipeline_stage: pipelineStage,
        expected_close_date: expectedCloseDate,
        country: country.trim(),
        campaign_assignment: campaignAssignment.trim(),
        business_segment: businessSegment.trim(),
        product_solution: productSolution.trim(),
        industry: industry,
        revenue_motion: revenueMotion,
        strategic_note: strategicNote,
        form_status: isDraft ? 'Draft' : 'Saved'
      };

      // Persist in Supabase database
      await OpportunityDataService.saveOpportunityFormData(opportunity.id, payload);

      setSaveSuccess(
        isDraft 
          ? 'Opportunity draft successfully saved in Supabase database!' 
          : 'Opportunity form successfully saved & synchronized in Supabase database!'
      );

      if (onUpdate) {
        onUpdate(payload);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('opportunity_form_updated', {
          detail: { opportunityId: opportunity.id, formData: payload }
        }));
      }

      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to save opportunity form:', err);
      setSaveError(err.message || 'Failed to save to Supabase database. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden p-6 sm:p-7 space-y-6">
      
      {/* Header (Ref: SQL Qualification Module design & typography) */}
      <div className="border-b border-border/70 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="font-black text-sm uppercase text-text-primary tracking-tight flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-accent" />
              Opportunity Form
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
              Opportunity Qualification Module
            </span>
          </div>
          <p className="text-xs text-text-secondary font-medium leading-relaxed">
            Update and calibrate deal parameters inherited from the SQL Qualification phase. All changes are stored directly in the Supabase database.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary bg-bg-primary/50 px-3 py-1.5 rounded-xl border border-border/60 self-start sm:self-auto">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>Inherited from SQL Module</span>
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
          <span className="text-xs font-mono uppercase tracking-wider">Loading Opportunity Parameters...</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL lead entity</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Formal opportunity naming standard</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Assigned AE / Account Director responsible</span>
            </div>

            {/* 4. Opportunity Stage */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                <span>4. Opportunity Stage</span>
                <span className="text-accent">*</span>
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-bg-surface text-text-primary">
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">Opportunity qualification milestone state</span>
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
                    className="w-full pl-8 pr-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-mono font-bold transition-all text-text-primary placeholder-text-secondary/40"
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-secondary/60 font-mono block">Estimated contract or annual deal valuation</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Formal CRM pipeline classification stage</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Anticipated contract execution date</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL Qualification module</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL Qualification module</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL Qualification module</span>
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
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL Qualification module</span>
            </div>

            {/* 12. Industry (Inherited from SQL Module - Read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <span>12. Industry (Inherited)</span>
                </label>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  SQL Module Locked
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={industry}
                  className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans text-text-secondary cursor-not-allowed select-none"
                />
              </div>
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited from SQL Qualification entity</span>
            </div>

            {/* 13. Revenue Motion (Inherited from SQL Module - Read-only) */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <span>13. Revenue Motion (Inherited)</span>
                </label>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  SQL Module Locked
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={revenueMotion}
                  className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans text-text-secondary cursor-not-allowed select-none"
                />
              </div>
              <span className="text-[10px] text-text-secondary/60 font-mono block">Inherited sales playbook architecture and revenue motion family</span>
            </div>

          </div>

          {/* Form Actions Footer (Ref: SQL Qualification Module button design) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-border/70">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px]">Database Target: Supabase Cloud (Data API Compliant)</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Save Draft Button with Accent Color Background */}
              <button
                type="button"
                onClick={(e) => handleSave(e, true)}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-black uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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

              {/* Start Opportunity Qualification Button - triggers Opportunity Qualification Form */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await handleSave(undefined, true);
                    if (opportunity?.id) {
                      await OpportunityDataService.recordStartQualification(opportunity.id, {
                        revenueMotion,
                        industry
                      });
                    }
                  } catch (e) {
                    console.warn('Draft save notice:', e);
                  }
                  if (onStartQualification) {
                    onStartQualification();
                  }
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start Opportunity Qualification</span>
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
export default OpportunityForm;
