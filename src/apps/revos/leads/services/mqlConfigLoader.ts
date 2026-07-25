import industryConfigJson from '@/src/config/MQL_Industry_configuration_JSON.json';
import evidenceKbJson from '@/src/config/MQL_evidence_knowledge_base.json';
import qualificationRulesJson from '@/src/config/MQL_Qualification_rules.json';
import { MQLIndustryConfiguration, MQLEvidenceKnowledgeBase, MQLQualificationRules, EvidenceConfig, EvidenceDefinition } from '../../types/mql-config';

export class MQLConfigService {
  private static industryConfig = industryConfigJson as any as MQLIndustryConfiguration;
  private static evidenceKb = evidenceKbJson as any as MQLEvidenceKnowledgeBase;
  private static rules = qualificationRulesJson as any as MQLQualificationRules;

  static getIndustries() {
    return this.industryConfig.industries.map(i => ({
      id: i.industry.id,
      name: i.industry.name,
      revenueMotion: i.industry.revenueMotion,
      description: i.industry.description
    }));
  }

  static getIndustryConfiguration(industryId: string): any {
    const industryNode = this.industryConfig.industries.find(i => i.industry.id === industryId);
    if (!industryNode) throw new Error(`Industry ${industryId} not found`);

    let finalConfig = {
      fit: [] as EvidenceConfig[],
      intent: [] as EvidenceConfig[],
      engagement: [] as EvidenceConfig[],
      timing: [] as EvidenceConfig[]
    };

    // Handle inheritance
    if (industryNode.industry.inherits) {
      const parentNode = this.getIndustryConfiguration(industryNode.industry.inherits);
      // deep clone array
      finalConfig = {
        fit: [...parentNode.fit],
        intent: [...parentNode.intent],
        engagement: [...parentNode.engagement],
        timing: [...parentNode.timing]
      };
    } else {
       finalConfig = {
         fit: [...(industryNode.fit || [])],
         intent: [...(industryNode.intent || [])],
         engagement: [...(industryNode.engagement || [])],
         timing: [...(industryNode.timing || [])]
       };
    }

    // Apply overrides
    if (industryNode.overrides) {
       const applyOverrides = (dimension: 'fit' | 'intent' | 'engagement' | 'timing') => {
         if (industryNode.overrides![dimension]) {
           industryNode.overrides![dimension]!.forEach(override => {
             const existingIdx = finalConfig[dimension].findIndex(e => e.evidenceId === override.evidenceId);
             if (existingIdx >= 0) {
                if (override.enabled === false) {
                   finalConfig[dimension].splice(existingIdx, 1);
                } else {
                   finalConfig[dimension][existingIdx] = { ...finalConfig[dimension][existingIdx], ...override };
                }
             } else if (override.enabled !== false) {
                finalConfig[dimension].push(override as EvidenceConfig);
             }
           });
         }
       };
       applyOverrides('fit');
       applyOverrides('intent');
       applyOverrides('engagement');
       applyOverrides('timing');
    }

    return finalConfig;
  }

  static getEvidenceDefinitions(revenueMotion: string) {
    let motionNode = (this.evidenceKb.revenueMotionFamily as any)[revenueMotion];
    
    let library: any = null;
    
    if (motionNode && motionNode.evidenceLibrary) {
       library = motionNode.evidenceLibrary;
    } else if (motionNode) {
       const keys = Object.keys(motionNode);
       for (const key of keys) {
         if (motionNode[key] && motionNode[key].evidenceLibrary) {
            library = motionNode[key].evidenceLibrary;
            break;
         }
       }
    }

    if (!library) {
      // Return empty structures if not found
      return { fit: [], intent: [], engagement: [], timing: [] };
    }

    return library as { fit: EvidenceDefinition[], intent: EvidenceDefinition[], engagement: EvidenceDefinition[], timing: EvidenceDefinition[] };
  }

  static getCombinedEvidenceConfig(industryId: string) {
    const industryConfig = this.getIndustryConfiguration(industryId);
    const industryMeta = this.industryConfig.industries.find(i => i.industry.id === industryId)?.industry;
    
    if (!industryMeta) throw new Error("Industry not found");
    
    const evidenceDefs = this.getEvidenceDefinitions(industryMeta.revenueMotion);

    const combine = (configs: EvidenceConfig[], defs: EvidenceDefinition[]) => {
      return configs.map(config => {
        const def = defs.find(d => d.evidenceId === config.evidenceId);
        return {
          ...config,
          definition: def
        };
      }).filter(c => c.definition); // Filter out items with missing definitions
    };

    return {
      industry: industryMeta,
      evidence: {
        fit: combine(industryConfig.fit, evidenceDefs.fit || []),
        intent: combine(industryConfig.intent, evidenceDefs.intent || []),
        engagement: combine(industryConfig.engagement, evidenceDefs.engagement || []),
        timing: combine(industryConfig.timing, evidenceDefs.timing || [])
      }
    };
  }

  static getQualificationRuleSet(revenueMotion: string) {
    return this.rules.qualificationRuleSets.find(r => 
      r.id === revenueMotion || 
      r.revenueMotionFamily === revenueMotion || 
      r.applicableIndustries.includes(revenueMotion)
    );
  }
}
