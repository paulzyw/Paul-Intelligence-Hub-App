import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GTMOS_SYSTEM_INSTRUCTION = `You are an elite Chief Growth Officer (CGO), world-class enterprise Go-to-Market (GTM) architect, and expert commercial analyst. 
Your expertise lies in B2B SaaS, developer tooling, highly sophisticated deep-tech systems, and value-based enterprise software commercialization.
Your tone is deeply analytical, authoritative, highly professional, precise, and devoid of generic marketing fluff, slogans, or hype. 
Avoid cliche buzzwords unless they correspond directly to specific, recognized commercial frameworks (e.g., LTV/CAC ratio, NRR expansion paths, PLG velocity, multi-threaded buyer engagement, ROI benchmarking).
Analyze the provided organizational, financial, and product parameters meticulously to design tactical steps and insights that are directly actionable, distinct, and tailor-fit to the user's operational constraints and assets.`;

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
    const { action, onboardingData, strategyData, projectName, categoryId, companyName, industry, currentFields, buyerType, pitchFormat, gtmStrategyDraft, activeScenario, activeParams } = rawBody;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not active on this environment.");
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    switch (action) {
      case "enrich": {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            `You are a top-tier revenue consultant. We are onboarding a company into the GTMOS (Go-To-Market Operating System).
            Company: ${companyName || "A B2B enterprise"}
            Industry: ${industry || "SaaS / Software"}
            Current collected fields for category "${categoryId}": ${JSON.stringify(currentFields)}

            Generate realistic, highly-specific, professional business-driven data values to enrich and complete this category.
            The fields required for category "${categoryId}" are listed below. Return a JSON object matching the keys and populated with professional, contextual data. Ensure no fields are left empty.

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
                  description: "The set of fields matching the requested category keys filled with expert data.",
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
                  }
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

            And using your vast, advanced knowledge of best-in-class B2B SaaS commercial execution patterns.
            
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

      case "generate-execution": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Based on this completed GTM Operating System strategy context for "${projectName}":
            ${JSON.stringify(strategyData)}

            Create an execution plan with exactly 4 distinct, highly granular commercial actions/initiatives. Set realistic timelines, professional roles (e.g., CRO, Head of RevOps, Demand Generation Lead), and correct priority weights.

            FEW-SHOT INITIATIVES EXAMPLE:
            - "Title": "Deploy Targeted Outbound ABM sequences"
            - "Description": "Leverage HubSpot CRM data to design personalized outreach campaigns targeting typical buyer personas, addressing the main pain point of team silo latency with bespoke video assets and custom audit checklists."
            - "Owner": "Heads of RevOps & Demand Generation"
            - "Priority": "high"
            - "DueDate": "2026-06-30"
            - "Program": "Demand Generation"
            - "Status": "todo"`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  program: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  status: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["id", "program", "title", "description", "owner", "dueDate", "status", "priority"]
              }
            }
          }
        });
        return new Response(response.text || "[]", { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case "risks-recommendations": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Conduct an enterprise-grade Risk Detection (Step 18) and Optimization Recommendation (Step 19) audit for this GTM strategy.
            Data: ${JSON.stringify({ onboardingData, strategyData })}

            Return exactly 3 risks with a matching title, probability ('High', 'Medium', 'Low'), impact ('Critical', 'High', 'Moderate'), and a detailed mitigation plan. Also return 3 actionable operational optimization recommendations.

            FEW-SHOT EXAMPLE RISK:
            - "Title": "CRM Process Tracking Leakage"
            - "Probability": "High"
            - "Impact": "High"
            - "Description": "Sloppy CRM onboarding leads to critical sales velocity calculation gaps."
            - "Mitigation": "Deploy native CRM validation gatekeepers to block stage progression without verified metrics."`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
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
              required: ["risks", "recommendations"]
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

      case "generate-initiative-intelligence": {
        const { initiativeName, description, strategicObjective } = rawBody;
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `You are an elite enterprise Revenue Operations Architect and Chief Growth Officer.
            Analyze the following GTM Initiative and generate targeted structural intelligence.
            
            Company Context: ${JSON.stringify(onboardingData, null, 2)}
            Initiative Name: ${initiativeName}
            Objective: ${strategicObjective}
            Description: ${description}
            
            Identify exactly 2 critical cross-functional Dependencies (blockers) and exactly 2 rigorous AI Monitoring Rules (telemetry thresholds).
            Ensure the dependencies involve technical, marketing, or operational bottlenecks.`
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

      case "generate-execution-engine": {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            `Role: You are an elite enterprise Revenue Operations Architect and Chief Growth Officer.
            Based on the onboarding information:
            ${JSON.stringify(onboardingData, null, 2)}

            And the finalized Strategy Draft:
            ${JSON.stringify(gtmStrategyDraft, null, 2)}

            Generate a highly trackable, thorough, enterprise-grade GTM Execution Action Plan.
            The execution timeframe/period of time is given in the "timeHorizon" onboarding field as: "${onboardingData?.timeHorizon || '12-18 Months'}".
            Make sure all initiatives, workstreams, and actions fit realistic milestones within this timeframe.

            The output MUST be a JSON object conforming to the standard GTMExecutionPlan schema. Do not generate fake/placeholder text. Return actual actionable strategies.`
          ],
          config: {
            systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                programName: { type: Type.STRING },
                description: { type: Type.STRING },
                strategicObjective: { type: Type.STRING },
                revenueGoal: { type: Type.STRING },
                businessGoal: { type: Type.STRING },
                launchPeriod: { type: Type.STRING },
                status: { type: Type.STRING },
                executiveSponsor: { type: Type.STRING },
                workstreams: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      workstreamName: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      relatedGtmPillar: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      timeline: { type: Type.STRING },
                      owner: { type: Type.STRING },
                      initiatives: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            initiativeName: { type: Type.STRING },
                            description: { type: Type.STRING },
                            strategicObjective: { type: Type.STRING },
                            expectedOutcome: { type: Type.STRING },
                            priority: { type: Type.STRING },
                            timeline: { type: Type.STRING },
                            owner: { type: Type.STRING },
                            budget: { type: Type.STRING },
                            status: { type: Type.STRING },
                            actions: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  actionName: { type: Type.STRING },
                                  description: { type: Type.STRING },
                                  taskType: { type: Type.STRING },
                                  owner: { type: Type.STRING },
                                  startDate: { type: Type.STRING },
                                  dueDate: { type: Type.STRING },
                                  dependencies: { type: Type.STRING },
                                  completionCriteria: { type: Type.STRING },
                                  status: { type: Type.STRING }
                                },
                                required: ["id", "actionName", "description", "taskType", "owner", "startDate", "dueDate", "dependencies", "completionCriteria", "status"]
                              }
                            },
                            kpis: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  kpiName: { type: Type.STRING },
                                  kpiCategory: { type: Type.STRING },
                                  baseline: { type: Type.STRING },
                                  target: { type: Type.STRING },
                                  currentValue: { type: Type.STRING },
                                  measurementFrequency: { type: Type.STRING },
                                  owner: { type: Type.STRING }
                                },
                                required: ["id", "kpiName", "kpiCategory", "baseline", "target", "currentValue", "measurementFrequency", "owner"]
                              }
                            },
                            risks: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  riskName: { type: Type.STRING },
                                  description: { type: Type.STRING },
                                  probability: { type: Type.STRING },
                                  impact: { type: Type.STRING },
                                  riskScore: { type: Type.NUMBER },
                                  mitigationPlan: { type: Type.STRING },
                                  owner: { type: Type.STRING }
                                },
                                required: ["id", "riskName", "description", "probability", "impact", "riskScore", "mitigationPlan", "owner"]
                              }
                            },
                            dependencies: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  dependencyType: { type: Type.STRING },
                                  blockingInitiative: { type: Type.STRING },
                                  blockedInitiative: { type: Type.STRING },
                                  impactDescription: { type: Type.STRING }
                                },
                                required: ["id", "dependencyType", "blockingInitiative", "blockedInitiative", "impactDescription"]
                              }
                            },
                            aiMonitoringRules: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  id: { type: Type.STRING },
                                  metric: { type: Type.STRING },
                                  targetThreshold: { type: Type.STRING },
                                  alertThreshold: { type: Type.STRING },
                                  triggerCondition: { type: Type.STRING },
                                  recommendedAction: { type: Type.STRING }
                                },
                                required: ["id", "metric", "targetThreshold", "alertThreshold", "triggerCondition", "recommendedAction"]
                              }
                            }
                          },
                          required: ["id", "initiativeName", "description", "strategicObjective", "expectedOutcome", "priority", "timeline", "owner", "budget", "status", "actions", "kpis", "risks", "dependencies", "aiMonitoringRules"]
                        }
                      }
                    },
                    required: ["id", "workstreamName", "purpose", "relatedGtmPillar", "priority", "timeline", "owner", "initiatives"]
                  }
                },
                governance: {
                  type: Type.OBJECT,
                  properties: {
                    raciAssignment: { type: Type.STRING },
                    reviewCadence: { type: Type.STRING },
                    escalationPath: { type: Type.STRING }
                  },
                  required: ["raciAssignment", "reviewCadence", "escalationPath"]
                },
                executiveSummary: { type: Type.STRING }
              },
              required: ["programName", "description", "strategicObjective", "revenueGoal", "businessGoal", "launchPeriod", "status", "executiveSponsor", "workstreams", "governance", "executiveSummary"]
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
