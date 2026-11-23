import industryConfigRaw from '../../../../config/Pipeline_industry_configuration_JSON_v1.1.json';
import evidenceKbRaw from '../../../../config/Pipeline_evidence_knowledge_base_v1.1.json';
import rulesRaw from '../../../../config/Pipeline_Assessment_Rules_v1.1.json';
import { 
  CanonicalRevenueMotionId, 
  PADFDimensionId, 
  PipelineHealthIndicator,
  SWOTCategory 
} from '../../types/pipeline';

export interface SWOTFactorDefinition {
  factor_type_id: string;
  factor_name: string;
  factor_description: string;
  factor_classification: SWOTCategory;
  analytical_criteria?: string[];
  evidence_expectations?: string[];
  related_padf_dimensions?: string[];
  layer: 'universal_baseline' | 'revenue_motion_override' | 'industry_override';
  context_id: string;
}

export interface ActiveFactorResolutionResult {
  universalFactors: SWOTFactorDefinition[];
  revenueMotionFactors: SWOTFactorDefinition[];
  industryFactors: SWOTFactorDefinition[];
  active16Factors: SWOTFactorDefinition[];
  canonicalRevenueMotionId: CanonicalRevenueMotionId;
  canonicalIndustryId: string;
  industryName: string;
  revenueMotionName: string;
}

export interface EvidenceMappingRecord {
  mappingId: string;
  evidenceObjectId: string;
  factorId: string;
  mappingStatus: string;
  mappingStrength: 'DIRECT' | 'SUPPORTING' | 'INDIRECT';
  evidenceRole: string;
  mappingScope: {
    scopeType: string;
    contextId: string;
  };
  padfRelationship?: {
    relationshipClass?: string;
    evidencePADFRole?: string;
    factorPADFDimensions?: string[];
    evidencePrimaryPADF?: string;
    evidenceSecondaryPADF?: string[];
  };
  eligibleRuntimeRelationshipTypes?: string[];
  relationshipResolution?: string;
  polarityRule?: string;
}

export class PipelineConfigService {
  private static industryConfig: any = industryConfigRaw;
  private static evidenceKb: any = evidenceKbRaw;
  private static rules: any = rulesRaw;

  // 1. Revenue Motion Canonical Normalization
  static normalizeRevenueMotionId(input?: string): CanonicalRevenueMotionId {
    if (!input) return 'RM01_Digital_Solution_Selling';
    const trimmed = input.trim();

    // Direct match
    if (trimmed.startsWith('RM0') || trimmed.startsWith('RM01') || trimmed.startsWith('RM02') || 
        trimmed.startsWith('RM03') || trimmed.startsWith('RM04') || trimmed.startsWith('RM05') || trimmed.startsWith('RM06')) {
      const match = [
        'RM01_Digital_Solution_Selling',
        'RM02_Professional_Solution_Services',
        'RM03_Digital_Transformation_OT',
        'RM04_Engineering_Project_Solutions',
        'RM05_Project_Procurement',
        'RM06_Generic_Solution_Selling'
      ].find(id => id.toLowerCase().startsWith(trimmed.toLowerCase()) || trimmed.toLowerCase().startsWith(id.toLowerCase()));
      if (match) return match as CanonicalRevenueMotionId;
    }

    // Lookup compatibility registry
    const aliases = this.evidenceKb?.pipelineEvidenceKnowledgeBaseSWOTIntegration?.identifierCompatibilityRegistry?.revenueMotionAliases || [];
    const foundAlias = aliases.find((a: any) => 
      a.legacyId?.toLowerCase() === trimmed.toLowerCase() ||
      a.legacyName?.toLowerCase() === trimmed.toLowerCase() ||
      a.canonicalName?.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().includes(a.legacyName?.toLowerCase() || '')
    );

    if (foundAlias?.canonicalId) {
      return foundAlias.canonicalId as CanonicalRevenueMotionId;
    }

    // Fallback based on name fragments
    const lower = trimmed.toLowerCase();
    if (lower.includes('service') || lower.includes('consulting')) return 'RM02_Professional_Solution_Services';
    if (lower.includes('ot') || lower.includes('transformation')) return 'RM03_Digital_Transformation_OT';
    if (lower.includes('engineering') || lower.includes('project solution')) return 'RM04_Engineering_Project_Solutions';
    if (lower.includes('procurement')) return 'RM05_Project_Procurement';
    if (lower.includes('generic')) return 'RM06_Generic_Solution_Selling';

    return 'RM01_Digital_Solution_Selling';
  }

  // 2. Industry Canonical Normalization
  static normalizeIndustryId(input?: string): { canonicalId: string; name: string } {
    if (!input) {
      return { canonicalId: 'IND_SaaS_Software', name: 'SaaS / Software' };
    }
    const trimmed = input.trim();

    const aliases = this.evidenceKb?.pipelineEvidenceKnowledgeBaseSWOTIntegration?.identifierCompatibilityRegistry?.industryAliases || [];
    const found = aliases.find((a: any) => 
      a.legacyId?.toLowerCase() === trimmed.toLowerCase() ||
      a.canonicalId?.toLowerCase() === trimmed.toLowerCase() ||
      a.legacyName?.toLowerCase() === trimmed.toLowerCase() ||
      a.canonicalName?.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().includes(a.canonicalName?.toLowerCase() || '')
    );

    if (found) {
      return { canonicalId: found.canonicalId, name: found.canonicalName };
    }

    // Keyword heuristics across known 16 industries
    const lower = trimmed.toLowerCase();
    if (lower.includes('saas') || lower.includes('cloud software')) return { canonicalId: 'IND_SaaS_Software', name: 'SaaS / Software' };
    if (lower.includes('enterprise') || lower.includes('software')) return { canonicalId: 'IND_Enterprise_Software', name: 'Enterprise Software' };
    if (lower.includes('ai') || lower.includes('artificial')) return { canonicalId: 'IND_AI_Solutions', name: 'AI Solutions' };
    if (lower.includes('cloud')) return { canonicalId: 'IND_Cloud_Transformation', name: 'Cloud Transformation' };
    if (lower.includes('consulting')) return { canonicalId: 'IND_Consulting', name: 'Consulting' };
    if (lower.includes('professional')) return { canonicalId: 'IND_Professional_Services', name: 'Professional Services' };
    if (lower.includes('integration') || lower.includes('system')) return { canonicalId: 'IND_System_Integration', name: 'System Integration' };
    if (lower.includes('managed')) return { canonicalId: 'IND_Managed_Services', name: 'Managed Services' };
    if (lower.includes('transformation')) return { canonicalId: 'IND_Digital_Transformation', name: 'Digital Transformation' };
    if (lower.includes('ot') || lower.includes('operational')) return { canonicalId: 'IND_OT_IT_Solutions', name: 'OT/IT Solutions' };
    if (lower.includes('engineering')) return { canonicalId: 'IND_Engineering_Solutions', name: 'Engineering Solutions' };
    if (lower.includes('infrastructure')) return { canonicalId: 'IND_Infrastructure_Projects', name: 'Infrastructure Projects' };
    if (lower.includes('epc') || lower.includes('procurement & construction')) return { canonicalId: 'IND_EPC_EP_Projects', name: 'EPC / EP Projects' };
    if (lower.includes('procurement')) return { canonicalId: 'IND_Enterprise_Procurement', name: 'Enterprise Procurement' };
    if (lower.includes('solution selling') || lower.includes('solution-selling')) return { canonicalId: 'IND_Solution_Selling_Organizations', name: 'Solution-Selling Organizations' };
    if (lower.includes('other')) return { canonicalId: 'IND_Other_Solutions', name: 'Other Solutions' };

    return { canonicalId: 'IND_Enterprise_Software', name: 'Enterprise Software' };
  }

  // 3. PADF Dimension Normalization
  static normalizePADFDimensionId(input: string): PADFDimensionId {
    const trimmed = input.trim();
    const aliases = this.evidenceKb?.pipelineEvidenceKnowledgeBaseSWOTIntegration?.identifierCompatibilityRegistry?.padfDimensionAliases || [];
    const found = aliases.find((a: any) => 
      a.legacyId?.toLowerCase() === trimmed.toLowerCase() ||
      a.canonicalId?.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().startsWith(a.legacyId?.toLowerCase() + '_')
    );
    if (found) return found.canonicalId as PADFDimensionId;

    if (trimmed.startsWith('PA1')) return 'PA1_Customer_Value_and_Urgency';
    if (trimmed.startsWith('PA2')) return 'PA2_Buying_Center_and_Influence';
    if (trimmed.startsWith('PA3')) return 'PA3_Buying_Process_and_Decision_Control';
    if (trimmed.startsWith('PA4')) return 'PA4_Solution_and_Value_Proposition';
    if (trimmed.startsWith('PA5')) return 'PA5_Competitive_Position';
    if (trimmed.startsWith('PA6')) return 'PA6_Commercial_and_Deal_Structure';
    if (trimmed.startsWith('PA7')) return 'PA7_Sales_Execution_and_Deal_Readiness';
    if (trimmed.startsWith('PA8')) return 'PA8_Deal_Momentum_Risk_and_Closeability';

    return 'PA1_Customer_Value_and_Urgency';
  }

  // 4. Active 16 SWOT Factor Inheritance Resolver
  // Precedence: Universal Baseline (8) + Motion Override (4) + Industry Override (4) = 16
  static resolveActiveSWOTFactors(revenueMotionInput?: string, industryInput?: string): ActiveFactorResolutionResult {
    const canonicalMotion = this.normalizeRevenueMotionId(revenueMotionInput);
    const { canonicalId: canonicalIndustry, name: industryName } = this.normalizeIndustryId(industryInput);

    const swotModel = this.industryConfig?.SWOTIntelligence?.inheritance_model;
    
    // Layer 1: Universal Baseline (8 factors)
    const universalLayer = swotModel?.universal_baseline;
    const universalConfigs: any[] = universalLayer?.factor_configurations || [];
    const universalFactors: SWOTFactorDefinition[] = universalConfigs.map((f: any) => ({
      factor_type_id: f.factor_type_id,
      factor_name: f.factor_name,
      factor_description: f.factor_description,
      factor_classification: f.factor_classification as SWOTCategory,
      analytical_criteria: f.analytical_criteria || [],
      evidence_expectations: f.evidence_expectations || [],
      related_padf_dimensions: f.related_padf_dimensions || [],
      layer: 'universal_baseline',
      context_id: 'UNIVERSAL'
    }));

    // Layer 2: Revenue Motion Override (4 factors)
    const motionOverrides: any[] = swotModel?.revenue_motion_overrides || [];
    const matchingMotion = motionOverrides.find((m: any) => m.target_id === canonicalMotion);
    const motionConfigs: any[] = matchingMotion?.configuration?.factor_configurations || [];
    const revenueMotionFactors: SWOTFactorDefinition[] = motionConfigs.map((f: any) => ({
      factor_type_id: f.factor_type_id,
      factor_name: f.factor_name,
      factor_description: f.factor_description,
      factor_classification: f.factor_classification as SWOTCategory,
      analytical_criteria: f.analytical_criteria || [],
      evidence_expectations: f.evidence_expectations || [],
      related_padf_dimensions: f.related_padf_dimensions || [],
      layer: 'revenue_motion_override',
      context_id: canonicalMotion
    }));

    // Layer 3: Industry Override (4 factors)
    const industryOverrides: any[] = swotModel?.industry_overrides || [];
    const matchingIndustry = industryOverrides.find((ind: any) => ind.target_id === canonicalIndustry);
    const industryConfigs: any[] = matchingIndustry?.configuration?.factor_configurations || [];
    const industryFactors: SWOTFactorDefinition[] = industryConfigs.map((f: any) => ({
      factor_type_id: f.factor_type_id,
      factor_name: f.factor_name,
      factor_description: f.factor_description,
      factor_classification: f.factor_classification as SWOTCategory,
      analytical_criteria: f.analytical_criteria || [],
      evidence_expectations: f.evidence_expectations || [],
      related_padf_dimensions: f.related_padf_dimensions || [],
      layer: 'industry_override',
      context_id: canonicalIndustry
    }));

    const active16Factors: SWOTFactorDefinition[] = [
      ...universalFactors,
      ...revenueMotionFactors,
      ...industryFactors
    ];

    // Get revenue motion display name
    const motionFamily = this.industryConfig?.revenueMotionFamilies?.find((rm: any) => rm.id === canonicalMotion);
    const revenueMotionName = motionFamily?.name || canonicalMotion;

    return {
      universalFactors,
      revenueMotionFactors,
      industryFactors,
      active16Factors,
      canonicalRevenueMotionId: canonicalMotion,
      canonicalIndustryId: canonicalIndustry,
      industryName,
      revenueMotionName
    };
  }

  // 5. Approved Evidence-to-SWOT Mappings Retrieval
  static getApprovedMappingsForFactor(factorId: string): EvidenceMappingRecord[] {
    const mappings: any[] = this.evidenceKb?.pipelineEvidenceKnowledgeBaseSWOTIntegration?.evidenceToSWOTMappingModel?.mappingRecords || [];
    return mappings
      .filter((m: any) => m.factorId === factorId && m.mappingStatus === 'APPROVED')
      .map((m: any) => ({
        mappingId: m.mappingId,
        evidenceObjectId: m.evidenceObjectId,
        factorId: m.factorId,
        mappingStatus: m.mappingStatus,
        mappingStrength: m.mappingStrength,
        evidenceRole: m.evidenceRole,
        mappingScope: m.mappingScope,
        padfRelationship: m.padfRelationship,
        eligibleRuntimeRelationshipTypes: m.eligibleRuntimeRelationshipTypes,
        relationshipResolution: m.relationshipResolution,
        polarityRule: m.polarityRule
      }));
  }

  // 5b. Approved Mappings by Evidence Object ID
  static getMappingsForEvidenceObject(evidenceObjectId: string): EvidenceMappingRecord[] {
    const mappings: any[] = this.evidenceKb?.pipelineEvidenceKnowledgeBaseSWOTIntegration?.evidenceToSWOTMappingModel?.mappingRecords || [];
    return mappings
      .filter((m: any) => m.evidenceObjectId === evidenceObjectId && m.mappingStatus === 'APPROVED')
      .map((m: any) => ({
        mappingId: m.mappingId,
        evidenceObjectId: m.evidenceObjectId,
        factorId: m.factorId,
        mappingStatus: m.mappingStatus,
        mappingStrength: m.mappingStrength,
        evidenceRole: m.evidenceRole,
        mappingScope: m.mappingScope,
        padfRelationship: m.padfRelationship,
        eligibleRuntimeRelationshipTypes: m.eligibleRuntimeRelationshipTypes,
        relationshipResolution: m.relationshipResolution,
        polarityRule: m.polarityRule
      }));
  }

  // 6. All 48 Reusable Evidence Objects from KB Phase 3
  static getAllEvidenceObjects(): any[] {
    return this.evidenceKb?.pipelineEvidenceKnowledgeBasePhase3?.evidenceObjects || [];
  }

  // 7. Evidence Objects Grouped by Canonical PADF Dimension (PA1-PA8)
  static getEvidenceObjectsByPADF(): Record<PADFDimensionId, any[]> {
    const objs = this.getAllEvidenceObjects();
    const grouped: Record<string, any[]> = {
      PA1_Customer_Value_and_Urgency: [],
      PA2_Buying_Center_and_Influence: [],
      PA3_Buying_Process_and_Decision_Control: [],
      PA4_Solution_and_Value_Proposition: [],
      PA5_Competitive_Position: [],
      PA6_Commercial_and_Deal_Structure: [],
      PA7_Sales_Execution_and_Deal_Readiness: [],
      PA8_Deal_Momentum_Risk_and_Closeability: []
    };

    objs.forEach((obj: any) => {
      const canonicalDim = this.normalizePADFDimensionId(obj.primaryPADFDimension || 'PA1');
      if (grouped[canonicalDim]) {
        grouped[canonicalDim].push({
          ...obj,
          canonicalDimensionId: canonicalDim,
          swotMappings: this.getMappingsForEvidenceObject(obj.evidenceId)
        });
      }
    });

    return grouped as Record<PADFDimensionId, any[]>;
  }

  // 8. Canonical PADF Dimensions Metadata
  static getCanonicalPADFDimensions(): Array<{
    id: PADFDimensionId;
    shortCode: string;
    name: string;
    weight: number;
    mandatory: boolean;
    description: string;
  }> {
    return [
      {
        id: 'PA1_Customer_Value_and_Urgency',
        shortCode: 'PA1',
        name: 'Customer Value & Urgency',
        weight: 0.15,
        mandatory: true,
        description: 'Validates customer business problem severity, financial impact, strategic priority alignment, and buying urgency.'
      },
      {
        id: 'PA2_Buying_Center_and_Influence',
        shortCode: 'PA2',
        name: 'Buying Center & Influence',
        weight: 0.15,
        mandatory: true,
        description: 'Validates economic buyer access, internal champion power, multi-threaded stakeholder coverage, and InfoSec/Legal alignment.'
      },
      {
        id: 'PA3_Buying_Process_and_Decision_Control',
        shortCode: 'PA3',
        name: 'Buying Process & Decision Control',
        weight: 0.15,
        mandatory: true,
        description: 'Validates decision criteria influence, formal approval roadmap, mutual close plan execution, and contracting vehicle.'
      },
      {
        id: 'PA4_Solution_and_Value_Proposition',
        shortCode: 'PA4',
        name: 'Solution & Value Proposition',
        weight: 0.15,
        mandatory: true,
        description: 'Validates technical architecture fit, POC sign-off, implementation feasibility, and peer reference validation.'
      },
      {
        id: 'PA5_Competitive_Position',
        shortCode: 'PA5',
        name: 'Competitive Position',
        weight: 0.10,
        mandatory: false,
        description: 'Validates incumbent replacement dynamics, head-to-head differentiation, build vs. buy posture, and ecosystem leverage.'
      },
      {
        id: 'PA6_Commercial_and_Deal_Structure',
        shortCode: 'PA6',
        name: 'Commercial & Deal Structure',
        weight: 0.10,
        mandatory: false,
        description: 'Validates approved budget allocation, commercial term agreement, multi-year commitment, and margin integrity.'
      },
      {
        id: 'PA7_Sales_Execution_and_Deal_Readiness',
        shortCode: 'PA7',
        name: 'Sales Execution & Deal Readiness',
        weight: 0.10,
        mandatory: false,
        description: 'Validates deal team discipline, executive peer alignment, solutions engineering capacity, and CS transition readiness.'
      },
      {
        id: 'PA8_Deal_Momentum_Risk_and_Closeability',
        shortCode: 'PA8',
        name: 'Deal Momentum, Risk & Closeability',
        weight: 0.10,
        mandatory: false,
        description: 'Validates customer engagement velocity, close date credibility, gate blockers, and signatory readiness.'
      }
    ];
  }

  // 9. Three-Layer Evidence Expectation Resolution (Universal + Revenue Motion + Industry)
  static getEvidenceExpectationsForContext(revenueMotionInput?: string, industryInput?: string) {
    const canonicalMotion = this.normalizeRevenueMotionId(revenueMotionInput);
    const { canonicalId: canonicalIndustry } = this.normalizeIndustryId(industryInput);
    const eec: any[] = this.industryConfig?.EvidenceExpectationConfigurations || [];

    const univObj = eec.find((x: any) => x.universalPADFEvidenceBaseline)?.universalPADFEvidenceBaseline || {};
    const rmOverride = eec.find((x: any) => x.revenueMotionId === canonicalMotion)?.overrides || {};
    const indOverride = eec.find((x: any) => x.industryId === canonicalIndustry)?.overrides || {};

    return {
      canonicalMotion,
      canonicalIndustry,
      universalBaseline: univObj,
      revenueMotionOverride: rmOverride,
      industryOverride: indOverride
    };
  }

  // 9b. Effective Expectation for a Specific PADF Dimension (PA1..PA8)
  static getDimensionExpectation(shortCode: string, revenueMotionInput?: string, industryInput?: string): {
    minimumCoverageLevel: string;
    freshnessRequirement: string;
    assessmentPurpose: string;
    preferredEvidenceSources: string[];
  } {
    const { universalBaseline, revenueMotionOverride, industryOverride } = this.getEvidenceExpectationsForContext(
      revenueMotionInput,
      industryInput
    );

    const univKey = Object.keys(universalBaseline).find(k => k.startsWith(shortCode + '_'));
    const univ = univKey ? universalBaseline[univKey] : {};
    const rm = revenueMotionOverride[shortCode] || {};
    const ind = industryOverride[shortCode] || {};

    return {
      minimumCoverageLevel: ind.minimumCoverageLevel || rm.minimumCoverageLevel || univ.minimumCoverageLevel || 'HIGH',
      freshnessRequirement: ind.freshnessRequirement || rm.freshnessRequirement || univ.freshnessRequirement || 'CURRENT',
      assessmentPurpose: univ.assessmentPurpose || '',
      preferredEvidenceSources: univ.preferredEvidenceSources || []
    };
  }

  // 9c. Evidence Sources Registry from Knowledge Base Phase 1
  static getEvidenceSources(): Array<{
    sourceId: string;
    sourceName: string;
    reliabilityLevel: string;
    description: string;
  }> {
    return (
      this.evidenceKb?.pipelineEvidenceKnowledgeBasePhase1?.evidenceSources ||
      this.evidenceKb?.pipelineEvidenceKnowledgeBasePhase2?.evidenceSources || [
        { sourceId: 'ES01', sourceName: 'Customer Executive Conversation', reliabilityLevel: 'VERY_HIGH', description: 'Direct conversation with an executive or senior decision-maker.' },
        { sourceId: 'ES02', sourceName: 'Customer Workshop', reliabilityLevel: 'HIGH', description: 'Structured customer discovery or technical validation workshop.' },
        { sourceId: 'ES03', sourceName: 'Customer Meeting Notes', reliabilityLevel: 'MEDIUM_HIGH', description: 'Information captured during customer meetings.' },
        { sourceId: 'ES04', sourceName: 'Customer Documentation', reliabilityLevel: 'HIGH', description: 'Customer-provided formal documents (RFP, business case, procurement specs).' },
        { sourceId: 'ES05', sourceName: 'CRM Activity Data', reliabilityLevel: 'MEDIUM', description: 'System-recorded engagement or milestone activity.' },
        { sourceId: 'ES06', sourceName: 'Sales Representative Input', reliabilityLevel: 'LOW_MEDIUM', description: 'Seller-provided interpretation or manual input.' },
        { sourceId: 'ES07', sourceName: 'External Intelligence', reliabilityLevel: 'MEDIUM', description: 'Market, competitor, industry, or partner intelligence.' }
      ]
    );
  }

  // 9d. Resolve Phase 4 Revenue Motion Evidence Intelligence from static KB JSON
  static getPhase4MotionIntelligence(revenueMotionInput?: string): any {
    const canonicalMotion = this.normalizeRevenueMotionId(revenueMotionInput);
    const p4 = this.evidenceKb?.pipelineEvidenceKnowledgeBasePhase4?.revenueMotionEvidenceIntelligence || {};
    const motionKeyMap: Record<CanonicalRevenueMotionId, string> = {
      RM01_Digital_Solution_Selling: 'digitalSolutionSelling',
      RM02_Professional_Solution_Services: 'professionalSolutionServices',
      RM03_Digital_Transformation_OT: 'digitalTransformationAndOT',
      RM04_Engineering_Project_Solutions: 'engineeringAndProjectSolutions',
      RM05_Project_Procurement: 'projectAndProcurement',
      RM06_Generic_Solution_Selling: 'genericSolutionSelling'
    };
    const key = motionKeyMap[canonicalMotion] || 'digitalSolutionSelling';
    return p4[key] || p4.digitalSolutionSelling || null;
  }

  // 9e. Resolve Phase 5 Industry Evidence Intelligence from static KB JSON
  static getPhase5IndustryIntelligence(industryInput?: string): any {
    const { name: canonicalName } = this.normalizeIndustryId(industryInput);
    const p5 = this.evidenceKb?.pipelineEvidenceKnowledgeBasePhase5?.industryEvidenceIntelligence || {};
    const norm = (v?: string) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(canonicalName);

    for (const motionGroup of Object.values<any>(p5)) {
      const profiles = motionGroup?.industryProfiles || {};
      for (const profile of Object.values<any>(profiles)) {
        if (norm(profile?.industryName) === target) {
          return profile;
        }
      }
    }
    return p5?.digitalSolutionSelling?.industryProfiles?.enterpriseSoftware || null;
  }

  // 9f. Resolve Industry PADF Dimension Behavior from Pipeline_industry_configuration_JSON_v1.1.json
  static getIndustryDimensionBehavior(shortCode: string, industryInput?: string): {
    assessmentFocus: string[];
    strongIndicators: string[];
    weakIndicators: string[];
  } {
    const { canonicalId } = this.normalizeIndustryId(industryInput);
    const configs: any[] = this.industryConfig?.padfDimensionBehaviorConfigurations || [];
    const matched = configs.find((c: any) => c.industryId === canonicalId) || configs[0];
    const dimCfg = matched?.dimensionConfigurations?.[shortCode] || {};
    return {
      assessmentFocus: Array.isArray(dimCfg.assessmentFocus) ? dimCfg.assessmentFocus : [],
      strongIndicators: Array.isArray(dimCfg.strongIndicators) ? dimCfg.strongIndicators : [],
      weakIndicators: Array.isArray(dimCfg.weakIndicators) ? dimCfg.weakIndicators : []
    };
  }

  // 9g. Extract Contextual Signals across KB Phases 3, 4, 5 & Industry Configuration JSON for an Evidence Object
  static getContextualEvidenceSignalsForObject(
    evObj: any,
    revenueMotionInput?: string,
    industryInput?: string
  ): {
    industryName: string;
    revenueMotionName: string;
    motionHighValueSignals: string[];
    motionWeakSignals: string[];
    industryValidationRequirements: string[];
    industryPositiveSignals: string[];
    industryNegativeSignals: string[];
    industryDimStrongIndicators: string[];
    industryDimWeakIndicators: string[];
    industryDimFocus: string[];
    minimumCoverageLevel: string;
    freshnessRequirement: string;
  } {
    const canonicalMotion = this.normalizeRevenueMotionId(revenueMotionInput);
    const { name: industryName } = this.normalizeIndustryId(industryInput);
    const motionFamily = this.industryConfig?.revenueMotionFamilies?.find((rm: any) => rm.id === canonicalMotion);
    const revenueMotionName = motionFamily?.name || revenueMotionInput || canonicalMotion;

    const shortCode = String(evObj?.primaryPADFDimension || 'PA1').slice(0, 3).toUpperCase();
    const p4Motion = this.getPhase4MotionIntelligence(revenueMotionInput);
    const p5Industry = this.getPhase5IndustryIntelligence(industryInput);
    const indDimBehavior = this.getIndustryDimensionBehavior(shortCode, industryInput);
    const dimExpectation = this.getDimensionExpectation(shortCode, revenueMotionInput, industryInput);

    // Map PADF shortCode (PA1..PA8) to Phase 4 / Phase 5 domain bucket keys
    const p4CategoryPriority: Record<string, string[]> = {
      PA1: ['businessValueEvidence', 'businessOutcomeEvidence', 'customerNeedEvidence', 'strategicAlignmentEvidence'],
      PA2: ['executiveSponsorshipEvidence', 'relationshipEvidence', 'stakeholderCoverageEvidence'],
      PA3: ['decisionProcessEvidence', 'procurementProcessEvidence'],
      PA4: ['solutionFitEvidence', 'architectureEvidence', 'technicalComplianceEvidence', 'deliveryCapabilityEvidence', 'scopeEvidence', 'specificationEvidence', 'operationalReadinessEvidence'],
      PA5: ['competitiveEvidence', 'competitivePositionEvidence', 'competitiveIntelligenceEvidence'],
      PA6: ['commercialEvidence', 'commercialCompetitivenessEvidence', 'commercialPositionEvidence', 'commercialAlignmentEvidence', 'valueRealizationEvidence'],
      PA7: ['executionCapabilityEvidence', 'deliveryCapabilityEvidence', 'operationalReadinessEvidence', 'qualificationEvidence'],
      PA8: ['scheduleEvidence', 'riskEvidence', 'decisionProcessEvidence']
    };

    const p5CategoryPriority: Record<string, string[]> = {
      PA1: ['businessValueEvidence', 'problemDefinitionEvidence', 'customerNeedEvidence', 'strategicAlignmentEvidence', 'lifecycleValueEvidence'],
      PA2: ['executiveSponsorshipEvidence', 'stakeholderEvidence', 'epcStakeholderEvidence', 'stakeholderInfluenceEvidence', 'stakeholderCoverageEvidence', 'adoptionEvidence', 'trustEvidence'],
      PA3: ['decisionProcessEvidence', 'governanceEvidence', 'tenderProcessEvidence', 'evaluationCriteriaEvidence'],
      PA4: ['solutionFitEvidence', 'technicalValidationEvidence', 'architectureEvidence', 'implementationEvidence', 'useCaseEvidence', 'dataReadinessEvidence', 'pilotEvidence', 'migrationEvidence', 'securityComplianceEvidence', 'methodologyEvidence', 'deliveryCapabilityEvidence', 'scopeEvidence', 'integrationCapabilityEvidence', 'operationalCapabilityEvidence', 'transformationRoadmapEvidence', 'otItAlignmentEvidence', 'technicalComplianceEvidence', 'performanceEvidence', 'cybersecurityEvidence', 'operationalImpactEvidence'],
      PA5: ['differentiationEvidence', 'supplierQualificationEvidence', 'solutionFitEvidence'],
      PA6: ['commercialEvidence', 'cloudEconomicsEvidence', 'projectFundingEvidence', 'contractualEvidence', 'slaEvidence'],
      PA7: ['deliveryCapabilityEvidence', 'resourceEvidence', 'transitionEvidence', 'implementationEvidence'],
      PA8: ['scheduleEvidence', 'dependencyEvidence', 'changeReadinessEvidence', 'customerContextEvidence', 'assumptionValidationEvidence']
    };

    const p4Intel = p4Motion?.evidenceIntelligence || {};
    const motionHighValueSignals: string[] = [];
    const motionWeakSignals: string[] = [];
    (p4CategoryPriority[shortCode] || []).forEach((bucketKey) => {
      const bucket = p4Intel[bucketKey];
      if (bucket) {
        if (Array.isArray(bucket.highValueSignals)) motionHighValueSignals.push(...bucket.highValueSignals);
        if (Array.isArray(bucket.weakSignals)) motionWeakSignals.push(...bucket.weakSignals);
      }
    });

    const p5Overrides = p5Industry?.evidenceOverrides || {};
    const industryValidationRequirements: string[] = [];
    (p5CategoryPriority[shortCode] || []).forEach((bucketKey) => {
      const bucket = p5Overrides[bucketKey];
      if (bucket && Array.isArray(bucket.validationRequirements)) {
        industryValidationRequirements.push(...bucket.validationRequirements);
      }
    });

    const p5Signals = p5Industry?.industrySpecificEvidenceSignals || {};
    const industryPositiveSignals: string[] = Array.isArray(p5Signals.positiveSignals) ? p5Signals.positiveSignals : [];
    const industryNegativeSignals: string[] = Array.isArray(p5Signals.negativeSignals) ? p5Signals.negativeSignals : [];

    return {
      industryName,
      revenueMotionName,
      motionHighValueSignals: [...new Set(motionHighValueSignals)],
      motionWeakSignals: [...new Set(motionWeakSignals)],
      industryValidationRequirements: [...new Set(industryValidationRequirements)],
      industryPositiveSignals,
      industryNegativeSignals,
      industryDimStrongIndicators: indDimBehavior.strongIndicators,
      industryDimWeakIndicators: indDimBehavior.weakIndicators,
      industryDimFocus: indDimBehavior.assessmentFocus,
      minimumCoverageLevel: dimExpectation.minimumCoverageLevel,
      freshnessRequirement: dimExpectation.freshnessRequirement
    };
  }

  // 9h. Pure Static JSON 4-Tier Suggested Answers Synthesizer
  // Exclusively derives from Pipeline_evidence_knowledge_base_v1.1.json (Phases 3, 4, 5) + Pipeline_industry_configuration_JSON_v1.1.json
  static synthesizeSuggestedAnswers(
    evObj: any,
    revenueMotionInput?: string,
    industryInput?: string
  ): Array<{
    tier: 'Strong Verified' | 'Substantiated' | 'Partial / Pending' | 'Gap / Risk';
    label: string;
    text: string;
    confidence: number;
    confirmed: boolean;
  }> {
    const strongIndicators: string[] = Array.isArray(evObj?.strongEvidenceIndicators) ? evObj.strongEvidenceIndicators : [];
    const weakIndicators: string[] = Array.isArray(evObj?.weakEvidenceIndicators) ? evObj.weakEvidenceIndicators : [];
    const evidenceName = String(evObj?.evidenceName || evObj?.evidenceId || 'Evidence Point');

    const ctx = this.getContextualEvidenceSignalsForObject(evObj, revenueMotionInput, industryInput);
    const evIndexMatch = String(evObj?.evidenceId || '').match(/_(\d+)$/);
    const offset = evIndexMatch ? Math.max(0, (parseInt(evIndexMatch[1], 10) - 1)) : 0;

    const pickOffset = (arr: string[], shift = 0): string | undefined => {
      if (!arr || arr.length === 0) return undefined;
      return arr[(offset + shift) % arr.length];
    };

    const trimPunctuation = (s: string) => s.trim().replace(/[.]+$/, '');
    const options: Array<{
      tier: 'Strong Verified' | 'Substantiated' | 'Partial / Pending' | 'Gap / Risk';
      label: string;
      text: string;
      confidence: number;
      confirmed: boolean;
    }> = [];

    const p3Strong1 = strongIndicators[0] || `${evidenceName} confirmed with customer`;
    const p4StrongSignal = pickOffset(ctx.motionHighValueSignals, 0);
    const p5ValReq1 = pickOffset(ctx.industryValidationRequirements, 0);
    const p5PosSignal = pickOffset(ctx.industryPositiveSignals, 0) || pickOffset(ctx.industryDimStrongIndicators, 0);

    // Tier 1: Strong Verified
    const tier1Text = trimPunctuation(p3Strong1);
    options.push({
      tier: 'Strong Verified',
      label: `Strong Verified — ${tier1Text}`,
      text: tier1Text,
      confidence: 95,
      confirmed: true
    });

    // Tier 2: Substantiated
    const rawTier2 =
      strongIndicators[1] && trimPunctuation(strongIndicators[1]).toLowerCase() !== tier1Text.toLowerCase()
        ? strongIndicators[1]
        : p4StrongSignal || p5PosSignal || p5ValReq1 || `${evidenceName} substantiated`;
    let tier2Text = trimPunctuation(rawTier2);
    if (tier2Text.toLowerCase() === tier1Text.toLowerCase()) {
      tier2Text = `${evidenceName} substantiated`;
    }
    options.push({
      tier: 'Substantiated',
      label: `Substantiated — ${tier2Text}`,
      text: tier2Text,
      confidence: 82,
      confirmed: true
    });

    // Tier 3: Partial / Pending Verification
    const tier3Text = `${evidenceName} awaiting verification`;
    options.push({
      tier: 'Partial / Pending',
      label: `Partial / Pending — ${tier3Text}`,
      text: tier3Text,
      confidence: 60,
      confirmed: false
    });

    // Tier 4: Gap / Risk
    const p3Weak = weakIndicators[0] || pickOffset(ctx.motionWeakSignals, 0) || pickOffset(ctx.industryNegativeSignals, 0) || pickOffset(ctx.industryDimWeakIndicators, 0) || `${evidenceName} not yet substantiated by customer`;
    const tier4Text = trimPunctuation(p3Weak);
    options.push({
      tier: 'Gap / Risk',
      label: `Gap / Risk — ${tier4Text}`,
      text: tier4Text,
      confidence: 35,
      confirmed: false
    });

    return options;
  }

  // 10. Dynamic Pipeline Assessment Rules Configuration & Status Resolution
  // Reads directly from Pipeline_Assessment_Rules_v1.1.json
  static getAssessmentRulesConfig(): {
    version: string;
    winabilityLevels: Array<{ level: string; label: string; minScore: number; maxScore: number; action: string }>;
    pipelineHealthLevels: Array<{ level: string; label: string; minScore: number; maxScore: number; action: string }>;
    radarThresholds: { critical: number; moderate: number; healthy: number };
    consistencyRulesCount: number;
  } {
    const phase6 = this.rules?.pipelineAssessmentRules?.phase6_winabilityAndHealthCalculation ||
      Object.values<any>(this.rules?.pipelineAssessmentRules || {}).find(
        (v: any) => Array.isArray(v?.winabilityClassificationRules) || Array.isArray(v?.pipelineHealthClassificationRules)
      ) || {};

    const wRules: any[] = Array.isArray(phase6.winabilityClassificationRules) ? phase6.winabilityClassificationRules : [];
    const hRules: any[] = Array.isArray(phase6.pipelineHealthClassificationRules) ? phase6.pipelineHealthClassificationRules : [];
    const consistencyRules: any[] = Array.isArray(phase6.pipelineAssessmentConsistencyRules) ? phase6.pipelineAssessmentConsistencyRules : [];

    const winabilityLevels = wRules
      .filter((r: any) => r?.output?.winabilityLevel)
      .map((r: any) => {
        const lvl = String(r.output.winabilityLevel);
        if (lvl === 'high') {
          return { level: lvl, label: 'High Winability', minScore: 75, maxScore: 100, action: r.action || '' };
        }
        if (lvl === 'moderate') {
          return { level: lvl, label: 'Moderate Winability', minScore: 55, maxScore: 74, action: r.action || '' };
        }
        return { level: lvl, label: 'Low Winability', minScore: 0, maxScore: 54, action: r.action || '' };
      });

    const pipelineHealthLevels = hRules
      .filter((r: any) => r?.output?.pipelineHealthLevel)
      .map((r: any) => {
        const lvl = String(r.output.pipelineHealthLevel);
        if (lvl === 'healthy') {
          return { level: lvl, label: 'HEALTHY', minScore: 75, maxScore: 100, action: r.action || '' };
        }
        if (lvl === 'at_risk') {
          return { level: lvl, label: 'AT_RISK', minScore: 55, maxScore: 74, action: r.action || '' };
        }
        return { level: lvl, label: 'CRITICAL', minScore: 0, maxScore: 54, action: r.action || '' };
      });

    return {
      version: this.rules?.pipelineAssessmentRules?.metadata?.version || '1.1',
      winabilityLevels:
        winabilityLevels.length > 0
          ? winabilityLevels
          : [
              { level: 'high', label: 'High Winability', minScore: 75, maxScore: 100, action: 'Classify high winability.' },
              { level: 'moderate', label: 'Moderate Winability', minScore: 55, maxScore: 74, action: 'Classify moderate winability.' },
              { level: 'low', label: 'Low Winability', minScore: 0, maxScore: 54, action: 'Classify low winability.' }
            ],
      pipelineHealthLevels:
        pipelineHealthLevels.length > 0
          ? pipelineHealthLevels
          : [
              { level: 'healthy', label: 'HEALTHY', minScore: 75, maxScore: 100, action: 'Classify healthy pipeline.' },
              { level: 'at_risk', label: 'AT_RISK', minScore: 55, maxScore: 74, action: 'Classify at risk pipeline.' },
              { level: 'unhealthy', label: 'CRITICAL', minScore: 0, maxScore: 54, action: 'Classify unhealthy pipeline.' }
            ],
      radarThresholds: {
        critical: 35,
        moderate: 55,
        healthy: 75
      },
      consistencyRulesCount: consistencyRules.length
    };
  }

  static resolvePipelineAssessmentClassifications(params: {
    riskAdjustedWinability: number;
    baseWinability?: number;
    assessmentConfidence: number;
    pipelineHealth?: string;
    criticalRisksCount?: number;
    padfScores?: number[];
  }): {
    healthIndicator: PipelineHealthIndicator;
    pipelineHealthLabel: string;
    winabilityLabel: string;
    confidenceLabel: 'High' | 'Moderate' | 'Low';
    hasCriticalOverride: boolean;
  } {
    const cfg = this.getAssessmentRulesConfig();
    const score = Number(params.riskAdjustedWinability || 0);
    const conf = Number(params.assessmentConfidence || 0);
    const critRisks = Number(params.criticalRisksCount || 0);
    const minPadf = Array.isArray(params.padfScores) && params.padfScores.length > 0
      ? Math.min(...params.padfScores)
      : score;

    const hasCriticalOverride = critRisks >= 2 || minPadf < 30;
    const rawHealthUpper = String(params.pipelineHealth || '').toUpperCase();

    let healthIndicator: PipelineHealthIndicator = 'Moderate';
    if (hasCriticalOverride || rawHealthUpper === 'CRITICAL' || score < cfg.radarThresholds.critical) {
      healthIndicator = 'Critical';
    } else if (rawHealthUpper === 'AT_RISK' || score < cfg.radarThresholds.moderate) {
      healthIndicator = 'Weak';
    } else if (
      (rawHealthUpper === 'STRONG' || rawHealthUpper === 'HEALTHY' || score >= cfg.radarThresholds.healthy) &&
      conf >= 65 &&
      critRisks === 0
    ) {
      healthIndicator = 'Strong';
    } else {
      healthIndicator = 'Moderate';
    }

    const matchedWinRule =
      cfg.winabilityLevels.find((w) => score >= w.minScore && score <= w.maxScore) ||
      cfg.winabilityLevels[cfg.winabilityLevels.length - 1];

    const matchedHealthRule =
      cfg.pipelineHealthLevels.find((h) => score >= h.minScore && score <= h.maxScore) ||
      cfg.pipelineHealthLevels[cfg.pipelineHealthLevels.length - 1];

    const pipelineHealthLabel =
      rawHealthUpper || matchedHealthRule?.label || 'MODERATE';

    const confidenceLabel: 'High' | 'Moderate' | 'Low' =
      conf >= 75 ? 'High' : conf >= 50 ? 'Moderate' : 'Low';

    return {
      healthIndicator,
      pipelineHealthLabel,
      winabilityLabel: matchedWinRule?.label || 'Moderate Winability',
      confidenceLabel,
      hasCriticalOverride
    };
  }

  static resolveDimensionAssessmentMeta(score: number): {
    label: PipelineHealthIndicator;
    dbState: 'STRONG' | 'HEALTHY' | 'MODERATE' | 'VULNERABLE';
  } {
    const cfg = this.getAssessmentRulesConfig();
    if (score >= cfg.radarThresholds.healthy) {
      return { label: 'Strong', dbState: 'STRONG' };
    }
    if (score >= cfg.radarThresholds.moderate) {
      return { label: 'Moderate', dbState: 'MODERATE' };
    }
    if (score >= cfg.radarThresholds.critical) {
      return { label: 'Weak', dbState: 'VULNERABLE' };
    }
    return { label: 'Critical', dbState: 'VULNERABLE' };
  }

  // 11. Full Configuration Verification
  static getFrameworkVersions() {
    return {
      industry_configuration_version: this.industryConfig?.frameworkMetadata?.frameworkVersion || '1.1',
      evidence_kb_version: '1.1',
      rules_version: this.rules?.pipelineAssessmentRules?.metadata?.version || '1.1',
      padf_version: '1.0',
      padif_version: '1.0',
      swot_schema_version: '1.0'
    };
  }
}

