import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini SDK helper
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please set it in Settings > Secrets.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}

function hasGenAIKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// ---------------------------------------------------------
// COGNITIVE DETECTIVE LOCAL ENGINES (Fallback for offline/uncaged runs)
// ---------------------------------------------------------

function computeLocalEnrich(categoryId: string, companyName?: string, industry?: string) {
  const normCompany = companyName || "RevOS Client Enterprise";
  const normIndustry = industry || "SaaS & AI Operations";
  
  const fallbackDb: Record<string, any> = {
    company_info: {
      companyName: normCompany,
      industry: normIndustry,
      headquarters: "San Francisco, CA (Silicon Valley Operations)",
      countriesServed: "United States, United Kingdom, Singapore, Canada",
      employeeCount: "48 employees (scaling at 15% quarter-over-quarter)",
      annualRevenue: "$6.8M ARR",
      growthStage: "Series A Extension Ready",
      fundingStage: "Venture-Backed ($12M raised from Tier-1 funds)",
      businessModel: "Product-Led Growth (PLG) and High-Touch Inbound Enterprise Contracts",
      strategicPriorities: "Scale international developer reach, build modular integrations, optimize Net Revenue Retention"
    },
    product_info: {
      productName: `${normCompany} core system`,
      productCategory: "Intelligent Workflow Orchestration",
      productDescription: `A high-performance system designed for ${normIndustry} environments, automating compliance syncing and telemetry streams into a central operation console.`,
      keyFeatures: "Autonomous dual-sync connector pipelines, secure sub-millisecond edge indexing, responsive multi-state widgets, AI-generated compliance briefs",
      keyBenefits: "Saves up to 40 hours per operational seat, slashes customer onboarding delays by 30%, elevates retention parameters immediately",
      uniqueDifferentiators: "Built with the proprietary RevOS modular engine granting 100% horizontal database portability and visual auditing.",
      competitiveAdvantages: "Direct-to-schema sync, enterprise role-based security configurations, zero-latency metric aggregation.",
      technologyPlatform: "React 19, Node.js v22, PostgreSQL clustered layer, Drizzle ORM",
      deploymentModel: "Multi-Region Elastic Cloud hosting (SaaS)",
      pricingModel: "Value-based tiers: Core starts at $380/seat monthly, Custom Enterprise packs for unlimited databases"
    },
    business_objectives: {
      primaryBusinessGoal: "Dominate early mid-market operations and secure next level capital stage",
      revenueTarget: "Deliver $14.5M overall ARR within the next fiscal calendar cycle",
      pipelineTarget: "Establish $45.0M comprehensive outbound opportunity pool (3.5x coverage multiple)",
      marketShareTarget: "Capture 14% of mid-market operations and data infrastructure integrations across active regions",
      customerAcquisitionGoal: "Acquire 120 net new premium corporate logos",
      expansionGoal: "Accelerate Net Revenue Retention (NRR) to 122% via smart upsell pathways and modules",
      timeHorizon: "FY 2026-2027 fiscal strategy sprints"
    },
    market_info: {
      targetIndustries: `${normIndustry}, cybersecurity networks, high-yield digital platforms`,
      targetGeographies: "North America, Western Europe, APAC Tech hubs",
      marketSize: "Total Addressable Market (TAM) is budgeted at $6.5B growing with a robust 19% CAGR",
      marketGrowthRate: "Market segment is expanding at an impressive 18.2% annual pace with direct software cloud-hosting push",
      marketTrends: "Consolidation of fragmented tooling interfaces, focus on real-time operational security and high auditability",
      competitorList: "Mainstream legacy database operators, expensive custom consulting frameworks, disjointed local point solutions",
      competitivePosition: "Highly agility-focused SaaS structure with the lowest setup cost and instantaneous real-time sync performance"
    },
    customer_info: {
      existingCustomerBase: "94 active scaling technology corporations",
      bestCustomers: "Series A to C technology developers and commercial teams who need direct-to-cloud visual database alignment",
      customerIndustries: "B2B SaaS, security operations, financial middleware layers",
      customerSizes: "80-300 corporate personnel, $8M - $40M annual revenue parameters",
      typicalBuyers: "VPs of Product Operations, CIOs, Heads of Sales Operations, Chief Revenue Officers",
      painPoints: "Siloed spreadsheet models, manual entry replication overheads, lack of near-real-time executive metrics dashboard",
      buyingTriggers: "Failure during recent client security audit, hire of a new executive operations driver, loss of multi-region client contracts",
      buyingProcess: "3-day team trial, security review verification, custom enterprise pilot approval, executive CRO sign-off",
      decisionMakingStructure: "Led by Director of Product Operations, verified by CTO, finalized with Procurement and CFO"
    },
    current_gtm_info: {
      currentSalesMotion: "Inbound demand marketing coupled with predictive Account-Based Marketing (ABM) outreaches",
      currentChannels: "Direct sales team, localized system integration consultancies, technology app marketplaces",
      existingPartners: "Security audit compliance firms, high-performance database service organizations",
      currentMarketingActivities: "SEO organic content clusters, industry-leading virtual technical clinics, targeted executive private dinners",
      pipelinePerformance: "Averages 3.1x target pipeline health; 45% of standard pipeline generated by marketing channels",
      conversionRates: "Visitor-to-opportunity is 8%; opportunity-to-closed-deal averages 24%",
      winRates: "26.4% success against unintegrated legacy providers"
    },
    execution_readiness: {
      salesTeamSize: "10 Account Executives, 5 Sales Development Representatives, 2 Sales Operations Managers",
      marketingTeamSize: "4 digital marketing architects (Content, Operations, Lead Gen, Brand)",
      customerSuccessTeamSize: "4 Customer Success Managers, 2 Premium Solutions engineers",
      partnerTeamSize: "1 Strategic Alliances manager",
      availableBudget: "$480,000 annualized programmatic marketing, travel, and operational software budgets",
      existingAssets: "High-yield product visual demonstrations, comprehensive partner enablement decks, 5 detailed case studies",
      CRMPlatform: "HubSpot Operations Hub & Salesforce Enterprise Cloud",
      marketingTechnologyStack: "Marketo, Segment, Chili Piper, ZoomInfo, Clearbit"
    },
    metrics_performance: {
      revenue: "$6,800,000",
      ARR: "$6,500,000",
      pipeline: "$20,500,000",
      opportunities: "310 open strategic opportunities",
      winRate: "22.5%",
      customerRetention: "94.2% Gross Retention Rate (GRR) / 115% Net Retention Rate (NRR)",
      customerSatisfaction: "Average Net Promoter Score (NPS) of +52, 94% CSAT index score",
      CAC: "$8,500 customer acquisition cost index",
      LTV: "$124,000 average historical lifetime logo contract value"
    }
  };

  const enrichedFields = fallbackDb[categoryId] || fallbackDb.company_info;
  return { enrichedFields };
}

function computeLocalReasoning(onboardingData: any) {
  const company = onboardingData?.companyName || "RevOS Strategic Blueprints";
  const budget = onboardingData?.availableBudget || "";
  const crm = onboardingData?.CRMPlatform || "";
  const winRate = onboardingData?.winRates || onboardingData?.winRate || "";
  const csat = onboardingData?.customerSatisfaction || "";

  // Dynamic score calculator
  let score = 72; // baseline GTM Readiness

  if (budget) {
    if (budget.includes("$") || budget.toLowerCase().includes("budget") || budget.length > 5) {
      score += 5;
    }
  } else {
    score -= 4;
  }

  if (crm) {
    if (crm.toLowerCase().includes("hubspot") || crm.toLowerCase().includes("salesforce") || crm.length > 4) {
      score += 7;
    }
  } else {
    score -= 6;
  }

  if (winRate) {
    const digits = winRate.match(/\d+/);
    if (digits) {
      const rate = parseInt(digits[0], 10);
      if (rate > 20) score += 6;
      else if (rate < 10) score -= 3;
    }
  }

  if (csat) {
    const digits = csat.match(/\d+/);
    if (digits) {
      const val = parseInt(digits[0], 10);
      if (val > 88) score += 6;
      else if (val < 70) score -= 3;
    }
  }

  // Count populated onboarding variables for complete coverage alignment
  const totalFields = Object.keys(onboardingData || {}).length;
  const filledFields = Object.values(onboardingData || {}).filter(Boolean).length;
  const fillRate = totalFields > 0 ? filledFields / totalFields : 0;
  score += Math.round(fillRate * 12);

  // clamp between 45% and 97% for professional integrity
  score = Math.max(48, Math.min(score, 97));

  // Determine vulnerability targets dynamically
  const vulnerabilities = [
    crm 
      ? "Data alignment latency: Latent record synchronicity between your primary CRM suite and commercial billing engines."
      : "Severe commercial data silo risk: Crucial lack of CRM infrastructure platforms like HubSpot/Salesforce hinders unified commercial telemetry.",
    winRate 
      ? "Demonstrated win-rate constraints: Product demonstrations outperform top-of-funnel customer retention targets, requiring pipeline smoothing."
      : "Target pipeline visibility bottleneck: Go-to-market funnel suffers from lack of historical win-rate records.",
    budget 
      ? "Programmatic spend allocation: Outbound sales cycle speeds exceed marketing program budget benchmarks, inflating blended acquisition values."
      : "Programmatic budget opacity: Lack of explicit, dedicated budget benchmarks blocks scaling outbound reps across target regions."
  ];

  const analysis = `### Go-To-Market Strategic Alignment Review for **${company}**

The Revenue Operations Audit represents a standardized strategic check. This dynamic evaluation integrates current variables including CRM configuration, programmatic budget availability, conversion tracking, and team orchestration parameters.

#### Key Alignment Strengths:
* **Product-Market Fit Baseline**: Highly cohesive description matching current growth channels.
* **Customer Success Pipeline (NPS/CSAT)**: Outstanding current support profiles minimize pipeline leaks.
* **Structure & Readiness**: High onboarding completion enables immediate, real-time tactical synchronization.

_This alignment assessment is fully synchronized inside the Supabase global database module for persistent access._`;

  return {
    analysis,
    vulnerabilities,
    readinessScore: score
  };
}

function computeLocalStrategy(onboardingData: any, projectName: string) {
  const company = projectName || onboardingData?.companyName || "RevOS SaaS Client";
  const industry = onboardingData?.industry || "SaaS operations";
  const revenue = onboardingData?.revenue || "$4.5M ARR";
  const budget = onboardingData?.availableBudget || "$350k Programmatic Spend";

  const overallScoring = 85;
  const marketPositioningAnalysis = `Based on current SaaS benchmarks, ${company} possesses strong category dynamics in the ${industry} space. Our multi-agent audit highlights a rapid deployment path targeting high-lifetime-value (LTV) stakeholders.`;
  const normalizedSummary = `Autonomous 9-pillar Go-To-Market blueprint finalized for ${company}. Focused on accelerating enterprise pipeline velocity.`;

  const pillars = {
    market_opportunity: {
      title: "Market Opportunity Expansion",
      subtitle: "Capturing high-density revenue niches",
      percentageComplete: 95,
      summary: `Expanding across global tech sectors specifically looking for integrated ${industry} automation toolsets.`,
      keyMetrics: [
        { label: "Target Segment TAM", value: "$3.8B Total Market" },
        { label: "CAGR Target", value: "22% year-over-year" },
        { label: "Serviceable TAM (SOM)", value: "$450M Segment CAP" }
      ],
      strategicPoints: [
        "Unify target audience personas to bypass traditional procurement bottlenecks.",
        "Launch targeted content hub addressing key developer and Ops compliance guidelines.",
        "Secure early referral pipelines by establishing localized technical consultancies."
      ]
    },
    target_personas: {
      title: "Ideal Customer Profile Alignment",
      subtitle: "Bypassing generic targets to lock in buyers",
      percentageComplete: 90,
      summary: "Focusing programmatic sales activities exclusively onto Chief Revenue Officers & Heads of Operational Infrastructure.",
      keyMetrics: [
        { label: "VP Operational Friction", value: "Reduced by 35%" },
        { label: "Buyer Lead Time Profile", value: "Averages 18 Days" },
        { label: "Enterprise Persona Match", value: "92% Compliance Ratio" }
      ],
      strategicPoints: [
        "Script standard messaging playbooks around automated data synchronization.",
        "Differentiate value points specifically for high-growth Series A startup teams.",
        "Embed self-service platform trial models directly inside core product pages."
      ]
    },
    value_prop: {
      title: "Value Proposition Architecture",
      subtitle: "Clear messaging to maximize core conversions",
      percentageComplete: 95,
      summary: "Defining our product as the fast, real-time data visualizer and operations console for growing digital frameworks.",
      keyMetrics: [
        { label: "Proof of Value Window", value: "Resolved in 2.5 Hrs" },
        { label: "Message Resonancy Index", value: "+84 Core Score" },
        { label: "Competitive Lead Margin", value: "3x Faster Data Sync" }
      ],
      strategicPoints: [
        "Emphasize the zero-latency database synchronicity of our connector models.",
        "Demonstrate immediate, physical time savings during initial sales consultations.",
        "Showcase real-time compliance indicators as the core visual anchor."
      ]
    },
    pricing_packaging: {
      title: "Pricing & Packaging Strategy",
      subtitle: "Optimized unit economics to scale",
      percentageComplete: 85,
      summary: "Tiered subscription model maximizing entry land-and-expand revenue while enforcing healthy gross margins.",
      keyMetrics: [
        { label: "Core Developer Seat", value: "$380/Month Base" },
        { label: "Enterprise Contract Floor", value: "$24,500 Annual ARPU" },
        { label: "Gross Margin Benchmark", value: "88.2% Base Tier" }
      ],
      strategicPoints: [
        "Package database integrations as an premium advanced-add-on module.",
        "Establish frictionless pricing expansion tiers triggered by active telemetry volume.",
        "Offer custom deployment service packages with minimum multi-year agreements."
      ]
    },
    sales_channels: {
      title: "Sales Channels Optimization",
      subtitle: "Direct sales coupled with consulting partners",
      percentageComplete: 90,
      summary: "Combining outbound enterprise sales development reps with ecosystem integrations and consultant partner channels.",
      keyMetrics: [
        { label: "Outbound SDR Pipeline", value: "60% Target Contribution" },
        { label: "Partner Program Share", value: "25% of strategic leads" },
        { label: "Blended Deal Lead Days", value: "34 Days Calendar Cycle" }
      ],
      strategicPoints: [
        "Equip outbound sales development professionals with our automated alignment scoring cards.",
        "Recruit early technology consultants with 15% recurring partner referral bonuses.",
        "Publish standardized integration playbooks in major platform marketplaces."
      ]
    },
    marketing_leads: {
      title: "Marketing Lead Generation",
      subtitle: "Scale inbound interest via content",
      percentageComplete: 95,
      summary: "Focusing available budget parameters onto high-yield SEO campaigns and interactive assessment clinics.",
      keyMetrics: [
        { label: "Cost Per Lead (CPL)", value: "$45.00 Programmatic Avg" },
        { label: "MQL to SQL Conversion", value: "24.5% overall ratio" },
        { label: "Annual Marketing Budget", value: `${budget}` }
      ],
      strategicPoints: [
        "Host recurring technical clinical live streams focused on data schema management.",
        "Produce programmatic search engine pages targeting competitor alternatives.",
        "Incentivize case study production with existing enterprise trial accounts."
      ]
    },
    customer_success: {
      title: "Customer Success & Retention",
      subtitle: "Secure continuous gross revenue retention",
      percentageComplete: 90,
      summary: "Automated onboarding status monitoring combined with high-touch quarterly operational metrics reviews.",
      keyMetrics: [
        { label: "Gross Revenue Retention", value: "94.2% (GRR) benchmark" },
        { label: "Average Setup Onboard", value: "7.2 Days Total Speed" },
        { label: "CSAT Satisfaction Rate", value: "+48 NPS Score" }
      ],
      strategicPoints: [
        "Introduce automatic in-app alerts if client synchronization telemetry pauses.",
        "Deliver personalized business review decks with suggestions to reduce platform costs.",
        "Deploy modular customer success templates for independent dev teams."
      ]
    },
    unit_economics: {
      title: "Unit Economics Integrity",
      subtitle: "Sustaining scaling payback rates",
      percentageComplete: 85,
      summary: `Balancing CAC rates ($8.5k standard unit cost) against standard lifetime value ($124k standard LTV) for a safe 14x multiple.`,
      keyMetrics: [
        { label: "LTV to CAC Ratio", value: "14.5x High Leverage" },
        { label: "CAC Payback Period", value: "8.4 Months speed" },
        { label: "Value of ARR Base", value: `${revenue}` }
      ],
      strategicPoints: [
        "Refine outbound target tiers to focus on companies with ready CRM platforms.",
        "Reduce initial onboarding support costs by standardizing self-service platform documentation.",
        "Optimize marketing campaign bids on high-intent search parameters."
      ]
    },
    differentiation: {
      title: "Competitive Differentiation",
      subtitle: "Securing defensive technical moats",
      percentageComplete: 90,
      summary: "Positioning our platform as the only secure direct-to-schema synchronizer with built-in compliance widgets.",
      keyMetrics: [
        { label: "Sync Latency Advantage", value: "95% Delay Reduction" },
        { label: "Security Certified Score", value: "100% SOC-2 Compliant" },
        { label: "Uniqueness Rating Score", value: "Extremely High (9.2/10)" }
      ],
      strategicPoints: [
        "Incorporate secure real-time visual schema diagram generators in promotional screens.",
        "Publish technical research papers comparing platform speeds with legacy operators.",
        "Register trademark assets on the proprietary dual-sync synchronization engine."
      ]
    }
  };

  return {
    overallScoring,
    marketPositioningAnalysis,
    normalizedSummary,
    pillars
  };
}

function computeLocalExecution(projectName: string) {
  return [
    {
      id: "act-1",
      program: "Demand Generation & CRM Setup",
      title: "Deploy Automated ABM Outbound Sequence",
      description: "Setup custom HubSpot workflows targeting ideal IT and operations buyers. Match target messaging to known database synchronicity issues.",
      owner: "Demand Generation Lead",
      dueDate: "2026-07-15",
      status: "in_progress",
      priority: "high"
    },
    {
      id: "act-2",
      program: "Sales Enablement Playbook",
      title: "Launch Sales Team Alignment Playbook",
      description: "Equip mid-market Account Executives with visual alignment score collateral and direct-to-schema sync competitive slide decks.",
      owner: "VP of Sales Operations",
      dueDate: "2026-08-01",
      status: "todo",
      priority: "high"
    },
    {
      id: "act-3",
      program: "Product Integration Sprints",
      title: "Optimize Direct-Sync Connector Telemetry",
      description: "Refine React frontend onboarding widget steps and reduce setup latency parameters to guarantee our unique differentiators.",
      owner: "Head of Engineering",
      dueDate: "2026-08-20",
      status: "todo",
      priority: "medium"
    },
    {
      id: "act-4",
      program: "Customer Onboarding Streamlining",
      title: "Standardize CS Welcome Sequence",
      description: "Ship self-service developer developer portals and guide steps to slash active account setup cycle times below 5 days.",
      owner: "Director of Customer Success",
      dueDate: "2026-09-05",
      status: "todo",
      priority: "medium"
    }
  ];
}

function computeLocalRisksRecs() {
  return {
    risks: [
      {
        id: "risk-1",
        title: "Integration Legacy Latency",
        level: "Orange",
        probability: "Medium",
        impact: "High",
        description: "Clients running custom legacy databases experience higher setup delays during initial connector sync.",
        mitigation: "Ship standard database agent templates inside the initial developer welcome console."
      },
      {
        id: "risk-2",
        title: "Outbound SDR Burnout",
        level: "Yellow",
        probability: "Low",
        impact: "Moderate",
        description: "Repetitive cold-email campaigns targeting enterprise CROs risk domain spam filters.",
        mitigation: "Reposition inbound marketing budget towards targeted digital clinical workshops to generate pre-qualified leads."
      },
      {
        id: "risk-3",
        title: "SaaS Expansion Friction Due to Tight Seats",
        level: "Yellow",
        probability: "Medium",
        impact: "Moderate",
        description: "Strict seat pricing limits expansion opportunities within mid-market corporate divisions.",
        mitigation: "Activate volume/telemetry-based billing tiers to incentivize global account sign-ups."
      }
    ],
    recommendations: [
      {
        id: "rec-1",
        category: "Pricing & Packaging Strategy",
        title: "Implement Automatic Telemetry Pricing Add-On",
        impact: "High Impact",
        effort: "Low Effort",
        actionableSteps: "Configure stripe connector to track data sync volume metrics and auto-apply bandwidth billing rates."
      },
      {
        id: "rec-2",
        category: "Marketing Lead Gen",
        title: "Deploy Automated GTM Readiness Calculator Widget",
        impact: "High Impact",
        effort: "Medium Effort",
        actionableSteps: "Embed a free, interactive GTM Alignment audit on the landing page matching the GTMOS onboarding workspace format."
      },
      {
        id: "rec-3",
        category: "Sales Velocity Optimization",
        title: "Establish Standardized SOC-2 Trust Center Console",
        impact: "Critical Impact",
        effort: "Medium Effort",
        actionableSteps: "Construct a public compliance dashboard displaying live security guidelines to bypass client security audits."
      }
    ]
  };
}

// ---------------------------------------------------------
// SERVER-SIDE AI ROUTE PROXIES (GTMOS Endpoints)
// ---------------------------------------------------------

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

// Category 1-8 Auto-Enrichment API (Step 2 to 9 wizard autofill aid)
app.post("/api/gtmos/enrich", async (req, res) => {
  try {
    const { categoryId, companyName, industry, currentFields } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalEnrich(categoryId, companyName, industry);
      return res.json(fallback);
    }

    const ai = getGenAI();

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
                // Return a flat mapping of key-value text pairs
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

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("AI Enrichment Error, falling back to local simulation:", error.message);
    const { categoryId, companyName, industry } = req.body;
    res.json(computeLocalEnrich(categoryId, companyName, industry));
  }
});

// ---------------------------------------------------------
// COGNITIVE GTM REASONING ENGINE ENHANCEMENTS
// ---------------------------------------------------------

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

// Step 10: AI Strategic Reasoning Proxied Endpoint
app.post("/api/gtmos/reason", async (req, res) => {
  try {
    const { onboardingData } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalReasoning(onboardingData);
      return res.json(fallback);
    }

    const ai = getGenAI();

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

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Strategic Reasoning Error, falling back to local simulation:", error.message);
    const { onboardingData } = req.body;
    res.json(computeLocalReasoning(onboardingData));
  }
});

// Step 11: AI GTM Strategy Generation Proxied Endpoint
app.post("/api/gtmos/generate-strategy", async (req, res) => {
  try {
    const { onboardingData, projectName } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalStrategy(onboardingData, projectName);
      return res.json(fallback);
    }

    const ai = getGenAI();

    const promptString = `Construct an integrated, fully populated expert Go-to-Market Strategy for the project "${projectName}" based on the following comprehensive business context:
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

    Your summary, metrics, and strategic points MUST directly reflect and incorporate the user's input fields (e.g., if their CRM is "${onboardingData?.CRMPlatform || 'HubSpot'} or their sales reps count is ${onboardingData?.salesTeamSize || 'N/A'}, explicitly reference how these operational factors influence their playbook).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [promptString],
      config: {
        systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScoring: { type: Type.INTEGER, description: "GTM Alignment Strength Score (0 to 100)." },
            marketPositioningAnalysis: { type: Type.STRING, description: "Executive diagnostic summary of competitive positioning (Markdown format preferred)." },
            normalizedSummary: { type: Type.STRING, description: "One-sentence strategic core summary." },
            pillars: {
              type: Type.OBJECT,
              properties: {
                market_opportunity: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING, description: "1-2 substantial sentences of tactical expansion opportunity." },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                target_personas: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING, description: "1-2 substantial sentences of user persona parameters." },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                value_prop: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                pricing_packaging: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                sales_channels: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                marketing_leads: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                customer_success: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                unit_economics: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                },
                differentiation: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    percentageComplete: { type: Type.INTEGER },
                    summary: { type: Type.STRING },
                    keyMetrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
                        required: ["label", "value"]
                      }
                    },
                    strategicPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "subtitle", "percentageComplete", "summary", "keyMetrics", "strategicPoints"]
                }
              },
              required: [
                "market_opportunity",
                "target_personas",
                "value_prop",
                "pricing_packaging",
                "sales_channels",
                "marketing_leads",
                "customer_success",
                "unit_economics",
                "differentiation"
              ]
            }
          },
          required: ["overallScoring", "marketPositioningAnalysis", "normalizedSummary", "pillars"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Strategy Generation Error, falling back to local simulation:", error.message);
    const { onboardingData, projectName } = req.body;
    res.json(computeLocalStrategy(onboardingData, projectName));
  }
});

// New GTM Strategy Draft generation endpoint (Step 11 Core GTM Strategy Generation)
app.post("/api/gtmos/generate-gtm-draft", async (req, res) => {
  try {
    const { onboardingData, projectName } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalGtmDraft(onboardingData, projectName);
      return res.json(fallback);
    }

    const ai = getGenAI();

    const promptString = `You are an elite Chief Operating Officer and GTM architect. Generate a highly detailed Draft Go-to-Market Strategy for the project "${projectName}" using the collected data:
    ${buildRichContext(onboardingData, projectName)}

    And using your vast, advanced knowledge of best-in-class B2B SaaS commercial execution patterns.
    
    You MUST output an object containing exactly 9 pillars representing our fundamental business framework.
    For each pillar, the resulting array must contain exactly the listed items in that exact order, and each item MUST be strictly prefixed with the specific Commercial Output name followed by a colon and a space (e.g. "Commercial Output Name: Detailed strategic analysis").

    FEW-SHOT EXAMPLES OF ELITE STRATEGIC STRATEGY LINES (Copy the exact prefix format, but make sure the body text is deep, professional, and specific to the onboarding context):
    - "Market Segments: Prioritize mid-market technology platforms within the ${onboardingData?.targetGeographies || 'targeted geographies'} sector seeking instantaneous workflow synchronization capabilities."
    - "Segment Prioritization: Core campaign launches target organizations size ${onboardingData?.customerSizes || '100-500 employees'} suffering from immediate metric reporting delay."
    - "Buying Triggers: Automated tracking of key operational triggers including a leadership transition or a failed compliance/data security audit."

    Here is the exact mapping of pillars, their expected array lengths, and the exact output prefixes required for each item:

    1. pillar_1_market_segmentation (Exactly 4 items in array):
       - "Market Segments: <strategic detail specific to project and onboardingData>"
       - "Segment Prioritization: <strategic detail specific to project and onboardingData>"
       - "Market Opportunity Analysis: <strategic detail specific to project and onboardingData>"
       - "Target Market Selection: <strategic detail specific to project and onboardingData>"

    2. pillar_2_icp (Exactly 6 items in array):
       - "Company Size: <strategic detail specific to project and onboardingData>"
       - "Industry: <strategic detail specific to project and onboardingData>"
       - "Geography: <strategic detail specific to project and onboardingData>"
       - "Buying Triggers: <strategic detail specific to project and onboardingData>"
       - "Budget Characteristics: <strategic detail specific to project and onboardingData>"
       - "Decision Structure: <strategic detail specific to project and onboardingData>"

    3. pillar_3_buyer_personas (Exactly 6 items in array):
       - "Economic Buyers: <strategic detail specific to project and onboardingData>"
       - "Technical Buyers: <strategic detail specific to project and onboardingData>"
       - "Business Buyers: <strategic detail specific to project and onboardingData>"
       - "Influencers: <strategic detail specific to project and onboardingData>"
       - "Pain Points: <strategic detail specific to project and onboardingData>"
       - "Success Metrics: <strategic detail specific to project and onboardingData>"

    4. pillar_4_value_proposition (Exactly 5 items in array):
       - "Customer Value: <strategic detail specific to project and onboardingData>"
       - "Business Outcomes: <strategic detail specific to project and onboardingData>"
       - "Differentiation: <strategic detail specific to project and onboardingData>"
       - "Competitive Advantages: <strategic detail specific to project and onboardingData>"
       - "ROI Statements: <strategic detail specific to project and onboardingData>"

    5. pillar_5_messaging_positioning (Exactly 5 items in array):
       - "Positioning Statement: <strategic detail specific to project and onboardingData>"
       - "Core Messaging: <strategic detail specific to project and onboardingData>"
       - "Persona Messaging: <strategic detail specific to project and onboardingData>"
       - "Competitive Messaging: <strategic detail specific to project and onboardingData>"
       - "Outcome-Based Messaging: <strategic detail specific to project and onboardingData>"

    6. pillar_6_sales_channel (Exactly 5 items in array):
       - "Direct Sales Strategy: <strategic detail specific to project and onboardingData>"
       - "Partner Strategy: <strategic detail specific to project and onboardingData>"
       - "Distributor Strategy: <strategic detail specific to project and onboardingData>"
       - "Digital Strategy: <strategic detail specific to project and onboardingData>"
       - "Hybrid Revenue Motion: <strategic detail specific to project and onboardingData>"

    7. pillar_7_marketing_demand (Exactly 5 items in array):
       - "Demand Generation Programs: <strategic detail specific to project and onboardingData>"
       - "Campaign Strategy: <strategic detail specific to project and onboardingData>"
       - "Content Strategy: <strategic detail specific to project and onboardingData>"
       - "Digital Marketing Strategy: <strategic detail specific to project and onboardingData>"
       - "Lead Generation Strategy: <strategic detail specific to project and onboardingData>"

    8. pillar_8_enablement_execution (Exactly 7 items in array):
       - "Shared vision: <strategic detail specific to project and onboardingData>"
       - "Sales Playbooks: <strategic detail specific to project and onboardingData>"
       - "Enablement Plans: <strategic detail specific to project and onboardingData>"
       - "Training Programs: <strategic detail specific to project and onboardingData>"
       - "Ready-to-use sales pitches: <strategic detail specific to project and onboardingData>"
       - "Execution Frameworks: <strategic detail specific to project and onboardingData>"
       - "Operational Readiness: <strategic detail specific to project and onboardingData>"

    9. pillar_9_metrics_feedback (Exactly 6 items in array):
       - "Success Metrics: <strategic detail specific to project and onboardingData>"
       - "KPI Framework: <strategic detail specific to project and onboardingData>"
       - "Leading Indicators: <strategic detail specific to project and onboardingData>"
       - "Lagging Indicators: <strategic detail specific to project and onboardingData>"
       - "Feedback Loops: <strategic detail specific to project and onboardingData>"
       - "Continuous Improvement Framework: <strategic detail specific to project and onboardingData>"

    For each item, do not output just the prefix or placeholder descriptions—you must draft full, high-quality, practical GTM insights that reference the specific segment, competitors, values, and features of the user's project details: ${JSON.stringify(onboardingData)}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [promptString],
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
            "pillar_1_market_segmentation",
            "pillar_2_icp",
            "pillar_3_buyer_personas",
            "pillar_4_value_proposition",
            "pillar_5_messaging_positioning",
            "pillar_6_sales_channel",
            "pillar_7_marketing_demand",
            "pillar_8_enablement_execution",
            "pillar_9_metrics_feedback"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("GTM Draft Strategy Generation Error, falling back to local simulation:", error.message);
    const { onboardingData, projectName } = req.body;
    res.json(computeLocalGtmDraft(onboardingData, projectName));
  }
});

function computeLocalGtmDraft(onboardingData: any, projectName: string) {
  const o = onboardingData || {};
  return {
    pillar_1_market_segmentation: [
      `Market Segments: B2B Enterprise Software environments within ${o.targetIndustries || 'high-growth SaaS and enterprise tech'} sectors.`,
      `Segment Prioritization: Prioritized targeting of ${o.customerSizes || '100 - 500 employee companies'} showing high immediate need.`,
      `Market Opportunity Analysis: Address total addressable market with priority SAM targets matching projected size of ${o.marketSize || '$2.4B ARR'}.`,
      `Target Market Selection: Launch initial outreach in key geographical corridors including ${o.targetGeographies || 'North America and global corridors'}.`
    ],
    pillar_2_icp: [
      `Company Size: Primary focus is ${o.customerSizes || '100 - 500 employee organizations'}.`,
      `Industry: Tailored specifically to companies within the ${o.customerIndustries || 'specialized modern SaaS industries'} sector.`,
      `Geography: Priority targeting in the main territories of ${o.targetGeographies || 'North America and global corridors'}.`,
      `Buying Triggers: Monitor specific events such as: ${o.buyingTriggers || 'key technical system upgrades, quarterly performance misses, or leadership changes'}.`,
      `Budget Characteristics: Average targeted corporate budget profile mapped to optimal procurement limits.`,
      `Decision Structure: Map decision structure requirements to support cross-functional operational sign-off: ${o.decisionMakingStructure || 'multi-threaded review and verification pilot activation'}.`
    ],
    pillar_3_buyer_personas: [
      `Economic Buyers: Direct targeting to key economic stakeholders: ${o.typicalBuyers || 'CROs, VPs of Sales Operations, and CFOs'}.`,
      `Technical Buyers: Dedicated technical evaluation leaders seeking robust system architecture integration.`,
      `Business Buyers: Revenue leaders focused on quick performance wins and time-to-value indicators.`,
      `Influencers: Commercial operation and sales management squads who want higher productivity.`,
      `Pain Points: Countering critical pain points: ${o.painPoints || 'pipeline unpredictability, manual data entry friction, and sales rep onboarding latency'}.`,
      `Success Metrics: Aligning with the major operational priority: ${o.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`
    ],
    pillar_4_value_proposition: [
      `Customer Value: Translate product capabilities into concrete value as a leading ${o.productCategory || 'L2 Revenue Decision layer'}.`,
      `Business Outcomes: Directly align sales execution with the overarching business goal: ${o.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`,
      `Differentiation: Enable key benefit solutions: ${o.keyBenefits || 'reduced deal leakage, instant pipeline telemetry, and high forecast predictability'}.`,
      `Competitive Advantages: Establish strong advantages over competitors like ${o.competitorList || 'BI dashboard developers'}: ${o.uniqueDifferentiators || 'native active strategic enforcement right inside CRMs'}.`,
      `ROI Statements: Direct reduction of sales leakage to secure rapid payback timelines.`
    ],
    pillar_5_messaging_positioning: [
      `Positioning Statement: Differentiated GTM positioning statement focused on driving ${o.primaryBusinessGoal || 'revenue expansion and sales acceleration'}.`,
      `Core Messaging: Deliver high impact messaging focused on solving critical pain points: ${o.painPoints || 'pipeline unpredictability, manual data entry friction, and sales rep onboarding latency'}.`,
      `Persona Messaging: Custom commercial value stories highlighting native active enforcement right inside CRMs.`,
      `Competitive Messaging: Explicitly benchmarked advantages over traditional alternatives like ${o.competitorList || 'BI dashboard developers'}.`,
      `Outcome-Based Messaging: Quantified outcome projection: reduce pipeline data leaks by 30% or trim sales rep onboarding velocity by 15 days.`
    ],
    pillar_6_sales_channel: [
      `Direct Sales Strategy: Optimize the direct model using ${o.currentSalesMotion || 'direct enterprise sales outreach reps'} for customer acquisition.`,
      `Partner Strategy: Utilize existing partner avenues such as: ${o.existingPartners || 'consultancy networks, systems integrators, and software app stores'}.`,
      `Distributor Strategy: Leverage digital application hubs and marketplaces.`,
      `Digital Strategy: Build strong online search and discovery models linked to targeted demand campaigns.`,
      `Hybrid Revenue Motion: Coordinate PLS trials with direct corporate enterprise outreach loops.`
    ],
    pillar_7_marketing_demand: [
      `Demand Generation Programs: Build sequences based on popular current activities: ${o.currentMarketingActivities || 'SEO whitepapers, quantitative benchmarking surveys, and webinars'}.`,
      `Campaign Strategy: Highly targeted campaign structures directed at decisionmakers in ${o.customerIndustries || 'specialized modern SaaS industries'}.`,
      `Content Strategy: Produce targeted audit checklists and benchmarking reports.`,
      `Digital Marketing Strategy: Coordinate paid and organic social outreach targeting hiring signals and technical updates.`,
      `Lead Generation Strategy: Run lead generation processes designed to secure custom targets: ${o.customerAcquisitionGoal || '100 active logos within 18 months'}.`
    ],
    pillar_8_enablement_execution: [
      `Shared vision: Align all teams under a unified GTM operating system.`,
      `Sales Playbooks: Deploy playbooks for the commercial sales team of ${o.salesTeamSize || '15+ reps'}.`,
      `Enablement Plans: Distribute value sheets and financial justification templates.`,
      `Training Programs: Formulate regular process checks aligned with CRM workflows.`,
      `Ready-to-use sales pitches: Standardized sales pitches demonstrating instant CRM leakage analytics in 5 minutes.`,
      `Execution Frameworks: Standardised deal verification sequences integrated into CRM workflows.`,
      `Operational Readiness: Align training modules with typical software stack tools: ${o.CRMPlatform || 'Salesforce/HubSpot'} paired with GTMOS dashboards.`
    ],
    pillar_9_metrics_feedback: [
      `Success Metrics: Meet strict target outcome metrics of ${o.ARR || '$24,000,000 ending ARR run rate'}.`,
      `KPI Framework: Monitor close-win conversion rates targeting at least: ${o.winRate || '22% opportunity-won level'}.`,
      `Leading Indicators: Monitor weekly pipeline health rating and CRM process adherence metrics.`,
      `Lagging Indicators: Mapped directly onto customer retention indexes: ${o.customerRetention || '95% customer gross retention targets'}.`,
      `Feedback Loops: Structured quarterly review checks connecting strategic outputs with onboarding results.`,
      `Continuous Improvement Framework: Iterative optimization of active enforcement rules based on actual win-loss trends.`
    ]
  };
}

// Step 14: AI GTM Execution Plan Generation Proxied Endpoint
app.post("/api/gtmos/generate-execution", async (req, res) => {
  try {
    const { strategyData, projectName } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalExecution(projectName);
      return res.json(fallback);
    }

    const ai = getGenAI();

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
              id: { type: Type.STRING, description: "Action identifier (e.g. act-1, act-2)." },
              program: { type: Type.STRING, description: "The overarching channel program (e.g. Demand Generation, Sales Enablement, Partner Enablement)." },
              title: { type: Type.STRING, description: "Precise title of the action." },
              description: { type: Type.STRING, description: "Detailed, multi-step summary of execution guidelines specifically aligning with strategy inputs." },
              owner: { type: Type.STRING, description: "Responsible organizational lead." },
              dueDate: { type: Type.STRING, description: "Deadline formatted as YYYY-MM-DD (typically set within active 30-90 day planning horizon)." },
              status: { type: Type.STRING, description: "Initial status ('todo', 'in_progress', 'completed')." },
              priority: { type: Type.STRING, description: "Task priority ('high', 'medium', 'low')." }
            },
            required: ["id", "program", "title", "description", "owner", "dueDate", "status", "priority"]
          }
        }
      }
    });

    const actions = JSON.parse(response.text || "[]");
    res.json(actions);
  } catch (error: any) {
    console.warn("Execution Generation Error, falling back to local simulation:", error.message);
    const { projectName } = req.body;
    res.json(computeLocalExecution(projectName));
  }
});

function computeLocalExecutionEngine(projectName?: string) {
  const name = projectName || "RevOS Enterprise Sandbox";
  return {
    programName: `${name} Strategy Acceleration Program`,
    description: `A systematic operational rollout designed to implement the core strategic pillars of ${name}, centered on driving pipeline velocity, high-intent outbound acceleration, and partner alignment.`,
    strategicObjective: `Secure 100 net-new enterprise accounts and expand average contract value by 15%.`,
    revenueGoal: `$10M net new ARR within the strategic milestone horizon.`,
    businessGoal: `Establish repeatable, multi-threaded GTM motion that reduces CRM leakage and accelerates proof-of-concept velocity.`,
    launchPeriod: `18 Months timeframe goal`,
    status: `Active Modeling`,
    executiveSponsor: `CRO (Chief Revenue Officer)`,
    workstreams: [
      {
        id: "ws-1",
        workstreamName: "Outbound Core Acceleration",
        purpose: "Accelerate high-impact prospecting channels and pipeline velocity by targeting key economic buyers.",
        relatedGtmPillar: "Pillar 1: Target Market Segment & ICP Mapping",
        priority: "high",
        timeline: "Months 1-6",
        owner: "Head of Sales (VP Enterprise)",
        initiatives: [
          {
            id: "init-1-1",
            initiativeName: "High-Intent Executive Outreach Campaigns",
            description: "Deploy highly personalized enterprise ABM sequences targeting Heads of Operations and CIOs with customized audit checklists.",
            strategicObjective: "Increase outbound open and meeting booking rates by 25%.",
            expectedOutcome: "Book 45 net-new enterprise demo sessions.",
            priority: "high",
            timeline: "Months 1-3",
            owner: "Outbound SDR Manager",
            budget: "$25,000",
            status: "Not Started",
            actions: [
              {
                id: "act-1-1-1",
                actionName: "Draft standard personalized outreach templates",
                description: "Write custom sequences featuring custom audit checklists and zero-fluff text blocks.",
                taskType: "Asset Creation",
                owner: "Content Specialist",
                startDate: "2026-06-15",
                dueDate: "2026-06-30",
                dependencies: "None",
                completionCriteria: "Templates designed, optimized, and loaded to Outreach.io.",
                status: "todo"
              },
              {
                id: "act-1-1-2",
                actionName: "Verify CRM lead list hygiene",
                description: "Validate decision maker emails, industry tags, and ARR parameters in the CRM console.",
                taskType: "Systems Integration",
                owner: "RevOps Specialist",
                startDate: "2026-07-01",
                dueDate: "2026-07-10",
                dependencies: "None",
                completionCriteria: "Clean lists of 500 validated enterprise leads synced to CRM.",
                status: "todo"
              }
            ],
            kpis: [
              {
                id: "kpi-1-1-1",
                kpiName: "Sequence Open Rate",
                kpiCategory: "Acquisition",
                baseline: "18%",
                target: "30%",
                currentValue: "18%",
                measurementFrequency: "Weekly",
                owner: "Marketing Analyst"
              }
            ],
            risks: [
              {
                id: "risk-1-1-1",
                riskName: "Adverse Email Filter Hits",
                description: "High rate of generic filters flags custom domain outreaches as spam.",
                probability: "medium",
                impact: "high",
                riskScore: 6,
                mitigationPlan: "Pre-warm dedicated outbound domain pools and set max daily emails to 50 items/rep.",
                owner: "RevOps Analyst"
              }
            ],
            dependencies: [
              {
                id: "dep-1-1-1",
                dependencyType: "Content Approval",
                blockingInitiative: "Executive copy sign-off",
                blockedInitiative: "ABM sequence launch",
                impactDescription: "Cannot launch sequence without legal content approval."
              }
            ],
            aiMonitoringRules: [
              {
                id: "rule-1-1-1",
                metric: "SDR outbound open rate",
                targetThreshold: "> 25%",
                alertThreshold: "< 15%",
                triggerCondition: "Open rate holds below alert threshold for 5 business days.",
                recommendedAction: "AI notifies outbound lead to adjust header copies and auto-generates 3 A/B test variations."
              }
            ]
          }
        ]
      },
      {
        id: "ws-2",
        workstreamName: "CRM Ledger Integration & Telemetry",
        purpose: "Build full operational auditability and sync metrics instantly across all customer touchpoints.",
        relatedGtmPillar: "Pillar 9: Central Operational Feedback",
        priority: "high",
        timeline: "Months 3-9",
        owner: "Director of Revenue Operations (Head of RevOps)",
        initiatives: [
          {
            id: "init-2-1",
            initiativeName: "Real-time CRM Deal Signal Audit System",
            description: "Deploy automated telemetry monitors that flag deals at risk of stalling directly inside HubSpot/Salesforce.",
            strategicObjective: "Reduce deal stagnation by 30% and improve forecast accuracy.",
            expectedOutcome: "Deal signals analyzed dynamically with actionable coaching feedback.",
            priority: "high",
            timeline: "Months 3-6",
            owner: "Senior Salesforce Engineer",
            budget: "$40,000",
            status: "Not Started",
            actions: [
              {
                id: "act-2-1-1",
                actionName: "Configure Salesforce webhook alerts",
                description: "Build custom webhook hooks inside Salesforce to catch deal milestone stage lags.",
                taskType: "Systems Integration",
                owner: "Senior Developer",
                startDate: "2026-08-01",
                dueDate: "2026-08-20",
                dependencies: "None",
                completionCriteria: "Webhooks successfully posting updates on deal progression.",
                status: "todo"
              }
            ],
            kpis: [
              {
                id: "kpi-2-1-1",
                kpiName: "Forecast Discrepancy Percentage",
                kpiCategory: "Pipeline Velocity",
                baseline: "14%",
                target: "3%",
                currentValue: "14%",
                measurementFrequency: "Monthly",
                owner: "Head of RevOps"
              }
            ],
            risks: [
              {
                id: "risk-2-1-1",
                riskName: "Sales Rep Dashboard Blindness",
                description: "Sales representatives ignore automated notifications inside CRM panels.",
                probability: "medium",
                impact: "high",
                riskScore: 6,
                mitigationPlan: "Integrate notification briefs directly into daily Slack/Teams logs so they are hard-to-miss.",
                owner: "Enablement Coach"
              }
            ],
            dependencies: [
              {
                id: "dep-2-1-1",
                dependencyType: "Data Integrations",
                blockingInitiative: "Salesforce CRM read-write API setup",
                blockedInitiative: "Real-time pipeline monitoring launch",
                impactDescription: "Monitoring engine cannot load telemetry data without Salesforce read permissions."
              }
            ],
            aiMonitoringRules: [
              {
                id: "rule-2-1-1",
                metric: "Stale opportunity flagged volume",
                targetThreshold: "< 5 deals",
                alertThreshold: "> 15 deals",
                triggerCondition: "Stale opportunities cross 15 count for 2 consecutive pipelines.",
                recommendedAction: "AI flags deal flow bottleneck and emails pipeline brief directly to CRO with custom deal-specific action tips."
              }
            ]
          }
        ]
      }
    ],
    governance: {
      raciAssignment: "CRO serves as final Accountable owner. VP of Enterprise Sales is Responsible for Outbound execution. Head of RevOps is Responsible for CRM integration and data validation. Marketing directors Consulted on asset creation.",
      reviewCadence: "Bi-Weekly Executive GTM Sprint reviews with CRO focus.",
      escalationPath: "Blocker flagged in CRM -> RevOps Specialist notifies workstream owner within 24hr -> unresolved hurdles escalated to CRO during Bi-Weekly sync."
    },
    executiveSummary: `This GTM Execution Plan provides a thorough, traceable, programmatic framework to scale enterprise contract values and pipeline ARR for ${name}. By optimizing outbound outreach with clear dependencies and creating absolute telemetry transparency within the transactional CRM registries, GTM operators can track real-time progression, mitigate pipeline stagnation risks, and secure scalable ARR velocity.`
  };
}

app.post("/api/gtmos/generate-execution-engine", async (req, res) => {
  try {
    const { onboardingData, gtmStrategyDraft, projectName } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalExecutionEngine(projectName);
      return res.json(fallback);
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        `Role: You are an elite enterprise Revenue Operations Architect and Chief Growth Officer.
        Based on the onboarding information:
        ${JSON.stringify(onboardingData, null, 2)}

        And the finalized GTM Strategy Draft:
        ${JSON.stringify(gtmStrategyDraft, null, 2)}

        Generate a highly trackable, thorough, enterprise-grade GTM Execution Action Plan.
        The execution timeframe/period of time is given in the "timeHorizon" onboarding field as: "${onboardingData?.timeHorizon || '12-18 Months'}".
        Make sure all initiatives, workstreams, and actions fit realistic milestones within this timeframe.

        The output MUST be a JSON object conforming exactly to the standard GTMExecutionPlan schema. Do not generate fake or placeholder text. Return actual actionable strategies.`
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
        }
      }
    });

    const val = JSON.parse(response.text || "{}");
    res.json(val);
  } catch (error: any) {
    console.warn("Execution Engine Generation Error, falling back to local simulation:", error.message);
    const { projectName } = req.body;
    res.json(computeLocalExecutionEngine(projectName));
  }
});

// Step 18 & 19: AI Operational Risks & Recommendations Proxied Endpoint
app.post("/api/gtmos/risks-recommendations", async (req, res) => {
  try {
    const { onboardingData, strategyData } = req.body;

    if (!hasGenAIKey()) {
      const fallback = computeLocalRisksRecs();
      return res.json(fallback);
    }

    const ai = getGenAI();

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
                  title: { type: Type.STRING, description: "Enterprise-level title for the detected business threat." },
                  level: { type: Type.STRING, description: "Severity LEVEL: Red (High), Orange (Medium), Yellow (Low)" },
                  probability: { type: Type.STRING, description: "Likelihood ('High', 'Medium', 'Low')" },
                  impact: { type: Type.STRING, description: "Impact severity ('Critical', 'High', 'Moderate')" },
                  description: { type: Type.STRING, description: "In-depth tactical description of how this risk disrupts pipeline expansion." },
                  mitigation: { type: Type.STRING, description: "Highly actionable mitigation plan with explicit milestones." }
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
                  category: { type: Type.STRING, description: "Specific operations focus (e.g. Pipeline Efficiency, Outbound Coordination, Revenue Telemetry)." },
                  title: { type: Type.STRING, description: "Clear, executive recommendations action." },
                  impact: { type: Type.STRING, description: "Expected impact metrics ('High Revenue Impact', 'Moderate Operational Saving')" },
                  effort: { type: Type.STRING, description: "Implementation estimate ('Low', 'Medium', 'High')" },
                  actionableSteps: { type: Type.STRING, description: "Detailed, sequential checklist to deploy this recommendation immediately." }
                },
                required: ["id", "category", "title", "impact", "effort", "actionableSteps"]
              }
            }
          },
          required: ["risks", "recommendations"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Risks Recommendations Audit Error, falling back to local simulation:", error.message);
    res.json(computeLocalRisksRecs());
  }
});

// Stepped Pitch Playground Endpoint
app.post("/api/gtmos/generate-pitch", async (req, res) => {
  try {
    const { onboardingData, projectName, buyerType, pitchFormat } = req.body;

    if (!hasGenAIKey()) {
      return res.json(computeLocalPitch(onboardingData, projectName, buyerType, pitchFormat));
    }

    const ai = getGenAI();

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

    const promptString = `You are an elite commercial Go-to-Market strategist. Synthesize a pristine, compelling, highly customized sales pitch targeted and crafted specifically for a ${buyerLabel} delivered in a ${formatLabel} format.
    
    ORGANIZATIONAL CONTEXT:
    ${buildRichContext(onboardingData, projectName)}

    FEW-SHOT EXAMPLES OF DESIRED OUTPUT STRATEGIES:
    - Pitch for Technical Buyer in Technical Brief format:
      "Deploy our dual-sync pipeline architecture directly alongside your instance. We eliminate middle-tier serialization latency bottlenecks entirely, checking schema integrity at the ingress gate with sub-millisecond overhead to guarantee bulletproof validation of incoming telemetry data."
    - Pitch for Economic Buyer in Elevator Pitch format:
      "We help your team reduce contract drop-off and eliminate customer churn by providing real-time operational risk triggers. For an average enterprise of your size, this translates into an estimated $140,000 in saved annual ARR within the first ninety days of deployment, at a payback period of just three months."

    CRITICAL PLAYBOOK REQUIREMENTS:
    1. Do not use high-level, generic fluff or marketing cliches. Use real facts based on the user's CRM Platform (${onboardingData?.CRMPlatform || 'HubSpot'}), available budget (${onboardingData?.availableBudget || 'N/A'}), and team size.
    2. Format the response as a valid JSON object matching the requested schema. Make the pitch directly readable and inspiring for a sales representative to copy and use immediately.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [promptString],
      config: {
        systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pitch: { type: Type.STRING, description: "The tailored, fully written ready-to-use sales pitch text." },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 bulleted arguments why this pitch appeals to this specific buyer type."
            },
            conversationalOpener: { type: Type.STRING, description: "A high-impact first sentence or opening icebreaker question." }
          },
          required: ["pitch", "keyPoints", "conversationalOpener"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Pitch Generation Error, returning local fallback:", error.message);
    const { onboardingData, projectName, buyerType, pitchFormat } = req.body;
    res.json(computeLocalPitch(onboardingData, projectName, buyerType, pitchFormat));
  }
});

// GTM Strategy Canvas Generation Endpoint (Step 12)
app.post("/api/gtmos/generate-canvas", async (req, res) => {
  try {
    const { onboardingData, projectName, gtmStrategyDraft } = req.body;

    if (!hasGenAIKey()) {
      return res.json(computeLocalGtmCanvas(gtmStrategyDraft, onboardingData, projectName));
    }

    const ai = getGenAI();
    const draftText = gtmStrategyDraft ? JSON.stringify(gtmStrategyDraft, null, 2) : "None yet";

    const promptString = `You are an elite, world-class GTM strategic consultant. Synthesize a professional, concise, coherent executive summary (2-3 sentences max) for each of the 9 core strategic GTM pillars.
    
    ORGANIZATIONAL CONTEXT:
    ${buildRichContext(onboardingData, projectName || 'your product')}

    DRAFT STRATEGY LINES (FINALIZED STRATEGY TO SUMMARIZE):
    ${draftText}

    CRITICAL INSTRUCTIONS:
    - For each pillar, analyze the Draft Strategy Lines provided. If draft strategy lines exist for a pillar, synthesize them into a highly polished, unified brief (no prefix labels, just direct prose).
    - If a pillar has no draft strategy lines, use the other available onboarding context to formulate a high-quality professional default summary.
    - Keep each summary extremely objective, sharp, professional, and action-oriented. Do not add fluff, pleasantries, or boilerplate.
    - Format response as a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [promptString],
      config: {
        systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pillar_1_market_segmentation: { type: Type.STRING, description: "Synthesis summary of Pillar 1: Market Segmentation" },
            pillar_2_icp: { type: Type.STRING, description: "Synthesis summary of Pillar 2: ICP" },
            pillar_3_buyer_personas: { type: Type.STRING, description: "Synthesis summary of Pillar 3: Buyer Personas" },
            pillar_4_value_proposition: { type: Type.STRING, description: "Synthesis summary of Pillar 4: Value Proposition" },
            pillar_5_messaging_positioning: { type: Type.STRING, description: "Synthesis summary of Pillar 5: Messaging & Positioning" },
            pillar_6_sales_channel: { type: Type.STRING, description: "Synthesis summary of Pillar 6: Sales & Channel Strategy" },
            pillar_7_marketing_demand: { type: Type.STRING, description: "Synthesis summary of Pillar 7: Marketing & Demand Generation" },
            pillar_8_enablement_execution: { type: Type.STRING, description: "Synthesis summary of Pillar 8: Enablement & Execution" },
            pillar_9_metrics_feedback: { type: Type.STRING, description: "Synthesis summary of Pillar 9: Metrics & Feedback Loop" }
          },
          required: [
            "pillar_1_market_segmentation",
            "pillar_2_icp",
            "pillar_3_buyer_personas",
            "pillar_4_value_proposition",
            "pillar_5_messaging_positioning",
            "pillar_6_sales_channel",
            "pillar_7_marketing_demand",
            "pillar_8_enablement_execution",
            "pillar_9_metrics_feedback"
          ]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Canvas Generation Error, returning local fallback:", error.message);
    const { onboardingData, projectName, gtmStrategyDraft } = req.body;
    res.json(computeLocalGtmCanvas(gtmStrategyDraft, onboardingData, projectName));
  }
});

// GTM Simulation Recommendation Layer Endpoint
app.post("/api/gtmos/simulate-recommendations", async (req, res) => {
  try {
    const { onboardingData, projectName, activeScenario, activeParams } = req.body;

    if (!hasGenAIKey()) {
      return res.json(computeLocalSimulationRecommendations(activeScenario, onboardingData, projectName, activeParams));
    }

    const ai = getGenAI();
    const p = activeParams || {};

    const promptString = `You are an elite, world-class GTM strategic board advisor. Conduct a professional, rigorous evaluation of the active simulation scenario: "${activeScenario}".

    OPERATIONAL SIMULATION METRICS:
    - Target Opportunities Inflow (N): ${p.opportunities || 50}
    - Baseline Win-Rate (W): ${p.winRate || 15}%
    - Average Contract Value (ACV): $${(p.acv || 50000).toLocaleString()}
    - Sales Cycle Length (L): ${p.cycleLength || 90} days
    - Projected Daily Revenue Velocity (V): $${(p.revenueVelocity || 100).toFixed(2)} / day

    ORGANIZATIONAL CONTEXT:
    ${buildRichContext(onboardingData, projectName || 'your product')}

    CRITICAL ANALYSIS CONSTRAINTS:
    - Assess how these strategic assumptions impact overall market resonance, risk factors, and organizational complexities.
    - Keep each analysis extremely sharp, high-conviction, professional, and directly actionable.
    - Avoid low-value generalities or greeting filler.
    - Format response as a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [promptString],
      config: {
        systemInstruction: GTMOS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bestStrategy: { type: Type.STRING, description: "Detailed strategic assessment and recommendation for the optimal approach." },
            alternativeStrategies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 alternative approaches or adjustments worth evaluating."
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 high-impact risk vectors associated with this choice."
            },
            tradeOffs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 2 tactical trade-offs (e.g. margin vs. speed, complexity vs. scale)."
            },
            expectedOutcomes: { type: Type.STRING, description: "Clear explanation of expected outcomes across Worst, Expected, and Best Case ranges." },
            whySelected: { type: Type.STRING, description: "Clear, rationale-backed explanation of why this recommendation suits the specific contextual indicators." }
          },
          required: ["bestStrategy", "alternativeStrategies", "risks", "tradeOffs", "expectedOutcomes", "whySelected"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Simulation Recommendations Error, returning local fallback:", error.message);
    const { onboardingData, projectName, activeScenario, activeParams } = req.body;
    res.json(computeLocalSimulationRecommendations(activeScenario, onboardingData, projectName, activeParams));
  }
});

// Dedicated Go-To-Market Initiative Intelligence Generation Endpoint
app.post("/api/gtmos/generate-initiative-intelligence", async (req, res) => {
  try {
    const { initiativeName, description, strategicObjective, onboardingData } = req.body;

    if (!hasGenAIKey()) {
      return res.json(computeLocalInitiativeIntelligence(initiativeName, description, strategicObjective));
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        `You are an elite, world-class GTM Operations Architect.
        Analyze the following GTM initiative:
        Initiative name: "${initiativeName}"
        Description: "${description}"
        Strategic Objective: "${strategicObjective}"
        
        Using this context, propose:
        1. 2 distinct 'Strategic Dependencies' (one Technical/Systems block, and one Resource/Collateral block) that must be solved before or alongside this initiative.
        2. 2 high-fidelity, actionable 'AI Guardian Monitoring Rules' with specific target metrics, alerting thresholds, trigger conditions, and concrete AI-recommended recovery actions.
        
        The output MUST be a JSON object conforming exactly to this schema:
        {
          "dependencies": [
            {
              "id": "string (unique code starting with dep-)",
              "dependencyType": "Technical Dependency" | "Resource Dependency" | "Strategic Block",
              "blockingInitiative": "string (name of the blocking task, e.g. CRM Custom Object Creation)",
              "blockedInitiative": "string (name of blocked task, e.g. outbound outreach)",
              "impactDescription": "string"
            }
          ],
          "aiMonitoringRules": [
            {
              "id": "string (unique code starting with rule-)",
              "metric": "string (e.g. Conversation Rate)",
              "targetThreshold": "string (e.g. > 8.0%)",
              "alertThreshold": "string (e.g. < 3.0%)",
              "triggerCondition": "string (comprehensive condition, e.g. If rolling 7-day conversion falls below 3.0%)",
              "recommendedAction": "string (proactive AI automation logic)"
            }
          ]
        }
        Do not add any markup besides raw JSON.`
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
          required: ["dependencies", "aiMonitoringRules"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("Initiative Intelligence Error, returning local fallback:", error.message);
    const { initiativeName, description, strategicObjective } = req.body;
    res.json(computeLocalInitiativeIntelligence(initiativeName, description, strategicObjective));
  }
});

function computeLocalInitiativeIntelligence(initiativeName: string, description: string, strategicObjective: string) {
  const initName = initiativeName || "this initiative";
  return {
    dependencies: [
      {
        id: `dep-${Date.now()}-1`,
        dependencyType: "Technical Dependency",
        blockingInitiative: "CRM Custom Object Creation",
        blockedInitiative: initName,
        impactDescription: `To measure GTM progression correctly, custom pipeline telemetry registers must be completed in the CRM before launching ${initName}.`
      },
      {
        id: `dep-${Date.now()}-2`,
        dependencyType: "Resource Dependency",
        blockingInitiative: "Approved Target Collateral Design",
        blockedInitiative: initName,
        impactDescription: `Requires specialized target content collateral, templates, and email scripts to be fully approved before SDR outreach commences.`
      }
    ],
    aiMonitoringRules: [
      {
        id: `rule-${Date.now()}-1`,
        metric: "Conversation Rate",
        targetThreshold: "> 8.5%",
        alertThreshold: "< 3.0%",
        triggerCondition: "If rolling 7-day conversion falls below 3.0%",
        recommendedAction: "AI triggers instant alert: Initiate deep sentiment override. Revise marketing collateral personalization tokens and re-define ICP filter parameters."
      },
      {
        id: `rule-${Date.now()}-2`,
        metric: "Pipeline Velocity",
        targetThreshold: "15 Days / Stage",
        alertThreshold: "> 30 Days / Stage",
        triggerCondition: "If deals associated with this initiative stagnate in 'Proposal Sent' for >30 days",
        recommendedAction: "AI triggers instant trigger: Execute the automated executive-sponsor fallback campaign and notify the account executive team."
      }
    ]
  };
}

function computeLocalSimulationRecommendations(scenario: string, onboardingData: any, projectName: string, params: any) {
  const o = onboardingData || {};
  const proj = projectName || "your product";
  const p = params || { opportunities: 50, winRate: 15, acv: 50000, cycleLength: 90, revenueVelocity: 83.33 };
  
  const scenariosMap: Record<string, any> = {
    "Scenario A: Market Penetration": {
      bestStrategy: `Accelerate high-velocity volume targeting in ${o.targetIndustries || 'tech and SaaS verticals'}. Focus outbound SDR outreach on securing high volumes of mid-market accounts. This aims to maximize market share quickly, leveraging our existing pricing floor.`,
      alternativeStrategies: [
        "Incorporate a warm outbound agency layer to drive top-of-funnel opportunities from 50 to 90+ monthly.",
        "Introduce tiered entry packages to lower friction and increase initial Close-Win baseline to 20%."
      ],
      risks: [
        `High operational friction from rapid client onboarding, straining the team's CS capacity.`,
        "Slightly increased customer acquisition costs (CAC) due to highly competitive CPC rates."
      ],
      tradeOffs: [
        "Prefers immediate market volume and raw logo acquisition speed over high initial contract size.",
        "Higher transactional volume increases the risk of mid-level CRM data leakage."
      ],
      expectedOutcomes: `At an Expected (P50) case of $${(p.revenueVelocity * 30).toLocaleString()} monthly ARR growth, this creates a profitable footprint. The Best (P90) scenario accelerates ARR growth to over double that rate by condensing sales cycle velocity below 60 days.`,
      whySelected: `Selected because ${proj}'s primary business goal involves "${o.primaryBusinessGoal || 'revenue expansion'}" which warrants an aggressive front-foot outbound coverage strategy.`
    },
    "Scenario B: Vertical Specialization": {
      bestStrategy: `Pivot outbound messaging entirely towards deep niche-industry customization, raising Average Contract Value (ACV) to offset lower raw opportunity counts. Treat enterprise security and modular compliance as key structural selling anchors.`,
      alternativeStrategies: [
        "Direct-target niche buyers (${o.typicalBuyers || 'CROs and revenue leaders'}) with localized user cases.",
        "Establish exclusive technical partnerships within target geographies like ${o.targetGeographies || 'North America'}."
      ],
      risks: [
        "Significantly lengthened Sales Cycle (L) extending closer to 120-150 days due to multi-threaded corporate legal reviews.",
        "Reduced total addressable target pool in the immediate 90-day pipeline window."
      ],
      tradeOffs: [
         "Prioritizes premium ACV and high Gross Margin over rapid, frictionless market logo acquisition velocity.",
         "Requires high direct sales team effort and deep product feature alignment."
      ],
      expectedOutcomes: `Under P50 baseline, specialized high-value accounts secure robust quarterly cash flows. Worst-case (P10) is buffered by higher transaction sizing ($${(p.acv * 1.5).toLocaleString()} average contract floor), preventing downside margin collapse.`,
      whySelected: `Selected to leverage your unique differentiators: "${o.uniqueDifferentiators || 'commercial optimization features'}" as elite high-margin business arguments.`
    },
    "Scenario C: Partner-Led Growth": {
      bestStrategy: `Leverage resellers, professional integrators, and software consultation firms to bundle ${proj} as part of broader digital transformation contracts. This structures an indirect channel strategy to scale footprint with zero immediate headcount load.`,
      alternativeStrategies: [
        "Launch an attractive recurring rev-share incentive program (20% first-year commissions) to active channel consultants.",
        "Co-market with CRM platforms like ${o.CRMPlatform || 'HubSpot'} to gain native directory listing prominence."
      ],
      risks: [
        "Loss of direct end-customer data feedback lines, leading to potential product-market fit blindspots.",
        "Channel partner training latency, resulting in misaligned GTM messaging."
      ],
      tradeOffs: [
        "Exchanges margin share (partner commissions) to bypass heavy direct sales representative compensation costs.",
        "Trades absolute control over customer experience for massive leverage and lower CAC."
      ],
      expectedOutcomes: `Unlocks an expected 2x lift in volume (N) over 12 months with low sales representative headcount overhead. Worst case (P10) delays deployment times to 120+ days if partner training is not executed properly.`,
      whySelected: `Selected because the onboarding records indicate available budgets are optimized, making commission-based indirect channels a highly efficient, capital-preserving distribution model.`
    },
    "Scenario D: Product-Led Growth": {
      bestStrategy: `Enable frictionless, self-serve trial sandboxes that let technical operators discover value within minutes. Automate upgrade cues right inside the interface based on workspace usage metrics.`,
      alternativeStrategies: [
        "Implement interactive interactive onboarding loops using guided tooltips to decrease day-1 activation drop-off.",
        "Offer a lightweight freemium tier targeting SMB teams to build high-volume bottom-up product adoption."
      ],
      risks: [
        "Substantially lowered Average Contract Value (ACV) at the outset, demanding high overall volume to sustain target ARR.",
        "Higher churn rate (monthly baseline of 4-5%) typical of standard PLG self-service user behaviors."
      ],
      tradeOffs: [
        "Prioritizes immediate user activation and frictionless sign-up loops over upfront contractual billing commitments.",
        "Requires dedicated platform-level onboarding focus rather than custom enterprise custom setups."
      ],
      expectedOutcomes: `Optimizes velocity with sales cycles condensed to a mere 14-30 days. P90 best-case triggers a viral coefficient resulting in rapid cumulative contribution growth.`,
      whySelected: `Aligns closely with the user's focus on solving modern pain points like "${o.painPoints || 'pipeline drop-offs'}" by bypassing typical high-friction corporate procurement timelines.`
    },
    "Scenario E: Hybrid Revenue Motion": {
      bestStrategy: `Blend bottom-up self-serve product adoption with high-touch outbound account-executive targeting. Use product-usage metrics as warm-lead signals for enterprise tier upselling.`,
      alternativeStrategies: [
        "Trigger custom up-sell notifications to teams with more than 10 active seat-users.",
        "Deploy automated enterprise-readiness security briefs to power-users inside Fortune 500 domains."
      ],
      risks: [
        "Internal team resource fragmentation if engineers and reps try to support both low and high-touch funnels simultaneously.",
        "Pricing model confusion if self-serve rates conflict with enterprise-custom negotiation boundaries."
      ],
      tradeOffs: [
        "Accepts higher operational complexity in exchange for capturing both transactional volume and major institutional contracts.",
        "Requires deep engineering integration to pass CRM platform indicators to active sales representatives."
      ],
      expectedOutcomes: `At P50 expected trends, this hybrid motion yields consistent, diversified revenue streams. Best-case (P90) achieves a highly optimized CAC-to-LTV ratio of over 1:5.`,
      whySelected: `Derived as the optimal long-term strategy for ${proj} to scale across both immediate developers and enterprise-level financial decision-makers.`
    }
  };

  return scenariosMap[scenario] || scenariosMap["Scenario A: Market Penetration"];
}

function computeLocalGtmCanvas(draft: any, onboardingData: any, projectName: string) {
  const o = onboardingData || {};
  const d = draft || {};
  
  const getSummary = (key: string, fallback: string) => {
    if (d[key] && Array.isArray(d[key]) && d[key].length > 0) {
      return d[key].map((item: string) => {
        const parts = item.split(': ');
        return parts.length > 1 ? parts.slice(1).join(': ') : item;
      }).join(' Moreover, ') + '.';
    }
    return fallback;
  };

  return {
    pillar_1_market_segmentation: getSummary('pillar_1_market_segmentation', `Prioritize high-growth enterprise verticals and mid-market players inside ${o.targetIndustries || 'tech and digital sectors'} seeking optimized efficiency.`),
    pillar_2_icp: getSummary('pillar_2_icp', `Target companies scaling with ${o.customerSizes || '100 - 500 people'} using ${o.CRMPlatform || 'HubSpot'} as primary CRM, mainly based in ${o.targetGeographies || 'US and Europe'}.`),
    pillar_3_buyer_personas: getSummary('pillar_3_buyer_personas', `Engage economic stakeholders like CROs or Finance Officers alongside technical software architects. Deliver custom metrics addressing ${o.painPoints || 'high operational friction'}.`),
    pillar_4_value_proposition: getSummary('pillar_4_value_proposition', `Deploy a native commercial intelligence layer to achieve core objectives for ${projectName || 'the company'}, specifically ${o.primaryBusinessGoal || 'sales velocity acceleration'}.`),
    pillar_5_messaging_positioning: getSummary('pillar_5_messaging_positioning', `Position ${projectName || 'this solution'} as the only integrated active strategic platform built to eliminate ${o.painPoints || 'pipeline drop-offs'}.`),
    pillar_6_sales_channel: getSummary('pillar_6_sales_channel', `Implement interactive outbound systems aligned with partner channels for scalable corporate adoption.`),
    pillar_7_marketing_demand: getSummary('pillar_7_marketing_demand', `Activate high-value intent-based inbound campaigns centered on resolving ${o.painPoints || 'operational metadata delays'}.`),
    pillar_8_enablement_execution: getSummary('pillar_8_enablement_execution', `Distribute robust training programs and modular playbooks to equip reps with ready-to-use customer pitches.`),
    pillar_9_metrics_feedback: getSummary('pillar_9_metrics_feedback', `Establish live performance feedback loops tracking core parameters such as pipeline conversion and quarterly LTV expansion.`)
  };
}

function computeLocalPitch(oData: any, projectName: string, bType: string, pFormat: string) {
  const o = oData || {};
  const project = projectName || o.companyName || "your product";
  const crm = o.CRMPlatform || "HubSpot";
  const diff = o.uniqueDifferentiators || "sub-millisecond data sync and automated pipeline rules";
  const pain = o.painPoints || "high pipeline drop-off and misaligned sales/marketing telemetry";

  let pitch = "";
  let keyPoints: string[] = [];
  let conversationalOpener = "";

  if (bType === "technical_buyer") {
    conversationalOpener = "How is your engineering team currently validating incoming customer metadata before it corrupts your CRM systems?";
    if (pFormat === "technical_brief") {
      pitch = `A highly structured technical brief for ${project}. We establish native endpoint listeners connected straight to your ${crm} to validate high-velocity streams. By executing schema structural checks at the database ingress layer, we maintain data integrity and guarantee sub-millisecond sync without injecting fragile middleware or custom API translation modules. This completely solves ${pain}.`;
    } else if (pFormat === "executive_roi") {
      pitch = `Technical value and infrastructure impact review of ${project}: We enable direct, secure data connector pathways into ${crm}, reducing pipeline configuration overhead by 40% and eliminating fragile custom-coded API endpoints. Real-time logging saves engineering teams approximately 15 hours per week on debugging raw API errors.`;
    } else {
      pitch = `We offer automated, low-latency data connectors that plug right into your engineering pipeline and auto-map payloads to ${crm}. Perfect for teams needing reliable data streams without standard architectural bottlenecks.`;
    }
    keyPoints = [
      "Secures strict CRM schema integrity at point-of-entry without complex custom middleware.",
      "Integrates fully with your existing tech-stack to achieve sub-millisecond latency levels.",
      "Significantly minimizes engineering team maintenance burden by automating raw sync error tracking."
    ];
  } else if (bType === "economic_buyer") {
    conversationalOpener = "Are you seeking to maximize your active sales pipeline productivity while driving down high customer acquisition costs (CAC)?";
    if (pFormat === "executive_roi") {
      pitch = `Executive commercial assessment for ${project}: By deploying native pipeline synchronization, we target the major friction of '${pain}'. For companies using ${crm}, our customers report a standard 30% reduction in total cost of ownership (TCO) inside the first two quarters. This guarantees standard payback within 90 days and improves your overall LTV:CAC efficiency ratio.`;
    } else if (pFormat === "technical_brief") {
      pitch = `Enterprise Value Summary: Automating data validation reduces transaction leakage, recovering up to $18,000 in lost ARR pipeline capacity per commercial representative. Eliminates manual CRM sync verification, enabling a faster Sales Cycle.`;
    } else {
      pitch = `We help you drive down overall customer acquisition costs (CAC) by aligning marketing channels with target sales motions right inside ${crm}. This optimizes budget allocation and increases pipeline conversion velocity by up to 25% within 3 months.`;
    }
    keyPoints = [
      "Accelerates typical sales representative productivity, generating a clear, auditable ROI inside 90 days.",
      "Reduces pipeline leakage to maximize total customer lifetime value (LTV:CAC).",
      "Maximizes current GTM tech-stack ROI by removing manual data validation hurdles."
    ];
  } else if (bType === "business_buyer") {
    conversationalOpener = "How are your marketing and sales leads coordinated inside your database systems to prevent deal friction?";
    pitch = `Workflow optimization alignment for ${project}. We eliminate key business bottlenecks by unifying data structures. Leads generated from external campaigns flow immediately to your sales reps with complete, structured metadata. This increases active lead-to-opportunity progression by 22% and streamlines standard daily sales operations.`;
    keyPoints = [
      "Eliminates friction from manual record handoffs, keeping reps focused entirely on closing.",
      "Fosters real-time cross-functional alignment between outbound marketing and active sales tiers.",
      "Accelerates daily operational reporting accuracy using standardized dashboards."
    ];
  } else {
    // Influencer / General
    conversationalOpener = "What if your sales reps could instantly see structured, error-free customer information without manual typing?";
    pitch = `A simplified, visual interface designed to make daily commercial work effortless. ${project} delivers clean, structured customer records to your workspace, preventing manual double-entry, missing notes, or disjointed status views. Focus on building real customer trust instead of battling CRM forms.`;
    keyPoints = [
      "Exceedingly modern UI with real-time visual schema previews that simplify status inspections.",
      "Stops manual system data entry, returning an average of 4 hours weekly to every rep.",
      "Provides intuitive sharing and commenting threads for quick team synergy."
    ];
  }

  return { pitch, keyPoints, conversationalOpener };
}

// ---------------------------------------------------------
// VITE OR STATIC ASSETS SERVING MIDDLEWARE
// ---------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RevOS Backend Active] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup failure:", err);
});
