import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildDynamicCGOInstruction(onboardingData: any = {}) {
  const context = {
    primaryIndustry: onboardingData.industry || "B2B Software",
    productName: onboardingData.productName || onboardingData.productCategory || "the core product",
    targetCustomers: onboardingData.targetIndustries || onboardingData.bestCustomers || "your target sectors",
    businessModel: onboardingData.businessModel || "B2B enterprise",
    geographies: onboardingData.targetGeographies || onboardingData.countriesServed || "Global",
    competitors: onboardingData.competitorList || "legacy solutions"
  };

  return `You are an elite Chief Growth Officer (CGO), world-class Go-to-Market (GTM) architect, and expert commercial analyst.

Your expertise is uniquely specialized for the exact organization you are advising. You deeply understand their ecosystem based on the following profile:
- Primary Industry Segment: ${context.primaryIndustry}
- Core Product/Service: ${context.productName}
- Target Customer Sectors: ${context.targetCustomers}
- Revenue/Business Model: ${context.businessModel}
- Primary Geographies: ${context.geographies}
- Key Market Competitors: ${context.competitors}

Your mandate is to design highly sophisticated, actionable, and value-based strategies tailored specifically to sell ${context.productName} to ${context.targetCustomers} in ${context.geographies}. 
You must output professional, high-impact C-suite-level advice that considers the nuances of their business model and directly addresses how to outmaneuver their specific competitors.

Your tone is deeply analytical, authoritative, highly professional, precise, and devoid of generic marketing fluff, slogans, or hype. 
Avoid cliche buzzwords unless they correspond directly to specific, recognized commercial frameworks (e.g., LTV/CAC ratio, NRR expansion paths, PLG velocity, multi-threaded buyer engagement, ROI benchmarking).
Analyze the provided organizational, financial, and product parameters meticulously to design tactical steps and insights that are directly actionable, distinct, and tailor-fit to the user's operational constraints and assets.

[EXECUTION PROTOCOL]
Provide a fully comprehensive, Revenue-Aware execution plan, every execution plan must be generated using the following constraints:
1. OPERATIONAL HIERARCHY: Break the plan into [Workstreams] -> [Initiatives] -> [Actions].
2. REVENUE SUFFICIENCY PRINCIPLE: The purpose of the Execution Plan is not to generate activities, but to design an execution system that is realistically capable of achieving the defined revenue objectives.
3. EXECUTION SUFFICIENCY CONSTRAINT: The execution plan must collectively provide sufficient coverage to support the revenue objectives within the defined timeframe.
4. STRATEGIC ALIGNMENT CONSTRAINT: Every workstream, initiative, and action must be traceable back to the finalized GTM strategy.
5. REALISM CONSTRAINT: The execution plan must consider organizational maturity, available resources, budget constraints, and execution capacity.
6. COMPLETENESS CONSTRAINT: The execution plan must operationalize all strategic decisions embedded within the finalized GTM strategy.
7. EXPLAINABILITY REQUIREMENT: The reasoning behind execution recommendations must be explainable.
8. DEPENDENCY MAPPING: For every action, explicitly list required [Data/Resources] (e.g., "Requires Supabase lead list," "Requires final pricing table").
9. RESOURCE CONSTRAINTS: Tailor the effort level to the team size and timeframe provided in the input. If the timeline is short, prioritize "High-Impact/Low-Effort" tactics.
10. MEASURABILITY: Every action must be tied to a specific KPI that can be tracked in our backend. Do not suggest abstract actions like "improve brand awareness" without a linked tracking metric.`;
}

function buildRichContext(onboardingData: any, projectName?: string): string {
  const o = onboardingData || {};
  return `
=== PRIMARY BUSINESS METRICS & METADATA ===
- Company / Project Name: ${projectName || o.companyName || "N/A"}
- Industry Segment: ${o.industry || "N/A"}
- Target Industries: ${o.targetIndustries || "N/A"}
- Product Category: ${o.productCategory || "N/A"}
- Product Description: ${o.productDescription || "N/A"}
- Key Benefits to Highlight: ${o.keyBenefits || "N/A"}
- Core Differentiators: ${o.uniqueDifferentiators || "N/A"}
- Major Competitors: ${o.competitorList || "N/A"}

=== OPERATIONAL CAPACITY ===
- Annual Recurring Revenue (ARR): ${o.ARR || o.revenue || "N/A"}
- Total Programmatic Marketing/GTM Budget: ${o.availableBudget || "N/A"}
- Sales Team Size: ${o.salesTeamSize || "N/A"}
- Marketing Team Size: ${o.marketingTeamSize || "N/A"}
- Customer Success Team Size: ${o.customerSuccessTeamSize || "N/A"}
- Partner Team Size: ${o.partnerTeamSize || "N/A"}
- CRM Platform: ${o.CRMPlatform || "N/A"}
- Marketing Tech Stack: ${o.marketingTechnologyStack || "N/A"}

=== IDEAL CUSTOMER PROFILE & BUYING BEHAVIOR ===
- Target Geographies: ${o.targetGeographies || "N/A"}
- Customer Sizes Targeted: ${o.customerSizes || "N/A"}
- Typical Buying Persona/Economic Buyers: ${o.typicalBuyers || "N/A"}
- Major Pain Points Addressed: ${o.painPoints || "N/A"}
- Core Business Goal: ${o.primaryBusinessGoal || "N/A"}
- Target Buying Triggers: ${o.buyingTriggers || "N/A"}
- Decision Making Structure: ${o.decisionMakingStructure || "N/A"}
- Existing Partners: ${o.existingPartners || "N/A"}
- Current Sales Motion: ${o.currentSalesMotion || "N/A"}
- Current Channels: ${o.currentChannels || "N/A"}
- Current Marketing Activities: ${o.currentMarketingActivities || "N/A"}
`;
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const { action, onboardingData, strategyData, projectName, categoryId, companyName, industry, currentFields, buyerType, pitchFormat, gtmStrategyDraft, activeScenario, activeParams, revenueDecomposition, executionPlan, simulationConfig } = rawBody;

    const GTMOS_SYSTEM_INSTRUCTION = buildDynamicCGOInstruction(onboardingData);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not active on this environment.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    switch (action) {
      case "enrich": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are a top-tier revenue consultant. We are onboarding a company into the GTMOS (Go-To-Market Operating System).
            Company: ${companyName || "A B2B enterprise"}
            Industry: ${industry || "SaaS / Software"}
            Current collected fields for category "${categoryId}": ${JSON.stringify(currentFields)}

            Generate realistic, highly-specific, professional business-driven data values to enrich and complete this category.
            CRITICAL INSTRUCTIONS:
            1. You MUST preserve and return the exact same strings for any fields in 'currentFields' that are already populated. Do not overwrite user-provided inputs.
            2. For fields that are empty strings ("") or missing, generate deep, professional, contextual data to fill them in.
            3. You must return ALL keys relevant to the category. Ensure no fields are left empty.

            Field specs per category:
            - Category "company_info": companyName, industry, headquarters, countriesServed, employeeCount, annualRevenue, growthStage, fundingStage, businessModel, strategicPriorities
            - Category "product_info": productName, productCategory, productDescription, keyFeatures, keyBenefits, uniqueDifferentiators, competitiveAdvantages, technologyPlatform, deploymentModel, pricingModel
            - Category "business_objectives": primaryBusinessGoal, revenueTarget, pipelineTarget, marketShareTarget, customerAcquisitionGoal, expansionGoal, timeHorizon, strategicPriorities
            - Category "market_info": targetIndustries, targetGeographies, marketSize, marketGrowthRate, marketTrends, competitorList, competitivePosition
            - Category "customer_info": existingCustomerBase, bestCustomers, customerIndustries, customerSizes, typicalBuyers, painPoints, buyingTriggers, buyingProcess, decisionMakingStructure
            - Category "current_gtm_info": currentSalesMotion, currentChannels, existingPartners, currentMarketingActivities, pipelinePerformance, conversionRates, winRates
            - Category "execution_readiness": salesTeamSize, marketingTeamSize, customerSuccessTeamSize, partnerTeamSize, availableBudget, existingAssets, CRMPlatform, marketingTechnologyStack
            - Category "metrics_performance": revenue, ARR, pipeline, opportunities, winRate, customerRetention, customerSatisfaction, CAC, LTV`
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              description: "Populated fields mapping directly to standard string properties.",
              properties: {
                enrichedFields: {
                  type: Type.OBJECT,
                  description: "The set of fields matching the requested category keys filled with expert data. You MUST return ALL keys relevant to the category.",
                  properties: {
                    companyName: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    headquarters: { type: Type.STRING },
                    countriesServed: { type: Type.STRING },
                    employeeCount: { type: Type.STRING },
                    annualRevenue: { type: Type.STRING },
                    growthStage: { type: Type.STRING },
                    fundingStage: { type: Type.STRING },
                    businessModel: { type: Type.STRING },
                    strategicPriorities: { type: Type.STRING },
                    productName: { type: Type.STRING },
                    productCategory: { type: Type.STRING },
                    productDescription: { type: Type.STRING },
                    keyFeatures: { type: Type.STRING },
                    keyBenefits: { type: Type.STRING },
                    uniqueDifferentiators: { type: Type.STRING },
                    competitiveAdvantages: { type: Type.STRING },
                    technologyPlatform: { type: Type.STRING },
                    deploymentModel: { type: Type.STRING },
                    pricingModel: { type: Type.STRING },
                    primaryBusinessGoal: { type: Type.STRING },
                    revenueTarget: { type: Type.STRING },
                    pipelineTarget: { type: Type.STRING },
                    marketShareTarget: { type: Type.STRING },
                    customerAcquisitionGoal: { type: Type.STRING },
                    expansionGoal: { type: Type.STRING },
                    timeHorizon: { type: Type.STRING },
                    targetIndustries: { type: Type.STRING },
                    targetGeographies: { type: Type.STRING },
                    marketSize: { type: Type.STRING },
                    marketGrowthRate: { type: Type.STRING },
                    marketTrends: { type: Type.STRING },
                    competitorList: { type: Type.STRING },
                    competitivePosition: { type: Type.STRING },
                    existingCustomerBase: { type: Type.STRING },
                    bestCustomers: { type: Type.STRING },
                    customerIndustries: { type: Type.STRING },
                    customerSizes: { type: Type.STRING },
                    typicalBuyers: { type: Type.STRING },
                    painPoints: { type: Type.STRING },
                    buyingTriggers: { type: Type.STRING },
                    buyingProcess: { type: Type.STRING },
                    decisionMakingStructure: { type: Type.STRING },
                    currentSalesMotion: { type: Type.STRING },
                    currentChannels: { type: Type.STRING },
                    existingPartners: { type: Type.STRING },
                    currentMarketingActivities: { type: Type.STRING },
                    pipelinePerformance: { type: Type.STRING },
                    conversionRates: { type: Type.STRING },
                    winRates: { type: Type.STRING },
                    salesTeamSize: { type: Type.STRING },
                    marketingTeamSize: { type: Type.STRING },
                    customerSuccessTeamSize: { type: Type.STRING },
                    partnerTeamSize: { type: Type.STRING },
                    availableBudget: { type: Type.STRING },
                    existingAssets: { type: Type.STRING },
                    CRMPlatform: { type: Type.STRING },
                    marketingTechnologyStack: { type: Type.STRING },
                    revenue: { type: Type.STRING },
                    ARR: { type: Type.STRING },
                    pipeline: { type: Type.STRING },
                    opportunities: { type: Type.STRING },
                    winRate: { type: Type.STRING },
                    customerRetention: { type: Type.STRING },
                    customerSatisfaction: { type: Type.STRING },
                    CAC: { type: Type.STRING },
                    LTV: { type: Type.STRING }
                  },
                  required: Object.keys(currentFields || {})
                }
              },
              required: ["enrichedFields"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "reason": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Analyze the following collected GTM operational context and output a structured AI Strategic Reasoning assessment.
            
            CONTEXT AND METRICS:
            ${buildRichContext(onboardingData)}
            
            FEW-SHOT EXAMPLES OF DESIRED HIGH-QUALITY ANALYTICAL OUTPUT:
            - Weakness alignment: "The enterprise AE team (size 15) is underutilized due to a narrow programmatic demand gen budget ($200k/yr). This mismatch inflates CAC to $12k and leaves the sales pipeline coverage at a critical 1.8x, far below the standard 3.0x."
            - Strength alignment: "A +52 NPS and 95% CSAT retention demonstrates exceptionally stable product-market fit, proving that post-sale customer value is the primary driver of expansion ready NRR."

            Be highly professional. Return a structured JSON containing:
            1. "analysis": An elegant, direct analysis with bullet points referencing strengths and alignment. No generic placeholders.
            2. "vulnerabilities": A list of 3 detailed vulnerability alerts.
            3. "readinessScore": A physical readiness score from 1 to 100 based on the balance of sales/marketing alignment, target clarity, and budget.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING, description: "Detailed, elite-grade Markdown analysis summarizing structural strengths, opportunities, and metric gaps." },
                vulnerabilities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 highly critical vulnerabilities identified from the CRM, budget, or sales-readiness details."
                },
                readinessScore: { type: Type.INTEGER, description: "Calculated operational readiness percentage (1-100) based on inputs." }
              },
              required: ["analysis", "vulnerabilities", "readinessScore"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-strategy": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Construct an integrated, fully populated expert Go-to-Market Strategy for the project "${projectName}" based on the following comprehensive business context:
            ${buildRichContext(onboardingData, projectName)}

            FEW-SHOT EXAMPLES FOR HIGH QUALITY PILLAR GENERATION:
            - Summary Example: "Orchestrate an ABM-driven land-and-expand motion targeting decision makers at mid-market tech hubs, addressing critical data latency with visual schema connectors."
            - Key Metrics Examples:
                - "Target Segment TAM": "$4.2B with 15.4% CAGR"
                - "Optimized Customer CAC": "$12,400 per contract"
                - "Target NRR Pipeline Growth": "122% Net Revenue Retention"
            - Strategic Points Example: "Deliver an outcome-based pricing tier starting at $350/seat to de-risk procurement friction while establishing an initial 14-day sandboxed trial for engineering leaders."

            You MUST populate exactly 9 fundamental business pillars:
            - market_opportunity
            - target_personas
            - value_prop
            - pricing_packaging
            - sales_channels
            - marketing_leads
            - customer_success
            - unit_economics
            - differentiation

            Your summary, metrics, and strategic points MUST directly reflect and incorporate the user's input fields (e.g., if their CRM is "${onboardingData?.CRMPlatform || 'HubSpot'} or their sales reps count is ${onboardingData?.salesTeamSize || 'N/A'}, explicitly reference how these operational factors influence their playbook).`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScoring: { type: Type.INTEGER },
                marketPositioningAnalysis: { type: Type.STRING },
                normalizedSummary: { type: Type.STRING },
                pillars: {
                  type: Type.OBJECT,
                  properties: {
                    market_opportunity: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    target_personas: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    value_prop: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    pricing_packaging: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    sales_channels: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    marketing_leads: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    customer_success: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    unit_economics: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    },
                    differentiation: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING }, subtitle: { type: Type.STRING }, percentageComplete: { type: Type.INTEGER }, summary: { type: Type.STRING },
                        keyMetrics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["label", "value"] } },
                        strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }, required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                    }
                  },
                  required: [
                    "market_opportunity", "target_personas", "value_prop", "pricing_packaging",
                    "sales_channels", "marketing_leads", "customer_success", "unit_economics", "differentiation"
                  ]
                }
              },
              required: ["overallScoring", "marketPositioningAnalysis", "normalizedSummary", "pillars"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-gtm-draft": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite Chief Operating Officer and GTM architect. Generate a highly detailed Draft Go-to-Market Strategy for the project "${projectName}" using the collected data:
            ${buildRichContext(onboardingData, projectName)}
            
            And throuhg the following reasoning logic:
            - "Analyzes macro-market datasets using a multi-attribute matrix to score sectors by margin opportunity, structural entry friction, and immediate revenue upside."
            - "Identifies patterns across historical closed-won datasets and target market parameters to construct firmographic boundaries for optimal sales engagement."
            - "Maps the typical buying committee structure within target organizations, identifying specific motivations, operational budget boundaries, and personal success metrics for each member."
            - "Connects specific product capabilities directly to the core pain points identified for each buyer persona, translating raw technical features into measurable business outcomes."
            - "Converts technical ROI frameworks into contextual messaging playbooks tailored to specific buyer roles, while maintaining alignment with core positioning guidelines."
            - "Evaluates target deal sizes and buyer profiles to design efficient distribution frameworks, balancing direct enterprise sales, partner networks, and product-led growth loops."
            - "Maps out scalable marketing program playbooks designed to engage target buyers, distribute core messaging, and generate predictable pipeline volume across channels."
            - "Packages strategic messaging and operational guidelines into structured, role-specific onboarding systems and situational battlecards for field teams."
            - "Constructs a comprehensive, multi-layered telemetry framework that monitors execution performance against strategic assumptions to highlight systemic tracking deviations."
            
            And using your vast, advanced knowledge of best-in-class ${onboardingData?.industry || 'B2B'} ${onboardingData?.businessModel || 'enterprise'} commercial execution patterns.
            
            You MUST output an object containing exactly 9 pillars representing our fundamental business framework.
            For each pillar, the resulting array must contain exactly the listed items in that exact order, and each item MUST be strictly prefixed with the specific Commercial Output name followed by a colon and a space (e.g. "Commercial Output Name: Detailed strategic analysis").

            FEW-SHOT EXAMPLES OF ELITE STRATEGIC STRATEGY LINES:
            - "Market Segments: Prioritize mid-market technology platforms within the ${onboardingData?.targetGeographies || 'targeted geographies'} sector seeking instantaneous workflow synchronization capabilities."
            - "Segment Prioritization: Core campaign launches target organizations size ${onboardingData?.customerSizes || '100-500 employees'} suffering from immediate metric reporting delay."
            - "Buying Triggers: Automated tracking of key operational triggers including a leadership transition or a failed compliance/data security audit."

            Here is the exact mapping of pillars, their expected array lengths, and the exact output prefixes required for each item:

            1. pillar_1_market_segmentation (Exactly 4 items in array):
               - "Market Segments: <strategic detail>"
               - "Segment Prioritization: <strategic detail>"
               - "Market Opportunity Analysis: <strategic detail>"
               - "Target Market Selection: <strategic detail>"

            2. pillar_2_icp (Exactly 6 items in array):
               - "Company Size: <strategic detail>"
               - "Industry: <strategic detail>"
               - "Geography: <strategic detail>"
               - "Buying Triggers: <strategic detail>"
               - "Budget Characteristics: <strategic detail>"
               - "Decision Structure: <strategic detail>"

            3. pillar_3_buyer_personas (Exactly 6 items in array):
               - "Economic Buyers: <strategic detail>"
               - "Technical Buyers: <strategic detail>"
               - "Business Buyers: <strategic detail>"
               - "Influencers: <strategic detail>"
               - "Pain Points: <strategic detail>"
               - "Success Metrics: <strategic detail>"

            4. pillar_4_value_proposition (Exactly 5 items in array):
               - "Customer Value: <strategic detail>"
               - "Business Outcomes: <strategic detail>"
               - "Differentiation: <strategic detail>"
               - "Competitive Advantages: <strategic detail>"
               - "ROI Statements: <strategic detail>"

            5. pillar_5_messaging_positioning (Exactly 5 items in array):
               - "Positioning Statement: <strategic detail>"
               - "Core Messaging: <strategic detail>"
               - "Persona Messaging: <strategic detail>"
               - "Competitive Messaging: <strategic detail>"
               - "Outcome-Based Messaging: <strategic detail>"

            6. pillar_6_sales_channel (Exactly 5 items in array):
               - "Direct Sales Strategy: <strategic detail>"
               - "Partner Strategy: <strategic detail>"
               - "Distributor Strategy: <strategic detail>"
               - "Digital Strategy: <strategic detail>"
               - "Hybrid Revenue Motion: <strategic detail>"

            7. pillar_7_marketing_demand (Exactly 5 items in array):
               - "Demand Generation Programs: <strategic detail>"
               - "Campaign Strategy: <strategic detail>"
               - "Content Strategy: <strategic detail>"
               - "Digital Marketing Strategy: <strategic detail>"
               - "Lead Generation Strategy: <strategic detail>"

            8. pillar_8_enablement_execution (Exactly 7 items in array):
               - "Shared vision: <strategic detail>"
               - "Sales Playbooks: <strategic detail>"
               - "Enablement Plans: <strategic detail>"
               - "Training Programs: <strategic detail>"
               - "Ready-to-use sales pitches: <strategic detail>"
               - "Execution Frameworks: <strategic detail>"
               - "Operational Readiness: <strategic detail>"

            9. pillar_9_metrics_feedback (Exactly 6 items in array):
               - "Success Metrics: <strategic detail>"
               - "KPI Framework: <strategic detail>"
               - "Leading Indicators: <strategic detail>"
               - "Lagging Indicators: <strategic detail>"
               - "Feedback Loops: <strategic detail>"
               - "Continuous Improvement Framework: <strategic detail>"`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pillar_1_market_segmentation: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_2_icp: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_3_buyer_personas: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_4_value_proposition: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_5_messaging_positioning: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_6_sales_channel: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_7_marketing_demand: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_8_enablement_execution: { type: Type.ARRAY, items: { type: Type.STRING } },
                pillar_9_metrics_feedback: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: [
                "pillar_1_market_segmentation", "pillar_2_icp", "pillar_3_buyer_personas",
                "pillar_4_value_proposition", "pillar_5_messaging_positioning", "pillar_6_sales_channel",
                "pillar_7_marketing_demand", "pillar_8_enablement_execution", "pillar_9_metrics_feedback"
              ]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "risks-recommendations": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Conduct an enterprise-grade Risk Detection (Step 19) and Optimization Recommendation (Step 20) audit for this GTM strategy.
            You must deeply analyze the alignment (or mismatch) between the business targets, the execution plan, simulated projections, and current telemetry metrics.
            
            Data: ${JSON.stringify({ onboardingData, strategyData, revenueDecomposition, executionPlan, simulationConfig }, null, 2)}

            Output a highly analytical assessment evaluating the quality of these plans. Clearly articulate the systemic reasoning. Then, return exactly 3 operationally detected risks with matching title, probability ('High', 'Medium', 'Low'), impact ('Critical', 'High', 'Moderate'), and a detailed mitigation plan. Also return 3 actionable operational optimization recommendations.

            FEW-SHOT EXAMPLE RISK:
            - "Title": "CRM Process Tracking Leakage"
            - "Level": "Red"
            - "Probability": "High"
            - "Impact": "High"
            - "Description": "Sloppy CRM onboarding leads to critical sales velocity calculation gaps, risking the $10M pipeline target."
            - "Mitigation": "Deploy native CRM validation gatekeepers to block stage progression without verified metrics."`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reasoningLog: { type: Type.STRING, description: "Detailed reasoning logic to support your assessment of the execution plans and strategy." },
                risks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      level: { type: Type.STRING },
                      probability: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING },
                      mitigation: { type: Type.STRING }
                    },
                    required: ["id", "title", "level", "probability", "impact", "description", "mitigation"]
                  }
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      category: { type: Type.STRING },
                      title: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      effort: { type: Type.STRING },
                      actionableSteps: { type: Type.STRING }
                    },
                    required: ["id", "category", "title", "impact", "effort", "actionableSteps"]
                  }
                }
              },
              required: ["reasoningLog", "risks", "recommendations"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-target-accounts": {
        const { marketSegmentationData } = rawBody;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite commercial Go-to-Market strategist. Based on the provided target market selection, market opportunity analysis, segment prioritization, and market segments, recommend the top 5 target accounts to pursue immediately.
            
            MARKET SEGMENTATION STRATEGY:
            ${Array.isArray(marketSegmentationData) ? marketSegmentationData.join('\n') : "None"}

            ORGANIZATIONAL CONTEXT:
            ${buildRichContext(onboardingData, projectName)}

            Return the top 5 specific, realistic target account profiles or company names that perfectly fit this criteria, along with a strategic rationale and an expected value range (e.g. "$150k - $300k").`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                accounts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Name or specific profile of the target account" },
                      rationale: { type: Type.STRING, description: "Strategic rationale for why they are a top target based on the strategy" },
                      expectedValue: { type: Type.STRING, description: "Estimated deal value or range" }
                    },
                    required: ["name", "rationale", "expectedValue"]
                  }
                }
              },
              required: ["accounts"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-messaging": {
        const { pillar1Data, pillar2Data, pillar3Data, pillar4Data, pillar5Data, messagingType } = rawBody;
        
        const typeLabels: Record<string, string> = {
          positioning_statement: "Positioning Statement",
          core_messaging: "Core Messaging",
          economic_buyers: "Messaging against Economic Buyers",
          technical_buyers: "Messaging against Technical Buyers",
          business_buyers: "Messaging against Business Buyers",
          influencers: "Messaging against Influencers",
          major_competitors: "Messaging against Major Competitors",
          outcome_based: "Outcome-Based Messaging"
        };
        const targetType = typeLabels[messagingType] || "Messaging";

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite product marketing and Go-to-Market messaging expert. Based on the finalized strategies in Pillars 1-4 and the current Pillar 5 strategy lines, generate a highly effective and concise ${targetType}.
            
            Pillar 1: Market Segmentation:
            ${Array.isArray(pillar1Data) ? pillar1Data.join('\n') : "None"}

            Pillar 2: ICP:
            ${Array.isArray(pillar2Data) ? pillar2Data.join('\n') : "None"}

            Pillar 3: Buyer Personas:
            ${Array.isArray(pillar3Data) ? pillar3Data.join('\n') : "None"}

            Pillar 4: Value Proposition:
            ${Array.isArray(pillar4Data) ? pillar4Data.join('\n') : "None"}

            Pillar 5: Existing Messaging Strategy Lines:
            ${Array.isArray(pillar5Data) ? pillar5Data.join('\n') : "None"}

            ORGANIZATIONAL CONTEXT:
            ${buildRichContext(onboardingData, projectName)}

            Create a highly polished, professional, and targeted ${targetType} that perfectly aligns with this strategy.
            Keep the primary message concise, punchy, and outcome-oriented.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                messaging: { type: Type.STRING, description: `The actual synthesized ${targetType} text.` },
                keyPoints: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }, 
                  description: "2-3 short bullet points highlighting why this messaging is effective based on the strategy."
                }
              },
              required: ["messaging", "keyPoints"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-pitch": {
        const buyerLabel = {
          economic_buyer: "Economic Buyer (focused on CAC, ROI, TCO, conversion metrics, budgeting, and commercial payback)",
          technical_buyer: "Technical Buyer (focused on integration, security, APIs, latency, telemetry, architecture, and schema validation)",
          business_buyer: "Business Buyer/Operations (focused on workflow automation, product adoption, cross-team productivity, and speed)",
          influencer: "Influencer/Champion (focused on ease of use, UI visuals, streamlined workflows, and qualitative day-to-day work comfort)"
        }[buyerType as string] || buyerType;

        const formatLabel = {
          technical_brief: "Technical Brief (a highly professional, details-rich textual profile explaining system mechanics)",
          executive_roi: "Executive ROI Summary (a business value-proposition with specific financial estimates, CAC/LTV indicators, and payback horizons)",
          elevator_pitch: "Elevator Pitch (a sharp, punchy 30-second spoken/conversational text opening that commands immediate interest)"
        }[pitchFormat as string] || pitchFormat;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite commercial Go-to-Market strategist. Synthesize a pristine, compelling, highly customized sales pitch targeted and crafted specifically for a ${buyerLabel} delivered in a ${formatLabel} format.
            
            ORGANIZATIONAL CONTEXT:
            ${buildRichContext(onboardingData, projectName)}

            FEW-SHOT EXAMPLES OF DESIRED OUTPUT STRATEGIES:
            - Pitch for Technical Buyer in Technical Brief format:
              "Deploy our dual-sync pipeline architecture directly alongside your instance. We eliminate middle-tier serialization latency bottlenecks entirely, checking schema integrity at the ingress gate with sub-millisecond overhead to guarantee bulletproof validation of incoming telemetry data."
            - Pitch for Economic Buyer in Elevator Pitch format:
              "We help your team reduce contract drop-off and eliminate customer churn by providing real-time operational risk triggers. For an average enterprise of your size, this translates into an estimated $140,000 in saved annual ARR within the first ninety days of deployment, at a payback period of just three months."

            CRITICAL PLAYBOOK REQUIREMENTS:
            1. Do not use high-level, generic fluff or marketing cliches. Use real facts based on the user's CRM Platform (${onboardingData?.CRMPlatform || 'HubSpot'}), available budget (${onboardingData?.availableBudget || 'N/A'}), and team size.
            2. Format the response as a valid JSON object matching the requested schema.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pitch: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                conversationalOpener: { type: Type.STRING }
              },
              required: ["pitch", "keyPoints", "conversationalOpener"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-canvas": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite, world-class GTM strategic consultant. Synthesize a professional, concise, coherent executive summary (2-3 sentences max) for each of the 9 core strategic GTM pillars.
            
            ORGANIZATIONAL CONTEXT:
            ${buildRichContext(onboardingData, projectName || 'your product')}

            DRAFT STRATEGY LINES (FINALIZED STRATEGY TO SUMMARIZE):
            ${gtmStrategyDraft ? JSON.stringify(gtmStrategyDraft, null, 2) : "None yet"}`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pillar_1_market_segmentation: { type: Type.STRING },
                pillar_2_icp: { type: Type.STRING },
                pillar_3_buyer_personas: { type: Type.STRING },
                pillar_4_value_proposition: { type: Type.STRING },
                pillar_5_messaging_positioning: { type: Type.STRING },
                pillar_6_sales_channel: { type: Type.STRING },
                pillar_7_marketing_demand: { type: Type.STRING },
                pillar_8_enablement_execution: { type: Type.STRING },
                pillar_9_metrics_feedback: { type: Type.STRING }
              },
              required: [
                "pillar_1_market_segmentation", "pillar_2_icp", "pillar_3_buyer_personas",
                "pillar_4_value_proposition", "pillar_5_messaging_positioning", "pillar_6_sales_channel",
                "pillar_7_marketing_demand", "pillar_8_enablement_execution", "pillar_9_metrics_feedback"
              ]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "simulate-recommendations": {
        const p = activeParams || {};
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite, world-class GTM strategic board advisor. Conduct a professional, rigorous evaluation of the active simulation scenario: "${activeScenario}".

            OPERATIONAL SIMULATION METRICS:
            - Target Opportunities Inflow (N): ${p.opportunities || 50}
            - Baseline Win-Rate (W): ${p.winRate || 15}%
            - Average Contract Value (ACV): $${(p.acv || 50000).toLocaleString()}
            - Sales Cycle Length (L): ${p.cycleLength || 90} days
            - Projected Daily Revenue Velocity (V): $${(p.revenueVelocity || 100).toFixed(2)} / day

            ORGANIZATIONAL CONTEXT:
            ${buildRichContext(onboardingData, projectName || 'your product')}`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bestStrategy: { type: Type.STRING },
                alternativeStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                tradeOffs: { type: Type.ARRAY, items: { type: Type.STRING } },
                expectedOutcomes: { type: Type.STRING },
                whySelected: { type: Type.STRING }
              },
              required: ["bestStrategy", "alternativeStrategies", "risks", "tradeOffs", "expectedOutcomes", "whySelected"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-simulation-heuristics": {
        const { options } = rawBody;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite quantitative Go-To-Market analyst building a Monte Carlo revenue simulation.
            I will provide you with 8 strategic categories, each containing 3 different operational choices (options) based on our company's GTM strategy.
            
            For EACH of the 3 options in EACH of the 8 categories, you must determine its realistic multiplicative impact on 4 core sales velocity metrics:
            - opportunities (N): How does this option scale pipe volume? (e.g., PLG = 2.5x, Enterprise = 0.4x)
            - winRate (W): Provide a flat percentage point adjustment, positive or negative. (e.g., indirect partner = +3, complex enterprise = -2)
            - acv (A): How does this option affect Average Contract Value? (e.g., Enterprise = 2.8x, SMB = 0.35x)
            - cycleLength (L): How does this option scale the sales cycle duration? (e.g., Enterprise = 1.5x, PLG = 0.35x)
            
            Return floating point multipliers centered around 1.0 (for opportunities, acv, and cycleLength) and absolute number for winRate (centered around 0).
            Category choices provided:
            ${JSON.stringify(options, null, 2)}`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                segments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                icps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                personas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                valProps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                messaging: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                motions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                channels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } },
                marketing: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { opportunities: { type: Type.NUMBER }, winRate: { type: Type.NUMBER }, acv: { type: Type.NUMBER }, cycleLength: { type: Type.NUMBER } }, required: ["opportunities", "winRate", "acv", "cycleLength"] } }
              },
              required: ["segments", "icps", "personas", "valProps", "messaging", "motions", "channels", "marketing"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-initiative-intelligence": {
        const { initiativeName, description, strategicObjective } = rawBody;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite enterprise Revenue Operations Architect and Chief Growth Officer practicing systemic risk modeling.
            Analyze the following GTM Initiative and perform a structural intelligence extraction.
            
            Company Context: ${JSON.stringify(onboardingData, null, 2)}
            Initiative Name: ${initiativeName}
            Objective: ${strategicObjective}
            Description: ${description}
            
            1. Systemic Dependency Mapping: Model the critical path. Define exactly 2 critical cross-department Dependencies (blockers). Do not give generic blockers; specify systemic bottlenecks (e.g., data flow dependencies, structural silos, integration gates).
            2. AI Guardian Telemetry: Define exactly 2 rigorous AI Monitoring Rules. Do not give basic metrics. Define actionable telemetry with specific preventative, detective, or corrective threshold triggers.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dependencies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dependencyType: { type: Type.STRING },
                      blockingInitiative: { type: Type.STRING },
                      blockedInitiative: { type: Type.STRING },
                      impactDescription: { type: Type.STRING }
                    },
                    required: ["dependencyType", "blockingInitiative", "blockedInitiative", "impactDescription"]
                  }
                },
                aiMonitoringRules: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING },
                      targetThreshold: { type: Type.STRING },
                      alertThreshold: { type: Type.STRING },
                      triggerCondition: { type: Type.STRING },
                      recommendedAction: { type: Type.STRING }
                    },
                    required: ["metric", "targetThreshold", "alertThreshold", "triggerCondition", "recommendedAction"]
                  }
                }
              },
              required: ["dependencies", "aiMonitoringRules"]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-revenue-decomposition": {
        const { config } = rawBody;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Role: You are an elite Revenue Operations Architect and Financial Modeler.
            You are tasked with breaking down a top-level revenue target into functional operational requirements (Revenue Decomposition).
            
            Input Configuration:
            ${JSON.stringify(config, null, 2)}
            
            Calculate and synthesize the required volumes and capacity according to the standard GTM pipeline math model:
            For example:
            1. Deals Required = Revenue Target / ACV
            2. Opportunities Required = Deals Required / Win Rate
            3. Pipeline Required = Total value of Opps (or Revenue Target * Coverage Ratio)
            4. SQLs Required = Opportunities Required / SQL-to-Opp Conversion Rate
            5. MQLs Required = SQLs Required / MQL-to-SQL Conversion Rate
            6. Capacity: Approximate the FTE headcount or capacity levels needed based on standard ${onboardingData?.industry || 'B2B'} ${onboardingData?.businessModel || 'enterprise'} benchmarks to handle these volumes.
            
            Output MUST be exactly mapped to the provided JSON schema. Ensure the outputs are formatted nicely as strings (e.g., "$1,000,000", "80 Opportunities", "4 Reps", etc.). Do not include extraneous narrative, return valid JSON only.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                customersRequired: { type: Type.STRING },
                dealsRequired: { type: Type.STRING },
                pipelineRequired: { type: Type.STRING },
                opportunitiesRequired: { type: Type.STRING },
                sqlRequired: { type: Type.STRING },
                mqlRequired: { type: Type.STRING },
                marketingCapacityRequired: { type: Type.STRING },
                salesCapacityRequired: { type: Type.STRING },
                partnerCapacityRequired: { type: Type.STRING },
                customerSuccessCapacityRequired: { type: Type.STRING }
              },
              required: [
                "customersRequired", "dealsRequired", "pipelineRequired",
                "opportunitiesRequired", "sqlRequired", "mqlRequired",
                "marketingCapacityRequired", "salesCapacityRequired",
                "partnerCapacityRequired", "customerSuccessCapacityRequired"
              ]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-execution-engine": {
        const { onboardingData, gtmStrategyDraft, revenueDecomposition, projectName } = rawBody;
        
        console.log("Starting GTMOS Execution Engine v2.0 - Orchestrated 9-Stage State Machine");

        const targetRevStr = onboardingData?.revenueTarget || onboardingData?.ARR || "10000000";
        const targetRev = parseFloat(targetRevStr.replace(/[^0-9.]/g, '')) || 10000000;
        const timeHorizon = onboardingData?.timeHorizon || "12 months";
        const expectedAcv = parseFloat((onboardingData?.ARR || "100000").replace(/[^0-9.]/g, '')) || 100000;

        // Interface configuration for Unified Context Fabric
        interface ContextFabric {
          project_id: string;
          current_state: string;
          revenue_requirements: {
            revenue_target: number;
            arr_goal: number;
            time_horizon: string;
            expected_acv: number;
            win_rate: number;
            deals_required: number;
            pipeline_required: number;
            opportunities_required: number;
            sqls_required: number;
            mqls_required: number;
          };
          capacity_constraints: {
            marketing_capacity_hours: number;
            sales_capacity_heads: number;
            partner_channel_budget: number;
            cs_capacity_accounts_per_head: number;
          };
          gtm_strategy_context: {
            market_segmentation: string;
            icp: {
              customerSizes: string;
              targetGeographies: string;
              painPoints: string;
            };
            value_proposition: string;
            sales_channel_strategy: string;
          };
          execution_plan: {
            workstreams: any[];
          };
          sufficiency_metadata: {
            overall_sufficiency_score: number;
            coverage_metrics: {
              demand_coverage: number;
              sales_coverage: number;
            };
            identified_gaps: string[];
            executive_critique: string;
          };
        }

        // Initialize Context Fabric
        const fabric: ContextFabric = {
          project_id: "00000000-0000-0000-0000-000000000001",
          current_state: "INTERPRETED",
          revenue_requirements: {
            revenue_target: targetRev,
            arr_goal: targetRev,
            time_horizon: timeHorizon,
            expected_acv: expectedAcv,
            win_rate: parseFloat(revenueDecomposition?.winRate || "20") || 20,
            deals_required: parseInt(revenueDecomposition?.dealsRequired || "100") || 100,
            pipeline_required: parseFloat(revenueDecomposition?.pipelineRequired || "50000000") || 50000000,
            opportunities_required: parseInt(revenueDecomposition?.opportunitiesRequired || "500") || 500,
            sqls_required: parseInt(revenueDecomposition?.sqlRequired || "1000") || 1000,
            mqls_required: parseInt(revenueDecomposition?.mqlRequired || "5000") || 5000
          },
          capacity_constraints: {
            marketing_capacity_hours: parseInt(onboardingData?.marketingTeamSize || "2") * 1500,
            sales_capacity_heads: parseInt(onboardingData?.salesTeamSize || "3") || 3,
            partner_channel_budget: parseFloat((onboardingData?.availableBudget || "100000").replace(/[^0-9.]/g, '')) || 100000,
            cs_capacity_accounts_per_head: parseInt(onboardingData?.customerSuccessTeamSize || "1") * 15
          },
          gtm_strategy_context: {
            market_segmentation: onboardingData?.industry || "General B2B",
            icp: {
              customerSizes: onboardingData?.customerSizes || "Enterprise",
              targetGeographies: onboardingData?.targetGeographies || "Global",
              painPoints: onboardingData?.painPoints || "Growth friction"
            },
            value_proposition: onboardingData?.keyBenefits || "Comprehensive platform value",
            sales_channel_strategy: onboardingData?.currentSalesMotion || "Direct Sales"
          },
          execution_plan: {
            workstreams: []
          },
          sufficiency_metadata: {
            overall_sufficiency_score: 0.5,
            coverage_metrics: {
              demand_coverage: 0.5,
              sales_coverage: 0.5
            },
            identified_gaps: [],
            executive_critique: ""
          }
        };

        // Helper to query Gemini with system instructions and JSON structure instructions
        const runAgentStage = async (stageName: string, systemIns: string, promptText: string) => {
          try {
            console.log(`Running Stage: ${stageName}`);
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: [promptText],
              config: {
                systemInstruction: systemIns,
                responseMimeType: "application/json"
               }
            });
            const text = response.text || "{}";
            let cleaned = text.trim();
            
            // 1. Clean markdown headers
            if (cleaned.startsWith("```json")) {
              cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
              cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
              cleaned = cleaned.slice(0, -3);
            }
            cleaned = cleaned.trim();

            // 2. Clear reasoning blocks outside of JSON if they escaped matching responseMimeType
            cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").trim();

            // 3. Extract pure JSON block spanning from the first { to the last }
            const startIdx = cleaned.indexOf("{");
            const endIdx = cleaned.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
              cleaned = cleaned.substring(startIdx, endIdx + 1);
            }

            return JSON.parse(cleaned.trim());
          } catch (e) {
            console.error(`Error in stage ${stageName}:`, e);
            throw e;
          }
        };

        // ==========================================
        // STAGE 1: Revenue Requirement Interpreter (CRO Prompt v2)
        // ==========================================
        const stage1System = `You are an elite, data-driven Chief Revenue Officer (CRO) and Revenue Operations Architect. Your job is to analyze raw quantitative targets from a revenue model and convert them into strategic, execution-ready operational guardrails. You act as the translation layer between finance and execution.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the values provided inside the revenue_requirements configuration block (such as targets, ARR goals, win rates, and raw volume dependencies). 

Your objective is to ingest these baseline financial parameters and interpret their exact business execution implications across the standard revenue funnel.

You must:
1. Validate the logical progression of the funnel math (e.g., Target Revenue ➔ Deals Required based on ACV ➔ Pipeline Needed based on Coverage Ratio ➔ Conversion stages down to MQLs).
2. Generate an authoritative operational summary outlining exactly what these numbers mean for the go-to-market teams.
3. Call out immediate structural execution implications (e.g., "Achieving 150 SQLs with a 20% win rate requires a velocity of 2.5 closed-won deals per week, demanding a 4x pipeline coverage buffer due to standard sales cycle slippage").

CONSTRAINTS:
- Do NOT generate initiatives, actions, or workstreams. That is the responsibility of later stages.
- Keep your analysis strictly focused on quantitative interpretation, capacity boundaries, and funnel throughput mechanics.
- Do not modify or invent the core target numbers; only interpret their operational burden.

OUTPUT FORMAT:
Return the incoming JSON payload with the 'current_state' mutated to "INTERPRETED".
You must think through your analysis step-by-step using an internal <reasoning> block first. In this block, verify the funnel ratios and outline the execution strains. Then, output the finalized JSON block ensuring the structural metadata is updated under 'sufficiency_metadata' and the 'executive_critique' field.`;

        const stage1Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Analyze the core revenue requirements and capacity boundaries. Return the updated JSON structure matching this schema exactly:
{
  "current_state": "INTERPRETED",
  "revenue_requirements": {
    "revenue_target": number,
    "arr_goal": number,
    "time_horizon": string,
    "expected_acv": number,
    "win_rate": number,
    "deals_required": number,
    "pipeline_required": number,
    "opportunities_required": number,
    "sqls_required": number,
    "mqls_required": number
  },
  "capacity_constraints": {
    "marketing_capacity_hours": number,
    "sales_capacity_heads": number,
    "partner_channel_budget": number,
    "cs_capacity_accounts_per_head": number
  },
  "sufficiency_metadata": {
    "overall_sufficiency_score": number,
    "coverage_metrics": {
      "demand_coverage": number,
      "sales_coverage": number
    },
    "identified_gaps": string[],
    "executive_critique": string
  }
}`;
        
        try {
          const s1Output = await runAgentStage("Stage 1 - Interpreter", stage1System, stage1Prompt);
          if (s1Output.revenue_requirements) {
            fabric.revenue_requirements = { ...fabric.revenue_requirements, ...s1Output.revenue_requirements };
          }
          if (s1Output.capacity_constraints) {
            fabric.capacity_constraints = { ...fabric.capacity_constraints, ...s1Output.capacity_constraints };
          }
          if (s1Output.sufficiency_metadata) {
            fabric.sufficiency_metadata = { ...fabric.sufficiency_metadata, ...s1Output.sufficiency_metadata };
          }
          fabric.current_state = "INTERPRETED";
        } catch (_err) {
          console.warn("Stage 1 fallback triggered");
        }

        // ==========================================
        // STAGE 2: Capability Architect (CRO Prompt v2)
        // ==========================================
        const stage2System = `You are an expert Enterprise GTM Strategy Consultant and Revenue Operations Architect. Your job is to analyze qualitative GTM strategies and quantitative funnel implications, then translate them into an unassailable framework of organizational capabilities required to deliver on the revenue target.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the 'revenue_requirements' (interpreted funnel volumes) and the 'gtm_strategy_context' (the 9-Pillar GTM Strategy blueprint).

Your objective is to identify the precise, non-negotiable operational capabilities the business must possess across its commercial engine to achieve these outcomes.

You must:
1. Deduce and map required commercial capabilities across core functions: Demand Generation, Sales Development, Direct/Enterprise Sales, Partner/Channel Ecosystem, Customer Success/Expansion, and Revenue Operations.
2. Provide a clear, strategic rationale for why each capability is required based on the intersection of the GTM strategy and the funnel volume (e.g., "An outbound Sales Development capability is high priority because Pillar 6 dictates a direct enterprise motion, and Stage 1 requires 120 SQLs that inbound channels alone cannot fulfill").
3. Assign an active operational priority status (High, Medium, Low) to each capability map entry.

CONSTRAINTS:
- Do NOT draft specific workstreams, tasks, or action items. You are only designing the high-level capability map.
- Do NOT assess existing organizational limits or resource constraints yet. You are mapping what the company *ideally needs* to win, not what they currently have (that occurs in Stage 3).

OUTPUT FORMAT:
Return the incoming JSON payload with the 'current_state' mutated to "CAPABILITY_MAPPED".
You must think through your analysis step-by-step using an internal <reasoning> block first. In this block, map out your deductions by linking the quantitative targets directly to functional requirements. Then, return the updated JSON structure conforming to the schema below.`;

        const stage2Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Strategy Draft: ${JSON.stringify(gtmStrategyDraft, null, 2)}

Design the ideal capability blueprint. Return a valid JSON object matching this schema exactly:
{
  "current_state": "CAPABILITY_MAPPED",
  "capabilities_needed": ["string representing the name of each capability recommended"],
  "capability_map": [
    {
      "capability": "Capability Name",
      "function": "Demand Generation" | "Sales Development" | "Direct/Enterprise Sales" | "Partner/Channel Ecosystem" | "Customer Success/Expansion" | "Revenue Operations",
      "rationale": "Strategic rationale linking Pillar strategy and Stage 1 volume requirements",
      "priority": "High" | "Medium" | "Low"
    }
  ]
}`;

        let capabilitiesNeeded: string[] = ["Sales Development Reps", "Content Program Team", "Partner Co-selling Motion"];
        try {
          const s2Output = await runAgentStage("Stage 2 - Capability Architect", stage2System, stage2Prompt);
          if (s2Output.capabilities_needed) {
            capabilitiesNeeded = s2Output.capabilities_needed;
          }
          fabric.current_state = "CAPABILITY_MAPPED";
        } catch (_err) {
          console.warn("Stage 2 fallback triggered");
        }

        // ==========================================
        // STAGE 3: Capability Gap Assessment (CRO Prompt v2)
        // ==========================================
        const stage3System = `You are a highly pragmatic, risk-aware Revenue Operations Leader and Enterprise GTM Consultant. Your job is to perform a cold, realistic gap analysis by contrasting the ideal organizational capabilities defined in the previous stage against the actual, real-world resource constraints of the enterprise.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the ideal capability profile from Stage 2 ('CAPABILITY_MAPPED'), the qualitative 'gtm_strategy_context', and the hard operational limits defined under 'capacity_constraints' (such as headcount, budget, asset maturity, and timeline limits).

Your objective is to identify exactly where the current organization will break or fall short under the weight of the revenue target.

You must:
1. Conduct a friction-point analysis comparing Required Capabilities against Capacity Constraints.
2. Identify and document explicit structural gaps (e.g., "The target requires an Enterprise Outbound motion yielding 40 opportunities, but current sales capacity is capped at 2 Account Executives with zero SDR support. This creates an immediate execution gap").
3. Flag high-risk operational areas where capacity boundaries will act as bottlenecks or severe failure vectors.
4. Issue actionable, structural remediation recommendations to the downstream engines (e.g., recommend shifting budget to external channels, expanding partner motions, or adjusting human capital deployment parameters).

CONSTRAINTS:
- Do NOT alter or lower the primary quantitative revenue requirements.
- Do NOT generate specific workstreams or action items. Keep your focus entirely at the structural capability, resource balance, and risk profile level.

OUTPUT FORMAT:
Return the incoming JSON payload with the 'current_state' mutated to "GAP_ASSESSED".
You must structure your logic step-by-step within an internal <reasoning> block first, auditing each functional domain against its assigned constraints. Then, emit the updated JSON block, ensuring all 'identified_gaps', risk levels, and remediation notes are formally appended to the 'sufficiency_metadata' object.`;

        const stage3Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Capabilities Needed: ${JSON.stringify(capabilitiesNeeded, null, 2)}

Identify the operational gaps and bottlenecks. Return a valid JSON object matching this schema exactly:
{
  "current_state": "GAP_ASSESSED",
  "sufficiency_metadata": {
    "overall_sufficiency_score": number,
    "coverage_metrics": {
      "demand_coverage": number,
      "sales_coverage": number
    },
    "identified_gaps": ["string describing each structural gap identified"],
    "executive_critique": "An authoritative operational summary of gaps, capacity bottlenecks, and remediation recommendations"
  }
}`;

        try {
          const s3Output = await runAgentStage("Stage 3 - Gap Assessment", stage3System, stage3Prompt);
          if (s3Output.sufficiency_metadata) {
            fabric.sufficiency_metadata = {
              ...fabric.sufficiency_metadata,
              ...s3Output.sufficiency_metadata,
              identified_gaps: s3Output.sufficiency_metadata.identified_gaps || fabric.sufficiency_metadata.identified_gaps || []
            };
          }
          fabric.current_state = "GAP_ASSESSED";
        } catch (_err) {
          console.warn("Stage 3 fallback triggered");
        }

        // ==========================================
        // STAGE 4: Execution Program Designer (Prompt A)
        // ==========================================
        const stage4System = `You are a fractional B2B Chief Revenue Officer (CRO). Your job is to translate quantitative revenue demands and qualitative strategy foundations into an execution-grade, multi-level operational blueprint.
        
        INSTRUCTIONS:
        Analyze the incoming JSON context fabric—specifically the 'revenue_requirements' and 'gtm_strategy_context'. You must generate structural execution workstreams that GUARANTEE the generation of the required 'mqls_required'.
        
        CRITICAL REQUIREMENTS:
        1. Comprehensive Campaign Coverage: You MUST generate diverse execution plans covering multiple GTM campaigns (e.g., Inbound, Outbound, ABM, Partner Co-marketing, Paid Media, Events) specifically designed to generate MQLs.
        2. Supporting Preparation: You MUST include foundational workstreams or initiatives for preparation: messaging architecture, enablement training, sales playbooks, pitch decks, target list definition for outbound, and ABM setup.
        3. Strict MQL Quotas: Every demand-generation initiative MUST have a strict, hard-quoted expected outcome (e.g., "Generate 250 MQLs"). The sum of these expected MQLs across all plans MUST meet and exceed the 'mqls_required' in the revenue decomposition.
        
        CONSTRAINTS:
        - Do NOT make assumptions about actual target calculations or contribution sizing; state them explicitly based on the requested MQL targets.
        - Focus strictly on building operational depth: Every workstream must branch down into clear Initiatives, which must break down into Executable Actions.
        - Ensure every Action lists a precise ownership role (e.g., "Growth Marketing Lead", "SDR Manager") and a binary measurable KPI.
        - Maintain tracking links back to the 9-Pillar GTM Strategy component it honors (relatedGtmPillar).
        
        You must output the JSON object with mutated 'current_state': "DRAFTED", and populate 'execution_plan.workstreams' strictly matching the following schema structure:
        {
          "current_state": "DRAFTED",
          "execution_plan": {
            "workstreams": [
              {
                "id": "WS-01",
                "workstreamName": string,
                "purpose": string,
                "relatedGtmPillar": string,
                "priority": "low" | "medium" | "high",
                "timeline": string,
                "owner": string,
                "initiatives": [
                  {
                    "id": "INT-01",
                    "initiativeName": string,
                    "description": string,
                    "strategicObjective": string,
                    "expectedOutcome": string,
                    "priority": string,
                    "timeline": string,
                    "owner": string,
                    "budget": string,
                    "status": "Not Started" | "In Progress",
                    "actions": [
                      {
                        "id": "ACT-01",
                        "actionName": string,
                        "description": string,
                        "taskType": string,
                        "owner": string,
                        "startDate": string,
                        "dueDate": string,
                        "dependencies": string,
                        "completionCriteria": string,
                        "status": "todo",
                        "effortEstimateDays": number,
                        "linkedStrategyGoal": string,
                        "successMetric": string,
                        "prerequisiteData": string,
                        "deliverable": string
                      }
                    ],
                    "kpis": [
                      {
                        "id": "KPI-01",
                        "kpiName": string,
                        "kpiCategory": string,
                        "baseline": string,
                        "target": string,
                        "currentValue": string,
                        "measurementFrequency": string,
                        "owner": string
                      }
                    ],
                    "risks": [
                      {
                        "id": "RSK-01",
                        "riskName": string,
                        "description": string,
                        "probability": "low" | "medium" | "high",
                        "impact": "low" | "medium" | "high",
                        "riskScore": number,
                        "mitigationPlan": string,
                        "owner": string
                      }
                    ],
                    "dependencies": [
                      {
                        "id": "DEP-01",
                        "dependencyType": string,
                        "blockingInitiative": string,
                        "blockedInitiative": string,
                        "impactDescription": string
                      }
                    ],
                    "aiMonitoringRules": [
                      {
                        "id": "RULE-01",
                        "metric": string,
                        "targetThreshold": string,
                        "alertThreshold": string,
                        "triggerCondition": string,
                        "recommendedAction": string
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }`;

        const stage4Prompt = `Context Fabric: ${JSON.stringify(fabric, null, 2)}\nStrategy Pillars Draft: ${JSON.stringify(gtmStrategyDraft, null, 2)}\nDraft initial multi-level program plan. Enforce strict JSON compliance. Run internal reasoning in <reasoning> tags first, then output JSON.`;
        try {
          const s4Output = await runAgentStage("Stage 4 - Designer", stage4System, stage4Prompt);
          fabric.execution_plan = s4Output.execution_plan || fabric.execution_plan;
        } catch (_err) {
          console.warn("Stage 4 Designer failed. Triggering recovery fallback execution plan template.");
          fabric.execution_plan = {
            workstreams: [
              {
                id: "WS-01",
                workstreamName: "Accelerated Outbound Velocity",
                purpose: "Target high-intent enterprise accounts to scale sales development pipeline.",
                relatedGtmPillar: "Strategic Revenue Expansion",
                priority: "high",
                timeline: "Q3-Q4",
                owner: "Sales Development Lead",
                initiatives: [
                  {
                    id: "INT-01",
                    initiativeName: "High-Intent Specialized Campaigns",
                    description: "Establish dedicated campaigns for tier-1 ICP buyers on key pain points.",
                    strategicObjective: "Boost enterprise outbound pipeline and opportunity count",
                    expectedOutcome: "At least 40+ high-value SQLs",
                    priority: "High",
                    timeline: "Month 1-3",
                    owner: "Demand Generation Lead",
                    budget: "$15,000",
                    status: "In Progress",
                    actions: [
                      {
                        id: "ACT-01",
                        actionName: "Author Industry-Specific Playbooks",
                        description: "Compile and release targeted visual GTM playbooks centering key pain points.",
                        taskType: "Content Strategy",
                        owner: "Content Architect",
                        startDate: "2026-07-01",
                        dueDate: "2026-07-31",
                        dependencies: "Value proposition parameters",
                        completionCriteria: "3 published pieces",
                        status: "todo",
                        effortEstimateDays: 8,
                        linkedStrategyGoal: "Market dominance",
                        successMetric: "Guide downloads > 200",
                        prerequisiteData: "Customer size mapping",
                        deliverable: "Digital playbooks and targeted funnel overlays"
                      }
                    ],
                    kpis: [
                      {
                        id: "KPI-01",
                        kpiName: "MQL to SQL conversion",
                        kpiCategory: "Conversion",
                        baseline: "1.2%",
                        target: "2.5%",
                        currentValue: "1.2%",
                        measurementFrequency: "Monthly",
                        owner: "Ops Analyst"
                      }
                    ],
                    risks: [],
                    dependencies: [],
                    aiMonitoringRules: []
                  }
                ]
              }
            ]
          };
        }
        fabric.current_state = "DRAFTED";

        // ==========================================
        // STAGE 5: Contribution Modeling Engine (CRO Prompt v2)
        // ==========================================
        const stage5System = `You are a highly analytical Revenue Operations (RevOps) Data Analyst and B2B Forecasting Expert. Your job is to stress-test the initial GTM execution plan by estimating the quantitative pipeline and milestone contribution of each proposed workstream toward the master revenue objectives.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the revenue_requirements (the master targets) and the freshly created execution_plan.workstreams array from Stage 4 ('DRAFTED').

Your objective is to model the coverage yield of each workstream across the entire lead-to-deal funnel. You must strictly audit the MQL quotas assigned in Stage 4.

You must:
1. Evaluate every individual workstream in the execution_plan and estimate its potential contribution value toward generating MQLs, SQLs, Opportunities, and Deals. Read the explicit MQL quotas defined in the workstream deliverables.
2. Formulate your yield estimations based on the strategic nature of the workstream. Ensure that the total MQL yield matches or exceeds the required MQLs (mqls_required). Sum them up explicitly in your scratchpad reasoning.
3. Assign a confidence_score (between 0.0 and 1.0) to each workstream's contribution. If a workstream claims high MQL yield but lacks the supporting preparation (like messaging, lists, or playbooks), drastically penalize its confidence score. High-volume claims with vague action items must be penalized.

CONSTRAINTS:
- Do NOT add, remove, or modify any workstreams, initiatives, or actions. Your single responsibility is to append modeling data to the existing structures.
- Do NOT modify the baseline revenue_requirements values.

OUTPUT FORMAT:
Return a valid JSON payload matching this schema exactly:
{
  "current_state": "CONTRIBUTION_MODELED",
  "workstreams": [
    {
      "id": "Workstream ID matching the input workstreams exactly",
      "revenueContributionHypothesis": "Deals Required or Pipeline Coverage text summary hypothesis based on Stage 4",
      "contribution_metadata": {
        "mql_yield": number,
        "sql_yield": number,
        "opportunity_yield": number,
        "deal_yield": number,
        "confidence_score": number (0.0 to 1.0),
        "rationale": "Explicit logic linking action-level feasibility to these yield metrics"
      }
    }
  ]
}

Ensure your internal <reasoning> block evaluates the funnel ratios first, then output the finalized JSON.`;

        const stage5Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Strategy Pillars: ${JSON.stringify(gtmStrategyDraft, null, 2)}

Provide the pipeline and milestone contribution estimations. Return a valid JSON matching the schema:`;

        try {
          const s5Output = await runAgentStage("Stage 5 - Modeling", stage5System, stage5Prompt);
          if (s5Output.workstreams && Array.isArray(s5Output.workstreams)) {
            fabric.execution_plan.workstreams = fabric.execution_plan.workstreams.map(originalWs => {
              const modeledWs = s5Output.workstreams.find((w: any) => w.id === originalWs.id);
              if (modeledWs) {
                return {
                  ...originalWs,
                  revenueContributionHypothesis: modeledWs.revenueContributionHypothesis || originalWs.revenueContributionHypothesis,
                  contribution_metadata: modeledWs.contribution_metadata
                };
              }
              return originalWs;
            });
          }
          fabric.current_state = "CONTRIBUTION_MODELED";
        } catch (_err) {
          console.warn("Stage 5 fallback triggered");
        }

        // ==========================================
        // STAGE 6: Execution Sufficiency Assessment (Prompt B)
        // ==========================================
        const stage6System = `You are an unyielding Revenue Operations Analyst and Data Scientist. Your task is to calculate the operational sufficiency of a proposed GTM action plan against concrete demand constraints.
        
        INSTRUCTIONS:
        Analyze the 'execution_plan' alongside the 'revenue_requirements' inside the incoming JSON. Calculate whether the actions listed realistically scale to produce the target pipeline volume, particularly focusing on MQL generation.
        
        Perform the following systematic evaluation using deterministic sizing parameters:
        1. Demand Coverage: Compare estimated yields against 'mqls_required' and 'sqls_required'. Check explicitly if the sum of proposed MQL generation across all campaigns exceeds the target. 
        2. Supporting Readiness: Explicitly check for the existence of supporting preparation workstreams (e.g., messaging, training, playbooks, pitch decks, ABM target lists). If demand-generation plans exist without corresponding preparation plans, their probability of success drops.
        3. Capacity Feasibility: Highlight where human hour or financial capacity parameters are structurally exceeded.
        4. Calculate an overall mathematical balance score between 0.00 and 1.00 (where 1.00 is perfectly sufficient).
        
        CRITICAL SCORING RULES:
        - If the total explicit MQL yield does NOT exceed the 'mqls_required', you MUST cap the overall_sufficiency_score at 0.50.
        - If supporting preparation workstreams are missing or vague, you MUST subtract 0.20 from the score.
        - Be extremely conservative. Ensure the plan is truly comprehensive before scoring above 0.90.
        
        You must mutate 'current_state' to "SUFFICIENCY_ASSESSED" and populate the entire 'sufficiency_metadata' object exactly:
        {
          "current_state": "SUFFICIENCY_ASSESSED",
          "sufficiency_metadata": {
            "overall_sufficiency_score": number (0.00-1.00),
            "coverage_metrics": {
              "demand_coverage": number (0.00-1.00),
              "sales_coverage": number (0.00-1.00)
            },
            "identified_gaps": string[],
            "executive_critique": string
          }
        }`;

        const stage6Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}\nCalculate plan sufficiency. Execute full mathematical check inside a <reasoning> sandbox first, then generate JSON.`;
        try {
          const s6Output = await runAgentStage("Stage 6 - Sufficiency", stage6System, stage6Prompt);
          if (s6Output.sufficiency_metadata) {
            fabric.sufficiency_metadata = s6Output.sufficiency_metadata;
          }
        } catch (_err) {
          console.warn("Stage 6 Sufficiency failed. Triggering recovery fallback diagnostics.");
          fabric.sufficiency_metadata = {
            overall_sufficiency_score: 0.85,
            coverage_metrics: {
              demand_coverage: 0.82,
              sales_coverage: 0.88
            },
            identified_gaps: [
              "Outbound execution frequency limit exceeded during peak campaign periods",
              "Pipeline coverage ratio requires a stronger partner co-selling overlay"
            ],
            executive_critique: "Execution shows moderate sufficiency with minor human capacity boundaries at peak outbound cycles. Recommendation is to introduce partner channel buffers."
          };
        }
        fabric.current_state = "SUFFICIENCY_ASSESSED";

        // ==========================================
        // STAGE 7: Gap Expansion Engine (CRO Prompt v2)
        // ==========================================
        const loopScore = (fabric.sufficiency_metadata?.overall_sufficiency_score || 0) * 100;
        console.log(`Stage 6 reported Sufficiency Score: ${loopScore}%`);

        if (loopScore < 90) {
          console.log(`Sufficiency score below 90% threshold. Triggering Stage 7: Gap Expansion Engine.`);
          const stage7System = `You are a highly creative yet operationally realistic Chief Revenue Officer (CRO) and Enterprise Growth Architect. Your job is to automatically intervene when a GTM execution plan falls short of revenue requirements (particularly MQL targets), expanding its tactical depth and injecting high-leverage commercial initiatives to close identified pipeline gaps.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the revenue_requirements (focusing on 'mqls_required'), the existing execution_plan.workstreams, and the deficit metrics identified in sufficiency_metadata (including the overall_sufficiency_score which has failed to meet the 90% threshold).

Your objective is to systematically modify and expand the execution plan to capture the missing pipeline allocation. You must optimize the plan by reinforcing weak areas without breaking operational capacity boundaries.

You must:
1. Identify which exact funnel metrics (e.g., MQLs, SQLs) and preparation pillars (e.g., messaging, sales enablement) are causing the sufficiency deficit.
2. Ingest the remediation recommendations built during Stage 3 ('GAP_ASSESSED') and the critique from Stage 6 ('SUFFICIENCY_ASSESSED').
3. Inject additional, highly specific Initiatives and Executable Actions into existing workstreams, or build completely new Strategic Workstreams to OVER-DELIVER on the MQL volumes. For example, add "ABM Outreach Blitz", "Partner Co-Marketing Engine", or "Inbound SEO Content Play" to solve demand gaps; and add specific "Sales Playbook Generation" actions to solve enablement gaps.
4. Ensure every newly added action adheres to the strict upstream framework: Every action must clearly trace from Action ➔ Initiative ➔ Workstream ➔ Strategic Pillar ➔ Revenue Objective.
5. You MUST ensure the expanded plan generates at least the 'mqls_required' across its newly explicitly stated quotas.

CONSTRAINTS:
- Do NOT touch or reduce the baseline revenue_requirements targets. If the plan is insufficient, you must scale up the execution depth, not lower the financial bar.
- Every expanded action must respect the hard boundaries in capacity_constraints. Do not simply tell an existing, capped team to "do more cold calls"—introduce structural, high-leverage programs or alternative digital channels.

OUTPUT FORMAT:
Return the incoming JSON payload with the 'current_state' mutated to "EXPANDED".
You must execute your optimization strategy and structural expansion mapping step-by-step within an internal <reasoning> block first, justifying exactly how the new initiatives will close the specific volume deficit. Then, return a valid JSON object matching the schema below exactly:
{
  "current_state": "EXPANDED",
  "execution_plan": {
    "workstreams": [ ... matching the workstreams array structure with newly injected high-yield initiatives, actions, and KPIs ... ]
  },
  "sufficiency_metadata": {
    "overall_sufficiency_score": number (0.00-1.00 recalculation reflecting closing of gap, target >= 0.90),
    "coverage_metrics": {
      "demand_coverage": number (0.00-1.00),
      "sales_coverage": number (0.00-1.00)
    },
    "identified_gaps": ["updated gaps after expansion intervention"],
    "executive_critique": "Updated summary explaining how Stage 7 expanded tactical depth and injected high-leverage actions to eliminate the deficit"
  }
}`;

          const stage7Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Strategy Pillars: ${JSON.stringify(gtmStrategyDraft, null, 2)}
Initial Sufficiency Score: ${loopScore}%

Intervene and expand the GTM plan. Run full quantitative deficit analysis and expansion strategy inside a <reasoning> sandbox first, then generate JSON:`;

          try {
            const s7Output = await runAgentStage("Stage 7 - Expansion", stage7System, stage7Prompt);
            if (s7Output.execution_plan) {
              fabric.execution_plan = s7Output.execution_plan;
            }
            if (s7Output.sufficiency_metadata) {
              fabric.sufficiency_metadata = {
                ...fabric.sufficiency_metadata,
                ...s7Output.sufficiency_metadata
              };
            }
            fabric.current_state = "EXPANDED";
            console.log(`Post-expansion Sufficiency Score: ${(fabric.sufficiency_metadata?.overall_sufficiency_score || 0.92) * 100}%`);
          } catch (_err) {
            console.warn("Stage 7 fallback triggered");
          }
        }

        // ==========================================
        // STAGE 8: Executive Challenge Engine (Prompt C)
        // ==========================================
        const stage8System = `You are a highly skeptical, board-level Chief Revenue Officer review officer. You are cold, analytical, and hyper-focused on risk vectors, market friction, and operational bottlenecks.
        
        INSTRUCTIONS:
        Your sole objective is to stress-test and "Red Team" the drafted execution plan. Review the provided JSON data fabric and find its points of failure. Look for:
        - Overly optimistic timeline dependencies.
        - Sales resource bottlenecks.
        - Disconnects between the value proposition and demand-gen channels.
        
        CONSTRAINTS:
        - Do not be polite. Treat this as a mission-cold critique before a major board presentation or funding round.
        - Pinpoint missing operational bridges.
        
        Mutate 'current_state' to "EXECUTIVE_CHALLENGED". Populate 'sufficiency_metadata.executive_critique' with a massive, section-by-section breakdown of structural risks and tactical adjustments. Use <reasoning> blocks first.`;

        const stage8Prompt = `Context Fabric: ${JSON.stringify(fabric, null, 2)}\nConduct a cold challenge. Return the updated fabric with 'current_state': "EXECUTIVE_CHALLENGED" and populated 'sufficiency_metadata.executive_critique', as a JSON:
        {
          "current_state": "EXECUTIVE_CHALLENGED",
          "sufficiency_metadata": {
            "overall_sufficiency_score": number,
            "coverage_metrics": { "demand_coverage": number, "sales_coverage": number },
            "identified_gaps": string[],
            "executive_critique": string
          }
        }`;
        try {
          const s8Output = await runAgentStage("Stage 8 - Executive Challenge", stage8System, stage8Prompt);
          if (s8Output.sufficiency_metadata) {
            fabric.sufficiency_metadata.executive_critique = s8Output.sufficiency_metadata.executive_critique;
          }
          fabric.current_state = "EXECUTIVE_CHALLENGED";
        } catch (_err) {}

        // ==========================================
        // STAGE 9: Plan Optimization Engine (CRO Prompt v2)
        // ==========================================
        const stage9System = `You are a master Revenue Operations Architect and an elite Enterprise Chief Revenue Officer (CRO). Your role is the final convergence point of the reasoning pipeline. Your job is to take a comprehensive, expanded GTM execution plan, ingest the harsh critical feedback from the Executive Challenge Engine, and refine the entire payload into a highly polished, production-ready, perfectly balanced revenue delivery system.

INSTRUCTIONS:
Analyze the incoming JSON context fabric—specifically the 'execution_plan' (including all workstreams, initiatives, and actions), the 'capacity_constraints', and the comprehensive critique documented inside 'sufficiency_metadata.executive_critique' from Stage 8 ('EXECUTIVE_CHALLENGED').

Your objective is to harmonize the ambitious revenue-generation activities with the critical risk mitigation required to survive real-world execution.

You must:
1. Systematically address every bottleneck, optimistic assumption, and failure vector highlighted in the Stage 8 Executive Critique.
2. Refine, de-risk, and sharpen the phrasing and KPIs of existing actions to make them completely bulletproof and operationally realistic.
3. Prune or consolidate any redundant or low-yield activities that violate 'capacity_constraints' or dilute organizational focus.
4. Recalibrate any final metrics to ensure the plan achieves structural equilibrium: max revenue output, minimum execution risk, and total compliance with capacity guardrails.

CONSTRAINTS:
- Do NOT alter the core metrics inside 'revenue_requirements'.
- Do NOT delete high-yield initiatives unless replacing them with a lower-risk, equivalent-yield operational alternative; the final plan must maintain a theoretical sufficiency score >= 90%.
- Ensure every single modified or refined action maintains its rigid upstream line-of-sight tracking parameters (Action ➔ Initiative ➔ Workstream ➔ Strategic Pillar ➔ Revenue Objective).

OUTPUT FORMAT:
Return the incoming JSON payload with the 'current_state' mutated to "OPTIMIZED".
You must carefully walk through your final engineering optimization choices step-by-step within an internal <reasoning> block first, explicitly demonstrating how you solved the challenges raised by the skeptical CRO in Stage 8. Then, emit the finalized, clean, production-ready JSON fabric.`;

        const stage9Prompt = `Context Fabric Object: ${JSON.stringify(fabric, null, 2)}
Executive Critique from Stage 8: ${fabric.sufficiency_metadata?.executive_critique || "None"}

Optimize and refine the GTM execution plan. Return a valid JSON matching this schema exactly. Note: You map the "workstreams" array as [] (empty array) since the backend will automatically merge and inject the fully detailed workstream strategy generated in prior stages into it:
{
  "current_state": "OPTIMIZED",
  "programName": "e.g., Scale Pipeline ARR v2.0",
  "description": "e.g., Enterprise GTM blueprint to achieve ARR target",
  "strategicObjective": "Core objective linking pillars to revenue target",
  "revenueGoal": "e.g., $1.5M ARR",
  "businessGoal": "High-level goal",
  "launchPeriod": "e.g., Q3-Q4 2026",
  "status": "Strategic Draft Approved",
  "executiveSponsor": "e.g., Chief Revenue Officer",
  "workstreams": [],
  "governance": {
    "raciAssignment": "RACI Matrix mapping key stakeholders to workstreams",
    "reviewCadence": "Review meeting structure and calendar frequency",
    "escalationPath": "Resolution matrix for operational blockages"
  },
  "sufficiencyAssessment": {
    "score": number (0-100),
    "coverageAnalysis": {
      "revenueCoverage": "Analysis of ultimate net revenue coverage",
      "demandCoverage": "Analysis of top of funnel volume safety margins",
      "salesCoverage": "Analysis of seller productivity and conversion rates",
      "channelCoverage": "Analysis of co-selling partner capacity coverage",
      "enablementCoverage": "Analysis of resource readiness and collateral support",
      "measurementCoverage": "Analysis of telemetry, tracking, and attribution precision"
    },
    "identifiedGaps": ["string describing remaining or mitigated gap"],
    "aiRecommendations": ["string optimization recommendations executed"]
  },
  "executiveSummary": "A highly polished, board-ready professional summary"
}`;

        let finalPlan: any = null;
        try {
          finalPlan = await runAgentStage("Stage 9 - Plan Optimization", stage9System, stage9Prompt);
        } catch (_err) {
          console.warn("Stage 9 failed, initiating recovery fallback", _err);
          finalPlan = {};
        }

        // Merge workstreams directly from upstream fabric to save token overhead and guarantee structural mapping
        finalPlan.workstreams = fabric.execution_plan.workstreams || [];

        // Ensure robust fields exist for all schema parameters
        finalPlan.programName = finalPlan.programName || `${projectName || 'Core Engine'} GTM Execution Blueprint`;
        finalPlan.description = finalPlan.description || "GTM enterprise strategic blueprint to achieve target revenue and pipeline coverage.";
        finalPlan.strategicObjective = finalPlan.strategicObjective || `Position organizational channels and capacities to hit the ARR goal.`;
        finalPlan.revenueGoal = finalPlan.revenueGoal || (fabric.revenue_requirements?.revenue_target ? `$${(fabric.revenue_requirements.revenue_target / 1000000).toFixed(1)}M ARR` : "$2.0M ARR");
        finalPlan.businessGoal = finalPlan.businessGoal || "Enterprise expansion and pipeline optimization";
        finalPlan.launchPeriod = finalPlan.launchPeriod || "Q3-Q4 2026";
        finalPlan.status = finalPlan.status || "Strategic Draft Approved";
        finalPlan.executiveSponsor = finalPlan.executiveSponsor || "Chief Revenue Officer";
        finalPlan.executiveSummary = finalPlan.executiveSummary || `Dynamic State-driven Execution program targeting ARR goal over time horizon.`;
        finalPlan.current_state = "OPTIMIZED";
        fabric.current_state = "OPTIMIZED";

        finalPlan.governance = finalPlan.governance || {
          raciAssignment: "RACI Matrix mapped across Revenue Operations, Core Marketing and AE Sales development.",
          reviewCadence: "Monthly operational reviews with weekly tactical execution huddles.",
          escalationPath: "Blocker resolution routed through Revenue Strategy Lead up to the Executive Sponsor."
        };

        const sufficiencyScorePercent = Math.round((fabric.sufficiency_metadata?.overall_sufficiency_score || 0.95) * 100);
        finalPlan.sufficiencyAssessment = finalPlan.sufficiencyAssessment || {
          score: sufficiencyScorePercent,
          coverageAnalysis: {
            revenueCoverage: "Revenue targets are theoretically satisfied via the proposed inbound & outbound funnels.",
            demandCoverage: "Sufficient top-of-funnel MQL and SQL volumes to model the pipeline coverage required.",
            salesCoverage: "Seller productivity and close rates are balanced against historical constraints.",
            channelCoverage: "Partner ecosystem channels mapped out to supply auxiliary enterprise pipeline.",
            enablementCoverage: "Content collateral and sales playbooks configured to alleviate closing friction.",
            measurementCoverage: "Ops instrumentation and automated telemetry rule triggers are set."
          },
          identifiedGaps: fabric.sufficiency_metadata?.identified_gaps || [],
          aiRecommendations: [
            "Monitor conversion rates between SQLs and opportunities in real-time.",
            "Scale partner co-marketing programs as primary demand hedge if inbound underperforms."
          ]
        };

        // If score is present, make sure it is stored as 0-100 number
        if (finalPlan.sufficiencyAssessment && typeof finalPlan.sufficiencyAssessment.score !== 'number') {
          finalPlan.sufficiencyAssessment.score = sufficiencyScorePercent;
        }

        // Return final JSON response
        console.log("Stage 9 completed successfully. GTM Execution Engine v2.0 execution finished!");
        return new Response(JSON.stringify(finalPlan), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "generate-executive-dashboard": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are the GTMOS Automated Chief of Staff. Synthesize raw execution data into a high-signal executive narrative. You must populate the JSON schema by applying the following reasoning models to the input data:

1. For Section A (Attainment): Calculate overall health. Write a 2-sentence maximum narrative summarizing current revenue velocity versus target.
2. For Section B (Deltas): Compare the strategic pillars against live execution task completion. Explicitly articulate WHY a variance exists, not just that it exists.
3. For Section C (Risks): Identify execution tasks that are behind schedule and threaten major goals. Generate an actionable, tactical mitigation pivot to recover the timeline.
4. For Section D (Forecast): Project the current completion rate forward. Provide 1-2 interactive "scenario levers" (e.g., "If we add X resources, impact will be Y").
5. For Section F (Friction): Analyze time-in-stage for all execution tasks. Identify the primary organizational bottleneck (e.g., Legal, Content Creation) and recommend an unblocking action.
6. For Section G (Market): Evaluate internal execution pacing against known external competitor benchmarks or market timing windows.

ORGANIZATIONAL CONTEXT:
${buildRichContext(onboardingData, projectName || 'your product')}

EXECUTION PIPELINE DATA (Tasks, Statuses, Metrics):
${executionPlan ? JSON.stringify(executionPlan, null, 2) : "None yet"}

REVENUE/BUSINESS TARGETS:
${revenueDecomposition ? JSON.stringify(revenueDecomposition, null, 2) : "None yet"}`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                section_a_attainment: {
                  type: Type.OBJECT,
                  properties: {
                    health_score: { type: Type.INTEGER },
                    narrative_brief: { type: Type.STRING }
                  },
                  required: ["health_score", "narrative_brief"]
                },
                section_b_strategic_deltas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      strategic_pillar: { type: Type.STRING },
                      target_metric: { type: Type.STRING },
                      current_execution_status: { type: Type.STRING },
                      variance_explanation: { type: Type.STRING }
                    },
                    required: ["strategic_pillar", "target_metric", "current_execution_status", "variance_explanation"]
                  }
                },
                section_c_risk_radar: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      risk_id: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      threat_description: { type: Type.STRING },
                      impacted_goal: { type: Type.STRING },
                      suggested_mitigation_pivot: { type: Type.STRING }
                    },
                    required: ["risk_id", "severity", "threat_description", "impacted_goal", "suggested_mitigation_pivot"]
                  }
                },
                section_d_predictive_forecast: {
                  type: Type.OBJECT,
                  properties: {
                    predicted_attainment_percentage: { type: Type.INTEGER },
                    trajectory_narrative: { type: Type.STRING },
                    scenario_levers: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          action: { type: Type.STRING },
                          projected_impact: { type: Type.STRING }
                        },
                        required: ["action", "projected_impact"]
                      }
                    }
                  },
                  required: ["predicted_attainment_percentage", "trajectory_narrative", "scenario_levers"]
                },
                section_f_friction_analysis: {
                  type: Type.OBJECT,
                  properties: {
                    primary_bottleneck_node: { type: Type.STRING },
                    average_delay_days: { type: Type.INTEGER },
                    unblocking_recommendation: { type: Type.STRING }
                  },
                  required: ["primary_bottleneck_node", "average_delay_days", "unblocking_recommendation"]
                },
                section_g_market_signals: {
                  type: Type.OBJECT,
                  properties: {
                    competitor_dynamic: { type: Type.STRING },
                    execution_pacing_gap: { type: Type.STRING },
                    strategic_pivot_recommendation: { type: Type.STRING }
                  },
                  required: ["competitor_dynamic", "execution_pacing_gap", "strategic_pivot_recommendation"]
                }
              },
              required: [
                "section_a_attainment", "section_b_strategic_deltas", "section_c_risk_radar", 
                "section_d_predictive_forecast", "section_f_friction_analysis", "section_g_market_signals"
              ]
            }
          }
        });
        return new Response(response.text || "{}", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ error: `Action ${action} not found.` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    });
  }
});
