import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.VITE_SUPABASE_URL;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.VITE_SUPABASE_ANON_KEY;
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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.VITE_SUPABASE_URL;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.VITE_SUPABASE_ANON_KEY;
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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.VITE_SUPABASE_URL;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.VITE_SUPABASE_ANON_KEY;
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

      // Format the prompt for Gemini using 10 MEDDPICC dimensions
      const systemInstruction = `You are the RevOS SQL Qualification Reasoning Engine.
You are an AI sales qualification strategist specialized in enterprise opportunity assessment.
Your role is to analyze sales opportunities using evidence-based reasoning, qualification policies, and structured business analysis.
You must follow SQL Reasoning Strategy Specification v1.0.
All conclusions must be grounded in available evidence. Do not fabricate facts.`;

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

=== EVIDENCE DEFINITIONS & KNOWLEDGE BASE ===
${JSON.stringify(evidence_context || {})}

=== QUALIFICATION POLICY & RULES ===
${JSON.stringify(qualification_policy || {})}

=== USER-PROVIDED EVIDENCE RECORDS ===
${evidenceRecords.map(rec => `
- **Dimension**: ${rec.dimension_code}
- **Evidence Object ID**: ${rec.evidence_object_id}
- **Content**: "${rec.evidence_content}"
- **Source**: ${rec.evidence_source}
- **Validation Status**: ${rec.validation_status}
`).join('\n')}

Analyze this opportunity across the 10 SQL qualification dimensions:
1. Business Problem (businessProblem)
2. Metrics & Success Criteria (metricsSuccessCriteria)
3. Business Value (businessValue)
4. Solution Alignment (solutionAlignment)
5. Stakeholder Alignment (stakeholderAlignment)
6. Decision Criteria (decisionCriteria)
7. Buying Process & Governance (buyingProcessGovernance)
8. Commercial Readiness (commercialReadiness)
9. Opportunity Momentum (opportunityMomentum)
10. Competitive Position (competitivePosition)

Follow the 10-stage reasoning lifecycle. Generate qualification status (Qualified, Conditionally Qualified, Needs More Evidence, Disqualified), overall score, confidence score, and specific dimension-level results (0-100 score, confidence, summary, strengths, weaknesses, risks). Generate priority actionable recommendations.
`;

      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
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
                    validation_assessment: { type: Type.STRING },
                    depth_assessment: { type: Type.STRING }
                  },
                  required: ["evidence_object_id", "evidence_strength", "validation_assessment", "depth_assessment"]
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
              }
            },
            required: ["qualification_summary", "dimension_assessments", "evidence_assessments", "risk_analysis", "recommendations", "explainability", "validation"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const executionTimeMs = Date.now() - startTime;

      // Save Reasoning Session
      await supabase.from('sql_reasoning_sessions').insert({
        assessment_id,
        model_name: 'gemini-3.1-flash-lite',
        prompt_version: 'v1.0',
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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.VITE_SUPABASE_URL;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.VITE_SUPABASE_ANON_KEY;
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

    const ai = new GoogleGenAI({ apiKey });

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

    const { leadId, combinedConfig, ruleSet } = body;
    if (!leadId) {
      throw new Error('leadId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.VITE_SUPABASE_URL;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.VITE_SUPABASE_ANON_KEY;
    
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
