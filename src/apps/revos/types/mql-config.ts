export interface MQLIndustryConfiguration {
  metadata: {
    id: string;
    name: string;
    version: string;
    description: string;
    qualificationModel: string;
    inheritanceSupported: boolean;
  };
  industries: Array<{
    industry: {
      id: string;
      name: string;
      version: string;
      inherits?: string;
      baseTemplate?: boolean;
      revenueMotion: string;
      qualificationRuleProfile: string;
      description: string;
    };
    fit?: EvidenceConfig[];
    intent?: EvidenceConfig[];
    engagement?: EvidenceConfig[];
    timing?: EvidenceConfig[];
    overrides?: {
      fit?: EvidenceOverride[];
      intent?: EvidenceOverride[];
      engagement?: EvidenceOverride[];
      timing?: EvidenceOverride[];
    };
    qualificationPreferences?: any;
  }>;
}

export interface EvidenceConfig {
  evidenceId: string;
  required?: boolean;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  weight?: number;
  autoPopulate?: boolean;
}

export interface EvidenceOverride {
  evidenceId: string;
  required?: boolean;
  enabled?: boolean;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  weight?: number;
}

export interface MQLEvidenceKnowledgeBase {
  metadata: any;
  revenueMotionFamily: {
    [motionId: string]: {
      metadata?: any;
      evidenceLibrary: {
        fit: EvidenceDefinition[];
        intent: EvidenceDefinition[];
        engagement: EvidenceDefinition[];
        timing: EvidenceDefinition[];
      };
    };
  };
}

export interface EvidenceDefinition {
  evidenceId: string;
  evidenceName: string;
  dimension: 'Fit' | 'Intent' | 'Engagement' | 'Timing';
  definition: string;
  applicableIndustries: string[];
  evidenceType: string;
  evidenceStrength: 'Critical' | 'High' | 'Medium' | 'Low';
  strengthScore: number;
  positiveSignals: string[];
  negativeSignals: string[];
  interpretationGuidance: string;
  aiReasoningHints?: string[];
  ai_reasoningHints?: string[]; // Handle typo in JSON
}

export interface MQLQualificationRules {
  metadata: any;
  qualificationRuleSets: Array<{
    id: string;
    name: string;
    version: string;
    priority: number;
    revenueMotionFamily: string;
    qualificationModel: string;
    applicableIndustries: string[];
    engine: any;
  }>;
}
