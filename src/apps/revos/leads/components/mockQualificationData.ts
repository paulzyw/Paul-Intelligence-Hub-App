import { SQLQualificationResultData } from './SQL_QualificationResult';
import UREKB_Config from '../../../../config/SQL_evidence_knowledge_base.json';

const library = (UREKB_Config as any).UREKB_SQL.revenue_motion_library;
const motionData = library["Digital Solution Selling"];

const evidenceAssessments: any[] = [];

if (motionData) {
  Object.entries(motionData).forEach(([dimensionName, dimData]: [string, any]) => {
    const evidenceObjects = Array.isArray(dimData) ? dimData : dimData?.evidence_objects;
    if (Array.isArray(evidenceObjects)) {
      evidenceObjects.forEach((eo: any, idx: number) => {
        let signalScore = 80 + Math.floor(Math.random() * 20); // 80-99
        let typeMatch = 'positive';
        let tagLabel = 'POSITIVE MATCH';
        
        if (idx % 5 === 0) {
          signalScore = 40 + Math.floor(Math.random() * 20);
          typeMatch = 'negative';
          tagLabel = 'NEGATIVE MATCH';
        } else if (idx % 7 === 0) {
          signalScore = 60 + Math.floor(Math.random() * 20);
          typeMatch = 'neutral';
          tagLabel = 'NEUTRAL MATCH';
        }

        let idAss = "";
        const nameLower = (eo.evidence_name || eo.question || "").toLowerCase();
        const positiveSigs = eo.positive_signals || [];
        const negativeSigs = eo.negative_signals || [];
        
        if (typeMatch === 'positive') {
          if (positiveSigs.length > 0) {
            const sig = positiveSigs[idx % positiveSigs.length];
            idAss = sig.endsWith('.') ? sig : sig + ".";
          } else if (nameLower.includes('industry')) {
            idAss = "Directly matches target industry requirements with zero friction.";
          } else if (nameLower.includes('size') || nameLower.includes('employee')) {
            idAss = "Employee count meets the required scale threshold for enterprise deployment.";
          } else if (nameLower.includes('revenue')) {
            idAss = "Annual revenue meets or exceeds target minimum requirements.";
          } else if (nameLower.includes('title') || nameLower.includes('role')) {
            idAss = "Key stakeholder job title aligns perfectly with expected buying authority.";
          } else if (nameLower.includes('pain') || nameLower.includes('problem')) {
            idAss = "Executive recognition of operational pain points indicates strong organizational alignment.";
          } else if (nameLower.includes('budget')) {
            idAss = "Allocated budget is confirmed and matches enterprise solution expectations.";
          } else {
            idAss = `Directly matches target requirements for ${eo.evidence_name ? eo.evidence_name.toLowerCase() : 'this criteria'}.`;
          }
        } else if (typeMatch === 'negative') {
          if (negativeSigs.length > 0) {
            const sig = negativeSigs[idx % negativeSigs.length];
            idAss = sig.endsWith('.') ? sig : sig + ".";
          } else if (nameLower.includes('industry')) {
            idAss = "Target industry falls outside our primary ICP profile, presenting conversion risks.";
          } else if (nameLower.includes('size')) {
            idAss = "Company scale falls below the recommended minimum customer size threshold.";
          } else if (nameLower.includes('title') || nameLower.includes('role')) {
            idAss = "Contact lacks decision-making authority, potentially stalling the buying cycle.";
          } else {
            idAss = `Significant gap identified. Evidence falls short of typical minimum expected indicators for ${eo.evidence_name ? eo.evidence_name.toLowerCase() : 'this criteria'}.`;
          }
        } else {
          if (positiveSigs.length > 0 && negativeSigs.length > 0) {
            const posPart = positiveSigs[0].toLowerCase().replace(/\.$/, '');
            const negPart = negativeSigs[0].toLowerCase().replace(/\.$/, '');
            idAss = `Evidence is partially validated; although ${posPart}, concerns remain as ${negPart}.`;
          } else if (nameLower.includes('pain') || nameLower.includes('problem')) {
            idAss = "Pain points are recognized but lacks a formal timeline for resolution.";
          } else {
            idAss = `Evidence is present but lacks sufficient detail or execution commitments to establish high confidence in ${eo.evidence_name ? eo.evidence_name.toLowerCase() : 'this area'}.`;
          }
        }

        evidenceAssessments.push({
          evidence_object_id: eo.evidence_id,
          evidence_name: eo.evidence_name || eo.question,
          tags: [
            { label: dimensionName, type: 'dimension' },
            { label: tagLabel, type: typeMatch }
          ],
          identification_assessment: idAss,
          signal_score: signalScore
        });
      });
    }
  });
}

export const mockQualificationData: SQLQualificationResultData = {
  qualification_summary: {
    qualification_status: "Conditionally Qualified",
    overall_score: 74,
    confidence_score: 78,
    summary: "Strong business problem evidence and stakeholder alignment, but commercial readiness requires validation."
  },
  dimension_assessments: [
    {
      dimension_code: "business_problem",
      dimension_name: "Business Problem",
      score: 85,
      confidence: 90,
      assessment_summary: "Clear recognition of operational inefficiencies and revenue leakage.",
      strengths: ["Problem recognized by executives", "Urgency established"],
      weaknesses: [],
      risks: [],
      recommendations: ["Maintain focus on core pain points"]
    },
    {
      dimension_code: "metrics",
      dimension_name: "Metrics & Success Criteria",
      score: 70,
      confidence: 80,
      assessment_summary: "Initial metrics discussed, but lack concrete baseline data.",
      strengths: ["KPIs identified"],
      weaknesses: ["No baseline measurements"],
      risks: ["Hard to prove ROI without baselines"],
      recommendations: ["Establish current baseline metrics"]
    },
    {
      dimension_code: "business_value",
      dimension_name: "Business Value",
      score: 75,
      confidence: 85,
      assessment_summary: "Strategic value understood, but economic impact needs quantification.",
      strengths: ["Strategic alignment"],
      weaknesses: ["Economic impact not fully quantified"],
      risks: ["May lose to competing internal projects"],
      recommendations: ["Quantify cost savings and revenue gains"]
    },
    {
      dimension_code: "solution_alignment",
      dimension_name: "Solution Alignment",
      score: 90,
      confidence: 95,
      assessment_summary: "Solution perfectly addresses the primary business challenge.",
      strengths: ["Strong capability fit", "Clear differentiation"],
      weaknesses: [],
      risks: [],
      recommendations: ["Leverage as primary differentiator"]
    },
    {
      dimension_code: "stakeholder_alignment",
      dimension_name: "Stakeholder Alignment",
      score: 80,
      confidence: 85,
      assessment_summary: "Executive sponsor identified, but technical evaluation team not fully mapped.",
      strengths: ["Executive sponsorship"],
      weaknesses: ["Technical influencers unknown"],
      risks: ["Technical blockers may arise late"],
      recommendations: ["Map out technical evaluation team"]
    },
    {
      dimension_code: "decision_criteria",
      dimension_name: "Decision Criteria",
      score: 65,
      confidence: 70,
      assessment_summary: "Evaluation criteria are still being formulated by the customer.",
      strengths: ["Open to shaping criteria"],
      weaknesses: ["No documented evaluation rubric"],
      risks: ["Competitor might influence criteria"],
      recommendations: ["Proactively provide an evaluation template"]
    },
    {
      dimension_code: "buying_process",
      dimension_name: "Buying Process & Governance",
      score: 60,
      confidence: 65,
      assessment_summary: "Procurement workflow and legal requirements are currently unknown.",
      strengths: [],
      weaknesses: ["Process opacity"],
      risks: ["Unforeseen legal or procurement delays"],
      recommendations: ["Identify procurement stakeholders and process"]
    },
    {
      dimension_code: "commercial_readiness",
      dimension_name: "Commercial Readiness",
      score: 55,
      confidence: 60,
      assessment_summary: "Budget allocation is not yet confirmed for this quarter.",
      strengths: [],
      weaknesses: ["No confirmed budget"],
      risks: ["Project could be pushed to next fiscal year"],
      recommendations: ["Confirm budget availability and funding source"]
    },
    {
      dimension_code: "opportunity_momentum",
      dimension_name: "Opportunity Momentum",
      score: 85,
      confidence: 90,
      assessment_summary: "High engagement with weekly meetings and active correspondence.",
      strengths: ["Fast response times", "Active executive participation"],
      weaknesses: [],
      risks: [],
      recommendations: ["Maintain current cadence"]
    },
    {
      dimension_code: "competitive_position",
      dimension_name: "Competitive Position",
      score: 75,
      confidence: 75,
      assessment_summary: "Incumbent vendor exists, but customer is highly motivated to switch.",
      strengths: ["Customer dissatisfaction with incumbent"],
      weaknesses: ["Incumbent has deep roots"],
      risks: ["Incumbent might offer deep discounts to retain"],
      recommendations: ["Focus on unique architectural advantages"]
    }
  ],
  evidence_assessments: evidenceAssessments,
  risk_analysis: [
    {
      category: "Business Risks",
      risks: ["Strategic impact is recognized but not quantified, risking deprioritization."]
    },
    {
      category: "Stakeholder Risks",
      risks: ["Technical evaluation team remains unknown, posing a risk of late-stage technical blockers."]
    },
    {
      category: "Commercial Risks",
      risks: ["Budget is unconfirmed and requires board approval. Procurement process is undocumented."]
    },
    {
      category: "Process Risks",
      risks: ["Unforeseen legal or procurement delays due to lack of visibility."]
    },
    {
      category: "Competitive Risks",
      risks: ["Incumbent vendor is deeply entrenched and may offer aggressive retention pricing."]
    },
    {
      category: "Evidence Risks",
      risks: ["Missing baseline metrics makes it difficult to construct a compelling ROI case."]
    }
  ],
  recommendations: [
    {
      priority: "High",
      action: "Engage executive sponsor to validate procurement process and budget availability.",
      related_dimension: "Commercial Readiness",
      expected_impact: "Reduce commercial risk and establish timeline.",
      status: "Pending"
    },
    {
      priority: "High",
      action: "Establish baseline measurements for current manual processes.",
      related_dimension: "Metrics & Success Criteria",
      expected_impact: "Enable precise ROI calculation.",
      status: "Pending"
    },
    {
      priority: "Medium",
      action: "Map out the technical evaluation team and schedule an architecture review.",
      related_dimension: "Stakeholder Alignment",
      expected_impact: "Mitigate late-stage technical blockers.",
      status: "Pending"
    }
  ],
  explainability: {
    decision_summary: "The opportunity demonstrates strong business problem alignment, executive sponsorship, and momentum. However, it is conditionally qualified because critical commercial elements (budget, procurement process) and technical stakeholder mapping remain unvalidated. Action is required to quantify the business value and secure commercial path visibility before considering this a fully qualified pipeline opportunity."
  }
};
