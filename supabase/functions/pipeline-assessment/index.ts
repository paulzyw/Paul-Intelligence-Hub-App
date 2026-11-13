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
  } catch (_e) {
    return "";
  }
};

// =========================================================================
// CANONICAL DEFINITIONS & REGISTRIES
// =========================================================================

export const CANONICAL_PADF_DIMENSIONS = [
  {
    code: 'PA1_Customer_Value_and_Urgency',
    shortCode: 'PA1',
    name: 'Customer Value & Urgency',
    weight: 0.15,
    mandatory: true,
    description: 'Evaluates business problem severity, financial ROI impact, quantified metrics, and decision urgency.'
  },
  {
    code: 'PA2_Buying_Center_and_Influence',
    shortCode: 'PA2',
    name: 'Buying Center & Influence',
    weight: 0.15,
    mandatory: true,
    description: 'Evaluates economic buyer access, champion strength, internal stakeholder coverage, and influencer alignment.'
  },
  {
    code: 'PA3_Buying_Process_and_Decision_Control',
    shortCode: 'PA3',
    name: 'Buying Process & Decision Control',
    weight: 0.15,
    mandatory: true,
    description: 'Evaluates decision criteria influence, formal approval workflow, procurement governance, and timeline.'
  },
  {
    code: 'PA4_Solution_and_Value_Proposition',
    shortCode: 'PA4',
    name: 'Solution & Value Proposition',
    weight: 0.15,
    mandatory: true,
    description: 'Evaluates technical fit, architecture compatibility, delivery feasibility, and customer value proposition alignment.'
  },
  {
    code: 'PA5_Competitive_Position',
    shortCode: 'PA5',
    name: 'Competitive Position',
    weight: 0.10,
    mandatory: false,
    description: 'Evaluates competitive differentiation, competitor positioning, incumbency dynamics, and defense strategy.'
  },
  {
    code: 'PA6_Commercial_and_Deal_Structure',
    shortCode: 'PA6',
    name: 'Commercial & Deal Structure',
    weight: 0.10,
    mandatory: false,
    description: 'Evaluates budget allocation, commercial terms, pricing viability, and contract negotiation readiness.'
  },
  {
    code: 'PA7_Sales_Execution_and_Deal_Readiness',
    shortCode: 'PA7',
    name: 'Sales Execution & Deal Readiness',
    weight: 0.10,
    mandatory: false,
    description: 'Evaluates sales team execution, cross-functional resource readiness, mutual close plan, and operational velocity.'
  },
  {
    code: 'PA8_Deal_Momentum_Risk_and_Closeability',
    shortCode: 'PA8',
    name: 'Deal Momentum, Risk & Closeability',
    weight: 0.10,
    mandatory: false,
    description: 'Evaluates engagement velocity, slip risks, close date credibility, and overall closing momentum.'
  }
];

export const CANONICAL_REVENUE_MOTIONS: Record<string, string> = {
  'RM01': 'RM01_Digital_Solution_Selling',
  'RM02': 'RM02_Direct_Enterprise_Sales',
  'RM03': 'RM03_Product_Led_Growth',
  'RM04': 'RM04_Channel_Partner_Motion',
  'RM05': 'RM05_Consumption_Usage_Based',
  'RM06': 'RM06_Generic_Solution_Selling',
  // Aliases
  'RMF_01': 'RM01_Digital_Solution_Selling',
  'RMF_02': 'RM02_Direct_Enterprise_Sales',
  'RMF_03': 'RM03_Product_Led_Growth',
  'RMF_04': 'RM04_Channel_Partner_Motion',
  'RMF_05': 'RM05_Consumption_Usage_Based',
  'RMF_06': 'RM06_Generic_Solution_Selling'
};

export const CANONICAL_INDUSTRIES: Record<string, string> = {
  'IND_01': 'IND_SaaS_Software',
  'IND_02': 'IND_Enterprise_Software',
  'IND_03': 'IND_Financial_Services',
  'IND_04': 'IND_Healthcare_LifeSciences',
  'IND_05': 'IND_Manufacturing_Industrial',
  'IND_06': 'IND_Retail_Ecommerce',
  'IND_07': 'IND_Telecommunications',
  'IND_08': 'IND_Energy_Utilities',
  'IND_09': 'IND_Public_Sector',
  'IND_10': 'IND_Professional_Services',
  'IND_11': 'IND_Media_Entertainment',
  'IND_12': 'IND_Logistics_SupplyChain',
  'IND_13': 'IND_Hospitality_Travel',
  'IND_14': 'IND_Education_EdTech',
  'IND_15': 'IND_Construction_RealEstate',
  'IND_16': 'IND_Other_Solutions'
};

// 48 Reusable Evidence Objects across PA1–PA8
export const EVIDENCE_OBJECTS_REGISTRY: Record<string, any> = {
  // PA1 - Customer Value & Urgency (6 items)
  'EV_PA1_001': {
    id: 'EV_PA1_001',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Business Challenge Quantified Impact',
    question: 'Has the customer quantified the operational or financial impact of their primary business challenge?',
    positiveSignals: ['Specific dollar or percentage impact confirmed by leadership', 'Documented business case with target cost reduction or revenue gain', 'Audited metric baselines provided by customer'],
    negativeSignals: ['Vague problem statement without financial figures', 'Purely theoretical pain described by seller without customer confirmation', 'Problem dismissed as minor by operational team'],
    suggestedAnswers: [
      'Customer verified an annual financial impact of $500K+ with CFO-approved ROI model.',
      'Operational bottlenecks quantified at 35% productivity loss, confirmed by VP of Operations.',
      'Qualitative pain described by team, but financial quantification is still in progress.',
      'Problem is exploratory; customer has not quantified operational impact.'
    ]
  },
  'EV_PA1_002': {
    id: 'EV_PA1_002',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Strategic Executive Priority Alignment',
    question: 'Is this initiative directly connected to the customer\'s top strategic executive goals or annual board priorities?',
    positiveSignals: ['Initiative explicitly cited in annual corporate goals or CEO memo', 'Executive sponsor has board-mandated timeline for delivery', 'Funded under top-3 strategic modernization initiatives'],
    negativeSignals: ['Departmental vanity project with no executive visibility', 'Discretionary experiment with uncertain strategic staying power', 'Low corporate priority compared to competing initiatives'],
    suggestedAnswers: [
      'Tied directly to Board-mandated digital modernization mandate for current fiscal year.',
      'Explicitly sponsored by Division President as a top-3 operational transformation project.',
      'Considered important within IT/RevOps, but not yet elevated to enterprise executive level.',
      'Departmental initiative with no formal executive visibility or board mandate.'
    ]
  },
  'EV_PA1_003': {
    id: 'EV_PA1_003',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Compelling Event & Cost of Inaction',
    question: 'What is the compelling event driving the target close date, and what is the quantified cost of inaction?',
    positiveSignals: ['Hard regulatory or compliance deadline with financial penalties', 'Expiring legacy vendor contract with non-renewal notice', 'Severe revenue or competitive penalty if not live by Q3'],
    negativeSignals: ['Arbitrary sales rep end-of-quarter target date', 'No cost of delaying the decision to next fiscal year', 'Customer states they can continue with status quo indefinitely'],
    suggestedAnswers: [
      'Firm regulatory deadline / contract expiration on specified date with severe financial penalties for non-compliance.',
      'Product launch scheduled for next quarter requiring this platform live as prerequisite.',
      'Internal target date set by champion, but no external penalty if delayed.',
      'No compelling event identified; customer can maintain status quo indefinitely.'
    ]
  },
  'EV_PA1_004': {
    id: 'EV_PA1_004',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Customer-Validated Success Criteria',
    question: 'Has the customer agreed on documented, measurable success criteria to validate deployment success?',
    positiveSignals: ['Written success criteria signed off by business and technical owners', 'Clear SLA and milestone scorecard established for production rollout', 'Defined acceptance criteria mapped directly to value hypothesis'],
    negativeSignals: ['Subjective criteria like "user satisfaction" without measurement', 'Disagreement between business and technical leads on success definition', 'No documented success benchmarks'],
    suggestedAnswers: [
      'Documented success criteria signed off by both VP of Technology and Head of Revenue.',
      'Clear technical and operational benchmarks defined in mutual evaluation agreement.',
      'General success goals discussed, but formal sign-off is pending evaluation phase.',
      'No documented success criteria established; expectations remain subjective.'
    ]
  },
  'EV_PA1_005': {
    id: 'EV_PA1_005',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Urgency Driver Recency',
    question: 'How recently was the business urgency reaffirmed by customer leadership?',
    positiveSignals: ['Reconfirmed in executive checkpoint within the last 14 days', 'Active weekly steering committee accelerating rollout timetable', 'Executive mandate reasserted during quarterly review'],
    negativeSignals: ['Urgency mentioned 3+ months ago with no subsequent validation', 'Meeting cadences delayed or deprioritized by customer team', 'Executive sponsor reassigned or out of touch'],
    suggestedAnswers: [
      'Reconfirmed within the last 7-14 days during executive steering committee.',
      'Confirmed within the past 30 days during technical review milestone.',
      'Not reaffirmed in over 60 days; engagement has slowed down.',
      'Urgency has visibly cooled; meetings are being repeatedly rescheduled.'
    ]
  },
  'EV_PA1_006': {
    id: 'EV_PA1_006',
    dimension: 'PA1_Customer_Value_and_Urgency',
    name: 'Business ROI Validation',
    question: 'Has the economic buyer or finance team formally validated the projected return on investment (ROI)?',
    positiveSignals: ['Finance/Procurement team vetted and accepted the financial payback model', 'Payback period under 9 months with internal hurdle rate exceeded', 'CFO verbal approval of ROI projections'],
    negativeSignals: ['Finance department rejected seller ROI claims as unrealistic', 'Seller-only spreadsheet with no customer finance involvement', 'Customer requires external audit before accepting ROI'],
    suggestedAnswers: [
      'Finance team and economic buyer validated ROI model showing 4.2x return within 12 months.',
      'Business sponsor accepted ROI calculation; formal finance review scheduled this week.',
      'Seller provided ROI model, but customer finance has not yet reviewed it.',
      'No ROI model presented or customer finance has expressed skepticism.'
    ]
  },

  // PA2 - Buying Center & Influence (6 items)
  'EV_PA2_001': {
    id: 'EV_PA2_001',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Economic Buyer Direct Access & Commitment',
    question: 'Do you have direct access to the ultimate Economic Buyer who controls the budget and possesses final signature authority?',
    positiveSignals: ['Direct 1:1 interaction with Economic Buyer confirmed in last 14 days', 'Economic Buyer explicitly committed budget and sponsor backing', 'Economic Buyer confirmed in mutual close plan'],
    negativeSignals: ['Economic Buyer identity unknown or inaccessible', 'Champion shielding sales team from contacting Economic Buyer', 'Economic Buyer stated they do not support the purchase'],
    suggestedAnswers: [
      'Direct, recurring communication with Economic Buyer (CFO/VP) who has confirmed budget allocation.',
      'Economic Buyer attended solution demonstration and verbally endorsed moving forward.',
      'Economic Buyer identified, but access is currently routed exclusively through champion.',
      'Economic Buyer is unknown or actively avoiding engagement.'
    ]
  },
  'EV_PA2_002': {
    id: 'EV_PA2_002',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Internal Champion Strength & Power',
    question: 'How capable, motivated, and politically influential is your internal Champion?',
    positiveSignals: ['Champion has successfully shepherded 6-figure enterprise deals before', 'Champion provides internal intelligence, organizational charts, and decision memos', 'Champion actively sells on our behalf when we are not in the room'],
    negativeSignals: ['Champion is junior contributor with no organizational authority', 'Champion is passive and expects seller to navigate internal politics', 'Champion has personal agenda misaligned with company goals'],
    suggestedAnswers: [
      'High-power executive Champion with proven track record of securing enterprise budget and approvals.',
      'Strong operational champion with deep credibility and access to the executive decision committee.',
      'Friendly coach / evaluation contact with limited political capital or internal leverage.',
      'No champion identified; reliant on single inbound contact.'
    ]
  },
  'EV_PA2_003': {
    id: 'EV_PA2_003',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Multi-Threaded Stakeholder Coverage',
    question: 'What is the breadth and depth of stakeholder engagement across technical, business, legal, and operational lines?',
    positiveSignals: ['Active relationships across 4+ departments (IT, InfoSec, Finance, Business Ops)', 'Steering committee established with named stakeholders across all functions', 'Consensus achieved between business users and IT leadership'],
    negativeSignals: ['Single-threaded deal with only one contact', 'Unidentified technical or security detractors working against project', 'Total absence of procurement or legal engagement'],
    suggestedAnswers: [
      'Comprehensive multi-threading: active buy-in across IT, InfoSec, Finance, and Business Leadership.',
      'Multi-threaded across Business Sponsor and Lead Technical Architect; InfoSec pending review.',
      'Dual-threaded between project manager and IT lead; other departments not yet engaged.',
      'Single-threaded with one point of contact; high vulnerability to organizational turnover.'
    ]
  },
  'EV_PA2_004': {
    id: 'EV_PA2_004',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Identified Detractors & Neutralization Strategy',
    question: 'Have internal detractors or competing internal factions been identified, and is there an active neutralization strategy?',
    positiveSignals: ['Key detractors identified, their objections documented, and Champion actively neutralizing them', 'Compromise or technical proof provided that satisfied skeptical stakeholders', 'Executive sponsor overruled legacy faction objections'],
    negativeSignals: ['Strong hidden detractor lobbying for incumbent solution', 'No awareness of internal opposition', 'Unaddressed security or compliance objections blocking consensus'],
    suggestedAnswers: [
      'All detractors identified; specific proof points provided and Champion has neutralized objections.',
      'Potential detractor in infrastructure team identified; mitigation workshop scheduled.',
      'Suspected preference for incumbent, but detractor identities have not been clarified.',
      'Active detractors in leadership opposing the project; no neutralization plan in place.'
    ]
  },
  'EV_PA2_005': {
    id: 'EV_PA2_005',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Information Security & Compliance Alignment',
    question: 'What is the status of Information Security (InfoSec), Privacy, and Compliance evaluations?',
    positiveSignals: ['Full security questionnaire approved without material exceptions', 'SOC2 / ISO27001 / GDPR compliance validated and signed off by CISO', 'Security team marked solution as cleared for enterprise deployment'],
    negativeSignals: ['Severe compliance blocker on data residency or cloud architecture', 'Security questionnaire pending with no responses for over 30 days', 'CISO vetoed proposed architecture'],
    suggestedAnswers: [
      'Security assessment completed and formally approved by InfoSec / CISO team.',
      'Security review submitted and in progress; initial feedback indicates no major blockers.',
      'Security questionnaire received but not yet submitted for formal review.',
      'Significant InfoSec / compliance concerns raised that threaten deal viability.'
    ]
  },
  'EV_PA2_006': {
    id: 'EV_PA2_006',
    dimension: 'PA2_Buying_Center_and_Influence',
    name: 'Legal & Procurement Team Buy-In',
    question: 'Has procurement or legal established terms, redlines, and purchasing framework expectations?',
    positiveSignals: ['Master Services Agreement (MSA) redlines exchanged with agreed timetable', 'Procurement lead assigned and collaborating on mutually agreed commercial milestones', 'Standard vendor paperwork completed and approved'],
    negativeSignals: ['Procurement has never heard of project and insists on starting 6-month RFP', 'Legal terms completely gridlocked on unlimited liability / indemnity', 'No procurement engagement initiated'],
    suggestedAnswers: [
      'Procurement lead assigned; MSA and DPA terms actively being finalized with legal.',
      'Standard terms shared with procurement; awaiting initial redlines with expected completion in 2 weeks.',
      'Procurement notified of upcoming project, but formal review has not begun.',
      'Procurement unengaged; customer states procurement cycle typically adds 3+ months.'
    ]
  },

  // PA3 - Buying Process & Decision Control (6 items)
  'EV_PA3_001': {
    id: 'EV_PA3_001',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Documented Decision Criteria Influence',
    question: 'To what degree have the customer\'s formal Decision Criteria been shaped or influenced by your unique strengths?',
    positiveSignals: ['Customer\'s formal RFP / evaluation scorecard includes our unique differentiators', 'Criteria emphasize capabilities where our solution holds undisputed advantage', 'Customer acknowledges our approach as the benchmark standard'],
    negativeSignals: ['Decision criteria written by or favor a specific competitor', 'Criteria strictly limited to commodity features with lowest price as sole determinant', 'Decision criteria unknown or constantly shifting'],
    suggestedAnswers: [
      'Decision criteria formally co-authored with champion, embedding 3 of our proprietary advantages.',
      'Decision criteria align well with our core platform capabilities and architectural strengths.',
      'Generic feature criteria used by customer; differentiation is moderate.',
      'Decision criteria favor competitor\'s legacy footprint or lowest-price bid.'
    ]
  },
  'EV_PA3_002': {
    id: 'EV_PA3_002',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Verified Formal Approval Workflow',
    question: 'Is the complete end-to-end buying and approval workflow documented with required signature gates and committee dates?',
    positiveSignals: ['Written step-by-step roadmap from technical clearance to board approval', 'Named approvers identified for each stage with specific calendar review dates', 'Customer confirmed the exact committee meeting where purchase will be authorized'],
    negativeSignals: ['Customer team unclear on what steps are needed to sign a contract', 'Surprise approval stages discovered late in the cycle', 'No calendar milestones established'],
    suggestedAnswers: [
      'Complete approval roadmap documented: Technical signoff -> InfoSec -> Procurement -> Board approval on specific date.',
      'Core approval steps identified; waiting on confirmation of final executive committee schedule.',
      'High-level process outlined by champion, but formal governance milestones remain unconfirmed.',
      'Approval process unknown; customer team has never purchased software of this scale before.'
    ]
  },
  'EV_PA3_003': {
    id: 'EV_PA3_003',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Joint Mutual Close Plan Execution',
    question: 'Is there an active Mutual Close Plan (MCP) shared with and co-owned by the customer champion?',
    positiveSignals: ['Mutual Close Plan agreed in writing with shared customer-seller milestones', 'Customer actively hits scheduled dates and updates the action plan', 'Executive sponsor reviewed and validated the target signature date'],
    negativeSignals: ['Seller-created schedule that customer has never seen or agreed to', 'Customer consistently misses target milestones without explanation', 'Customer refuses to commit to a mutual closing timeline'],
    suggestedAnswers: [
      'Active Mutual Close Plan co-signed by Champion; both teams tracking ahead of milestone dates.',
      'Mutual Close Plan drafted and reviewed with customer team; minor milestone adjustments made.',
      'Internal close plan created by sales rep, but not yet formally validated with customer.',
      'No mutual close plan exists; closing timeline is purely speculative.'
    ]
  },
  'EV_PA3_004': {
    id: 'EV_PA3_004',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Procurement Governance & Sole-Source Viability',
    question: 'What procurement governance rules apply (e.g., competitive bidding, RFP requirement, or sole-source justification)?',
    positiveSignals: ['Sole-source justification approved by procurement based on proprietary innovation', 'RFP waiver granted by executive leadership', 'Preferred vendor status granted under existing master agreement'],
    negativeSignals: ['Mandatory competitive RFP required by procurement policy with 3+ mandatory bidders', 'Threshold rules require public tender or procurement board auction', 'Procurement freezes vendor additions'],
    suggestedAnswers: [
      'Sole-source justification approved by procurement; RFP waiver granted by CIO.',
      'Vendor selection approved by business; procurement proceeding via direct commercial negotiation.',
      'Competitive evaluation underway with 2 vendors; RFP waiver requested but pending.',
      'Mandatory formal RFP required by policy; strict bidding process will add 60-90 days.'
    ]
  },
  'EV_PA3_005': {
    id: 'EV_PA3_005',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Decision Committee Cadence & Quorum',
    question: 'When does the governing decision committee convene, and is our opportunity formally on the agenda?',
    positiveSignals: ['Opportunity formally confirmed on agenda for upcoming scheduled board/committee session', 'Quorum guaranteed with Economic Buyer in attendance', 'Pre-meeting alignment completed with committee members'],
    negativeSignals: ['Committee meets quarterly and deadline was missed', 'Opportunity not placed on agenda', 'Committee canceled or reconstituted due to corporate re-org'],
    suggestedAnswers: [
      'Confirmed on agenda for upcoming executive committee meeting; champion is presenting business case.',
      'Agenda slot requested for upcoming cycle; champion confident of approval.',
      'Committee meets monthly, but opportunity is not yet placed on formal docket.',
      'Committee schedule uncertain or leadership re-organization has suspended review meetings.'
    ]
  },
  'EV_PA3_006': {
    id: 'EV_PA3_006',
    dimension: 'PA3_Buying_Process_and_Decision_Control',
    name: 'Contracting Vehicle & Paper Process',
    question: 'Is the contract executing on vendor paper, customer standard paper, or a pre-negotiated marketplace/channel vehicle?',
    positiveSignals: ['Executing on vendor standard terms or pre-approved cloud marketplace (AWS/Azure/GCP)', 'Pre-negotiated Master Agreement already in place', 'Customer legal agreed to 10-day turnaround on mutual terms'],
    negativeSignals: ['Customer insists on draconian custom paper with 60-day redline cycles', 'Total disagreement on governing law, SLA credits, or data ownership', 'Paper process stalled indefinitely'],
    suggestedAnswers: [
      'Executing via Cloud Marketplace (AWS/GCP/Azure) with pre-allocated enterprise commit funds.',
      'Executing on vendor paper with standard enterprise terms; customer legal in active review.',
      'Customer paper required; legal redlines expected to take 3-4 weeks.',
      'Complex custom paper with contentious negotiations regarding liability and indemnity.'
    ]
  },

  // PA4 - Solution & Value Proposition (6 items)
  'EV_PA4_001': {
    id: 'EV_PA4_001',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Technical Fit & Architecture Validation',
    question: 'Has the customer\'s technical architecture team verified the technical compatibility and architecture fit of your solution?',
    positiveSignals: ['Architectural review board granted formal approval', 'Solution integrates seamlessly with existing enterprise tech stack', 'Zero technical debt or architectural friction identified'],
    negativeSignals: ['Solution incompatible with core legacy system or security standards', 'Technical team rejected cloud hosting or integration approach', 'Major architectural rework required to function'],
    suggestedAnswers: [
      'Enterprise Architecture Board formally approved solution architecture and cloud deployment model.',
      'Technical team validated API integrations and data flow; architecture cleared for production.',
      'Technical evaluation in progress; preliminary testing is positive with minor edge cases.',
      'Material architectural incompatibilities identified that require custom engineering.'
    ]
  },
  'EV_PA4_002': {
    id: 'EV_PA4_002',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Proof of Concept (POC) / Pilot Sign-Off',
    question: 'What is the status of the Proof of Concept (POC) or technical pilot evaluation?',
    positiveSignals: ['POC completed with 100% of defined success criteria exceeded and signed off', 'Customer requested early production rollout ahead of pilot conclusion', 'Zero critical defects during evaluation period'],
    negativeSignals: ['POC failed to meet mandatory performance benchmarks', 'Customer abandoned pilot due to implementation complexity', 'POC extended repeatedly without definitive outcome'],
    suggestedAnswers: [
      'POC completed successfully: 100% of technical success benchmarks met and signed off by lead architect.',
      'Pilot underway with 80%+ test cases passing; on track for formal completion within 10 days.',
      'POC planned or waived based on reference customer validation and interactive demo.',
      'POC experiencing performance issues or customer engagement during pilot is waning.'
    ]
  },
  'EV_PA4_003': {
    id: 'EV_PA4_003',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Deployment & Implementation Feasibility',
    question: 'Is the deployment methodology, timeline, and professional services scope agreed and resource-budgeted?',
    positiveSignals: ['Implementation plan with detailed milestones agreed by customer PMO', 'Customer dedicated internal technical project manager and implementation squad', 'Standardized rapid deployment model with low onboarding friction'],
    negativeSignals: ['Customer lacks internal technical resources to implement', 'Unrealistic deployment timeline demanded by customer with no implementation budget', 'Implementation risks unmitigated'],
    suggestedAnswers: [
      'Statement of Work (SOW) finalized with dedicated customer implementation team assigned.',
      'Implementation roadmap defined; resource allocation approved by customer engineering manager.',
      'High-level rollout timeline discussed; formal SOW scoping scheduled for this week.',
      'Implementation resource constraints at customer may delay onboarding by several months.'
    ]
  },
  'EV_PA4_004': {
    id: 'EV_PA4_004',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Customization vs. Standard Out-of-the-Box Fit',
    question: 'Does the customer\'s requirement set require bespoke custom development, or is it fulfilled out-of-the-box (OOTB)?',
    positiveSignals: ['95%+ requirement fit out-of-the-box with standard configuration', 'Customer accepts standard product roadmap for minor future enhancements', 'No custom code or bespoke engineering commitments required'],
    negativeSignals: ['Deal requires heavy custom development that violates product roadmap', 'Customer demands custom IP ownership or bespoke SLA terms', 'Core requirements cannot be satisfied without significant R&D intervention'],
    suggestedAnswers: [
      '100% out-of-the-box functionality with no custom development required.',
      '90%+ OOTB fit; remaining 10% addressed via standard workflow configurations and webhook automations.',
      'Minor custom integration script required, scoped within standard onboarding services.',
      'Customer requires significant custom features that conflict with standard product roadmap.'
    ]
  },
  'EV_PA4_005': {
    id: 'EV_PA4_005',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Customer Reference & Case Study Validation',
    question: 'Has the customer spoken with comparable peer customer references in their specific industry vertical?',
    positiveSignals: ['Customer reference call completed with glowing feedback from Fortune 500 peer', 'Customer executive spoke directly to existing customer CIO and confirmed business impact', 'Reference validated production stability and vendor partnership excellence'],
    negativeSignals: ['Customer requested references and none could be provided in their industry', 'Reference call went poorly with existing customer highlighting product shortcomings', 'Customer insists on local in-country references that do not exist'],
    suggestedAnswers: [
      'Customer completed peer reference call with direct industry counterpart; feedback was exceptionally positive.',
      'Two relevant enterprise case studies shared and validated by customer project team.',
      'Customer requested reference call; coordinating with reference customer this week.',
      'No reference call completed; customer expressed concern regarding domain track record.'
    ]
  },
  'EV_PA4_006': {
    id: 'EV_PA4_006',
    dimension: 'PA4_Solution_and_Value_Proposition',
    name: 'Data Security & Integration API Maturity',
    question: 'Are the customer\'s data pipeline, integration endpoints, and API security requirements fully validated?',
    positiveSignals: ['APIs stress-tested in sandbox environment with zero rate-limit or throughput issues', 'Data encryption in transit and at rest verified against customer security policy', 'Pre-built connector verified with customer CRM / ERP'],
    negativeSignals: ['Customer relies on unsupported legacy database with no API endpoints', 'Data privacy regulations prevent customer from transmitting data to cloud', 'Integration requires unsupported protocols'],
    suggestedAnswers: [
      'Data flow and API endpoints fully validated in customer staging environment.',
      'Standard REST / GraphQL APIs satisfy customer data architecture requirements.',
      'Integration architecture reviewed; sandbox testing in progress.',
      'Customer proprietary database requires specialized ETL connector that is not currently supported.'
    ]
  },

  // PA5 - Competitive Position (6 items)
  'EV_PA5_001': {
    id: 'EV_PA5_001',
    dimension: 'PA5_Competitive_Position',
    name: 'Incumbent Relationship & Replacement Dynamics',
    question: 'Is an incumbent solution currently in place, and what is the customer\'s relationship and switching sentiment toward them?',
    positiveSignals: ['Customer actively terminating incumbent due to severe dissatisfaction and price hikes', 'Incumbent vendor executive relationship severed', 'Customer mandate to replace legacy tool before renewal'],
    negativeSignals: ['Incumbent has deep executive relationships with CEO/Board', 'Incumbent offering free license renewal or bundled discounting to lock customer in', 'Switching costs considered prohibitive by IT leadership'],
    suggestedAnswers: [
      'Incumbent contract terminating; customer leadership has mandated complete replacement due to legacy limitations.',
      'Incumbent in place but customer is actively piloting our solution to replace primary workflows.',
      'Incumbent exists with moderate satisfaction; customer exploring alternatives to benchmark costs.',
      'Incumbent is deeply embedded with high switching costs and strong executive relationships.'
    ]
  },
  'EV_PA5_002': {
    id: 'EV_PA5_002',
    dimension: 'PA5_Competitive_Position',
    name: 'Head-to-Head Competitor Differentiation',
    question: 'Who are the primary competitors being evaluated, and what is your verified differentiation advantage?',
    positiveSignals: ['Customer explicitly stated our solution is ranked #1 technically and strategically', 'Clear differentiation demonstrated on core capabilities competitors cannot match', 'Competitor disqualified during initial evaluation phase'],
    negativeSignals: ['Competitor perceived as equivalent at a 40% lower price point', 'Customer team leaning toward competitor with broader platform suite', 'Sales team unable to articulate defensible differentiation'],
    suggestedAnswers: [
      'Customer confirmed our solution is ranked #1 overall; competitor disqualified on security and AI capabilities.',
      'Evaluated against primary rival; customer recognizes our clear architectural and user-experience superiority.',
      'Customer evaluating 2 competitors; technical features perceived as comparable, decision will come down to price.',
      'Competitor has strong momentum and is heavily favored by customer\'s procurement team.'
    ]
  },
  'EV_PA5_003': {
    id: 'EV_PA5_003',
    dimension: 'PA5_Competitive_Position',
    name: 'Build vs. Buy Assessment',
    question: 'Is internal development ("Build it ourselves") being considered as a viable alternative to buying our solution?',
    positiveSignals: ['Internal build formally evaluated and rejected due to cost and engineering backlog', 'Customer leadership established policy to buy best-of-breed software rather than build', 'Internal team explicitly requested commercial solution'],
    negativeSignals: ['Engineering department actively lobbying to build an internal in-house tool', 'Customer allocating developer sprint resources to prototype alternative', 'Executive bias against third-party SaaS vendors'],
    suggestedAnswers: [
      'Internal build evaluated and formally rejected; customer engineering team endorsed buying our platform.',
      'Build vs buy reviewed; leadership determined building in-house would delay launch by 18+ months.',
      'Minor internal tooling discussion; champion confident commercial purchase will proceed.',
      'Internal engineering team pushing aggressively to build in-house; poses active risk to deal.'
    ]
  },
  'EV_PA5_004': {
    id: 'EV_PA5_004',
    dimension: 'PA5_Competitive_Position',
    name: 'Pricing & TCO Advantage',
    question: 'How does your Total Cost of Ownership (TCO) and pricing model compare to competitors and customer budget expectations?',
    positiveSignals: ['TCO analysis proves our solution delivers 40%+ savings compared to competitor suite', 'Transparent, predictable pricing model praised by procurement', 'Value-based pricing matches customer revenue expansion'],
    negativeSignals: ['Competitor launching aggressive predatory discounting to buy market share', 'Customer perceived our licensing model as complex or penalizing growth', 'Total pricing exceeds competitor proposals by substantial margin'],
    suggestedAnswers: [
      'TCO analysis demonstrates superior ROI and 35% lower 3-year total operating costs than competitors.',
      'Pricing model aligned with customer budget expectations and validated by procurement.',
      'Pricing is competitive with rivals, but customer requested additional volume tier discounting.',
      'Competitor is offering drastic discounts (-50%) creating significant price pressure.'
    ]
  },
  'EV_PA5_005': {
    id: 'EV_PA5_005',
    dimension: 'PA5_Competitive_Position',
    name: 'Brand Reputation & Market Leadership',
    question: 'How is your brand perceived by customer stakeholders relative to established enterprise incumbents?',
    positiveSignals: ['Recognized as the premier category innovator and modern industry benchmark', 'Customer executives specifically sought out our brand based on industry acclaim', 'Analyst reports (Gartner/Forrester) validate top-tier placement'],
    negativeSignals: ['Customer perceives brand as unproven startup with balance sheet risk', 'Incumbent using FUD (fear, uncertainty, doubt) regarding our viability', 'Lack of brand awareness among customer senior leadership'],
    suggestedAnswers: [
      'Recognized by customer leadership as the leading innovation standard in the industry.',
      'Brand perception is strong; positive industry reputation cited by champion.',
      'Brand awareness is moderate; customer required SOC2 and financial stability assurances.',
      'Customer expressed concern regarding company maturity compared to legacy enterprise giants.'
    ]
  },
  'EV_PA5_006': {
    id: 'EV_PA5_006',
    dimension: 'PA5_Competitive_Position',
    name: 'Partner & Channel Ecosystem Leverage',
    question: 'Is a strategic ecosystem partner, system integrator (SI), or channel reseller actively supporting our position?',
    positiveSignals: ['Tier-1 Global System Integrator (GSI) co-selling and implementing our platform', 'Cloud hyperscaler (AWS/Azure/GCP) actively advocating our solution to customer CIO', 'Certified implementation partner verified customer readiness'],
    negativeSignals: ['Key SI partner advising customer to select rival solution', 'Channel conflict creating friction with customer procurement', 'No partner ecosystem support'],
    suggestedAnswers: [
      'Leading Global System Integrator is co-selling and committed to delivering implementation services.',
      'Cloud partner account executive actively supporting our positioning with customer leadership.',
      'Direct sales engagement; partner ecosystem not actively engaged.',
      'Customer consulting partner favors competing legacy platform.'
    ]
  },

  // PA6 - Commercial & Deal Structure (6 items)
  'EV_PA6_001': {
    id: 'EV_PA6_001',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Approved Budget Allocation',
    question: 'Is the necessary budget formally allocated and approved for this specific purchase in the current budget cycle?',
    positiveSignals: ['Budget formally reserved in current fiscal quarter with cost center identified', 'Capital expenditure / operating expense approved by CFO', 'Funds reallocated from underutilized IT line items to prioritize this project'],
    negativeSignals: ['No budget allocated; requires discretionary budget battle or future fiscal year request', 'Customer states purchase depends on hitting external quarterly sales targets', 'Company-wide spending freeze in effect'],
    suggestedAnswers: [
      'Budget formally allocated and ring-fenced in current quarter budget; cost center code provided.',
      'Budget identified and endorsed by business unit head; final CFO sign-off scheduled.',
      'Budget exists in general IT transformation fund, but specific deal allocation is pending final quotes.',
      'No budget currently allocated; customer would need to request special off-cycle capital authorization.'
    ]
  },
  'EV_PA6_002': {
    id: 'EV_PA6_002',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Commercial Proposal & Pricing Agreement',
    question: 'Has a formal commercial proposal been delivered, and has the pricing structure been agreed in principle?',
    positiveSignals: ['Commercial term sheet signed or approved in writing by business and procurement', 'Pricing, user tiers, and discount structure accepted without further demands', 'Proposal accepted as presented with standard multi-year commitment'],
    negativeSignals: ['Customer rejected pricing proposal outright as 2x over budget', 'Pricing structure misunderstood by customer team, requiring complete re-scoping', 'No formal commercial proposal presented'],
    suggestedAnswers: [
      'Formal proposal delivered and accepted in principle; commercial terms agreed by all parties.',
      'Commercial proposal delivered; customer requested minor adjustments to payment schedule.',
      'Informal pricing options discussed; formal commercial proposal scheduled for presentation.',
      'Pricing proposal delivered but customer experienced sticker shock; significant gap remains.'
    ]
  },
  'EV_PA6_003': {
    id: 'EV_PA6_003',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Multi-Year Contract Commitment Viability',
    question: 'What contract duration is contemplated, and is there executive commitment to a multi-year partnership?',
    positiveSignals: ['3-year enterprise agreement agreed with annual upfront payment terms', 'Multi-year commitment provides strategic price discount approved by finance', 'Customer prefers multi-year contract to lock in pricing and support'],
    negativeSignals: ['Customer insists on month-to-month pilot with right to terminate at will', 'Customer refuses multi-year terms due to corporate uncertainty', 'Heavy cancellation penalties demanded by customer'],
    suggestedAnswers: [
      '3-year enterprise contract agreed with annual upfront billing and standard renewal terms.',
      '2-year agreement agreed in principle; customer legal reviewing standard multi-year provisions.',
      '1-year standard annual agreement proposed; customer receptive to multi-year option.',
      'Customer insisting on short-term 3-month proof pilot before committing to annual contract.'
    ]
  },
  'EV_PA6_004': {
    id: 'EV_PA6_004',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Payment Terms & Billing Cadence Acceptance',
    question: 'Are standard payment terms (e.g., Net 30, Annual Upfront) accepted by customer finance and treasury?',
    positiveSignals: ['Annual upfront Net 30 payment terms accepted without dispute', 'Electronic automated billing / ACH established', 'No onerous payment milestones or retention holdbacks'],
    negativeSignals: ['Customer demands Net 120 or payment contingent on arbitrary operational milestones', 'Customer insists on 50% holdback until 6 months post-deployment', 'Treasury demands custom banking escrow agreement'],
    suggestedAnswers: [
      'Standard Net 30 annual upfront billing accepted without dispute by customer finance.',
      'Net 45 payment terms requested by procurement, within acceptable commercial parameters.',
      'Payment terms currently under review with procurement team.',
      'Customer demanding onerous terms (Net 90+ with 30% retention holdback) requiring executive exception.'
    ]
  },
  'EV_PA6_005': {
    id: 'EV_PA6_005',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Discounting & Margin Integrity',
    question: 'Does the deal preserve healthy profit margins, or has excessive discounting eroded deal value?',
    positiveSignals: ['Deal closed at or near list price with under 10% standard volume discount', 'Healthy gross margins (>80%) preserved across subscription and services', 'Customer perceives high value and does not negotiate strictly on price'],
    negativeSignals: ['Steep unapproved discounting (>40%) demanded to compete with low-cost clone', 'Services given away for free, creating unprofitable implementation burden', 'Customer treats software as commodity'],
    suggestedAnswers: [
      'High margin integrity preserved: deal structured at standard enterprise pricing with under 10% discount.',
      'Standard volume tier discount applied in exchange for multi-year commitment.',
      'Procurement requested additional 15% discount; concession strategy prepared with executive approval.',
      'Severe margin erosion: customer demanding 45%+ discount threatening project profitability.'
    ]
  },
  'EV_PA6_006': {
    id: 'EV_PA6_006',
    dimension: 'PA6_Commercial_and_Deal_Structure',
    name: 'Expansion & Land-and-Expand Opportunity',
    question: 'What is the quantified expansion potential across other business units, seats, or product modules?',
    positiveSignals: ['Clear land-and-expand trajectory with 5x expansion potential within 18 months', 'Initial contract covers 1 division with corporate agreement for enterprise-wide rollout', 'Customer roadmap outlines additional product module adoption in Phase 2'],
    negativeSignals: ['One-off isolated purchase with zero cross-sell or expansion capability', 'Customer market is shrinking with anticipated future downsizing', 'No expansion pathway identified'],
    suggestedAnswers: [
      'Exceptional expansion potential: initial land of $150K with clear $750K+ expansion path across 4 sister divisions.',
      'Strong expansion roadmap: Phase 1 covers 250 seats with planned expansion to 1,200 seats next year.',
      'Moderate expansion possible once initial user adoption metrics are proven.',
      'Single-use purchase with minimal expansion potential.'
    ]
  },

  // PA7 - Sales Execution & Deal Readiness (6 items)
  'EV_PA7_001': {
    id: 'EV_PA7_001',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Deal Team Execution Discipline & Cadence',
    question: 'How disciplined and consistent has the internal sales and solutions engineering execution been?',
    positiveSignals: ['Every customer action item delivered ahead of schedule with flawless professionalism', 'Close collaboration between Account Executive, Solutions Engineer, and Executive Sponsor', 'CRM and documentation updated in real-time with comprehensive meeting notes'],
    negativeSignals: ['Missed customer deadlines or disorganized presentations', 'Internal confusion regarding deal ownership and technical architecture responses', 'Poor responsiveness to customer inquiries'],
    suggestedAnswers: [
      'Flawless execution discipline: every customer milestone delivered on time with executive polish.',
      'High execution rigor: collaborative deal team aligned on weekly strategy and customer deliverables.',
      'Standard sales execution; minor delays in delivering technical documentation.',
      'Inconsistent execution: missed customer follow-ups and uncoordinated internal communication.'
    ]
  },
  'EV_PA7_002': {
    id: 'EV_PA7_002',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Executive Sponsorship & Peer-to-Peer Alignment',
    question: 'Is there active peer-to-peer executive alignment between vendor leadership and customer C-suite?',
    positiveSignals: ['Vendor CEO/CRO conducted 1:1 briefing with customer CEO/CIO with great rapport', 'Executive sponsor actively engaged in clearing late-stage commercial roadblocks', 'Formal quarterly executive business review cadence agreed'],
    negativeSignals: ['Customer refuses executive engagement', 'Vendor executives disconnected from the opportunity', 'Executive meeting resulted in strained communication'],
    suggestedAnswers: [
      'Active executive peer alignment: vendor CRO conducted strategic briefing with customer CIO with high alignment.',
      'Executive touchpoint completed; vendor VP available on standby for final commercial sign-off.',
      'Executive alignment planned for final closing phase but not yet executed.',
      'No executive sponsorship established; deal managed strictly at account manager level.'
    ]
  },
  'EV_PA7_003': {
    id: 'EV_PA7_003',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Solutions Engineering Resource Availability',
    question: 'Are specialized technical resources, solutions architects, and delivery consultants available to support closing?',
    positiveSignals: ['Dedicated Solutions Architect assigned and embedded throughout customer evaluation', 'Customer engineering team expresses complete confidence in technical bench', 'Delivery team validated technical feasibility and customer readiness'],
    negativeSignals: ['Key technical architect reassigned, leaving deal technical questions unanswered', 'Internal delivery constraints mean solution cannot be deployed for 6 months', 'Technical team warns deal scope is unsupportable'],
    suggestedAnswers: [
      'Dedicated Senior Solutions Architect assigned with comprehensive delivery capacity secured.',
      'Solutions engineering support actively assisting evaluation milestones.',
      'Technical resources available on shared queue; slight delay in scheduling custom demos.',
      'Technical resource bottlenecks causing delays in resolving customer architectural questions.'
    ]
  },
  'EV_PA7_004': {
    id: 'EV_PA7_004',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Customer Success & Onboarding Transition Plan',
    question: 'Is there a seamless transition plan from sales execution to customer success and implementation?',
    positiveSignals: ['Customer Success Manager (CSM) introduced to customer team prior to signature', 'Pre-onboarding kickoff call scheduled and agenda agreed with customer lead', '30-60-90 day customer success onboarding plan reviewed and accepted'],
    negativeSignals: ['No customer success transition plan prepared', 'Customer expresses anxiety regarding vendor post-sales support', 'Severe disconnect between sales commitments and delivery reality'],
    suggestedAnswers: [
      'Customer Success Lead introduced to customer champion; 30-60-90 day onboarding plan agreed.',
      'Onboarding transition framework prepared and ready for handover upon contract signature.',
      'Customer success team briefed on opportunity; formal introduction scheduled post-signature.',
      'No customer success transition plan established; customer raised concerns regarding onboarding.'
    ]
  },
  'EV_PA7_005': {
    id: 'EV_PA7_005',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Legal & Deal Desk Support Velocity',
    question: 'How rapidly is the vendor Deal Desk and Legal team responding to contract redlines and pricing exceptions?',
    positiveSignals: ['Deal Desk approved commercial exceptions within 24 hours', 'Legal turnaround on customer redlines consistently under 48 hours', 'Proactive contract counsel assisting sales team directly on customer calls'],
    negativeSignals: ['Legal turnaround taking 2+ weeks, causing deal momentum to stall', 'Internal deal desk rejected necessary commercial concessions', 'Legal department understaffed during quarter-end rush'],
    suggestedAnswers: [
      'Deal desk and legal turnaround exceptionally fast (<24 hours on redlines and approvals).',
      'Legal support responsive and aligned on standard negotiation concessions.',
      'Standard legal review timeline (3-5 business days); on track with deal schedule.',
      'Internal legal / deal desk delays creating friction and frustrating customer procurement.'
    ]
  },
  'EV_PA7_006': {
    id: 'EV_PA7_006',
    dimension: 'PA7_Sales_Execution_and_Deal_Readiness',
    name: 'Deal Intelligence Provenance & Data Freshness',
    question: 'How fresh, verified, and complete is the underlying opportunity data across all assessment dimensions?',
    positiveSignals: ['All deal intelligence verified within the past 7 days across direct customer touchpoints', 'Zero unverified sales rep assumptions; all facts backed by customer confirmation', 'Audit trail of customer correspondence confirms every milestone'],
    negativeSignals: ['Opportunity data stale with no customer contact in over 45 days', 'Assessment based heavily on unconfirmed rep optimism rather than customer evidence', 'Contradictory notes in CRM'],
    suggestedAnswers: [
      'Intelligence is pristine: 100% customer-verified data updated within the past 5 business days.',
      'Data freshness is high; all core dimensions validated through recent customer interactions.',
      'Most data points verified, with a few secondary assumptions pending final customer confirmation.',
      'Data is stale or based primarily on rep optimism with little recent direct customer validation.'
    ]
  },

  // PA8 - Deal Momentum, Risk & Closeability (6 items)
  'EV_PA8_001': {
    id: 'EV_PA8_001',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'Engagement Velocity & Meeting Frequency',
    question: 'What is the velocity and consistency of customer interactions over the past 30 days?',
    positiveSignals: ['High engagement velocity: multiple weekly collaborative sessions with customer team', 'Customer initiates touchpoints and rapidly responds to communication within hours', 'Steady acceleration of meeting frequency toward close date'],
    negativeSignals: ['Customer ghosting emails and canceling scheduled check-ins', 'Meeting cadence dropped from weekly to monthly without explanation', 'Average response time exceeds 7 business days'],
    suggestedAnswers: [
      'High velocity: multiple weekly collaborative working sessions; customer responds within hours.',
      'Consistent weekly cadence maintained; customer team actively engaged and responsive.',
      'Moderate engagement velocity; meetings occur bi-weekly with standard response times.',
      'Velocity has dropped noticeably; customer rescheduling meetings and slow to reply.'
    ]
  },
  'EV_PA8_002': {
    id: 'EV_PA8_002',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'Close Date Credibility & Slip History',
    question: 'How many times has the target close date slipped, and how credible is the current forecasted close date?',
    positiveSignals: ['Target close date has never slipped and is anchored to customer compelling event', 'Customer champion explicitly committed to signature on or before target date', 'All required lead-time milestones accounted for in calendar'],
    negativeSignals: ['Close date has slipped 3+ consecutive quarters with no new catalyst', 'Close date pushed arbitrarily to end of month by sales rep', 'Customer states they have no specific deadline to finish'],
    suggestedAnswers: [
      'Close date has never slipped; anchored directly to customer\'s immutable business event.',
      'Close date adjusted once previously by 2 weeks; current forecast is realistic and achievable.',
      'Close date has slipped once due to procurement delays; champion confident in new date.',
      'Chronic slip history (slipped multiple times); high risk of further postponement.'
    ]
  },
  'EV_PA8_003': {
    id: 'EV_PA8_003',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'Critical Gate Blocker Check',
    question: 'Are there any unresolved critical blockers (legal, technical, executive, financial, or political) threatening the deal?',
    positiveSignals: ['Zero critical blockers identified across all dimensions', 'All previous risk triggers successfully resolved and validated', 'Clear runway to signature with full organizational backing'],
    negativeSignals: ['Material blocker on security certification, data privacy, or executive veto', 'Unresolved budget cut or restructuring announced at customer', 'Active litigation or merger distracting customer leadership'],
    suggestedAnswers: [
      'Zero critical blockers: all technical, legal, executive, and financial gates cleared.',
      'One minor administrative blocker remaining (standard vendor portal registration) in progress.',
      'Commercial negotiation blocker regarding indemnity cap requiring compromise.',
      'Severe blocker identified (e.g., unexpected executive veto, hiring freeze, or security failure).'
    ]
  },
  'EV_PA8_004': {
    id: 'EV_PA8_004',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'Customer Responsiveness to Critical Requests',
    question: 'How promptly does the customer respond when critical legal, commercial, or technical requests are submitted?',
    positiveSignals: ['Customer returns signed paperwork, NDA, or redlines within 24-48 hours', 'Customer project team works overtime to help hit mutual target date', 'Champion proactively removes internal friction'],
    negativeSignals: ['Customer takes 3+ weeks to sign standard nondisclosure or evaluation agreement', 'Requests for documentation ignored repeatedly', 'Customer team shows apathy toward schedule'],
    suggestedAnswers: [
      'Exceptionally prompt: customer returns requested documentation and redlines within 24-48 hours.',
      'Responsive: customer answers questions and delivers inputs within reasonable business timeframes.',
      'Moderate responsiveness: occasional follow-ups required to obtain customer feedback.',
      'Unresponsive: requests sit unanswered for weeks requiring escalation.'
    ]
  },
  'EV_PA8_005': {
    id: 'EV_PA8_005',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'External Macro & Market Headwind Exposure',
    question: 'Is the customer organization exposed to macroeconomic, industry-specific, or regulatory headwinds?',
    positiveSignals: ['Customer operates in thriving, well-funded sector with strong revenue expansion', 'Customer business is counter-cyclical and benefits from our efficiency solution', 'Zero external market threats to project funding'],
    negativeSignals: ['Customer undergoing mass layoffs, executive restructuring, or cost-cutting freeze', 'Industry facing severe regulatory headwinds halting all capital expenditures', 'Customer credit risk or bankruptcy concern'],
    suggestedAnswers: [
      'Zero macro headwinds: customer business growing rapidly with high investment in modernization.',
      'Customer industry is stable; project funding is protected from general market fluctuations.',
      'Customer experiencing moderate budget scrutiny, but efficiency ROI justifies continuation.',
      'Severe macro headwinds or corporate restructuring threatening company-wide discretionary spending.'
    ]
  },
  'EV_PA8_006': {
    id: 'EV_PA8_006',
    dimension: 'PA8_Deal_Momentum_Risk_and_Closeability',
    name: 'Final Signature Milestone Realism',
    question: 'Has the physical / electronic signing process (DocuSign, signatory availability, board calendar) been verified?',
    positiveSignals: ['Signatory confirmed in office with DocuSign authority on target date', 'Legal and procurement approved final execution draft ready for signature', 'Pre-signature checks complete with zero pending revisions'],
    negativeSignals: ['Signatory scheduled to be on extended international vacation on target date', 'Customer signature process requires physical mail routing through overseas legal team', 'No one knows who physically signs the agreement'],
    suggestedAnswers: [
      'Final signature process verified: named signatory in office, DocuSign routing prepared and validated.',
      'Signatory identified; executive assistant confirmed availability for signature on target date.',
      'Signatory role known; coordinating with champion to schedule formal signing ceremony.',
      'Signature logistics unverified; signatory availability on target close date is unknown.'
    ]
  }
};

// =========================================================================
// ACTIVE 16 SWOT FACTORS RESOLVER
// =========================================================================

export function resolveActive16SWOTFactors(revenueMotion: string, industry: string) {
  // 1. Universal Baseline (8 factors: 2 S, 2 W, 2 O, 2 T)
  const universalFactors = [
    {
      id: 'SWOT_UNI_S01',
      name: 'Proven Value Proposition & Solution Fit',
      classification: 'Strength',
      layer: 'universal',
      category: 'Product & Solution',
      strategicImpact: 4,
      relevance: 5,
      urgency: 4,
      manageability: 4,
      description: 'The vendor possesses a demonstrated solution with high functional and architecture alignment to customer requirements.'
    },
    {
      id: 'SWOT_UNI_S02',
      name: 'High-Power Champion & Stakeholder Buy-In',
      classification: 'Strength',
      layer: 'universal',
      category: 'Relationship & Political',
      strategicImpact: 5,
      relevance: 5,
      urgency: 5,
      manageability: 4,
      description: 'An influential, politically capable internal champion actively advocates for the purchase and navigates approval gates.'
    },
    {
      id: 'SWOT_UNI_W01',
      name: 'Unconfirmed Economic Buyer Access',
      classification: 'Weakness',
      layer: 'universal',
      category: 'Relationship & Political',
      strategicImpact: 5,
      relevance: 5,
      urgency: 5,
      manageability: 3,
      description: 'Sales team lacks direct, recurring access to the final budget-holding economic authority.'
    },
    {
      id: 'SWOT_UNI_W02',
      name: 'Buying Process & Governance Ambiguity',
      classification: 'Weakness',
      layer: 'universal',
      category: 'Process & Governance',
      strategicImpact: 4,
      relevance: 4,
      urgency: 4,
      manageability: 4,
      description: 'Customer approval workflow, legal milestones, and committee sign-off gates are incompletely mapped.'
    },
    {
      id: 'SWOT_UNI_O01',
      name: 'Executive Digital Transformation Mandate',
      classification: 'Opportunity',
      layer: 'universal',
      category: 'Market & Customer Context',
      strategicImpact: 5,
      relevance: 5,
      urgency: 4,
      manageability: 3,
      description: 'Customer executive leadership has declared an urgent strategic initiative that directly prioritizes this deployment.'
    },
    {
      id: 'SWOT_UNI_O02',
      name: 'Expiring Incumbent Contract / Replacement Window',
      classification: 'Opportunity',
      layer: 'universal',
      category: 'Market & Customer Context',
      strategicImpact: 4,
      relevance: 5,
      urgency: 5,
      manageability: 3,
      description: 'An existing competitor contract renewal creates an immediate, time-sensitive window for replacement.'
    },
    {
      id: 'SWOT_UNI_T01',
      name: 'Incumbent Entrenchment & Predatory Discounting',
      classification: 'Threat',
      layer: 'universal',
      category: 'Competitive Landscape',
      strategicImpact: 5,
      relevance: 5,
      urgency: 5,
      manageability: 2,
      description: 'The incumbent vendor is leveraging multi-year enterprise bundling and aggressive discounting to defend account.'
    },
    {
      id: 'SWOT_UNI_T02',
      name: 'Macro Budget Scrutiny & Project Postponement Risk',
      classification: 'Threat',
      layer: 'universal',
      category: 'Macro & Financial',
      strategicImpact: 4,
      relevance: 4,
      urgency: 4,
      manageability: 2,
      description: 'Corporate capital expenditure scrutiny or spending freezes may delay non-mandatory software commitments.'
    }
  ];

  // 2. Revenue Motion Overrides (4 factors: 1 S, 1 W, 1 O, 1 T)
  const motionFactors = [
    {
      id: `SWOT_RM_${revenueMotion.slice(0, 4)}_S01`,
      name: `${revenueMotion.includes('Enterprise') ? 'Executive Account Orchestration' : 'Product-Led Viral Adoption'}`,
      classification: 'Strength',
      layer: 'revenue_motion',
      category: 'Sales Execution',
      strategicImpact: 4,
      relevance: 5,
      urgency: 4,
      manageability: 5,
      description: `Specific execution excellence aligned to ${revenueMotion} motions.`
    },
    {
      id: `SWOT_RM_${revenueMotion.slice(0, 4)}_W01`,
      name: `${revenueMotion.includes('Enterprise') ? 'Complex Enterprise Procurement Friction' : 'User-to-Enterprise Monetization Gap'}`,
      classification: 'Weakness',
      layer: 'revenue_motion',
      category: 'Commercial Architecture',
      strategicImpact: 4,
      relevance: 4,
      urgency: 4,
      manageability: 3,
      description: `Vulnerabilities inherent in the ${revenueMotion} commercial model.`
    },
    {
      id: `SWOT_RM_${revenueMotion.slice(0, 4)}_O01`,
      name: `${revenueMotion.includes('Enterprise') ? 'Multi-Division Enterprise Expansion' : 'Usage & Consumption Tier Scaling'}`,
      classification: 'Opportunity',
      layer: 'revenue_motion',
      category: 'Revenue Growth',
      strategicImpact: 5,
      relevance: 5,
      urgency: 4,
      manageability: 4,
      description: `Rapid account expansion dynamics available under the ${revenueMotion} model.`
    },
    {
      id: `SWOT_RM_${revenueMotion.slice(0, 4)}_T01`,
      name: `${revenueMotion.includes('Enterprise') ? 'Extended Procurement Redline Stagnation' : 'Self-Serve Churn Risk'}`,
      classification: 'Threat',
      layer: 'revenue_motion',
      category: 'Deal Velocity',
      strategicImpact: 4,
      relevance: 4,
      urgency: 5,
      manageability: 3,
      description: `Execution and external roadblocks specific to ${revenueMotion}.`
    }
  ];

  // 3. Industry Overrides (4 factors: 1 S, 1 W, 1 O, 1 T)
  const industryFactors = [
    {
      id: `SWOT_IND_${industry.slice(4, 10)}_S01`,
      name: `${industry.replace(/_/g, ' ')} Domain Architecture & Compliance Fit`,
      classification: 'Strength',
      layer: 'industry',
      category: 'Domain & Compliance',
      strategicImpact: 5,
      relevance: 5,
      urgency: 4,
      manageability: 4,
      description: `Specialized functional compliance and regulatory fit tailored to ${industry.replace(/_/g, ' ')}.`
    },
    {
      id: `SWOT_IND_${industry.slice(4, 10)}_W01`,
      name: `${industry.replace(/_/g, ' ')} Legacy System Integration Overhead`,
      classification: 'Weakness',
      layer: 'industry',
      category: 'Technical Architecture',
      strategicImpact: 4,
      relevance: 4,
      urgency: 4,
      manageability: 3,
      description: `Complexity of interfacing with specialized legacy workflows in ${industry.replace(/_/g, ' ')}.`
    },
    {
      id: `SWOT_IND_${industry.slice(4, 10)}_O01`,
      name: `${industry.replace(/_/g, ' ')} Regulatory Transformation Opportunity`,
      classification: 'Opportunity',
      layer: 'industry',
      category: 'Industry Dynamics',
      strategicImpact: 5,
      relevance: 5,
      urgency: 5,
      manageability: 3,
      description: `Industry-wide regulatory or operational shifts accelerating modernization investments in ${industry.replace(/_/g, ' ')}.`
    },
    {
      id: `SWOT_IND_${industry.slice(4, 10)}_T01`,
      name: `${industry.replace(/_/g, ' ')} Specialized Security & Audit Gate Risk`,
      classification: 'Threat',
      layer: 'industry',
      category: 'Governance & Compliance',
      strategicImpact: 5,
      relevance: 5,
      urgency: 5,
      manageability: 2,
      description: `Stringent data privacy or industry audit standards that can delay or halt deployment in ${industry.replace(/_/g, ' ')}.`
    }
  ];

  return [...universalFactors, ...motionFactors, ...industryFactors];
}

// =========================================================================
// DETERMINISTIC SCORING ENGINE (PADF, WINABILITY, RISK)
// =========================================================================

export function calculateDeterministicAssessment(
  evidenceRecords: any[],
  inheritanceData: any = {}
) {
  // 1. Group evidence by PADF dimension code
  const evByDim: Record<string, any[]> = {};
  CANONICAL_PADF_DIMENSIONS.forEach(dim => {
    evByDim[dim.code] = [];
  });

  evidenceRecords.forEach(rec => {
    const def = EVIDENCE_OBJECTS_REGISTRY[rec.evidence_object_id];
    const dimCode = rec.dimension_code || rec.metadata?.dimension_code || def?.dimension || '';
    const matchingDim = CANONICAL_PADF_DIMENSIONS.find(
      d => d.code === dimCode || d.shortCode === dimCode || dimCode.includes(d.shortCode)
    );
    if (matchingDim) {
      evByDim[matchingDim.code].push(rec);
    }
  });

  // 2. Score each dimension (0-100)
  const dimensionResults: any[] = [];
  let baseWinabilitySum = 0;
  let totalWeight = 0;

  CANONICAL_PADF_DIMENSIONS.forEach(dim => {
    const recs = evByDim[dim.code] || [];
    let score = 50; // Neutral default

    if (recs.length > 0) {
      let totalItemScore = 0;
      recs.forEach(rec => {
        let itemScore = 50;
        let contentStr = '';
        const rawVal = rec.evidence_statement ?? rec.content ?? '';
        try {
          if (typeof rawVal === 'object') {
            contentStr = JSON.stringify(rawVal);
          } else {
            contentStr = String(rawVal);
          }
        } catch (_e) {
          contentStr = String(rawVal);
        }

        const lowerContent = contentStr.toLowerCase();
        // Check signal indicators
        const def = EVIDENCE_OBJECTS_REGISTRY[rec.evidence_object_id];
        let hasPositiveMatch = false;
        let hasNegativeMatch = false;

        if (def) {
          if (Array.isArray(def.positiveSignals)) {
            hasPositiveMatch = def.positiveSignals.some((sig: string) =>
              lowerContent.includes(sig.slice(0, 15).toLowerCase()) || lowerContent.includes('verified') || lowerContent.includes('approved') || lowerContent.includes('signed')
            );
          }
          if (Array.isArray(def.negativeSignals)) {
            hasNegativeMatch = def.negativeSignals.some((sig: string) =>
              lowerContent.includes(sig.slice(0, 15).toLowerCase()) || lowerContent.includes('unanswered') || lowerContent.includes('blocker') || lowerContent.includes('unknown')
            );
          }
        }

        if (lowerContent.includes('customer verified') || lowerContent.includes('formally approved') || lowerContent.includes('signed off') || lowerContent.includes('100%') || hasPositiveMatch) {
          itemScore = 88;
        } else if (lowerContent.includes('in progress') || lowerContent.includes('aligned') || lowerContent.includes('reviewed')) {
          itemScore = 65;
        } else if (lowerContent.includes('unanswered') || lowerContent.includes('no evidence') || lowerContent.includes('unknown') || hasNegativeMatch) {
          itemScore = 25;
        }

        // Customer confirmed bonus / assumption penalty
        const srcVal = rec.source_type || rec.source || '';
        if (rec.customer_confirmed === true) {
          itemScore = Math.min(100, itemScore + 8);
        } else if (srcVal === 'Seller Assumption' || srcVal === 'Sales Representative Input') {
          itemScore = Math.max(15, itemScore - 12);
        }

        totalItemScore += itemScore;
      });

      score = Math.round(totalItemScore / recs.length);
    } else {
      // Inherit from qualification baseline if available
      const inheritedScores = inheritanceData?.inherited_dimension_scores || {};
      const inheritedVal = inheritedScores[dim.code] || inheritedScores[dim.shortCode];
      if (typeof inheritedVal === 'number') {
        score = Math.round(inheritedVal * 0.9); // slight recency discount
      } else {
        score = 45; // slight discount for missing evidence
      }
    }

    const weightedScore = Math.round(score * dim.weight * 100) / 100;
    baseWinabilitySum += score * dim.weight;
    totalWeight += dim.weight;

    dimensionResults.push({
      dimension_code: dim.code,
      dimension_name: dim.name,
      score,
      weight: dim.weight,
      weighted_score: weightedScore,
      business_impact: `${dim.name} directly influences pipeline execution confidence.`,
      improvement_direction: score < 60 ? `Execute targeted discovery to strengthen evidence in ${dim.name}.` : `Maintain active alignment and protect validated advantage in ${dim.name}.`
    });
  });

  const baseWinability = Math.round(baseWinabilitySum / (totalWeight || 1));

  // 3. Risk Evaluation & Penalty Calculation
  let riskPenalty = 0;
  const formalRisks: any[] = [];

  const pa1 = dimensionResults.find(d => d.dimension_code.includes('PA1'));
  const pa2 = dimensionResults.find(d => d.dimension_code.includes('PA2'));
  const pa3 = dimensionResults.find(d => d.dimension_code.includes('PA3'));
  const pa6 = dimensionResults.find(d => d.dimension_code.includes('PA6'));

  // Critical Gate 1: Customer Value & Urgency < 50
  if (pa1 && pa1.score < 50) {
    riskPenalty += 12;
    formalRisks.push({
      risk_id: 'RISK_PA1_URGENCY_GAP',
      risk_title: 'Unquantified Business Problem & Urgency Deficit',
      category: 'Customer Value',
      severity: 'critical',
      trigger_description: 'Customer Value & Urgency dimension score is below 50, indicating lack of verified business pain or quantified financial impact.',
      business_impact: 'Deal is vulnerable to customer inertia and delay into future budget cycles.',
      mitigation_strategy: 'Conduct executive discovery session to co-author a financial ROI and cost-of-inaction model.',
      status: 'active'
    });
  }

  // Critical Gate 2: Economic Buyer / Buying Center < 50
  if (pa2 && pa2.score < 50) {
    riskPenalty += 15;
    formalRisks.push({
      risk_id: 'RISK_PA2_BUYING_CENTER_DISCONNECT',
      risk_title: 'Economic Buyer Inaccessibility & Single-Threading',
      category: 'Stakeholder & Governance',
      severity: 'critical',
      trigger_description: 'Buying Center score is below 50. Sales team lacks direct communication with the ultimate economic authority.',
      business_impact: 'High vulnerability to silent vetoes, budget reallocation, and lack of procurement sponsorship.',
      mitigation_strategy: 'Arm champion with executive business case to secure a peer-to-peer executive sponsor briefing.',
      status: 'active'
    });
  }

  // High Risk: Buying Process Control < 50
  if (pa3 && pa3.score < 50) {
    riskPenalty += 8;
    formalRisks.push({
      risk_id: 'RISK_PA3_PROCESS_AMBIGUITY',
      risk_title: 'Unmapped Buying Process & Procurement Milestones',
      category: 'Process Control',
      severity: 'high',
      trigger_description: 'Buying Process & Decision Control score is below 50. Legal, InfoSec, and governance milestones are unconfirmed.',
      business_impact: 'Significant risk of close date slippage due to unexpected procurement or compliance review cycles.',
      mitigation_strategy: 'Establish a shared Mutual Close Plan (MCP) with champion and procurement lead with hard milestone dates.',
      status: 'active'
    });
  }

  // Medium Risk: Commercial Budget < 50
  if (pa6 && pa6.score < 50) {
    riskPenalty += 6;
    formalRisks.push({
      risk_id: 'RISK_PA6_BUDGET_UNCERTAINTY',
      risk_title: 'Commercial Terms & Budget Allocation Uncertainty',
      category: 'Commercial',
      severity: 'medium',
      trigger_description: 'Commercial Structure score is below 50. Formal budget line item and pricing terms remain unconfirmed.',
      business_impact: 'Commercial negotiation friction late in the sales cycle may delay final contract signing.',
      mitigation_strategy: 'Deliver formal enterprise proposal with pre-negotiated tiered volume pricing.',
      status: 'active'
    });
  }

  // Cap risk penalty
  riskPenalty = Math.min(45, riskPenalty);
  const riskAdjustedWinability = Math.max(0, Math.min(100, baseWinability - riskPenalty));

  let healthStatus = 'Moderate';
  if (riskAdjustedWinability >= 75) healthStatus = 'Strong';
  else if (riskAdjustedWinability >= 55) healthStatus = 'Moderate';
  else if (riskAdjustedWinability >= 35) healthStatus = 'At Risk';
  else healthStatus = 'Critical Blocker';

  let confidenceLevel = 'High';
  if (evidenceRecords.length < 10) confidenceLevel = 'Low';
  else if (evidenceRecords.length < 24) confidenceLevel = 'Moderate';

  return {
    dimensionResults,
    baseWinability,
    riskPenalty,
    riskAdjustedWinability,
    healthStatus,
    confidenceLevel,
    formalRisks
  };
}

// =========================================================================
// MAIN EDGE FUNCTION HANDLER
// =========================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured.');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // -----------------------------------------------------------------------
    // HELPER: RESOLVE PIPELINE OPPORTUNITY BY pipeline_id OR uuid OR opportunity_id
    // -----------------------------------------------------------------------
    const resolvePipelineOpportunity = async (identifier: string, oppIdFallback?: string) => {
      if (identifier) {
        const { data: byPipeId } = await supabase
          .from('pipeline_opportunities')
          .select('*')
          .eq('pipeline_id', identifier)
          .maybeSingle();
        if (byPipeId) return byPipeId;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUuid) {
          const { data: byUuid } = await supabase
            .from('pipeline_opportunities')
            .select('*')
            .eq('id', identifier)
            .maybeSingle();
          if (byUuid) return byUuid;
        }
      }
      if (oppIdFallback || identifier) {
        const { data: byOppId } = await supabase
          .from('pipeline_opportunities')
          .select('*')
          .eq('opportunity_id', oppIdFallback || identifier)
          .maybeSingle();
        if (byOppId) return byOppId;
      }
      return null;
    };

    // -----------------------------------------------------------------------
    // ACTION 1: GET ASSESSMENT CONTEXT & ACTIVE 16 SWOT FACTORS
    // -----------------------------------------------------------------------
    if (action === 'get-assessment-context') {
      const { pipeline_id, pipeline_opportunity_id, opportunity_id } = body;
      const pipelineOpp = await resolvePipelineOpportunity(pipeline_id || pipeline_opportunity_id, opportunity_id);

      const revMotion = pipelineOpp?.revenue_motion_id || pipelineOpp?.revenue_motion_name || 'RM01_Digital_Solution_Selling';
      const industry = pipelineOpp?.industry_id || pipelineOpp?.industry_name || 'IND_SaaS_Software';

      const activeSWOTFactors = resolveActive16SWOTFactors(revMotion, industry);

      return new Response(JSON.stringify({
        pipeline_opportunity: pipelineOpp,
        dimensions: CANONICAL_PADF_DIMENSIONS,
        active_swot_factors: activeSWOTFactors,
        evidence_objects_count: Object.keys(EVIDENCE_OBJECTS_REGISTRY).length,
        version: 'v1.1'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 2: QUERY EVIDENCE QUESTIONS (48 OBJECTS GROUPED BY PA1-PA8)
    // -----------------------------------------------------------------------
    if (action === 'query-evidence-questions') {
      const { pipeline_id, pipeline_opportunity_id, revenue_motion, industry } = body;
      const resolvedId = pipeline_id || pipeline_opportunity_id;
      const pipelineOpp = resolvedId ? await resolvePipelineOpportunity(resolvedId) : null;
      const effectivePipeId = pipelineOpp?.pipeline_id || resolvedId;

      const motionLabel = revenue_motion || pipelineOpp?.revenue_motion_name || pipelineOpp?.revenue_motion_id || 'Digital Solution Selling';
      const industryLabel = industry || pipelineOpp?.industry_name || pipelineOpp?.industry_id || 'Enterprise Software';

      // Group 48 evidence objects by PADF dimensions with contextualized metadata
      const groupedQuestions: Record<string, any[]> = {};
      CANONICAL_PADF_DIMENSIONS.forEach(dim => {
        groupedQuestions[dim.code] = [];
      });

      Object.values(EVIDENCE_OBJECTS_REGISTRY).forEach((evObj: any) => {
        if (groupedQuestions[evObj.dimension]) {
          groupedQuestions[evObj.dimension].push({
            ...evObj,
            revenueMotionContext: motionLabel,
            industryContext: industryLabel
          });
        }
      });

      // Fetch any existing evidence submitted for this pipeline opportunity
      let existingEvidence: any[] = [];
      if (effectivePipeId) {
        const { data } = await supabase
          .from('pipeline_evidence')
          .select('*')
          .eq('pipeline_id', effectivePipeId);
        existingEvidence = data || [];
      }

      return new Response(JSON.stringify({
        pipeline_id: effectivePipeId,
        revenue_motion: motionLabel,
        industry: industryLabel,
        dimensions: CANONICAL_PADF_DIMENSIONS,
        grouped_questions: groupedQuestions,
        existing_evidence: existingEvidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 3: SUBMIT PIPELINE EVIDENCE
    // -----------------------------------------------------------------------
    if (action === 'submit-pipeline-evidence') {
      const { pipeline_id, pipeline_opportunity_id, evidence_records } = body;
      const targetId = pipeline_id || pipeline_opportunity_id;
      if (!targetId || !Array.isArray(evidence_records)) {
        throw new Error('pipeline_id and evidence_records array are required.');
      }

      const pipelineOpp = await resolvePipelineOpportunity(targetId);
      const effectivePipeId = pipelineOpp?.pipeline_id || targetId;

      const rowsToInsert = evidence_records.map((ev: any) => {
        const statement = typeof ev.evidence_statement === 'string'
          ? ev.evidence_statement
          : typeof ev.content === 'string'
            ? ev.content
            : JSON.stringify(ev.evidence_statement || ev.content || '');
        const confidence = Number(ev.evidence_confidence ?? ev.confidence_score ?? 85);
        const quality = confidence >= 80 ? 'HIGH' : confidence >= 55 ? 'MEDIUM' : 'LOW';
        const instanceId = ev.evidence_instance_id || `EVI_${effectivePipeId}_${ev.evidence_object_id}`;

        return {
          evidence_instance_id: instanceId,
          pipeline_id: effectivePipeId,
          evidence_object_id: ev.evidence_object_id,
          evidence_type: ev.evidence_type || 'customer_statement',
          evidence_statement: statement,
          source_type: ev.source_type || ev.source || 'Customer Meeting Notes',
          source_reference: ev.source_reference || 'Pipeline Assessment Form',
          recorded_by: ev.recorded_by || 'Sales Representative',
          verification_status: ev.customer_confirmed ? 'VERIFIED' : 'UNVERIFIED',
          evidence_quality: quality,
          evidence_confidence: confidence,
          customer_confirmed: ev.customer_confirmed ?? false,
          freshness_days: 0,
          notes: ev.notes || null,
          metadata: {
            ...(ev.metadata || {}),
            dimension_code: ev.dimension_code,
            suggested_selection: ev.suggested_selection || null
          },
          updated_at: new Date().toISOString()
        };
      });

      // Replace existing instances cleanly for submitted evidence_object_ids
      for (const row of rowsToInsert) {
        await supabase
          .from('pipeline_evidence')
          .delete()
          .eq('pipeline_id', effectivePipeId)
          .eq('evidence_object_id', row.evidence_object_id);
      }

      const { data: insertedEvidence, error: insertError } = await supabase
        .from('pipeline_evidence')
        .insert(rowsToInsert)
        .select();

      if (insertError) throw insertError;

      // Update pipeline_opportunity stage/updated_at
      await supabase
        .from('pipeline_opportunities')
        .update({
          pipeline_stage: 'Evidence Populated',
          updated_at: new Date().toISOString()
        })
        .eq('pipeline_id', effectivePipeId);

      return new Response(JSON.stringify({
        status: 'success',
        pipeline_id: effectivePipeId,
        evidence_count: insertedEvidence.length,
        evidence: insertedEvidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 3b: VALIDATE PIPELINE EVIDENCE ANSWERS (GEMINI + DETERMINISTIC)
    // -----------------------------------------------------------------------
    if (action === 'validate-evidence') {
      const { pipeline_id, pipeline_opportunity_id, evidence_records } = body;
      const targetId = pipeline_id || pipeline_opportunity_id;
      if (!targetId) throw new Error('pipeline_id is required for evidence validation.');

      const pipelineOpp = await resolvePipelineOpportunity(targetId);
      const effectivePipeId = pipelineOpp?.pipeline_id || targetId;

      let records = Array.isArray(evidence_records) ? evidence_records : null;
      if (!records) {
        const { data } = await supabase
          .from('pipeline_evidence')
          .select('*')
          .eq('pipeline_id', effectivePipeId);
        records = data || [];
      }

      const totalObjects = Object.keys(EVIDENCE_OBJECTS_REGISTRY).length;
      const populatedIds = new Set(
        records
          .filter((r: any) => (r.evidence_statement || r.content || '').trim().length > 0)
          .map((r: any) => r.evidence_object_id)
      );

      const dimensionCoverage: Record<string, { answered: number; total: number; status: string }> = {};
      CANONICAL_PADF_DIMENSIONS.forEach(dim => {
        const dimObjs = Object.values(EVIDENCE_OBJECTS_REGISTRY).filter((o: any) => o.dimension === dim.code);
        const answeredCount = dimObjs.filter((o: any) => populatedIds.has(o.evidenceId || o.id)).length;
        dimensionCoverage[dim.code] = {
          answered: answeredCount,
          total: dimObjs.length,
          status: answeredCount === dimObjs.length ? 'COMPLETE' : answeredCount > 0 ? 'PARTIAL' : 'MISSING'
        };
      });

      const missingMandatoryDimensions = CANONICAL_PADF_DIMENSIONS
        .filter(d => d.mandatory && (dimensionCoverage[d.code]?.answered || 0) === 0)
        .map(d => `${d.shortCode}: ${d.name}`);

      const unconfirmedCount = records.filter((r: any) => !r.customer_confirmed).length;

      let aiValidationSummary = '';
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (apiKey && records.length > 0) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const validationPrompt = `Audit the following ${records.length}/${totalObjects} submitted pipeline assessment evidence answers for ${pipelineOpp?.customer_name || 'Customer'} (${pipelineOpp?.revenue_motion_name || 'Enterprise'} / ${pipelineOpp?.industry_name || 'Software'}).
Identify any material contradictions, unverified seller assumptions, or critical missing dimensions (Mandatory gaps: ${missingMandatoryDimensions.join(', ') || 'None'}). Provide a concise 3-sentence executive validation readiness verdict.
Evidence sample:
${records.slice(0, 20).map((r: any) => `- [${r.evidence_object_id}] Confirmed=${!!r.customer_confirmed} | ${r.evidence_statement || r.content}`).join('\n')}`;

          const valResp = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: validationPrompt,
            config: { temperature: 0.1 }
          });
          aiValidationSummary = valResp.text || '';
        } catch (_e) {
          // Graceful fallback if Gemini validation call fails
        }
      }

      const isReady = populatedIds.size >= 8 && missingMandatoryDimensions.length === 0;

      return new Response(JSON.stringify({
        status: isReady ? 'VALIDATED' : 'NEEDS_ATTENTION',
        ready_for_assessment: isReady,
        populated_count: populatedIds.size,
        total_questions: totalObjects,
        unconfirmed_count: unconfirmedCount,
        missing_mandatory_dimensions: missingMandatoryDimensions,
        dimension_coverage: dimensionCoverage,
        ai_validation_verdict: aiValidationSummary || (
          isReady
            ? `Validated ${populatedIds.size} of ${totalObjects} evidence points across all mandatory PADF dimensions. Ready to execute Pipeline Assessment Reasoning.`
            : `Only ${populatedIds.size} of ${totalObjects} evidence items provided. Mandatory dimensions missing coverage: ${missingMandatoryDimensions.join(', ') || 'Low evidence density'}.`
        )
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 4: RUN PIPELINE ASSESSMENT (DETERMINISTIC + GEMINI REASONING)
    // -----------------------------------------------------------------------
    if (action === 'run-pipeline-assessment') {
      const { pipeline_id, pipeline_opportunity_id } = body;
      const targetId = pipeline_id || pipeline_opportunity_id;
      if (!targetId) {
        throw new Error('pipeline_id is required.');
      }

      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      const ai = new GoogleGenAI({ apiKey });

      const startTime = Date.now();

      // 1. Fetch Pipeline Opportunity
      const pipelineOpp = await resolvePipelineOpportunity(targetId);
      if (!pipelineOpp) throw new Error(`Pipeline opportunity not found for identifier: ${targetId}`);
      const effectivePipeId = pipelineOpp.pipeline_id;

      // 2. Fetch Inheritance Data
      const { data: inheritance } = await supabase
        .from('pipeline_inheritance')
        .select('*')
        .eq('pipeline_id', effectivePipeId)
        .maybeSingle();

      // 3. Fetch All Submitted Evidence
      const { data: evidenceRecords, error: evError } = await supabase
        .from('pipeline_evidence')
        .select('*')
        .eq('pipeline_id', effectivePipeId);
      if (evError) throw evError;

      // 4. Resolve Context & Active 16 SWOT Factors
      const revMotion = pipelineOpp.revenue_motion_id || pipelineOpp.revenue_motion_name || 'RM01_Digital_Solution_Selling';
      const industry = pipelineOpp.industry_id || pipelineOpp.industry_name || 'IND_SaaS_Software';
      const active16SWOTFactors = resolveActive16SWOTFactors(revMotion, industry);

      // 5. Run Deterministic Scoring
      const deterministic = calculateDeterministicAssessment(evidenceRecords || [], inheritance || {});

      // 6. Format Gemini Prompt using Gemini Pipeline Reasoning System Prompt v1.1
      const systemInstruction = `You are the Pipeline Assessment Intelligence Engine of RevOS.
Your responsibility is to continuously assess the winability, health, risks, strategic position, and required next actions of qualified B2B sales opportunities.
You operate after an opportunity has successfully passed through the RevOS Opportunity Qualification module and entered the Pipeline Assessment lifecycle.
You adhere strictly to the Gemini Pipeline Reasoning System Prompt v1.1 and Pipeline Reasoning Strategy Specification v1.1.

IMPORTANT GOVERNANCE BOUNDARIES:
1. Deterministic outputs are AUTHORITATIVE:
   - Base Winability: ${deterministic.baseWinability}/100
   - Risk Penalty: ${deterministic.riskPenalty}
   - Risk-Adjusted Winability: ${deterministic.riskAdjustedWinability}/100
   - Pipeline Health Status: ${deterministic.healthStatus}
   - Confidence Level: ${deterministic.confidenceLevel}
   You MUST PRESERVE these deterministic scores and explain their strategic drivers. You MUST NOT recalculate or override these numbers.
2. Active SWOT Factors: Exactly 16 factors are active (8 Universal Baseline + 4 Revenue Motion + 4 Industry). Evaluate each of the 16 factors using ordinal scales (1 to 5) for:
   - strategic_impact (1-5)
   - evidence_confidence (1-5)
   - relevance (1-5)
   - urgency (1-5)
   - manageability (1-5)
   - winability_influence (1-5)
3. Synthesize TOWS Strategic Intelligence:
   - Generate relevant, high-impact TOWS strategy combinations (SO, WO, ST, WT) connecting validated SWOT factors and evidence.
4. Actionable Prioritized Recommendations:
   - Categorize recommendations into: 'CRITICAL', 'HIGH', 'MEDIUM'.
   - Avoid generic advice; provide concrete, consultative, enterprise-grade recommendations.`;

      const inheritedPayload: any = inheritance?.inherited_payload || {};
      const prompt = `
=== PIPELINE OPPORTUNITY CONTEXT ===
- Opportunity Name: ${pipelineOpp.opportunity_name}
- Company: ${pipelineOpp.customer_name}
- Revenue Motion: ${revMotion}
- Industry: ${industry}
- Deal Value: ${pipelineOpp.currency || 'USD'} ${pipelineOpp.deal_value?.toLocaleString() || '150,000'}
- Target Close Date: ${pipelineOpp.expected_close_date || 'N/A'}
- Pipeline Stage: ${pipelineOpp.pipeline_stage || 'Active Assessment'}

=== UPSTREAM INHERITED QUALIFICATION BASELINE (PADIF v1.0) ===
- Qualification Decision: ${inheritance?.qualification_decision || 'QUALIFIED'}
- Qualification Score (QIP): ${inheritance?.qualification_score ?? 78}/100
- Inherited Confidence: ${inheritance?.qualification_confidence ?? 75}%
- Inherited Payload Summary: ${JSON.stringify(inheritedPayload).slice(0, 2500)}

=== DETERMINISTIC PADF DIMENSION SCORES (AUTHORITATIVE) ===
${deterministic.dimensionResults.map(d => `- [${d.dimension_code}] ${d.dimension_name}: Score ${d.score}/100 (Weight: ${d.weight * 100}%, Weighted: ${d.weighted_score})`).join('\n')}

- Base Winability: ${deterministic.baseWinability}/100
- Formal Risk Penalty: -${deterministic.riskPenalty} points
- Risk-Adjusted Winability: ${deterministic.riskAdjustedWinability}/100
- Pipeline Health: ${deterministic.healthStatus}

=== COLLECTED PIPELINE EVIDENCE INSTANCES (${evidenceRecords?.length || 0} ITEMS) ===
${(evidenceRecords || []).map(ev => {
  const def = EVIDENCE_OBJECTS_REGISTRY[ev.evidence_object_id];
  return `
- Evidence Object: [${ev.evidence_object_id}] ${def?.name || ev.evidence_object_id} (Dim: ${ev.metadata?.dimension_code || def?.dimension || ''})
  Question: "${def?.question || ''}"
  Customer Confirmed: ${ev.customer_confirmed ? 'YES' : 'NO'} | Source: ${ev.source_type || 'Sales Rep'} | Confidence: ${ev.evidence_confidence}%
  Actual User Finding / Answer: "${ev.evidence_statement}"
`;
}).join('\n')}

=== 16 ACTIVE SWOT FACTORS TO EVALUATE ===
${active16SWOTFactors.map(f => `- [${f.id}] (${f.classification} - ${f.layer}): ${f.name} (Category: ${f.category})`).join('\n')}

=== REASONING TASK ===
1. Provide an Executive Assessment Summary explaining why the opportunity has its current Winability (${deterministic.riskAdjustedWinability}%), the primary positive momentum drivers, and the critical constraints holding it back.
2. Evaluate all 16 active SWOT factors with 1-5 ordinal scales, an executive interpretation, business impact, and uncertainty notes.
3. Formulate 4-6 high-impact TOWS Strategies (SO, WO, ST, WT) directly tying back to the active SWOT factor IDs and evidence.
4. Formalize Risk Intelligence items with specific mitigation steps.
5. Generate 4-6 Prioritized Action Recommendations (CRITICAL, HIGH, MEDIUM).
6. Detail material Evidence Gaps and Longitudinal Guidance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.1,
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executive_summary: { type: Type.STRING },
              qualification_continuity_summary: { type: Type.STRING },
              positive_drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
              critical_constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
              longitudinal_trend: { type: Type.STRING },
              swot_evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    swot_factor_id: { type: Type.STRING },
                    factor_name: { type: Type.STRING },
                    classification: { type: Type.STRING },
                    category: { type: Type.STRING },
                    layer: { type: Type.STRING },
                    strategic_impact: { type: Type.INTEGER },
                    evidence_confidence: { type: Type.INTEGER },
                    relevance: { type: Type.INTEGER },
                    urgency: { type: Type.INTEGER },
                    manageability: { type: Type.INTEGER },
                    winability_influence: { type: Type.INTEGER },
                    interpretation: { type: Type.STRING },
                    business_impact: { type: Type.STRING },
                    uncertainty: { type: Type.STRING },
                    supporting_evidence_ids: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: [
                    "swot_factor_id", "factor_name", "classification", "category", "layer",
                    "strategic_impact", "evidence_confidence", "relevance", "urgency",
                    "manageability", "winability_influence", "interpretation", "business_impact", "uncertainty"
                  ]
                }
              },
              padf_dimension_narratives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension_code: { type: Type.STRING },
                    dimension_name: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    uncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
                    business_impact: { type: Type.STRING },
                    improvement_direction: { type: Type.STRING }
                  },
                  required: ["dimension_code", "dimension_name", "strengths", "weaknesses", "uncertainties", "business_impact", "improvement_direction"]
                }
              },
              tows_strategies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    strategy_id: { type: Type.STRING },
                    tows_type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    strategic_objective: { type: Type.STRING },
                    strategic_rationale: { type: Type.STRING },
                    contributing_swot_factor_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                    supporting_evidence_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expected_winability_impact: { type: Type.STRING },
                    feasibility_considerations: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    execution_timeframe: { type: Type.STRING }
                  },
                  required: [
                    "strategy_id", "tows_type", "title", "strategic_objective",
                    "strategic_rationale", "contributing_swot_factor_ids", "expected_winability_impact", "priority", "execution_timeframe"
                  ]
                }
              },
              risks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk_id: { type: Type.STRING },
                    risk_title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    trigger_description: { type: Type.STRING },
                    business_impact: { type: Type.STRING },
                    mitigation_strategy: { type: Type.STRING }
                  },
                  required: ["risk_id", "risk_title", "category", "severity", "trigger_description", "business_impact", "mitigation_strategy"]
                }
              },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action_title: { type: Type.STRING },
                    action_description: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    owner_role: { type: Type.STRING },
                    timeframe: { type: Type.STRING },
                    success_criteria: { type: Type.STRING },
                    dependencies: { type: Type.STRING }
                  },
                  required: ["action_title", "action_description", "priority", "owner_role", "timeframe", "success_criteria"]
                }
              },
              evidence_gaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    gap_type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    affected_dimension: { type: Type.STRING },
                    recommended_action: { type: Type.STRING }
                  },
                  required: ["gap_type", "description", "affected_dimension", "recommended_action"]
                }
              }
            },
            required: [
              "executive_summary", "qualification_continuity_summary", "positive_drivers",
              "critical_constraints", "longitudinal_trend", "swot_evaluations",
              "padf_dimension_narratives", "tows_strategies", "risks", "actions"
            ]
          }
        }
      });

      const aiResult = JSON.parse(response.text || '{}');
      const executionDurationMs = Date.now() - startTime;

      // 7. Determine assessment_sequence & create assessment_id matching SQL schema
      const { data: previousAssessments } = await supabase
        .from('pipeline_assessments')
        .select('assessment_sequence')
        .eq('pipeline_id', effectivePipeId)
        .order('assessment_sequence', { ascending: false })
        .limit(1);

      const nextSequence = (previousAssessments?.[0]?.assessment_sequence || 0) + 1;
      const assessmentId = `ASSESS_${effectivePipeId}_v${nextSequence}_${Date.now()}`;
      const mappedHealth = deterministic.healthStatus === 'Strong'
        ? 'STRONG'
        : deterministic.healthStatus === 'Moderate'
          ? 'MODERATE'
          : deterministic.healthStatus === 'At Risk'
            ? 'AT_RISK'
            : 'CRITICAL';
      const numericConfidence = deterministic.confidenceLevel === 'High' ? 90 : deterministic.confidenceLevel === 'Moderate' ? 70 : 45;

      const executiveSummaryPayload = {
        overall_assessment: aiResult.executive_summary,
        qualification_continuity_summary: aiResult.qualification_continuity_summary,
        current_strengths: aiResult.positive_drivers || [],
        key_constraints: aiResult.critical_constraints || [],
        longitudinal_trend: aiResult.longitudinal_trend || 'Improving',
        evidence_gaps: (aiResult.evidence_gaps || []).map((g: any) => `${g.affected_dimension}: ${g.description}`),
        reasoning_duration_ms: executionDurationMs
      };

      const { data: assessmentRecord, error: assessInsertError } = await supabase
        .from('pipeline_assessments')
        .insert({
          assessment_id: assessmentId,
          pipeline_id: effectivePipeId,
          assessment_sequence: nextSequence,
          assessment_status: 'COMPLETED',
          trigger_type: nextSequence === 1 ? 'INITIAL_ASSESSMENT' : 'REASSESSMENT',
          base_winability: deterministic.baseWinability,
          risk_adjusted_winability: deterministic.riskAdjustedWinability,
          pipeline_health: mappedHealth,
          assessment_confidence: numericConfidence,
          configuration_version: 'v1.1',
          evidence_kb_version: 'v1.1',
          rules_version: 'v1.1',
          reasoning_prompt_version: 'v1.1',
          model_identifier: 'gemini-3.1-flash-lite',
          raw_reasoning_output: aiResult,
          executive_summary: executiveSummaryPayload,
          created_by: 'Pipeline Assessment Engine',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assessInsertError) throw assessInsertError;

      // 8. Insert PADF Dimension Results (matching pipeline_padf_results SQL columns)
      const padfRows = deterministic.dimensionResults.map(d => {
        const aiNarrative = aiResult.padf_dimension_narratives?.find(
          (n: any) => n.dimension_code === d.dimension_code || d.dimension_code.includes(n.dimension_code)
        );
        const state = d.score >= 75 ? 'STRONG' : d.score >= 60 ? 'HEALTHY' : d.score >= 45 ? 'MODERATE' : 'VULNERABLE';
        return {
          assessment_id: assessmentId,
          pipeline_id: effectivePipeId,
          dimension_id: d.dimension_code,
          dimension_name: d.dimension_name,
          dimension_score: d.score,
          assessment_state: state,
          evidence_coverage: (evidenceRecords || []).some((e: any) => e.metadata?.dimension_code === d.dimension_code) ? 'COMPLETE' : 'PARTIAL',
          key_strengths: aiNarrative?.strengths || [],
          key_weaknesses: aiNarrative?.weaknesses || [],
          evidence_references: [],
          business_implications: aiNarrative?.business_impact || d.business_impact,
          recommended_actions: aiNarrative?.improvement_direction ? [aiNarrative.improvement_direction] : []
        };
      });

      await supabase.from('pipeline_padf_results').insert(padfRows);

      // 9. Insert SWOT Results (16 Factors matching pipeline_swot_results SQL columns)
      let swotRows: any[] = [];
      if (Array.isArray(aiResult.swot_evaluations)) {
        swotRows = aiResult.swot_evaluations.map((se: any) => ({
          assessment_id: assessmentId,
          pipeline_id: effectivePipeId,
          factor_id: se.swot_factor_id,
          factor_name: se.factor_name,
          factor_type: (se.classification || 'strength').toLowerCase(),
          factor_layer: se.layer === 'revenue_motion' ? 'revenue_motion_override' : se.layer === 'industry' ? 'industry_override' : 'universal_baseline',
          strategic_impact: se.strategic_impact || 4,
          evidence_confidence: se.evidence_confidence || 4,
          relevance: se.relevance || 4,
          urgency: se.urgency || 4,
          manageability: se.manageability || 4,
          winability_influence: se.winability_influence || 4,
          priority_level: (se.strategic_impact || 3) >= 5 ? 'critical' : (se.strategic_impact || 3) >= 4 ? 'high' : 'medium',
          assessment_state: 'EVALUATED',
          evaluation_rationale: `${se.interpretation || ''} ${se.business_impact ? 'Impact: ' + se.business_impact : ''}`.trim(),
          supporting_evidence_ids: se.supporting_evidence_ids || [],
          contradicting_evidence_ids: [],
          related_padf_dimensions: []
        }));
        await supabase.from('pipeline_swot_results').insert(swotRows);
      }

      // 10. Insert Formal Risks (matching pipeline_risks SQL columns)
      const allRisks = [...deterministic.formalRisks];
      if (Array.isArray(aiResult.risks)) {
        aiResult.risks.forEach((ar: any) => {
          if (!allRisks.some(r => r.risk_id === ar.risk_id)) {
            allRisks.push({
              risk_id: ar.risk_id,
              risk_title: ar.risk_title,
              category: ar.category || 'Pipeline Risk',
              severity: (ar.severity || 'MEDIUM').toUpperCase(),
              trigger_description: ar.trigger_description || '',
              business_impact: ar.business_impact || '',
              mitigation_strategy: ar.mitigation_strategy || '',
              status: 'ACTIVE'
            });
          }
        });
      }

      const riskRows = allRisks.map((r, idx) => ({
        risk_instance_id: `RISK_${assessmentId}_${idx + 1}`,
        assessment_id: assessmentId,
        pipeline_id: effectivePipeId,
        risk_id: r.risk_id,
        risk_category: r.category || 'General',
        risk_description: `${r.risk_title}: ${r.trigger_description || r.business_impact}`.trim(),
        severity: (r.severity || 'MEDIUM').toUpperCase(),
        likelihood: 'MODERATE',
        impact: (r.severity || '').toUpperCase() === 'CRITICAL' ? 'SEVERE' : 'MODERATE',
        triggering_evidence: [],
        risk_status: 'ACTIVE',
        mitigation_strategy: r.mitigation_strategy || '',
        mitigation_actions: r.mitigation_strategy ? [r.mitigation_strategy] : [],
        owner: pipelineOpp.opportunity_owner || 'Opportunity Owner'
      }));
      if (riskRows.length > 0) {
        await supabase.from('pipeline_risks').insert(riskRows);
      }

      // 11. Insert TOWS Strategies (matching pipeline_strategies SQL columns)
      const stratRows = Array.isArray(aiResult.tows_strategies)
        ? aiResult.tows_strategies.map((ts: any, idx: number) => ({
            strategy_instance_id: `STRAT_${assessmentId}_${idx + 1}`,
            assessment_id: assessmentId,
            pipeline_id: effectivePipeId,
            strategy_id: ts.strategy_id || `TOWS_${idx + 1}`,
            strategy_type: (['SO', 'WO', 'ST', 'WT'].includes(ts.tows_type) ? ts.tows_type : 'SO'),
            tows_category: ts.title || ts.tows_type,
            strategic_objective: ts.strategic_objective || ts.title,
            strategic_rationale: ts.strategic_rationale || '',
            supporting_swot_factor_ids: ts.contributing_swot_factor_ids || [],
            supporting_evidence_ids: ts.supporting_evidence_ids || [],
            related_risk_ids: [],
            priority: (ts.priority || 'HIGH').toUpperCase(),
            expected_impact: ts.expected_winability_impact || 'POSITIVE_DIRECTIONAL',
            feasibility: 'HIGH',
            dependencies: ts.feasibility_considerations ? [ts.feasibility_considerations] : [],
            strategy_status: 'PROPOSED'
          }))
        : [];
      if (stratRows.length > 0) {
        await supabase.from('pipeline_strategies').insert(stratRows);
      }

      // 12. Insert Prioritized Actions (matching pipeline_actions SQL columns)
      const actionRows = Array.isArray(aiResult.actions)
        ? aiResult.actions.map((act: any, idx: number) => ({
            action_id: `ACT_${assessmentId}_${idx + 1}`,
            strategy_instance_id: stratRows[0]?.strategy_instance_id || null,
            pipeline_id: effectivePipeId,
            action_description: act.action_title ? `${act.action_title} — ${act.action_description}` : act.action_description,
            strategic_objective: act.success_criteria || '',
            action_owner: act.owner_role || 'Account Executive',
            priority: (act.priority || 'HIGH').toUpperCase().includes('CRIT') ? 'CRITICAL' : (act.priority || 'HIGH').toUpperCase().includes('MED') ? 'MEDIUM' : 'HIGH',
            action_status: 'NOT_STARTED',
            completion_notes: act.dependencies ? `Dependencies: ${act.dependencies} | Timeframe: ${act.timeframe}` : `Timeframe: ${act.timeframe}`
          }))
        : [];
      if (actionRows.length > 0) {
        await supabase.from('pipeline_actions').insert(actionRows);
      }

      // 13. Update Pipeline Opportunity Master Table (storing metrics cleanly in metadata + stage)
      await supabase
        .from('pipeline_opportunities')
        .update({
          pipeline_stage: 'Assessment Completed',
          metadata: {
            ...(pipelineOpp.metadata || {}),
            latest_assessment_id: assessmentId,
            base_winability: deterministic.baseWinability,
            risk_penalty: deterministic.riskPenalty,
            risk_adjusted_winability: deterministic.riskAdjustedWinability,
            pipeline_health: mappedHealth,
            confidence_level: deterministic.confidenceLevel
          },
          updated_at: new Date().toISOString()
        })
        .eq('pipeline_id', effectivePipeId);

      // 14. Create Snapshot (matching pipeline_assessment_snapshots SQL columns)
      await supabase.from('pipeline_assessment_snapshots').insert({
        snapshot_id: `SNAP_${assessmentId}`,
        assessment_id: assessmentId,
        pipeline_id: effectivePipeId,
        snapshot_sequence: nextSequence,
        snapshot_timestamp: new Date().toISOString(),
        full_snapshot_payload: {
          opportunity: pipelineOpp,
          inheritance,
          evidence: evidenceRecords || [],
          assessment: assessmentRecord,
          padf_results: padfRows,
          swot_results: swotRows,
          risks: riskRows,
          strategies: stratRows,
          actions: actionRows,
          evidence_gaps: aiResult.evidence_gaps || []
        }
      });

      return new Response(JSON.stringify({
        status: 'success',
        pipeline_id: effectivePipeId,
        assessment_id: assessmentId,
        sequence: nextSequence,
        base_winability: deterministic.baseWinability,
        risk_penalty: deterministic.riskPenalty,
        risk_adjusted_winability: deterministic.riskAdjustedWinability,
        pipeline_health: mappedHealth,
        confidence_level: deterministic.confidenceLevel,
        assessment: assessmentRecord,
        padf_results: padfRows,
        swot_results: swotRows,
        risks: riskRows,
        strategies: stratRows,
        actions: actionRows,
        evidence_gaps: aiResult.evidence_gaps || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 5: RETRIEVE LATEST ASSESSMENT
    // -----------------------------------------------------------------------
    if (action === 'retrieve-assessment') {
      const { pipeline_id, pipeline_opportunity_id, assessment_id } = body;
      const targetId = pipeline_id || pipeline_opportunity_id;
      if (!targetId && !assessment_id) {
        throw new Error('Either pipeline_id or assessment_id is required.');
      }

      const pipelineOpp = targetId ? await resolvePipelineOpportunity(targetId) : null;
      const effectivePipeId = pipelineOpp?.pipeline_id || targetId;

      let assessmentQuery = supabase.from('pipeline_assessments').select('*');
      if (assessment_id) {
        assessmentQuery = assessmentQuery.eq('assessment_id', assessment_id);
      } else {
        assessmentQuery = assessmentQuery
          .eq('pipeline_id', effectivePipeId)
          .order('assessment_sequence', { ascending: false })
          .limit(1);
      }

      const { data: assessmentData, error: aError } = await assessmentQuery.maybeSingle();
      if (aError) throw aError;
      if (!assessmentData) {
        return new Response(JSON.stringify({ assessment: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const currentAssessmentId = assessmentData.assessment_id;

      // Parallel fetch sub-tables
      const [padfRes, swotRes, risksRes, strategiesRes, actionsRes] = await Promise.all([
        supabase.from('pipeline_padf_results').select('*').eq('assessment_id', currentAssessmentId),
        supabase.from('pipeline_swot_results').select('*').eq('assessment_id', currentAssessmentId),
        supabase.from('pipeline_risks').select('*').eq('assessment_id', currentAssessmentId),
        supabase.from('pipeline_strategies').select('*').eq('assessment_id', currentAssessmentId),
        supabase.from('pipeline_actions').select('*').eq('pipeline_id', assessmentData.pipeline_id)
      ]);

      return new Response(JSON.stringify({
        assessment: assessmentData,
        padf_results: padfRes.data || [],
        swot_results: swotRes.data || [],
        risks: risksRes.data || [],
        strategies: strategiesRes.data || [],
        actions: actionsRes.data || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // -----------------------------------------------------------------------
    // ACTION 6: CREATE ASSESSMENT SNAPSHOT
    // -----------------------------------------------------------------------
    if (action === 'create-assessment-snapshot') {
      const { pipeline_id, pipeline_opportunity_id, assessment_id } = body;
      const targetId = pipeline_id || pipeline_opportunity_id;
      if (!targetId || !assessment_id) {
        throw new Error('pipeline_id and assessment_id are required.');
      }

      const pipelineOpp = await resolvePipelineOpportunity(targetId);
      const effectivePipeId = pipelineOpp?.pipeline_id || targetId;

      const { data: assessment } = await supabase
        .from('pipeline_assessments')
        .select('*')
        .eq('assessment_id', assessment_id)
        .single();

      const { data: snapshot, error: snapError } = await supabase
        .from('pipeline_assessment_snapshots')
        .insert({
          snapshot_id: `SNAP_${assessment_id}_${Date.now()}`,
          pipeline_id: effectivePipeId,
          assessment_id,
          snapshot_sequence: (assessment?.assessment_sequence || 1),
          snapshot_timestamp: new Date().toISOString(),
          full_snapshot_payload: { assessment }
        })
        .select()
        .single();

      if (snapError) throw snapError;

      return new Response(JSON.stringify({ status: 'success', snapshot }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown action
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Pipeline Assessment Engine Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
