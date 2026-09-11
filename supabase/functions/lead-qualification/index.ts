import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getEnv = (key: string): string => {
  try {
    return Deno.env.get(key) || "";
  } catch (e) {
    return "";
  }
};

function buildQualificationPrompt(lead: any, assessments: any[], campaign: any, combinedConfig: any, ruleSet: any) {
  // Build a mapping of evidence definitions for easy prompt injection
  const evidenceMap = new Map();
  if (combinedConfig && combinedConfig.evidence) {
    ['fit', 'intent', 'engagement', 'timing'].forEach(dim => {
      const items = combinedConfig.evidence[dim] || [];
      items.forEach((item: any) => {
        evidenceMap.set(item.evidenceId, item);
      });
    });
  }

  const formattedEvidence = assessments.map(a => {
    const configItem = evidenceMap.get(a.evidence_id);
    const def = configItem?.definition;
    const name = def?.name || a.evidence_id;
    const question = def?.question || '';
    const positiveSignals = def?.positiveSignals ? JSON.stringify(def.positiveSignals) : 'N/A';
    const negativeSignals = def?.negativeSignals ? JSON.stringify(def.negativeSignals) : 'N/A';
    const userResponse = a.evidence_value || 'Not Specified / Unknown';
    const notes = a.notes ? `(Notes: ${a.notes})` : '';
    const priority = configItem?.priority || 'Standard';
    const required = configItem?.required ? 'REQUIRED' : 'OPTIONAL';

    return `
### [Dimension: ${a.dimension.toUpperCase()}] ${name} (${priority} Priority - ${required})
- **Evidence Question**: ${question}
- **Expected Positive Indicators**: ${positiveSignals}
- **Expected Negative Indicators**: ${negativeSignals}
- **Actual User-Entered Answer**: "${userResponse}" ${notes}
- **Is Answered/Populated**: ${a.is_present ? 'Yes' : 'No'}
`;
  }).join('\n');

  // Format the ruleSet details too if available
  let formattedRules = '';
  if (ruleSet && ruleSet.engine) {
    const engine = ruleSet.engine;
    const dimensionsList = Object.entries(engine.dimensions || {}).map(([dim, details]: [string, any]) => {
      return `- **${dim.toUpperCase()}**: Weight: ${details.weight}, Minimum Qualifying Score: ${details.minimumScore}, Critical Evidence IDs: ${JSON.stringify(details.criticalEvidence || [])}`;
    }).join('\n');

    const criticalRulesList = (engine.criticalRules || []).map((rule: any) => {
      return `- **Rule ${rule.id} (Priority: ${rule.priority})**: If condition on [${rule.condition.evidence || rule.condition.dimension}] is met with operator [${rule.condition.operator}] and value [${rule.condition.value}], then set overall status to **${rule.action?.qualification}** (Reason: ${rule.action?.reason || 'N/A'})`;
    }).join('\n');

    formattedRules = `
### Scoring Engine Weights & Minimums:
${dimensionsList}

### Critical Logic Rules:
${criticalRulesList}
`;
  }

  return `
You are an expert Chief Revenue Officer (CRO), B2B RevOps Architect, and lead-qualification engine.
Your task is to evaluate a B2B sales lead against an Ideal Customer Profile (ICP) by meticulously comparing the collected evidence (user answers) against positive/negative indicators and qualification rules.

=========================================
1. CAMPAIGN CONTEXT & ICP STRATEGY
=========================================
- **Campaign Name**: ${campaign.name}
- **Target Market**: ${campaign.target_market}
- **ICP Definition**: ${campaign.icp_definition}
- **Revenue Motion**: ${campaign.revenue_motion}
- **Target Industry**: ${campaign.industry}

=========================================
2. LEAD FIRMOGRAPHICS & ROLE
=========================================
- **Name**: ${lead.first_name} ${lead.last_name}
- **Company Name**: ${lead.company_name}
- **Job Title**: ${lead.job_title}

=========================================
3. COLLECTED EVIDENCE (USER'S DETAILED ANSWERS)
=========================================
For each question below, the user provided raw feedback representing real-world findings. 
You must do a semantic and qualitative comparison between the "Actual User-Entered Answer" and the "Expected Positive Indicators" / "Expected Negative Indicators". Do NOT rely on preset judgment dropdowns.

${formattedEvidence}

=========================================
4. REVOS SCORING CRITERIA & CRITICAL LOGIC RULES
=========================================
Enforce the following dimensional weights, minimum scores, and critical rules precisely:
${formattedRules}

=========================================
ANALYSIS & DECISION INSTRUCTIONS
=========================================
1. **Analyze Dimensions**: Determine a score (0 to 100) for each of the four dimensions (Fit, Intent, Engagement, Timing).
   - Higher scores are given when the User-Entered Answer aligns with Expected Positive Indicators.
   - Lower scores are given when the User-Entered Answer matches Expected Negative Indicators, is "Not Specified / Unknown", or directly contradicts the target market/ICP.
2. **Apply Critical Logic Rules**: Check if any "Critical Logic Rules" are triggered. If they are, adjust the overall qualification status accordingly.
3. **Calculate Overall Qualification Score**: Compute a weighted average of the 4 dimensions based on the scoring weights specified in the rules above.
4. **Determine Qualification Status**: Set the status to one of:
   - 'Highly Qualified MQL'
   - 'Qualified MQL'
   - 'Marketing Nurture'
   - 'Disqualified'
5. **Formulate Explanations**: Provide structured, evidence-based reasoning for each score, and recommend concrete, actionable Next Best Actions for sales/marketing alignment.
6. **Detailed Question-Level Evaluations**: In the "reasoning.evidence_evaluations" array, return a detailed evaluation breakdown for EVERY single question listed under Section 3 above:
   - "evidence_id" must match the original evidence ID (e.g., "industry_match", "intent_signals").
   - "evidence_name" must be the human-friendly name of the evidence item.
   - "dimension" must be the dimension name ('fit', 'intent', 'engagement', 'timing').
   - "score" must be the specific score (0 to 100) that you assign to the user's response to this specific question, depending on how closely it matched positive signals (higher score, e.g. 80-100) or negative signals (lower score, e.g. 0-30). If not populated, neutral, or unknown, score should be low.
   - "matched_type" must be one of: 'positive' (if user response matches a positive signal), 'negative' (if matches a negative signal), 'neutral' (if neutral/partial match), or 'unknown' (if unknown or unpopulated).
   - "reason" must be a concise, professional explanation of why you gave that score, what was matched, and how the user's answer compares to the criteria.
`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const ai = new GoogleGenAI({ apiKey });

    // ---------------------------------------------------------
    // SQL QUALIFICATION MODULE ACTIONS ROUTER
    // ---------------------------------------------------------
    if (action === 'create-sql-assessment') {
      const { opportunity_id } = body;
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured.');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase.from('sql_assessments').insert({
        opportunity_id,
        assessment_status: 'created'
      }).select().single();
      if (error) throw error;

      return new Response(JSON.stringify({ assessment_id: data.id, status: 'created' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'submit-sql-evidence') {
      const { assessment_id, evidence } = body; // evidence is array of records
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured.');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insert or upsert multiple evidence records
      const { data, error } = await supabase.from('sql_evidence_records').upsert(
        evidence.map((ev: any) => ({
          assessment_id,
          dimension_code: ev.dimension_code,
          evidence_object_id: ev.evidence_object_id,
          evidence_content: ev.evidence_content,
          evidence_source: ev.evidence_source || 'Sales Rep',
          validation_status: ev.validation_status || 'unverified'
        })),
        { onConflict: 'assessment_id,evidence_object_id' }
      ).select();

      if (error) throw error;

      // Update assessment status
      await supabase.from('sql_assessments').update({
        assessment_status: 'collecting_evidence'
      }).eq('id', assessment_id);

      return new Response(JSON.stringify({ status: 'success', upserted: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'execute-sql-reasoning') {
      const { assessment_id, industry_context, evidence_context, qualification_policy } = body;
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured.');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update assessment status to processing
      await supabase.from('sql_assessments').update({ assessment_status: 'ai_processing' }).eq('id', assessment_id);

      // Fetch opportunity details
      const { data: assessment, error: assessError } = await supabase.from('sql_assessments').select('*, opportunities(*)').eq('id', assessment_id).single();
      if (assessError) throw assessError;

      const opportunity = assessment.opportunities;

      // Fetch all evidence records entered so far
      const { data: evidenceRecords, error: evError } = await supabase.from('sql_evidence_records').select('*').eq('assessment_id', assessment_id);
      if (evError) throw evError;

      // Extract and map all defined evidence objects across all dimensions in evidence_context
      const allDefinedEvidence: any[] = [];
      if (evidence_context) {
        Object.entries(evidence_context).forEach(([dimensionName, items]) => {
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              allDefinedEvidence.push({
                ...item,
                dimension_name: dimensionName
              });
            });
          }
        });
      }

      // Map evidenceRecords by evidence_object_id for easy lookup
      const evidenceRecordsMap = new Map();
      if (evidenceRecords && Array.isArray(evidenceRecords)) {
        evidenceRecords.forEach((rec: any) => {
          evidenceRecordsMap.set(rec.evidence_object_id, rec);
        });
      }

       // Format the prompt for Gemini using 10 MEDDPICC dimensions and canonical SQL_qualification_rules.json policies
      const canonicalDimensions = [
        { code: 'businessProblem', name: 'Business Problem Validation', weight: 0.15, min: 60, mandatory: true },
        { code: 'businessValue', name: 'Business Value & Financial Impact', weight: 0.15, min: 60, mandatory: true },
        { code: 'metricsSuccessCriteria', name: 'Metrics & Success Criteria', weight: 0.10, min: 50, mandatory: false },
        { code: 'solutionAlignment', name: 'Solution Alignment & Technical Fit', weight: 0.10, min: 50, mandatory: false },
        { code: 'stakeholderAlignment', name: 'Stakeholder Alignment & Champion', weight: 0.10, min: 60, mandatory: true },
        { code: 'decisionCriteria', name: 'Decision Criteria & Evaluation Process', weight: 0.10, min: 50, mandatory: false },
        { code: 'buyingProcessGovernance', name: 'Buying Process & Governance', weight: 0.10, min: 50, mandatory: false },
        { code: 'opportunityMomentum', name: 'Opportunity Momentum & Urgency', weight: 0.10, min: 50, mandatory: false },
        { code: 'commercialReadiness', name: 'Commercial Readiness & Budget', weight: 0.05, min: 50, mandatory: false },
        { code: 'competitivePosition', name: 'Competitive Position & Differentiation', weight: 0.05, min: 40, mandatory: false },
      ];

      const normalizeDimCode = (nameOrCode: string): string => {
        const s = (nameOrCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (s.includes('problem')) return 'businessProblem';
        if (s.includes('value') || s.includes('financial')) return 'businessValue';
        if (s.includes('metric') || s.includes('success')) return 'metricsSuccessCriteria';
        if (s.includes('solution') || s.includes('technical')) return 'solutionAlignment';
        if (s.includes('stakeholder') || s.includes('champion')) return 'stakeholderAlignment';
        if (s.includes('criteria') || s.includes('evaluation')) return 'decisionCriteria';
        if (s.includes('buying') || s.includes('governance') || s.includes('procurement')) return 'buyingProcessGovernance';
        if (s.includes('momentum') || s.includes('urgency')) return 'opportunityMomentum';
        if (s.includes('commercial') || s.includes('budget')) return 'commercialReadiness';
        if (s.includes('competit') || s.includes('differentiat')) return 'competitivePosition';
        return s;
      };

      const systemInstruction = `You are the RevOS SQL Qualification Reasoning Engine.
You are an AI sales qualification strategist specialized in enterprise opportunity assessment.
Your core persona is an elite synthesis of: Senior McKinsey Strategy Partner + Enterprise Chief Revenue Officer (CRO) + B2B RevOps Architect + Solution Selling Authority.
Your role is to analyze sales opportunities using rigorous, evidence-based reasoning governed strictly by the canonical SQL Qualification Policy Engine (SQL_qualification_rules.json).

CANONICAL REASONING GOVERNANCE (BASED ON SQL_QUALIFICATION_RULES.JSON - GRP001):
1. REASONING SEQUENCE (GRP001):
   - Step 1: Understand Customer Context & Revenue Motion Nuances.
   - Step 2: Extract & Verify Defined Evidence against Positive/Negative Criteria.
   - Step 3: Evaluate Evidence Quality & Discount Unverified Claims (EEP001).
   - Step 4: Calculate Dimension Scores with Evidence Weighting (DSP001).
   - Step 5: Synthesize Overall Score & Confidence (OSP001 & CFP001).
   - Step 6: Test Against Non-Negotiable Critical Gates (CG001 - CG005).
   - Step 7: Determine Qualification Outcome & Generate Actionable Discovery Remediation (QDP001 & RCP001).

2. EVIDENCE QUALITY TIERS (EEP001):
   - Strong (80-100): Evidence is verified, specific, customer-confirmed, and tied to strategic objectives.
   - Moderate (50-79): Evidence exists but requires customer validation or quantified metric confirmation.
   - Weak (20-49): Evidence is incomplete, based on seller assumptions, or insufficiently validated.
   - Missing / Negative (0-19): Required evidence is unanswered, unknown, or explicitly negated.

3. CRITICAL GATE EVALUATION (CGP001 - MANDATORY GATES):
   - CG001 (Business Problem Validation): Dimension score below threshold (<60) OR no validated business challenge identified -> BLOCKS SQL qualification (Outcome must be 'Needs_Nurturing' or 'Disqualified', Max Confidence: 40).
   - CG002 (Customer Evidence Validation): Evidence exists primarily from seller assumptions without customer confirmation -> BLOCKS SQL qualification (Outcome must be 'Needs_Nurturing', Max Confidence: 50).
   - CG003 (Stakeholder Alignment): No identified business owner, sponsor, or champion -> LIMITS qualification to 'Borderline_SQL' (Max Confidence: 60).
   - CG004 (Buying Process Visibility): No understanding of customer evaluation, approval, or procurement workflow -> LIMITS qualification to 'Borderline_SQL' (Max Confidence: 60).
   - CG005 (Commercial Feasibility): No realistic commercial pathway or budget identified -> BLOCKS SQL qualification (Outcome must be 'Disqualified', Max Confidence: 50).

4. DIMENSION WEIGHTING (DSP001 & OSP001):
   - Business Problem Validation (businessProblem): 15% (Min Threshold: 60, Mandatory)
   - Business Value & Financial Impact (businessValue): 15% (Min Threshold: 60, Mandatory)
   - Metrics & Success Criteria (metricsSuccessCriteria): 10% (Min Threshold: 50)
   - Solution Alignment & Technical Fit (solutionAlignment): 10% (Min Threshold: 50)
   - Stakeholder Alignment & Champion (stakeholderAlignment): 10% (Min Threshold: 60, Mandatory)
   - Decision Criteria & Evaluation Process (decisionCriteria): 10% (Min Threshold: 50)
   - Buying Process & Governance (buyingProcessGovernance): 10% (Min Threshold: 50)
   - Opportunity Momentum & Urgency (opportunityMomentum): 10% (Min Threshold: 50)
   - Commercial Readiness & Budget (commercialReadiness): 5% (Min Threshold: 50)
   - Competitive Position & Differentiation (competitivePosition): 5% (Min Threshold: 40)

5. QUALIFICATION DECISION POLICY (QDP001):
   - 'SQL_Qualified': Score >= 75, Confidence >= 70, all mandatory dimensions pass (>=60), zero critical gate failures.
   - 'Borderline_SQL': Score >= 55, Confidence >= 45, zero blocking critical gates (CG001, CG002, CG005 not failed).
   - 'Needs_Nurturing': Score >= 30, Confidence >= 30, or non-disqualifying gate triggered.
   - 'Disqualified': Score < 30 OR severe blocker (e.g. CG005 failed).

CORE TONE & FORMAT RULES (ANTI-MACHINERY & CONSULTATIVE PROSE):
- Write like a polished enterprise consultant and revenue strategist. Use natural, assertive, elegant, and factual business language.
- Avoid machinery phrasing, programmatic keys, database column names, or question identifiers in your narrative summaries.
- Relate evidence gaps directly to prospective deal slippage, procurement friction, or competitor displacement risks.

EVIDENCE MATCHING & SCORING FIDELITY (QDP001 / EEP001):
- High-quality, customer-confirmed evidence answers providing specific metrics, operational impact, strategic linkages, and executive validation represent authentic enterprise qualification excellence. You MUST score these answers in the Strong tier (85-100) and highlight them as key opportunity strengths.
- Do NOT downgrade an answer that provides explicit customer-verified facts and positive signals.
- For missing, uncollected, or adverse responses, score in the Missing (0-19) or Weak (20-45) tier and flag appropriate risks.`;

      const prompt = `
=== OPPORTUNITY CONTEXT ===
Opportunity Name: ${opportunity.opportunity_name}
Company Name: ${opportunity.company_name}
Revenue Motion: ${opportunity.revenue_motion || 'Generic Solution Selling'}
Industry: ${opportunity.industry || 'Enterprise Software'}
Description: ${opportunity.description || 'N/A'}
Source: ${opportunity.source || 'MQL'}
MQL Reference ID: ${opportunity.mql_reference_id || 'N/A'}

=== APPLICABLE INDUSTRY CONTEXT ===
${JSON.stringify(industry_context || {})}

=== CANONICAL QUALIFICATION RULES SPECIFICATION ===
- Governing Framework: 10 MEDDPICC Dimensions with Canonical Weights:
  1. Business Problem Validation (15%, Min: 60)
  2. Business Value & Financial Impact (15%, Min: 60)
  3. Metrics & Success Criteria (10%, Min: 50)
  4. Solution Alignment & Technical Fit (10%, Min: 50)
  5. Stakeholder Alignment & Champion (10%, Min: 60)
  6. Decision Criteria & Evaluation Process (10%, Min: 50)
  7. Buying Process & Governance (10%, Min: 50)
  8. Opportunity Momentum & Urgency (10%, Min: 50)
  9. Commercial Readiness & Budget (5%, Min: 50)
  10. Competitive Position & Differentiation (5%, Min: 40)

- Critical Gates (CG001-CG005):
  * CG001: BP score < 60 or no validated business challenge -> BLOCKS SQL (Outcome: Needs_Nurturing / Disqualified, Max Conf: 40)
  * CG002: Customer evidence unconfirmed seller assumptions -> BLOCKS SQL (Outcome: Needs_Nurturing, Max Conf: 50)
  * CG003: No identified business owner / champion -> LIMITS to Borderline_SQL (Max Conf: 60)
  * CG004: Unknown evaluation / procurement process -> LIMITS to Borderline_SQL (Max Conf: 60)
  * CG005: No realistic budget / commercial pathway -> BLOCKS SQL (Outcome: Disqualified, Max Conf: 50)

=== DEFINED EVIDENCE QUESTIONS & ACTUAL USER RESPONSES ===
Analyze the actual user-entered answer for each and every evidence question below:

${allDefinedEvidence.map(item => {
  const rec = evidenceRecordsMap.get(item.evidence_id);
  let actualResponse = "";
  let notes = "";

  if (rec) {
    try {
      const parsed = JSON.parse(rec.evidence_content || "{}");
      actualResponse = parsed.response || parsed.suggested || "";
      notes = parsed.notes || "";
    } catch (e) {
      actualResponse = rec.evidence_content || "";
    }
  }

  const isBlank = !actualResponse || actualResponse.trim() === "" || actualResponse.toLowerCase() === "not specified / unknown";
  const displayResponse = isBlank ? "[UNANSWERED / NO EVIDENCE COLLECTED]" : actualResponse.trim();

  return `
  - **Dimension**: ${item.dimension_name}
  - **Evidence ID**: ${item.evidence_id}
  - **Evidence Name**: ${item.evidence_name}
  - **Question Prompt**: "${item.question}"
  - **Required**: ${item.required ? 'Yes' : 'No'}
  - **Expected Positive Signals (Reference Standards)**: ${JSON.stringify(item.positive_signals || [])}
  - **Expected Negative Signals (Adverse Indicators)**: ${JSON.stringify(item.negative_signals || [])}
  - **Actual User-Entered Answer**: "${displayResponse}"
  ${notes ? `- **Additional User Notes**: "${notes}"` : ''}
  `;
}).join('\n')}

EVALUATION INSTRUCTIONS:
1. For every question in "evidence_assessments":
   - CRITICAL: You MUST include an assessment entry for EVERY SINGLE EVIDENCE QUESTION listed above (all ${allDefinedEvidence.length} questions). Do NOT omit, skip, or truncate any question.
   - "evidence_object_id" MUST be the EXACT "Evidence ID" string provided in the question details above (e.g. "${allDefinedEvidence[0]?.evidence_id || 'ev_01'}").
   - EVALUATE THE USER'S ACTUAL ANSWER OBJECTIVELY ON ITS SUBSTANTIVE CONTENT:
     * The user's answer may be manual text input (e.g. discovery findings, interview quotes, operational metrics) or a chosen response.
     * DO NOT rely on or look for pre-assigned tier categories. Judge the actual semantic content of "Actual User-Entered Answer" directly against "Expected Positive Signals" and "Expected Negative Signals".
     * POSITIVE SIGNAL EVALUATION (80-100 score, evidence_strength: "strong", matched_type: "positive"):
       When the text articulates tangible customer validation, quantified operational metrics, executive sponsorship, or clear strategic priority aligning with Expected Positive Signals, you MUST award a Strong Positive score (80-100). Do NOT discount or label customer-verified statements as unverified seller assumptions unless the text itself states it is merely a speculative seller guess.
     * MODERATE / IN-PROGRESS EVALUATION (50-79 score, evidence_strength: "moderate", matched_type: "neutral"):
       When the text reflects acknowledged pain or early alignment, but operational metrics or formal approvals remain in progress.
     * WEAK / ADVERSE EVALUATION (20-49 score, evidence_strength: "weak", matched_type: "negative"):
       When the text reflects low priority, rep conjecture without customer confirmation, or partial friction.
     * CRITICAL BLOCKER / MISSING EVALUATION (0-19 score, evidence_strength: "missing", matched_type: "negative"):
       When the text confirms explicit blocker conditions (e.g. budget frozen, competitor locked in, pain dismissed by leadership), OR when the question is marked [UNANSWERED / NO EVIDENCE COLLECTED].
   - CRITICAL REQUIREMENT FOR "identification_assessment":
     Write an authentic, professional, 2-3 sentence executive audit evaluating the user's specific answer against the Expected Positive/Negative signals and citing details from the user's text. Explain why the evidence is strong, moderate, weak, or missing, and its impact on deal qualification under Policy EEP001. If unanswered, state clearly what customer evidence is missing and the specific deal risk it creates.
   - For "validation_assessment", summarize customer validation rigor and stakeholder confirmation demonstrated in the text.
   - For "depth_assessment", summarize operational depth and metric quantification demonstrated in the text.
2. For every dimension in "dimension_assessments", calculate the dimension score (0-100) mathematically reflecting the evidence question scores in that dimension.
3. In "critical_gates", evaluate all 5 gates (CG001 to CG005) objectively. A gate is triggered (triggered=true) ONLY if the actual evidence text demonstrates the blocker condition.
4. Calculate "overall_score" and "qualification_status" strictly adhering to QDP001.
5. Formulate "sql_promotion_recommendation" which contains:
   - "should_promote": boolean, true if qualification status is 'SQL_Qualified' or 'Borderline_SQL', false otherwise.
   - "decision": "YES" if should_promote is true, else "NO".
   - "recommendation_rationale": A dynamic, context-aware 2-3 sentence strategic executive rationale explaining the decision. If yes, highlight key positive evidence, deal momentum, and any trailing validation next steps. If no, highlight the critical evidence gaps or blocker risks. Keep the tone elite, McKinsey-style consultative prose without database or machinery jargon.
`;

      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.0,
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              qualification_summary: {
                type: Type.OBJECT,
                properties: {
                  qualification_status: { type: Type.STRING },
                  overall_score: { type: Type.NUMBER },
                  confidence_score: { type: Type.NUMBER },
                  summary: { type: Type.STRING }
                },
                required: ["qualification_status", "overall_score", "confidence_score", "summary"]
              },
              critical_gates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    gate_id: { type: Type.STRING },
                    gate_name: { type: Type.STRING },
                    triggered: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING }
                  },
                  required: ["gate_id", "gate_name", "triggered", "reason"]
                }
              },
              dimension_assessments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension_code: { type: Type.STRING },
                    dimension_name: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    assessment_summary: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    risks: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["dimension_code", "dimension_name", "score", "confidence", "assessment_summary", "strengths", "weaknesses", "risks"]
                }
              },
              evidence_assessments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    evidence_object_id: { type: Type.STRING },
                    evidence_strength: { type: Type.STRING },
                    matched_type: { type: Type.STRING },
                    signal_score: { type: Type.NUMBER },
                    identification_assessment: { type: Type.STRING },
                    validation_assessment: { type: Type.STRING },
                    depth_assessment: { type: Type.STRING }
                  },
                  required: ["evidence_object_id", "evidence_strength", "matched_type", "signal_score", "identification_assessment", "validation_assessment", "depth_assessment"]
                }
              },
              risk_analysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    risk_description: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  },
                  required: ["category", "risk_description", "severity"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    recommendation_id: { type: Type.STRING },
                    category: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    related_dimension: { type: Type.STRING },
                    action: { type: Type.STRING },
                    expected_business_impact: { type: Type.STRING }
                  },
                  required: ["recommendation_id", "category", "priority", "related_dimension", "action", "expected_business_impact"]
                }
              },
              explainability: {
                type: Type.OBJECT,
                properties: {
                  decision_reasoning: { type: Type.STRING },
                  key_decision_factors: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["decision_reasoning", "key_decision_factors"]
              },
              validation: {
                type: Type.OBJECT,
                properties: {
                  validation_status: { type: Type.STRING },
                  missing_information: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["validation_status", "missing_information"]
              },
              sql_promotion_recommendation: {
                type: Type.OBJECT,
                properties: {
                  should_promote: { type: Type.BOOLEAN },
                  decision: { type: Type.STRING },
                  recommendation_rationale: { type: Type.STRING }
                },
                required: ["should_promote", "decision", "recommendation_rationale"]
              }
            },
            required: ["qualification_summary", "critical_gates", "dimension_assessments", "evidence_assessments", "risk_analysis", "recommendations", "explainability", "validation", "sql_promotion_recommendation"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const executionTimeMs = Date.now() - startTime;

      // =========================================================================
      // DETERMINISTIC RULE GUARDRAIL ENGINE (DSP001, OSP001, CGP001, QDP001)
      // =========================================================================

      // 1. Harmonize evidence assessments from Gemini reasoning engine and guarantee complete coverage
      const eaMap = new Map<string, any>();
      if (Array.isArray(result.evidence_assessments)) {
        result.evidence_assessments.forEach((ea: any) => {
          if (ea && ea.evidence_object_id) {
            eaMap.set(ea.evidence_object_id, ea);
          }
        });
      }

      const verifiedEvidenceAssessments = allDefinedEvidence.map((evDef: any) => {
        const ea = eaMap.get(evDef.evidence_id);
        const matchType = ea?.matched_type === 'positive' || (typeof ea?.signal_score === 'number' && ea.signal_score >= 80) ? 'positive'
          : ea?.matched_type === 'negative' || (typeof ea?.signal_score === 'number' && ea.signal_score < 50) ? 'negative'
          : 'neutral';
        
        return {
          evidence_object_id: evDef.evidence_id,
          evidence_name: evDef.evidence_name || evDef.question || evDef.evidence_id,
          dimension_name: evDef.dimension_name || '',
          evidence_strength: ea?.evidence_strength || (matchType === 'positive' ? 'strong' : matchType === 'negative' ? 'weak' : 'moderate'),
          matched_type: ea?.matched_type || matchType,
          signal_score: typeof ea?.signal_score === 'number' ? ea.signal_score : (matchType === 'positive' ? 85 : matchType === 'negative' ? 35 : 60),
          identification_assessment: ea?.identification_assessment || ea?.depth_assessment || ea?.validation_assessment || "No AI audit assessment provided by reasoning engine for this question.",
          validation_assessment: ea?.validation_assessment || "",
          depth_assessment: ea?.depth_assessment || "",
          tags: [
            { label: evDef.dimension_name || 'Dimension', type: 'dimension' },
            { label: matchType === 'positive' ? 'POSITIVE MATCH' : matchType === 'negative' ? 'NEGATIVE MATCH' : 'NEUTRAL MATCH', type: matchType }
          ]
        };
      });

      result.evidence_assessments = verifiedEvidenceAssessments;

      const dimCodeToEvidenceScores: Record<string, number[]> = {};
      result.evidence_assessments.forEach((ea: any) => {
        const dimCode = normalizeDimCode(ea.dimension_name || '');
        if (!dimCodeToEvidenceScores[dimCode]) dimCodeToEvidenceScores[dimCode] = [];
        if (typeof ea.signal_score === 'number') {
          dimCodeToEvidenceScores[dimCode].push(ea.signal_score);
        }
      });

      // 2. Harmonize & verify all 10 canonical dimensions
      const existingDimMap = new Map();
      if (Array.isArray(result.dimension_assessments)) {
        result.dimension_assessments.forEach((da: any) => {
          const c = normalizeDimCode(da.dimension_code || da.dimension_name);
          existingDimMap.set(c, da);
        });
      }

      let weightedScoreSum = 0;
      let totalWeight = 0;
      const verifiedDimensionAssessments: any[] = [];

      canonicalDimensions.forEach(dim => {
        const existing = existingDimMap.get(dim.code);
        const evScores = dimCodeToEvidenceScores[dim.code] || [];
        const evAvg = evScores.length > 0 ? Math.round(evScores.reduce((a, b) => a + b, 0) / evScores.length) : null;

        let dimScore = existing && typeof existing.score === 'number' ? existing.score : (evAvg ?? 50);

        // Guardrail: if Gemini's dimension score significantly diverges from evidence scores, snap to evidence average
        if (evAvg !== null && Math.abs(dimScore - evAvg) > 15) {
          dimScore = evAvg;
        }

        weightedScoreSum += dimScore * dim.weight;
        totalWeight += dim.weight;

        verifiedDimensionAssessments.push({
          dimension_code: dim.code,
          dimension_name: dim.name,
          score: dimScore,
          confidence: existing && typeof existing.confidence === 'number' ? existing.confidence : 70,
          assessment_summary: existing?.assessment_summary || `${dim.name} evaluated.`,
          strengths: Array.isArray(existing?.strengths) ? existing.strengths : [],
          weaknesses: Array.isArray(existing?.weaknesses) ? existing.weaknesses : [],
          risks: Array.isArray(existing?.risks) ? existing.risks : []
        });
      });

      result.dimension_assessments = verifiedDimensionAssessments;

      // 3. Compute mathematically verified Overall Score (OSP001)
      const calculatedOverallScore = Math.round(weightedScoreSum / (totalWeight || 1));

      // 4. Evaluate Critical Gates Deterministically (CG001 - CG005)
      const bpDim = verifiedDimensionAssessments.find(d => d.dimension_code === 'businessProblem');
      const shaDim = verifiedDimensionAssessments.find(d => d.dimension_code === 'stakeholderAlignment');
      const bpgDim = verifiedDimensionAssessments.find(d => d.dimension_code === 'buyingProcessGovernance');
      const crDim = verifiedDimensionAssessments.find(d => d.dimension_code === 'commercialReadiness');

      const bpScore = bpDim?.score ?? 0;
      const shaScore = shaDim?.score ?? 0;
      const bpgScore = bpgDim?.score ?? 0;
      const crScore = crDim?.score ?? 0;

      const aiGates: any[] = Array.isArray(result.critical_gates) ? result.critical_gates : [];
      const isAIGateTriggered = (id: string) => aiGates.some(g => g.gate_id === id && g.triggered === true);

      const cg001Triggered = bpScore < 60 || isAIGateTriggered('CG001');
      const cg002Triggered = isAIGateTriggered('CG002');
      const cg003Triggered = shaScore < 50 || isAIGateTriggered('CG003');
      const cg004Triggered = bpgScore < 45 || isAIGateTriggered('CG004');
      const cg005Triggered = crScore < 40 || isAIGateTriggered('CG005');

      // 5. Calculate Confidence Score & Apply Gate Caps (CFP001)
      let calculatedConfidence = typeof result.qualification_summary?.confidence_score === 'number'
        ? result.qualification_summary.confidence_score
        : 65;

      if (cg001Triggered) calculatedConfidence = Math.min(calculatedConfidence, 40);
      if (cg002Triggered) calculatedConfidence = Math.min(calculatedConfidence, 50);
      if (cg005Triggered) calculatedConfidence = Math.min(calculatedConfidence, 50);
      if (cg003Triggered) calculatedConfidence = Math.min(calculatedConfidence, 60);
      if (cg004Triggered) calculatedConfidence = Math.min(calculatedConfidence, 60);

      // 6. Determine Qualification Status Strictly from Policy Rules (QDP001)
      let finalStatus = 'Borderline_SQL';
      let statusRationale = '';

      if (cg005Triggered || calculatedOverallScore < 30) {
        finalStatus = 'Disqualified';
        statusRationale = cg005Triggered
          ? 'Disqualified by Critical Gate CG005: Commercial feasibility and purchasing pathway are unviable.'
          : 'Disqualified: Overall qualification score falls below the minimum viable threshold (30).';
      } else if (cg001Triggered || cg002Triggered) {
        finalStatus = 'Needs_Nurturing';
        statusRationale = cg001Triggered
          ? 'Qualification Blocked by Critical Gate CG001: Business Problem validation score is below mandatory threshold (60).'
          : 'Qualification Blocked by Critical Gate CG002: Evidence is primarily unconfirmed seller assumptions.';
      } else if (cg003Triggered || cg004Triggered) {
        finalStatus = 'Borderline_SQL';
        statusRationale = cg003Triggered
          ? 'Limited to Borderline SQL by Critical Gate CG003: Executive stakeholder or champion is unconfirmed.'
          : 'Limited to Borderline SQL by Critical Gate CG004: Customer buying and procurement governance process is unverified.';
      } else if (calculatedOverallScore >= 75 && calculatedConfidence >= 70 && bpScore >= 60 && shaScore >= 60) {
        finalStatus = 'SQL_Qualified';
        statusRationale = 'SQL Qualified: Strong evidence maturity, verified business problem, and clear buying readiness.';
      } else if (calculatedOverallScore >= 55 && calculatedConfidence >= 45) {
        finalStatus = 'Borderline_SQL';
        statusRationale = 'Borderline SQL: Moderate qualification maturity; requires targeted discovery before full confirmation.';
      } else {
        finalStatus = 'Needs_Nurturing';
        statusRationale = 'Needs Nurturing: Insufficient qualification maturity across core MEDDPICC dimensions.';
      }

      // 7. Update qualification_summary with verified canonical data
      if (!result.qualification_summary) result.qualification_summary = {};
      result.qualification_summary.overall_score = calculatedOverallScore;
      result.qualification_summary.confidence_score = calculatedConfidence;
      result.qualification_summary.qualification_status = finalStatus;

      if (statusRationale) {
        const existingSummary = result.qualification_summary.summary || '';
        if (!existingSummary.toLowerCase().includes(finalStatus.toLowerCase().replace(/_/g, ' '))) {
          result.qualification_summary.summary = `${statusRationale} ${existingSummary}`.trim();
        }
        if (result.explainability) {
          result.explainability.decision_reasoning = `${statusRationale} ${result.explainability.decision_reasoning || ''}`.trim();
        }
      }

      // 8. Harmonize SQL Promotion Recommendation with verified canonical status
      if (!result.sql_promotion_recommendation) {
        result.sql_promotion_recommendation = {};
      }
      const shouldPromote = finalStatus === 'SQL_Qualified' || finalStatus === 'Borderline_SQL';
      result.sql_promotion_recommendation.should_promote = shouldPromote;
      result.sql_promotion_recommendation.decision = shouldPromote ? "YES" : "NO";
      if (!result.sql_promotion_recommendation.recommendation_rationale) {
        result.sql_promotion_recommendation.recommendation_rationale = shouldPromote
          ? `All core MEDDPICC dimensions show strong alignment. The opportunity is cleared for standard pipeline promotion and executive resource allocation.`
          : `Do not promote yet. Critical business problems, metrics, or stakeholder inputs are missing. Re-engage in active discovery before promoting.`;
      }

      // Save Reasoning Session
      await supabase.from('sql_reasoning_sessions').insert({
        assessment_id,
        model_name: 'gemini-3.1-flash-lite',
        prompt_version: 'v2.0-guardrailed',
        input_context: { opportunity, evidenceRecords },
        output_response: result,
        execution_status: 'success',
        execution_time_ms: executionTimeMs
      });

      // Save Dimension Results
      if (result.dimension_assessments && Array.isArray(result.dimension_assessments)) {
        await supabase.from('sql_dimension_results').delete().eq('assessment_id', assessment_id);
        
        await supabase.from('sql_dimension_results').insert(
          result.dimension_assessments.map((da: any) => ({
            assessment_id,
            dimension_code: da.dimension_code,
            dimension_name: da.dimension_name,
            score: da.score,
            confidence: da.confidence,
            assessment_summary: da.assessment_summary,
            strengths: da.strengths,
            weaknesses: da.weaknesses,
            risks: da.risks
          }))
        );
      }

      // Save Recommendations
      if (result.recommendations && Array.isArray(result.recommendations)) {
        await supabase.from('sql_recommendations').delete().eq('assessment_id', assessment_id);
        
        await supabase.from('sql_recommendations').insert(
          result.recommendations.map((rec: any) => ({
            assessment_id,
            dimension_code: rec.related_dimension,
            priority: rec.priority,
            recommendation: rec.action,
            expected_impact: rec.expected_business_impact,
            status: 'pending'
          }))
        );
      }

      // Update assessment with results
      const { data: updatedAssessment, error: updateAssessError } = await supabase.from('sql_assessments').update({
        assessment_status: 'completed',
        qualification_status: result.qualification_summary.qualification_status,
        overall_score: result.qualification_summary.overall_score,
        confidence_score: result.qualification_summary.confidence_score,
        completed_at: new Date().toISOString()
      }).eq('id', assessment_id).select().single();

      if (updateAssessError) throw updateAssessError;

      return new Response(JSON.stringify({
        assessment: updatedAssessment,
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'retrieve-sql-assessment-result') {
      const { assessment_id } = body;
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured.');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch assessment & opportunity
      const { data: assessment, error: assessError } = await supabase.from('sql_assessments').select('*, opportunities(*)').eq('id', assessment_id).single();
      if (assessError) throw assessError;

      // Fetch dimension results
      const { data: dimensions, error: dimError } = await supabase.from('sql_dimension_results').select('*').eq('assessment_id', assessment_id);
      if (dimError) throw dimError;

      // Fetch recommendations
      const { data: recommendations, error: recError } = await supabase.from('sql_recommendations').select('*').eq('assessment_id', assessment_id);
      if (recError) throw recError;

      // Fetch evidence records
      const { data: evidence, error: evError } = await supabase.from('sql_evidence_records').select('*').eq('assessment_id', assessment_id);
      if (evError) throw evError;

      return new Response(JSON.stringify({
        assessment,
        dimensions,
        recommendations,
        evidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate-sales-handover') {
      const { lead, campaign, qualificationResult } = body;
      
      const prompt = `You are a top-tier sales engineer and RevOps strategist. Create high-signal, professional sales handover intelligence materials for a qualified lead based on their details, campaign context, and qualification assessment.
      
      LEAD DETAILS:
      - Name: ${lead?.first_name || ''} ${lead?.last_name || ''}
      - Title: ${lead?.job_title || ''}
      - Company: ${lead?.company_name || ''}
      - Email: ${lead?.email || ''}
      
      CAMPAIGN/ICP CONTEXT:
      - Campaign Name: ${campaign?.name || ''}
      - ICP Definition: ${campaign?.icp_definition || ''}
      - Revenue Motion: ${campaign?.revenue_motion || ''}
      
      QUALIFICATION RESULT:
      - Overall Score: ${qualificationResult?.qualification_score || 'N/A'}/100
      - Status: ${qualificationResult?.qualification_status || 'N/A'}
      - Dimensional Scores: ${qualificationResult?.dimension_scores ? JSON.stringify(qualificationResult.dimension_scores) : 'N/A'}
      - Supporting Evidence: ${qualificationResult?.supporting_evidence ? JSON.stringify(qualificationResult.supporting_evidence) : 'N/A'}
      - Negative Evidence: ${qualificationResult?.negative_evidence ? JSON.stringify(qualificationResult.negative_evidence) : 'N/A'}
      - Missing Evidence: ${qualificationResult?.missing_evidence ? JSON.stringify(qualificationResult.missing_evidence) : 'N/A'}
      - Reasoning: ${qualificationResult?.reasoning?.summary || ''}
      
      Generate:
      1. summary: A qualification summary of maximum 50 words outlining why this lead is ready for sales engagement.
      2. buying_signals: An array of 3-4 realistic buying signals identified or inferred from the positive/supporting evidence (e.g., "Requested platform demo", "Displays pricing interest during discussion", "Identified economic buyer as sponsor").
      3. risks: An array of 2-3 key risks or critical unknowns identified or inferred from the negative/missing evidence (e.g., "Budget is currently unknown", "Procurement timeline remains undefined").
      4. next_best_actions: An array of 3-4 prioritized next best actions for the sales representative to take immediately (e.g., "Validate budget authorization", "Schedule initial technical discovery", "Invite executive sponsor to demo").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: "You are an analytical lead-qualification and sales enablement assistant. Keep your text highly specific, professional, and devoid of marketing fluff.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              buying_signals: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              next_best_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "buying_signals", "risks", "next_best_actions"]
          }
        }
      });

      return new Response(response.text || "{}", {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate-sql-suggested-answers') {
      const { opportunity_id, revenue_motion, industry, evidence_questions } = body;

      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
      let opp: any = null;

      if (supabaseUrl && supabaseKey && opportunity_id) {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data } = await supabase.from('opportunities').select('*').eq('id', opportunity_id).maybeSingle();
          opp = data;
        } catch (e) {
          console.warn("Could not fetch opportunity details for suggested answers:", e);
        }
      }

      const oppContext = `
- Opportunity Name: ${opp?.opportunity_name || 'Enterprise Account Initiative'}
- Company / Customer: ${opp?.company_name || 'Target Enterprise Account'}
- Industry: ${opp?.industry || industry || 'Enterprise Software / SaaS'}
- Revenue Motion: ${opp?.revenue_motion || revenue_motion || 'Digital Solution Selling'}
- Estimated Deal Size: ${opp?.amount ? `$${opp.amount}` : '$150,000 - $350,000 ARR'}
- Stage: ${opp?.stage_name || 'Discovery / SQL Qualification'}
- Description / Scope: ${opp?.description || 'Enterprise platform modernization and operational efficiency initiative'}
`;

      const questionsList = (Array.isArray(evidence_questions) ? evidence_questions : []).map((q: any) => {
        return `
### EVIDENCE QUESTION ID: ${q.evidence_id}
- Dimension: ${q.dimension_name || ''}
- Question Title: ${q.evidence_name || q.name || q.evidence_id}
- Question Prompt: "${q.question || ''}"
- Required: ${q.required ? 'Yes' : 'No'}
- Expected Positive Signals: ${JSON.stringify(q.positive_signals || [])}
- Expected Negative Signals: ${JSON.stringify(q.negative_signals || [])}
`;
      }).join('\n');

      const prompt = `
You are the RevOS Chief Revenue Officer and Enterprise Lead Qualification Engine.
Your task is to generate dynamic, authentic, highly contextualized suggested discovery response options for sales representatives qualifying an enterprise deal under the MEDDPICC framework.

OPPORTUNITY CONTEXT:
${oppContext}

EVIDENCE QUESTIONS TO EVALUATE:
${questionsList}

GENERATION REQUIREMENTS:
For EVERY evidence question, generate exactly 4 distinct response options covering 4 qualification tiers:
1. 'strong' (Strong Positive Match, 85-100 score):
   - A customer-confirmed, quantified, executive-backed discovery response with specific operational metrics (% improvement, dollar value, verified timeline, or executive sponsorship).
   - Must explicitly satisfy the Expected Positive Signals so that the SQL qualification reasoning engine scores it as an indisputable Strong Positive Match (85-100).
   - "label": Must start with "[Strong Positive]" followed by a brief 4-8 word title (e.g. "[Strong Positive] VP confirmed 18% churn increase with Q4 mandate").
   - "text": 1-2 realistic, professional sentences articulating customer-verified evidence.

2. 'moderate' (Moderate / In-Progress Match, 55-70 score):
   - Customer acknowledged pain or need, but ROI metrics are approximate and formal executive sign-off is pending.
   - "label": Must start with "[Moderate / In-Progress]" followed by a brief 4-8 word title.
   - "text": 1-2 realistic sentences reflecting genuine customer interest with pending validation.

3. 'weak' (Weak / Seller Assumption, 25-45 score):
   - High-level conversational interest or seller speculation without verified customer data or executive champion confirmation.
   - "label": Must start with "[Weak / Assumption]" followed by a brief 4-8 word title.
   - "text": 1 sentence showing seller impression without customer proof.

4. 'negative' (Adverse / Blocker, 0-20 score):
   - Discovery shows frozen budget, no active challenge, or competitor lock-in.
   - "label": Must start with "[Adverse / Blocker]" followed by a brief 4-8 word title.
   - "text": 1 sentence stating the blocker.

Return a valid JSON object matching the requested schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.0,
          systemInstruction: "You are an elite enterprise B2B sales qualification consultant. Generate precise, realistic, high-signal discovery answers adhering strictly to enterprise MEDDPICC qualification standards. Never use robotic phrases.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggested_answers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    evidence_id: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          tier: { type: Type.STRING, enum: ["strong", "moderate", "weak", "negative"] },
                          label: { type: Type.STRING },
                          text: { type: Type.STRING }
                        },
                        required: ["tier", "label", "text"]
                      }
                    }
                  },
                  required: ["evidence_id", "options"]
                }
              }
            },
            required: ["suggested_answers"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{"suggested_answers":[]}');

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { leadId, combinedConfig, ruleSet } = body;
    if (!leadId) {
      throw new Error('leadId is required');
    }

    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
       throw new Error('Supabase credentials not configured.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead, campaign, and assessments
    const { data: lead, error: leadError } = await supabase.from('mql_leads').select('*, mql_campaigns(*)').eq('id', leadId).single();
    if (leadError) throw leadError;

    const { data: assessments, error: assessmentError } = await supabase.from('mql_evidence_assessments').select('*').eq('lead_id', leadId);
    if (assessmentError) throw assessmentError;

    const campaign = lead.mql_campaigns;

    const prompt = buildQualificationPrompt(lead, assessments, campaign, combinedConfig, ruleSet);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            qualification_status: { type: Type.STRING, enum: ['Highly Qualified MQL', 'Qualified MQL', 'Marketing Nurture', 'Disqualified'] },
            qualification_score: { type: Type.NUMBER },
            confidence_score: { type: Type.NUMBER },
            dimension_scores: {
              type: Type.OBJECT,
              properties: {
                fit: { type: Type.NUMBER },
                intent: { type: Type.NUMBER },
                engagement: { type: Type.NUMBER },
                timing: { type: Type.NUMBER }
              },
              required: ['fit', 'intent', 'engagement', 'timing']
            },
            supporting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            negative_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                fit: { type: Type.STRING },
                intent: { type: Type.STRING },
                engagement: { type: Type.STRING },
                timing: { type: Type.STRING },
                evidence_evaluations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      evidence_id: { type: Type.STRING },
                      evidence_name: { type: Type.STRING },
                      dimension: { type: Type.STRING },
                      score: { type: Type.NUMBER },
                      matched_type: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ['evidence_id', 'evidence_name', 'dimension', 'score', 'matched_type', 'reason']
                  }
                }
              },
              required: ['summary', 'fit', 'intent', 'engagement', 'timing', 'evidence_evaluations']
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            next_best_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['qualification_status', 'qualification_score', 'confidence_score', 'dimension_scores', 'supporting_evidence', 'negative_evidence', 'missing_evidence', 'reasoning', 'recommendations', 'next_best_actions']
        },
        systemInstruction: "You are an analytical qualification engine."
      }
    });

    const result = JSON.parse(response.text || '{}');

    // Dynamically recalculate overall qualification_score to ensure mathematical consistency
    if (result.dimension_scores) {
      let totalWeightedScore = 0;
      let totalWeight = 0;
      
      const defaultWeights = { fit: 0.35, intent: 0.30, engagement: 0.20, timing: 0.15 };
      const dimensions = ruleSet?.engine?.dimensions || defaultWeights;
      
      for (const [dim, value] of Object.entries(result.dimension_scores)) {
        const score = typeof value === 'number' ? value : 0;
        let weight = 0;
        
        if (ruleSet?.engine?.dimensions && ruleSet.engine.dimensions[dim]) {
          weight = typeof ruleSet.engine.dimensions[dim].weight === 'number' 
            ? ruleSet.engine.dimensions[dim].weight 
            : 0;
        } else if (defaultWeights[dim as keyof typeof defaultWeights] !== undefined) {
          weight = defaultWeights[dim as keyof typeof defaultWeights];
        }
        
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
      
      if (totalWeight > 0) {
        result.qualification_score = Math.round(totalWeightedScore / totalWeight);
      }
    }

    // Save to database
    const { data: savedResult, error: saveError } = await supabase.from('mql_qualification_results').upsert({
      lead_id: leadId,
      qualification_status: result.qualification_status,
      qualification_score: result.qualification_score,
      confidence_score: result.confidence_score,
      dimension_scores: result.dimension_scores,
      supporting_evidence: result.supporting_evidence,
      negative_evidence: result.negative_evidence,
      missing_evidence: result.missing_evidence,
      reasoning: result.reasoning,
      recommendations: result.recommendations,
      next_best_actions: result.next_best_actions,
      evaluated_at: new Date().toISOString()
    }).select().single();

    if (saveError) {
      console.error("Save error:", saveError);
    }
    
    // Update lead status
    let nextStatus = 'Assessing';
    if (result.qualification_status === 'Highly Qualified MQL' || result.qualification_status === 'Qualified MQL') {
       nextStatus = 'Qualified';
    } else if (result.qualification_status === 'Marketing Nurture') {
       nextStatus = 'Nurture';
    } else {
       nextStatus = 'Disqualified';
    }
    await supabase.from('mql_leads').update({ status: nextStatus }).eq('id', leadId);

    return new Response(JSON.stringify(savedResult || result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
