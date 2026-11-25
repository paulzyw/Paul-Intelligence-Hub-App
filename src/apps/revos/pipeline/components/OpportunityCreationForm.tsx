import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  Save,
  Database,
  Globe,
  FileText,
  Users,
  ShieldAlert,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { STANDARD_COUNTRIES } from '../../leads/constants/countries';
import { PipelineDataService } from '../services/PipelineDataService';
import { PipelineConfigService } from '../services/PipelineConfigService';
import {
  CreatedOpportunityDraftRecord,
  CreatedOpportunityFormInput,
  InitialOpportunityContextSummaryHistoryEntry,
  InitialOpportunityContextSummaryPayload,
  InitialSummaryStatus
} from '../../types/pipeline';
import {
  CanvasColumnKey,
  invalidatePipelinePortfolioCache,
  loadCanonicalPipelinePortfolio
} from '../services/pipelinePortfolioLoader';
import { InitialOpportunityContextSummary } from './InitialOpportunityContextSummary';

export interface OpportunityCreationFormProps {
  onBack?: () => void;
}

type SectionKey = 'A' | 'B' | 'C' | 'D' | 'E';

const getDefaultLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INDUSTRY_OPTIONS = [
  'SaaS / Software',
  'Enterprise Software',
  'AI Solutions',
  'Cloud Transformation',
  'Consulting',
  'Professional Services',
  'System Integration',
  'Managed Services',
  'Digital Transformation',
  'OT/IT Solutions',
  'Engineering Solutions',
  'Infrastructure Projects',
  'EPC / EP Projects',
  'Enterprise Procurement',
  'Solution-Selling Organizations',
  'Other Solutions'
] as const;

const REVENUE_MOTION_OPTIONS = [
  'Digital Solution Selling',
  'Professional & Solution Services',
  'Digital Transformation & OT',
  'Engineering & Project Solutions',
  'Project & Procurement',
  'Generic Solution Selling'
] as const;

const PIPELINE_STAGE_OPTIONS = [
  'Qualification',
  'Discovery',
  'Solution Development',
  'Proposal',
  'Evaluation',
  'Negotiation',
  'Commit',
  'Closed Won',
  'Closed Lost'
] as const;

const OPPORTUNITY_STAGE_OPTIONS = [
  'Emerging Opportunity',
  'Defined Opportunity',
  'Validated Opportunity',
  'Active Buying Opportunity',
  'Decision Opportunity',
  'Contract Decision'
] as const;

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
  { code: 'CNY', symbol: '¥', label: 'CNY (¥) — Chinese Yuan' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) — Japanese Yen' },
  { code: 'CAD', symbol: '$', label: 'CAD (C$) — Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD (A$) — Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'SGD', symbol: '$', label: 'SGD (S$) — Singapore Dollar' }
] as const;

const SECTIONS: Array<{
  key: SectionKey;
  code: string;
  title: string;
  subtitle: string;
  hasRequired: boolean;
}> = [
  {
    key: 'A',
    code: 'Section A',
    title: 'Opportunity Identity',
    subtitle: 'Step 1 — Core identity, classification, ownership & geography',
    hasRequired: true
  },
  {
    key: 'B',
    code: 'Section B',
    title: 'Opportunity Description',
    subtitle: 'Step 1 — Overview, business problem, proposed solution & outcomes',
    hasRequired: true
  },
  {
    key: 'C',
    code: 'Section C',
    title: 'Commercial Information',
    subtitle: 'Step 2 — Deal valuation, currency, stages, target date & model',
    hasRequired: true
  },
  {
    key: 'D',
    code: 'Section D',
    title: 'Customer Engagement & Stakeholders',
    subtitle: 'Step 2 — Stakeholders, champion, interactions & competitive landscape',
    hasRequired: false
  },
  {
    key: 'E',
    code: 'Section E',
    title: 'Additional Context',
    subtitle: 'Step 2 — Priorities, constraints & final review before Save & Submit',
    hasRequired: false
  }
];

export const OpportunityCreationForm: React.FC<OpportunityCreationFormProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<SectionKey>('A');

  // Section A — Opportunity Identity
  const sourceValue = 'Created' as const;
  const [opportunityName, setOpportunityName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [revenueMotion, setRevenueMotion] = useState('');
  const [opportunityOwner, setOpportunityOwner] = useState<string>(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.email ||
      profile?.email ||
      'Senior Enterprise AE'
    );
  });
  const [ownerTouched, setOwnerTouched] = useState(false);
  const [country, setCountry] = useState('');
  const [businessSegment, setBusinessSegment] = useState('');
  const [creationDate, setCreationDate] = useState<string>(() => getDefaultLocalDate());

  // Section B — Opportunity Description
  const [opportunityOverview, setOpportunityOverview] = useState('');
  const [customerBusinessProblem, setCustomerBusinessProblem] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [expectedBusinessOutcomes, setExpectedBusinessOutcomes] = useState('');
  const [opportunityOriginBackground, setOpportunityOriginBackground] = useState('');

  // Section C — Commercial Information
  const [estimatedRevenue, setEstimatedRevenue] = useState('');
  const [currency, setCurrency] = useState('');
  const [expectedClosingDate, setExpectedClosingDate] = useState('');
  const [pipelineStage, setPipelineStage] = useState('');
  const [opportunityStage, setOpportunityStage] = useState('');
  const [commercialModel, setCommercialModel] = useState('');

  // Section D — Customer Engagement & Stakeholders (Optional)
  const [currentEngagementStatus, setCurrentEngagementStatus] = useState('');
  const [knownCustomerStakeholders, setKnownCustomerStakeholders] = useState('');
  const [knownDecisionMaker, setKnownDecisionMaker] = useState('');
  const [internalChampion, setInternalChampion] = useState('');
  const [recentCustomerInteraction, setRecentCustomerInteraction] = useState('');
  const [knownCompetitors, setKnownCompetitors] = useState('');

  // Section E — Additional Context (Optional)
  const [knownCustomerPriorities, setKnownCustomerPriorities] = useState('');
  const [knownConstraintsChallenges, setKnownConstraintsChallenges] = useState('');
  const [additionalInformation, setAdditionalInformation] = useState('');

  // Persistence & Validation UI States
  const [saving, setSaving] = useState(false);
  const [savedPipelineId, setSavedPipelineId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initial Opportunity Context Summary Lifecycle States
  const [summaryStatus, setSummaryStatus] = useState<InitialSummaryStatus>('NOT_GENERATED');
  const [summaryPayload, setSummaryPayload] =
    useState<InitialOpportunityContextSummaryPayload | null>(null);
  const [summaryVersion, setSummaryVersion] = useState<number>(0);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(null);
  const [summaryHistory, setSummaryHistory] = useState<
    InitialOpportunityContextSummaryHistoryEntry[]
  >([]);
  const [summaryIsStale, setSummaryIsStale] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [submittingSummary, setSubmittingSummary] = useState<boolean>(false);
  const [savingSummary, setSavingSummary] = useState<boolean>(false);
  const [savedSummaryMessage, setSavedSummaryMessage] = useState<string | null>(null);
  const [saveSummaryError, setSaveSummaryError] = useState<string | null>(null);
  const submitInFlightRef = useRef<boolean>(false);
  const summarySectionRef = useRef<HTMLDivElement | null>(null);

  // Draft Resumption & Section-by-Section Saving State
  const [availableDrafts, setAvailableDrafts] = useState<CreatedOpportunityDraftRecord[]>([]);
  const [loadingDraft, setLoadingDraft] = useState<boolean>(false);
  const [resumedDraftNotice, setResumedDraftNotice] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<SectionKey[]>([]);
  const [isLockedReview, setIsLockedReview] = useState<boolean>(false);
  const [openedFromWorkspace, setOpenedFromWorkspace] = useState<boolean>(false);
  const userEditedRef = useRef<boolean>(false);
  const draftBootstrappedRef = useRef<boolean>(false);
  const lastBootstrappedUrlIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(user?.id || null);

  useEffect(() => {
    const currentUid = user?.id || null;
    if (prevUserIdRef.current !== currentUid) {
      prevUserIdRef.current = currentUid;
      draftBootstrappedRef.current = false;
      userEditedRef.current = false;
      setSavedPipelineId(null);
      setAvailableDrafts([]);
      setResumedDraftNotice(null);
    }
  }, [user?.id]);

  const defaultOwnerForAuth = useCallback(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.email ||
      profile?.email ||
      'Senior Enterprise AE'
    );
  }, [user, profile]);

  useEffect(() => {
    if (!ownerTouched) {
      const authIdentity = user?.user_metadata?.full_name || user?.email || profile?.email;
      if (authIdentity && opportunityOwner === 'Senior Enterprise AE') {
        setOpportunityOwner(authIdentity);
      }
    }
  }, [user, profile, ownerTouched, opportunityOwner]);

  const markDirty = () => {
    userEditedRef.current = true;
    if (savedPipelineId) {
      setHasUnsavedChanges(true);
      if (summaryStatus === 'READY') {
        setSummaryIsStale(true);
      }
    }
    if (saveError) setSaveError(null);
  };

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

  const activeCurrencySymbol = useMemo(() => {
    const found = CURRENCY_OPTIONS.find((c) => c.code === currency);
    return found?.symbol || '$';
  }, [currency]);

  // Required Field Validation Logic per Section
  const validation = useMemo(() => {
    const missingA: string[] = [];
    if (!opportunityName.trim()) missingA.push('Opportunity Name');
    if (!companyName.trim()) missingA.push('Customer / Company Name');
    if (!industry || !INDUSTRY_OPTIONS.includes(industry as any)) missingA.push('Industry');
    if (!revenueMotion || !REVENUE_MOTION_OPTIONS.includes(revenueMotion as any)) {
      missingA.push('Revenue Motion');
    }
    if (!opportunityOwner.trim()) missingA.push('Opportunity Owner');
    if (!country || !STANDARD_COUNTRIES.includes(country)) missingA.push('Country');

    const missingB: string[] = [];
    if (!opportunityOverview.trim()) missingB.push('Opportunity Overview');
    if (!customerBusinessProblem.trim()) missingB.push("Customer's Business Problem");
    if (!proposedSolution.trim()) missingB.push('Proposed Solution / Offering');

    const missingC: string[] = [];
    const cleanRev = parseRevenueAmount(estimatedRevenue);
    if (!cleanRev || isNaN(parseFloat(cleanRev))) missingC.push('Estimated Revenue');
    if (!currency || !CURRENCY_OPTIONS.some((c) => c.code === currency)) missingC.push('Currency');
    if (!expectedClosingDate || !/^\d{4}-\d{2}-\d{2}$/.test(expectedClosingDate)) {
      missingC.push('Expected Closing Date');
    }
    if (!pipelineStage || !PIPELINE_STAGE_OPTIONS.includes(pipelineStage as any)) {
      missingC.push('Pipeline Stage');
    }
    if (!opportunityStage || !OPPORTUNITY_STAGE_OPTIONS.includes(opportunityStage as any)) {
      missingC.push('Opportunity Stage');
    }

    const aComplete = missingA.length === 0;
    const bComplete = missingB.length === 0;
    const cComplete = missingC.length === 0;
    const allComplete = aComplete && bComplete && cComplete;

    const totalRequired = 14;
    const completedRequired = totalRequired - (missingA.length + missingB.length + missingC.length);

    return {
      missingBySection: {
        A: missingA,
        B: missingB,
        C: missingC,
        D: [] as string[],
        E: [] as string[]
      },
      completeBySection: {
        A: aComplete,
        B: bComplete,
        C: cComplete,
        D: true,
        E: true
      },
      allComplete,
      completedRequired,
      totalRequired
    };
  }, [
    opportunityName,
    companyName,
    industry,
    revenueMotion,
    opportunityOwner,
    country,
    opportunityOverview,
    customerBusinessProblem,
    proposedSolution,
    estimatedRevenue,
    currency,
    expectedClosingDate,
    pipelineStage,
    opportunityStage
  ]);

  const hasAnySaveableInput = useMemo(() => {
    return Boolean(
      savedPipelineId ||
        ownerTouched ||
        opportunityName.trim() ||
        companyName.trim() ||
        industry ||
        revenueMotion ||
        country ||
        businessSegment.trim() ||
        opportunityOverview.trim() ||
        customerBusinessProblem.trim() ||
        proposedSolution.trim() ||
        expectedBusinessOutcomes.trim() ||
        opportunityOriginBackground.trim() ||
        parseRevenueAmount(estimatedRevenue) ||
        currency ||
        expectedClosingDate ||
        pipelineStage ||
        opportunityStage ||
        commercialModel.trim() ||
        currentEngagementStatus.trim() ||
        knownCustomerStakeholders.trim() ||
        knownDecisionMaker.trim() ||
        internalChampion.trim() ||
        recentCustomerInteraction.trim() ||
        knownCompetitors.trim() ||
        knownCustomerPriorities.trim() ||
        knownConstraintsChallenges.trim() ||
        additionalInformation.trim()
    );
  }, [
    savedPipelineId,
    ownerTouched,
    opportunityName,
    companyName,
    industry,
    revenueMotion,
    country,
    businessSegment,
    opportunityOverview,
    customerBusinessProblem,
    proposedSolution,
    expectedBusinessOutcomes,
    opportunityOriginBackground,
    estimatedRevenue,
    currency,
    expectedClosingDate,
    pipelineStage,
    opportunityStage,
    commercialModel,
    currentEngagementStatus,
    knownCustomerStakeholders,
    knownDecisionMaker,
    internalChampion,
    recentCustomerInteraction,
    knownCompetitors,
    knownCustomerPriorities,
    knownConstraintsChallenges,
    additionalInformation
  ]);

  const sectionsWithEnteredData = useMemo(() => {
    const filled: SectionKey[] = [];
    if (
      opportunityName.trim() ||
      companyName.trim() ||
      industry ||
      revenueMotion ||
      country ||
      businessSegment.trim() ||
      ownerTouched
    ) {
      filled.push('A');
    }
    if (
      opportunityOverview.trim() ||
      customerBusinessProblem.trim() ||
      proposedSolution.trim() ||
      expectedBusinessOutcomes.trim() ||
      opportunityOriginBackground.trim()
    ) {
      filled.push('B');
    }
    if (
      parseRevenueAmount(estimatedRevenue) ||
      currency ||
      expectedClosingDate ||
      pipelineStage ||
      opportunityStage ||
      commercialModel.trim()
    ) {
      filled.push('C');
    }
    if (
      currentEngagementStatus.trim() ||
      knownCustomerStakeholders.trim() ||
      knownDecisionMaker.trim() ||
      internalChampion.trim() ||
      recentCustomerInteraction.trim() ||
      knownCompetitors.trim()
    ) {
      filled.push('D');
    }
    if (
      knownCustomerPriorities.trim() ||
      knownConstraintsChallenges.trim() ||
      additionalInformation.trim()
    ) {
      filled.push('E');
    }
    return filled;
  }, [
    opportunityName,
    companyName,
    industry,
    revenueMotion,
    country,
    businessSegment,
    ownerTouched,
    opportunityOverview,
    customerBusinessProblem,
    proposedSolution,
    expectedBusinessOutcomes,
    opportunityOriginBackground,
    estimatedRevenue,
    currency,
    expectedClosingDate,
    pipelineStage,
    opportunityStage,
    commercialModel,
    currentEngagementStatus,
    knownCustomerStakeholders,
    knownDecisionMaker,
    internalChampion,
    recentCustomerInteraction,
    knownCompetitors,
    knownCustomerPriorities,
    knownConstraintsChallenges,
    additionalInformation
  ]);

  const isCurrentSectionNextEnabled = validation.completeBySection[activeSection];
  const canAdvanceSection = isLockedReview || isCurrentSectionNextEnabled;
  const isSaveEnabled = hasAnySaveableInput && !saving && !submittingSummary;
  const isSubmitEnabled =
    validation.allComplete &&
    Boolean(savedPipelineId) &&
    !hasUnsavedChanges &&
    !saving &&
    !submittingSummary;

  const hydrateFormFromDraft = useCallback(
    async (draft: CreatedOpportunityDraftRecord, showNotice = true) => {
      const ctx = draft.initial_context || {};
      const nextOppName = ctx.opportunity_name || draft.opportunity_name || '';
      const nextCompany = ctx.company_name || draft.company_name || '';
      const nextIndustry = ctx.industry || '';
      const nextMotion = ctx.revenue_motion || '';
      const nextCountry = ctx.country || '';
      const nextOwner = ctx.opportunity_owner || defaultOwnerForAuth();

      setSavedPipelineId(draft.pipeline_id);
      setOpportunityName(nextOppName);
      setCompanyName(nextCompany);
      setIndustry(nextIndustry);
      setRevenueMotion(nextMotion);
      setOpportunityOwner(nextOwner);
      setOwnerTouched(Boolean(ctx.opportunity_owner));
      setCountry(nextCountry);
      setBusinessSegment(ctx.business_segment || '');
      setCreationDate(ctx.creation_date || getDefaultLocalDate());

      const nextOverview = ctx.opportunity_overview || '';
      const nextProblem = ctx.customer_business_problem || '';
      const nextSolution = ctx.proposed_solution || '';
      setOpportunityOverview(nextOverview);
      setCustomerBusinessProblem(nextProblem);
      setProposedSolution(nextSolution);
      setExpectedBusinessOutcomes(ctx.expected_business_outcomes || '');
      setOpportunityOriginBackground(ctx.opportunity_origin_background || '');

      const parsedRevNum =
        typeof ctx.estimated_revenue === 'number'
          ? ctx.estimated_revenue
          : parseFloat(String(ctx.estimated_revenue ?? '').replace(/[^0-9.]/g, '')) || 0;
      const nextRev = parsedRevNum > 0 ? String(parsedRevNum) : '';
      const nextCurrency = ctx.currency || '';
      const nextClosingDate = ctx.expected_closing_date || '';
      const nextPipeStage = ctx.pipeline_stage || '';
      const nextOppStage = ctx.opportunity_stage || '';
      setEstimatedRevenue(nextRev);
      setCurrency(nextCurrency);
      setExpectedClosingDate(nextClosingDate);
      setPipelineStage(nextPipeStage);
      setOpportunityStage(nextOppStage);
      setCommercialModel(ctx.commercial_model || '');

      setCurrentEngagementStatus(ctx.current_engagement_status || '');
      setKnownCustomerStakeholders(ctx.known_customer_stakeholders || '');
      setKnownDecisionMaker(ctx.known_decision_maker || '');
      setInternalChampion(ctx.internal_champion || '');
      setRecentCustomerInteraction(ctx.recent_customer_interaction || '');
      setKnownCompetitors(ctx.known_competitors || '');

      setKnownCustomerPriorities(ctx.known_customer_priorities || '');
      setKnownConstraintsChallenges(ctx.known_constraints_challenges || '');
      setAdditionalInformation(ctx.additional_information || '');

      setSavedSections(
        Array.isArray(draft.saved_sections) && draft.saved_sections.length > 0
          ? draft.saved_sections
          : ['A']
      );
      const lockedFlag = Boolean(draft.assessment_locked);
      setIsLockedReview(lockedFlag);
      setHasUnsavedChanges(false);
      setSaveError(null);
      setSaveSuccess(null);

      // Jump to the first section that still has blank required fields so user can continue seamlessly
      const aDone =
        Boolean(nextOppName.trim()) &&
        Boolean(nextCompany.trim()) &&
        Boolean(nextIndustry) &&
        Boolean(nextMotion) &&
        Boolean(nextOwner.trim()) &&
        Boolean(nextCountry);
      const bDone =
        Boolean(nextOverview.trim()) &&
        Boolean(nextProblem.trim()) &&
        Boolean(nextSolution.trim());
      const cDone =
        Boolean(nextRev) &&
        Boolean(nextCurrency) &&
        Boolean(nextClosingDate) &&
        Boolean(nextPipeStage) &&
        Boolean(nextOppStage);

      if (!aDone) {
        setActiveSection('A');
      } else if (!bDone) {
        setActiveSection('B');
      } else if (!cDone) {
        setActiveSection('C');
      } else if (draft.summary_status === 'READY' || lockedFlag) {
        setActiveSection('A');
      } else {
        setActiveSection(draft.last_saved_section || 'E');
      }

      if (typeof window !== 'undefined') {
        try {
          if (!lockedFlag && draft.summary_status !== 'READY') {
            localStorage.setItem('revos_latest_created_draft_id', draft.pipeline_id);
          } else {
            PipelineDataService.clearCreatedOpportunityDraftCache(draft.pipeline_id);
          }
        } catch {}
      }

      if (showNotice) {
        const label = nextOppName || nextCompany || draft.pipeline_id;
        if (lockedFlag) {
          setResumedDraftNotice(
            `Read-Only Review: "${label}" (${draft.pipeline_id}) has already entered the assessment process ("Start Assessment" clicked). All fields are locked from editing.`
          );
        } else if (draft.summary_status === 'READY') {
          setResumedDraftNotice(
            `Editing Created opportunity "${label}" (${draft.pipeline_id}). Update any fields (including Industry & Revenue Motion), save changes, and click Re-Submit on Section E to overwrite the summary.`
          );
        } else {
          setResumedDraftNotice(
            `Resumed saved draft "${label}" (${draft.pipeline_id}). Previously saved fields are restored; fill any remaining blank items and save or submit.`
          );
        }
      }

      if (draft.pipeline_id) {
        try {
          const statusRes = await PipelineDataService.getInitialOpportunityContextSummaryStatus(
            draft.pipeline_id
          );
          const resolvedStatus: InitialSummaryStatus =
            statusRes.summary_status && statusRes.summary_status !== 'NOT_GENERATED'
              ? statusRes.summary_status
              : statusRes.summary?.summary_sections
                ? 'READY'
                : 'NOT_GENERATED';
          setSummaryStatus(resolvedStatus);
          setSummaryPayload(statusRes.summary || null);
          setSummaryVersion(
            Number(
              statusRes.summary_version ||
                statusRes.summary?.summary_metadata?.version ||
                0
            )
          );
          setSummaryGeneratedAt(
            statusRes.summary_generated_at ||
              statusRes.summary?.summary_metadata?.generated_at ||
              null
          );
          setSummaryHistory(Array.isArray(statusRes.summary_history) ? statusRes.summary_history : []);
          setSummaryIsStale(Boolean(statusRes.is_stale));
          setSummaryError(statusRes.summary_error || null);
        } catch {
          setSummaryStatus('NOT_GENERATED');
          setSummaryPayload(null);
          setSummaryVersion(0);
          setSummaryGeneratedAt(null);
          setSummaryHistory([]);
          setSummaryIsStale(false);
          setSummaryError(null);
        }
      } else {
        setSummaryStatus('NOT_GENERATED');
        setSummaryPayload(null);
        setSummaryVersion(0);
        setSummaryGeneratedAt(null);
        setSummaryHistory([]);
        setSummaryIsStale(false);
        setSummaryError(null);
      }
    },
    [defaultOwnerForAuth]
  );

  const handleStartFreshForm = () => {
    userEditedRef.current = false;
    lastBootstrappedUrlIdRef.current = '';
    draftBootstrappedRef.current = true;
    setSavedPipelineId(null);
    setHasUnsavedChanges(false);
    setSavedSections([]);
    setSaveSuccess(null);
    setSaveError(null);
    setResumedDraftNotice(null);

    setOpportunityName('');
    setCompanyName('');
    setIndustry('');
    setRevenueMotion('');
    setOpportunityOwner(defaultOwnerForAuth());
    setOwnerTouched(false);
    setCountry('');
    setBusinessSegment('');
    setCreationDate(getDefaultLocalDate());

    setOpportunityOverview('');
    setCustomerBusinessProblem('');
    setProposedSolution('');
    setExpectedBusinessOutcomes('');
    setOpportunityOriginBackground('');

    setEstimatedRevenue('');
    setCurrency('');
    setExpectedClosingDate('');
    setPipelineStage('');
    setOpportunityStage('');
    setCommercialModel('');

    setCurrentEngagementStatus('');
    setKnownCustomerStakeholders('');
    setKnownDecisionMaker('');
    setInternalChampion('');
    setRecentCustomerInteraction('');
    setKnownCompetitors('');

    setKnownCustomerPriorities('');
    setKnownConstraintsChallenges('');
    setAdditionalInformation('');

    setSummaryStatus('NOT_GENERATED');
    setSummaryPayload(null);
    setSummaryVersion(0);
    setSummaryGeneratedAt(null);
    setSummaryHistory([]);
    setSummaryIsStale(false);
    setSummaryError(null);
    setSavedSummaryMessage(null);
    setSaveSummaryError(null);
    setIsLockedReview(false);
    setOpenedFromWorkspace(false);
    setActiveSection('A');

    PipelineDataService.clearCreatedOpportunityDraftCache(null);
    if (searchParams.has('draftId') || searchParams.has('pipelineId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('draftId');
      next.delete('pipelineId');
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const urlPipelineId = searchParams.get('pipelineId') || '';
    const urlDraftId = searchParams.get('draftId') || urlPipelineId;

    if (urlDraftId && urlDraftId !== lastBootstrappedUrlIdRef.current) {
      draftBootstrappedRef.current = false;
      userEditedRef.current = false;
    }

    if (authLoading || draftBootstrappedRef.current) return;
    draftBootstrappedRef.current = true;
    lastBootstrappedUrlIdRef.current = urlDraftId;

    let mounted = true;
    let completed = false;
    setOpenedFromWorkspace(Boolean(urlPipelineId));

    const loadDraftsAndResume = async () => {
      setLoadingDraft(true);
      try {
        const drafts = await PipelineDataService.listCreatedOpportunityDrafts(user);
        if (!mounted) return;

        let targetDraft: CreatedOpportunityDraftRecord | null = null;
        if (urlDraftId) {
          targetDraft =
            drafts.find((d) => d.pipeline_id === urlDraftId) ||
            (await PipelineDataService.getCreatedOpportunityDraft(urlDraftId));
          if (
            mounted &&
            targetDraft &&
            !drafts.some((d) => d.pipeline_id === targetDraft!.pipeline_id)
          ) {
            setAvailableDrafts([targetDraft, ...drafts]);
          } else if (mounted) {
            setAvailableDrafts(drafts);
          }
        } else {
          setAvailableDrafts(drafts);
          let storedDraftId = '';
          if (typeof window !== 'undefined') {
            try {
              storedDraftId = localStorage.getItem('revos_latest_created_draft_id') || '';
            } catch {}
          }
          if (storedDraftId) {
            targetDraft =
              drafts.find((d) => d.pipeline_id === storedDraftId) ||
              (await PipelineDataService.getCreatedOpportunityDraft(storedDraftId));
          } else if (drafts.length > 0) {
            targetDraft =
              drafts.find((d) => d.summary_status !== 'READY' && !d.assessment_locked) || null;
          }
        }

        if (!mounted) return;

        const shouldHydrate = Boolean(
          targetDraft &&
            (Boolean(urlDraftId) ||
              (targetDraft.summary_status !== 'READY' && !targetDraft.assessment_locked))
        );

        if (mounted && targetDraft && shouldHydrate && !userEditedRef.current) {
          await hydrateFormFromDraft(targetDraft, true);
        }
        if (mounted) {
          completed = true;
        }
      } catch (err) {
        console.warn('Unable to load saved opportunity drafts:', err);
      } finally {
        if (mounted) setLoadingDraft(false);
      }
    };

    void loadDraftsAndResume();
    return () => {
      mounted = false;
      if (!completed) {
        draftBootstrappedRef.current = false;
      }
    };
  }, [authLoading, user, searchParams, hydrateFormFromDraft]);

  const handleCloseForm = () => {
    if (
      typeof window !== 'undefined' &&
      savedPipelineId &&
      summaryStatus !== 'READY' &&
      !isLockedReview
    ) {
      try {
        localStorage.setItem('revos_latest_created_draft_id', savedPipelineId);
      } catch {}
    }
    if (onBack) {
      onBack();
    } else {
      navigate('/product/revos/pipeline');
    }
  };

  const handleBackNavigation = () => {
    handleCloseForm();
  };

  const handleOpenCanvasAtColumn = (
    _targetColumn: CanvasColumnKey,
    pipelineId?: string | null
  ) => {
    invalidatePipelinePortfolioCache();
    PipelineDataService.emitPortfolioUpdated();
    navigate(
      pipelineId
        ? `/product/revos/pipeline?highlight=${encodeURIComponent(pipelineId)}`
        : '/product/revos/pipeline'
    );
  };

  const handlePreviousSection = () => {
    const order: SectionKey[] = ['A', 'B', 'C', 'D', 'E'];
    const idx = order.indexOf(activeSection);
    if (idx > 0) {
      setActiveSection(order[idx - 1]);
    }
  };

  const handleNextSection = () => {
    if (!canAdvanceSection) return;
    const order: SectionKey[] = ['A', 'B', 'C', 'D', 'E'];
    const idx = order.indexOf(activeSection);
    if (idx >= 0 && idx < order.length - 1) {
      setActiveSection(order[idx + 1]);
    }
  };

  const handleSaveToSupabase = async () => {
    if (isLockedReview || !hasAnySaveableInput || saving || submittingSummary) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const { canonicalId: canonicalIndustryId } = PipelineConfigService.normalizeIndustryId(industry);
      const canonicalMotionId = PipelineConfigService.normalizeRevenueMotionId(revenueMotion);
      const numericRevenue = parseFloat(parseRevenueAmount(estimatedRevenue)) || 0;
      const mergedSavedSections = Array.from(
        new Set<SectionKey>([...savedSections, ...sectionsWithEnteredData, activeSection])
      );
      const isDraftSave = !validation.allComplete;

      const payload: CreatedOpportunityFormInput = {
        pipeline_id: savedPipelineId || undefined,
        is_draft: isDraftSave,
        last_saved_section: activeSection,
        saved_sections: mergedSavedSections,
        source: 'Created',
        opportunity_name: opportunityName.trim(),
        company_name: companyName.trim(),
        industry,
        industry_id: canonicalIndustryId,
        revenue_motion: revenueMotion,
        revenue_motion_id: canonicalMotionId,
        opportunity_owner: opportunityOwner.trim(),
        country,
        business_segment: businessSegment.trim(),
        creation_date: creationDate,
        opportunity_overview: opportunityOverview.trim(),
        customer_business_problem: customerBusinessProblem.trim(),
        proposed_solution: proposedSolution.trim(),
        expected_business_outcomes: expectedBusinessOutcomes.trim(),
        opportunity_origin_background: opportunityOriginBackground.trim(),
        estimated_revenue: numericRevenue,
        currency,
        currency_symbol: activeCurrencySymbol,
        expected_closing_date: expectedClosingDate,
        pipeline_stage: pipelineStage,
        opportunity_stage: opportunityStage,
        commercial_model: commercialModel.trim(),
        current_engagement_status: currentEngagementStatus.trim(),
        known_customer_stakeholders: knownCustomerStakeholders.trim(),
        known_decision_maker: knownDecisionMaker.trim(),
        internal_champion: internalChampion.trim(),
        recent_customer_interaction: recentCustomerInteraction.trim(),
        known_competitors: knownCompetitors.trim(),
        known_customer_priorities: knownCustomerPriorities.trim(),
        known_constraints_challenges: knownConstraintsChallenges.trim(),
        additional_information: additionalInformation.trim()
      };

      const { opportunity, isNew } = await PipelineDataService.saveCreatedOpportunity(payload, user);
      setSavedPipelineId(opportunity.pipeline_id);
      setSavedSections(mergedSavedSections);
      setHasUnsavedChanges(false);
      setResumedDraftNotice(null);

      setAvailableDrafts((prev) => {
        const updatedRecord: CreatedOpportunityDraftRecord = {
          pipeline_id: opportunity.pipeline_id,
          updated_at: new Date().toISOString(),
          company_name: companyName.trim(),
          opportunity_name: opportunityName.trim(),
          last_saved_section: activeSection,
          saved_sections: mergedSavedSections,
          initial_context: payload,
          summary_status: summaryStatus,
          assessment_started: false,
          assessment_locked: false
        };
        const remaining = prev.filter((d) => d.pipeline_id !== opportunity.pipeline_id);
        return [updatedRecord, ...remaining];
      });

      const displayLabel =
        opportunityName.trim() || companyName.trim() || opportunity.pipeline_id;

      setSaveSuccess(
        isDraftSave
          ? `Section ${activeSection} saved as draft ("${displayLabel}" · ${opportunity.pipeline_id}). You can continue filling blank items in other sections or close and resume later.`
          : isNew
            ? `Opportunity "${displayLabel}" saved to Supabase (${opportunity.pipeline_id}) with Source = "Created".`
            : summaryStatus === 'READY'
              ? `Opportunity "${displayLabel}" updated in Supabase (${opportunity.pipeline_id}). Navigate to Section E and click Re-Submit to regenerate and overwrite the summary.`
              : `Opportunity "${displayLabel}" updated in Supabase (${opportunity.pipeline_id}).`
      );

      // Refresh Canvas & re-check staleness when updating an existing READY Created opportunity
      if (!isNew && summaryStatus === 'READY') {
        invalidatePipelinePortfolioCache();
        PipelineDataService.emitPortfolioUpdated();
        try {
          const statusRes = await PipelineDataService.getInitialOpportunityContextSummaryStatus(
            opportunity.pipeline_id
          );
          setSummaryIsStale(Boolean(statusRes.is_stale));
        } catch {
          setSummaryIsStale(true);
        }
      }
    } catch (err: any) {
      console.error('Failed to save created opportunity to Supabase:', err);
      setSaveError(
        err?.message || 'Failed to save Opportunity to Supabase database. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const triggerInitialSummaryGeneration = async (options?: {
    forceRegenerate?: boolean;
    retry?: boolean;
  }) => {
    if (isLockedReview || !savedPipelineId || !validation.allComplete || hasUnsavedChanges || saving)
      return;
    if (submitInFlightRef.current || submittingSummary) return;

    submitInFlightRef.current = true;
    setSubmittingSummary(true);
    setSummaryStatus('GENERATING');
    setSummaryError(null);
    setSavedSummaryMessage(null);
    setSaveSummaryError(null);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        summarySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    try {
      const result = await PipelineDataService.generateInitialOpportunityContextSummary(
        savedPipelineId,
        {
          forceRegenerate: Boolean(options?.forceRegenerate || summaryIsStale),
          retry: Boolean(options?.retry || summaryStatus === 'FAILED')
        }
      );

      setSummaryStatus(result.summary_status || 'READY');
      setSummaryPayload(result.summary || null);
      setSummaryVersion(Number(result.summary_version || 1));
      setSummaryGeneratedAt(
        result.summary_generated_at || result.summary?.summary_metadata?.generated_at || null
      );
      setSummaryHistory(Array.isArray(result.summary_history) ? result.summary_history : []);
      setSummaryIsStale(Boolean(result.is_stale));
      setSummaryError(null);

      // Refresh Pipeline Canvas portfolio and update selector entry status to READY
      PipelineDataService.clearCreatedOpportunityDraftCache(savedPipelineId);
      setAvailableDrafts((prev) =>
        prev.map((d) =>
          d.pipeline_id === savedPipelineId
            ? { ...d, summary_status: 'READY', updated_at: new Date().toISOString() }
            : d
        )
      );
      setResumedDraftNotice(null);
      invalidatePipelinePortfolioCache();
      PipelineDataService.emitPortfolioUpdated();
      void loadCanonicalPipelinePortfolio({ forceRefresh: true }).catch(() => {});

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          summarySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (err: any) {
      console.error('Initial Opportunity Context Summary generation failed:', err);
      if (err?.code === 'GENERATION_IN_PROGRESS' || err?.httpStatus === 409) {
        setSummaryStatus('GENERATING');
        setSummaryError(
          'Summary generation is already running in the backend. Your created opportunity remains safely saved.'
        );
      } else {
        setSummaryStatus('FAILED');
        setSummaryError(
          err?.message ||
            'Initial Opportunity Context Summary generation failed. Your opportunity record remains safely saved and you can retry.'
        );
      }
    } finally {
      submitInFlightRef.current = false;
      setSubmittingSummary(false);
    }
  };

  const handleSubmit = () => {
    if (isLockedReview || !isSubmitEnabled) return;
    void triggerInitialSummaryGeneration({
      forceRegenerate: Boolean(summaryStatus === 'READY' || summaryIsStale),
      retry: summaryStatus === 'FAILED'
    });
  };

  const handleSaveSummary = async (
    summaryToSave: InitialOpportunityContextSummaryPayload,
    versionToSave: number
  ) => {
    if (isLockedReview || !savedPipelineId || savingSummary || submittingSummary) return;
    setSavingSummary(true);
    setSavedSummaryMessage(null);
    setSaveSummaryError(null);
    try {
      const { canonicalId: canonicalIndustryId } =
        PipelineConfigService.normalizeIndustryId(industry);
      const canonicalMotionId =
        PipelineConfigService.normalizeRevenueMotionId(revenueMotion);
      const { summaryVersion: persistedVersion } =
        await PipelineDataService.saveInitialOpportunityContextSummary(
          savedPipelineId,
          summaryToSave,
          {
            summaryVersion: versionToSave,
            summaryGeneratedAt:
              summaryToSave.summary_metadata?.generated_at || summaryGeneratedAt,
            summaryHistory,
            industry: industry.trim(),
            industryId: canonicalIndustryId,
            revenueMotion: revenueMotion.trim(),
            revenueMotionId: canonicalMotionId
          }
        );
      setSummaryPayload(summaryToSave);
      setSummaryVersion(persistedVersion);
      invalidatePipelinePortfolioCache();
      PipelineDataService.emitPortfolioUpdated();
      setSavedSummaryMessage(
        `Initial Opportunity Context Summary (v${persistedVersion}) saved to Supabase (${savedPipelineId}).`
      );
    } catch (err: any) {
      setSaveSummaryError(
        err?.message || 'Failed to save Initial Opportunity Context Summary to Supabase.'
      );
    } finally {
      setSavingSummary(false);
    }
  };

  const activeSectionMeta = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <button
            type="button"
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Pipeline Assessment Canvas</span>
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-text-primary font-medium">Create Opportunity</span>
        </div>

        <div className="flex items-center gap-2.5 text-[10px] font-mono text-text-secondary">
          <span className="px-2.5 py-1 rounded-lg bg-bg-surface border border-border">
            Required: {validation.completedRequired} / {validation.totalRequired}
          </span>
          {savedPipelineId && !hasUnsavedChanges && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold">
              Saved: {savedPipelineId}
            </span>
          )}
        </div>
      </div>

      {/* Main Form Card matching PipelineForm design system */}
      <div className="bg-bg-surface border border-border rounded-2xl shadow-sm overflow-hidden p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="border-b border-border/70 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-black text-text-primary uppercase tracking-tight">
                Opportunity Creation Form
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono font-black text-[9px] uppercase tracking-wider">
                Pipeline Assessment Engine
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Create a new opportunity directly inside the Pipeline Assessment Engine. Complete all required fields across Sections A–C, save to Supabase, and prepare for Initial Opportunity Context Summary generation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#00a3ff] bg-[#00a3ff]/10 px-3 py-1.5 rounded-xl border border-[#00a3ff]/30">
              <Lock className="h-3 w-3" />
              <span className="font-bold">
                {isLockedReview ? 'Review Only (Locked)' : 'Source: Created'}
              </span>
            </div>

            {openedFromWorkspace && savedPipelineId && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/product/revos/pipeline?opportunityId=${encodeURIComponent(savedPipelineId)}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 border border-accent/35 hover:bg-accent/25 text-xs font-semibold text-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Assessment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-primary border border-border hover:border-text-secondary/60 text-xs font-semibold text-text-primary transition-colors cursor-pointer whitespace-nowrap"
              title="Close Opportunity Creation Form"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Saved Drafts & Created Opportunity Selector Strip */}
        <div className="px-4 py-3 rounded-xl bg-bg-primary/50 border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start md:items-center gap-2.5 text-text-secondary min-w-0">
            {loadingDraft ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin shrink-0 mt-0.5 md:mt-0" />
                <span>Loading saved Created opportunities & drafts...</span>
              </>
            ) : isLockedReview ? (
              <>
                <Eye className="h-3.5 w-3.5 text-[#00a3ff] shrink-0 mt-0.5 md:mt-0" />
                <span className="leading-relaxed text-text-primary">
                  {resumedDraftNotice ||
                    'Assessment started — this Created opportunity is open in Read-Only Review mode.'}
                </span>
              </>
            ) : availableDrafts.length > 0 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5 md:mt-0" />
                <span className="leading-relaxed">
                  {resumedDraftNotice ||
                    `${availableDrafts.length} Created opportunit${availableDrafts.length === 1 ? 'y' : 'ies'} available. Select one to edit, resume draft, or review.`}
                </span>
              </>
            ) : (
              <>
                <Briefcase className="h-3.5 w-3.5 text-text-secondary shrink-0 mt-0.5 md:mt-0" />
                <span className="leading-relaxed">
                  {resumedDraftNotice ||
                    'No saved Created opportunities or drafts yet for your account. Complete the form below to create one.'}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {availableDrafts.length > 0 && (() => {
              const draftsGroup = availableDrafts.filter(
                (d) => d.summary_status !== 'READY' && !d.assessment_locked
              );
              const editableCreatedGroup = availableDrafts.filter(
                (d) => d.summary_status === 'READY' && !d.assessment_locked
              );
              const lockedReviewGroup = availableDrafts.filter((d) =>
                Boolean(d.assessment_locked)
              );
              return (
                <select
                  aria-label="Select Created opportunity or draft"
                  value={savedPipelineId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) {
                      handleStartFreshForm();
                      return;
                    }
                    const found = availableDrafts.find((d) => d.pipeline_id === selectedId);
                    if (found) {
                      void hydrateFormFromDraft(found, true);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border text-[11px] text-text-primary focus:outline-none focus:border-accent cursor-pointer max-w-[320px] sm:max-w-[360px]"
                >
                  <option value="">
                    -- New Blank Form ({availableDrafts.length} saved) --
                  </option>
                  {editableCreatedGroup.length > 0 && (
                    <optgroup label="Saved Created Opportunities (Editable)">
                      {editableCreatedGroup.map((item) => (
                        <option key={item.pipeline_id} value={item.pipeline_id}>
                          {item.opportunity_name || item.company_name || item.pipeline_id} (Editable)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {draftsGroup.length > 0 && (
                    <optgroup label="In-Progress Drafts (Editable)">
                      {draftsGroup.map((draft) => (
                        <option key={draft.pipeline_id} value={draft.pipeline_id}>
                          {draft.opportunity_name || draft.company_name || 'Untitled Draft'} (
                          {draft.last_saved_section || 'A'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {lockedReviewGroup.length > 0 && (
                    <optgroup label="In Assessment — Locked (Review Only)">
                      {lockedReviewGroup.map((item) => (
                        <option key={item.pipeline_id} value={item.pipeline_id}>
                          {item.opportunity_name || item.company_name || item.pipeline_id} (Review Only)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              );
            })()}

            {savedPipelineId && (
              <button
                type="button"
                onClick={handleStartFreshForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border hover:border-accent/60 text-[11px] font-semibold text-text-primary transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Start New</span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Tab Bar for Sections A to E */}
        <div className="p-3.5 rounded-2xl bg-bg-primary/40 border border-border/80">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">
              Opportunity Creation Sections (A – E)
            </span>
            <span className="text-[11px] font-bold text-accent">
              {activeSectionMeta.code}: {activeSectionMeta.title}
            </span>
          </div>

          <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar-horizontal py-1 pb-2 flex items-center gap-2">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.key;
              const isComplete = validation.completeBySection[sec.key];
              const isSectionSaved = Boolean(savedPipelineId) && savedSections.includes(sec.key);
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-accent border-accent text-black font-black shadow-md shadow-accent/15'
                      : 'bg-bg-surface border-border/70 text-text-secondary hover:text-text-primary hover:border-text-secondary/40'
                  }`}
                >
                  <span className="font-mono">{sec.key}.</span>
                  <span>{sec.title}</span>
                  {isSectionSaved && (
                    <CheckCircle2
                      className={`h-3 w-3 shrink-0 ${
                        isActive ? 'text-black' : 'text-emerald-500'
                      }`}
                      aria-label={`Section ${sec.key} saved`}
                    />
                  )}
                  {sec.hasRequired ? (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-black/15 text-black'
                          : isComplete
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {isComplete ? 'Complete' : 'Required'}
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-black/15 text-black'
                          : 'bg-bg-primary/70 text-text-secondary/80'
                      }`}
                    >
                      Optional
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Notifications */}
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

        {savedPipelineId && hasUnsavedChanges && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium rounded-xl flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              You have modified form fields after saving. Click <strong>Save</strong> to update the Supabase record before closing or submitting.
            </span>
          </div>
        )}

        {/* Read-Only Lock Banner when opportunity has entered Assessment Process */}
        {isLockedReview && (
          <div className="p-3.5 bg-[#00a3ff]/10 border border-[#00a3ff]/30 text-text-primary text-xs rounded-xl flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-[#00a3ff] shrink-0" />
            <span>
              <strong>Read-Only Review Mode:</strong> You clicked <strong>Start Assessment</strong> on this opportunity, so all creation fields across Sections A–E are locked from editing. Use the section tabs or Next/Back to inspect your submission.
            </span>
          </div>
        )}

        {/* Section Subtitle Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
              {activeSectionMeta.code} — {activeSectionMeta.title}
            </h2>
            <p className="text-[11px] text-text-secondary mt-0.5">{activeSectionMeta.subtitle}</p>
          </div>
          {validation.missingBySection[activeSection].length > 0 && (
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Missing required: {validation.missingBySection[activeSection].join(', ')}
            </span>
          )}
        </div>

        <fieldset
          disabled={isLockedReview}
          className={`border-0 p-0 m-0 min-w-0 ${isLockedReview ? 'opacity-90' : ''}`}
        >
        {/* SECTION A: Opportunity Identity */}
        {activeSection === 'A' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Source (Locked - Automatically Set to "Created") */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-[#00a3ff]" />
                  <span>Source</span>
                </label>
                <span className="text-[9px] font-mono text-[#00a3ff] bg-[#00a3ff]/10 px-2 py-0.5 rounded-md border border-[#00a3ff]/25">
                  System Locked
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={sourceValue}
                aria-label="Source"
                className="w-full px-3.5 py-2.5 bg-bg-primary/30 border border-border/60 rounded-xl text-xs font-sans font-semibold text-text-secondary cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Automatically assigned as &ldquo;Created&rdquo; for direct Pipeline Assessment entry
              </span>
            </div>

            {/* Opportunity Owner */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-owner"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <User className="h-3 w-3 text-text-secondary/70" />
                <span>Opportunity Owner</span>
                <span className="text-accent">*</span>
              </label>
              <input
                id="opp-create-owner"
                type="text"
                required
                value={opportunityOwner}
                onChange={(e) => {
                  setOwnerTouched(true);
                  setOpportunityOwner(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Sarah Jenkins (Enterprise AE)"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Assigned AE / owner accountable for this opportunity
              </span>
            </div>

            {/* Opportunity Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-name"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Briefcase className="h-3 w-3 text-text-secondary/70" />
                <span>Opportunity Name</span>
                <span className="text-accent">*</span>
              </label>
              <input
                id="opp-create-name"
                type="text"
                required
                value={opportunityName}
                onChange={(e) => {
                  setOpportunityName(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Acme Petrochemical — Predictive Maintenance Platform"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Formal commercial name identifying the opportunity
              </span>
            </div>

            {/* Customer / Company Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-company"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Building2 className="h-3 w-3 text-text-secondary/70" />
                <span>Customer / Company Name</span>
                <span className="text-accent">*</span>
              </label>
              <input
                id="opp-create-company"
                type="text"
                required
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Acme Petrochemical Corporation"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Customer organization entity name
              </span>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-industry"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Layers className="h-3 w-3 text-text-secondary/70" />
                <span>Industry</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-industry"
                required
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Industry
                </option>
                {INDUSTRY_OPTIONS.map((item) => (
                  <option key={item} value={item} className="bg-bg-surface text-text-primary">
                    {item}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Canonical RevOS industry taxonomy (16 profiles)
              </span>
            </div>

            {/* Revenue Motion */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-motion"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                <span>Revenue Motion</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-motion"
                required
                value={revenueMotion}
                onChange={(e) => {
                  setRevenueMotion(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Revenue Motion
                </option>
                {REVENUE_MOTION_OPTIONS.map((rm) => (
                  <option key={rm} value={rm} className="bg-bg-surface text-text-primary">
                    {rm}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Canonical RevOS revenue motion classification (6 families)
              </span>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-country"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Globe className="h-3 w-3 text-text-secondary/70" />
                <span>Country</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-country"
                required
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Country
                </option>
                {STANDARD_COUNTRIES.map((countryName) => (
                  <option key={countryName} value={countryName} className="bg-bg-surface text-text-primary">
                    {countryName}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Primary country where the opportunity is located
              </span>
            </div>

            {/* Business Segment */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-business-segment"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Layers className="h-3 w-3 text-text-secondary/70" />
                <span>Business Segment</span>
              </label>
              <input
                id="opp-create-business-segment"
                type="text"
                value={businessSegment}
                onChange={(e) => {
                  setBusinessSegment(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Enterprise Manufacturing / Mid-Market Retail"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Customer business segment or commercial vertical focus
              </span>
            </div>

            {/* Creation Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-creation-date"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Calendar className="h-3 w-3 text-text-secondary/70" />
                <span>Creation Date</span>
              </label>
              <input
                id="opp-create-creation-date"
                type="date"
                value={creationDate}
                onChange={(e) => {
                  setCreationDate(e.target.value);
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-sans transition-all text-text-primary"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Date on which this opportunity was created
              </span>
            </div>
          </div>
        )}

        {/* SECTION B: Opportunity Description */}
        {activeSection === 'B' && (
          <div className="space-y-5">
            {/* Opportunity Overview (Required) */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-overview"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <FileText className="h-3 w-3 text-text-secondary/70" />
                <span>Opportunity Overview</span>
                <span className="text-accent">*</span>
              </label>
              <textarea
                id="opp-create-overview"
                rows={3}
                required
                value={opportunityOverview}
                onChange={(e) => {
                  setOpportunityOverview(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Implementation of an AI-powered predictive maintenance solution for a chemical manufacturing facility."
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Customer's Business Problem (Required) */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-problem"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <ShieldAlert className="h-3 w-3 text-text-secondary/70" />
                <span>Customer&apos;s Business Problem</span>
                <span className="text-accent">*</span>
              </label>
              <textarea
                id="opp-create-problem"
                rows={3}
                required
                value={customerBusinessProblem}
                onChange={(e) => {
                  setCustomerBusinessProblem(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Unexpected equipment failures are causing production interruptions and increasing maintenance costs."
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Proposed Solution / Offering (Required) */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-solution"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-text-secondary/70" />
                <span>Proposed Solution / Offering</span>
                <span className="text-accent">*</span>
              </label>
              <textarea
                id="opp-create-solution"
                rows={3}
                required
                value={proposedSolution}
                onChange={(e) => {
                  setProposedSolution(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. An integrated predictive maintenance platform using equipment sensor data and AI-based failure prediction."
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Expected Business Outcomes (Recommended / Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-outcomes"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                  <span>Expected Business Outcomes</span>
                </label>
                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Recommended
                </span>
              </div>
              <textarea
                id="opp-create-outcomes"
                rows={3}
                value={expectedBusinessOutcomes}
                onChange={(e) => {
                  setExpectedBusinessOutcomes(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Reduced unplanned downtime, lower maintenance costs and improved production reliability."
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Opportunity Origin / Background (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-origin"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <FileText className="h-3 w-3 text-text-secondary/70" />
                  <span>Opportunity Origin / Background</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-origin"
                rows={2}
                value={opportunityOriginBackground}
                onChange={(e) => {
                  setOpportunityOriginBackground(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Executive sponsor referral, strategic account expansion, or proactive RFP invitation."
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>
          </div>
        )}

        {/* SECTION C: Commercial Information */}
        {activeSection === 'C' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Estimated Revenue */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-revenue"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <DollarSign className="h-3 w-3 text-text-secondary/70" />
                <span>Estimated Revenue</span>
                <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-text-secondary">
                  {activeCurrencySymbol}
                </span>
                <input
                  id="opp-create-revenue"
                  type="text"
                  required
                  value={formatCurrencyDisplay(estimatedRevenue)}
                  onChange={(e) => {
                    setEstimatedRevenue(parseRevenueAmount(e.target.value));
                    markDirty();
                  }}
                  placeholder="250,000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-mono font-bold tabular-nums transition-all text-text-primary placeholder-text-secondary/40"
                />
              </div>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Estimated total contract or annual deal valuation
              </span>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-currency"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <DollarSign className="h-3 w-3 text-text-secondary/70" />
                <span>Currency</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-currency"
                required
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Currency
                </option>
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code} className="bg-bg-surface text-text-primary">
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Transaction currency following RevOS commercial standards
              </span>
            </div>

            {/* Expected Closing Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-close-date"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Calendar className="h-3 w-3 text-text-secondary/70" />
                <span>Expected Closing Date</span>
                <span className="text-accent">*</span>
              </label>
              <input
                id="opp-create-close-date"
                type="date"
                required
                value={expectedClosingDate}
                onChange={(e) => {
                  setExpectedClosingDate(e.target.value);
                  markDirty();
                }}
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs font-sans transition-all text-text-primary"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Anticipated contract execution / close date
              </span>
            </div>

            {/* Pipeline Stage */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-pipeline-stage"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <Layers className="h-3 w-3 text-text-secondary/70" />
                <span>Pipeline Stage</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-pipeline-stage"
                required
                value={pipelineStage}
                onChange={(e) => {
                  setPipelineStage(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Pipeline Stage
                </option>
                {PIPELINE_STAGE_OPTIONS.map((ps) => (
                  <option key={ps} value={ps} className="bg-bg-surface text-text-primary">
                    {ps}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Formal CRM pipeline classification stage
              </span>
            </div>

            {/* Opportunity Stage */}
            <div className="space-y-1.5">
              <label
                htmlFor="opp-create-opp-stage"
                className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
              >
                <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                <span>Opportunity Stage</span>
                <span className="text-accent">*</span>
              </label>
              <select
                id="opp-create-opp-stage"
                required
                value={opportunityStage}
                onChange={(e) => {
                  setOpportunityStage(e.target.value);
                  markDirty();
                }}
                className="w-full bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans cursor-pointer text-text-primary"
              >
                <option value="" className="bg-bg-surface text-text-secondary">
                  Select Opportunity Stage
                </option>
                {OPPORTUNITY_STAGE_OPTIONS.map((os) => (
                  <option key={os} value={os} className="bg-bg-surface text-text-primary">
                    {os}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Buyer progression milestone state
              </span>
            </div>

            {/* Commercial Model (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-commercial-model"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <Briefcase className="h-3 w-3 text-text-secondary/70" />
                  <span>Commercial Model</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <input
                id="opp-create-commercial-model"
                type="text"
                value={commercialModel}
                onChange={(e) => {
                  setCommercialModel(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Annual SaaS Subscription, Fixed-Price Project, Managed Services"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
              <span className="text-[10px] text-text-secondary/60 font-mono block">
                Pricing, licensing, or contracting structure
              </span>
            </div>
          </div>
        )}

        {/* SECTION D: Customer Engagement & Stakeholders (Optional) */}
        {activeSection === 'D' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Current Engagement Status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-engagement-status"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                  <span>Current Engagement Status</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <input
                id="opp-create-engagement-status"
                type="text"
                value={currentEngagementStatus}
                onChange={(e) => {
                  setCurrentEngagementStatus(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Active discovery sessions underway with engineering leadership"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
            </div>

            {/* Known Decision Maker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-decision-maker"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <User className="h-3 w-3 text-text-secondary/70" />
                  <span>Known Decision Maker</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <input
                id="opp-create-decision-maker"
                type="text"
                value={knownDecisionMaker}
                onChange={(e) => {
                  setKnownDecisionMaker(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. SVP of Global Manufacturing Operations"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
            </div>

            {/* Internal Champion */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-champion"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <Users className="h-3 w-3 text-text-secondary/70" />
                  <span>Internal Champion</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <input
                id="opp-create-champion"
                type="text"
                value={internalChampion}
                onChange={(e) => {
                  setInternalChampion(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Director of Plant Reliability & Asset Performance"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
            </div>

            {/* Known Competitors */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-competitors"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3 w-3 text-text-secondary/70" />
                  <span>Known Competitors</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <input
                id="opp-create-competitors"
                type="text"
                value={knownCompetitors}
                onChange={(e) => {
                  setKnownCompetitors(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Incumbent SCADA vendor, in-house engineering build"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40"
              />
            </div>

            {/* Known Customer Stakeholders */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-stakeholders"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <Users className="h-3 w-3 text-text-secondary/70" />
                  <span>Known Customer Stakeholders</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-stakeholders"
                rows={2}
                value={knownCustomerStakeholders}
                onChange={(e) => {
                  setKnownCustomerStakeholders(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. VP Operations (Executive Sponsor), Lead OT Architect (Technical Evaluator), IT Security Lead, Procurement Manager"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Recent Customer Interaction */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-interaction"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <FileText className="h-3 w-3 text-text-secondary/70" />
                  <span>Recent Customer Interaction</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-interaction"
                rows={2}
                value={recentCustomerInteraction}
                onChange={(e) => {
                  setRecentCustomerInteraction(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Architecture discovery workshop completed; customer requested pilot scope and ROI model"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>
          </div>
        )}

        {/* SECTION E: Additional Context (Optional) & Readiness Summary */}
        {activeSection === 'E' && (
          <div className="space-y-5">
            {/* Known Customer Priorities */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-priorities"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 text-text-secondary/70" />
                  <span>Known Customer Priorities</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-priorities"
                rows={3}
                value={knownCustomerPriorities}
                onChange={(e) => {
                  setKnownCustomerPriorities(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Eliminate critical compressor downtime before Q3 turnaround and standardize telemetry across 4 plants"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Known Constraints / Challenges */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-constraints"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3 w-3 text-text-secondary/70" />
                  <span>Known Constraints / Challenges</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-constraints"
                rows={3}
                value={knownConstraintsChallenges}
                onChange={(e) => {
                  setKnownConstraintsChallenges(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Strict OT/IT air-gap cybersecurity policy and annual CapEx budget freeze after November"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="opp-create-additional"
                  className="text-[10px] uppercase font-black tracking-wider text-text-secondary flex items-center gap-1.5"
                >
                  <FileText className="h-3 w-3 text-text-secondary/70" />
                  <span>Additional Information</span>
                </label>
                <span className="text-[9px] font-mono text-text-secondary bg-bg-primary/60 px-2 py-0.5 rounded-md border border-border">
                  Optional
                </span>
              </div>
              <textarea
                id="opp-create-additional"
                rows={3}
                value={additionalInformation}
                onChange={(e) => {
                  setAdditionalInformation(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Partner co-sell notes, regulatory timeline, or special executive context"
                className="w-full px-3.5 py-2.5 bg-bg-primary/50 border border-border focus:border-accent/50 focus:outline-none rounded-xl text-xs transition-all font-sans text-text-primary placeholder-text-secondary/40 resize-y"
              />
            </div>

            {/* Required Fields Completion Gate Summary on Section E */}
            {!validation.allComplete && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Complete all required fields in Sections A–C before saving and submitting:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {(['A', 'B', 'C'] as const).map((secKey) => {
                    const missing = validation.missingBySection[secKey];
                    if (missing.length === 0) return null;
                    return (
                      <button
                        key={secKey}
                        type="button"
                        onClick={() => setActiveSection(secKey)}
                        className="px-2.5 py-1 rounded-lg bg-bg-surface border border-amber-500/30 text-amber-500 hover:border-amber-500 transition-colors cursor-pointer text-left"
                      >
                        <strong className="font-mono">Section {secKey}:</strong>{' '}
                        {missing.join(', ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        </fieldset>

        {/* Form Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-border/70">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Database className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-mono text-[11px]">
                Database Target: Supabase Cloud (Data API Compliant)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2.5 bg-bg-primary border border-border hover:border-text-secondary/50 text-text-primary font-bold uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />
              <span>Close</span>
            </button>

            {activeSection !== 'A' && (
              <button
                type="button"
                onClick={handlePreviousSection}
                className="px-4 py-2.5 bg-bg-primary border border-border hover:border-text-secondary/50 text-text-primary font-bold uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            {/* Save Button: enabled section-by-section before Start Assessment; hidden in Read-Only Review mode */}
            {!isLockedReview && (
              <button
                type="button"
                onClick={handleSaveToSupabase}
                disabled={!isSaveEnabled}
                className="px-5 py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-black uppercase text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>
                      {!validation.allComplete
                        ? `Save Section ${activeSection}`
                        : savedPipelineId
                          ? 'Save Changes'
                          : 'Save'}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Sections A-D: Next Button */}
            {activeSection !== 'E' ? (
              <button
                type="button"
                onClick={handleNextSection}
                disabled={!canAdvanceSection}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              /* Last Section (Section E) Right-Bottom Corner: Submit / Re-Submit Button (hidden in Read-Only Review mode) */
              !isLockedReview && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isSubmitEnabled}
                  className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-accent/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {submittingSummary ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating Summary...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {summaryStatus === 'FAILED'
                          ? 'Retry Submit'
                          : summaryStatus === 'READY'
                            ? 'Re-Submit'
                            : 'Submit'}
                      </span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Standalone Initial Opportunity Context Summary displayed directly below the Opportunity Creation Form */}
      {(summaryStatus !== 'NOT_GENERATED' || Boolean(summaryPayload?.summary_sections)) && (
        <div ref={summarySectionRef}>
          <InitialOpportunityContextSummary
            pipelineId={savedPipelineId}
            opportunityName={opportunityName}
            companyName={companyName}
            pipelineStage={pipelineStage}
            industry={industry}
            revenueMotion={revenueMotion}
            summaryStatus={summaryStatus}
            summaryPayload={summaryPayload}
            summaryVersion={summaryVersion}
            summaryGeneratedAt={summaryGeneratedAt}
            summaryHistory={summaryHistory}
            isStale={summaryIsStale}
            summaryError={summaryError}
            hasUnsavedChanges={hasUnsavedChanges}
            submittingSummary={submittingSummary}
            savingSummary={savingSummary}
            savedSummaryMessage={savedSummaryMessage}
            saveSummaryError={saveSummaryError}
            isAssessmentLocked={isLockedReview}
            onSaveSummary={handleSaveSummary}
            onRetry={() => triggerInitialSummaryGeneration({ retry: true })}
            onOpenPipelineCanvas={handleOpenCanvasAtColumn}
          />
        </div>
      )}
    </div>
  );
};

export default OpportunityCreationForm;
