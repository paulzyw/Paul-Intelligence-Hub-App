# Pipeline Reasoning Strategy Specification v1.1

## Document Control

| Field | Value |
|---|---|
| Product | RevOS — Revenue Operating System |
| Module | Pipeline Assessment |
| Document | Pipeline Reasoning Strategy Specification |
| Version | 1.1 |
| Status | Draft for Owner Review |
| Supersedes | Pipeline Reasoning Strategy Specification v1.0 |
| Industry Configuration | Pipeline Industry Configuration v1.1 |
| Evidence Asset | Pipeline Evidence Knowledge Base v1.1 |
| Execution Asset | Pipeline Assessment Rules v1.1 |
| Related Frameworks | Pipeline Assessment Dimensions Framework (PADF) v1.0; Pipeline Assessment Data Inheritance Framework (PADIF) v1.0; Pipeline SWOT Intelligence Master Schema v1.0 |

### Purpose

This document defines the reasoning methodology, intelligence architecture, and analytical principles governing the RevOS Pipeline Assessment module.

It establishes how opportunity evidence, inherited qualification intelligence, industry context, SWOT intelligence, PADF assessment, TOWS reasoning, risk intelligence, winability assessment, and winning strategy are integrated into a coherent pipeline intelligence process.

This document defines the reasoning methodology. It does not independently execute calculations, replace deterministic rules, define new data schemas, or establish production readiness.

The authoritative runtime execution logic is governed by `Pipeline_Assessment_Rules_v1.1.json`.

### Normative Language

The terms below have specific meanings throughout this document:

- **MUST / MUST NOT**: Mandatory requirements.
- **SHOULD / SHOULD NOT**: Strong recommendations that may be deviated from only with a documented reason.
- **MAY**: Optional capabilities or behaviors.

---

# 1. Pipeline Assessment Intelligence Philosophy

## 1.1 Core Principle

RevOS Pipeline Assessment is designed as a continuous revenue-intelligence and winability optimization system, rather than a one-time opportunity review or static pipeline forecasting tool.

Its purpose is to understand the evolving commercial reality of an opportunity and identify what must happen to improve its probability and quality of becoming Closed Won.

An opportunity is not simply a collection of CRM fields or a sales-stage designation. Its actual winability depends on multiple interconnected factors, including:

- Customer business value and urgency.
- Buying-center alignment and stakeholder influence.
- Buying-process clarity and decision control.
- Solution fit and value proposition.
- Competitive position.
- Commercial and deal-structure readiness.
- Sales execution and deal readiness.
- Deal momentum, risks, and closeability.

These conditions evolve as new evidence emerges, customer circumstances change, competitors act, commercial discussions progress, and the sales team executes its strategy.

Consequently, Pipeline Assessment MUST interpret opportunity intelligence in its current business context and maintain a traceable record of how the opportunity changes over time.

## 1.2 Intelligence Objective

Pipeline Assessment transforms opportunity information and evidence into actionable intelligence across the following areas:

1. **Pipeline Health** — Understand the overall condition and development of the opportunity.
2. **Winability Assessment** — Determine the opportunity's likelihood of reaching Closed Won through the existing winability methodology.
3. **Evidence Intelligence** — Evaluate the evidence supporting, contradicting, qualifying, or contextualizing opportunity conditions.
4. **SWOT Intelligence** — Identify and evaluate internal strengths and weaknesses and external opportunities and threats.
5. **Risk Intelligence** — Identify and assess formal opportunity risks through the existing Risk Intelligence engine.
6. **Strategic Intelligence** — Generate structured TOWS reasoning and feed relevant strategic insights into the existing Winning Strategy engine.
7. **Action Intelligence** — Recommend evidence-based actions to improve opportunity conditions and execution.
8. **Longitudinal Intelligence** — Track changes in opportunity health, winability, risks, evidence, and strategic execution over time.

## 1.3 Five Fundamental Business Questions

Pipeline Assessment MUST ultimately answer five questions:

| No. | Business Question | Intelligence Objective |
|---|---|---|
| 1 | How likely is this opportunity to become Closed Won? | Establish winability using the existing assessment methodology. |
| 2 | Why is the opportunity currently in this condition? | Explain the underlying business, commercial, competitive, and execution drivers. |
| 3 | What evidence supports or contradicts the assessment? | Establish evidence traceability, quality, confidence, gaps, and contradictions. |
| 4 | What weaknesses, threats, risks, and uncertainties could prevent winning? | Identify vulnerabilities and areas requiring intervention. |
| 5 | What should the sales team do to improve the probability and quality of winning? | Generate strategic responses and actionable recommendations. |

These questions provide the business reasoning foundation for the entire module.

## 1.4 Core Intelligence Principles

### Evidence First

Every material assessment conclusion MUST be grounded in available opportunity evidence, inherited qualification information, approved configuration, or explicitly identified assumptions.

The system MUST distinguish:

- Verified observations.
- Customer-reported information.
- Internal sales assessments.
- System-generated information.
- AI-generated interpretations.
- Assumptions.
- Unknown or insufficiently evidenced conditions.

### Context Aware

Evidence MUST be interpreted in the context of the opportunity's industry, revenue motion, customer environment, buying process, and commercial circumstances.

The same evidence may have different implications across different industries or revenue motions.

### Multidimensional

No single positive or negative indicator should independently determine the overall opportunity assessment unless an authoritative rule explicitly defines such behavior.

### Deterministic Integrity

Deterministic calculations, assessment thresholds, validation rules, eligibility conditions, execution gates, and lifecycle transitions MUST remain governed by the Rules asset and the relevant authoritative frameworks.

Gemini MUST NOT independently redefine or override these outputs.

### Interpretive Transparency

AI reasoning should explain why evidence matters, how it relates to opportunity conditions, and what implications follow.

Material conclusions MUST be traceable to their supporting evidence and relevant assessment dimensions or factors.

### Action Orientation

Assessment should not stop at identifying problems. It should explain what needs to be validated, resolved, protected, strengthened, or changed.

### Continuity and Traceability

The system MUST preserve the relationship between evidence, factor assessments, opportunity dimensions, risks, strategic recommendations, actions, and eventual outcomes.

---

# 2. Reasoning Inputs and Inherited Opportunity Qualification Intelligence

## 2.1 Opportunity Qualification as the Starting Point

Pipeline Assessment begins with the qualified opportunity context inherited from the upstream Opportunity Qualification process.

This inherited information establishes the initial opportunity understanding. It is not a substitute for current opportunity evidence or a final determination of winability.

The system SHOULD use inherited information to establish continuity between qualification and opportunity assessment.

Inherited information may include:

### Customer Context

- Customer identity and organizational context.
- Industry and industry classification.
- Geography and market context.
- Customer segment and business model.

### Revenue Motion

- Revenue-motion classification.
- Relevant sales motion.
- Buying journey characteristics.
- Industry-specific commercial context.

### Business Need

- Identified business challenges.
- Customer pain points.
- Strategic objectives.
- Desired business outcomes.
- Business problem and urgency.

### Solution Context

- Proposed solution.
- Solution alignment.
- Initial value hypothesis.
- Differentiation assumptions.
- Relevant solution capabilities.

### Stakeholder Context

- Identified stakeholders.
- Decision makers and influencers.
- Potential champions.
- Stakeholder relationships.
- Initial buying-center understanding.

### Engagement Context

- Customer interactions.
- Discovery activities.
- Meetings and engagement signals.
- Available customer feedback.
- Qualification-related engagement observations.

### Qualification Intelligence

- Qualification outcome.
- Supporting evidence.
- Qualification gaps.
- Relevant confidence information, where available.

## 2.2 Current Opportunity Information

In addition to inherited qualification information, Pipeline Assessment may consume current opportunity information, including:

- Current sales stage and stage-entry date.
- Opportunity value and currency.
- Expected close date.
- Forecast category.
- Sales-cycle information.
- Customer decision milestones.
- Customer engagement history.
- Proposal and presentation status.
- Proof-of-concept or evaluation progress.
- Commercial negotiation status.
- Procurement progress.
- Legal and contractual progress.
- Security and compliance requirements.
- Internal delivery and resource readiness.

CRM fields MUST be interpreted according to their actual meaning.

For example, a CRM close date is a forecast field. It does not independently prove that the customer has committed to making a purchasing decision by that date.

## 2.3 Evidence Object, Mapping, Evidence Instance, and Interpretation

The system MUST maintain a clear distinction between four concepts.

| Concept | Definition |
|---|---|
| Evidence Object | A reusable evidence definition maintained in the Evidence Knowledge Base. |
| Evidence-to-Factor Mapping | An approved relationship connecting an evidence object to a configured SWOT factor. |
| Evidence Instance | An actual opportunity-specific observation, statement, document, customer confirmation, or system signal. |
| Runtime Interpretation | The contextual interpretation of an actual evidence instance during a particular opportunity assessment. |

An approved evidence-to-factor mapping does not establish that the corresponding evidence exists in a particular opportunity.

Similarly, the presence of an evidence instance does not automatically establish that it supports the associated factor.

The actual instance must be evaluated for relevance, credibility, recency, specificity, completeness, and consistency.

## 2.4 Contextual and Historical Information

The Industry Configuration provides contextual intelligence, including:

- Industry and revenue-motion definitions.
- SWOT factor definitions.
- Factor inheritance and evaluation guidance.
- PADF contextual relationships.
- TOWS definitions and strategic guidance.
- Industry-specific evidence expectations.

This information establishes how opportunity evidence should be interpreted. It does not prove that a particular opportunity condition exists.

Historical assessment results SHOULD be used to understand opportunity development, while preserving the distinction between actual business changes and methodology or configuration changes.

---

# 3. Context Resolution and SWOT Factor Activation

## 3.1 Authoritative Configuration

`Pipeline_industry_configuration_JSON_v1.1.json` is the authoritative source for:

- SWOT factor definitions.
- Universal, revenue-motion, and industry-specific factor configurations.
- Factor inheritance and contextual overrides.
- Factor evaluation guidance.
- PADF contextual relationships.
- TOWS definitions and configuration.

`Pipeline_Assessment_Rules_v1.1.json` governs deterministic runtime execution and validation of the relevant configuration.

Gemini MAY interpret resolved configuration and explain its business implications, but MUST NOT independently select a different factor set or change the configured inheritance precedence.

## 3.2 Three-Layer Inheritance Model

The active SWOT factor configuration follows a three-layer inheritance model:

1. Universal baseline.
2. Revenue-motion override.
3. Industry-specific override.

The precedence is:

**Industry-specific configuration > Revenue-motion configuration > Universal baseline.**

The runtime context-resolution process MUST:

1. Load the applicable universal baseline.
2. Identify the opportunity's canonical revenue-motion classification.
3. Apply the matching enabled revenue-motion configuration.
4. Identify the opportunity's canonical industry classification.
5. Apply the matching enabled industry-specific configuration.
6. Resolve explicit overrides according to the configured precedence.
7. Preserve unrelated baseline configuration.
8. Exclude disabled or inapplicable overrides.
9. Preserve the source and lineage of resolved configuration.

The runtime MUST NOT silently change an opportunity's industry or revenue-motion classification.

## 3.3 Canonical Revenue-Motion Identifiers

The following canonical revenue-motion identifiers MUST be used:

| Canonical ID | Revenue Motion |
|---|---|
| `RM01_Digital_Solution_Selling` | Digital Solution Selling |
| `RM02_Professional_Solution_Services` | Professional & Solution Services |
| `RM03_Digital_Transformation_OT` | Digital Transformation & OT |
| `RM04_Engineering_Project_Solutions` | Engineering & Project Solutions |
| `RM05_Project_Procurement` | Project & Procurement |
| `RM06_Generic_Solution_Selling` | Generic Solution Selling |

Legacy aliases MUST be resolved through an explicit compatibility registry.

Array position, approximate naming similarity, or fuzzy matching MUST NOT be used as a substitute for canonical identifier resolution.

## 3.4 Configured SWOT Factor Universe

The Industry Configuration v1.1 contains the following configured factor universe:

| Configuration Layer | Configured Factor References |
|---|---:|
| Universal | 8 |
| Revenue Motion | 24 |
| Industry Specific | 64 |
| **Total** | **96** |

The runtime active factor set for an opportunity is:

| Active Configuration Layer | Active Factors |
|---|---:|
| Universal | 8 |
| Applicable Revenue Motion | 4 |
| Applicable Industry | 4 |
| **Total Active Factors** | **16** |

The configured universe and the runtime active set MUST NOT be confused.

A configured factor represents an analytical lens or evaluation hypothesis. It is not proof that the corresponding condition exists in the opportunity.

## 3.5 SWOT Classification Principles

The four SWOT classifications represent different types of business conditions:

| Classification | Interpretation |
|---|---|
| Strength | An evidenced internal capability, advantage, or position that contributes to winning. |
| Weakness | An evidenced internal limitation or deficiency that impairs the ability to win. |
| Opportunity | An evidenced external favorable condition that may create an advantage or improve the chance of winning. |
| Threat | An evidenced external adverse condition that may undermine the opportunity or reduce the chance of winning. |

Classification MUST be based on the configured factor definition and the actual opportunity context.

Evidence polarity alone MUST NOT determine SWOT classification.

## 3.6 Relationship with PADF

The existing Pipeline Assessment Dimensions Framework (PADF) remains the primary opportunity assessment framework.

Its eight dimensions remain unchanged:

| ID | Dimension |
|---|---|
| `PA1_Customer_Value_and_Urgency` | Customer Value & Urgency |
| `PA2_Buying_Center_and_Influence` | Buying Center & Influence |
| `PA3_Buying_Process_and_Decision_Control` | Buying Process & Decision Control |
| `PA4_Solution_and_Value_Proposition` | Solution & Value Proposition |
| `PA5_Competitive_Position` | Competitive Position |
| `PA6_Commercial_and_Deal_Structure` | Commercial & Deal Structure |
| `PA7_Sales_Execution_and_Deal_Readiness` | Sales Execution & Deal Readiness |
| `PA8_Deal_Momentum_Risk_and_Closeability` | Deal Momentum, Risk & Closeability |

PADIF v1.0 governs inherited upstream opportunity qualification information.

SWOT intelligence enriches PADF by providing additional contextual insight into the conditions influencing each dimension.

The relationship between SWOT factors and PADF dimensions is contextual and many-to-many.

SWOT MUST NOT:

- Replace PADF.
- Introduce additional PADF dimensions.
- Change PADF dimension identifiers.
- Create an alternative PADF scoring framework.
- Independently redefine PADF assessment thresholds.

---

# 4. Evidence Intelligence Methodology

## 4.1 Evidence Knowledge Base v1.1

`Pipeline_evidence_knowledge_base_v1.1.json` provides the reusable evidence definitions and approved evidence-to-SWOT-factor mapping catalogue.

Its current mapping coverage is:

| Item | Count |
|---|---:|
| Evidence Objects | 48 |
| Total Evidence-to-SWOT Mappings | 373 |
| DIRECT Mappings | 169 |
| SUPPORTING Mappings | 87 |
| INDIRECT Mappings | 117 |
| SWOT Factor References Covered | 82 |
| SWOT Factor References Without Current Mapping | 14 |

The 14 currently unmapped factor references MUST remain visible as evidence-coverage gaps.

The system MUST NOT invent additional mappings merely to achieve complete mapping coverage.

These figures describe the current v1.1 asset and MUST be treated as version-specific metadata.

## 4.2 Mapping Strength

The mapping strength describes the intended relationship between an evidence object and a SWOT factor.

| Mapping Strength | Interpretation |
|---|---|
| DIRECT | The evidence object is directly relevant to evaluating the factor. |
| SUPPORTING | The evidence object provides supporting information that strengthens or qualifies the evaluation. |
| INDIRECT | The evidence object provides contextual or secondary information that may influence interpretation. |

Mapping strength does not establish:

- Evidence quality.
- Evidence confidence.
- Evidence polarity.
- Whether an evidence instance exists.
- Whether a factor is supported or contradicted.
- Whether a factor should be classified as Strength, Weakness, Opportunity, or Threat.

A DIRECT mapping may be highly relevant, but the actual evidence instance still needs to be evaluated.

SUPPORTING and INDIRECT evidence may provide useful corroboration or context, but MUST NOT automatically be treated as sufficient proof.

## 4.3 Evidence Quality Assessment

Evidence quality concerns the reliability and usefulness of an actual evidence instance.

The reasoning process SHOULD consider:

- Source credibility.
- Customer confirmation.
- Specificity.
- Verifiability.
- Recency.
- Consistency with other evidence.
- Directness of the observation.
- Completeness of the information.
- Relevance to the opportunity.
- Applicability to the configured factor.

The authoritative configuration and Rules asset govern any deterministic thresholds or eligibility requirements.

Gemini MAY explain evidence quality and limitations, but MUST NOT invent numerical thresholds or override configured evaluation rules.

## 4.4 Runtime Evidence Relationships

The runtime interpretation of an evidence instance MUST distinguish the following relationship types:

| Relationship | Meaning |
|---|---|
| `SUPPORTS` | The evidence supports the relevant proposition or factor. |
| `CONTRADICTS` | The evidence conflicts with the relevant proposition or factor. |
| `QUALIFIES` | The evidence limits, narrows, or adds conditions to the interpretation. |
| `CONTEXTUALIZES` | The evidence provides background or context relevant to interpretation. |
| `GAP_SIGNAL` | The evidence indicates missing or insufficient information. |
| `CHANGE_SIGNAL` | The evidence indicates a change in an existing opportunity condition. |

These are runtime interpretation relationships.

They MUST NOT be treated as fixed properties of reusable evidence objects or mappings.

The same evidence object may produce different runtime relationships depending on the actual instance and opportunity context.

## 4.5 Runtime Evidence Polarity

The runtime interpretation MUST distinguish:

| Polarity | Meaning |
|---|---|
| `POSITIVE` | The evidence indicates a favorable condition relative to the evaluated proposition. |
| `NEGATIVE` | The evidence indicates an unfavorable condition relative to the evaluated proposition. |
| `MIXED` | The evidence contains both favorable and unfavorable signals. |
| `NEUTRAL` | The evidence does not materially indicate a favorable or unfavorable condition. |
| `UNDETERMINED` | Available information is insufficient to establish polarity. |

Polarity describes the meaning of an actual evidence instance relative to a particular proposition.

It does not independently establish SWOT classification.

For example, a negative customer statement may indicate a weakness in the proposed solution, a threat from a competitor, or simply a qualification of an earlier assumption. The correct interpretation depends on the actual factor definition and business context.

## 4.6 Evidence Confidence and Confidence Scales

The source assets contain different confidence representations.

| Source | Confidence Representation |
|---|---|
| Evidence Knowledge Base v1.1 | 0–100 scale |
| Industry Configuration v1.1 | `evidence_confidence` using a 1–5 ordinal scale |

These scales MUST remain distinct.

The system MUST NOT automatically convert, equate, average, or combine them unless an explicit approved compatibility and calculation contract defines the relationship.

Evidence confidence MUST also remain distinct from:

- Mapping strength.
- Evidence quality.
- Runtime polarity.
- Factor assessment outcome.
- Winability probability.
- TOWS strategic relevance.

Heuristic semantic relevance scores, where present, are screening or retrieval metadata. They MUST NOT be interpreted as evidence confidence, probability, quality, or proof.

## 4.7 Evidence Gaps and Missing Information

Evidence gaps are important assessment findings.

The system SHOULD distinguish:

1. **Missing evidence** — No relevant evidence instance is available.
2. **Insufficient evidence** — Available information does not support a reliable conclusion.
3. **Stale evidence** — Evidence may no longer reflect the current opportunity condition.
4. **Contradictory evidence** — Available instances produce conflicting interpretations.
5. **Unmapped factor** — No approved evidence mapping currently exists for the factor.
6. **Unresolved context** — The evidence cannot be confidently interpreted because industry, revenue motion, source, or applicability is unclear.

Missing evidence MUST NOT automatically be interpreted as negative evidence.

Where the existing data contract supports it, the system SHOULD identify:

- The missing information.
- Why it matters.
- The relevant factor or PADF dimension.
- The validation question.
- The recommended evidence-gathering action.
- Priority and ownership, where defined by the existing workflow.

## 4.8 Evidence Traceability

Every material factor assessment SHOULD be traceable through the following chain:

**Opportunity Evidence Instance → Evidence Object → Approved Mapping → Canonical SWOT Factor → Factor Evaluation → PADF Relationship → TOWS or Risk/Strategy Handoff**

The system SHOULD preserve:

- Evidence instance identifier.
- Evidence object identifier.
- Original mapping identifier.
- Canonical factor identifier.
- Source and provenance.
- Evidence timestamp or recency information.
- Context and applicability.
- Configuration and asset versions.
- Runtime interpretation.
- Resulting assessment implications.

Where a relationship cannot be established, the system MUST disclose the missing link rather than fabricate one.

---

# 5. PADF Assessment Reasoning

## 5.1 PADF as the Primary Assessment Framework

PADF remains the primary framework for assessing the overall condition of an opportunity.

The eight dimensions provide the structured assessment foundation.

SWOT intelligence enriches the explanation of each dimension by identifying the underlying strengths, weaknesses, opportunities, threats, and evidence gaps that influence it.

SWOT MUST NOT replace PADF or independently recalculate its results.

## 5.2 Dimension-Level Reasoning

For each PADF dimension, the reasoning process SHOULD connect:

1. The existing deterministic dimension result.
2. Relevant opportunity evidence.
3. Evidence quality, recency, and contradictions.
4. Inherited qualification information.
5. Relevant industry and revenue-motion context.
6. Associated active SWOT factors.
7. The business implications of the observed conditions.

The existing PADF configuration and Rules asset remain authoritative for dimension scoring, thresholds, assessment states, and calculations.

Gemini SHOULD focus on explaining why the dimension is in its current condition and what the sales team should understand or do.

## 5.3 SWOT-to-PADF Relationships

The relationship between SWOT factors and PADF dimensions is contextual and many-to-many.

A single SWOT factor may influence multiple PADF dimensions.

A PADF dimension may also be influenced by multiple SWOT factors.

These relationships provide analytical enrichment and explanatory traceability.

They MUST NOT be interpreted as additional PADF dimensions or independent scoring mechanisms.

## 5.4 Cross-Dimensional Reasoning

Gemini SHOULD identify meaningful interactions between PADF dimensions.

Examples include:

- Strong solution alignment combined with weak executive sponsorship.
- Confirmed customer value combined with an unclear buying process.
- Strong customer engagement combined with unvalidated commercial readiness.
- Positive competitive differentiation combined with weak procurement control.
- Good deal momentum combined with unresolved delivery or resource constraints.

These are reasoning patterns, not predefined scoring formulas.

Any numerical impact or adjustment MUST be governed by the authoritative deterministic rules.

---

# 6. SWOT Intelligence Methodology

## 6.1 Purpose

SWOT Intelligence provides a structured interpretation of the internal and external conditions influencing an opportunity.

It uses the active SWOT factors resolved from Industry Configuration v1.1 and the approved evidence mappings defined in Evidence Knowledge Base v1.1.

Its purpose is to explain the conditions that support or undermine the opportunity and identify the strategic implications.

## 6.2 Factor-Level Assessment Process

For each active SWOT factor, the reasoning process SHOULD:

1. Resolve the canonical factor identifier.
2. Retrieve the applicable factor definition and configuration.
3. Identify approved evidence-to-factor mappings.
4. Retrieve available opportunity evidence instances.
5. Evaluate evidence relevance and applicability.
6. Consider source credibility, specificity, recency, confirmation, consistency, and completeness.
7. Determine the runtime relationship between evidence and factor.
8. Determine runtime polarity where supported.
9. Identify supporting and contradictory evidence.
10. Identify evidence gaps and changes.
11. Evaluate the factor using the configured evaluation guidance and deterministic rules.
12. Explain the resulting interpretation and its business implications.

The presence of a configured factor or approved mapping alone MUST NOT establish a factor assessment result.

## 6.3 Factor Assessment Interpretation

The reasoning layer SHOULD distinguish the following explanatory conditions:

- Supported or evidenced.
- Partially supported.
- Contradicted or weakened.
- Unverified or insufficiently evidenced.
- Not applicable.
- Unable to assess because of an evidence or context gap.

These descriptions are explanatory concepts.

The implementation MUST use the authoritative enums and output contracts defined in the source assets. It MUST NOT introduce new runtime enum values without an approved schema change.

## 6.4 Factor Assessment Integrity

The system MUST NOT:

- Classify a factor solely from evidence polarity.
- Treat every positive observation as a Strength.
- Treat every negative observation as a Weakness.
- Treat every external positive signal as an Opportunity.
- Treat every external negative signal as a Threat.
- Treat missing evidence as a negative finding.
- Infer unsupported factor conclusions from industry assumptions.

Factor classification must follow the actual configured definition and opportunity context.

## 6.5 SWOT Summary

The system SHOULD generate a consolidated SWOT interpretation that explains:

- The most material strengths contributing to winability.
- The most significant weaknesses limiting opportunity progress.
- External opportunities that may improve the chance of winning.
- External threats that may undermine the opportunity.
- Important contradictions and evidence gaps.
- The implications for opportunity strategy and execution.

A universal composite SWOT score MUST NOT be introduced unless explicitly defined in the authoritative configuration or Rules asset.

SWOT summaries are analytical outputs, not replacements for PADF, winability, or Risk Intelligence.

---

# 7. TOWS Strategic Reasoning

## 7.1 Purpose

TOWS translates supported SWOT findings into strategic response options.

It moves the reasoning process from identifying opportunity conditions to understanding how the sales team can respond to them.

The four TOWS combinations are:

| TOWS Type | Combination | Strategic Intent |
|---|---|---|
| SO | Strengths + Opportunities | Use internal strengths to capture favorable external opportunities. |
| WO | Weaknesses + Opportunities | Address internal weaknesses to unlock external opportunities. |
| ST | Strengths + Threats | Use internal strengths to counter or mitigate external threats. |
| WT | Weaknesses + Threats | Reduce exposure arising from internal weaknesses and external threats. |

## 7.2 TOWS Candidate Generation

A TOWS candidate SHOULD only be generated when the underlying factors have been evaluated and have sufficient evidential support.

For each candidate, the reasoning process SHOULD identify:

- Relevant SWOT factor identifiers.
- Relevant evidence instances.
- Approved evidence-to-factor mapping lineage.
- Why the factors are strategically related.
- The relevant customer and competitive circumstances.
- The strategic objective.
- Feasibility and execution considerations.
- Required dependencies and resources.
- Material uncertainties.

The system MUST NOT force all four TOWS combinations when the evidence does not justify them.

## 7.3 TOWS Configuration and Execution

Industry Configuration v1.1 provides the authoritative TOWS definitions and contextual guidance.

Rules v1.1 governs the deterministic integration and execution requirements.

Gemini provides the contextual strategic reasoning and explanation.

TOWS is an enrichment mechanism for the existing Winning Strategy engine. It is not a replacement strategy engine or an independent strategy-prioritization framework.

## 7.4 TOWS-to-Winning-Strategy Handoff

Where supported by the existing strategy contract, the TOWS handoff SHOULD preserve the following conceptual information:

| Field | Purpose |
|---|---|
| `strategy_id` | Identifier of the strategy record. |
| `strategy_type` | Relevant strategy classification. |
| `strategic_objective` | Intended strategic outcome. |
| `supporting_swot_factor_ids` | SWOT factors supporting the strategy. |
| `supporting_evidence_ids` | Evidence supporting the strategic rationale. |
| `strategic_rationale` | Explanation of why the strategy is appropriate. |
| `expected_winability_impact` | Expected directional impact, where supported. |
| `required_actions` | Actions needed to execute the strategy. |
| `required_resources` | Resources required, where known. |
| `priority` | Priority governed by the existing strategy logic. |
| `execution_timeframe` | Expected execution timeframe, where established. |
| `success_indicators` | Indicators for assessing progress. |
| `status` | Existing strategy lifecycle status. |

The exact field names, requiredness, types, and enums MUST follow the authoritative existing schema and Rules contract.

### Unresolved Strategy Crosswalk

The relationship between Evidence Knowledge Base strategy categories and Industry Configuration strategy identifiers remains unresolved.

The system MUST NOT invent a crosswalk or infer one from naming similarity.

Any future mapping requires an explicit, approved compatibility definition.

---

# 8. Winability and Risk Intelligence Integration

## 8.1 Winability Assessment

The existing winability methodology remains authoritative.

SWOT intelligence, evidence interpretation, and TOWS reasoning MAY provide supporting inputs where permitted by the existing data contract.

However, Gemini MUST NOT:

- Replace the existing winability formula.
- Independently recalculate winability.
- Introduce new winability weights or thresholds.
- Override deterministic winability outputs.
- Present an AI-generated estimate as the authoritative winability result.

Gemini SHOULD explain the factors and evidence that contribute to the existing winability assessment.

## 8.2 Winability and Risk Dependency

The business dependency sequence is:

1. **Phase 6 — Base Winability Assessment.**
2. **Phase 7 — Risk Evaluation.**
3. **Phase 7 — Risk-Adjusted Winability.**
4. **Phase 8 — Winning Strategy.**

The risk-adjusted winability result MUST be produced after the relevant risk evaluation.

The Winning Strategy engine SHOULD consume the risk-adjusted winability result where defined by its existing contract.

The ten execution domains defined in Rules v1.1 represent runtime orchestration responsibilities. They MUST NOT be confused with the business phase labels above.

The detailed runtime dependency graph and execution rules are governed by `Pipeline_Assessment_Rules_v1.1.json`.

## 8.3 Risk Intelligence Integration

The existing Risk Intelligence engine remains authoritative for formal opportunity risk identification and evaluation.

SWOT intelligence may identify a weakness or threat that warrants risk review.

However:

- A SWOT Weakness is not automatically a formal risk.
- A SWOT Threat is not automatically a formal risk.
- A formal risk must follow the existing Risk Intelligence definitions and lifecycle.
- Shared evidence references MAY be used where supported.
- SWOT MUST NOT create duplicate formal risk records.
- Existing risk schemas, thresholds, scoring, and lifecycle rules MUST remain authoritative.

Gemini MAY explain the relationship between a SWOT finding and an existing risk.

It MUST NOT independently create alternative risk scoring or risk-adjustment formulas.

### Unresolved Risk Crosswalk

The relationship between Evidence Knowledge Base risk triggers and Industry Configuration risk patterns remains unresolved.

The system MUST NOT invent a mapping between these categories.

Any future crosswalk requires an explicit approved mapping contract.

## 8.4 Risk-Adjusted Winability Explanation

Gemini SHOULD explain:

- The existing base winability result.
- The material risks identified by the Risk Intelligence engine.
- The deterministic impact of those risks, where available.
- The resulting risk-adjusted winability.
- The strategic implications for opportunity execution.

The explanation MUST preserve the deterministic output and its provenance.

---

# 9. Winning Strategy and Action Recommendation Intelligence

## 9.1 Existing Winning Strategy Engine

The existing Winning Strategy engine remains authoritative for strategic output and prioritization.

TOWS provides additional evidence-based strategic inputs.

The integrated strategy should connect:

- Customer objectives and desired business outcomes.
- Opportunity-specific business conditions.
- Competitive circumstances.
- Supported SWOT factors.
- Formal opportunity risks.
- Risk-adjusted winability.
- Feasible strategic responses.
- Required actions and execution dependencies.

The strategy should address how the sales team can improve both the probability and quality of winning.

## 9.2 Action Recommendation

Where supported by the existing strategy contract, each recommended action SHOULD identify:

- Action description.
- Strategic rationale.
- Supporting evidence.
- Related SWOT factors.
- Expected business outcome.
- Priority.
- Owner, where established.
- Timing.
- Dependencies.
- Required resources.
- Success indicator.
- Execution status.
- Historical progress.

The system MUST NOT fabricate action owners, dates, resource availability, or quantified business impacts.

Unknown information SHOULD be explicitly identified.

## 9.3 Expected Strategic Impact

Expected impact may be described directionally where a validated numerical calculation is unavailable.

For example:

- Improve stakeholder alignment.
- Reduce competitive exposure.
- Strengthen customer value confirmation.
- Improve commercial readiness.
- Resolve a critical buying-process gap.
- Improve execution readiness.

A numerical winability uplift MUST NOT be invented by Gemini.

Such an uplift may only be reported where supported by a validated deterministic calculation or an approved existing output.

## 9.4 Strategy Prioritization

Strategy prioritization MUST follow the existing Winning Strategy and Rules contracts.

Gemini MAY explain trade-offs, feasibility, dependencies, and strategic rationale.

It MUST NOT introduce a parallel prioritization formula or override deterministic priority outputs.

---

# 10. Longitudinal Pipeline Intelligence

## 10.1 Continuous Assessment

Pipeline Assessment is intended to operate throughout the opportunity lifecycle.

Each assessment MUST be associated with its execution context and assessment time.

The system SHOULD preserve the ability to compare successive assessments and understand how the opportunity has evolved.

## 10.2 Change Tracking

The longitudinal intelligence layer SHOULD track changes in:

- Evidence availability and quality.
- Evidence recency and validity.
- Evidence relationships and polarity.
- PADF dimension results.
- SWOT factor assessments.
- Evidence gaps and contradictions.
- Base winability.
- Formal risk assessments.
- Risk-adjusted winability.
- TOWS strategic findings.
- Winning Strategy recommendations.
- Action execution and outcomes.

## 10.3 Change Attribution

The system SHOULD distinguish between:

1. Actual opportunity changes.
2. New or updated evidence.
3. Changes in customer circumstances.
4. Changes in competitive conditions.
5. Changes in industry or revenue-motion context.
6. Changes in configuration or methodology.
7. Changes resulting from human review or override.

This distinction is necessary to prevent methodology changes from being incorrectly presented as changes in opportunity performance.

## 10.4 Historical Assessment Integrity

Historical assessment records SHOULD retain the relevant versions of:

- Industry Configuration.
- Evidence Knowledge Base.
- Rules.
- PADF and PADIF.
- Reasoning prompts and model configuration, where available.

Historical results MUST NOT be silently recalculated using newer methodology and presented as if they were the original assessment.

Any historical recalculation or migration MUST preserve the original result and identify the new methodology version.

## 10.5 Continuous Improvement

Historical outcomes MAY inform future methodology improvements.

However, historical observations MUST NOT silently change:

- Approved evidence mappings.
- SWOT factor definitions.
- Assessment thresholds.
- Deterministic calculation rules.
- Risk logic.
- Winning Strategy logic.

Any methodology change requires formal review, version control, approval, and regression testing.

---

# 11. Confidence, Governance, and Explainability

## 11.1 Confidence Separation

The system MUST distinguish different forms of confidence and uncertainty.

| Concept | Meaning |
|---|---|
| Evidence Confidence | Confidence associated with the evidence representation in its source asset. |
| Evidence Quality | Reliability, completeness, and usefulness of an actual evidence instance. |
| Factor Interpretation Uncertainty | Uncertainty about what the evidence means for a particular factor. |
| Explanation Confidence | Confidence in the AI-generated interpretation, where explicitly supported. |
| Winability Output | The authoritative result of the existing winability methodology. |

These concepts MUST NOT be conflated or combined without an explicit approved contract.

In particular, evidence confidence MUST NOT automatically be interpreted as winability probability.

## 11.2 Explainability Requirements

Every material AI-generated conclusion SHOULD provide a traceable explanation.

The preferred reasoning chain is:

**Evidence → Interpretation → Factor or Dimension Implication → Business Impact → Assessment or Strategy Implication**

The system SHOULD make clear:

- Which evidence supports the conclusion.
- Which evidence contradicts it.
- What assumptions are involved.
- What information is missing.
- Why the finding matters.
- What the sales team should validate or do next.

## 11.3 Human Review and Override

Where the existing system supports human review or override, the system SHOULD preserve:

- Original value.
- Revised value.
- Reviewer identity and role.
- Review timestamp.
- Justification.
- Relevant methodology versions.
- Resulting assessment state.

Gemini MUST NOT silently override human-reviewed or deterministic outputs.

## 11.4 AI Governance

Gemini MUST:

- Use the supplied opportunity data and approved source assets.
- Avoid fabricating evidence, customer statements, or competitive information.
- Distinguish facts from interpretations and assumptions.
- Preserve uncertainty and evidence gaps.
- Respect canonical identifiers and configured classifications.
- Avoid inventing thresholds, weights, or mapping relationships.
- Explain material conclusions.
- Follow the required output schema.
- Respect deterministic calculation and execution boundaries.

---

# 12. Canonical Reasoning Output Architecture

## 12.1 Purpose

This section defines the conceptual reasoning output architecture.

It does not replace or redefine the authoritative JSON output schemas, field definitions, or requiredness rules.

Exact field names, types, enums, and validation requirements MUST follow the existing Rules and implementation contracts.

The conceptual output should cover the following areas.

## 12.2 Assessment Identity and Context

Should preserve:

- Assessment execution identifier.
- Opportunity identifier.
- Assessment timestamp.
- Industry and revenue-motion context.
- Active SWOT factor set.
- Configuration inheritance lineage.
- Source asset versions.

## 12.3 Executive Summary

Should explain:

- Overall opportunity position.
- Deterministic pipeline health and winability outputs.
- Most important positive drivers.
- Most important constraints.
- Material risks.
- Evidence gaps and uncertainties.
- Primary strategic focus.

## 12.4 Evidence Profile

Should preserve:

- Opportunity evidence instances.
- Evidence provenance.
- Evidence object references.
- Mapping references.
- Mapping strength.
- Runtime relationship and polarity.
- Evidence quality and confidence information.
- Contradictions.
- Missing or stale evidence.

## 12.5 PADF Assessment Profile

Should include:

- The eight PADF dimensions.
- Existing deterministic dimension results.
- Relevant evidence.
- Contextual SWOT factor references.
- Dimension-level explanations.
- Material gaps and uncertainties.

## 12.6 SWOT Factor Assessment

Should include:

- Canonical factor identifiers.
- Factor definitions.
- Configuration layer and provenance.
- Approved evidence mappings.
- Actual supporting evidence instances.
- Runtime relationships and polarity.
- Factor evaluation and rationale.
- Confidence and uncertainty information.
- Evidence gaps and contradictions.

## 12.7 TOWS Strategic Intelligence

Should include:

- Eligible TOWS combinations.
- Supporting SWOT factor identifiers.
- Supporting evidence references.
- Strategic rationale.
- Strategic objectives.
- Feasibility considerations.
- Dependencies and resource requirements.
- Unresolved information.

## 12.8 Winability and Risk Intelligence

Should preserve:

- Existing base winability output.
- Existing formal risk assessment.
- Risk-adjusted winability.
- Deterministic calculation provenance.
- AI-generated explanation of material drivers.

## 12.9 Winning Strategy and Actions

Should preserve:

- Existing strategy engine outputs.
- TOWS-derived inputs.
- Strategic objectives.
- Required actions.
- Owners and timing, where known.
- Dependencies.
- Success indicators.
- Execution status.

## 12.10 Longitudinal and Governance Information

Should preserve:

- Previous assessment references.
- Material changes.
- Change attribution.
- Source asset versions.
- Traceability information.
- Validation results.
- Human overrides.
- Unresolved exceptions.

---

# 13. Runtime and Reasoning Architecture Boundaries

## 13.1 Component Responsibility Matrix

The following matrix establishes the responsibilities of each authoritative component.

| Component | Authoritative Responsibility | Gemini Responsibility |
|---|---|---|
| Industry Configuration | SWOT factor definitions, inheritance, contextual evaluation, PADF relationships, TOWS configuration. | Interpret configured context and explain business implications. |
| Evidence Knowledge Base | Evidence object definitions, approved mappings, mapping scope, mapping strength, and evidence contracts. | Interpret actual evidence instances and explain their relationship to configured factors. |
| Rules | Runtime orchestration, deterministic validation, calculations, eligibility, gates, risk, winability, strategy integration, lifecycle, and audit. | Explain deterministic results without overriding them. |
| PADF / PADIF | Assessment dimensions and inherited qualification data structure. | Explain dimension-level findings and inherited information. |
| Risk Intelligence | Formal risk identification, assessment, and lifecycle. | Explain risks and their implications. |
| Winning Strategy | Existing strategy generation, prioritization, and output. | Enrich strategic reasoning through approved TOWS inputs. |
| Gemini Reasoning | No independent authority over deterministic rules or source schemas. | Evidence interpretation, diagnosis, explanation, cross-dimensional reasoning, TOWS rationale, and executive recommendations. |

## 13.2 Business Reasoning vs. Runtime Execution

The business reasoning methodology and the Rules execution sequence are related but distinct.

The business reasoning methodology explains how opportunity intelligence should be interpreted.

Rules v1.1 defines how the system executes the relevant operations.

The Rules asset organizes execution across ten domains:

1. Context resolution.
2. Data validation.
3. Evidence evaluation.
4. Dimension assessment.
5. Cross-dimension adjustment.
6. Winability assessment.
7. Risk assessment.
8. Strategy generation.
9. Lifecycle management.
10. Output and audit.

The exact execution order, dependencies, and gates MUST follow Rules v1.1.

The above list MUST NOT be used to invent a new runtime sequence or replace the business Phase 6, Phase 7, and Phase 8 dependencies described in Section 8.

## 13.3 Deterministic and AI Responsibilities

### Deterministic Responsibilities

The Rules and authoritative source assets govern:

- Context resolution.
- Canonical identifier validation.
- Schema and data validation.
- Evidence eligibility and configured thresholds.
- PADF calculations.
- Explicitly configured factor operations.
- Winability calculations.
- Formal risk evaluation.
- Risk aggregation and risk adjustment.
- Strategy eligibility and prioritization, where defined.
- Lifecycle transitions.
- Output validation.
- Audit and traceability requirements.

### Gemini Responsibilities

Gemini is responsible for:

- Interpreting actual opportunity evidence.
- Explaining evidence relationships.
- Explaining PADF dimension results.
- Synthesizing SWOT findings.
- Identifying meaningful cross-dimensional relationships.
- Explaining uncertainty and evidence gaps.
- Generating TOWS strategic rationale.
- Explaining risk and winability implications.
- Producing executive-level explanations.
- Recommending evidence-based actions within the existing strategy contract.

If an operation is not defined by an authoritative rule or contract, Gemini MUST NOT invent a deterministic calculation or execution rule.

---

# 14. Mandatory Reasoning Principles

The following principles are mandatory across the Pipeline Assessment reasoning architecture.

| No. | Principle | Requirement |
|---|---|---|
| 1 | Missing Evidence Is Not Negative Evidence | Absence of evidence MUST NOT automatically be interpreted as an unfavorable condition. |
| 2 | Configuration Is Not Proof | A configured SWOT factor does not establish that the factor exists in an opportunity. |
| 3 | No Fixed Evidence Polarity | Reusable evidence objects and mappings MUST NOT carry a universal runtime polarity. |
| 4 | Mapping Strength Is Not Evidence Quality | DIRECT, SUPPORTING, and INDIRECT MUST remain distinct from evidence quality and confidence. |
| 5 | No Unapproved Confidence Conversion | The 0–100 and 1–5 confidence representations MUST NOT be automatically converted or combined. |
| 6 | Heuristic Relevance Is Not Confidence | Semantic relevance scores MUST NOT be interpreted as probability, confidence, or evidence quality. |
| 7 | No Forced Mapping | The 14 currently unmapped factor references MUST NOT receive invented mappings. |
| 8 | Polarity Does Not Determine SWOT | Evidence polarity alone MUST NOT determine Strength, Weakness, Opportunity, or Threat. |
| 9 | No Unapproved Composite SWOT Score | A universal composite SWOT score MUST NOT be introduced without an authoritative rule. |
| 10 | PADF Remains Unchanged | SWOT MUST NOT replace or redefine the eight PADF dimensions. |
| 11 | SWOT Is Not Formal Risk | A SWOT Weakness or Threat MUST NOT automatically become a formal risk record. |
| 12 | No Replacement Winability Formula | Gemini MUST NOT replace or override the existing winability methodology. |
| 13 | No Parallel Strategy Engine | TOWS MUST enrich the existing Winning Strategy engine, not replace it. |
| 14 | No Fabricated Crosswalks | Unresolved mappings MUST remain unresolved until formally approved. |
| 15 | Preserve IDs and Provenance | Source identifiers, canonical identifiers, and lineage MUST be preserved. |
| 16 | Distinguish Knowledge Types | Facts, interpretations, assumptions, unknowns, and recommendations MUST remain distinguishable. |
| 17 | Disclose Contradictions and Gaps | Material evidence gaps and contradictions MUST NOT be hidden. |
| 18 | Explain Material Conclusions | Material findings MUST have a traceable rationale. |
| 19 | Preserve Deterministic Outputs | AI reasoning MUST NOT silently override Rules outputs or approved human decisions. |
| 20 | Separate Business Changes from Methodology Changes | Historical comparisons MUST distinguish actual opportunity changes from configuration or methodology changes. |

---

# 15. Version Dependencies and Change Governance

## 15.1 Authoritative Asset Baseline

The v1.1 reasoning architecture depends on the following assets:

| Asset | Version | Status / Role |
|---|---|---|
| Pipeline Assessment Dimensions Framework | v1.0 | Existing authoritative dimension framework. |
| Pipeline Assessment Data Inheritance Framework | v1.0 | Existing authoritative inheritance framework. |
| Pipeline Evidence Knowledge Base | v1.1 | Evidence objects and approved SWOT mappings. |
| Pipeline Industry Configuration | v1.1 | SWOT factors, inheritance, evaluation, PADF context, and TOWS configuration. |
| Pipeline Assessment Rules | v1.1 | Runtime orchestration and deterministic execution; draft pending Stage 6 validation. |
| Pipeline SWOT Intelligence Master Schema | v1.0 | Related SWOT intelligence schema reference. |

The version and status of each asset MUST be preserved accurately.

The fact that an asset is used as an authoritative design input does not imply that it has passed all validation stages.

In particular, Rules v1.1 MUST NOT be described as fully validated or production-ready while Stage 6 validation remains outstanding.

## 15.2 Identifier Compatibility and Normalization

The implementation MUST use explicit identifier compatibility rules.

The following known compatibility relationships must be preserved:

| Legacy / Source Identifier | Canonical Identifier |
|---|---|
| `RMF_01` through `RMF_06` | `RM01` through `RM06` canonical revenue-motion identifiers |
| `IND_01` through `IND_16` | Corresponding canonical industry identifiers |
| `PA1` through `PA8` | Corresponding canonical PADF identifiers |

The exact alias-to-canonical mapping MUST be maintained in an explicit compatibility registry.

The system MUST NOT use array order, approximate string matching, or inferred naming relationships to resolve identifiers.

### Evidence Identifier Compatibility

The Evidence Knowledge Base mapping catalogue uses `evidenceId`, while individual evidence objects use `evidenceObjectId`.

This difference MUST be handled through an explicit normalization or compatibility contract.

The implementation MUST preserve the original source field and resolve it to the correct evidence object through the approved registry.

It MUST NOT assume the two fields are interchangeable without an explicit mapping definition.

## 15.3 Rules v1.1 Status and Identifier Governance

Rules v1.1 was generated in Stage 5 and remains pending comprehensive Stage 6 validation.

Its status MUST be represented accurately.

The new SWOT integration rules use the RSW namespace and qualified identifiers in the following form:

`Rules.v1.1.SWOTIntegration.<domain>.<ruleId>`

Existing legacy identifiers and duplicate identifier collisions have been retained in the source asset.

The existence of legacy duplicates MUST NOT be addressed through arbitrary renaming during the redevelopment of these Markdown documents.

New rules MUST preserve their distinct identifiers and follow the approved namespace convention.

## 15.4 Unresolved Crosswalks

The following crosswalks remain unresolved:

1. Evidence Knowledge Base strategy categories → Industry Configuration strategy identifiers.
2. Evidence Knowledge Base risk triggers → Industry Configuration risk patterns.

The reasoning architecture MUST explicitly preserve these unresolved relationships.

No implementation prompt or AI reasoning instruction may fabricate the missing mappings.

Any future resolution requires:

- An explicit mapping definition.
- Documented rationale.
- Identified ownership.
- Approval.
- Version control.
- Compatibility testing.
- Regression testing.

## 15.5 Change Control

Any change to the authoritative JSON assets or reasoning methodology SHOULD include:

1. Impact analysis across the six Markdown assets.
2. Identification of affected schemas and contracts.
3. Review of identifier compatibility.
4. Assessment of runtime and data dependencies.
5. Explicit owner approval.
6. Version and change-record updates.
7. Compatibility and regression testing.
8. A historical lineage or migration strategy where required.

---

# 16. Acceptance Criteria

The Pipeline Reasoning Strategy Specification v1.1 is acceptable when the following requirements are satisfied.

| No. | Acceptance Criterion |
|---|---|
| 1 | Preserves Pipeline Assessment as a continuous revenue-intelligence and winability optimization system. |
| 2 | Retains the five fundamental business questions. |
| 3 | Establishes inherited Opportunity Qualification information as the starting baseline, not the final assessment. |
| 4 | Clearly distinguishes evidence objects, mappings, evidence instances, and runtime interpretations. |
| 5 | Correctly represents the 96 configured SWOT factor references and 16 active runtime factors. |
| 6 | Correctly defines the universal → revenue-motion → industry inheritance model and precedence. |
| 7 | Preserves all eight PADF dimensions and the existing PADIF relationship. |
| 8 | Correctly represents the Evidence Knowledge Base v1.1 counts: 48 evidence objects and 373 mappings. |
| 9 | Correctly represents the DIRECT, SUPPORTING, and INDIRECT mapping counts. |
| 10 | Preserves the 82 mapped and 14 currently unmapped factor references. |
| 11 | Separates mapping strength, evidence quality, confidence, runtime relationship, polarity, factor assessment, and TOWS relevance. |
| 12 | Preserves the defined runtime relationship and polarity enums. |
| 13 | Prevents unapproved conversion between the 0–100 and 1–5 confidence representations. |
| 14 | Provides explicit reasoning for evidence gaps, stale information, and contradictions. |
| 15 | Establishes evidence-grounded SWOT assessment without inventing factor states, scores, or thresholds. |
| 16 | Defines SO, WO, ST, and WT TOWS reasoning and preserves the existing Winning Strategy engine. |
| 17 | Keeps the unresolved strategy and risk crosswalks explicitly unresolved. |
| 18 | Preserves the existing winability and Risk Intelligence methodologies and the Phase 6/7/8 business dependencies. |
| 19 | Clearly separates deterministic responsibilities from Gemini reasoning responsibilities. |
| 20 | Establishes traceability, explainability, governance, and longitudinal assessment requirements. |
| 21 | Represents Rules v1.1 as a draft pending Stage 6 validation. |
| 22 | Provides a consistent methodology foundation for the remaining five v1.1 Markdown assets without taking over their specific responsibilities. |

---

# 17. Final Reasoning Principle

The RevOS Pipeline Assessment intelligence architecture is governed by the following principle:

> **Evidence establishes what can be known. Context determines how it should be interpreted. Deterministic rules govern assessment and decisions. AI reasoning explains relationships and strategic implications. The existing engines govern risk, winability, and winning strategy.**

This principle defines the boundaries and responsibilities of the entire Pipeline Assessment reasoning system.

The ultimate objective is to help revenue teams understand:

- Where an opportunity stands.
- Why it is in its current condition.
- What evidence supports or contradicts the assessment.
- What has changed.
- What remains uncertain.
- Which risks and weaknesses require attention.
- Which evidence-based strategic actions can improve the probability and quality of winning.

**End of Document — Pipeline Reasoning Strategy Specification v1.1**