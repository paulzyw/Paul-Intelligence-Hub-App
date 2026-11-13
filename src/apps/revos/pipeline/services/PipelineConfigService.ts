import industryConfigRaw from '../../../../config/Pipeline_industry_configuration_JSON_v1.1.json';
import evidenceKbRaw from '../../../../config/Pipeline_evidence_knowledge_base_v1.1.json';
import rulesRaw from '../../../../config/Pipeline_Assessment_Rules_v1.1.json';
import { 
  CanonicalRevenueMotionId, 
  PADFDimensionId, 
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
    if (lower.includes('solution selling')) return { canonicalId: 'IND_Solution_Selling_Organizations', name: 'Solution-Selling Organizations' };

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

  // 10. Full Configuration Verification
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

